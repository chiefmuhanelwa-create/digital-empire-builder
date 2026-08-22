// THE FOUNDING OFFER — real scarcity, or none at all.
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │ READ THIS BEFORE CHANGING ANYTHING IN THIS FILE.                          │
// │                                                                          │
// │ Our buyer is an auditor, an ethics officer, an academic. A fake counter   │
// │ does not merely fail to convert — it tells a credentialed professional    │
// │ exactly what we are, and they never come back. A finance leader who       │
// │ checks this page again in six weeks and finds the same "first 50" is      │
// │ gone permanently, and no copy recovers that.                             │
// │                                                                          │
// │ So every number here is either counted from real paid orders or it is     │
// │ not displayed. There is no timer that resets, no "only 3 left" that is    │
// │ always 3, and no urgency that survives its own deadline.                 │
// └──────────────────────────────────────────────────────────────────────────┘
//
// ⚠️ THE ONE PROMISE A HUMAN MUST KEEP:
// The page states the price goes to AFTER_PRICE_LABEL once CAP founding places
// are taken. The code cannot do that for you — it changes what the page says,
// not what Paystack charges. When the counter hits the cap you MUST raise the
// price on the product row. If you are not prepared to, set ACTIVE to false and
// the entire founding block disappears from the site. That is a perfectly good
// outcome; an unkept price promise is not.

export interface FoundingConfig {
  /** Set false and every founding/scarcity element vanishes site-wide. */
  active: boolean;
  /** How many people get the founding price. Must be a number you will honour. */
  cap: number;
  /** What the price becomes afterwards, exactly as it should read on the page. */
  afterPriceLabel: string;
  /** Why the discount exists. Stated plainly on the page — never "limited time!" */
  reason: string;
}

export const FOUNDATION_FOUNDING: FoundingConfig = {
  active: true,
  cap: 50,
  afterPriceLabel: "$147",
  reason:
    "The first fifty people are the ones who tell me what is broken, and that is worth a discount. It is not a sale and it is not coming back.",
};

export interface FoundingState {
  /** Real paid units, counted server-side. Null when the count could not load. */
  taken: number | null;
  cap: number;
  /** Places remaining. Null when unknown — the UI then shows nothing. */
  left: number | null;
  /** True once the cap is reached. The offer is genuinely over. */
  closed: boolean;
}

export function foundingState(taken: number | null, cfg: FoundingConfig): FoundingState {
  if (taken === null) return { taken: null, cap: cfg.cap, left: null, closed: false };
  const left = Math.max(0, cfg.cap - taken);
  return { taken, cap: cfg.cap, left, closed: left === 0 };
}

/**
 * What the counter should say.
 *
 * Deliberately phrased as places REMAINING rather than places taken. Both are
 * the same fact, but "3 of 50 sold" on a new product reads as nobody wants
 * this, and the temptation to inflate it is exactly how honest counters become
 * dishonest ones. Remaining is true on day one and true on day ninety.
 */
export function foundingLine(s: FoundingState): string | null {
  if (s.left === null) return null;
  if (s.closed) return null;
  if (s.left === 1) return "1 founding place left";
  return `${s.left} founding places left`;
}

/** Urgency that is true regardless of dates or counts: the loss is ongoing. */
export const ONGOING_COST =
  "Nothing about this gets cheaper by waiting. The only thing that changes is how much more you have given away by the time you start.";
