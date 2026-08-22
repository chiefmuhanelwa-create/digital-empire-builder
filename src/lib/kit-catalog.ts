// THE KIT CATALOG — one source of truth for every tool in the Foundation Kit.
//
// WHY THIS EXISTS
// ===============
// Three catalogs disagreed. `lib/tools.ts` knew about 9 tools, the admin page
// knew 10, the routes directory had 24, and the kit dashboard showed 8. A buyer
// paid for twenty-four tools and could find eight of them.
//
// Three naming schemes were also running at once — "Tool 01..10" from an older
// numbering, "Stage 2 · Positioning" from the newer stage model, and nine tools
// with no label at all. This file settles on the stage model, because that is
// what the customer journey is actually organised around and what the
// Accelerator's phase gates key off.
//
// `storage` is recorded honestly per tool: "server" means a real table, "synced"
// means browser storage mirrored to kit_workspace, "none" means it holds nothing.

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Stage {
  id: StageId;
  name: string;
  outcome: string;
  /** What this stage is actually for, in the buyer's terms. */
  premise: string;
  /** The Accelerator gate. Objectively checkable — that is the point of it. */
  gate: string;
}

export const STAGES: Stage[] = [
  { id: 1, name: "MS × TS × SS", outcome: "Readiness",
    premise: "Almost nobody who stalls is missing knowledge. They are missing permission.",
    gate: "No axis at zero, and one video recorded — even if you delete it." },
  { id: 2, name: "SWOT", outcome: "Positioning",
    premise: "Every asset you build downstream inherits one sentence. This is the cheapest place to be wrong.",
    gate: "The sentence passes the five tests and is live in your bio." },
  { id: 3, name: "The 4 Es", outcome: "A content engine",
    premise: "A professional with a job cannot publish daily by inspiration. One booked day is the only version that survives.",
    gate: "12 pieces published. Four a week, not daily." },
  { id: 4, name: "Social Media", outcome: "A profile that converts",
    premise: "Optimising a profile nobody visits is decoration. Content first, then the fix pays.",
    gate: "Profile, bio and link live — and screenshot-able." },
  { id: 5, name: "Community · 3Cs", outcome: "A tank you own",
    premise: "Everything before this sits on rented land. An account can be removed overnight.",
    gate: "A working opt-in and 10 real subscribers. Do not soften this one." },
  { id: 6, name: "DARES", outcome: "An asset that runs",
    premise: "A list lets you hide. One name cannot be hidden behind.",
    gate: "One thing that ran without you for seven days." },
  { id: 7, name: "PAIDS", outcome: "Money kept",
    premise: "The failure here is delayed, which is exactly what makes it dangerous.",
    gate: "One stream earning, and the reserve rule applied to it." },
];

export type Storage = "server" | "synced" | "none";

export interface KitTool {
  slug: string;          // route under /apps/
  name: string;
  stage: StageId;
  /** One line, in the buyer's language — what it does FOR them, not what it is. */
  blurb: string;
  /** The thing they walk away holding. Every tool must produce one. */
  output: string;
  storage: Storage;
  /** localStorage key, where it has one — used to show completion honestly. */
  key?: string;
  /** Flagged in the UI as the one to start with in that stage. */
  start?: boolean;
  /** Reads from another tool rather than asking again. */
  readsFrom?: string;

  // ── THE PATH ──────────────────────────────────────────────────────────────
  // A buyer paid for twenty-four tools and could not tell which to open first.
  // `path` marks the ordered minimum set that delivers the promise: a priced
  // offer and the words to sell it. Tools without a `path` stay available as a
  // library — they are just not what a first-time buyer is shown.
  /** Position in the guided path, 1-based. Absent = library tool. */
  path?: number;
  /** Key into KIT_FILES (products.functions.ts) for this tool's workbook. */
  pdfKey?: string;
  /** Lesson slug in the seeded course, so a tool can say "watch this first". */
  lessonSlug?: string;
}

