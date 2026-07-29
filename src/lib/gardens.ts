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
  "called-expert-inner-circle": 2900,     // $29/mo (charged R540/mo) — DRIFT: dashboard.inner-circle.tsx:38,78 hardcodes "$39/mo" instead of reading this value. Not resolved here — no source establishes which number is the actual intended price (Paystack plan PLN_4oafnq18t7e36gl's real billing amount isn't visible from code); needs a founder/ops decision, not a guess.
  "contentpreneur-90day-cohort": 49900,   // $499 flat (charged ~R8,270 @ 16.58) — Contentpreneur Accelerator, was $970/R18,000, reprice 2026-07-27
  "creator-swipe-vault": 1700,            // $17 order bump (charged R290)
  "asset-accelerator": 19700,             // $197 1-click upsell (charged R3,600)
  "personal-brand-30-days": 4900,         // $49 video course (charged R899)
  "hook-science": 14700,                  // $147 flagship (Stage 4b — draft until content ships)
  "contentpreneur-community": 1900,       // $19/mo (charged ~R315) — draft until a real Paystack plan exists, see docs/RUNBOOK-COMMUNITY-LAUNCH.md

  // Added 2026-07-28 — found via a real /products/$slug page render showing a
  // raw ZAR/16.58-converted price ("$6" for a R99 product) instead of a clean
  // marketing price. 23 published products had this gap (most pre-dating this
  // session's imports, not just the new ones) — every one below gets a clean,
  // deliberate USD price for international buyers instead of an accidental one.
  // NOTE 2026-07-29 — the 7 slugs below (30-day-content-calendar,
  // african-creator-growth, influencers-code-ebook, monetise-your-expertise,
  // niche-clarity-workbook, paids-framework-workbook, what-to-post) were
  // REMOVED from this map on founder instruction: prices are locked as
  // manually set in the admin panel, and must NOT be touched by the daily
  // FX-sync cron (which rewrites price_cents for every slug present here).
  // Do not re-add them without explicit founder sign-off.
  "90-day-creator-blueprint": 1800,        // $18 (R299)
  "called-expert-foundation-kit-bonus": 1800, // $18 (R299)
  "caption-formula": 900,                  // $9  (R149)
  "content-to-cash": 2400,                 // $24 (R397)
  "contract-red-flags": 900,               // $9  (R149)
  "creator-reboot": 900,                   // $9  (R149)
  "creator-starter-system": 300,           // $3  (R49)
  "deal-decision-framework": 600,          // $6  (R99)
  "find-your-product": 900,                // $9  (R149)
  "first-r1000-sprint": 1200,              // $12 (R197)
  "five-income-streams": 1500,             // $15 (R249)
  "freebies-to-paid": 1800,                // $18 (R299)
  "influencers-code-print": 1900,          // $19 (R320)
  "niche-bundle": 1200,                    // $12 (R199)
  "niche-formula": 600,                    // $6  (R99)
  "phone-to-profit": 4200,                 // $42 (R699)
  "post-scared": 900,                      // $9  (R149)
  "tax-creator-bundle": 1200,              // $12 (R199)
  "whatsapp-selling": 1500,                // $15 (R249)
  // Draft products (not yet published, but priced now so they're correct the
  // moment they are): the 9 "TBD"-priced imports at their R199 placeholder,
  // plus the 4 no-PDF products found via the live Shopify scrape.
  "agency-intelligence-guide": 1200,
  "agency-lens": 1200,
  "brand-deal-sprint": 1200,
  "cold-pitch-email": 1200,
  "concept-survival-guide": 1200,
  "creator-readiness-kit": 1200,
  "post-campaign-upsell-kit": 1200,
  "whatsapp-scripts": 1200,
  "creator-loa": 1200,
  "imposter-syndrome-fix": 1200,           // $12 (R199)
  "first-brand-deal-script": 900,          // $9  (R149)
  "sars-creator-income": 900,              // $9  (R149)
  "content-creator-starter-system": 1800,  // $18 (R299)
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
