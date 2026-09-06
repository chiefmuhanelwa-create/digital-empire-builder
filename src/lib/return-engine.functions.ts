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
    const [dealsRes, incomeRes] = await Promise.all([
      supabaseAdmin
        .from("deals")
        .select("status, amount, currency, due_date, paid_at, chase_count, created_at")
        .eq("user_id", context.userId),
      supabaseAdmin
        .from("income_transactions")
        .select("type, amount, date")
        .eq("user_id", context.userId),
    ]);

    if (dealsRes.error) throw new Error(dealsRes.error.message);
    if (incomeRes.error) throw new Error(incomeRes.error.message);

    return {
      deals: dealsRes.data ?? [],
      income: incomeRes.data ?? [],
      reservePercent: data.reservePercent ?? 25,
    };
  });