export const TOOLS: KitTool[] = [
  // ── Stage 1 · Readiness
  { slug: "ms-ts-ss", name: "Readiness Score", stage: 1, start: true,
    blurb: "Scores mindset, toolset and skillset — and multiplies them, so one zero shows up instead of hiding in an average.",
    output: "Your weakest axis, named, with thirty days against it.",
    storage: "synced", key: "nochill-msts-v1", pdfKey: "ms-ts-ss"},
  { slug: "knowledge-audit", name: "The Knowledge Audit", stage: 1,
    blurb: "Finds the product hiding inside what you already know — the thing so obvious to you that it is invisible.",
    output: "Three things people already ask you for, ranked.",
    storage: "synced", key: "nochill-knowledge-v1", path: 1, pdfKey: "knowledge-audit", lessonSlug: "pb-swot-analysis"},
  { slug: "teleprompter", name: "Teleprompter", stage: 1,
    blurb: "Removes the last excuse for not recording. You read instead of remembering, at the speed you actually talk.",
    output: "A recorded video. That is the whole gate.",
    storage: "synced", key: "nochill-teleprompter-v1" },

  // ── Stage 2 · Positioning
  { slug: "offer-blueprint", name: "The Offer Blueprint", stage: 2, start: true,
    blurb: "The spine. Who you help, from what, to what, in how long, for how much — and it rejects a category where a person belongs.",
    output: "One sentence, and a price with a line that defends it.",
    storage: "synced", key: "nochill-offer-spine-v1", path: 3, lessonSlug: "pb-what-is-a-personal-brand"},
  { slug: "the-leak", name: "The Leak", stage: 2,
    blurb: "Counts what you have already given away for free, priced the way your own industry prices you. Most people have never added it up.",
    output: "A rand figure, and the sentence that stops each leak.",
    storage: "server", readsFrom: "knowledge-audit", path: 2},
  { slug: "adjacent-three", name: "The Adjacent Three", stage: 2,
    blurb: "Three people doing something adjacent to you — not to copy, to find the silence none of them fill.",
    output: "The gap that becomes your position.",
    storage: "synced", key: "nochill-adjacent-v1" },
  { slug: "niche-clarity-builder", name: "Niche Clarity Builder", stage: 2,
    blurb: "Narrows a broad field to the one person you are actually for.",
    output: "A niche statement you can say out loud.",
    storage: "server", key: "nochill-niche-v1", pdfKey: "niche-clarity"},

  // ── Stage 3 · Content engine
  { slug: "4e-content-calendar", name: "The 4E Calendar", stage: 3, start: true,
    blurb: "Thirty dated slots that generate themselves from your offer — Educate, Entertain, Encourage, Earn.",
    output: "A month of content that exists whether or not you feel inspired.",
    storage: "synced", key: "nochill-4e-v1", path: 5, pdfKey: "4e-content-calendar", lessonSlug: "pb-3es-content-idea-formula"},
  { slug: "hook-bank", name: "The Hook Bank", stage: 3,
    blurb: "120 hooks, each broken down on the five axes that decide whether a thumb stops. Yours to adapt, never to copy.",
    output: "A scored hook, and the reason it works.",
    storage: "none" },
  { slug: "voice-print", name: "Voice Print", stage: 3,
    blurb: "Learns how you actually write from three samples, then tells you when a draft has drifted away from it.",
    output: "Where this draft stopped sounding like you.",
    storage: "synced", key: "nochill-voiceprint-v1" },
  { slug: "consistency-blueprint", name: "The Consistency Blueprint", stage: 3,
    blurb: "Thirty days, one small action each. Built for someone with a full-time job, not for someone with free afternoons.",
    output: "A streak, and the evidence you can keep one.",
    storage: "synced", key: "nochill-consistency-v1", pdfKey: "30-day-tracker"},

  // ── Stage 4 · Profile
  { slug: "right-side-diagnostic", name: "The Right Side Diagnostic", stage: 4, start: true,
    blurb: "Scores eight areas as owned, exposed or rented — weighted by what losing each would actually cost you.",
    output: "The one area to fix first, and what it costs to leave it.",
    storage: "synced", key: "nochill-rightside-v1" },
  { slug: "your-algorithm", name: "Your Algorithm", stage: 4,
    blurb: "Log what you published and what came back. It finds the pattern in your own account — and says nothing until it has enough to be sure.",
    output: "Which of your choices are actually working.",
    storage: "synced", key: "nochill-your-algorithm-v1" },

  // ── Stage 5 · The tank
  { slug: "lead-magnet", name: "River, Fish, Tank", stage: 5, start: true,
    blurb: "Four magnet shapes and the conditions each one is right for — plus the opt-in line, which is the whole tank.",
    output: "One page worth an email address.",
    storage: "synced", key: "nochill-magnet-v1" },
  { slug: "first-five-emails", name: "The First Five Emails", stage: 5,
    blurb: "Deliver, name the mistake, what it cost, someone who did it, the offer. Email three carries no ask, on purpose.",
    output: "Five drafts, written around your offer.",
    storage: "none", readsFrom: "offer-blueprint" },
  { slug: "seeds-pipeline", name: "SEEDS Pipeline", stage: 5,
    blurb: "Maps how a stranger becomes a buyer — and finds the broken link that makes everything upstream of it wasted.",
    output: "The stage where your pipeline actually breaks.",
    storage: "synced", key: "nochill-seeds-v1", pdfKey: "seeds-pipeline"},

  // ── Stage 6 · An asset that runs
  { slug: "the-send", name: "The Send", stage: 6, start: true,
    blurb: "One name, one channel, one date. The only tool here that produces money, and the only one people avoid.",
    output: "An offer actually sent, and the answer recorded.",
    storage: "synced", key: "nochill-the-send-v1", path: 6},
  { slug: "dares-asset-model", name: "DARES Asset Model", stage: 6,
    blurb: "Tests whether what you built is an asset or a job wearing an asset's clothes. Two of the five decide it on their own.",
    output: "A straight answer: asset, or job.",
    storage: "synced", key: "nochill-dares-v1", pdfKey: "dares-asset-model"},
  { slug: "the-ladder", name: "The Ladder", stage: 6,
    blurb: "Four rungs, checked against each other — including whether your entry offer is quietly cannibalising your main one.",
    output: "A ladder with its structural faults named.",
    storage: "synced", key: "nochill-ladder-v1", readsFrom: "offer-blueprint" },
  { slug: "sale-scripts", name: "The First Sale Scripts", stage: 6,
    blurb: "The four things you will hear back, and what each one actually means underneath.",
    output: "What to say, with your price already in it.",
    storage: "none", readsFrom: "offer-blueprint", path: 4},

  // ── Stage 7 · Money kept
  { slug: "paids-auditor", name: "PAIDS Auditor", stage: 7, start: true,
    blurb: "Measures how concentrated your income really is, using the same index competition regulators use on markets.",
    output: "How many streams you actually have — usually fewer than you think.",
    storage: "synced", key: "nochill-paids-v1", readsFrom: "income-tracker", pdfKey: "paids"},
  { slug: "income-tracker", name: "Income Tracker", stage: 7,
    blurb: "Every rand mapped to a real stream, so you know which one is carrying you instead of guessing.",
    output: "A running record the Auditor reads from.",
    storage: "server" },
  { slug: "money-split", name: "The Money Split", stage: 7,
    blurb: "Splits money the day it lands — tax reserve, business, yours — and produces a compliant invoice.",
    output: "An invoice, and money already set aside.",
    storage: "none", readsFrom: "offer-blueprint" },
  { slug: "first-income-planner", name: "90-Day Planner", stage: 7,
    blurb: "Works backwards from the number you want to the number of conversations it takes to get there.",
    output: "A dated plan with a milestone per month.",
    storage: "synced", key: "nochill-90day-v1", pdfKey: "90-day-planner"},
];

