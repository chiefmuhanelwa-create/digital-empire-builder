import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

// Cross-device persistence for the whole Foundation Kit.
//
// See supabase/migrations/20260820120000_kit_workspace.sql for why this is one
// blob rather than a table per tool. In short: 17 tools, one promise (your
// answers carry forward), and it was all living in browser localStorage.
//
// The merge is deliberately SERVER-WINS-NEVER. A save always merges the
// incoming keys over the stored ones and never deletes a key the client did
// not send. That matters because a buyer might open the kit on a phone that
// has only done two tools — a naive replace would wipe the six they finished
// on their laptop. Losing a buyer's work once costs more than any staleness
// this could cause.

// Only keys the kit itself owns. Anything else is ignored rather than trusted,
// so a stray localStorage key from another script never lands in the database.
const KEY = /^nochill-[a-z0-9-]{1,60}$/;

// A generous ceiling that still refuses to store something pathological.
// The largest real tool payload is a few kilobytes.
const MAX_BYTES = 256_000;

export const getKitWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("kit_workspace")
      .select("state, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    // Json rather than Record<string, unknown> — the server-function boundary
    // requires a serialisable type, and `unknown` is not one.
    return {
      state: (data?.state ?? {}) as Json,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const saveKitWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        state: z.record(z.string(), z.unknown()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const incoming: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data.state)) {
      if (KEY.test(k) && v !== undefined && v !== null) incoming[k] = v;
    }
    if (Object.keys(incoming).length === 0) return { ok: true, keys: 0 };

    if (JSON.stringify(incoming).length > MAX_BYTES) {
      throw new Error("Workspace payload too large to save.");
    }

    const { data: existing, error: readErr } = await supabaseAdmin
      .from("kit_workspace")
      .select("state")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);

    const merged = {
      ...((existing?.state as Record<string, unknown>) ?? {}),
      ...incoming,
    } as Json;

    const { error } = await supabaseAdmin
      .from("kit_workspace")
      .upsert(
        { user_id: context.userId, state: merged, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, keys: Object.keys(incoming).length };
  });
