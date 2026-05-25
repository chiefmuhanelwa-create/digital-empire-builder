import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin role required");
}

// ───────────────────────────── Learner reads ─────────────────────────────

export const getMyCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as any;
    const { data, error } = await supabaseAdmin
      .from("product_grants")
      .select("product_id, granted_at, products:product_id(id,slug,title,tagline,garden,cover_image_url)")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("granted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { courses: data ?? [] };
  });

export const getLessonBody = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      productSlug: z.string().min(1).max(120),
      lessonSlug: z.string().min(1).max(120),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as any;

    // 1. Resolve product
    const { data: product, error: pe } = await supabaseAdmin
      .from("products")
      .select("id,slug,title")
      .eq("slug", data.productSlug)
      .maybeSingle();
    if (pe) throw new Error(pe.message);
    if (!product) throw new Error("Course not found");

    // 2. Resolve lesson within that product
    const { data: lesson, error: le } = await supabaseAdmin
      .from("lessons")
      .select("id,slug,title,summary,body_md,video_url,duration_minutes,is_preview,sort_order,module_id,modules:module_id(id,title,product_id,sort_order)")
      .eq("slug", data.lessonSlug)
      .maybeSingle();
    if (le) throw new Error(le.message);
    if (!lesson || (lesson.modules as any)?.product_id !== product.id) {
      throw new Error("Lesson not found");
    }

    // 3. Access gate
    let hasAccess = lesson.is_preview === true;
    if (!hasAccess) {
      const { data: grant } = await supabaseAdmin
        .from("product_grants")
        .select("id")
        .eq("product_id", product.id)
        .eq("user_id", userId)
        .is("revoked_at", null)
        .maybeSingle();
      hasAccess = !!grant;
    }

    if (!hasAccess) {
      return {
        locked: true as const,
        product: { slug: product.slug, title: product.title },
        lesson: {
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          is_preview: false,
          duration_minutes: lesson.duration_minutes,
        },
      };
    }

    return {
      locked: false as const,
      product: { slug: product.slug, title: product.title },
      lesson: {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        body_md: lesson.body_md,
        video_url: lesson.video_url,
        duration_minutes: lesson.duration_minutes,
        is_preview: lesson.is_preview,
      },
    };
  });

export const markLessonComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ lessonId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { error } = await supabaseAdmin
      .from("lesson_progress")
      .upsert(
        { lesson_id: data.lessonId, user_id: userId, completed_at: new Date().toISOString() },
        { onConflict: "lesson_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ───────────────────────────── Admin CRUD ─────────────────────────────

export const adminGetCurriculum = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ productSlug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);

    const { data: product, error: pe } = await supabaseAdmin
      .from("products").select("id,slug,title").eq("slug", data.productSlug).maybeSingle();
    if (pe) throw new Error(pe.message);
    if (!product) throw new Error("Product not found");

    const { data: modules } = await supabaseAdmin
      .from("modules")
      .select("id,title,summary,sort_order, lessons:lessons(id,slug,title,is_preview,sort_order,duration_minutes)")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true });

    // Sort lessons within each module
    const sorted = (modules ?? []).map((m: any) => ({
      ...m,
      lessons: (m.lessons ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));

    return { product, modules: sorted };
  });

export const adminCreateModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      productId: z.string().uuid(),
      title: z.string().min(1).max(200),
      summary: z.string().max(2000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { data: maxRow } = await supabaseAdmin
      .from("modules").select("sort_order").eq("product_id", data.productId)
      .order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const next = (maxRow?.sort_order ?? -1) + 1;
    const { data: m, error } = await supabaseAdmin
      .from("modules")
      .insert({ product_id: data.productId, title: data.title, summary: data.summary ?? null, sort_order: next })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: m.id };
  });

export const adminUpdateModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      summary: z.string().max(2000).optional(),
      sort_order: z.number().int().min(0).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("modules").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { error } = await supabaseAdmin.from("modules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export const adminCreateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      moduleId: z.string().uuid(),
      title: z.string().min(1).max(200),
      slug: z.string().max(80).optional(),
      summary: z.string().max(2000).optional(),
      body_md: z.string().max(100000).optional(),
      video_url: z.string().url().max(500).optional().or(z.literal("")),
      duration_minutes: z.number().int().min(0).max(10000).optional(),
      is_preview: z.boolean().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const slug = data.slug && data.slug.length ? slugify(data.slug) : slugify(data.title);
    const { data: maxRow } = await supabaseAdmin
      .from("lessons").select("sort_order").eq("module_id", data.moduleId)
      .order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const next = (maxRow?.sort_order ?? -1) + 1;
    const { data: l, error } = await supabaseAdmin
      .from("lessons")
      .insert({
        module_id: data.moduleId,
        slug,
        title: data.title,
        summary: data.summary ?? null,
        body_md: data.body_md ?? null,
        video_url: data.video_url || null,
        duration_minutes: data.duration_minutes ?? null,
        is_preview: data.is_preview ?? false,
        sort_order: next,
      })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: l.id };
  });

export const adminUpdateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      slug: z.string().max(80).optional(),
      summary: z.string().max(2000).optional().nullable(),
      body_md: z.string().max(100000).optional().nullable(),
      video_url: z.string().max(500).optional().nullable(),
      duration_minutes: z.number().int().min(0).max(10000).optional().nullable(),
      is_preview: z.boolean().optional(),
      sort_order: z.number().int().min(0).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { id, ...patch } = data;
    if (patch.slug) patch.slug = slugify(patch.slug);
    const { error } = await supabaseAdmin.from("lessons").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const { error } = await supabaseAdmin.from("lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
