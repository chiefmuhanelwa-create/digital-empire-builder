import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { calculate, type Basis, type LeakItem } from "./leak-engine";

// Server-side persistence for the Leak audit.
//
// This one does NOT ride on the kit_workspace localStorage mirror like the
// other tools. The audit is a record a buyer adds to over months, and the
// headline figure needs to be readable server-side — for the admin ledger now,
// and for a "here is your leak this quarter" email later. A blob that only
// exists once a browser has synced is the wrong shape for that.

const basisSchema = z.object({
  mode: z.enum(["package", "known"]),
  annualPackage: z.number().nonnegative().max(1_000_000_000).nullable(),
  knownHourly: z.number().nonnegative().max(10_000_000).nullable(),
});

const itemSchema = z.object({
  id: z.string().max(40),
  kind: z.enum(["brain-pick", "review", "talk", "referral-advice", "message", "committee", "mentoring", "other"]),
  label: z.string().max(200),
  timesPerYear: z.number().int().nonnegative().max(10_000),
  minutesEach: z.number().int().nonnegative().max(10_000),
});

export const getLeakAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("leak_audits")
      .select("basis, items, annual_value_cents, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      basis: (data?.basis ?? null) as Json | null,
      items: (data?.items ?? null) as Json | null,
      annualValueCents: data?.annual_value_cents ?? 0,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const saveLeakAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ basis: basisSchema, items: z.array(itemSchema).max(60) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Recomputed here rather than trusting a number posted from the browser —
    // this figure is going to be read back and quoted at people.
    const result = calculate(data.basis as Basis, data.items as LeakItem[]);
    const cents = Math.round(Math.max(0, result.totalValue) * 100);

    const { error } = await supabaseAdmin.from("leak_audits").upsert(
      {
        user_id: context.userId,
        basis: data.basis as unknown as Json,
        items: data.items as unknown as Json,
        annual_value_cents: cents,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, annualValueCents: cents };
  });
