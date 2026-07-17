// One-off: count Aligned 2026 giveaway signups.
// Run: bun run scripts/count-aligned.ts
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env (server-only, gitignored).
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { count, error } = await db
  .from("subscribers")
  .select("*", { count: "exact", head: true })
  .eq("source", "aligned-2026");

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

console.log(`\n  Aligned 2026 signups: ${count ?? 0}\n`);

// Recent few (name + when), newest first
const { data: recent } = await db
  .from("subscribers")
  .select("first_name,email,phone,created_at")
  .eq("source", "aligned-2026")
  .order("created_at", { ascending: false })
  .limit(10);

if (recent?.length) {
  console.log("  Most recent:");
  for (const r of recent) {
    const when = r.created_at ? new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ") : "—";
    console.log(`   · ${when}  ${r.first_name ?? "—"}  ${r.email}${r.phone ? "  " + r.phone : ""}`);
  }
  console.log("");
}
