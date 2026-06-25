import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHost, getRequestIP } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertTurnstile } from "./turnstile.server";
import { reportError } from "./error-logger";

// Paystack expects the smallest currency unit (kobo for NGN, cents for ZAR).
// Our price_cents is already in cents, so we pass it as-is.

export const initializeCheckout = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        productSlug: z.string().min(1).max(120),
        email: z.string().email().max(255),
        fullName: z.string().min(1).max(120).optional(),
        phone: z.string().max(40).optional(),
        turnstileToken: z.string().max(2048).optional(),
        utmSource: z.string().max(120).optional(),
        utmMedium: z.string().max(120).optional(),
        utmCampaign: z.string().max(120).optional(),
        bumpSlugs: z.array(z.string().min(1).max(120)).max(3).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      await assertTurnstile(data.turnstileToken, getRequestIP({ xForwardedFor: true }) ?? undefined);
    } catch (err) {
      await reportError(err, { endpoint: "initializeCheckout:turnstile", meta: { email: data.email } });
      throw err;
    }
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Paystack is not configured yet.");

    // 1. Load the product
    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,slug,title,price_cents,currency,status,garden,is_free,requires_application")
      .eq("slug", data.productSlug)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product) throw new Error("Product not found");
    if (product.status !== "published") throw new Error("Product not available");
    if (product.is_free || product.price_cents <= 0) {
      throw new Error("Free products do not require checkout");
    }

    // Application-gated products (Premium Programs, etz_pri) require a QUALIFIED
    // stewardship application for this email. The product page enforces this in
    // the UI, but re-verify server-side so a hand-crafted request can't bypass
    // the gate and pay into an empty/covenant-breach program.
    if (product.requires_application) {
      const { data: appRow, error: aErr } = await supabaseAdmin
        .from("client_stewardship_applications")
        .select("determined_routing_status")
        .ilike("email", data.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (aErr) throw new Error(aErr.message);
      if (appRow?.determined_routing_status !== "QUALIFIED_FOR_CORE_PROGRAM") {
        throw new Error(
          "This program requires a qualified application. Complete the diagnostic at /apply first.",
        );
      }
    }

    // 1b. Load any order-bump products (same currency, published, paid)
    const bumpSlugs = (data.bumpSlugs ?? []).filter((s) => s && s !== data.productSlug);
    let bumps: { id: string; slug: string; title: string; price_cents: number }[] = [];
    if (bumpSlugs.length) {
      const { data: bumpRows } = await supabaseAdmin
        .from("products")
        .select("id,slug,title,price_cents,currency,status,is_free")
        .in("slug", bumpSlugs);
      bumps = (bumpRows ?? [])
        .filter((b) => b.status === "published" && !b.is_free && b.price_cents > 0 && b.currency === product.currency)
        .map((b) => ({ id: b.id, slug: b.slug, title: b.title, price_cents: b.price_cents }));
    }
    const bumpTotal = bumps.reduce((sum, b) => sum + b.price_cents, 0);
    const orderTotal = product.price_cents + bumpTotal;

    // 2. Create a pending order (main + bumps)
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        email: data.email.toLowerCase(),
        customer_name: data.fullName ?? null,
        customer_phone: data.phone ?? null,
        currency: product.currency,
        subtotal_cents: orderTotal,
        total_cents: orderTotal,
        provider: "paystack",
        status: "pending",
        metadata: {
          product_slug: product.slug,
          garden: product.garden,
          bump_slugs: bumps.map((b) => b.slug),
          utm: {
            source: data.utmSource ?? null,
            medium: data.utmMedium ?? null,
            campaign: data.utmCampaign ?? null,
          },
        },
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabaseAdmin.from("order_items").insert([
      {
        order_id: order.id,
        product_id: product.id,
        product_title: product.title,
        unit_price_cents: product.price_cents,
        quantity: 1,
        line_total_cents: product.price_cents,
      },
      ...bumps.map((b) => ({
        order_id: order.id,
        product_id: b.id,
        product_title: b.title,
        unit_price_cents: b.price_cents,
        quantity: 1,
        line_total_cents: b.price_cents,
      })),
    ]);
    if (iErr) throw new Error(iErr.message);

    // Pre-payment lead capture — save to subscribers before Paystack redirect
    // so abandoned checkouts are still captured for follow-up nurture.
    const nameParts = (data.fullName ?? "").trim().split(/\s+/);
    void supabaseAdmin.from("subscribers").upsert(
      {
        email: data.email.toLowerCase(),
        first_name: nameParts[0] || null,
        last_name: nameParts.slice(1).join(" ") || null,
        phone: data.phone ?? null,
        source: data.utmSource ? `utm:${data.utmSource}` : "checkout_intent",
      },
      { onConflict: "email" },
    );

    // 3. Initialize Paystack transaction
    const host = getRequestHost();
    const protocol = host.includes("localhost") ? "http" : "https";
    const callbackUrl = `${protocol}://${host}/checkout/success`;

    const ref = `chkplt_${order.id.replace(/-/g, "")}`;
    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        amount: orderTotal, // main + bumps, ZAR cents == Paystack smallest unit
        currency: product.currency,
        reference: ref,
        callback_url: callbackUrl,
        metadata: {
          order_id: order.id,
          product_id: product.id,
          product_slug: product.slug,
          garden: product.garden,
          full_name: data.fullName ?? null,
          phone: data.phone ?? null,
        },
      }),
    });

    const initJson: any = await initRes.json();
    if (!initRes.ok || !initJson.status) {
      // Mark order failed
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed", metadata: { error: initJson } })
        .eq("id", order.id);
      throw new Error(initJson.message || "Paystack initialization failed");
    }

    // Persist the reference
    await supabaseAdmin
      .from("orders")
      .update({ provider_reference: ref })
      .eq("id", order.id);

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      provider: "paystack",
      provider_reference: ref,
      event_type: "initialize",
      status: "initialized",
      amount_cents: product.price_cents,
      currency: product.currency,
      raw_payload: initJson,
    });

    return {
      authorizationUrl: initJson.data.authorization_url as string,
      reference: ref,
    };
  });

