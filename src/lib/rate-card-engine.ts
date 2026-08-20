// Pure calculation core for the Rate Card, lifted verbatim out of the old
// iframed tool (public/tools/rate-card/index.html) so the maths lives in one
// testable place instead of being tangled with DOM reads.
//
// Every constant and every line of computeRateCard() is a faithful port — the
// numbers this returns are diffed against the original tool before shipping.
// If you change a multiplier here you are changing what creators quote brands,
// so don't, unless the CPM research changed.

export interface NicheData {
  cpm: number;
  global_cpm: string;
  notes: string;
}

export const NICHE_CPM: Record<string, NicheData> = {
  "Fashion & Beauty": {
    cpm: 271.95,
    global_cpm: "$15",
    notes:
      "Strong SA engagement. Brands like Bash, Cotton On and Woolworths pay premium for authentic creators. Style content converts.",
  },
  "Business & Entrepreneurship": {
    cpm: 362.6,
    global_cpm: "$20",
    notes:
      "Decision-maker audiences command premium rates. SA coaching and business tool brands have growing creator budgets.",
  },
  "Finance & Investing": {
    cpm: 634.55,
    global_cpm: "$35",
    notes:
      "Highest-value niche in SA. Capitec, FNB, Nedbank, Absa and Standard Bank have the largest creator budgets in ZA.",
  },
  "Tech Reviews": {
    cpm: 453.25,
    global_cpm: "$25",
    notes:
      "Purchase-decision content. Samsung, Takealot and telcos (MTN, Vodacom) actively buy tech review placements.",
  },
  Lifestyle: {
    cpm: 217.56,
    global_cpm: "$12",
    notes:
      "Broad reach across all SA demographics. Compensate with strong engagement data — volume is your leverage here.",
  },
  "Fitness & Health": {
    cpm: 326.34,
    global_cpm: "$18",
    notes:
      "Dis-Chem, supplement brands and gym chains have significant SA creator budgets. Health content drives repeat purchases.",
  },
  "Parenting & Family": {
    cpm: 271.95,
    global_cpm: "$15",
    notes:
      "Loyal, trust-heavy SA audience. Baby and education brands value authenticity here over raw follower count.",
  },
  "Food & Cooking": {
    cpm: 217.56,
    global_cpm: "$12",
    notes:
      "FMCG brands (Tiger Brands, Unilever SA, Pick n Pay, SPAR) are very active in SA creator deals. Use volume to negotiate.",
  },
  Modelling: {
    cpm: 271.95,
    global_cpm: "$15",
    notes:
      "Visual-first content. Fashion and beauty brand alignment. Strong for seasonal campaigns with local and international brands.",
  },
  Entertainment: {
    cpm: 362.6,
    global_cpm: "$20",
    notes:
      "Netflix SA, Showmax, DSTV and streaming brands drive strong deal activity. Broad demographic appeal for awareness campaigns.",
  },
  "Travel & Adventure": {
    cpm: 253.82,
    global_cpm: "$14",
    notes:
      "SA Tourism board is an active creator partner. Safari lodges, airlines and hotel brands regularly fund travel content.",
  },
  Gaming: {
    cpm: 326.34,
    global_cpm: "$18",
    notes:
      "SA esports growing fast. Telcos (MTN, Vodacom), peripheral brands and energy drinks actively target gaming audiences.",
  },
  "Personal Development": {
    cpm: 326.34,
    global_cpm: "$18",
    notes:
      "Motivated, action-taking SA audience. Coaching platforms, online courses and business tools pay well for qualified leads.",
  },
  Education: {
    cpm: 362.6,
    global_cpm: "$20",
    notes:
      "Trusted authority positioning. EdTech and online learning brands pay premium for creators with an engaged learning community.",
  },
  "Real Estate": {
    cpm: 543.91,
    global_cpm: "$30",
    notes:
      "High-value transactions justify premium influencer rates. Property portals and bond originators have active creator budgets.",
  },
  Automotive: {
    cpm: 362.6,
    global_cpm: "$20",
    notes:
      "High-purchase-intent SA audience. Dealerships, car rental brands and auto accessories have consistent creator spend.",
  },
  "Music & Arts": {
    cpm: 217.56,
    global_cpm: "$12",
    notes:
      "Streaming platforms (Spotify, Apple Music) and SA event brands. Creative niche — negotiate with audience loyalty data.",
  },
  "Sports & Athletics": {
    cpm: 271.95,
    global_cpm: "$15",
    notes:
      "SA betting brands (Hollywoodbets, Betway, Playa Bets) fund creators heavily. Check your platform policy before accepting.",
  },
  "Comedy & Entertainment": {
    cpm: 217.56,
    global_cpm: "$12",
    notes:
      "SA comedy creators consistently undercharge. FMCG and fast food brands pay for viral reach. Use CPM data confidently.",
  },
  "Sustainability & Green": {
    cpm: 271.95,
    global_cpm: "$15",
    notes:
      "Woolworths Clean Earth and Pick n Pay organic ranges are active. Growing SA category — early movers will command higher rates.",
  },
};

