// Single source of truth for the free interactive tools. Rendered by both the
// public /tools index and the member /dashboard/tools page so the list never drifts.
import { Calculator, Zap, IdCard, Receipt, Package, type LucideIcon } from "lucide-react";

export type Tool = {
  name: string;
  path: "/rate-card" | "/hook-generator" | "/media-kit" | "/sars-calculator" | "/offer-builder";
  blurb: string;
  icon: LucideIcon;
};

export const TOOLS: Tool[] = [
  {
    name: "Rate Card Calculator",
    path: "/rate-card",
    blurb: "Price your brand deals with confidence — SA CPM-calibrated rates in seconds.",
    icon: Calculator,
  },
  {
    name: "Hook Generator",
    path: "/hook-generator",
    blurb: "Write scroll-stopping hooks with the R×A×C×U^B formula.",
    icon: Zap,
  },
  {
    name: "Media Kit Builder",
    path: "/media-kit",
    blurb: "Build a brand-ready one-pager that makes brands take you seriously.",
    icon: IdCard,
  },
  {
    name: "SARS 25% Calculator",
    path: "/sars-calculator",
    blurb: "Set aside the right tax reserve on every rand you earn.",
    icon: Receipt,
  },
  {
    name: "Offer Builder",
    path: "/offer-builder",
    blurb: "Turn your expertise into a clear, sellable offer — AI-assisted.",
    icon: Package,
  },
];
