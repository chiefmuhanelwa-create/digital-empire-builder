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
- Numbers spoken as words, printed as digits: say "fifteen thousand rand", put R15,000 on screen.

PLAIN SPEECH — no term stands alone
Every teaching unit takes three moves in this order: NAME IT -> SAY WHAT IT MEANS -> SAY WHAT TO DO.
  "Part one is access. That's the brand showing their product to your people. Open your last
   nine posts, tap View Insights, and add up the likes, comments, shares and saves."
Never three labels in a row — that is a slide, not speech.
Replace the metric name with what the number does: not "your engagement rate" but "the bigger
that number, the higher your price". Not "divide by reach" but "divide by how many people saw them".
Plain word over correct word. The industry word is the problem.
NEVER name a framework in beat 1. Name it at beat 8 and say what it means in the same breath.

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

/** GENERATE A SCRIPT, SLOT BY SLOT.
 *
 *  The studio was a form — every slot typed by hand, which is a worksheet, not
 *  a tool. This fills them from the corpus: the hook candidates, the beat-3
 *  story, the receipt, the outside voice, the mechanism. Everything it returns
 *  is drawn from retrieved rows and the ledger, and anything it could not find
 *  comes back in `missing` rather than invented.
 *
 *  Returns structured fields, not prose, so the studio can drop them straight
 *  into the form and the user edits from a filled page instead of a blank one.
 */
export const generateSlots = createServerFn({ method: "POST" })
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
    const [craft, evidence, ledgerRes] = await Promise.all([
      retrieve(context.userId, `${data.topic} hook beat voice rehook screen text`, ["skills", "icp"], 8),
      retrieve(context.userId, `${data.topic} ${data.pillar ?? ""} story confession receipt quote`, ["estate", "global"], 10),
      supabaseAdmin.from("ledger_entries").select("*").eq("user_id", context.userId),
    ]);
    const rows = [...evidence, ...craft];
    const ledger = (ledgerRes.data ?? []) as LedgerEntry[];

    if (!rows.length) {
      return {
        slots: null, sources: [], report: null,
        note: "Corpus is empty. Run the ingest first — without it this would only produce generic creator advice, which is the thing the tool exists to prevent.",
      };
    }

    const msg = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 2600,
      system: systemPrompt(ledger),
      messages: [{
        role: "user",
        content:
`RETRIEVED CONTEXT — everything you may draw on:

${renderContext(rows)}

---

TOPIC: ${data.topic}
PILLAR: ${data.pillar ?? "unassigned"}
HOUSE: ${data.style === "jatho" ? "Jatho — 23-45s, prohibition hook, tap path, seamless loop, no CTA" : "NoChill — 90-105s, FW-147 eleven beats, confession-led"}
FORMAT: ${data.format}

Return ONLY a JSON object, no prose around it, matching exactly:

{
  "hooks": [
    { "text": "spoken line", "screen": "MAX FIVE WORDS CAPS", "shape": "one of: sole_agent|conditional|borrowed_authority|event_callout|volume_credential|false_binary|substitution|time_credential|prohibition|confession_open|named_outcome|red_flags|superlative|handover", "why": "one line" }
  ],
  "symptom": "what they say, in their words",
  "money_cost": "the cost in rands or unpaid hours",
  "story": "beat 3 — first person, PAST TENSE, 25-35 words, the belief as it felt at the time",
  "receipt": "one figure from the verified ledger above, with its context",
  "outside_voice": "beat 6 — reported speech in quotes, from the context. Empty string if the context carries no real quote",
  "mechanism": "beat 8 — what changed, then the law generalised to YOU",
  "closing_question": "answerable in four words",
  "missing": ["anything a slot needed that the context did not supply"]
}

RULES
- Exactly three hooks. Each second person, each presupposing money they ALREADY earn.
- Screen text is the VERDICT, never a compression of the spoken line. No punctuation. No category words (creators, audience, entrepreneurs, the 9 to 5).
- "receipt" must be a figure from the VERIFIED list in your system prompt. If there is none, return "" and add it to missing.
- "outside_voice" must be a real quote from the retrieved context. Never invent one. Empty string if none exists.
- Put anything you could not source into "missing". Naming the gap is the correct output — inventing to fill it is the failure this tool exists to prevent.`,
      }],
    });

    const raw = msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
    let slots: any = null;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      slots = m ? JSON.parse(m[0]) : null;
    } catch {
      return { slots: null, sources: rows, report: null, note: "The model returned something that was not valid JSON. Try again — nothing was saved." };
    }

    const joined = [slots?.story, slots?.receipt, slots?.outside_voice, slots?.mechanism,
                    ...(slots?.hooks ?? []).map((h: any) => h?.text)].filter(Boolean).join("\n");
    const report = checkScript(joined, ledger);

    return { slots, sources: rows, report, note: null };
  });
