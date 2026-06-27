import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GARDEN = z.enum(["deshe", "esev", "etz_pri", "devarim"]);
const STATUS = z.enum(["draft", "published", "archived"]);

const ProductInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "lowercase, numbers, dashes"),
  title: z.string().min(1).max(200),
  tagline: z.string().max(200).nullable().optional(),
  description: z.string().max(4000).nullable().optional(),
  long_description: z.string().max(20000).nullable().optional(),
  benefits: z.array(z.string().min(1).max(300)).max(20).optional(),
  format: z.string().max(120).nullable().optional(),
  target_audience: z.string().max(200).nullable().optional(),
  garden: GARDEN.nullable().optional(),
  price_cents: z.number().int().min(0).max(100_000_000),
  currency: z.string().min(3).max(8).default("ZAR"),
  is_free: z.boolean().default(false),
  requires_application: z.boolean().default(false),
  cover_image_url: z.string().max(500).nullable().optional(),
  download_path: z.string().max(500).nullable().optional(),
  status: STATUS.default("draft"),
  sort_order: z.number().int().min(0).max(10000).default(0),
});

async function ensureAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { products: data ?? [] };
  });

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProductInput.parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const payload = {
      slug: data.slug,
      title: data.title,
      tagline: data.tagline ?? null,
      description: data.description ?? null,
      long_description: data.long_description ?? null,
      benefits: data.benefits ?? [],
      format: data.format ?? null,
      target_audience: data.target_audience ?? null,
      garden: data.garden ?? null,
      price_cents: data.price_cents,
      currency: data.currency,
      is_free: data.is_free,
      requires_application: data.requires_application,
      cover_image_url: data.cover_image_url ?? null,
      download_path: data.download_path ?? null,
      status: data.status,
      sort_order: data.sort_order,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("products")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const adminToggleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      status: STATUS,
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("products")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin upload: accepts a base64-encoded file body and uploads to a bucket.
export const adminUploadFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      bucket: z.enum(["product-files", "product-covers"]),
      path: z.string().min(1).max(300).regex(/^[a-zA-Z0-9._\-\/]+$/),
      contentType: z.string().min(1).max(100),
      base64: z.string().min(1).max(40_000_000), // ~30MB binary
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const bytes = Buffer.from(data.base64, "base64");
    const { error } = await supabaseAdmin.storage
      .from(data.bucket)
      .upload(data.path, bytes, {
        contentType: data.contentType,
        upsert: true,
      });
    if (error) throw new Error(error.message);
    if (data.bucket === "product-covers") {
      const { data: pub } = supabaseAdmin.storage
        .from(data.bucket)
        .getPublicUrl(data.path);
      return { path: data.path, url: pub.publicUrl };
    }
    return { path: data.path, url: null };
  });

// Buyer-facing: signed download URL for a product they have access to.
// Access is granted if (a) authenticated user has a product_grant OR
// (b) caller provides the paystack reference of a paid order containing the product.
export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      productSlug: z.string().min(1).max(120),
      reference: z.string().max(120).optional(),
      authToken: z.string().max(2000).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,slug,title,download_path")
      .eq("slug", data.productSlug)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product || !product.download_path) {
      throw new Error("No download available for this product.");
    }

    let authorized = false;

    // Path A: signed-in user with grant
    if (data.authToken) {
      const { data: userData } = await supabaseAdmin.auth.getUser(data.authToken);
      const userId = userData?.user?.id;
      if (userId) {
        const { data: grant } = await supabaseAdmin
          .from("product_grants")
          .select("id")
          .eq("user_id", userId)
          .eq("product_id", product.id)
          .is("revoked_at", null)
          .maybeSingle();
        if (grant) authorized = true;
      }
    }

    // Path B: post-checkout reference
    if (!authorized && data.reference) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id,status")
        .eq("provider_reference", data.reference)
        .maybeSingle();
      if (order && order.status === "paid") {
        const { data: item } = await supabaseAdmin
          .from("order_items")
          .select("id")
          .eq("order_id", order.id)
          .eq("product_id", product.id)
          .maybeSingle();
        if (item) authorized = true;
      }
    }

    if (!authorized) throw new Error("You don't have access to this download.");

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("product-files")
      .createSignedUrl(product.download_path, 60 * 60 * 24); // 24h
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl, title: product.title };
  });