export const verifyCheckout = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ reference: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,status,email,total_cents,currency,provider_reference,metadata")
      .eq("provider_reference", data.reference)
      .maybeSingle();
    if (!order) return { status: "unknown" as const, nextSeed: null };

    let nextSeed: {
      slug: string;
      title: string;
      tagline: string | null;
      price_cents: number;
      currency: string;
    } | null = null;

    const meta = (order.metadata as { product_slug?: string; bump_slugs?: string[] } | null) ?? {};
    const purchasedSlug = meta.product_slug;
    const bumpSlugs = Array.isArray(meta.bump_slugs) ? meta.bump_slugs : [];
    if (purchasedSlug) {
      const { data: purchased } = await supabaseAdmin
        .from("products")
        .select("seed_to_product_id")
        .eq("slug", purchasedSlug)
        .maybeSingle();
      if (purchased?.seed_to_product_id) {
        const { data: seed } = await supabaseAdmin
          .from("products")
          .select("slug,title,tagline,price_cents,currency,status")
          .eq("id", purchased.seed_to_product_id)
          .maybeSingle();
        if (seed && seed.status === "published") {
          nextSeed = {
            slug: seed.slug,
            title: seed.title,
            tagline: seed.tagline,
            price_cents: seed.price_cents,
            currency: seed.currency,
          };
        }
      }
    }

    return {
      status: order.status,
      email: order.email,
      total_cents: order.total_cents,
      currency: order.currency,
      purchasedSlug: purchasedSlug ?? null,
      bumpSlugs,
      nextSeed,
    };
  });

