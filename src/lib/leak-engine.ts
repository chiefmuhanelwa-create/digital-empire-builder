// THE LEAK — the arithmetic behind the Foundation Kit's flagship tool.
//
// THE PROBLEM IT SOLVES, AND WHY IT IS THE EXPENSIVE ONE
// =====================================================
// A credentialed professional does not have a marketing problem. They have a
// counting problem. They give away advisory work constantly — the "can I pick
// your brain" coffee, the document reviewed as a favour, the keynote nobody
// paid for, the ninety-second WhatsApp answer that took twenty years to be able
// to give — and they never once add it up. It is invisible precisely because
// each instance is small and each one feels like generosity.
//
// This is not a creator's problem. A creator with no audience has nothing to
// give away. This problem belongs specifically to someone whose expertise is
// already in demand and has never been priced, which is exactly the person the
// Accelerator is for.
//
// The output is a single number they cannot argue with, built from their own
// figures using the same method their own industry uses to price them.
//
// Pure functions, no dependencies — runs on the client for live feedback and on
// the server for the stored figure.

export interface Basis {
  /** How the charge-out rate is worked out. */
  mode: "package" | "known";
  /** Annual total package in rands, when mode = "package". */
  annualPackage: number | null;
  /** A rate they already charge, per hour, when mode = "known". */
  knownHourly: number | null;
}

export const EMPTY_BASIS: Basis = { mode: "package", annualPackage: null, knownHourly: null };

export interface LeakItem {
  id: string;
  kind: LeakKind;
  label: string;
  /** Times in the last twelve months. */
  timesPerYear: number;
  /** Minutes each, including the preparation nobody counts. */
  minutesEach: number;
}

export type LeakKind =
  | "brain-pick" | "review" | "talk" | "referral-advice"
  | "message" | "committee" | "mentoring" | "other";

export interface KindSpec {
  key: LeakKind;
  label: string;
  hint: string;
  /** What a firm would bill this as — used to explain the number, not to compute it. */
  billedAs: string;
  /** The sentence that stops it happening again, without burning the relationship. */
  script: string;
  /** Preparation and follow-up people forget to count, as a multiplier on the stated time. */
  hiddenTimeFactor: number;
}

export const KINDS: KindSpec[] = [
  {
    key: "brain-pick",
    label: "“Can I pick your brain?”",
    hint: "The coffee, the call, the corridor conversation that turns into consulting.",
    billedAs: "Advisory time",
    hiddenTimeFactor: 1.6, // travel, the thinking before, the email after
    script: "I'd love to help properly rather than badly over coffee. I do a paid session for exactly this — an hour, and you leave with it written down. Want me to send the details?",
  },
  {
    key: "review",
    label: "Reviewing someone's document",
    hint: "A policy, a plan, a proposal, a thesis — read as a favour.",
    billedAs: "Technical review",
    hiddenTimeFactor: 1.4,
    script: "Happy to review it. I charge for written reviews because the value is in the notes, not the reading. Here's what that costs — and if it's not the right time, no hard feelings.",
  },
  {
    key: "talk",
    label: "Speaking, unpaid",
    hint: "The keynote, the panel, the guest lecture, the church or industry event.",
    billedAs: "Speaking engagement",
    hiddenTimeFactor: 2.2, // prep and travel dwarf the stage time
    script: "I'd like to be there. My speaking fee is X — and where there's genuinely no budget, I ask for the recording and permission to use it. That works too.",
  },
  {
    key: "referral-advice",
    label: "Free advice to a referral",
    hint: "Someone sent them to you and you helped, then never sent anything.",
    billedAs: "Consultation",
    hiddenTimeFactor: 1.3,
    script: "Before we go further — this is the work I do paid. Let me send you what a proper engagement looks like, and you decide.",
  },
  {
    key: "message",
    label: "Answering on WhatsApp or email",
    hint: "The ninety-second answer it took twenty years to be able to give.",
    billedAs: "Ad-hoc advisory",
    hiddenTimeFactor: 1.2,
    script: "That's a bigger question than a message can hold. I've written it up properly — here's the link. If you want it applied to your situation specifically, that's what the paid session is for.",
  },
  {
    key: "committee",
    label: "Boards, committees, working groups",
    hint: "Your judgement, in a room, for nothing.",
    billedAs: "Non-executive time",
    hiddenTimeFactor: 1.8,
    script: "I'm glad to serve. I do want to name that this is professional time — either as a paid role, or capped at a number of hours a year so I can protect the paid work.",
  },
  {
    key: "mentoring",
    label: "Mentoring, informally",
    hint: "Standing sessions with juniors that never became a programme.",
    billedAs: "Coaching",
    hiddenTimeFactor: 1.3,
    script: "I want to keep doing this and I want it to be sustainable. I'm turning it into a small paid group — same time, same room, and you'd be first in.",
  },
  {
    key: "other",
    label: "Something else",
    hint: "Anything you do repeatedly, that you know, and nobody pays for.",
    billedAs: "Professional time",
    hiddenTimeFactor: 1.3,
    script: "I'm putting a price on this from now on. Here's what it costs and here's what you get.",
  },
];

