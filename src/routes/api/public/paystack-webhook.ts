import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual, randomUUID, createHash } from "crypto";
import { render } from "@react-email/components";
import * as React from "react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { OrderReceiptEmail } from "@/lib/email-templates/order-receipt";
import { reportError } from "@/lib/error-logger";
import { addToMailerLiteGroup } from "@/lib/mailerlite";

const SITE_NAME = "Christ Kingdom Platform";
const ROOT_DOMAIN = "chkplt.com";
const SENDER_DOMAIN = "notify.chkplt.com";
// Must be Resend-verified. notify.chkplt.com is verified; bare chkplt.com is NOT,
// so receipts bounced with "domain is not verified".
const FROM_DOMAIN = "notify.chkplt.com";

// Statutory split — keep in sync with audit_ledgers semantics.
const VAT_RATE = 0.15;
const TAX_RESERVE_RATE = 0.25;

async function writeAuditLedger(
  order: { id: string; email: string; total_cents: number; currency: string; provider_reference: string | null },
  paidAtIso: string,
) {
  const vat = Math.round(order.total_cents * VAT_RATE);
  const tax = Math.round(order.total_cents * TAX_RESERVE_RATE);
  const net = order.total_cents - vat - tax;
  const emailHash = createHash("sha256").update(order.email.toLowerCase()).digest("hex");

  const { error } = await supabaseAdmin.from("audit_ledgers").insert({
    order_id: order.id,
    provider_reference: order.provider_reference,
    gross_cents: order.total_cents,
    vat_allocation_cents: vat,
    tax_reserve_cents: tax,
    net_cents: net,
    currency: order.currency,
    customer_email_hash: emailHash,
    paid_at: paidAtIso,
  });
  if (error && (error as { code?: string }).code !== "23505") {
    await reportError(error, {
      endpoint: "paystack-webhook:audit_ledgers",
      orderId: order.id,
      severity: "critical",
    });
  }
}


function formatZar(cents: number, currency = "ZAR") {
  const symbol = currency === "ZAR" ? "R" : currency + " ";
  return `${symbol} ${(cents / 100).toFixed(2)}`;
}

async function sendOrderReceipt(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id,email,customer_name,total_cents,currency,provider_reference")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const messageId = `order:${order.id}:receipt`;

  // Race-safe claim: INSERT relies on the UNIQUE index on email_send_log(message_id).
  // The first concurrent webhook wins; any duplicate retry hits 23505 and returns early
  // without enqueuing a second receipt.
  const { error: claimErr } = await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: "order_receipt",
    recipient_email: order.email,
    status: "pending",
  });
  if (claimErr) {
    // 23505 = unique_violation → another worker already claimed this receipt
    if ((claimErr as any).code === "23505") return;
    console.error("[paystack-webhook] failed to claim receipt log", claimErr);
    return;
  }

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_title,quantity,line_total_cents")
    .eq("order_id", order.id);

  const html = await render(
    React.createElement(OrderReceiptEmail, {
      siteName: SITE_NAME,
      siteUrl: `https://${ROOT_DOMAIN}`,
      dashboardUrl: `https://${ROOT_DOMAIN}/dashboard`,
      customerName: order.customer_name,
      orderReference: order.provider_reference ?? order.id,
      items: (items ?? []).map((i) => ({
        title: i.product_title,
        quantity: i.quantity,
        line_total: formatZar(i.line_total_cents, order.currency),
      })),
      total: formatZar(order.total_cents, order.currency),
    }),
  );
  const text = await render(
    React.createElement(OrderReceiptEmail, {
      siteName: SITE_NAME,
      siteUrl: `https://${ROOT_DOMAIN}`,
      dashboardUrl: `https://${ROOT_DOMAIN}/dashboard`,
      customerName: order.customer_name,
      orderReference: order.provider_reference ?? order.id,
      items: (items ?? []).map((i) => ({
        title: i.product_title,
        quantity: i.quantity,
        line_total: formatZar(i.line_total_cents, order.currency),
      })),
      total: formatZar(order.total_cents, order.currency),
    }),
    { plainText: true },
  );

  const { error } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      run_id: randomUUID(),
      message_id: messageId,
      to: order.email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: `Your ${SITE_NAME} order is confirmed`,
      html,
      text,
      purpose: "transactional",
      label: "order_receipt",
      queued_at: new Date().toISOString(),
    },
  });
  if (error) {
    console.error("[paystack-webhook] failed to enqueue receipt", error);
    await supabaseAdmin
      .from("email_send_log")
      .update({ status: "failed", error_message: error.message.slice(0, 1000) })
      .eq("message_id", messageId);
  }
}

