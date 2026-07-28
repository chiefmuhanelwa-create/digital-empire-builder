import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Ported from the unfinished "contentpreneurs-hub" repo's IncomeTracker.tsx —
// real, working CRUD logic; rewired onto this app's server-function + auth
// pattern (that repo called supabase.from() directly client-side, which this
// codebase doesn't do anywhere — every DB write here goes through a
// createServerFn so RLS is backed by a verified bearer token, not just trust).

const TransactionInput = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().min(0).max(100_000_000),
  description: z.string().min(1).max(300),
  category: z.string().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
});

export const listIncomeTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      type: z.enum(["all", "income", "expense"]).default("all"),
      month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = supabaseAdmin
      .from("income_transactions")
      .select("*")
      .eq("user_id", context.userId)
      .order("date", { ascending: false });

    if (data.type !== "all") query = query.eq("type", data.type);
    if (data.month) {
      const start = `${data.month}-01`;
      const end = new Date(`${data.month}-01T00:00:00Z`);
      end.setUTCMonth(end.getUTCMonth() + 1);
      query = query.gte("date", start).lt("date", end.toISOString().slice(0, 10));
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { transactions: rows ?? [] };
  });

export const upsertIncomeTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid().optional(), ...TransactionInput.shape }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const payload = {
      user_id: context.userId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      category: data.category,
      date: data.date,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("income_transactions")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("income_transactions")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteIncomeTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("income_transactions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
