import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { render } from "@react-email/components";
import * as React from "react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { OrderReceiptEmail } from "@/lib/email-templates/order-receipt";

const SITE_NAME = "Christ Kingdom Platform";
const ROOT_DOMAIN = "chkplt.com";
const SENDER_DOMAIN = "notify.chkplt.com";
const FROM_DOMAIN = "chkplt.com";

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

  // Idempotency: skip if already sent or pending
  const { data: existing } = await supabaseAdmin
    .from("email_send_log")
    .select("id,status")
    .eq("message_id", messageId)
    .in("status", ["sent", "pending"])
    .maybeSingle();
  if (existing) return;

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

  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: "order_receipt",
    recipient_email: order.email,
    status: "pending",
  });

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
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "order_receipt",
      recipient_email: order.email,
      status: "failed",
      error_message: error.message.slice(0, 1000),
    });
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
    .select("id,email,status,customer_name,customer_phone,metadata")
    .eq("provider_reference", reference)
    .maybeSingle();
  if (!order) {
    console.warn("[paystack-webhook] No order for reference", reference);
    return;
  }

  // Idempotency: if already paid, just log the payment row.
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

  if (order.status === "paid") return;

  await supabaseAdmin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id);

  // Upsert subscriber by email
  const email = (order.email || "").toLowerCase();
  const nameParts = (order.customer_name ?? "").trim().split(/\s+/);
  const first_name = nameParts[0] || null;
  const last_name = nameParts.slice(1).join(" ") || null;

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

  // Send order receipt email (idempotent)
  try {
    await sendOrderReceipt(order.id);
  } catch (err) {
    console.error("[paystack-webhook] sendOrderReceipt failed", err);
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
          if (payload?.event === "charge.success") {
            await handleChargeSuccess(payload);
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
