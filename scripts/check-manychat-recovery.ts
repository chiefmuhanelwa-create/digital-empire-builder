// Track the ManyChat Facebook lead-qualifier recovery rate — the % of contacts
// reaching the webhook that get a filled segment + pain_point, vs the 2026-08-06
// baseline (19% / 14%) measured before the button + webhook fixes.
// Run: bun run scripts/check-manychat-recovery.ts
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env (server-only, gitignored).
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await db
  .from("subscribers")
  .select("email, first_name, raw_data, created_at")
  .not("raw_data->manychat", "is", null)
  .order("created_at", { ascending: false });

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

type ManychatData = { segment?: string | null; pain_point?: string | null; blocker_detail?: string | null };

// Filter out obvious personal test accounts so the rate reflects real leads.
const TEST_MARKERS = ["nochill.co.za", "@test.com", "test@", "chiefmuha", "nochillvodcast", "atns.co.za"];
const isTest = (email: string, name: string | null) =>
  TEST_MARKERS.some((m) => email.toLowerCase().includes(m)) || (name ?? "").toLowerCase().includes("nochillvodcast");

const real = (data ?? []).filter((r) => !isTest(r.email, r.first_name));
const total = real.length;
const filled = real.filter((r) => {
  const mc = (r.raw_data as Record<string, unknown> | null)?.manychat as ManychatData | undefined;
  return !!mc?.segment && !!mc?.pain_point;
}).length;
const segmentOnly = real.filter((r) => {
  const mc = (r.raw_data as Record<string, unknown> | null)?.manychat as ManychatData | undefined;
  return !!mc?.segment;
}).length;

const pct = (n: number) => (total ? ((n / total) * 100).toFixed(0) : "0");

console.log(`\n  ManyChat recovery rate (real leads only, ${total} total, test accounts excluded)\n`);
console.log(`  segment filled:              ${segmentOnly}/${total}  (${pct(segmentOnly)}%)  — baseline was 19%`);
console.log(`  segment + pain_point filled: ${filled}/${total}  (${pct(filled)}%)  — baseline was 14%`);
console.log("");

const recent = real.slice(0, 10);
if (recent.length) {
  console.log("  Most recent:");
  for (const r of recent) {
    const mc = (r.raw_data as Record<string, unknown> | null)?.manychat as ManychatData | undefined;
    const when = r.created_at ? new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ") : "—";
    const detail = mc?.blocker_detail ? `  "${mc.blocker_detail.slice(0, 60)}${mc.blocker_detail.length > 60 ? "…" : ""}"` : "";
    console.log(
      `   · ${when}  ${r.first_name ?? "—"}  segment=${mc?.segment ?? "—"}  pain_point=${mc?.pain_point ?? "—"}${detail}`,
    );
  }
  console.log("");
}
