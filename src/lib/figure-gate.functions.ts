import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Data gather for the Verified-Figure Gate (Stage 11).
//
// Reads only. All checking happens in figure-gate.ts, which is client-safe and
// testable without a database. Deliberately a separate reader from
// return-engine.functions.ts: this one needs `deliverable` and `counterparty`,
// which the Return Engine does not, and widening that query to serve both
// would ship more of a user's commercial terms to the browser than the page
// asking for it actually needs.

export const getFigureGateData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [dealsRes, incomeRes] = await Promise.all([
      supabaseAdmin
        .from("deals")
        .select("status, amount, currency, deliverable, counterparty, paid_at")
        .eq("user_id", context.userId)
        .eq("status", "paid"),
      supabaseAdmin
        .from("income_transactions")
        .select("type, amount, date")
        .eq("user_id", context.userId)
        .eq("type", "income"),
    ]);

    if (dealsRes.error) throw new Error(dealsRes.error.message);
    if (incomeRes.error) throw new Error(incomeRes.error.message);

    return { deals: dealsRes.data ?? [], income: incomeRes.data ?? [] };
  });
