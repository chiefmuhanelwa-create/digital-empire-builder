// THE VERIFIED-FIGURE GATE — pipeline Stage 11. Pure, client-safe, no AI.
//
// You type a number you are about to say in public. This checks it against
// what your own records actually show, and tells you what you can say instead.
//
// Why this exists, and it is not theoretical:
//
// The founder audited ten figures he had stated publicly about his own
// business — rates, totals, list sizes, engagement. Ten were wrong. Every
// single one was wrong in the direction that flattered him, and not one was
// wrong the other way. There was no intent to deceive anywhere in it. Memory
// simply does not drift randomly; it drifts toward the version that makes the
// teller look better, and it is invisible from the inside.
//
// One of those figures — a loss attributed to undercharging — had been
// repeated across 23 files and 46 separate places before anybody searched 681
// financial records and found no match for it.
//
// So the rule this tool enforces is the one that would have caught it:
//
//   When a claim needs a bigger number than the receipt supports,
//   the claim is wrong — not the receipt.
//
// And the rounding rule that follows from it: round DOWN, always, and say so.
// "Over R5,000" is defensible under challenge. "About R5,000" is a guess
// wearing a hedge, and "roughly R6,000" on a R5,800 receipt is just a lie with
// good manners.

export type ClaimType =
  | "rate_for_deliverable"
  | "total_from_deals"
  | "best_month"
  | "total_income"
  | "brand_count";

export type Verdict = "verified" | "overstated" | "understated" | "no_record";

export type GateInput = {
  claim: ClaimType;
  /** The number you want to say. For brand_count this is a count, not rands. */
  value: number;
  /** Only for rate_for_deliverable. */
  deliverable?: string;
  deals: Array<{
    status: string;
    amount: number;
    currency: string;
    deliverable: string;
    counterparty: string;
    paid_at: string | null;
  }>;
  income: Array<{ type: string; amount: number; date: string }>;
};

export type GateResult = {
  verdict: Verdict;
  /** What the records actually support. Null when there is no record at all. */
  supported: number | null;
  /** Sample size behind `supported`. */
  n: number;
  headline: string;
  detail: string;
  /** The sentence you can defend. Empty when there is nothing to say yet. */
  sayInstead: string;
  /** Extra context worth seeing — range, dates, names. */
  evidence: string[];
};

