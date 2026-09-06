// THE CONFLICT CHECK — pure, client-safe, no AI.
//
// Answers the one question every South African agency asks before a contract is
// drafted: "Have you worked with any competing brand in the past X months?"
//
// From the agency archive — 23 agencies, six years of briefs:
//
//   · "Confirm competitor check" sits at step 2 of the standard workflow,
//     inside a 24-48 hour response deadline.
//   · It is one of nine things demanded before a contract is drafted, alongside
//     ID number, address and bank details.
//   · Under "what kills deals" it is listed FIRST.
//
// And the scope is wider than creators assume. One observed clause read
// "all banking brands" for a four-month window — category-wide, not
// brand-specific. So a fintech deal signed in March silently disqualifies you
// from a banking brief in April, and you are expected to know that from memory,
// today, before the deadline passes.
//
// Answering wrong in one direction loses the brief. Answering wrong in the
// other direction breaches a signed contract. Nothing anywhere tracks it.

/** The categories agencies actually gate on. Broad on purpose — the observed
 *  clauses are written broadly, and a checker that is narrower than the
 *  contract is worse than no checker at all. */
export const CATEGORIES = [
  "Banking & fintech",
  "Insurance",
  "Telecoms",
  "Betting & gaming",
  "Alcohol",
  "Retail",
  "Food & FMCG",
  "Automotive",
  "Airline & travel",
  "Beauty & personal care",
  "Fashion",
  "Technology",
  "Energy & fuel",
  "Health & pharma",
  "Education",
  "Media & entertainment",
  "Property",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type ConflictDeal = {
  counterparty: string;
  category: string | null;
  status: string;
  exclusive_until: string | null;
  exclusivity_scope: string | null;
  delivered_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export type Conflict = {
  severity: "blocking" | "disclose";
  counterparty: string;
  reason: string;
  detail: string;
};

export type ConflictResult = {
  verdict: "clear" | "disclose" | "blocked";
  headline: string;
  /** The sentence to paste into the reply. Agencies want a direct answer, fast. */
  reply: string;
  conflicts: Conflict[];
};

function utcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

/** The date a deal counts as "worked with", for lookback purposes. Delivery is
 *  what an agency means — not when the lead arrived. */
function workedDate(d: ConflictDeal): string {
  return d.delivered_at ?? d.paid_at ?? d.created_at.slice(0, 10);
}

export function checkConflict(
  args: {
    /** The category of the brief you have been offered. */
    category: string;
    /** Lookback the agency asked about, in months. Briefs commonly say 3 or 6. */
    lookbackMonths?: number;
    deals: ConflictDeal[];
    today?: Date;
  },
): ConflictResult {
  const today = utcDay(args.today ?? new Date());
  const months = args.lookbackMonths ?? 6;
  const cutoff = new Date(today);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);

  const sameCategory = args.deals.filter(
    (d) => (d.category ?? "").trim().toLowerCase() === args.category.trim().toLowerCase(),
  );

  const conflicts: Conflict[] = [];

  // 1 · A live exclusivity clause. This one is not a judgement call — it is a
  //     contract term, and it blocks.
  for (const d of sameCategory) {
    if (!d.exclusive_until) continue;
    const until = utcDay(new Date(`${d.exclusive_until}T00:00:00Z`));
    if (until >= today) {
      conflicts.push({
        severity: "blocking",
        counterparty: d.counterparty,
        reason: `Exclusivity runs to ${d.exclusive_until} — ${daysBetween(today, until)} days left`,
        detail: d.exclusivity_scope?.trim()
          ? `Clause as recorded: “${d.exclusivity_scope.trim()}”`
          : "No clause text recorded. Check the signed contract before replying — scope is usually broader than the brand name.",
      });
    }
  }

  // 2 · Work inside the lookback window. Not necessarily disqualifying, but it
  //     is the thing you must disclose rather than hope goes unnoticed.
  for (const d of sameCategory) {
    if (conflicts.some((c) => c.counterparty === d.counterparty && c.severity === "blocking")) continue;
    if (!["delivered", "invoiced", "paid"].includes(d.status)) continue;
    const w = utcDay(new Date(`${workedDate(d)}T00:00:00Z`));
    if (w >= cutoff) {
      conflicts.push({
        severity: "disclose",
        counterparty: d.counterparty,
        reason: `Worked ${workedDate(d)} — inside the ${months}-month window`,
        detail: "Disclose it. Agencies check, and being told after signing is what ends relationships.",
      });
    }
  }

  const blocking = conflicts.filter((c) => c.severity === "blocking");
  const disclose = conflicts.filter((c) => c.severity === "disclose");

  if (blocking.length > 0) {
    return {
      verdict: "blocked",
      headline: `You cannot take this brief yet — ${blocking.length} live exclusivity clause${blocking.length > 1 ? "s" : ""}`,
      reply:
        "Thanks for thinking of me. I have a category exclusivity in place that runs to " +
        blocking.map((c) => c.reason.match(/\d{4}-\d{2}-\d{2}/)?.[0]).filter(Boolean).sort().pop() +
        ". I would rather tell you now than after a contract. Happy to be considered for anything after that date.",
      conflicts,
    };
  }

  if (disclose.length > 0) {
    return {
      verdict: "disclose",
      headline: `Nothing blocks you — but ${disclose.length} thing${disclose.length > 1 ? "s" : ""} to disclose`,
      reply: `Confirming the competitor check: I worked with ${disclose
        .map((c) => c.counterparty)
        .join(", ")} in the last ${months} months, in the same category. No exclusivity is in force. Flagging it up front so there are no surprises.`,
      conflicts,
    };
  }

  return {
    verdict: "clear",
    headline: "Clear. No conflict in your records.",
    reply: `Confirming the competitor check: I have not worked with a competing brand in this category in the last ${months} months, and I have no exclusivity in force.`,
    conflicts: [],
  };
}

/** Exclusivity windows currently running, for the dashboard. A creator should
 *  be able to see what they are locked out of without being asked. */
export function activeExclusivities(deals: ConflictDeal[], today = new Date()) {
  const t = utcDay(today);
  return deals
    .filter((d) => d.exclusive_until && utcDay(new Date(`${d.exclusive_until}T00:00:00Z`)) >= t)
    .map((d) => ({
      counterparty: d.counterparty,
      category: d.category ?? "Uncategorised",
      until: d.exclusive_until!,
      daysLeft: daysBetween(t, utcDay(new Date(`${d.exclusive_until}T00:00:00Z`))),
      scope: d.exclusivity_scope,
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
