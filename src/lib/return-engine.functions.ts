import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Data gather for the Return Engine (Stage 12).
//
// Reads only. It computes nothing — all of that lives in return-engine.ts,
// which is client-safe and testable without a database. This file exists so
// the two queries are scoped by context.userId as well as by RLS.

export const getReturnData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ reservePercent: z.number().min(0).max(45).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const [dealsRes, incomeRes, exclusivityRes, snapshotRes] = await Promise.all([
      supabaseAdmin
        .from("deals")
        .select("status, amount, currency, due_date, paid_at, chase_count, created_at")
        .eq("user_id", context.userId),
      supabaseAdmin
        .from("income_transactions")
        .select("type, amount, date")
        .eq("user_id", context.userId),
      supabaseAdmin
        .from("deals")
        .select("counterparty, exclusive_until, exclusivity_scope")
        .eq("user_id", context.userId)
        .not("exclusive_until", "is", null),
      supabaseAdmin
        .from("audience_snapshots")
        .select("taken_on")
        .eq("user_id", context.userId)
        .order("taken_on", { ascending: false })
        .limit(12),
    ]);

    if (dealsRes.error) throw new Error(dealsRes.error.message);
    if (incomeRes.error) throw new Error(incomeRes.error.message);
    if (exclusivityRes.error) throw new Error(exclusivityRes.error.message);
    if (snapshotRes.error) throw new Error(snapshotRes.error.message);

    return {
      deals: dealsRes.data ?? [],
      income: incomeRes.data ?? [],
      exclusivities: exclusivityRes.data ?? [],
      snapshotDates: (snapshotRes.data ?? []).map((r) => r.taken_on),
      reservePercent: data.reservePercent ?? 25,
    };
  });
