export type Garden = "deshe" | "esev" | "etz_pri" | "devarim";

// User-facing names use plain English. The slugs (deshe/esev/etz_pri/devarim)
// stay as internal DB keys so we don't break existing data.
export const GARDENS: Record<Garden, {
  slug: Garden;
  name: string;
  tagline: string;
  description: string;
  priceRange: string;
}> = {
  deshe: {
    slug: "deshe",
    name: "Free Tools",
    tagline: "Free guides, workbooks and calculators.",
    description:
      "Free resources that give you a real win — no diluted teasers, no email-only opt-ins for nothing.",
    priceRange: "Free",
  },
  esev: {
    slug: "esev",
    name: "Workbooks & Courses",
    tagline: "Step-by-step paid products.",
    description:
      "Paid workbooks, mini-courses and frameworks. Each one solves one specific problem in your content business.",
    priceRange: "R299 — R999",
  },
  etz_pri: {
    slug: "etz_pri",
    name: "Premium Programs",
    tagline: "Coaching, cohorts and mentorship.",
    description:
      "Live cohorts, group programs and 1-on-1 mentorship for Kingdom Contentpreneurs ready to go full-time.",
    priceRange: "R4,997+",
  },
  devarim: {
    slug: "devarim",
    name: "Books",
    tagline: "Long-form reads.",
    description: "Books worth keeping on your shelf — playbooks you'll come back to for years.",
    priceRange: "R199 — R499",
  },
};

export const GARDEN_ORDER: Garden[] = ["deshe", "esev", "etz_pri", "devarim"];

export function formatPrice(cents: number, currency: string, isFree?: boolean) {
  if (isFree || cents === 0) return "Free";
  const symbol = currency === "ZAR" ? "R" : currency === "NGN" ? "₦" : `${currency} `;
  const v = (cents / 100).toLocaleString("en-ZA");
  return `${symbol}${v}`;
}
