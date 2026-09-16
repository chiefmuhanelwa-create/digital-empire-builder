import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Content OS persistence. RLS is per-user on both tables, so the same code
// serves the founder and every subscriber without a branch — which is what
// makes this resellable rather than one person's private sheet.

const PieceInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  pillar: z.string().max(40).nullish(),
  format: z.enum(["reel", "carousel", "static", "email"]).default("reel"),
  status: z.enum(["idea", "scripted", "recorded", "edited", "scheduled", "posted", "retired"]).default("idea"),
  hook: z.string().max(600).nullish(),
  hook_shape: z.string().max(40).nullish(),
  screen_text: z.string().max(200).nullish(),
  story_ref: z.string().max(120).nullish(),
  receipt_ref: z.string().max(120).nullish(),
  cta_keyword: z.string().max(40).nullish(),
  runtime_seconds: z.number().int().min(0).max(3600).nullish(),
  scheduled_for: z.string().nullish(),
  posted_at: z.string().nullish(),
  platform: z.string().max(40).nullish(),
  permalink: z.string().max(500).nullish(),
  reach: z.number().int().min(0).nullish(),
  saves: z.number().int().min(0).nullish(),
  comments: z.number().int().min(0).nullish(),
  shares: z.number().int().min(0).nullish(),
  completion_pct: z.number().min(0).max(100).nullish(),
  notes: z.string().max(4000).nullish(),
});

export const listContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [piecesRes, settingsRes] = await Promise.all([
      supabaseAdmin
        .from("content_pieces")
        .select("*")
        .eq("user_id", context.userId)
        .order("updated_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("content_settings")
        .select("*")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    if (piecesRes.error) throw new Error(piecesRes.error.message);
    if (settingsRes.error) throw new Error(settingsRes.error.message);
    return { pieces: piecesRes.data ?? [], settings: settingsRes.data };
  });

export const upsertPiece = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PieceInput.parse(input))
  .handler(async ({ data, context }) => {
    const row = { ...data, user_id: context.userId };
    // Moving to posted without a timestamp would make every decay signal blind.
    if (row.status === "posted" && !row.posted_at) row.posted_at = new Date().toISOString();
    const { data: saved, error } = await supabaseAdmin
      .from("content_pieces")
      .upsert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: saved.id };
  });

export const deletePiece = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("content_pieces")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveContentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      pillars: z.array(z.string().max(40)).max(12),
      wired_keywords: z.array(z.string().max(40)).max(20),
      weekly_target: z.number().int().min(1).max(30),
      runtime_low: z.number().int().min(10).max(600),
      runtime_high: z.number().int().min(10).max(600),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("content_settings")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Seed a new subscriber's queue from the pillar map so the system is never
 *  empty on first open. An empty template is the thing this replaces. */
export const seedStarterPieces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await supabaseAdmin
      .from("content_pieces")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId);
    if ((count ?? 0) > 0) return { seeded: 0 };

    const seeds = [
      { pillar: "KEEP IT", format: "reel", title: "Tax starts earlier than you think", hook_shape: "second_person" },
      { pillar: "KEEP IT", format: "carousel", title: "The 35% rule", hook_shape: "command_noun" },
      { pillar: "PRICE IT", format: "reel", title: "Your rate is not a number you worked out", hook_shape: "second_person" },
      { pillar: "PRICE IT", format: "carousel", title: "What they are actually buying", hook_shape: "command_noun" },
      { pillar: "PROVE IT", format: "reel", title: "The report nobody asked for", hook_shape: "institution_quote" },
      { pillar: "OWN IT", format: "reel", title: "Two appeals, both refused", hook_shape: "institution_quote" },
      { pillar: "OWN IT", format: "carousel", title: "Borrowed vs yours", hook_shape: "command_noun" },
      { pillar: "BUILD IT ANYWAY", format: "reel", title: "You don't have to quit", hook_shape: "second_person" },
    ].map((s) => ({ ...s, user_id: context.userId, status: "idea" }));

    const { error } = await supabaseAdmin.from("content_pieces").insert(seeds);
    if (error) throw new Error(error.message);
    return { seeded: seeds.length };
  });

// ── Idea Bank ────────────────────────────────────────────────────────────────

const IdeaInput = z.object({
  id: z.string().uuid().optional(),
  idea: z.string().min(1).max(400),
  topic: z.string().max(80).nullish(),
  pillar: z.string().max(40).nullish(),
  inspiration_url: z.string().max(600).nullish(),
  source_handle: z.string().max(120).nullish(),
  angle: z.string().max(600).nullish(),
  favourite: z.boolean().default(false),
});

export const listIdeas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("content_ideas").select("*").eq("user_id", context.userId)
      .order("favourite", { ascending: false }).order("created_at", { ascending: false }).limit(300);
    if (error) throw new Error(error.message);
    return { ideas: data ?? [] };
  });

export const upsertIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdeaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("content_ideas").upsert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("content_ideas").delete()
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Promote an idea into the pipeline. The idea keeps a pointer to the piece, so
 *  the bank shows what has been spent and what is still sitting there. */
export const promoteIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: idea, error: readErr } = await supabaseAdmin
      .from("content_ideas").select("*").eq("id", data.id).eq("user_id", context.userId).single();
    if (readErr) throw new Error(readErr.message);

    const { data: piece, error } = await supabaseAdmin.from("content_pieces").insert({
      user_id: context.userId, title: idea.idea, pillar: idea.pillar,
      notes: [idea.angle, idea.inspiration_url].filter(Boolean).join("\n"),
      status: "idea", format: "reel",
    }).select("id").single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("content_ideas").update({ used_piece_id: piece.id }).eq("id", data.id);
    return { pieceId: piece.id };
  });

// ── Resource Library ─────────────────────────────────────────────────────────

export const listResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("content_resources").select("*").eq("user_id", context.userId)
      .eq("archived", false).order("is_seed", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { resources: data ?? [] };
  });

export const upsertResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid().optional(),
    kind: z.enum(["hook", "visual_hook", "cta", "prompt", "rehook"]),
    title: z.string().min(1).max(400),
    body: z.string().max(2000).nullish(),
    evidence: z.string().max(400).nullish(),
    pillar: z.string().max(40).nullish(),
    archived: z.boolean().default(false),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("content_resources").upsert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Seed the library on first open. An empty library is the thing this replaces. */
export const seedLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await supabaseAdmin
      .from("content_resources").select("id", { count: "exact", head: true }).eq("user_id", context.userId);
    if ((count ?? 0) > 0) return { seeded: 0 };

    const { SEED_LIBRARY } = await import("@/lib/content-library");
    const rows = SEED_LIBRARY.map((r) => ({
      user_id: context.userId, kind: r.kind, title: r.title,
      body: r.body ?? null, evidence: r.evidence ?? null, pillar: r.pillar ?? null, is_seed: true,
    }));
    const { error } = await supabaseAdmin.from("content_resources").insert(rows);
    if (error) throw new Error(error.message);
    return { seeded: rows.length };
  });