// Garden slug → tag slug (matches the seed tags created in Phase 2b)
const GARDEN_TAG: Record<string, string> = {
  deshe: "garden_deshe",
  esev: "garden_esev",
  etz_pri: "garden_etz_pri",
  devarim: "garden_devarim",
};

async function ensureTagId(slug: string, name: string): Promise<string | null> {
  const { data: existing } = await supabaseAdmin
    .from("tags")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabaseAdmin
    .from("tags")
    .insert({ slug, name })
    .select("id")
    .single();
  if (error) return null;
  return created.id;
}

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

  // Upsert subscriber by email
  const email = (order.email || "").toLowerCase();
  const nameParts = (order.customer_name ?? "").trim().split(/\s+/);
  const first_name = nameParts[0] || null;
  const last_name = nameParts.slice(1).join(" ") || null;

  // Capture the reusable card authorization → powers the 1-click post-purchase upsell.
  // NON-FATAL: never let this break grants/receipts (e.g. if the table isn't migrated yet).
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

  const { data: subUp, error: subErr } = await supabaseAdmin
    .from("subscribers")
    .upsert(
      {
        email,
        first_name,
        last_name,
        phone: order.customer_phone ?? null,
        source: "checkout",
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();
  if (subErr) console.error("[paystack-webhook] subscriber upsert", subErr);

  const subscriberId = subUp?.id ?? null;

  // Tag: buyer + garden
  const tagSlugs = ["buyer"];
  const garden = (order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata))
    ? (order.metadata as Record<string, unknown>).garden as string | undefined
    : undefined;
  if (garden && GARDEN_TAG[garden]) tagSlugs.push(GARDEN_TAG[garden]);

  if (subscriberId) {
    for (const slug of tagSlugs) {
      const tagId = await ensureTagId(slug, slug);
      if (!tagId) continue;
      await supabaseAdmin
        .from("subscriber_tags")
        .upsert(
          { subscriber_id: subscriberId, tag_id: tagId },
          { onConflict: "subscriber_id,tag_id", ignoreDuplicates: true },
        );
    }
  }

  // Grant access to each product in the order
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_id")
    .eq("order_id", order.id);

  // Resolve user_id by email (if buyer has an account)
  let userId: string | null = null;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (profile) userId = profile.id;

  for (const item of items ?? []) {
    await supabaseAdmin
      .from("product_grants")
      .upsert(
        {
          product_id: item.product_id,
          subscriber_id: subscriberId,
          user_id: userId,
          order_id: order.id,
        },
        { onConflict: "product_id,subscriber_id", ignoreDuplicates: true },
      );
  }

  // Write the immutable audit ledger row BEFORE the receipt — if the ledger
  // fails it's logged as a critical incident but never blocks the receipt.
  const paidAtIso = dataObj.paid_at
    ? new Date(dataObj.paid_at).toISOString()
    : new Date().toISOString();
  await writeAuditLedger(
    {
      id: order.id,
      email: order.email,
      total_cents: order.total_cents,
      currency: order.currency,
      provider_reference: order.provider_reference,
    },
    paidAtIso,
  );

  // Send order receipt email (idempotent)
  try {
    await sendOrderReceipt(order.id);
  } catch (err) {
    await reportError(err, {
      endpoint: "paystack-webhook:sendOrderReceipt",
      orderId: order.id,
    });
  }

  // Sync buyer to MailerLite (fire-and-forget — never blocks receipt)
  void addToMailerLiteGroup(
    email,
    process.env.MAILERLITE_GROUP_ID_BUYERS,
    { first_name, last_name },
  );
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
