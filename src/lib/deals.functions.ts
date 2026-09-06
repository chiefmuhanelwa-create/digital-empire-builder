import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Deal Tracker + Receivables Chase — pipeline Stage 9.
//
// Follows the same shape as income-tracker.functions.ts: every write goes
// through a createServerFn so RLS is backed by a verified bearer token, and
// every query is scoped by context.userId as well as by the policy. Belt and
// braces on purpose — this table will hold other people's commercial terms.

// Enums and the chase cadence live in deals-chase-engine.ts — client-safe,
// no supabaseAdmin import. Pulled in here so the zod validator and the UI can
// never drift apart. Same split as rate-card-engine.ts / leak-engine.ts.
import { DEAL_STATUSES, COUNTERPARTY_TYPES } from "@/lib/deals-chase-engine";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

const DealInput = z.object({
  counterparty: z.string().min(1).max(160),
  counterparty_type: z.enum(COUNTERPARTY_TYPES).default("brand"),
  deliverable: z.string().min(1).max(300),
  platform: z.string().max(80).nullish(),
  category: z.string().max(60).nullish(),
  exclusive_until: isoDate.nullish(),
  exclusivity_scope: z.string().max(400).nullish(),
  amount: z.number().min(0).max(100_000_000),
  currency: z.enum(["ZAR", "USD"]).default("ZAR"),
  status: z.enum(DEAL_STATUSES).default("lead"),
  quoted_at: isoDate.nullish(),
  accepted_at: isoDate.nullish(),
  delivered_at: isoDate.nullish(),
  invoiced_at: isoDate.nullish(),
  due_date: isoDate.nullish(),
  paid_at: isoDate.nullish(),
  invoice_number: z.string().max(60).nullish(),
  notes: z.string().max(2000).nullish(),
});

export const listDeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        status: z.enum(["all", ...DEAL_STATUSES]).default("all"),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = supabaseAdmin
      .from("deals")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (data.status !== "all") query = query.eq("status", data.status);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { deals: rows ?? [] };
  });

export const upsertDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid().optional(), ...DealInput.shape }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const payload = { ...rest, user_id: context.userId };

    if (id) {
      const { error } = await supabaseAdmin
        .from("deals")
        .update(payload)
        .eq("id", id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { id };
    }

    const { data: row, error } = await supabaseAdmin
      .from("deals")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("deals")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Record one chase. Increments the count rather than overwriting it, because
// the count is the teachable number — C-0412 is E1: five chases in 18 months,
// one of which uncovered a failed payment batch that would never otherwise
// have surfaced. A creator who has chased four times has a different problem
// from one who has chased once.
export const recordChase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: current, error: readErr } = await supabaseAdmin
      .from("deals")
      .select("chase_count")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (readErr) throw new Error(readErr.message);

    const next = (current?.chase_count ?? 0) + 1;
    const { error } = await supabaseAdmin
      .from("deals")
      .update({ chase_count: next, last_chased_at: new Date().toISOString().slice(0, 10) })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { chase_count: next };
  });

