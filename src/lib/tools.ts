// Single source of truth for the interactive tools hub (/tools). Grouped into
// 3 categories the founder asked for: Brand Deals, Creator Finance, Content
// Creation. Most tools are native CHKPLT routes; a couple are standalone
// product-lab/web-tools apps not yet ported natively (external: true) — they
// open in a new tab and are clearly labelled as such.
import {
  Calculator,
  Zap,
  IdCard,
  Receipt,
  Package,
  Compass,
  Crosshair,
  FileText,
  TrendingUp,
  ClipboardList,
  BellRing,
  ShieldCheck,
  ClipboardCheck,
  LayoutGrid,
  Wand2,
  BookLock,
  Database,
  Waves,
  Scissors,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "Brand Deals" | "Creator Finance" | "Content Creation";
export const TOOL_CATEGORY_ORDER: ToolCategory[] = [
  "Brand Deals",
  "Creator Finance",
  "Content Creation",
];

export type Tool = {
  name: string;
  path: string;
  external?: boolean;
  tier: "free" | "premium";
  category: ToolCategory;
  blurb: string;
  icon: LucideIcon;
};

export const TOOLS: Tool[] = [
  // ── Brand Deals ──────────────────────────────────────────────────────────
  {
    name: "Rate Card Calculator",
    path: "/rate-card",
    tier: "free",
    category: "Brand Deals",
    blurb: "Price your brand deals with confidence — SA CPM-calibrated rates in seconds.",
    icon: Calculator,
  },
  {
    name: "Media Kit Builder",
    path: "/media-kit",
    tier: "free",
    category: "Brand Deals",
    blurb: "Build a brand-ready one-pager that makes brands take you seriously.",
    icon: IdCard,
  },
  {
    name: "SARS 25% Calculator",
    path: "/sars-calculator",
    tier: "free",
    category: "Brand Deals",
    blurb: "Set aside the right tax reserve on every rand you earn from a deal.",
    icon: Receipt,
  },
  {
    // The rate card says what to charge and the invoice generator bills it.
    // Nothing has ever tracked the gap between those two, which is exactly
    // where the money goes missing.
    name: "Deal Tracker",
    path: "/apps/deals",
    tier: "premium",
    category: "Brand Deals",
    blurb:
      "Every deal from first conversation to money in the bank — and what to do today about the one that hasn't paid.",
    icon: ClipboardList,
  },
  {
    // Stage 12. The only tool here whose job is to make you come back, rather
    // than to make something. Borrows the provisional tax calendar, which is
    // enforced by somebody other than the user.
    name: "The Return",
    path: "/apps/return",
    tier: "premium",
    category: "Creator Finance",
    blurb:
      "What has gone quiet since you last looked — overdue invoices, uninvoiced work, and the deadline nobody moves.",
    icon: BellRing,
  },
  {
    // Built from the agency archive: a complete brief has twelve things in it
    // and most have seven. The five that go missing are the five that cost
    // money later — usage rights above all.
    name: "Brief · Pitch · Contract",
    path: "/apps/brief-check",
    tier: "premium",
    category: "Brand Deals",
    blurb:
      "What the brief left out, a pitch your records can back, and an agreement that prices the rights before you sign them away.",
    icon: ClipboardCheck,
  },
  {
    // Stage 11. Checks a figure against the user's own paid records before it
    // goes into a pitch or a caption. Built because ten audited claims all
    // drifted upward and none drifted down.
    name: "Figure Check",
    path: "/apps/figure-check",
    tier: "premium",
    category: "Creator Finance",
    blurb:
      "Check a number against your own receipts before you say it out loud — and get the version you can defend.",
    icon: ShieldCheck,
  },

  // ── Creator Finance ──────────────────────────────────────────────────────
  {
    name: "Provisional Tax Calculator",
    path: "/provisional-tax",
    tier: "free",
    category: "Creator Finance",
    blurb:
      "What you actually owe SARS on creator income — real brackets, your deductions, both IRP6 dates.",
    icon: Receipt,
  },
  {
    // Native now. It reads straight from the Deal Tracker, so the deal you
    // logged becomes the invoice without retyping it — and the tracker knows
    // the moment it was billed, which is what starts the chase clock.
    name: "Invoice",
    path: "/apps/invoice",
    tier: "premium",
    category: "Creator Finance",
    blurb:
      "Bill a delivered deal without leaving the app — banking details, EFT terms and end-of-month dating built in.",
    icon: FileText,
  },
  {
    name: "Income Stream Matcher",
    path: "https://nochill-income-matcher.vercel.app",
    external: true,
    tier: "free",
    category: "Creator Finance",
    blurb: "Match your skills and audience to the 5 PAIDS income streams that actually fit you.",
    icon: TrendingUp,
  },

  {
    // Stage 5. The only tool here that argues against the platform the rest of
    // the product runs on — which is exactly why it has to exist before any
    // scheduler does.
    name: "If It Ended Tonight",
    path: "/apps/concentration",
    tier: "premium",
    category: "Creator Finance",
    blurb:
      "How much of your income sits on rented land — and what is actually left standing if the biggest channel stops.",
    icon: Waves,
  },

  // ── Content Creation ─────────────────────────────────────────────────────
  {
    // The unifier. Three routes was three tools, which is the one-shot problem
    // this product exists to correct, shipped by us. The estate is the database,
    // retrieval runs before generation, and the ledger checks what comes back.
    name: "The OS",
    path: "/apps/os",
    tier: "premium",
    category: "Content Creation",
    blurb:
      "Your estate as the database — draft from your own stories and receipts, and see the file every line came from.",
    icon: Database,
  },
  {
    // The spine the content tools never had. Hook Bank held its state in
    // useState and lost it on tab close; the 4E calendar wrote to localStorage,
    // which never reached the server. Nothing recorded what a piece actually
    // did — which is the one-shot-tool failure this product exists to correct,
    // running inside the product itself.
    name: "Content OS",
    path: "/apps/content-os",
    tier: "premium",
    category: "Content Creation",
    blurb:
      "Every piece from idea to what it actually did — tracker, calendar, idea bank and a library that shows the number behind every line.",
    icon: LayoutGrid,
  },
  {
    // PART 1 of the spec, and the only thing here a competitor cannot copy.
    // Every other AI writing tool sells "generate faster"; this refuses to
    // print a number the user cannot defend. The value compounds with use and
    // the data is theirs — switching means rebuilding it somewhere else.
    name: "The Ledger",
    path: "/apps/ledger",
    tier: "premium",
    category: "Content Creation",
    blurb:
      "Your own verified numbers — and an engine that refuses to write a figure that isn't in them.",
    icon: BookLock,
  },
  {
    // Two houses side by side — NOCHILL (FW-147, 90-105s, confession-led) and
    // JATHO (prohibition hook, tap path, seamless loop, 23-45s). The evidence
    // does not settle which is better for this account, so the tool builds both
    // and refuses to choose. It writes STRUCTURE and slots, never figures.
    name: "Script Studio",
    path: "/apps/script-studio",
    tier: "premium",
    category: "Content Creation",
    blurb:
      "Two scripting houses, three hooks scored against the gate, and a beat map that cannot invent a number.",
    icon: Wand2,
  },
  {
    name: "The Positioning Test",
    path: "/positioning",
    tier: "free",
    category: "Content Creation",
    blurb:
      "Five tests on the one sentence that decides what you can charge. Scores as you type, no signup to see the result.",
    icon: Crosshair,
  },
  {
    name: "Hook Generator",
    path: "/hook-generator",
    tier: "free",
    category: "Content Creation",
    blurb:
      "5 scroll-stopping hooks, written fresh for your topic by Claude — 3 free, then Foundation Kit.",
    icon: Zap,
  },
  {
    name: "Offer Builder",
    path: "/offer-builder",
    tier: "premium",
    category: "Content Creation",
    blurb:
      "Turn your expertise into a clear, sellable offer — AI-assisted, 2 free then Foundation Kit.",
    icon: Package,
  },
  {
    // Stage 4. Thresholds come from 8 reels on ONE account, 3 torn down with
    // ffmpeg — the page says so, because presenting one creator's measured set
    // as a general law is exactly the failure this product exists to correct.
    name: "Edit Brief",
    path: "/apps/edit-brief",
    tier: "premium",
    category: "Content Creation",
    blurb:
      "Check the cut before you make it — runtime, first cut, cut rate, and where the face is when you ask.",
    icon: Scissors,
  },
  {
    name: "Align · Accelerate · Excel",
    path: "/align-accelerate-excel",
    tier: "free",
    category: "Content Creation",
    blurb: "Find your phase in 90 seconds — then get the free 7-Day Alignment Sprint.",
    icon: Compass,
  },
];
