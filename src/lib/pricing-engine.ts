// THE CHARGE GATE — when to start charging, and what to charge.
//
// This is the one question the whole estate could not answer. It is Kea's, in
// her own words: "I am just not too certain in terms of pricing and at what
// point do I start charging." It is Lerato's, unasked — two people she coached
// won scholarships and she has never charged for any of it. And it is the
// second half of Unathi's "how to grow this into something that can eventually
// generate income".
//
// TWO SEPARATE QUESTIONS, ANSWERED IN ORDER
// =========================================
// "When do I start charging" is not a pricing question, and answering it with a
// number is why most advice here fails. It is a readiness question, and the
// honest answer is checkable rather than emotional — which matters enormously
// for this buyer, because their block is permission, not arithmetic.
//
// So: four conditions first. Then, and only then, the number.
//
// Pure functions, no dependencies. Runs on the client for live feedback and
// could run on a server later without change.

import { priceMirror, nudgeUp, type PriceVerdict } from "./offer-spine";

// ─── Part one: may I charge at all? ─────────────────────────────────────────

export interface Signals {
  /** Has more than one person asked you for this? */
  askedTwice: boolean;
  /** Have you delivered it at least once, and did it work? */
  deliveredOnce: boolean;
  /** The named result you are allowed to quote. Empty = you cannot quote one. */
  namedResult: string;
  /** What changes hands. A thing, not a feeling. */
  output: string;
  /** What it costs them NOT to have it. */
  costOfInaction: string;
}

export const EMPTY_SIGNALS: Signals = {
  askedTwice: false, deliveredOnce: false, namedResult: "", output: "", costOfInaction: "",
};

export interface Condition {
  id: string;
  label: string;
  why: string;
  met: boolean;
}

export function conditions(s: Signals): Condition[] {
  return [
    {
      id: "asked",
      label: "More than one person has asked you for this",
      why: "One request is a favour. Two is a market — it means the need exists outside the person who happened to ask.",
      met: s.askedTwice,
    },
    {
      id: "delivered",
      label: "You have delivered it once, and it worked",
      why: "You cannot price something you have never done. The first delivery is where you find out how long it actually takes.",
      met: s.deliveredOnce && s.namedResult.trim().length > 3,
    },
    {
      id: "output",
      label: "Something real changes hands",
      why: "A subject is what you know about. An artifact is what they keep. People pay for the second one.",
      met: s.output.trim().length > 3,
    },
    {
      id: "cost",
      label: "You can say what it costs them not to have it",
      why: "This is the price justification, and it is the sentence you will need when somebody hesitates. If you cannot say it, you will discount instead.",
      met: s.costOfInaction.trim().length > 5,
    },
  ];
}

export type Band = "charge-now" | "founding" | "one-more";

export interface GateVerdict {
  score: number;          // 0-4
  band: Band;
  headline: string;
  body: string;
  /** The exact next move. Never "reflect on" — always a verb. */
  action: string;
}

export function gate(s: Signals): GateVerdict {
  const score = conditions(s).filter((c) => c.met).length;

  if (score >= 3) {
    return {
      score, band: "charge-now",
      headline: "Charge. Now, on the next person who asks.",
      body: "You have demand, a delivery that worked, something that changes hands, and a reason it is worth money. There is no further qualification to earn — the only thing between you and being paid is saying a number out loud.",
      action: "Set the price below, then say it to the next person who asks. Do not offer a discount they did not request.",
    };
  }
  if (score === 2) {
    return {
      score, band: "founding",
      headline: "Charge a founding price, to the first three only.",
      body: "You have enough to charge and not enough to charge full. A founding price solves both: it is real money, so you find out whether people will actually pay, and it is honestly framed, so you are not underpricing yourself permanently.",
      action: "Pick your number below, take 40% off it for the first three people, and put an end date on it in writing.",
    };
  }
  return {
    score, band: "one-more",
    headline: "Do it once more free — on purpose, and on your terms.",
    body: "Not because you are not ready. Because you are missing the one thing that makes charging easy: a result you are allowed to quote. Give it away once more deliberately, and collect that instead of money.",
    action: "Agree it in advance: you deliver free, and in return they give you a written sentence about what changed. That sentence is worth more than the fee you skipped.",
  };
}

// ─── Part two: what is the number? ──────────────────────────────────────────
//
// Three floors, and the recommendation is the HIGHEST of them. Not the average —
// a floor is a floor. Averaging them would let the weakest input drag the price
// down, which is the exact failure this tool exists to prevent.

export interface PriceInputs {
  /** Honest hours to deliver once, including preparation. */
  hours: number | null;
  /** Their charge-out rate, ideally pulled from the Leak audit. */
  hourlyRate: number | null;
  /** What the result is worth to the buyer, in rands, over a year. */
  outcomeValue: number | null;
}

