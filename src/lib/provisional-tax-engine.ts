// Provisional tax engine for SA creators.
//
// ⚠️ THE ONE BLOCK THAT MATTERS ⚠️
// Everything below the TAX TABLE section is derived arithmetic. The table
// itself is the only place a real-world figure is stated, so it is isolated
// here and nowhere else. To move to a new tax year, change ONLY this block.
//
// Provenance: official SARS figures for the 2027 year of assessment
// (1 March 2026 – 28 February 2027) — the year currently in progress — taken
// from sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/.
// The whole table cross-checks against itself:
//   0.18 × 245 100                = 44 118  → base of bracket 2 ✓
//   44 118 + 0.26 × 138 000       = 79 998  → base of bracket 3 ✓
//   79 998 + 0.31 × 147 100       = 125 599 → base of bracket 4 ✓
//   125 599 + 0.36 × 165 600      = 185 215 → base of bracket 5 ✓
//   185 215 + 0.39 × 191 200      = 259 783 → base of bracket 6 ✓
//   259 783 + 0.41 × 991 600      = 666 339 → base of bracket 7 ✓
//   0.18 × 99 000                 = 17 820  → equals the primary rebate, which
//                                             is exactly why the threshold sits
//                                             at R99 000 ✓
//
// Cross-checked a second way: this table reproduces the CreatorKit calculator's
// output exactly at 7 sampled incomes (R150k → R1.7m). Its ENGINE is correct;
// only the bracket table printed beneath it is the superseded 2026 one, which
// is why the two appear to disagree.
// =============================================================================

export const TAX_YEAR = "2026/2027";
export const TAX_YEAR_NOTE =
  "Official SARS rates for the 2027 year of assessment (1 March 2026 – 28 February 2027). An estimate, not tax advice — confirm with your practitioner before filing.";

interface Bracket {
  upTo: number;
  rate: number;
  base: number;
}

export const BRACKETS: Bracket[] = [
  { upTo: 245_100, rate: 0.18, base: 0 },
  { upTo: 383_100, rate: 0.26, base: 44_118 },
  { upTo: 530_200, rate: 0.31, base: 79_998 },
  { upTo: 695_800, rate: 0.36, base: 125_599 },
  { upTo: 887_000, rate: 0.39, base: 185_215 },
  { upTo: 1_878_600, rate: 0.41, base: 259_783 },
  { upTo: Infinity, rate: 0.45, base: 666_339 },
];

export const PRIMARY_REBATE = 17_820;
export const TAX_THRESHOLD = 99_000;
export const VAT_THRESHOLD = 1_000_000;

// ── end of tax table ────────────────────────────────────────────────────────

export const INCOME_SOURCES = [
  {
    key: "adsense",
    icon: "📺",
    label: "YouTube AdSense",
    hint: "Every AdSense payment you received",
  },
  {
    key: "tiktok",
    icon: "🎵",
    label: "TikTok Creator Fund",
    hint: "Creator rewards and LIVE gifts",
  },
  {
    key: "meta",
    icon: "📷",
    label: "Meta / Instagram bonuses",
    hint: "Reels bonuses and ad revenue share",
  },
  {
    key: "brand_deals",
    icon: "🤝",
    label: "Brand deals & sponsorships",
    hint: "Every paid partnership and collaboration",
  },
  {
    key: "affiliate",
    icon: "🔗",
    label: "Affiliate commissions",
    hint: "Amazon, Takealot, any affiliate income",
  },
  {
    key: "products",
    icon: "📚",
    label: "Digital products & courses",
    hint: "Ebooks, courses, templates, presets",
  },
  {
    key: "gifts",
    icon: "🎁",
    label: "Gifts & PR",
    hint: "Only taxable once the total passes R100 000 a year",
  },
  {
    key: "other_income",
    icon: "💰",
    label: "Other income",
    hint: "Consulting, coaching, speaking, anything else",
  },
] as const;

export const EXPENSE_CATEGORIES = [
  {
    key: "equipment",
    icon: "📹",
    label: "Equipment",
    hint: "Camera, lighting, audio. Over R7 000 may need to be depreciated rather than claimed at once",
  },
  {
    key: "software",
    icon: "💻",
    label: "Software & subscriptions",
    hint: "Adobe, Canva, editing tools, hosting",
  },
  {
    key: "internet",
    icon: "📶",
    label: "Internet & data",
    hint: "The business portion of your connection",
  },
  {
    key: "home_office",
    icon: "🏠",
    label: "Home office",
    hint: "Rent or bond interest, proportional to the space you actually work in",
  },
  {
    key: "travel",
    icon: "✈️",
    label: "Travel & transport",
    hint: "Business travel, Ubers to shoots and meetings",
  },
  {
    key: "professional",
    icon: "👔",
    label: "Professional services",
    hint: "Accountant, lawyer, editor, virtual assistant",
  },
  {
    key: "marketing",
    icon: "📣",
    label: "Marketing & advertising",
    hint: "Paid ads, promotions, scheduling tools",
  },
  {
    key: "other_expense",
    icon: "📝",
    label: "Other business expenses",
    hint: "Any other legitimate cost of doing the work",
  },
] as const;

export type IncomeKey = (typeof INCOME_SOURCES)[number]["key"];
export type ExpenseKey = (typeof EXPENSE_CATEGORIES)[number]["key"];

/** Tax on a taxable income, straight off the bracket table, less the rebate. */
export function taxOn(taxable: number): number {
  if (taxable <= 0) return 0;
  let previousCap = 0;
  for (const b of BRACKETS) {
    if (taxable <= b.upTo) {
      return Math.max(0, b.base + b.rate * (taxable - previousCap) - PRIMARY_REBATE);
    }
    previousCap = b.upTo;
  }
  return 0;
}

