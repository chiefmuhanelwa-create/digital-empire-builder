/**
 * INGEST — walks the project folders and loads the estate into the corpus.
 *
 *   bun run scripts/ingest-corpus.ts <user-uuid>
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment. Run it
 * again whenever the estate changes — it replaces a source's chunks rather than
 * appending, so re-running is safe and does not duplicate.
 *
 * ⛔ WHAT IS DELIBERATELY NOT INGESTED
 * Article IV is inviolable, and a corpus is a claim surface like any other. The
 * skip list below keeps out raw sources, extracts, mailboxes and anything under
 * a private directory. A file that names a third party must never become a
 * chunk a model can quote from.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename, relative } from "node:path";

const HOME = process.env.HOME ?? "";

const ROOTS: { dir: string; collection: string; kind: string }[] = [
  { dir: join(HOME, "Desktop/NOCHILL-OS/00-CONTROL"), collection: "estate", kind: "ruling" },
  { dir: join(HOME, "Desktop/NOCHILL-OS/02-INFORMATION"), collection: "estate", kind: "bank" },
  { dir: join(HOME, "Desktop/NOCHILL-OS/03-WISDOM"), collection: "estate", kind: "spec" },
  { dir: join(HOME, "Desktop/VS code/ICP LEARNING"), collection: "icp", kind: "doc" },
  { dir: join(HOME, ".claude/skills/nochill-storytelling"), collection: "skills", kind: "skill" },
  { dir: join(HOME, ".claude/skills/nochill-script"), collection: "skills", kind: "skill" },
  { dir: join(HOME, ".claude/skills/nochill-edit"), collection: "skills", kind: "skill" },
  { dir: join(HOME, ".claude/skills/nochill-brain"), collection: "skills", kind: "skill" },
];

const SINGLE_FILES: { path: string; collection: string; kind: string }[] = [
  { path: join(HOME, ".claude/CLAUDE.md"), collection: "global", kind: "ruling" },
  { path: join(HOME, "Desktop/NOCHILL-OS/CLAUDE.md"), collection: "global", kind: "ruling" },
];

/** Article IV and PII. A corpus is a claim surface — keep these out entirely. */
const SKIP_DIR = /(^|\/)(node_modules|\.git|_raw|raw|sources|extracts|scratch|private|agent-runs|99-ARCHIVE)(\/|$)/i;
const SKIP_FILE = /(mbox|\.eml|intake|consent|contacts?|subscribers?|testimonial|S-031)/i;
const ALLOW_EXT = new Set([".md", ".csv"]);

type Doc = { path: string; title: string; collection: string; kind: string; body: string };

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const full = join(dir, e);
    if (SKIP_DIR.test(full)) continue;
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, out);
    else if (ALLOW_EXT.has(extname(full).toLowerCase()) && !SKIP_FILE.test(basename(full))) out.push(full);
  }
  return out;
}

/** Split on markdown headings so a chunk is a coherent idea, not N characters.
 *  A chunk cut mid-argument retrieves badly and quotes worse. */
function chunkMarkdown(body: string): { heading: string | null; body: string }[] {
  const lines = body.split("\n");
  const out: { heading: string | null; body: string }[] = [];
  let heading: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text.length > 40) out.push({ heading, body: text.slice(0, 6000) });
    buf = [];
  };

  for (const line of lines) {
    if (/^#{1,4}\s+/.test(line)) { flush(); heading = line.replace(/^#+\s+/, "").trim(); }
    else buf.push(line);
  }
  flush();
  return out.length ? out : [{ heading: null, body: body.slice(0, 6000) }];
}

/** A CSV row is already an atom — one story, one receipt. Keep the header so a
 *  retrieved row is readable on its own. */
function chunkCsv(body: string): { heading: string | null; body: string }[] {
  const lines = body.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0];
  return lines.slice(1).map((row, i) => ({
    heading: `row ${i + 1}`,
    body: `${header}\n${row}`.slice(0, 4000),
  }));
}

function tierOf(body: string): string | null {
  const m = body.match(/\bE([1-5])\b/);
  return m ? `E${m[1]}` : null;
}

function tagsOf(body: string, path: string): string[] {
  const t = new Set<string>();
  const l = `${body} ${path}`.toLowerCase();
  for (const [tag, re] of [
    ["keep-it", /\bsars|tax|reserve|provisional\b/],
    ["price-it", /\brate|pricing|quote|invoice|usage rights|sponsorship\b/],
    ["own-it", /\bplatform|terminat|suspend|email list|owned\b/],
    ["prove-it", /\breceipt|report|proof|evidence\b/],
    ["build-it", /\bemployed|full.time job|hour a day\b/],
    ["banned", /\bbanned|disproven|never ship\b/],
    ["hook", /\bhook|beat 1|accusation\b/],
    ["story", /\bstory|confession|failure\b/],
  ] as const) if (re.test(l)) t.add(tag);
  return [...t];
}

async function main() {
  const userId = process.argv[2];
  if (!userId) throw new Error("usage: bun run scripts/ingest-corpus.ts <user-uuid>");

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  const db = createClient(url, key);

  const docs: Doc[] = [];
  for (const r of ROOTS) {
    for (const f of walk(r.dir)) {
      try {
        const body = readFileSync(f, "utf8");
        if (body.trim().length < 80) continue;
        docs.push({ path: relative(HOME, f), title: basename(f), collection: r.collection, kind: r.kind, body });
      } catch { /* unreadable, skip */ }
    }
  }
  for (const s of SINGLE_FILES) {
    try {
      const body = readFileSync(s.path, "utf8");
      docs.push({ path: relative(HOME, s.path), title: basename(s.path), collection: s.collection, kind: s.kind, body });
    } catch { /* absent, skip */ }
  }

  console.log(`Found ${docs.length} documents.`);
  let chunkTotal = 0;

  for (const d of docs) {
    const { data: src, error: srcErr } = await db
      .from("knowledge_sources")
      .upsert({
        user_id: userId, path: d.path, title: d.title, collection: d.collection,
        kind: d.kind, evidence_tier: tierOf(d.body), bytes: d.body.length,
        ingested_at: new Date().toISOString(),
      }, { onConflict: "user_id,path" })
      .select("id").single();
    if (srcErr) { console.error(`  ✗ ${d.path}: ${srcErr.message}`); continue; }

    // Replace, never append — re-running must not duplicate.
    await db.from("knowledge_chunks").delete().eq("source_id", src.id);

    const parts = extname(d.path).toLowerCase() === ".csv" ? chunkCsv(d.body) : chunkMarkdown(d.body);
    const rows = parts.map((p, i) => ({
      user_id: userId, source_id: src.id, heading: p.heading, body: p.body,
      ordinal: i, tags: tagsOf(p.body, d.path),
    }));

    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await db.from("knowledge_chunks").insert(rows.slice(i, i + 200));
      if (error) { console.error(`  ✗ ${d.path} chunk batch: ${error.message}`); break; }
    }
    chunkTotal += rows.length;
    console.log(`  ✓ ${d.path} — ${rows.length} chunks`);
  }

  console.log(`\nDone. ${docs.length} sources, ${chunkTotal} chunks.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
