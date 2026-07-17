import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fulfillPaidOrder, type FulfillableOrder } from "@/lib/order-fulfillment";

async function handleChargeSuccess(payload: any) {
  const dataObj = payload?.data ?? {};
  const reference: string | undefined = dataObj.reference;
  if (!reference) return;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id,email,status,customer_name,customer_phone,metadata,total_cents,currency,provider_reference")
    .eq("provider_reference", reference)
    .maybeSingle();
  if (!order) {
    console.warn("[paystack-webhook] No order for reference", reference);
    return;
  }

  // Always log the payment event for auditability (insert is append-only).
  await supabaseAdmin.from("payments").insert({
    order_id: order.id,
    provider: "paystack",
    provider_reference: reference,
    event_type: "charge.success",
    status: "success",
    amount_cents: dataObj.amount ?? null,
    currency: dataObj.currency ?? null,
    gateway_response: dataObj.gateway_response ?? null,
    raw_payload: payload,
    paid_at: dataObj.paid_at ? new Date(dataObj.paid_at).toISOString() : new Date().toISOString(),
  });

  // Atomic state transition — only ONE concurrent webhook can flip the row.
  // The .neq filter prevents a second retry from "re-paying" the order, which
  // is the database-level guard against duplicate billing side-effects
  // (grants, receipts, tags) when Paystack retries the webhook.
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();
  if (claimErr) {
    console.error("[paystack-webhook] order claim failed", claimErr);
    return;
  }
  if (!claimed) {
    // Another concurrent webhook already finalized this order.
    return;
  }

  // Capture the reusable card authorization → powers the 1-click post-purchase
  // upsell. Paystack-specific. NON-FATAL: never let this break fulfillment.
  const email = (order.email || "").toLowerCase();
  const auth = dataObj.authorization;
  if (email && auth?.authorization_code) {
    try {
      await supabaseAdmin.from("payment_authorizations" as any).upsert(
        {
          email,
          authorization_code: auth.authorization_code,
          last4: auth.last4 ?? null,
          card_type: auth.card_type ?? null,
          bank: auth.bank ?? null,
          reusable: auth.reusable === true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );
    } catch (err) {
      console.error("[paystack-webhook] auth capture skipped", err);
    }
  }

  const paidAtIso = dataObj.paid_at
    ? new Date(dataObj.paid_at).toISOString()
    : new Date().toISOString();
  await fulfillPaidOrder(order as FulfillableOrder, { paidAtIso });
}

// ── Subscription (Paystack Plans) handlers ────────────────────────────────
// Runs on EVERY charge.success that carries a plan (initial + recurring) and
// keeps the access window fresh. Access is gated on subscriptions.current_period_end.
async function handleSubscriptionCharge(payload: any) {
  const d = payload?.data ?? {};
  const email = (d.customer?.email || "").toLowerCase();
  const planCode = d.plan?.plan_code;
  if (!email || !planCode) return;
  const paidAt = d.paid_at ? new Date(d.paid_at) : new Date();
  const periodEnd = new Date(paidAt);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  periodEnd.setDate(periodEnd.getDate() + 3); // grace for retries

  let userId: string | null = null;
  const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (prof) userId = prof.id;

  await supabaseAdmin.from("subscriptions" as any).upsert(
    {
      email,
      user_id: userId,
      plan_code: planCode,
      status: "active",
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email,plan_code" },
  );
}

async function handleSubscriptionCreate(payload: any) {
  const d = payload?.data ?? {};
  const email = (d.customer?.email || "").toLowerCase();
  const planCode = d.plan?.plan_code;
  if (!email || !planCode) return;
  await supabaseAdmin.from("subscriptions" as any).upsert(
    {
      email,
      plan_code: planCode,
      subscription_code: d.subscription_code ?? null,
      customer_code: d.customer?.customer_code ?? null,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email,plan_code" },
  );
}

async function handleSubscriptionCancel(payload: any) {
  const d = payload?.data ?? {};
  const patch = { status: "cancelled", updated_at: new Date().toISOString() };
  if (d.subscription_code) {
    await supabaseAdmin.from("subscriptions" as any).update(patch).eq("subscription_code", d.subscription_code);
  } else if (d.customer?.email && d.plan?.plan_code) {
    await supabaseAdmin
      .from("subscriptions" as any)
      .update(patch)
      .eq("email", (d.customer.email || "").toLowerCase())
      .eq("plan_code", d.plan.plan_code);
  }
}

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) {
          return new Response("Paystack not configured", { status: 503 });
        }

        const signature = request.headers.get("x-paystack-signature");
        const body = await request.text();
        if (!signature) return new Response("Missing signature", { status: 401 });

        const expected = createHmac("sha512", secret).update(body).digest("hex");
        try {
          const a = Buffer.from(signature, "utf8");
          const b = Buffer.from(expected, "utf8");
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("Invalid signature", { status: 401 });
          }
        } catch {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        try {
          const event = payload?.event;
          if (event === "charge.success") {
            // A plan on the charge = subscription (initial or recurring) → refresh access.
            if (payload?.data?.plan && payload.data.plan.plan_code) {
              await handleSubscriptionCharge(payload);
            }
            // Grants/receipt for the order (initial charge has one; recurring no-ops).
            await handleChargeSuccess(payload);
          } else if (event === "subscription.create") {
            await handleSubscriptionCreate(payload);
          } else if (event === "subscription.disable" || event === "subscription.not_renew") {
            await handleSubscriptionCancel(payload);
          } else {
            // Log all events for visibility
            await supabaseAdmin.from("payments").insert({
              provider: "paystack",
              provider_reference: payload?.data?.reference ?? "unknown",
              event_type: payload?.event ?? "unknown",
              status: "initialized",
              raw_payload: payload,
            });
          }
        } catch (err: any) {
          console.error("[paystack-webhook] handler error", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("Paystack webhook endpoint. POST only.", { status: 200 }),
    },
  },
});
