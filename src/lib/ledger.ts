// THE LEDGER ENGINE — pure, client-safe, no AI anywhere in it.
//
// It reads a script, pulls out every checkable claim, and matches each one
// against the user's own entries. It cannot invent a figure because it does not
// write — it only ever says verified, unverified, banned, or no record.
//
// The design decision that matters: NO RECORD IS NOT AN ERROR. A creator who
// has logged four entries will trip it constantly, and a tool that shouts at
// them on day one gets closed. `no_record` means "the ledger cannot confirm
// this yet" and offers one tap to add it. `banned` is the only hard stop.

export type LedgerKind = "money" | "quote" | "platform" | "count" | "date" | "other";
export type LedgerStatus = "verified" | "unverified" | "banned";

export type LedgerEntry = {
  id: string;
  kind: string;
  label: string;
  value_number: number | null;
  currency: string | null;
  value_text: string | null;
  status: string;
  source: string | null;
  occurred_on: string | null;
  counterparty: string | null;
  replacement: string | null;
  notes: string | null;
};

export const LEDGER_KINDS: { key: LedgerKind; label: string; hint: string }[] = [
  { key: "money", label: "Money", hint: "An amount that arrived, was invoiced, or was contracted. Say which — they are not the same thing." },
  { key: "quote", label: "Quote", hint: "Something a real person actually said or wrote. The exact words." },
  { key: "platform", label: "Platform", hint: "A payout, a termination, a follower count, a list size." },
  { key: "count", label: "Count", hint: "Brands, agencies, awards, subscribers, years." },
  { key: "date", label: "Date", hint: "When something happened, where the date itself is the claim." },
  { key: "other", label: "Other", hint: "Anything else you would have to defend if challenged." },
];

export type Claim = {
  raw: string;          // exactly as it appeared
  kind: "money" | "percent" | "count" | "quote";
  value: number | null;
  currency?: string;
  context: string;      // the sentence it sat in
  offset: number;
};