export const PLATFORM = {
  instagram: { cpm_mult: 1.0, cpe_mult: 1.0, name: "Instagram" },
  tiktok: { cpm_mult: 0.8, cpe_mult: 0.4, name: "TikTok" },
  youtube: { cpm_mult: 1.8, cpe_mult: 0.25, name: "YouTube" },
  facebook: { cpm_mult: 0.9, cpe_mult: 4.7, name: "Facebook" },
  linkedin: { cpm_mult: 1.5, cpe_mult: 1.2, name: "LinkedIn" },
  twitter_x: { cpm_mult: 0.6, cpe_mult: 0.7, name: "X (Twitter)" },
  pinterest: { cpm_mult: 0.7, cpe_mult: 0.6, name: "Pinterest" },
} as const;
export type PlatformKey = keyof typeof PLATFORM;

export const TIER = {
  nano: { min: 1000, max: 10000, mult: 0.7, label: "Nano Influencer" },
  micro: { min: 10001, max: 50000, mult: 0.85, label: "Micro Influencer" },
  mid: { min: 50001, max: 200000, mult: 1.0, label: "Mid-Tier Influencer" },
  macro: { min: 200001, max: 1000000, mult: 1.2, label: "Macro Influencer" },
  mega: { min: 1000001, max: Infinity, mult: 1.5, label: "Mega Influencer" },
} as const;

export const CONTENT_TYPE = {
  static: { mult: 1.0, label: "Static Post", prod: 500, prod_desc: "Photography, basic editing" },
  carousel: { mult: 1.25, label: "Carousel", prod: 800, prod_desc: "Multi-image design, layout" },
  story: { mult: 0.5, label: "Stories", prod: 300, prod_desc: "Quick edit, graphics" },
  reel_short: {
    mult: 1.68,
    label: "Reel/Short Video",
    prod: 1500,
    prod_desc: "Filming, editing, music, effects",
  },
  long_video: {
    mult: 2.5,
    label: "Long Video",
    prod: 3000,
    prod_desc: "Full production, scripting, editing",
  },
} as const;
export type ContentTypeKey = keyof typeof CONTENT_TYPE;

export const CPE_TIER = [
  { min: 0, max: 0.99, cpe_zar: 1.0, label: "Low", color: "#6B7280" },
  { min: 1.0, max: 1.99, cpe_zar: 2.5, label: "Moderate", color: "#8B5CF6" },
  { min: 2.0, max: 3.49, cpe_zar: 4.5, label: "High", color: "#3B82F6" },
  { min: 3.5, max: 5.99, cpe_zar: 7.0, label: "Premium", color: "#C9A84C" },
  { min: 6.0, max: 100, cpe_zar: 11.0, label: "Exceptional", color: "#22C55E" },
];

export const ADDONS = {
  usage_rights: {
    mult: 1.35,
    label: "Usage Rights (Whitelisting)",
    pct: "+35%",
    desc: "Brand can repurpose your content for paid ads and marketing",
  },
  exclusivity_30: {
    mult: 1.25,
    label: "30-Day Exclusivity",
    pct: "+25%",
    desc: "No competing brands for 30 days",
  },
  exclusivity_90: {
    mult: 1.5,
    label: "90-Day Exclusivity",
    pct: "+50%",
    desc: "No competing brands for 90 days",
  },
  rush_delivery: {
    mult: 1.2,
    label: "Rush Delivery (48hrs)",
    pct: "+20%",
    desc: "Content delivered within 48 hours of brief",
  },
  unlimited_revisions: {
    mult: 1.15,
    label: "Unlimited Revisions",
    pct: "+15%",
    desc: "Standard is 2 rounds — this covers unlimited",
  },
} as const;
export type AddonKey = keyof typeof ADDONS;

export const OBJECTIVES = {
  awareness: { mult: 1.0, label: "Brand Awareness" },
  conversion: { mult: 1.1, label: "Conversions / Sales" },
  engagement: { mult: 0.95, label: "Engagement" },
  event: { mult: 1.05, label: "Event / Launch" },
} as const;

export const SCOPES = {
  single: { mult: 1.0, label: "Single post" },
  series_3: { mult: 0.95, label: "3-post series" },
  monthly: { mult: 0.9, label: "Monthly retainer" },
  bundle_8: { mult: 0.85, label: "8-post bundle" },
} as const;