// ── 1-click upsell: charge the card-on-file (Paystack charge_authorization) ──
// Thin by design: creates the order + charges the saved card; the existing
// charge.success webhook does the grant + receipt (idempotent), and the success
// page polls verifyCheckout(reference) for the download — same as the main flow.
export const chargeUpsell = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().email().max(255), productSlug: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Paystack is not configured.");
    const email = data.email.toLowerCase();

    // Need a REUSABLE card on file for this buyer.
    const { data: authRow } = await supabaseAdmin
      .from("payment_authorizations" as any)
      .select("authorization_code, reusable")
      .eq("email", email)
      .maybeSingle();
    const auth = authRow as { authorization_code?: string; reusable?: boolean } | null;
    if (!auth?.authorization_code || auth.reusable !== true) {
      return { ok: false as const, reason: "no_authorization" as const };
    }

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id,slug,title,price_cents,currency,status,garden,is_free")
      .eq("slug", data.productSlug)
      .maybeSingle();
    if (!product || product.status !== "published" || product.is_free || product.price_cents <= 0) {
      throw new Error("Upsell not available");
    }

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        email,
        currency: product.currency,
        subtotal_cents: product.price_cents,
        total_cents: product.price_cents,
        provider: "paystack",
        status: "pending",
        metadata: { product_slug: product.slug, garden: product.garden, upsell: true },
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);

    await supabaseAdmin.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_title: product.title,
      unit_price_cents: product.price_cents,
      quantity: 1,
      line_total_cents: product.price_cents,
    });

    const ref = `chkpltups_${order.id.replace(/-/g, "")}`;
    await supabaseAdmin.from("orders").update({ provider_reference: ref }).eq("id", order.id);

    const res = await fetch("https://api.paystack.co/transaction/charge_authorization", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        authorization_code: auth.authorization_code,
        email,
        amount: product.price_cents,
        currency: product.currency,
        reference: ref,
      }),
    });
    const json: any = await res.json();
    const ok = res.ok && json.status && json.data?.status === "success";
    if (!ok) {
      await supabaseAdmin.from("orders").update({ status: "failed", metadata: { error: json } }).eq("id", order.id);
      return { ok: false as const, reason: "charge_failed" as const, message: json.data?.gateway_response || json.message };
    }
    // charge.success webhook (fired by Paystack) grants + sends receipt for this ref.
    return { ok: true as const, reference: ref };
  });

// ── Recurring subscriptions (Paystack Plans) ──────────────────────────────
// slug -> Paystack plan_code. The page routes these slugs to initializeSubscription.
export const SUBSCRIPTION_PLANS: Record<string, string> = {
  "called-expert-inner-circle": "PLN_4oafnq18t7e36gl",
};

export const initializeSubscription = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        productSlug: z.string().min(1).max(120),
        email: z.string().email().max(255),
        fullName: z.string().min(1).max(120).optional(),
        turnstileToken: z.string().max(2048).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      await assertTurnstile(data.turnstileToken, getRequestIP({ xForwardedFor: true }) ?? undefined);
    } catch (err) {
      await reportError(err, { endpoint: "initializeSubscription:turnstile", meta: { email: data.email } });
      throw err;
    }
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Paystack is not configured yet.");
    const plan = SUBSCRIPTION_PLANS[data.productSlug];
    if (!plan) throw new Error("Not a subscription product.");

    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,slug,title,price_cents,currency,status,garden")
      .eq("slug", data.productSlug)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product || product.status !== "published") throw new Error("Subscription not available");

    // Pending order so the FIRST charge grants the product via the existing webhook path.
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        email: data.email.toLowerCase(),
        customer_name: data.fullName ?? null,
        currency: product.currency,
        subtotal_cents: product.price_cents,
        total_cents: product.price_cents,
        provider: "paystack",
        status: "pending",
        metadata: { product_slug: product.slug, garden: product.garden, subscription: true },
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);

    await supabaseAdmin.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_title: product.title,
      unit_price_cents: product.price_cents,
      quantity: 1,
      line_total_cents: product.price_cents,
    });

    const host = getRequestHost();
    const protocol = host.includes("localhost") ? "http" : "https";
    const ref = `chkpltsub_${order.id.replace(/-/g, "")}`;

    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        plan, // Paystack uses the plan amount + creates the subscription on success
        reference: ref,
        callback_url: `${protocol}://${host}/checkout/success`,
        metadata: { order_id: order.id, product_slug: product.slug, subscription: true },
      }),
    });
    const initJson: any = await initRes.json();
    if (!initRes.ok || !initJson.status) {
      await supabaseAdmin.from("orders").update({ status: "failed", metadata: { error: initJson } }).eq("id", order.id);
      throw new Error(initJson.message || "Paystack subscription init failed");
    }

    await supabaseAdmin.from("orders").update({ provider_reference: ref }).eq("id", order.id);
    return { authorizationUrl: initJson.data.authorization_url as string, reference: ref };
  });