const MONEY_RE = /(?:R|ZAR\s?)\s?(\d{1,3}(?:[ ,]\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)|(?:\$|USD\s?)\s?(\d{1,3}(?:[ ,]\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
const PERCENT_RE = /(\d+(?:\.\d+)?)\s?%/g;
const COUNT_RE = /\b(\d{1,3}(?:[ ,]\d{3})+|\d{2,})\b(?!\s?%)/g;
const QUOTE_RE = /[""]([^""]{8,300})[""]|"([^"]{8,300})"/g;

function num(s: string): number {
  return Number(s.replace(/[ ,]/g, ""));
}

function sentenceAround(text: string, i: number): string {
  const start = Math.max(0, text.lastIndexOf(".", i) + 1);
  const endDot = text.indexOf(".", i);
  const end = endDot === -1 ? text.length : endDot + 1;
  return text.slice(start, end).trim().slice(0, 240);
}

/** Pull every checkable claim out of a block of script text. */
export function extractClaims(text: string): Claim[] {
  if (!text?.trim()) return [];
  const out: Claim[] = [];
  const seen = new Set<string>();

  const push = (c: Claim) => {
    const k = `${c.kind}:${c.raw.toLowerCase()}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(c);
  };

  for (const m of text.matchAll(MONEY_RE)) {
    const zar = m[1], usd = m[2];
    push({
      raw: m[0].trim(), kind: "money",
      value: num(zar ?? usd ?? "0"),
      currency: zar ? "ZAR" : "USD",
      context: sentenceAround(text, m.index ?? 0), offset: m.index ?? 0,
    });
  }
  for (const m of text.matchAll(PERCENT_RE)) {
    push({ raw: m[0].trim(), kind: "percent", value: Number(m[1]), context: sentenceAround(text, m.index ?? 0), offset: m.index ?? 0 });
  }
  for (const m of text.matchAll(QUOTE_RE)) {
    const q = (m[1] ?? m[2] ?? "").trim();
    if (q) push({ raw: q, kind: "quote", value: null, context: sentenceAround(text, m.index ?? 0), offset: m.index ?? 0 });
  }
  for (const m of text.matchAll(COUNT_RE)) {
    const v = num(m[1]);
    // Skip anything already caught as money, and skip plausible years.
    if (out.some((c) => c.value === v && c.kind === "money")) continue;
    if (v >= 1900 && v <= 2100) continue;
    if (v < 10) continue;
    push({ raw: m[0].trim(), kind: "count", value: v, context: sentenceAround(text, m.index ?? 0), offset: m.index ?? 0 });
  }

  return out.sort((a, b) => a.offset - b.offset);
}

export type ClaimVerdict = {
  claim: Claim;
  verdict: "verified" | "unverified" | "banned" | "no_record";
  entry?: LedgerEntry;
  message: string;
  /** For banned: what to say instead. */
  replacement?: string;
};

function normQuote(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Match one claim against the ledger. Banned is checked FIRST — a banned
 *  figure that also happens to sit in a verified row must still be refused. */
export function checkClaim(claim: Claim, entries: LedgerEntry[]): ClaimVerdict {
  const banned = entries.filter((e) => e.status === "banned");
  const usable = entries.filter((e) => e.status !== "banned");

  const numMatch = (e: LedgerEntry) =>
    claim.value !== null && e.value_number !== null && Math.abs(Number(e.value_number) - claim.value) < 0.005;

  const quoteMatch = (e: LedgerEntry) => {
    if (claim.kind !== "quote" || !e.value_text) return false;
    const a = normQuote(claim.raw), b = normQuote(e.value_text);
    return a === b || b.includes(a) || a.includes(b);
  };

  const hitBanned = banned.find((e) => numMatch(e) || quoteMatch(e));
  if (hitBanned) {
    return {
      claim, verdict: "banned", entry: hitBanned,
      replacement: hitBanned.replacement ?? undefined,
      message: hitBanned.replacement
        ? `Banned — ${hitBanned.label}. Use instead: ${hitBanned.replacement}`
        : `Banned — ${hitBanned.label}. No replacement recorded; add one so this does not come back under deadline.`,
    };
  }

  const hit = usable.find((e) => numMatch(e) || quoteMatch(e));
  if (hit) {
    if (hit.status === "unverified") {
      return {
        claim, verdict: "unverified", entry: hit,
        message: `In the ledger as UNVERIFIED — ${hit.label}. Say "I was contracted at" or "I invoiced", never "I earned", until a source is attached.`,
      };
    }
    const src = hit.source ? ` — ${hit.source}` : "";
    const when = hit.occurred_on ? `, ${hit.occurred_on}` : "";
    return { claim, verdict: "verified", entry: hit, message: `${hit.label}${when}${src}` };
  }

  return {
    claim, verdict: "no_record",
    message: claim.kind === "quote"
      ? "No record of anyone saying this. A quote that cannot be produced is the fastest way to lose the one channel."
      : "Not in your ledger yet. Add it with its source, or take it out of the script.",
  };
}

export type LedgerReport = {
  verdicts: ClaimVerdict[];
  verified: number;
  unverified: number;
  banned: number;
  noRecord: number;
  /** A script with any banned claim does not ship. */
  blocked: boolean;
  headline: string;
};

export function checkScript(text: string, entries: LedgerEntry[]): LedgerReport {
  const verdicts = extractClaims(text).map((c) => checkClaim(c, entries));
  const n = (v: string) => verdicts.filter((x) => x.verdict === v).length;
  const banned = n("banned"), noRecord = n("no_record"), unverified = n("unverified"), verified = n("verified");

  const headline =
    banned > 0
      ? `${banned} banned ${banned === 1 ? "figure" : "figures"} in this script. It does not ship until they are out.`
      : noRecord > 0
        ? `${noRecord} ${noRecord === 1 ? "claim has" : "claims have"} no record yet. Add the source, or cut the claim.`
        : unverified > 0
          ? `${unverified} unverified. Usable with a hedge — "I was contracted at", never "I earned".`
          : verdicts.length === 0
            ? "No checkable claims in this script yet."
            : `All ${verified} ${verified === 1 ? "figure" : "figures"} trace to a source.`;

  return { verdicts, verified, unverified, banned, noRecord, blocked: banned > 0, headline };
}

/** Rounding rounds DOWN. Stating more than the receipt supports is the failure
 *  this whole thing exists to stop, and it is always the flattering direction. */
export function roundDown(n: number, currency = "ZAR"): string {
  const sym = currency === "USD" ? "$" : "R";
  if (n >= 100000) return `over ${sym}${(Math.floor(n / 10000) * 10000).toLocaleString("en-GB")}`;
  if (n >= 10000) return `over ${sym}${(Math.floor(n / 1000) * 1000).toLocaleString("en-GB")}`;
  if (n >= 1000) return `over ${sym}${(Math.floor(n / 100) * 100).toLocaleString("en-GB")}`;
  return `${sym}${Math.floor(n).toLocaleString("en-GB")}`;
}

/** Seeded on first open so the ledger is never an empty box. These are the
 *  shapes a creator needs, not this founder's numbers — the labels prompt, the
 *  values stay blank. */
export const LEDGER_PROMPTS: { kind: LedgerKind; label: string; hint: string }[] = [
  { kind: "money", label: "Highest fee actually received", hint: "Received, not invoiced, not contracted." },
  { kind: "money", label: "Your standing rate before you costed one properly", hint: "The before half of the before-and-after." },
  { kind: "money", label: "Your first ever paid deal", hint: "The number and the year." },
  { kind: "money", label: "Lifetime bank-confirmed total", hint: "Only rows where the money arrived." },
  { kind: "quote", label: "What someone on the brand side actually said", hint: "Their exact words. This is the beat-6 slot and it measured 5.3×." },
  { kind: "platform", label: "A payout that stopped", hint: "What it was paying, and when it ended." },
  { kind: "platform", label: "Your reachable list, now", hint: "Not list size — how many actually open." },
  { kind: "count", label: "Brands and agencies you have invoiced", hint: "Countable, defensible, and almost nobody has it." },
];