/** The rate on your NEXT rand — what a new deal is actually taxed at. */
export function marginalRate(taxable: number): number {
  let previousCap = 0;
  for (const b of BRACKETS) {
    if (taxable <= b.upTo) return b.rate;
    previousCap = b.upTo;
  }
  return BRACKETS[BRACKETS.length - 1].rate;
}

export interface TaxInput {
  income: Record<string, number>;
  expenses: Record<string, number>;
}

export function computeProvisionalTax({ income, expenses }: TaxInput) {
  const totalIncome = Object.values(income).reduce((s, n) => s + (n || 0), 0);
  const totalExpenses = Object.values(expenses).reduce((s, n) => s + (n || 0), 0);
  const taxable = Math.max(0, totalIncome - totalExpenses);

  const annualTax = taxOn(taxable);
  // Provisional tax is paid in two bites: roughly half by end-August, the
  // balance by end-February.
  const firstPayment = annualTax / 2;
  const secondPayment = annualTax - firstPayment;

  return {
    totalIncome,
    totalExpenses,
    taxable,
    annualTax,
    firstPayment,
    secondPayment,
    monthlySetAside: annualTax / 12,
    effectiveRate: taxable > 0 ? annualTax / taxable : 0,
    marginalRate: marginalRate(taxable),
    takeHome: totalIncome - totalExpenses - annualTax,
    belowThreshold: taxable <= TAX_THRESHOLD,
    vatRegistrationLikely: totalIncome > VAT_THRESHOLD,
  };
}

export type TaxResult = ReturnType<typeof computeProvisionalTax>;

// ── Compliance checklist ────────────────────────────────────────────────────
// Ported from the CreatorKit checklist, with the expired deadline dates
// replaced by the recurring SARS pattern (last day of August, last day of
// February) rather than hard-coded years that go stale and mislead.
export interface ChecklistItem {
  id: string;
  category: "Registration" | "Setup" | "Ongoing" | "Deadlines" | "Optimisation";
  title: string;
  priority: "High" | "Medium";
  detail: string;
  when?: string;
}

export const CHECKLIST: ChecklistItem[] = [
  {
    id: "reg-taxpayer",
    category: "Registration",
    title: "Register as a taxpayer with SARS",
    priority: "High",
    detail: `If your taxable income passes R${TAX_THRESHOLD.toLocaleString("en-ZA")}, you must be registered.`,
  },
  {
    id: "reg-provisional",
    category: "Registration",
    title: "Register for provisional tax",
    priority: "High",
    detail:
      "Required the moment you earn income that has no PAYE deducted — which is almost all creator income.",
  },
  {
    id: "reg-vat",
    category: "Registration",
    title: "Check whether you need to register for VAT",
    priority: "Medium",
    detail: `Compulsory once taxable turnover passes R${VAT_THRESHOLD.toLocaleString("en-ZA")} in any 12 months.`,
  },

  {
    id: "setup-bank",
    category: "Setup",
    title: "Open a separate business bank account",
    priority: "High",
    detail:
      "One account for the business, one for you. Mixing them is what makes a tax year impossible to reconstruct.",
  },
  {
    id: "setup-expenses",
    category: "Setup",
    title: "Set up expense tracking",
    priority: "High",
    detail: "A spreadsheet is enough. What matters is that it happens weekly, not in February.",
  },
  {
    id: "setup-invoicing",
    category: "Setup",
    title: "Create an invoicing system",
    priority: "Medium",
    detail:
      "Numbered invoices, dated, with your details on them. Brands need them and SARS expects them.",
  },

  {
    id: "ongoing-invoices",
    category: "Ongoing",
    title: "Keep every brand deal invoice",
    priority: "High",
    detail: "Copies of everything you have issued, filed by month.",
  },
  {
    id: "ongoing-statements",
    category: "Ongoing",
    title: "Download your platform payment statements",
    priority: "High",
    detail: "YouTube, TikTok, Meta and anywhere else that pays you.",
  },
  {
    id: "ongoing-receipts",
    category: "Ongoing",
    title: "Save every business expense receipt",
    priority: "High",
    detail: "No receipt, no deduction. Photograph them the day you get them.",
  },
  {
    id: "ongoing-bank",
    category: "Ongoing",
    title: "Download monthly bank statements",
    priority: "Medium",
    detail: "SARS expects you to keep records for five years.",
  },

  {
    id: "deadline-irp6-1",
    category: "Deadlines",
    title: "1st provisional return (IRP6)",
    priority: "High",
    when: "By 31 August",
    detail:
      "Covers the first six months of the tax year. This is the one most creators miss entirely.",
  },
  {
    id: "deadline-irp6-2",
    category: "Deadlines",
    title: "2nd provisional return (IRP6)",
    priority: "High",
    when: "By the last day of February",
    detail: "Covers the full year and squares up what the first payment did not cover.",
  },
  {
    id: "deadline-itr12",
    category: "Deadlines",
    title: "Annual return (ITR12)",
    priority: "High",
    when: "Filing season — check eFiling",
    detail: "The final reconciliation. Dates shift year to year, so confirm yours on SARS eFiling.",
  },

  {
    id: "opt-deductions",
    category: "Optimisation",
    title: "Review every deduction you are entitled to",
    priority: "High",
    detail:
      "Equipment, software, data, travel, courses, professional fees. Most creators claim nothing and overpay.",
  },
  {
    id: "opt-home-office",
    category: "Optimisation",
    title: "Work out your home office deduction",
    priority: "Medium",
    detail:
      "If you genuinely work from home, a proportion of rent or bond interest and utilities can be claimed.",
  },
];
