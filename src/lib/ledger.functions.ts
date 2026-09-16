import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// The ledger is the moat, so it is server-side and per-user by RLS. Nothing
// here generates; it only records and returns.

const EntryInput = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["money", "quote", "platform", "count", "date", "other"]).default("money"),
  label: z.string().min(1).max(200),
  value_number: z.number().nullish(),
  currency: z.string().max(8).nullish(),
  value_text: z.string().max(2000).nullish(),
  status: z.enum(["verified", "unverified", "banned"]).default("verified"),
  source: z.string().max(300).nullish(),
  occurred_on: z.string().nullish(),
  counterparty: z.string().max(200).nullish(),
  replacement: z.string().max(400).nullish(),
  notes: z.string().max(2000).nullish(),
});

export const listLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("ledger_entries").select("*").eq("user_id", context.userId)
      .order("status", { ascending: true }).order("updated_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return { entries: data ?? [] };
  });

export const upsertLedgerEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => EntryInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("ledger_entries").upsert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLedgerEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("ledger_entries").delete()
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Records what the engine checked. Two jobs: a source trace on any output, and
 *  a record of which figures keep being reached for — a banned figure attempted
 *  five times is a retraining problem, not a typo. */
export const recordChecks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      script_id: z.string().uuid().nullish(),
      checks: z.array(z.object({
        claim: z.string().max(400),
        verdict: z.enum(["verified", "unverified", "banned", "no_record"]),
        entry_id: z.string().uuid().nullish(),
      })).max(60),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!data.checks.length) return { recorded: 0 };
    const rows = data.checks.map((c) => ({ ...c, script_id: data.script_id ?? null, user_id: context.userId }));
    const { error } = await supabaseAdmin.from("ledger_checks").insert(rows);
    if (error) throw new Error(error.message);
    return { recorded: rows.length };
  });

/** Which banned figures keep getting reached for. */
export const bannedAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("ledger_checks").select("claim, checked_at")
      .eq("user_id", context.userId).eq("verdict", "banned")
      .order("checked_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {};
    for (const r of data ?? []) counts[r.claim] = (counts[r.claim] ?? 0) + 1;
    return { attempts: Object.entries(counts).map(([claim, n]) => ({ claim, n })).sort((a, b) => b.n - a.n) };
  });