export function kindSpec(k: LeakKind): KindSpec {
  return KINDS.find((x) => x.key === k) ?? KINDS[KINDS.length - 1];
}

// ─── The rate ───────────────────────────────────────────────────────────────
//
// Derived the way professional services firms actually price people, so the
// number survives an argument with an accountant.
//
//   cost rate  = annual package / productive hours
//   charge-out = cost rate x multiplier
//
// 1,760 is the standard working year after leave and public holidays
// (220 days x 8). The 2.5 multiplier is the conventional professional-services
// ratio covering overhead, non-billable time and margin — the same reason a
// firm bills a salaried consultant out at well over their salary cost. It is a
// benchmark, not a law, and the tool says so rather than presenting it as one.

export const PRODUCTIVE_HOURS = 1760;
export const CHARGE_OUT_MULTIPLIER = 2.5;

export function hourlyRate(b: Basis): number | null {
  if (b.mode === "known") {
    return b.knownHourly && b.knownHourly > 0 ? b.knownHourly : null;
  }
  if (!b.annualPackage || b.annualPackage <= 0) return null;
  return (b.annualPackage / PRODUCTIVE_HOURS) * CHARGE_OUT_MULTIPLIER;
}

export function costRate(b: Basis): number | null {
  if (b.mode === "known" || !b.annualPackage) return null;
  return b.annualPackage / PRODUCTIVE_HOURS;
}

// ─── The leak ───────────────────────────────────────────────────────────────

export interface ItemResult {
  item: LeakItem;
  spec: KindSpec;
  statedHours: number;
  trueHours: number;   // including the preparation nobody counts
  value: number;       // rands a year
}

export interface LeakResult {
  rate: number | null;
  items: ItemResult[];
  totalHours: number;
  totalValue: number;
  /** Working weeks a year, at 40 hours. */
  weeks: number;
  biggest: ItemResult | null;
}

export function calculate(basis: Basis, items: LeakItem[]): LeakResult {
  const rate = hourlyRate(basis);
  const results: ItemResult[] = items
    .filter((i) => i.timesPerYear > 0 && i.minutesEach > 0)
    .map((item) => {
      const spec = kindSpec(item.kind);
      const statedHours = (item.timesPerYear * item.minutesEach) / 60;
      const trueHours = statedHours * spec.hiddenTimeFactor;
      return { item, spec, statedHours, trueHours, value: rate ? trueHours * rate : 0 };
    })
    .sort((a, b) => b.value - a.value);

  const totalHours = results.reduce((a, r) => a + r.trueHours, 0);
  const totalValue = results.reduce((a, r) => a + r.value, 0);

  return {
    rate,
    items: results,
    totalHours,
    totalValue,
    weeks: totalHours / 40,
    biggest: results[0] ?? null,
  };
}

export function rands(n: number): string {
  return `R${Math.round(n).toLocaleString("en-ZA")}`;
}

/**
 * What the number means, said plainly. Deliberately avoids congratulating them
 * or scolding them — this audience responds to arithmetic, not to tone.
 */
export function readOut(r: LeakResult, basis: Basis): { headline: string; body: string } | null {
  if (!r.rate || r.totalValue <= 0) return null;

  const months = basis.mode === "package" && basis.annualPackage
    ? r.totalValue / (basis.annualPackage / 12)
    : null;

  if (r.totalValue < 20_000) {
    return {
      headline: `${rands(r.totalValue)} a year.`,
      body: "Modest — which usually means the log is incomplete rather than the leak being small. Most people forget the messages and the reviews entirely, because each one feels like nothing.",
    };
  }
  if (months && months >= 1) {
    return {
      headline: `${rands(r.totalValue)} a year.`,
      body: `That is ${months.toFixed(1)} months of your own package, given away in pieces small enough that you never noticed. Not one of these was a bad decision. Together they are a salary.`,
    };
  }
  return {
    headline: `${rands(r.totalValue)} a year.`,
    body: `${Math.round(r.totalHours)} hours — about ${r.weeks.toFixed(1)} working weeks of your expertise, delivered for nothing.`,
  };
}