export const BUDGET_TIERS = {
  starter: { mult: 0.9, label: "Starter brand" },
  standard: { mult: 1.0, label: "Standard" },
  premium: { mult: 1.1, label: "Premium brand" },
  enterprise: { mult: 1.2, label: "Enterprise" },
} as const;

export function getTier(followers: number) {
  for (const [key, t] of Object.entries(TIER)) {
    if (followers >= t.min && followers <= t.max) return { key, ...t };
  }
  return null;
}

export function getCpeTier(er: number) {
  return CPE_TIER.find((t) => er >= t.min && er <= t.max) ?? CPE_TIER[0];
}

export interface RateCardInput {
  followers: number;
  views: number;
  interactions: number;
  niche: string;
  contentType: ContentTypeKey;
  platforms: PlatformKey[];
  addons: AddonKey[];
  objective: keyof typeof OBJECTIVES | "";
  scope: keyof typeof SCOPES | "";
  budgetTier: keyof typeof BUDGET_TIERS | "";
  includeProduction: boolean;
}

export function computeRateCard(input: RateCardInput) {
  const { followers, views, interactions } = input;
  const nicheCPM = NICHE_CPM[input.niche];
  const ct = CONTENT_TYPE[input.contentType];

  const selPlats = input.platforms;
  const platData =
    selPlats.length > 0
      ? selPlats.map((p) => PLATFORM[p] ?? PLATFORM.instagram)
      : [PLATFORM.instagram];
  const cpm_mult = platData.reduce((a, p) => a + p.cpm_mult, 0) / platData.length;
  const cpe_mult = platData.reduce((a, p) => a + p.cpe_mult, 0) / platData.length;
  const multiDiscount = selPlats.length > 1 ? 0.9 : 1.0;

  const tier = getTier(followers) ?? { key: "nano", ...TIER.nano };
  const er = followers > 0 ? (interactions / followers) * 100 : 0;
  const cpeTierData = getCpeTier(er);

  const adjustedCPM = nicheCPM.cpm * tier.mult * cpm_mult * ct.mult;
  const price_cpm = (adjustedCPM / 1000) * views;
  const adjustedCPE = cpeTierData.cpe_zar * cpe_mult;
  const price_cpe = adjustedCPE * interactions;

  let premiumMult = 1;
  for (const k of input.addons) if (ADDONS[k]) premiumMult *= ADDONS[k].mult;

  const objMult = OBJECTIVES[input.objective as keyof typeof OBJECTIVES]?.mult ?? 1.0;
  const scopeMult = SCOPES[input.scope as keyof typeof SCOPES]?.mult ?? 1.0;
  const budgetMult = BUDGET_TIERS[input.budgetTier as keyof typeof BUDGET_TIERS]?.mult ?? 1.0;
  const campaignMult = objMult * scopeMult * budgetMult;

  const price_cpm_final = price_cpm * premiumMult * multiDiscount;
  const price_cpe_final = price_cpe * premiumMult * multiDiscount;
  const sponsorship = Math.max(price_cpm_final, price_cpe_final) * campaignMult;

  const productionCost = input.includeProduction ? (ct.prod ?? 500) : 0;
  const total = sponsorship + productionCost;
  const range_low = total * 0.85;
  const range_high = total * 1.15;
  const saAvgRate = (nicheCPM.cpm / 1000) * views;
  const globalAvgRate = saAvgRate / 1.8;

  return {
    followers,
    views,
    interactions,
    selPlats,
    platData,
    cpm_mult,
    cpe_mult,
    multiDiscount,
    niche: input.niche,
    nicheCPM,
    ctKey: input.contentType,
    ct,
    tier,
    er,
    cpeTierData,
    adjustedCPM,
    adjustedCPE,
    price_cpm,
    price_cpe,
    price_cpm_final,
    price_cpe_final,
    premiumMult,
    selAddons: input.addons,
    objMult,
    scopeMult,
    budgetMult,
    campaignMult,
    sponsorship,
    includeProduction: input.includeProduction,
    productionCost,
    total,
    range_low,
    range_high,
    saAvgRate,
    globalAvgRate,
  };
}

export type RateCardResult = ReturnType<typeof computeRateCard>;

