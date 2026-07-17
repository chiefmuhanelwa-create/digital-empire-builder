export type Garden = "deshe" | "esev" | "etz_pri" | "devarim";

// User-facing names use plain English. The slugs (deshe/esev/etz_pri/devarim)
// stay as internal DB keys so we don't break existing data.
export const GARDENS: Record<Garden, {
  slug: Garden;
  name: string;
  tagline: string;
  description: string;
}> = {
  deshe: {
    slug: "deshe",
    name: "Free Tools",
    tagline: "Free guides, workbooks and calculators.",
    description:
      "Free resources that give you a real win — no diluted teasers, no email-only opt-ins for nothing.",
  },
  esev: {
    slug: "esev",
    name: "Products & Mini-Courses",
    tagline: "Rungs 2–5 — paid workbooks, courses & (soon) interactive apps.",
    description:
      "Paid workbooks, mini-courses, masterclasses and frameworks — each solves one specific problem in your expertise business. Interactive pain-point apps are rolling out here next (less PDF, more tools that resolve the blocker on the spot).",
  },
  etz_pri: {
    slug: "etz_pri",
    name: "Coaching & Accelerator",
    tagline: "Rungs 6–7 — Accelerator, coaching & done-with-you.",
    description:
      "The 90-Day Contentpreneur Accelerator PRO, live cohorts, 1-on-1 mentorship and done-with-you facilitation for Contentpreneurs ready to go full-time.",
  },
  devarim: {
    slug: "devarim",
    name: "Books",
    tagline: "Long-form reads.",
    description: "Books worth keeping on your shelf — playbooks you'll come back to for years.",
  },
};

export const GARDEN_ORDER: Garden[] = ["deshe", "esev", "etz_pri", "devarim"];

// The funnel DISPLAYS one currency globally: USD. Everything is still CHARGED in
// ZAR (Paystack can't bill USD) — buyers see "billed in ZAR at checkout".
// USD_DISPLAY holds clean marketing prices for the headline products; any other
// ZAR product is auto-converted to whole USD via ZAR_PER_USD below.
//
// LIVE conversion: the daily Cloudflare cron `sync-fx` (src/lib/fx-sync.ts) pulls
// the real USD→ZAR rate and rewrites each USD_DISPLAY product's price_cents so the
// ZAR charge always tracks the fixed USD price. Nothing here is hardwired anymore.
//
// ZAR_PER_USD below is ONLY the display fallback for ad-hoc ZAR products that aren't
// in USD_DISPLAY (and for SSR before the first cron run). Keep it roughly current.
export const ZAR_PER_USD = 16.58;

export const USD_DISPLAY: Record<string, number> = {
  "called-expert-foundation-kit": 9700,   // $97  (charged R1,604 @ 16.58)
  "called-expert-starter-bundle": 9700,   // $97  (charged ~R1,800)
  "called-expert-foundations": 29700,     // $297 (charged ~R5,500)
  "called-expert-facilitator": 400000,    // $4,000 (charged R75,000)
  "called-expert-inner-circle": 2900,     // $29/mo (charged R540/mo)
  "contentpreneur-90day-cohort": 97000,   // $970 (charged R18,000 — Accelerator PRO)
  "creator-swipe-vault": 1700,            // $17 order bump (charged R290)
  "asset-accelerator": 19700,             // $197 1-click upsell (charged R3,600)
  "personal-brand-30-days": 4900,         // $49 video course (charged R899)
  "hook-science": 14700,                  // $147 flagship (Stage 4b — draft until content ships)
};

// Display: South African buyers see the real ZAR they'll be charged (no exchange-
// rate math next to local social proof); everyone else sees the clean USD price.
export function formatPrice(
  cents: number,
  currency: string,
  isFree?: boolean,
  slug?: string,
  country?: string | null,
) {
  if (isFree || cents === 0) return "Free";

  // ── South Africa: render native ZAR ──────────────────────────────────────
  if (country === "ZA") {
    // ZAR-native product: `cents` IS the Paystack charge (fx-synced to the USD price).
    // USD-native product: convert to ZAR for display.
    const zarCents =
      currency === "ZAR" ? cents : Math.round((cents / 100) * ZAR_PER_USD) * 100;
    return `R${(zarCents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
  }

  // Resolve a USD-cents value: explicit marketing override → native USD → convert ZAR.
  let usdCents: number | null = null;
  if (slug && USD_DISPLAY[slug] != null) usdCents = USD_DISPLAY[slug];
  else if (currency === "USD") usdCents = cents;
  else if (currency === "ZAR") usdCents = Math.max(100, Math.round(cents / ZAR_PER_USD / 100) * 100);

  if (usdCents != null) {
    const u = usdCents / 100;
    return `$${u.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  // Last resort: render in the native currency.
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
