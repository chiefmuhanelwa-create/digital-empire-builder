import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fulfillPaidOrder, type FulfillableOrder } from "@/lib/order-fulfillment";

// Cloudflare Workers: the SDK must use the fetch HTTP client, and signature
// verification must use the ASYNC verifier backed by Web Crypto (SubtleCrypto).
// The sync constructEvent() relies on Node crypto and throws on Workers.
function stripeClient(secret: string): Stripe {
  return new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  const orderId = (session.metadata?.order_id as string | undefined) ?? null;

  // Resolve the order by the id we stamped at init; fall back to the session id
  // we persisted as provider_reference.
  const query = supabaseAdmin
    .from("orders")
    .select("id,email,status,customer_name,customer_phone,metadata,total_cents,currency,provider_reference");
  const { data: order } = orderId
    ? await query.eq("id", orderId).maybeSingle()
    : await query.eq("provider_reference", session.id).maybeSingle();

  if (!order) {
    console.warn("[stripe-webhook] No order for session", session.id, orderId);
    return;
  }

  // Append-only payment log.
  await supabaseAdmin.from("payments").insert({
    order_id: order.id,
    provider: "stripe",
    provider_reference: (session.payment_intent as string) ?? session.id,
    event_type: "checkout.session.completed",
    status: "success",
    amount_cents: session.amount_total ?? null,
    currency: session.currency ? session.currency.toUpperCase() : null,
    gateway_response: session.payment_status ?? null,
    raw_payload: session as any,
    paid_at: new Date().toISOString(),
  });

  // Atomic claim — the DB guard against duplicate fulfillment on Stripe retries.
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();
  if (claimErr) {
    console.error("[stripe-webhook] order claim failed", claimErr);
    return;
  }
  if (!claimed) return; // already finalized by a concurrent delivery

  await fulfillPaidOrder(order as FulfillableOrder, { paidAtIso: new Date().toISOString() });
}

async function handleRefund(session: Stripe.Charge) {
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : null;
  if (!pi) return;
  await supabaseAdmin.from("payments").insert({
    provider: "stripe",
    provider_reference: pi,
    event_type: "charge.refunded",
    status: "reversed",
    amount_cents: session.amount_refunded ?? null,
    currency: session.currency ? session.currency.toUpperCase() : null,
    raw_payload: session as any,
  });
  // Reflect on the order if we can match it by the payment_intent we stored.
  await supabaseAdmin.from("orders").update({ status: "refunded" }).eq("provider_reference", pi);
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret || !webhookSecret) {
          return new Response("Stripe not configured", { status: 503 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 401 });

        const body = await request.text();
        const stripe = stripeClient(secret);

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            Stripe.createSubtleCryptoProvider(),
          );
        } catch (err) {
          console.error("[stripe-webhook] signature verification failed", err);
          return new Response("Invalid signature", { status: 401 });
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              // Only fulfill fully-paid sessions.
              if (session.payment_status === "paid") {
                await handleCheckoutCompleted(stripe, session);
              }
              break;
            }
            case "charge.refunded": {
              await handleRefund(event.data.object as Stripe.Charge);
              break;
            }
            default: {
              // Log unhandled events for visibility.
              await supabaseAdmin.from("payments").insert({
                provider: "stripe",
                provider_reference: (event.id as string) ?? "unknown",
                event_type: event.type,
                status: "initialized",
                raw_payload: event as any,
              });
            }
          }
        } catch (err) {
          console.error("[stripe-webhook] handler error", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("Stripe webhook endpoint. POST only.", { status: 200 }),
    },
  },
});
