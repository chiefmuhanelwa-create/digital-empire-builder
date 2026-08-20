// The canonical bridge between the Income Tracker and the PAIDS Auditor.
//
// WHY THIS FILE EXISTS
// ====================
// The Auditor asked buyers to type their five stream totals in by hand — while
// the Income Tracker was already holding their actual transactions, tagged by
// category, in a real table two clicks away. Every tool in the kit asked again
// for something another tool already knew, which is the main reason twenty-four
// tools read as twenty-four quizzes instead of one system.
//
// One map, imported by both, so the vocabularies cannot drift apart.

export type StreamId = "p" | "a" | "i" | "d" | "s";

export const STREAM_NAMES: Record<StreamId, string> = {
  p: "Products",
  a: "Ads & Affiliates",
  i: "Information",
  d: "Deals",
  s: "Services",
};

/**
 * Income Tracker category -> PAIDS stream.
 *
 * "Other Income" is deliberately absent. Mapping it anywhere would quietly
 * inflate one stream and skew the concentration score — the single number this
 * whole tool exists to produce. Unmapped income is reported to the buyer and
 * left for them to place, rather than guessed at.
 */
export const CATEGORY_TO_STREAM: Record<string, StreamId> = {
  "Brand Deal": "d",
  "Sponsored Post": "d",
  "Affiliate": "a",
  "Ad Revenue": "a",
  "Consulting": "s",
  "Product Sale": "p",
  // Added with this mapping: the Tracker had no category that could ever land
  // in Information, so the recurring stream the whole PAIDS argument turns on
  // was untrackable. A buyer could log a year of income and the Auditor would
  // still show I at zero.
  "Membership / Subscription": "i",
};

export const INCOME_CATEGORIES = [
  "Brand Deal",
  "Sponsored Post",
  "Affiliate",
  "Ad Revenue",
  "Consulting",
  "Product Sale",
  "Membership / Subscription",
  "Other Income",
] as const;

export interface StreamRollup {
  totals: Record<StreamId, number>;
  unmapped: number;
  counted: number;   // transactions used
  since: string | null; // earliest date included
}

export interface TxLike {
  type: string;
  amount: number;
  category: string;
  date: string;
}

/**
 * Roll income transactions up into the five streams.
 *
 * Expenses are excluded on purpose: PAIDS measures where revenue comes from,
 * and netting costs off a stream would make a profitable-but-costly stream look
 * smaller than a cheap one, which is a different question entirely.
 */
export function rollUp(transactions: TxLike[], monthsBack?: number): StreamRollup {
  const cutoff = monthsBack
    ? new Date(Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : null;

  const totals: Record<StreamId, number> = { p: 0, a: 0, i: 0, d: 0, s: 0 };
  let unmapped = 0;
  let counted = 0;
  let since: string | null = null;

  for (const t of transactions) {
    if (t.type !== "income") continue;
    if (cutoff && t.date < cutoff) continue;
    const amount = Math.max(0, Number(t.amount) || 0);
    if (amount <= 0) continue;

    counted++;
    if (!since || t.date < since) since = t.date;

    const stream = CATEGORY_TO_STREAM[t.category];
    if (stream) totals[stream] += amount;
    else unmapped += amount;
  }

  return { totals, unmapped, counted, since };
}