export const EMPTY_INPUTS: PriceInputs = { hours: null, hourlyRate: null, outcomeValue: null };

/**
 * The invisible work around a delivery — the email before, the notes after, the
 * thinking on the drive. Modest on purpose: the Leak already applies per-kind
 * factors up to 2.2, but a paid engagement is more contained than a favour.
 */
export const PREP_FACTOR = 1.3;

/** Share of the outcome a fair price takes. Below this you are donating. */
export const OUTCOME_SHARE_LOW = 0.10;
export const OUTCOME_SHARE_HIGH = 0.20;

export interface Floor {
  id: string;
  name: string;
  amount: number;
  how: string;
  /** Null when the buyer has not given enough to compute it. */
  missing?: string;
}

export function floors(i: PriceInputs): Floor[] {
  const out: Floor[] = [];

  if (i.hours && i.hourlyRate) {
    const trueHours = i.hours * PREP_FACTOR;
    out.push({
      id: "time",
      name: "The time floor",
      amount: trueHours * i.hourlyRate,
      how: `${i.hours}h to deliver, ×${PREP_FACTOR} for the work around it, at R${Math.round(i.hourlyRate).toLocaleString("en-ZA")}/hour. Below this you are paying to work.`,
    });
  } else {
    out.push({
      id: "time", name: "The time floor", amount: 0, how: "",
      missing: i.hourlyRate ? "How many hours does one delivery take?" : "Run The Leak first — it works out your hourly rate from your package.",
    });
  }

  if (i.outcomeValue && i.outcomeValue > 0) {
    out.push({
      id: "outcome",
      name: "The outcome floor",
      amount: i.outcomeValue * OUTCOME_SHARE_LOW,
      how: `A tenth of what the result is worth to them. If it is worth R${Math.round(i.outcomeValue).toLocaleString("en-ZA")}, then R${Math.round(i.outcomeValue * OUTCOME_SHARE_LOW).toLocaleString("en-ZA")} is the modest end and R${Math.round(i.outcomeValue * OUTCOME_SHARE_HIGH).toLocaleString("en-ZA")} is defensible.`,
    });
  } else {
    out.push({
      id: "outcome", name: "The outcome floor", amount: 0, how: "",
      missing: "What is this worth to them over a year, in rands?",
    });
  }

  // The seriousness floor is fixed, and it is the one nobody wants to hear.
  out.push({
    id: "serious",
    name: "The seriousness floor",
    amount: 1000,
    how: "Under R1,000 a buyer files your expertise next to an ebook. This is not about your worth — it is about which mental category they put you in before they have met you.",
  });

  return out;
}

export interface Recommendation {
  amount: number;
  from: string;
  note: string;
  mirror: PriceVerdict | null;
}

export function recommend(i: PriceInputs): Recommendation | null {
  const usable = floors(i).filter((f) => !f.missing && f.amount > 0);
  if (usable.length === 0) return null;

  const top = usable.reduce((a, b) => (b.amount > a.amount ? b : a));
  const amount = Math.round(top.amount / 50) * 50; // a price, not a calculation

  return {
    amount,
    from: top.name,
    note: usable.length === 1
      ? "Only one floor could be worked out. Fill in the rest and this gets sharper — right now it is a starting point, not an answer."
      : `Three floors, and the highest wins. Averaging them would let your weakest input pull the price down, which is the mistake this is here to stop.`,
    mirror: priceMirror(amount),
  };
}

// ─── The sentences they will actually need ──────────────────────────────────

/** A founding price only works if it visibly ends. Without that it is just a low price. */
export function foundingOffer(full: number): { price: number; sentence: string } {
  const price = Math.round((full * 0.6) / 50) * 50;
  return {
    price,
    sentence: `I'm taking the first three people at R${price.toLocaleString("en-ZA")} instead of R${full.toLocaleString("en-ZA")}. Not a sale — I want three results I can point to. After the third it goes to the full price, and I won't be reopening it.`,
  };
}

/** When to raise, expressed as a trigger rather than a date. */
export function raiseTrigger(current: number): string {
  const next = nudgeUp(current);
  return `Raise it to R${next.toLocaleString("en-ZA")} once three people have paid without hesitating. Hesitation is the signal — if nobody flinches, you are under the market, and waiting for a round number on the calendar just costs you the difference.`;
}

/** For the person who has always had it free and now has to be told. */
export function transitionScript(offerName: string, price: number): string {
  const name = offerName.trim() || "this";
  return `I've started charging for ${name} — R${price.toLocaleString("en-ZA")}.\n\nI'm telling you directly because you've asked me before and I don't want it to be a surprise. Nothing about how I help you changes; the only difference is that it is now a proper piece of work rather than something I squeeze in.\n\nIf the timing isn't right, say so and there are no hard feelings at all.`;
}
