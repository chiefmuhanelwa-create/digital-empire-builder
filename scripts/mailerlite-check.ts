/**
 * Validate MailerLite wiring: API key works + every configured group ID resolves.
 * Read-only — adds no subscribers, sends nothing. Safe to run any time.
 *
 *   bun run mailerlite:check
 *
 * Reads MAILERLITE_* from .env (Bun auto-loads it). Exits non-zero on any failure.
 */
const key = process.env.MAILERLITE_API_KEY;
if (!key) {
  console.error("✗ MAILERLITE_API_KEY is empty");
  process.exit(1);
}

const GROUPS = {
  CALLED_EXPERT: process.env.MAILERLITE_GROUP_ID_CALLED_EXPERT,
  FREE_KNOWLEDGE_AUDIT: process.env.MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT,
  BUYERS: process.env.MAILERLITE_GROUP_ID_BUYERS,
};

const headers = { Authorization: `Bearer ${key}`, Accept: "application/json" };

const res = await fetch("https://connect.mailerlite.com/api/groups?limit=200", { headers });
if (!res.ok) {
  console.error(`✗ API key rejected — HTTP ${res.status}`);
  process.exit(1);
}
const all = (await res.json()).data as Array<{ id: string; name: string; active_count: number }>;
const byId = new Map(all.map((g) => [g.id, g]));
console.log(`✓ API key valid — ${all.length} groups visible\n`);

let ok = true;
for (const [envVar, id] of Object.entries(GROUPS)) {
  if (!id) {
    console.log(`✗ ${envVar}: not set`);
    ok = false;
    continue;
  }
  const g = byId.get(id);
  if (g) console.log(`✓ ${envVar} (${id}) → "${g.name}" — ${g.active_count} subscribers`);
  else {
    console.log(`✗ ${envVar} (${id}) → no matching group`);
    ok = false;
  }
}

process.exit(ok ? 0 : 1);
