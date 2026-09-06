import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Invoice settings — one row per user, read and written through server
// functions so RLS is backed by a verified bearer token like everywhere else.

const SettingsInput = z.object({
  trading_name: z.string().max(160).nullish(),
  legal_name: z.string().max(160).nullish(),
  registration_number: z.string().max(60).nullish(),
  vat_number: z.string().max(40).nullish(),
  is_vat_registered: z.boolean().default(false),
  address: z.string().max(400).nullish(),
  contact_email: z.string().max(200).nullish(),
  contact_phone: z.string().max(60).nullish(),
  bank_name: z.string().max(120).nullish(),
  account_holder: z.string().max(160).nullish(),
  account_number: z.string().max(40).nullish(),
  branch_code: z.string().max(20).nullish(),
  account_type: z.string().max(40).nullish(),
  payment_terms_days: z.number().int().min(0).max(180).default(30),
  invoice_prefix: z.string().max(10).default("INV"),
  next_invoice_number: z.number().int().min(1).default(1),
  notes: z.string().max(1000).nullish(),
});

export const getInvoiceSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("invoice_settings")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { settings: data };
  });

export const saveInvoiceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SettingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("invoice_settings")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Called after an invoice is actually produced, so the next one does not reuse
// the number. Increments rather than setting, so two tabs cannot collide on a
// stale value read from the client.
export const consumeInvoiceNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: cur, error: readErr } = await supabaseAdmin
      .from("invoice_settings")
      .select("next_invoice_number")
      .eq("user_id", context.userId)
      .single();
    if (readErr) throw new Error(readErr.message);

    const next = (cur?.next_invoice_number ?? 1) + 1;
    const { error } = await supabaseAdmin
      .from("invoice_settings")
      .update({ next_invoice_number: next })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { next_invoice_number: next };
  });
