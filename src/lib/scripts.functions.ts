import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Scripts persist server-side and survive logout — the whole point. The Hook
// Bank held its state in useState and lost it on tab close; that is the failure
// this replaces.

const HookSchema = z.object({
  text: z.string().max(600),
  shape: z.string().max(60).default(""),
  screen: z.string().max(120).default(""),
  r: z.number().min(0).max(5).default(0),
  a: z.number().min(0).max(5).default(0),
  c: z.number().min(0).max(5).default(0),
  u: z.number().min(0).max(5).default(0),
  b: z.number().min(0).max(5).default(0),
  note: z.string().max(600).optional(),
});

const ScriptInput = z.object({
  id: z.string().uuid().optional(),
  piece_id: z.string().uuid().nullish(),
  title: z.string().min(1).max(200),
  style: z.enum(["nochill", "jatho"]).default("nochill"),
  format: z.string().max(40).default("epiphany"),
  pillar: z.string().max(40).nullish(),
  symptom: z.string().max(1000).nullish(),
  money_cost: z.string().max(1000).nullish(),
  raw_material: z.string().max(80).nullish(),
  hooks: z.array(HookSchema).max(6).default([]),
  chosen_hook: z.number().int().min(0).max(5).nullish(),
  screen_text: z.string().max(120).nullish(),
  beats: z.array(z.object({
    t: z.string().max(40), name: z.string().max(80), job: z.string().max(400),
    slot: z.string().max(4000), guard: z.string().max(600).optional(),
  })).max(20).default([]),
  cta_keyword: z.string().max(40).nullish(),
  closing_question: z.string().max(400).nullish(),
  runtime_target: z.number().int().min(0).max(600).nullish(),
  status: z.enum(["draft", "approved", "recorded"]).default("draft"),
});

export const listScripts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("scripts").select("*").eq("user_id", context.userId)
      .order("updated_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { scripts: data ?? [] };
  });

export const upsertScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ScriptInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: saved, error } = await supabaseAdmin
      .from("scripts").upsert({ ...data, user_id: context.userId }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: saved.id };
  });

export const deleteScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("scripts").delete()
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Push an approved script into the tracker so it stops being a document and
 *  starts being a thing with a pipeline position. */
export const scriptToPiece = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: s, error: readErr } = await supabaseAdmin
      .from("scripts").select("*").eq("id", data.id).eq("user_id", context.userId).single();
    if (readErr) throw new Error(readErr.message);

    const hooks = (s.hooks ?? []) as Array<{ text: string; shape: string }>;
    const chosen = typeof s.chosen_hook === "number" ? hooks[s.chosen_hook] : undefined;

    if (s.piece_id) {
      await supabaseAdmin.from("content_pieces").update({
        title: s.title, pillar: s.pillar, hook: chosen?.text ?? null,
        screen_text: s.screen_text, cta_keyword: s.cta_keyword,
        runtime_seconds: s.runtime_target, status: "scripted",
      }).eq("id", s.piece_id).eq("user_id", context.userId);
      return { pieceId: s.piece_id };
    }

    const { data: piece, error } = await supabaseAdmin.from("content_pieces").insert({
      user_id: context.userId, title: s.title, pillar: s.pillar, format: "reel",
      status: "scripted", hook: chosen?.text ?? null, hook_shape: chosen?.shape ?? null,
      screen_text: s.screen_text, cta_keyword: s.cta_keyword, runtime_seconds: s.runtime_target,
    }).select("id").single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("scripts").update({ piece_id: piece.id, status: "approved" }).eq("id", s.id);
    return { pieceId: piece.id };
  });
