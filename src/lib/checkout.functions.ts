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
      .select("id,slug,title,price_cents,currency,status,garden,is_free")
      .eq("slug", data.productSlug)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product) throw new Error("Product not found");
    if (product.status !== "published") throw new Error("Product not available");
    if (product.is_free || product.price_cents <= 0) {
      throw new Error("Free products do not require checkout");
    }

    // 2. Create a pending order
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        email: data.email.toLowerCase(),
        customer_name: data.fullName ?? null,
        customer_phone: data.phone ?? null,
        currency: product.currency,
        subtotal_cents: product.price_cents,
        total_cents: product.price_cents,
        provider: "paystack",
        status: "pending",
        metadata: { product_slug: product.slug, garden: product.garden },
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabaseAdmin.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_title: product.title,
      unit_price_cents: product.price_cents,
      quantity: 1,
      line_total_cents: product.price_cents,
    });
    if (iErr) throw new Error(iErr.message);

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
        amount: product.price_cents, // ZAR cents == Paystack smallest unit
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

    const purchasedSlug = (order.metadata as { product_slug?: string } | null)?.product_slug;
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
      nextSeed,
    };
  });