export function toolsForStage(id: StageId): KitTool[] {
  return TOOLS.filter((t) => t.stage === id);
}

export function toolBySlug(slug: string): KitTool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/**
 * Which tools have been touched, read from the same localStorage the tools
 * write to. Deliberately generous: any non-empty value counts as started.
 * Over-reporting progress is kinder than a dashboard that forgets work someone
 * actually did.
 */
export function startedSlugs(): Set<string> {
  const out = new Set<string>();
  try {
    for (const t of TOOLS) {
      if (!t.key) continue;
      const raw = localStorage.getItem(t.key);
      if (raw && raw !== "null" && raw !== "{}" && raw !== "[]" && raw !== "") out.add(t.slug);
    }
  } catch { /* storage unavailable */ }
  return out;
}

// ── Path helpers ────────────────────────────────────────────────────────────

/** The guided path, in order. */
export function pathTools(): KitTool[] {
  return TOOLS.filter((t) => t.path).sort((a, b) => (a.path ?? 0) - (b.path ?? 0));
}

export const PATH_LENGTH = TOOLS.filter((t) => t.path).length;

/** Everything not on the path. Available, just not the front door. */
export function libraryTools(): KitTool[] {
  return TOOLS.filter((t) => !t.path);
}

export function nextInPath(slug: string): KitTool | null {
  const t = toolBySlug(slug);
  if (!t?.path) return null;
  return pathTools().find((x) => (x.path ?? 0) === (t.path ?? 0) + 1) ?? null;
}

export function prevInPath(slug: string): KitTool | null {
  const t = toolBySlug(slug);
  if (!t?.path) return null;
  return pathTools().find((x) => (x.path ?? 0) === (t.path ?? 0) - 1) ?? null;
}

/** Every workbook a kit owner can download, path first then library. */
export function toolsWithWorkbooks(): KitTool[] {
  return [...pathTools(), ...libraryTools()].filter((t) => t.pdfKey);
}
