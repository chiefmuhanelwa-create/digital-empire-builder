import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAnthropic } from "@/lib/anthropic";
import { checkScript, type LedgerEntry } from "@/lib/ledger";

// GROUNDED GENERATION — retrieve first, write only from what came back.
//
// The distinction that matters: the model is not drawing on what it knows about
// content creation. Every request pulls the relevant rows out of this user's own
// corpus — the banks, the rulings, the skills, the constitution — and the model
// is instructed to use nothing else. Then the ledger checks what it produced.
//
// Opus 5. The existing tools in this codebase are pinned to 4.8 and Sonnet 4.6,
// which are a generation behind; new work should not inherit that.
const MODEL = "claude-opus-5";

type Retrieved = {
  chunk_id: string; source_path: string; source_title: string;
  collection: string; evidence_tier: string | null;
  heading: string | null; body: string; rank: number;
};

async function retrieve(userId: string, query: string, collections: string[] | null, limit: number) {
  const { data, error } = await supabaseAdmin.rpc("search_knowledge", {
    _user_id: userId, _query: query, _collections: collections, _limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Retrieved[];
}

function renderContext(rows: Retrieved[]): string {
  return rows.map((r, i) =>
    `[${i + 1}] ${r.source_title}${r.heading ? ` — ${r.heading}` : ""}` +
    `${r.evidence_tier ? ` (${r.evidence_tier})` : ""}\n` +
    `path: ${r.source_path}\n${r.body.slice(0, 2500)}`
  ).join("\n\n---\n\n");
}

/** The corpus is the authority; the model is the writer. Everything in this
 *  prompt exists to keep those roles that way round. */
function systemPrompt(ledger: LedgerEntry[]): string {
  const verified = ledger.filter((e) => e.status === "verified");
  const banned = ledger.filter((e) => e.status === "banned");

  const money = verified.filter((e) => e.value_number !== null)
    .map((e) => `  ${e.currency === "USD" ? "$" : "R"}${Number(e.value_number).toLocaleString("en-GB")} — ${e.label}${e.source ? ` (${e.source})` : ""}`)
    .join("\n");
  const quotes = verified.filter((e) => e.value_text)
    .map((e) => `  "${e.value_text}" — ${e.label}`).join("\n");
  const kill = banned
    .map((e) => `  ${e.value_number !== null ? Number(e.value_number).toLocaleString("en-GB") : e.value_text} — ${e.label}${e.replacement ? ` → use instead: ${e.replacement}` : ""}`)
    .join("\n");

  return `You write for one South African creator, using ONLY the retrieved context supplied in the user message.

THE RULE THAT OVERRIDES EVERY OTHER RULE
Use no fact, figure, story, quote or claim that is not in the retrieved context or the ledger below. You have general knowledge about content creation. Do not use it. Generic creator advice is the failure this tool exists to prevent — if the context does not support a line, leave the slot empty and say what is missing.

If a beat needs a bigger number than the ledger carries, the beat is wrong — not the number.

${money ? `VERIFIED FIGURES — the only figures you may write:\n${money}\n` : "The ledger holds no verified figures yet. Write NO figures at all.\n"}
${quotes ? `\nVERIFIED QUOTES — the only quotes you may attribute:\n${quotes}\n` : ""}
${kill ? `\n⛔ BANNED — never write these, in any form:\n${kill}\n` : ""}
HARD CONSTRAINTS
- Never name the employer, its acronym, its sector, or any shift pattern. Say "a full time job".
- Never name a family member, a home village, an agency, a tax practitioner, or any third party.
- Never state a total for awards. Say "award-winning" or name one.
- Rounding rounds DOWN, never up.
- Say "I was contracted at" or "I invoiced" — never "I earned" — of anything not confirmed received.
- Never assume or urge the viewer to quit their job. He never quit; that is the whole proposition.

VOICE, as measured in the retrieved context
- Median sentence around 5 words. Paragraphs 16–20 words.
- Never one sentence per line. Never [SHORT]/[LONG] tags.
- SA English. R199 and R1,800 — never R 199 or R199.00.

Cite the context you used by its [n] marker at the end of each beat you write.`;
}

/** Ask the corpus a question. Answers only from retrieved rows, with sources. */
export const askCorpus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      question: z.string().min(3).max(600),
      collections: z.array(z.string().max(20)).max(6).nullish(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const rows = await retrieve(context.userId, data.question, data.collections ?? null, 14);
    if (!rows.length) {
      return {
        answer: "Nothing in your corpus matches that. Either the question is outside what the estate covers, or the corpus has not been ingested yet.",
        sources: [] as Retrieved[],
      };
    }

    const { data: led } = await supabaseAdmin
      .from("ledger_entries").select("*").eq("user_id", context.userId);
    const ledger = (led ?? []) as LedgerEntry[];

    const msg = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: systemPrompt(ledger),
      messages: [{
        role: "user",
        content: `RETRIEVED CONTEXT — this is everything you may draw on:\n\n${renderContext(rows)}\n\n---\n\nQUESTION: ${data.question}\n\nAnswer only from the context above. Cite [n] markers. If the context does not answer it, say so plainly rather than filling the gap.`,
      }],
    });

    const answer = msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
    return { answer, sources: rows };
  });

