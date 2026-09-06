import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Audience snapshots. One row per user per day — re-running the test on the
// same day overwrites rather than stacking, so the history stays a trend line
// instead of a log.

const ChannelInput = z.object({
  id: z.string().max(64),
  platform: z.string().min(1).max(80),
  kind: z.enum(["owned", "rented"]),
  size: z.number().min(0).max(1_000_000_000),
  reachable: z.number().min(0).max(1_000_000_000),
  monthlyIncome: z.number().min(0).max(1_000_000_000),
});

export const listSnapshots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("audience_snapshots")
      .select("id, taken_on, channels, notes")
      .eq("user_id", context.userId)
      .order("taken_on", { ascending: false })
      .limit(24);
    if (error) throw new Error(error.message);
    return { snapshots: data ?? [] };
  });

export const saveSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ channels: z.array(ChannelInput).max(20), notes: z.string().max(1000).nullish() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("audience_snapshots")
      .upsert(
        {
          user_id: context.userId,
          taken_on: new Date().toISOString().slice(0, 10),
          channels: data.channels,
          notes: data.notes ?? null,
        },
        { onConflict: "user_id,taken_on" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
