// The Clarity System — single source of truth for the 7-step guided journey that
// IS the $97 Foundation Kit. Each step pairs the matching course video(s) with a
// tool that produces a result + a clear next action. Used by the kit workspace
// and the member dashboard ("continue at step N").

export const STREAM_BASE = "https://customer-esnxfwirm3atddsc.cloudflarestream.com";

export type ClarityVideo = { title: string; uid: string; minutes: number };
export type ClarityTool = { name: string; route?: string; pdf?: string; soon?: boolean };
export type ClarityStep = {
  n: number;
  stage: string; // 7-Stage Transformation label
  title: string; // plain-language step name
  question: string; // the question this step answers
  videos: ClarityVideo[];
  tools: ClarityTool[];
  nextAction: string;
};

export const CLARITY_STEPS: ClarityStep[] = [
  {
    n: 1,
    stage: "MS × TS × SS",
    title: "Readiness",
    question: "Are you actually ready to monetise your expertise?",
    videos: [
      { title: "Introduction", uid: "3b8fc0dd8c371b6288d63774ab5c1cda", minutes: 2 },
      { title: "What Is a Personal Brand", uid: "ca330ea012d14097fc9cb8ab1697d9de", minutes: 2 },
      { title: "A Blueprint to Build a Personal Brand", uid: "4d90f9660f247ed6ed3cc599ef3d4734", minutes: 3 },
    ],
    tools: [{ name: "MS×TS×SS Assessment", route: "/apps/ms-ts-ss", pdf: "ms-ts-ss" }],
    nextAction: "Score yourself, then lift your weakest multiplier first — it unlocks the rest.",
  },
  {
    n: 2,
    stage: "SWOT",
    title: "Your Knowledge & Niche",
    question: "What do you sell, and to exactly whom?",
    videos: [{ title: "SWOT Analysis", uid: "a3bac11978760d450455c11ff87b0f4c", minutes: 10 }],
    tools: [
      { name: "Knowledge Audit", route: "/apps/knowledge-audit", pdf: "knowledge-audit" },
      { name: "Niche Clarity Builder", route: "/apps/niche-clarity-builder", pdf: "niche-clarity" },
    ],
    nextAction: "Find the product hiding in your expertise, then write your niche in ONE sentence.",
  },
  {
    n: 3,
    stage: "4Es",
    title: "Your Content Engine",
    question: "What do you post so it builds trust AND sells?",
    videos: [{ title: "The 3Es Content Idea Formula", uid: "be7c0cacf69a45f3ce0f009d8727d9db", minutes: 7 }],
    tools: [{ name: "4E Content Calendar", route: "/apps/4e-content-calendar", pdf: "4e-content-calendar" }],
    nextAction: "Build your 30-day 3:3:3:1 plan — then post Day 1 today.",
  },
  {
    n: 4,
    stage: "Social Media",
    title: "Reach on Owned Ground",
    question: "Are you building on land you own, or renting?",
    videos: [{ title: "Understand Social Media Platforms", uid: "52defacab8f34d65dda448db03184065", minutes: 7 }],
    tools: [{ name: "The Right Side Diagnostic", route: "/apps/right-side-diagnostic" }],
    nextAction: "Move ONE red (rented) area onto owned ground — start an email list this week.",
  },
  {
    n: 5,
    stage: "Community (3Cs)",
    title: "Leads & Pipeline",
    question: "How does a stranger become a buyer?",
    videos: [
      { title: "The 3Cs Framework", uid: "3950690229221fa11723fb58f1b17323", minutes: 5 },
      { title: "Community Building", uid: "564d616cc63e8b0c830e1cb80fd4d4b3", minutes: 5 },
    ],
    tools: [{ name: "SEEDS Pipeline", route: "/apps/seeds-pipeline", pdf: "seeds-pipeline" }],
    nextAction: "Map your Signal→Success pipeline, then set up your first free opt-in.",
  },
  {
    n: 6,
    stage: "DARES",
    title: "Build the Asset",
    question: "What asset earns while you sleep?",
    videos: [{ title: "Formula to Create an Online Asset", uid: "bbe9a96b6c9d5169321e1612df7c6489", minutes: 4 }],
    tools: [{ name: "DARES Asset Model", route: "/apps/dares-asset-model", pdf: "dares-asset-model" }],
    nextAction: "Score your idea on DARES, then pick ONE asset to build first.",
  },
  {
    n: 7,
    stage: "PAIDS",
    title: "Monetise — 5 Streams",
    question: "Where does the money actually come from?",
    videos: [{ title: "PAIDS Framework", uid: "5f33ab865a811446ca8a5368fdd4449c", minutes: 5 }],
    tools: [{ name: "PAIDS Income Auditor", route: "/apps/paids-auditor", pdf: "paids" }],
    nextAction: "Map your 5 streams, then build the ONE the auditor says to build next.",
  },
];

export const CLARITY_TOTAL = CLARITY_STEPS.length;

// Cross-cutting bonuses (not numbered steps — support the whole journey).
export const CLARITY_BONUSES: ClarityTool[] = [
  { name: "30-Day Consistency Blueprint", route: "/apps/consistency-blueprint", pdf: "30-day-tracker" },
  { name: "90-Day First Income Planner", route: "/apps/first-income-planner", pdf: "90-day-planner" },
  { name: "Contentpreneur Cheat Sheet", pdf: "cheat-sheet" },
];

// localStorage progress
export const CLARITY_PROGRESS_KEY = "clarity-progress-v1";

export function readClarityProgress(): Record<number, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem(CLARITY_PROGRESS_KEY) || "null");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}
export function writeClarityProgress(p: Record<number, boolean>) {
  try { localStorage.setItem(CLARITY_PROGRESS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
/** The first incomplete step (1-based), or CLARITY_TOTAL+1 if all done. */
export function nextClarityStep(p: Record<number, boolean>): number {
  for (const s of CLARITY_STEPS) if (!p[s.n]) return s.n;
  return CLARITY_TOTAL + 1;
}