// ── Currency ────────────────────────────────────────────────────────────────
// Every African currency: 42 codes covering all 54 countries (XOF = 8 West
// African states, XAF = 6 Central African). All 42 verified present in the
// open.er-api.com USD feed before being listed.
export const CURRENCIES: Record<string, { sym: string; flag: string; label: string }> = {
  ZAR: { sym: "R", flag: "🇿🇦", label: "South Africa" },
  DZD: { sym: "DA", flag: "🇩🇿", label: "Algeria" },
  AOA: { sym: "Kz", flag: "🇦🇴", label: "Angola" },
  BWP: { sym: "P", flag: "🇧🇼", label: "Botswana" },
  BIF: { sym: "FBu", flag: "🇧🇮", label: "Burundi" },
  CVE: { sym: "CVE", flag: "🇨🇻", label: "Cabo Verde" },
  XAF: { sym: "FCFA", flag: "🌍", label: "Central African CFA" },
  KMF: { sym: "CF", flag: "🇰🇲", label: "Comoros" },
  CDF: { sym: "FC", flag: "🇨🇩", label: "Congo (DRC)" },
  DJF: { sym: "Fdj", flag: "🇩🇯", label: "Djibouti" },
  EGP: { sym: "E£", flag: "🇪🇬", label: "Egypt" },
  ERN: { sym: "Nfk", flag: "🇪🇷", label: "Eritrea" },
  SZL: { sym: "E", flag: "🇸🇿", label: "Eswatini" },
  ETB: { sym: "Br", flag: "🇪🇹", label: "Ethiopia" },
  GMD: { sym: "D", flag: "🇬🇲", label: "Gambia" },
  GHS: { sym: "₵", flag: "🇬🇭", label: "Ghana" },
  GNF: { sym: "FG", flag: "🇬🇳", label: "Guinea" },
  KES: { sym: "KSh", flag: "🇰🇪", label: "Kenya" },
  LSL: { sym: "L", flag: "🇱🇸", label: "Lesotho" },
  LRD: { sym: "L$", flag: "🇱🇷", label: "Liberia" },
  LYD: { sym: "LD", flag: "🇱🇾", label: "Libya" },
  MGA: { sym: "Ar", flag: "🇲🇬", label: "Madagascar" },
  MWK: { sym: "MK", flag: "🇲🇼", label: "Malawi" },
  MRU: { sym: "UM", flag: "🇲🇷", label: "Mauritania" },
  MUR: { sym: "₨", flag: "🇲🇺", label: "Mauritius" },
  MAD: { sym: "MAD", flag: "🇲🇦", label: "Morocco" },
  MZN: { sym: "MT", flag: "🇲🇿", label: "Mozambique" },
  NAD: { sym: "N$", flag: "🇳🇦", label: "Namibia" },
  NGN: { sym: "₦", flag: "🇳🇬", label: "Nigeria" },
  RWF: { sym: "FRw", flag: "🇷🇼", label: "Rwanda" },
  STN: { sym: "Db", flag: "🇸🇹", label: "São Tomé and Príncipe" },
  SCR: { sym: "SR", flag: "🇸🇨", label: "Seychelles" },
  SLE: { sym: "Le", flag: "🇸🇱", label: "Sierra Leone" },
  SOS: { sym: "Sh", flag: "🇸🇴", label: "Somalia" },
  SSP: { sym: "SSP", flag: "🇸🇸", label: "South Sudan" },
  SDG: { sym: "SDG", flag: "🇸🇩", label: "Sudan" },
  TZS: { sym: "TSh", flag: "🇹🇿", label: "Tanzania" },
  TND: { sym: "DT", flag: "🇹🇳", label: "Tunisia" },
  UGX: { sym: "USh", flag: "🇺🇬", label: "Uganda" },
  XOF: { sym: "CFA", flag: "🌍", label: "West African CFA" },
  ZMW: { sym: "ZK", flag: "🇿🇲", label: "Zambia" },
  ZWG: { sym: "ZiG", flag: "🇿🇼", label: "Zimbabwe (ZiG)" },
};

// A missing rate must never be papered over with the ZAR rate while keeping the
// foreign symbol — that prints ₦37,747 for what is really R37,747.
export function canConvert(rates: Record<string, number>, code: string): boolean {
  if (code === "ZAR") return true;
  return (
    typeof rates.ZAR === "number" &&
    rates.ZAR > 0 &&
    typeof rates[code] === "number" &&
    rates[code] > 0
  );
}

export function convertFromZar(rates: Record<string, number>, code: string, zar: number): number {
  if (code === "ZAR" || !canConvert(rates, code)) return zar;
  return zar * (rates[code] / rates.ZAR);
}

export function formatCurrency(rates: Record<string, number>, code: string, zar: number): string {
  const usable = canConvert(rates, code) ? code : "ZAR";
  const c = CURRENCIES[usable] ?? CURRENCIES.ZAR;
  return `${c.sym} ${Math.round(convertFromZar(rates, usable, zar)).toLocaleString("en-ZA")}`;
}
