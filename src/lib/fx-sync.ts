// Live FX sync — keeps the ZAR charge (price_cents) tracking the fixed USD
// marketing price at the current rand rate. Paystack can only bill ZAR, so we
// DISPLAY clean USD (USD_DISPLAY) and CHARGE the rand equivalent. The rand moves
// daily, so this job pulls the live USD→ZAR rate and rewrites price_cents — no
// hardcoded conversion. Runs on the Cloudflare cron (see wrangler.jsonc) and is
// also exposed at POST /api/cron/sync-fx for manual/triggered runs.
import { createClient } from "@supabase/supabase-js";
import { USD_DISPLAY } from "@/lib/gardens";

// Same env pattern as the email queue route: URL is build-inlined via Vite,
// the service-role key is a runtime secret. process.env.SUPABASE_URL is not
// populated in this worker context, so we don't use the shared admin proxy.
function fxAdminClient() {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Free, keyless, ECB-backed. Falls back through providers if the first is down.
const FX_ENDPOINTS = [
  "https://api.frankfurter.app/latest?from=USD&to=ZAR",
  "https://open.er-api.com/v6/latest/USD",
];

async function fetchUsdZarRate(): Promise<number | null> {
  for (const url of FX_ENDPOINTS) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) continue;
      const json = (await res.json()) as { rates?: Record<string, number> };
      const rate = json?.rates?.ZAR;
      // Sanity band — reject garbage / wrong base so we never set absurd prices.
      if (typeof rate === "number" && rate > 5 && rate < 60) return rate;
    } catch {
      // try next provider
    }
  }
  return null;
}

export type FxSyncResult = {
  ok: boolean;
  rate?: number;
  updated?: { slug: string; price_cents: number }[];
  errors?: string[];
  error?: string;
};

export async function syncFxRates(): Promise<FxSyncResult> {
  const rate = await fetchUsdZarRate();
  if (rate == null) return { ok: false, error: "Could not fetch a live USD→ZAR rate." };

  const supabase = fxAdminClient();
  if (!supabase) return { ok: false, rate, error: "Missing Supabase credentials in worker." };

  const updated: { slug: string; price_cents: number }[] = [];
  const errors: string[] = [];
  for (const [slug, usdCents] of Object.entries(USD_DISPLAY)) {
    // ZAR cents = USD cents × rate (e.g. 9700 × 16.58 ≈ 160826 → R1,608.26).
    const price_cents = Math.round(usdCents * rate);
    try {
      const { error } = await supabase
        .from("products")
        .update({ price_cents })
        .eq("slug", slug)
        .eq("currency", "ZAR")
        .eq("is_free", false);
      if (error) errors.push(`${slug}: ${error.message}`);
      else updated.push({ slug, price_cents });
    } catch (err) {
      errors.push(`${slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { ok: true, rate, updated, errors: errors.length ? errors : undefined };
}