// Lists all products the signed-in user has a grant for, with download availability.
export const myPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("product_grants")
      .select(`
        granted_at,
        revoked_at,
        product:products (
          id, slug, title, tagline, cover_image_url, download_path, garden
        )
      `)
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("granted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { grants: data ?? [] };
  });

// Signed download URL for a signed-in user with a grant.
export const getMyDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ productSlug: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,title,download_path")
      .eq("slug", data.productSlug)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product?.download_path) throw new Error("No download available.");

    const { data: grant } = await supabaseAdmin
      .from("product_grants")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", product.id)
      .is("revoked_at", null)
      .maybeSingle();
    if (!grant) throw new Error("You don't have access to this download.");

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("product-files")
      .createSignedUrl(product.download_path, 60 * 60 * 24); // 24h
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl, title: product.title };
  });

// ── Foundation Kit per-framework downloads ───────────────────────────────────
// Whitelist of kit deliverable files in product-files (key → filename). Add an
// entry as each framework's fillable PDF is uploaded.
const KIT_FILES: Record<string, string> = {
  "niche-clarity": "niche-clarity-workbook.pdf",
  paids: "paids-framework-workbook.pdf",
  "ms-ts-ss": "ms-ts-ss-workbook.pdf",
  "knowledge-audit": "knowledge-audit-workbook.pdf",
  "4e-content-calendar": "4e-content-calendar-workbook.pdf",
  "seeds-pipeline": "seeds-pipeline-workbook.pdf",
  "dares-asset-model": "dares-asset-model-workbook.pdf",
  "90-day-planner": "90-day-first-income-planner.pdf",
  "cheat-sheet": "called-expert-cheat-sheet.pdf",
  "30-day-tracker": "30-day-accountability-tracker.pdf",
};
const KIT_OWNER_SLUGS = ["called-expert-foundation-kit", "called-expert-starter-bundle"];

export const getKitFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ key: z.string().min(1).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    const file = KIT_FILES[data.key];
    if (!file) throw new Error("Unknown kit file.");
    const { userId } = context;

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    let allowed = !!isAdmin;
    if (!allowed) {
      const { data: kits } = await supabaseAdmin.from("products").select("id").in("slug", KIT_OWNER_SLUGS);
      const ids = (kits ?? []).map((k) => k.id);
      if (ids.length) {
        const { data: grant } = await supabaseAdmin
          .from("product_grants")
          .select("id")
          .eq("user_id", userId)
          .in("product_id", ids)
          .is("revoked_at", null)
          .maybeSingle();
        allowed = !!grant;
      }
    }
    if (!allowed) throw new Error("You don't have access to the Foundation Kit.");

    const { data: signed, error } = await supabaseAdmin.storage
      .from("product-files")
      .createSignedUrl(file, 60 * 60 * 24);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

// Link any purchases made with this user's email (email-only grants from checkout)
// to their account. Safety net so access is never stranded if the account was
// created after — or independently of — the purchase. Idempotent; call on login.
export const claimMyGrants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const email = (context.claims as { email?: string } | undefined)?.email?.toLowerCase();
    if (!email) return { linked: 0 };

    const { data: subs } = await supabaseAdmin
      .from("subscribers")
      .select("id")
      .eq("email", email);
    const subIds = (subs ?? []).map((s) => s.id);
    if (!subIds.length) return { linked: 0 };

    const { data: linked, error } = await supabaseAdmin
      .from("product_grants")
      .update({ user_id: userId })
      .in("subscriber_id", subIds)
      .is("user_id", null)
      .select("id");
    if (error) throw new Error(error.message);
    return { linked: (linked ?? []).length };
  });
