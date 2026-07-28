import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Real cross-device persistence for the Niche Clarity Builder — it was
// localStorage-only before (same gap found across every one of the audited
// external tools). One row per user; the fields are a small, fixed 4-key
// shape so a JSON blob is the right storage, not a full table per field.
export const getNicheClarityProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("niche_clarity_progress")
      .select("fields")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { fields: data?.fields ?? null };
  });

export const saveNicheClarityProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      who: z.string().max(500),
      before: z.string().max(500),
      after: z.string().max(500),
      edge: z.string().max(500),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("niche_clarity_progress")
      .upsert(
        { user_id: context.userId, fields: data, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