// House style is R1,800 — comma thousands, full stop decimal. en-ZA renders
// "R1 800,00" with a non-breaking space, which the brief bans; en-GB gives the
// documented format. All 46 currency call sites across this codebase were
// converted on 2026-09-07. Date formatting deliberately stays on en-ZA — SA
// date order is correct there, and only the currency was ever wrong.
function rand(n: number) {
  return `R${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Round DOWN to a clean number you can say out loud. Never up — that is the
 *  whole discipline. R8,740 becomes "over R8,000", not "nearly R9,000". */
export function roundDownPhrase(n: number): string {
  if (n <= 0) return "R0";
  const step = n >= 100_000 ? 10_000 : n >= 10_000 ? 1_000 : n >= 1_000 ? 100 : 10;
  const floored = Math.floor(n / step) * step;
  return `over R${floored.toLocaleString("en-GB")}`;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}

export function checkFigure(input: GateInput): GateResult {
  const paidZar = input.deals.filter((d) => d.status === "paid" && d.currency === "ZAR");

  // ── gather the supporting record ───────────────────────────────────────────
  let supported: number | null = null;
  let n = 0;
  const evidence: string[] = [];
  let subject = "";

  if (input.claim === "rate_for_deliverable") {
    const key = (input.deliverable ?? "").trim().toLowerCase();
    const matches = paidZar.filter((d) => d.deliverable.trim().toLowerCase() === key);
    n = matches.length;
    subject = `your rate for “${input.deliverable?.trim()}”`;
    if (n > 0) {
      const amounts = matches.map((d) => d.amount);
      supported = median(amounts);
      evidence.push(`${n} paid deal${n > 1 ? "s" : ""}, ${rand(Math.min(...amounts))} to ${rand(Math.max(...amounts))}`);
      if (n === 1) evidence.push("One data point. Treat it as provisional until there is a second.");
    }
  } else if (input.claim === "total_from_deals") {
    n = paidZar.length;
    subject = "what you have earned from deals";
    if (n > 0) {
      supported = paidZar.reduce((s, d) => s + d.amount, 0);
      const dates = paidZar.map((d) => d.paid_at).filter(Boolean).sort() as string[];
      if (dates.length) evidence.push(`${n} paid deals, ${dates[0]} to ${dates[dates.length - 1]}`);
    }
  } else if (input.claim === "brand_count") {
    const names = new Set(paidZar.map((d) => d.counterparty.trim().toLowerCase()).filter(Boolean));
    n = paidZar.length;
    subject = "how many brands have paid you";
    if (names.size > 0) {
      supported = names.size;
      evidence.push(`${names.size} distinct counterpart${names.size > 1 ? "ies" : "y"} across ${n} paid deals`);
    }
  } else if (input.claim === "best_month" || input.claim === "total_income") {
    const inc = input.income.filter((t) => t.type === "income");
    n = inc.length;
    if (input.claim === "total_income") {
      subject = "your total logged income";
      if (n > 0) supported = inc.reduce((s, t) => s + t.amount, 0);
    } else {
      subject = "your best month";
      const byMonth = new Map<string, number>();
      for (const t of inc) {
        const m = t.date.slice(0, 7);
        byMonth.set(m, (byMonth.get(m) ?? 0) + t.amount);
      }
      if (byMonth.size > 0) {
        let bestM = "";
        let best = 0;
        for (const [m, v] of byMonth) if (v > best) { best = v; bestM = m; }
        supported = best;
        n = byMonth.size;
        evidence.push(`Best of ${byMonth.size} month${byMonth.size > 1 ? "s" : ""} logged: ${bestM}`);
      }
    }
  }

  // ── no record at all ───────────────────────────────────────────────────────
  if (supported === null || n === 0) {
    return {
      verdict: "no_record",
      supported: null,
      n: 0,
      headline: "Nothing in your records supports this yet",
      detail: `You have not logged anything that establishes ${subject}. That does not make the number false — it makes it unsourced, which is the thing you cannot defend if somebody asks.`,
      sayInstead: "",
      evidence: ["Log the deal or the payment first. Then the number is yours to use."],
    };
  }

  const isCount = input.claim === "brand_count";
  const fmt = (x: number) => (isCount ? String(Math.round(x)) : rand(x));

  // 3% either way absorbs rounding and cents, not exaggeration.
  const ratio = input.value / supported;

  if (ratio > 1.03) {
    const over = input.value - supported;
    return {
      verdict: "overstated",
      supported,
      n,
      headline: `Your records support ${fmt(supported)}, not ${fmt(input.value)}`,
      detail: `That is ${fmt(over)} more than anything you have logged — a ${Math.round((ratio - 1) * 100)}% overstatement. It is almost certainly not a lie. It is the direction memory always drifts, and it is invisible from the inside, which is exactly why it needs checking before it is said out loud.`,
      sayInstead: isCount
        ? `${Math.round(supported)} brands have paid me`
        : `${roundDownPhrase(supported)} — and I can show you every line`,
      evidence,
    };
  }

  if (ratio < 0.97) {
    return {
      verdict: "understated",
      supported,
      n,
      headline: `You are underselling. Your records support ${fmt(supported)}`,
      detail: `You said ${fmt(input.value)}. Your own logged records are higher than that. This is the rarer error and it costs just as much — a rate quoted below what you have actually been paid sets the ceiling for everything that follows it.`,
      sayInstead: isCount
        ? `${Math.round(supported)} brands have paid me`
        : `${roundDownPhrase(supported)} — and I can show you every line`,
      evidence,
    };
  }

  return {
    verdict: "verified",
    supported,
    n,
    headline: `Verified. Your records support ${fmt(supported)}`,
    detail: `Say it. Not because it sounds good, but because if somebody asks you to prove it, you can — from ${n} record${n > 1 ? "s" : ""} you logged yourself.`,
    sayInstead: isCount
      ? `${Math.round(supported)} brands have paid me`
      : `${roundDownPhrase(supported)} — and I can show you every line`,
    evidence,
  };
}

export const CLAIM_LABELS: Record<ClaimType, string> = {
  rate_for_deliverable: "My rate for a specific deliverable",
  total_from_deals: "Total I have earned from brand deals",
  best_month: "My best month",
  total_income: "Total I have earned",
  brand_count: "How many brands have paid me",
};
