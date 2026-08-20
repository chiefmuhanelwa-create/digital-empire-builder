import raw from "./data/hooks-120.json";
import type { Offer } from "./offer-spine";

// THE HOOK BANK — ported from the content system, where it was 120 hooks
// annotated against R x A x C x U^B and used by one person: the founder.
//
// THE PORT PROBLEM, AND WHY THIS FILE EXISTS
// ==========================================
// Roughly a fifth of these hooks are not patterns — they are HIS life.
// "I went from sleeping in university bathrooms to R600K" is not a template a
// buyer can fill in; used as-is it makes them claim a story that isn't theirs,
// and this audience is credentialed people whose whole asset is being
// trustworthy. Handing them borrowed proof is the fastest way to cost them the
// thing they came here to monetise.
//
// So the bank ships with every hook classified. Founder-story hooks are shown
// as STRUCTURE ONLY, with the shape named and the buyer told to bring their own
// facts. Everything else can be personalised from their offer spine.

export interface RacubNote {
  relevant: string;
  awareness: string;
  clarity: string;
  unique: string;
  broadened: string;
}

export interface Hook {
  id: number;
  hook: string;
  r_a_c_u_b: RacubNote;
}

export interface HookCategory {
  id: number;
  category: string;
  description: string;
  count: number;
  emotional_impact: string;
  best_for: string[];
  hooks: Hook[];
}

interface Bank {
  name: string;
  version: string;
  description: string;
  total_hooks: number;
  categories: HookCategory[];
}

export const BANK = raw as unknown as Bank;
export const CATEGORIES: HookCategory[] = BANK.categories;
export const ALL_HOOKS: Hook[] = CATEGORIES.flatMap((c) => c.hooks);

// ─── Founder-story detection ────────────────────────────────────────────────
//
// Deliberately over-inclusive. A false positive costs a buyer nothing — they
// are told to write their own version of a hook that might have been reusable.
// A false negative puts someone else's receipts in their mouth.

const FOUNDER_MARKERS: RegExp[] = [
  /\bR\s?\d[\d,\s]*(k|K)?\b/,          // any rand figure — proof is never generic
  /\$\d/,                               // dollar figures likewise
  /\b\d{2,3}\s?[kK]\b/,                 // 780K, 600K
  /bathroom/i,
  /\bmy (mother|mom|mum|father|dad|son|sons|wife|partner)\b/i,
  /\bI went from\b/i,
  /\bI (lost|made|earned|built|paid|owed|got paid)\b/i,
  /\bmy first\b/i,
  /\buniversity\b/i,
  /\balgorithm (killed|changed|deleted)\b/i,
  /\bfollowers?\b.*\b(lost|deleted|gone|suspended)\b/i,
  /\b(brand deal|retainer|payout|affiliate)\b/i,
];

export function isFounderStory(h: Hook): boolean {
  return FOUNDER_MARKERS.some((re) => re.test(h.hook));
}

/**
 * What shape a founder-story hook is, so a buyer can rebuild it with their own
 * facts instead of copying the words. This is the actual teachable part.
 */
export function structureOf(h: Hook): string {
  const t = h.hook;
  if (/\bI went from\b/i.test(t)) return "Before -> After, with a real number at each end.";
  if (/\b(lost|owed|paid)\b/i.test(t)) return "The cost of the mistake, stated plainly, before the lesson.";
  if (/\bmy first\b/i.test(t)) return "The first time it happened, small and specific.";
  if (/\b(brand deal|retainer|payout|affiliate)\b/i.test(t)) return "A named transaction, with the number attached.";
  if (/\bfollowers?\b/i.test(t)) return "The thing you built, and what happened to it.";
  return "A specific event with a date or a figure attached.";
}

// ─── Personalisation ────────────────────────────────────────────────────────

const GENERIC_YOU = [
  { re: /\bcreators?\b/gi, key: "who" },
  { re: /\bentrepreneurs?\b/gi, key: "who" },
  { re: /\bpeople\b/gi, key: "who" },
] as const;

/**
 * Rewrite a reusable hook around this buyer's own offer. Only touches the
 * audience noun and appends nothing — a hook that has been padded with their
 * outcome stops being a hook and becomes a sentence.
 */
export function personalise(h: Hook, o: Offer): string | null {
  const who = o.who.trim();
  if (!who) return null;
  let out = h.hook;
  let hit = false;
  for (const g of GENERIC_YOU) {
    if (g.re.test(out)) {
      out = out.replace(g.re, who);
      hit = true;
    }
    g.re.lastIndex = 0;
  }
  return hit && out !== h.hook ? out : null;
}

// ─── Scoring ────────────────────────────────────────────────────────────────
//
// The bank ships with qualitative R/A/C/U/B notes, not numbers. Scoring is the
// buyer's job — that is the skill the Accelerator teaches — so the tool gives
// them the axes and the arithmetic and refuses to invent the values.

export const AXES = [
  { key: "relevant", letter: "R", label: "Relevant", q: "Is this their problem, today?" },
  { key: "awareness", letter: "A", label: "Awareness", q: "Do they already know they have it?" },
  { key: "clarity", letter: "C", label: "Clarity", q: "Understood in one pass, at speed?" },
  { key: "unique", letter: "U", label: "Unique", q: "Have they heard this framing before?" },
  { key: "broadened", letter: "B", label: "Broadened", q: "How far past the core audience does it still land?" },
] as const;

export type AxisKey = (typeof AXES)[number]["key"];
export type Scores = Record<AxisKey, number>;

export const EMPTY_SCORES: Scores = { relevant: 3, awareness: 3, clarity: 3, unique: 3, broadened: 3 };

/** R x A x C x U^B — Unique is raised to the power of Broadened, by design. */
export function scoreHook(s: Scores): number {
  return s.relevant * s.awareness * s.clarity * Math.pow(s.unique, s.broadened / 3);
}

export function verdict(score: number): { band: string; note: string } {
  if (score < 60) return { band: "Cut it", note: "This will not stop a thumb. Change the framing, not the wording." };
  if (score < 160) return { band: "Weak", note: "It works but it is forgettable. Lift Unique — the framing is the lever, never the adjectives." };
  if (score < 400) return { band: "Ship it", note: "Strong enough to publish. Check the first two seconds say the same thing on screen and out loud." };
  return { band: "Lead with it", note: "Put this at the top of the batch. Hooks this strong are rare — build the piece around it." };
}
