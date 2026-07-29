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
  FileText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "Brand Deals" | "Creator Finance" | "Content Creation";
export const TOOL_CATEGORY_ORDER: ToolCategory[] = ["Brand Deals", "Creator Finance", "Content Creation"];

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

  // ── Creator Finance ──────────────────────────────────────────────────────
  {
    name: "Invoice Generator",
    path: "https://invoice-generator-delta-navy.vercel.app",
    external: true,
    tier: "free",
    category: "Creator Finance",
    blurb: "Generate a professional brand-deal invoice in 2 minutes — SA banking formats built in.",
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

  // ── Content Creation ─────────────────────────────────────────────────────
  {
    name: "Hook Generator",
    path: "/hook-generator",
    tier: "free",
    category: "Content Creation",
    blurb: "5 scroll-stopping hooks, written fresh for your topic by Claude — 3 free, then Foundation Kit.",
    icon: Zap,
  },
  {
    name: "Offer Builder",
    path: "/offer-builder",
    tier: "premium",
    category: "Content Creation",
    blurb: "Turn your expertise into a clear, sellable offer — AI-assisted, 2 free then Foundation Kit.",
    icon: Package,
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
