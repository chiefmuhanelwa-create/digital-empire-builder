import { render } from "@react-email/components";
import { createHash, randomUUID } from "crypto";
import * as React from "react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { OrderReceiptEmail } from "@/lib/email-templates/order-receipt";
import { reportError } from "@/lib/error-logger";
import { addToMailerLiteGroup } from "@/lib/mailerlite";

// Shared post-payment fulfillment for BOTH payment rails (Paystack + Stripe).
// A provider webhook is responsible for verifying the signature, logging the
// payment event, and doing the ATOMIC order claim (status -> 'paid'). Once an
// order is claimed exactly once, it calls fulfillPaidOrder() to do the rest:
// grants, account provisioning, audit ledger, receipt email, list sync.

const SITE_NAME = "CHKPLT";
const ROOT_DOMAIN = "chkplt.com";
// Product slugs whose purchase unlocks the Foundation Kit workspace.
const KIT_SLUGS = ["called-expert-foundation-kit", "called-expert-starter-bundle"];
const SENDER_DOMAIN = "notify.chkplt.com";
// Must be Resend-verified. notify.chkplt.com is verified; bare chkplt.com is NOT,
// so receipts bounced with "domain is not verified".
const FROM_DOMAIN = "notify.chkplt.com";

// Statutory split — keep in sync with audit_ledgers semantics.
const VAT_RATE = 0.15;
const TAX_RESERVE_RATE = 0.25;

// Garden slug → tag slug (matches the seed tags created in Phase 2b)
const GARDEN_TAG: Record<string, string> = {
  deshe: "garden_deshe",
  esev: "garden_esev",
  etz_pri: "garden_etz_pri",
  devarim: "garden_devarim",
};

export interface FulfillableOrder {
  id: string;
  email: string;
  customer_name: string | null;
  customer_phone: string | null;
  metadata: unknown;
  total_cents: number;
  currency: string;
  provider_reference: string | null;
}

function formatMoney(cents: number, currency = "ZAR") {
  const symbol = currency === "ZAR" ? "R" : currency + " ";
  return `${symbol} ${(cents / 100).toFixed(2)}`;
}

async function writeAuditLedger(order: FulfillableOrder, paidAtIso: string) {
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
      endpoint: "order-fulfillment:audit_ledgers",
      orderId: order.id,
      severity: "critical",
    });
  }
}

// Ensure the buyer has a real login account, then link any email-only grants to
// it. Returns the user_id (or null if provisioning failed — receipt still sends).
async function ensureBuyerUserId(
  email: string,
  fullName: string | null,
  subscriberId: string | null,
): Promise<string | null> {
  let userId: string | null = null;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (profile) userId = profile.id;

  if (!userId) {
    try {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName } : {},
      });
      if (created?.user?.id) {
        userId = created.user.id;
      } else if (error) {
        // Already registered (race / prior signup) — re-resolve from profiles.
        const { data: p2 } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        userId = p2?.id ?? null;
        if (!userId) await reportError(error, { endpoint: "order-fulfillment:createUser", meta: { email } });
      }
    } catch (err) {
      await reportError(err, { endpoint: "order-fulfillment:createUser", meta: { email } });
    }
  }

  // Back-link any grants currently keyed to the email (subscriber) but missing a user_id.
  if (userId && subscriberId) {
    await supabaseAdmin
      .from("product_grants")
      .update({ user_id: userId })
      .eq("subscriber_id", subscriberId)
      .is("user_id", null);
  }
  return userId;
}

async function sendOrderReceipt(
  orderId: string,
  opts?: { actionUrl?: string | null; dashboardPath?: string; hasKit?: boolean },
) {
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
    if ((claimErr as { code?: string }).code === "23505") return;
    console.error("[order-fulfillment] failed to claim receipt log", claimErr);
    return;
  }

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_title,quantity,line_total_cents")
    .eq("order_id", order.id);

  const dashboardUrl = `https://${ROOT_DOMAIN}${opts?.dashboardPath ?? "/dashboard"}`;
  const emailProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    dashboardUrl,
    actionUrl: opts?.actionUrl ?? null,
    loginUrl: `https://${ROOT_DOMAIN}/login`,
    hasKit: opts?.hasKit ?? false,
    customerName: order.customer_name,
    customerEmail: order.email,
    orderReference: order.provider_reference ?? order.id,
    items: (items ?? []).map((i) => ({
      title: i.product_title,
      quantity: i.quantity,
      line_total: formatMoney(i.line_total_cents, order.currency),
    })),
    total: formatMoney(order.total_cents, order.currency),
  };
  const html = await render(React.createElement(OrderReceiptEmail, emailProps));
  const text = await render(React.createElement(OrderReceiptEmail, emailProps), { plainText: true });

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
    console.error("[order-fulfillment] failed to enqueue receipt", error);
    await supabaseAdmin
      .from("email_send_log")
      .update({ status: "failed", error_message: error.message.slice(0, 1000) })
      .eq("message_id", messageId);
  }
}

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

// Everything after the atomic order-claim: subscriber, tags, grants, account,
// audit ledger, receipt, list sync. Provider-agnostic and idempotent (grants
// upsert; receipt is claimed via a unique message_id). Call this ONCE per order,
// from the webhook that successfully flipped the order to 'paid'.
export async function fulfillPaidOrder(
  order: FulfillableOrder,
  opts: { paidAtIso: string },
): Promise<void> {
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
  if (subErr) console.error("[order-fulfillment] subscriber upsert", subErr);

  const subscriberId = subUp?.id ?? null;

  // Tag: buyer + garden
  const tagSlugs = ["buyer"];
  const garden =
    order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
      ? ((order.metadata as Record<string, unknown>).garden as string | undefined)
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
    .select("product_id, products:product_id(slug)")
    .eq("order_id", order.id);

  // Provision a login account for the buyer so access is real (not email-only).
  const userId = await ensureBuyerUserId(email, order.customer_name, subscriberId);

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

  // Does this order unlock the Foundation Kit? Route onboarding straight there.
  const hasKit = (items ?? []).some(
    (i: { products: { slug: string } | null }) => i.products && KIT_SLUGS.includes(i.products.slug),
  );
  const dashboardPath = hasKit ? "/dashboard/foundation-kit" : "/dashboard";

  // One-click sign-in link → drops the buyer straight into their workspace, signed in.
  let actionUrl: string | null = null;
  try {
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `https://${ROOT_DOMAIN}${dashboardPath}` },
    });
    actionUrl = (linkData as { properties?: { action_link?: string } } | null)?.properties?.action_link ?? null;
  } catch (err) {
    await reportError(err, { endpoint: "order-fulfillment:generateLink", meta: { email } });
  }

  // Immutable audit ledger BEFORE the receipt — failure is a critical incident
  // but never blocks the receipt.
  await writeAuditLedger(order, opts.paidAtIso);

  // Send order receipt email (idempotent)
  try {
    await sendOrderReceipt(order.id, { actionUrl, dashboardPath, hasKit });
  } catch (err) {
    await reportError(err, { endpoint: "order-fulfillment:sendOrderReceipt", orderId: order.id });
  }

  // Sync buyer to MailerLite (fire-and-forget — never blocks receipt)
  void addToMailerLiteGroup(email, process.env.MAILERLITE_GROUP_ID_BUYERS, { first_name, last_name });
}