/** Draft a script, grounded. Retrieval picks the story, the receipt and the
 *  voice rules; the ledger then checks what came back. */
export const draftGrounded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      topic: z.string().min(3).max(400),
      pillar: z.string().max(40).nullish(),
      style: z.enum(["nochill", "jatho"]).default("nochill"),
      format: z.string().max(40).default("epiphany"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const q = [data.topic, data.pillar ?? "", "story confession receipt hook beat"].join(" ");
    const [craft, evidence, ledgerRes] = await Promise.all([
      retrieve(context.userId, `${data.topic} hook beat voice ${data.style}`, ["skills", "icp"], 8),
      retrieve(context.userId, q, ["estate", "global"], 10),
      supabaseAdmin.from("ledger_entries").select("*").eq("user_id", context.userId),
    ]);

    const rows = [...evidence, ...craft];
    if (!rows.length) {
      return { draft: "", sources: [], report: null, note: "Corpus is empty — run the ingest before drafting, or this will only produce generic advice." };
    }

    const ledger = (ledgerRes.data ?? []) as LedgerEntry[];

    const msg = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 2400,
      system: systemPrompt(ledger),
      messages: [{
        role: "user",
        content:
`RETRIEVED CONTEXT — everything you may draw on:

${renderContext(rows)}

---

Draft a ${data.style === "jatho" ? "23–45 second mechanic-led" : "90–105 second confession-led"} script.

TOPIC: ${data.topic}
PILLAR: ${data.pillar ?? "unassigned"}
FORMAT: ${data.format}

Return, in this order:
1. THREE hook candidates. Each second person, each presupposing money the viewer ALREADY earns. For each: the spoken line, the screen text (max 5 words, capitals, no punctuation, a VERDICT — not a compression of the spoken line), and one line on why it works.
2. The beats, timed, using the beat map in the retrieved context. Fill each slot from the context — the story from the failure material, the receipt from the ledger figures above, the outside voice from a real quote if the context carries one.
3. A list headed MISSING: anything a beat needed that the context did not supply. Do not invent it. Naming the gap is the correct output.`,
      }],
    });

    const draft = msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
    const report = checkScript(draft, ledger);

    return { draft, sources: rows, report, note: null };
  });

/** What is actually in the corpus. */
export const corpusStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [srcRes, chunkRes] = await Promise.all([
      supabaseAdmin.from("knowledge_sources").select("collection, kind, title, path, evidence_tier").eq("user_id", context.userId),
      supabaseAdmin.from("knowledge_chunks").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    ]);
    const sources = srcRes.data ?? [];
    const byCollection: Record<string, number> = {};
    for (const s of sources) byCollection[s.collection] = (byCollection[s.collection] ?? 0) + 1;
    return { sources: sources.length, chunks: chunkRes.count ?? 0, byCollection, list: sources.slice(0, 200) };
  });
