import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin role required");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

// ─────────────────────────────────────────────────────────────
// READS
// ─────────────────────────────────────────────────────────────

export const getContactsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);

    const [{ count: total }, { count: active }, { count: unsub }, tagsRes] = await Promise.all([
      supabase.from("subscribers").select("*", { count: "exact", head: true }),
      supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
      supabase.from("tags").select("id,name,slug,color,description").order("name"),
    ]);

    // Source breakdown
    const { data: bySource } = await supabase
      .from("subscribers")
      .select("source")
      .limit(20000);
    const sourceCounts: Record<string, number> = {};
    (bySource ?? []).forEach((r: any) => {
      sourceCounts[r.source] = (sourceCounts[r.source] ?? 0) + 1;
    });

    // Tag counts
    const tags = tagsRes.data ?? [];
    const tagCounts: Record<string, number> = {};
    await Promise.all(
      tags.map(async (t: any) => {
        const { count } = await supabase
          .from("subscriber_tags")
          .select("*", { count: "exact", head: true })
          .eq("tag_id", t.id);
        tagCounts[t.id] = count ?? 0;
      }),
    );

    return {
      totals: { total: total ?? 0, active: active ?? 0, unsubscribed: unsub ?? 0 },
      sources: sourceCounts,
      tags: tags.map((t: any) => ({ ...t, count: tagCounts[t.id] ?? 0 })),
    };
  });

export const listSubscribers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        search: z.string().max(255).optional(),
        tagId: z.string().uuid().optional(),
        status: z.enum(["active", "unsubscribed", "bounced", "complained"]).optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);

    let subIds: string[] | null = null;
    if (data.tagId) {
      const { data: links } = await supabase
        .from("subscriber_tags")
        .select("subscriber_id")
        .eq("tag_id", data.tagId)
        .limit(5000);
      const ids = (links ?? []).map((l: any) => l.subscriber_id as string);
      if (ids.length === 0) return { rows: [], total: 0 };
      subIds = ids;
    }

    let q = supabase
      .from("subscribers")
      .select("id,email,first_name,last_name,phone,source,status,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (data.status) q = q.eq("status", data.status);
    if (data.search) q = q.ilike("email", `%${data.search}%`);
    if (subIds) { const ids = subIds; q = q.in("id", ids); }

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);

    // Fetch tags for the returned subscribers
    const ids = (rows ?? []).map((r: any) => r.id);
    let tagMap: Record<string, Array<{ id: string; name: string; color: string | null }>> = {};
    if (ids.length) {
      const { data: links } = await supabase
        .from("subscriber_tags")
        .select("subscriber_id,tag_id,tags(id,name,color)")
        .in("subscriber_id", ids);
      (links ?? []).forEach((l: any) => {
        (tagMap[l.subscriber_id] ??= []).push({ id: l.tags.id, name: l.tags.name, color: l.tags.color });
      });
    }

    return {
      rows: (rows ?? []).map((r: any) => ({ ...r, tags: tagMap[r.id] ?? [] })),
      total: count ?? 0,
    };
  });

// ─────────────────────────────────────────────────────────────
// IMPORT
// ─────────────────────────────────────────────────────────────

const ImportRow = z.object({
  email: z.string().email().max(255),
  first_name: z.string().max(120).optional().nullable(),
  last_name: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
});

export const importContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        rows: z.array(z.record(z.string(), z.any())).min(1).max(20000),
        source: z.string().min(1).max(64).default("legacy_list"),
        applyTagSlugs: z.array(z.string().min(1).max(64)).max(20).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);

    // Resolve tag slugs → ids (create missing)
    const tagIds: string[] = [];
    for (const slug of data.applyTagSlugs) {
      const cleanSlug = slugify(slug);
      if (!cleanSlug) continue;
      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", cleanSlug)
        .maybeSingle();
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const { data: created, error } = await supabase
          .from("tags")
          .insert({ name: cleanSlug, slug: cleanSlug })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        tagIds.push(created.id);
      }
    }

    // Normalise rows
    type Norm = z.infer<typeof ImportRow> & { raw: Record<string, any> };
    const valid: Norm[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    data.rows.forEach((raw, i) => {
      const lower: Record<string, any> = {};
      Object.entries(raw).forEach(([k, v]) => {
        lower[k.toLowerCase().trim()] = typeof v === "string" ? v.trim() : v;
      });
      const candidate = {
        email: lower.email ?? lower["email address"] ?? lower["e-mail"],
        first_name: lower.first_name ?? lower.firstname ?? lower["first name"] ?? null,
        last_name: lower.last_name ?? lower.lastname ?? lower["last name"] ?? null,
        phone: lower.phone ?? lower.mobile ?? lower["phone number"] ?? null,
      };
      const parsed = ImportRow.safeParse(candidate);
      if (!parsed.success) {
        errors.push({ index: i, error: parsed.error.issues[0]?.message ?? "invalid row" });
      } else {
        valid.push({ ...parsed.data, email: parsed.data.email.toLowerCase(), raw });
      }
    });

    // Upsert subscribers in chunks
    let inserted = 0;
    let updated = 0;
    const chunkSize = 500;
    const allIds: string[] = [];

    for (let i = 0; i < valid.length; i += chunkSize) {
      const chunk = valid.slice(i, i + chunkSize);
      const payload = chunk.map((r) => ({
        email: r.email,
        first_name: r.first_name,
        last_name: r.last_name,
        phone: r.phone,
        source: data.source,
        raw_data: r.raw,
      }));

      // Check which already exist
      const emails = chunk.map((r) => r.email);
      const { data: existing } = await supabase
        .from("subscribers")
        .select("id,email")
        .in("email", emails);
      const existingMap = new Map<string, string>((existing ?? []).map((e: any) => [e.email, e.id]));

      const { data: upserted, error } = await supabase
        .from("subscribers")
        .upsert(payload, { onConflict: "email" })
        .select("id,email");
      if (error) throw new Error(error.message);

      (upserted ?? []).forEach((r: any) => {
        allIds.push(r.id);
        if (existingMap.has(r.email)) updated++;
        else inserted++;
      });
    }

    // Apply tags
    if (tagIds.length && allIds.length) {
      const links: Array<{ subscriber_id: string; tag_id: string; applied_by: string }> = [];
      for (const sid of allIds) {
        for (const tid of tagIds) {
          links.push({ subscriber_id: sid, tag_id: tid, applied_by: userId });
        }
      }
      for (let i = 0; i < links.length; i += 1000) {
        const chunk = links.slice(i, i + 1000);
        const { error } = await supabase
          .from("subscriber_tags")
          .upsert(chunk, { onConflict: "subscriber_id,tag_id", ignoreDuplicates: true });
        if (error) throw new Error(error.message);
      }
    }

    return {
      receivedRows: data.rows.length,
      validRows: valid.length,
      inserted,
      updated,
      errors: errors.slice(0, 50),
      errorCount: errors.length,
      tagsApplied: tagIds.length,
    };
  });

// ─────────────────────────────────────────────────────────────
// TAG MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(64),
        description: z.string().max(255).optional(),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const slug = slugify(data.name);
    const { data: tag, error } = await supabase
      .from("tags")
      .insert({ name: data.name, slug, description: data.description ?? null, color: data.color ?? null })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { tag };
  });

export const setSubscriberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        subscriberId: z.string().uuid(),
        status: z.enum(["active", "unsubscribed", "bounced", "complained"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const patch: any = { status: data.status };
    if (data.status === "unsubscribed") patch.unsubscribed_at = new Date().toISOString();
    const { error } = await supabase.from("subscribers").update(patch).eq("id", data.subscriberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
