// THE SEVEN STAGES — the Accelerator's spine, in the founder's own model.
//
// The DB already holds seven modules with these titles (see
// 20260709120000_restructure_curriculum_covenant_engine.sql). This file adds the
// two things the database does not carry and the buyer most needs: which part of
// the truck each stage builds, and the artifact that opens the next one.
//
// THE GATE IS THE PRODUCT. A $97 video library is a video library. What makes
// this $997 is that you do not advance because a week passed — you advance
// because you produced the thing. Stage 6 is the one nobody asks for and
// everybody needs: all three of our real prospects asked about roads, not one
// asked about a depot.
//
// The Torah arc stays as the internal naming inside the lessons themselves; this
// is the buyer-facing layer over it. No lesson content is changed by this file.

export interface Stage {
  n: number;
  /** Which part of the truck this stage builds. */
  element: string;
  title: string;
  /** The question a buyer is actually asking when they arrive here. */
  question: string;
  /** The artifact that opens the next stage. Checkable, not felt. */
  gate: string;
  /** Kit tool slugs that do this stage's work. Empty where no tool exists yet. */
  tools: string[];
}

export const STAGES: Stage[] = [
  {
    n: 1, element: "The driver", title: "Foundation — MS×TS×SS",
    question: "Am I the person who can carry this?",
    gate: "A written positioning sentence that passes all five tests.",
    tools: ["ms-ts-ss", "knowledge-audit"],
  },
  {
    n: 2, element: "The cargo", title: "Self-Awareness — SWOT & the 4Ps",
    question: "What exactly am I carrying, and for whom?",
    gate: "A full SWOT — minimum three points per quadrant — and three dated priorities.",
    tools: ["niche-clarity-builder", "adjacent-three", "offer-blueprint"],
  },
  {
    n: 3, element: "The fuel", title: "Content Strategy — the 4Es Engine",
    question: "What do I make, and how do I not run out?",
    gate: "A 30-day calendar built to real 4E ratios, and a niche statement tested on two actual buyers.",
    tools: ["4e-content-calendar", "hook-bank", "voice-print", "consistency-blueprint"],
  },
  {
    n: 4, element: "The roads", title: "Platform Strategy — Choose Your Canaan",
    question: "Which road, and what are its rules?",
    gate: "Four consecutive weeks published on one platform.",
    tools: ["right-side-diagnostic", "your-algorithm"],
  },
  {
    n: 5, element: "The vehicle", title: "Systems & DARES",
    question: "What carries the cargo without me pushing it?",
    gate: "One thing that runs without you for a full week.",
    tools: ["dares-asset-model", "seeds-pipeline"],
  },
  {
    n: 6, element: "The depot", title: "Owned Tribes — River, Fish, Tank",
    question: "What do I own that a road closure cannot take?",
    gate: "A live opt-in and ten real subscribers you did not already know.",
    tools: ["lead-magnet", "first-five-emails"],
  },
  {
    n: 7, element: "The ledger", title: "PAIDS Monetization & Creator Finance",
    question: "Is the money real, recorded and kept?",
    gate: "One PAIDS stream earning, money separated, records kept.",
    tools: ["paids-auditor", "income-tracker", "money-split", "first-income-planner"],
  },
];

export const STAGE_COUNT = STAGES.length;

/** Persisted key for which gates the member has cleared. Synced by kit-sync. */
export const GATES_KEY = "nochill-accelerator-gates-v1";

export function readGates(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GATES_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function writeGates(list: number[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GATES_KEY, JSON.stringify([...new Set(list)].sort((a, b) => a - b)));
  } catch { /* private mode — the page still works, it just will not remember */ }
}

/**
 * The next stage to work on: the lowest one whose gate is not cleared.
 * Null once every gate is behind them.
 */
export function nextStage(cleared: number[]): Stage | null {
  return STAGES.find((s) => !cleared.includes(s.n)) ?? null;
}
