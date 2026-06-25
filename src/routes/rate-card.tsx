import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Calculator, Sparkles, RotateCcw } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/rate-card")({
  head: () => ({
    meta: [
      { title: "Free Rate Card Calculator — what brands should pay you (SA benchmarks) | CHKPLT" },
      {
        name: "description",
        content:
          "Stop undercharging. Get a defensible brand-deal rate built on real South African CPM benchmarks, your engagement, and the deliverable — in seconds. Free.",
      },
      { property: "og:title", content: "Free Rate Card Calculator — CHKPLT" },
    ],
  }),
  component: RateCardPage,
});

// ── Real SA market data (ZAR CPM per niche) ───────────────────────────────
const NICHE_CPM: Record<string, { cpm: number; note: string }> = {
  "Finance & Investing": { cpm: 634.55, note: "Highest-value niche in SA. Capitec, FNB, Nedbank, Absa and Standard Bank have the largest creator budgets in ZA." },
  "Real Estate": { cpm: 543.91, note: "High-value transactions justify premium rates. Property portals and bond originators have active creator budgets." },
  "Tech Reviews": { cpm: 453.25, note: "Purchase-decision content. Samsung, Takealot and telcos (MTN, Vodacom) actively buy tech review placements." },
  "Business & Entrepreneurship": { cpm: 362.60, note: "Decision-maker audiences command premium rates. SA coaching and business-tool brands have growing budgets." },
  "Entertainment": { cpm: 362.60, note: "Netflix SA, Showmax, DSTV and streaming brands drive strong deal activity. Broad demographic appeal." },
  "Education": { cpm: 362.60, note: "Trusted authority positioning. EdTech and online-learning brands pay premium for an engaged learning community." },
  "Automotive": { cpm: 362.60, note: "High-purchase-intent audience. Dealerships, car rental and auto accessories have consistent creator spend." },
  "Fitness & Health": { cpm: 326.34, note: "Dis-Chem, supplement brands and gym chains have significant budgets. Health content drives repeat purchases." },
  "Gaming": { cpm: 326.34, note: "SA esports growing fast. Telcos, peripheral brands and energy drinks actively target gaming audiences." },
  "Personal Development": { cpm: 326.34, note: "Motivated, action-taking audience. Coaching platforms and online courses pay well for qualified leads." },
  "Fashion & Beauty": { cpm: 271.95, note: "Strong SA engagement. Bash, Cotton On and Woolworths pay premium for authentic creators." },
  "Parenting & Family": { cpm: 271.95, note: "Loyal, trust-heavy audience. Baby and education brands value authenticity over raw follower count." },
  "Modelling": { cpm: 271.95, note: "Visual-first content. Fashion/beauty alignment. Strong for seasonal local + international campaigns." },
  "Sports & Athletics": { cpm: 271.95, note: "SA betting brands (Hollywoodbets, Betway, Playa Bets) fund creators heavily. Check platform policy first." },
  "Sustainability & Green": { cpm: 271.95, note: "Woolworths Clean Earth and Pick n Pay organic are active. Early movers will command higher rates." },
  "Travel & Adventure": { cpm: 253.82, note: "SA Tourism is an active partner. Safari lodges, airlines and hotels regularly fund travel content." },
  "Lifestyle": { cpm: 217.56, note: "Broad reach across all demographics. Compensate with strong engagement data — volume is your leverage." },
  "Food & Cooking": { cpm: 217.56, note: "FMCG brands (Tiger Brands, Unilever SA, Pick n Pay, SPAR) are very active. Use volume to negotiate." },
  "Music & Arts": { cpm: 217.56, note: "Streaming platforms and event brands. Creative niche — negotiate with audience-loyalty data." },
  "Comedy & Entertainment": { cpm: 217.56, note: "SA comedy creators consistently undercharge. FMCG and fast-food brands pay for viral reach." },
};

const PLATFORM: Record<string, { cpm: number; cpe: number; name: string }> = {
  instagram: { cpm: 1.0, cpe: 1.0, name: "Instagram" },
  tiktok: { cpm: 0.8, cpe: 0.4, name: "TikTok" },
  youtube: { cpm: 1.8, cpe: 0.25, name: "YouTube" },
  facebook: { cpm: 0.9, cpe: 4.7, name: "Facebook" },
  linkedin: { cpm: 1.5, cpe: 1.2, name: "LinkedIn" },
  twitter_x: { cpm: 0.6, cpe: 0.7, name: "X (Twitter)" },
  pinterest: { cpm: 0.7, cpe: 0.6, name: "Pinterest" },
};

const TIER = [
  { min: 1000, max: 10000, mult: 0.7, label: "Nano Influencer" },
  { min: 10001, max: 50000, mult: 0.85, label: "Micro Influencer" },
  { min: 50001, max: 200000, mult: 1.0, label: "Mid-Tier Influencer" },
  { min: 200001, max: 1000000, mult: 1.2, label: "Macro Influencer" },
  { min: 1000001, max: Infinity, mult: 1.5, label: "Mega Influencer" },
];

const CONTENT_TYPE: Record<string, { mult: number; label: string; prod: number }> = {
  static: { mult: 1.0, label: "Static Post", prod: 500 },
  carousel: { mult: 1.25, label: "Carousel", prod: 800 },
  story: { mult: 0.5, label: "Stories", prod: 300 },
  reel_short: { mult: 1.68, label: "Reel / Short Video", prod: 1500 },
  long_video: { mult: 2.5, label: "Long Video", prod: 3000 },
};

const CPE_TIER = [
  { min: 0, max: 0.99, zar: 1.0, label: "Low" },
  { min: 1.0, max: 1.99, zar: 2.5, label: "Moderate" },
  { min: 2.0, max: 3.49, zar: 4.5, label: "High" },
  { min: 3.5, max: 5.99, zar: 7.0, label: "Premium" },
  { min: 6.0, max: Infinity, zar: 11.0, label: "Exceptional" },
];

const ADDONS: Record<string, { mult: number; label: string; pct: string; desc: string }> = {
  usage_rights: { mult: 1.35, label: "Usage Rights (Whitelisting)", pct: "+35%", desc: "Brand can repurpose your content for paid ads." },
  exclusivity_30: { mult: 1.25, label: "30-Day Exclusivity", pct: "+25%", desc: "No competing brands for 30 days." },
  exclusivity_90: { mult: 1.5, label: "90-Day Exclusivity", pct: "+50%", desc: "No competing brands for 90 days." },
  rush_delivery: { mult: 1.2, label: "Rush Delivery (48hrs)", pct: "+20%", desc: "Content delivered within 48 hours." },
  unlimited_revisions: { mult: 1.15, label: "Unlimited Revisions", pct: "+15%", desc: "Standard is 2 rounds — this covers unlimited." },
};

const OBJECTIVE: Record<string, { mult: number; label: string }> = {
  awareness: { mult: 1.0, label: "Awareness" },
  conversion: { mult: 1.1, label: "Conversion / Sales" },
  engagement: { mult: 0.95, label: "Engagement" },
  event: { mult: 1.05, label: "Event / Launch" },
};

const SCOPE: Record<string, { mult: number; label: string }> = {
  single: { mult: 1.0, label: "Single deliverable" },
  series_3: { mult: 0.95, label: "Series of 3" },
  monthly: { mult: 0.9, label: "Monthly retainer" },
  bundle_8: { mult: 0.85, label: "Bundle of 8+" },
};

const fmtZAR = (n: number) => "R " + Math.round(n).toLocaleString("en-ZA");
const parseNum = (s: string) => parseFloat(String(s).replace(/[,\s]/g, "")) || 0;

interface Inputs {
  niche: string;
  platforms: string[];
  followers: string;
  views: string;
  interactions: string;
  contentType: string;
  addons: string[];
  objective: string;
  scope: string;
  includeProduction: boolean;
}

const INITIAL: Inputs = {
  niche: "Business & Entrepreneurship",
  platforms: ["instagram"],
  followers: "",
  views: "",
  interactions: "",
  contentType: "reel_short",
  addons: [],
  objective: "awareness",
  scope: "single",
  includeProduction: true,
};

function compute(inp: Inputs) {
  const followers = parseNum(inp.followers);
  const views = parseNum(inp.views) || followers; // fall back to follower reach
  const interactions = parseNum(inp.interactions);
  const nicheCPM = NICHE_CPM[inp.niche];
  const ct = CONTENT_TYPE[inp.contentType];
  const plats = inp.platforms.length ? inp.platforms.map((p) => PLATFORM[p]) : [PLATFORM.instagram];
  const cpm_mult = plats.reduce((a, p) => a + p.cpm, 0) / plats.length;
  const cpe_mult = plats.reduce((a, p) => a + p.cpe, 0) / plats.length;
  const multiDiscount = inp.platforms.length > 1 ? 0.9 : 1.0;
  const tier = TIER.find((t) => followers >= t.min && followers <= t.max) ?? TIER[0];
  const er = followers > 0 ? (interactions / followers) * 100 : 0;
  const cpeTier = CPE_TIER.find((t) => er >= t.min && er <= t.max) ?? CPE_TIER[0];

  const adjustedCPM = nicheCPM.cpm * tier.mult * cpm_mult * ct.mult;
  const price_cpm = (adjustedCPM / 1000) * views;
  const adjustedCPE = cpeTier.zar * cpe_mult;
  const price_cpe = adjustedCPE * interactions;

  let premiumMult = 1;
  inp.addons.forEach((k) => (premiumMult *= ADDONS[k]?.mult ?? 1));
  const campaignMult = (OBJECTIVE[inp.objective]?.mult ?? 1) * (SCOPE[inp.scope]?.mult ?? 1);

  const price_cpm_final = price_cpm * premiumMult * multiDiscount;
  const price_cpe_final = price_cpe * premiumMult * multiDiscount;
  const sponsorship = Math.max(price_cpm_final, price_cpe_final) * campaignMult;
  const productionCost = inp.includeProduction ? ct.prod : 0;
  const total = sponsorship + productionCost;

  return {
    valid: followers >= 1000,
    followers, views, interactions, tier, er, cpeTier, nicheCPM, ct,
    cpm_mult, multiDiscount, premiumMult, campaignMult,
    leadMetric: price_cpm_final >= price_cpe_final ? "reach (CPM)" : "engagement (CPE)",
    productionCost, total,
    low: total * 0.85,
    high: total * 1.15,
  };
}

// ── UI ────────────────────────────────────────────────────────────────────
const LABEL = "font-display text-[#0F172A] text-sm font-bold leading-snug block mb-1.5";
const HINT = "text-[#555] text-xs mb-2";
const NUM =
  "w-full h-11 border border-[#d0c8bc] bg-white rounded-md px-3 text-[15px] text-[#0F172A] focus:border-[#F59E0B] focus:outline-none focus:ring-0";
const SEL = NUM + " appearance-none";

function RateCardPage() {
  const [inp, setInp] = useState<Inputs>(INITIAL);
  const [showResult, setShowResult] = useState(false);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInp((s) => ({ ...s, [k]: v }));
  const toggle = (k: "platforms" | "addons", v: string) =>
    setInp((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));

  const R = useMemo(() => compute(inp), [inp]);

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 pt-24 pb-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
            <Calculator className="size-3.5" /> Free Rate Card Calculator
          </div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase leading-[1.05]">
            Stop undercharging. <strong>Know your number.</strong>
          </h1>
          <p className="text-[#555] mt-3 max-w-md mx-auto">
            Built on real South African CPM benchmarks, your engagement, and the deliverable. Walk into the negotiation with a defensible rate — not a guess.
          </p>
        </div>

        {!showResult ? (
          <div className="border border-[#e8e0d4] rounded-2xl bg-white p-6 sm:p-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.10)] space-y-6">
            <div>
              <label className={LABEL}>Your niche</label>
              <p className={HINT}>This sets the SA brand-budget benchmark (CPM).</p>
              <select className={SEL} value={inp.niche} onChange={(e) => set("niche", e.target.value)}>
                {Object.keys(NICHE_CPM).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>Platform(s)</label>
              <p className={HINT}>Pick where this deliverable lives. Multiple = a small bundle discount.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(PLATFORM).map(([k, p]) => {
                  const on = inp.platforms.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggle("platforms", k)}
                      className={`text-left py-2.5 px-3 border rounded-lg text-sm font-medium transition-all ${
                        on ? "bg-[#F59E0B] border-[#F59E0B] text-[#111]" : "border-[#d0c8bc] bg-white text-[#555] hover:border-[#F59E0B]"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Followers</label>
                <input className={NUM} inputMode="numeric" value={inp.followers} onChange={(e) => set("followers", e.target.value)} placeholder="e.g. 45000" />
              </div>
              <div>
                <label className={LABEL}>Avg views / post</label>
                <input className={NUM} inputMode="numeric" value={inp.views} onChange={(e) => set("views", e.target.value)} placeholder="e.g. 30000" />
              </div>
              <div>
                <label className={LABEL}>Avg interactions</label>
                <input className={NUM} inputMode="numeric" value={inp.interactions} onChange={(e) => set("interactions", e.target.value)} placeholder="likes+comments" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Deliverable</label>
                <select className={SEL} value={inp.contentType} onChange={(e) => set("contentType", e.target.value)}>
                  {Object.entries(CONTENT_TYPE).map(([k, c]) => (
                    <option key={k} value={k}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Campaign goal</label>
                <select className={SEL} value={inp.objective} onChange={(e) => set("objective", e.target.value)}>
                  {Object.entries(OBJECTIVE).map(([k, o]) => (
                    <option key={k} value={k}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Scope</label>
                <select className={SEL} value={inp.scope} onChange={(e) => set("scope", e.target.value)}>
                  {Object.entries(SCOPE).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL}>Add-ons (raise the rate)</label>
              <div className="grid gap-2">
                {Object.entries(ADDONS).map(([k, a]) => {
                  const on = inp.addons.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggle("addons", k)}
                      className={`flex items-center justify-between gap-3 text-left py-2.5 px-3 border rounded-lg transition-all ${
                        on ? "border-[#F59E0B] bg-[#FBF7EC]" : "border-[#d0c8bc] bg-white hover:border-[#F59E0B]"
                      }`}
                    >
                      <span>
                        <span className="font-display font-bold text-sm text-[#0F172A]">{a.label}</span>
                        <span className="block text-[#555] text-xs">{a.desc}</span>
                      </span>
                      <span className="font-mono text-xs text-banana shrink-0">{a.pct}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-[#0F172A] cursor-pointer">
              <input type="checkbox" checked={inp.includeProduction} onChange={(e) => set("includeProduction", e.target.checked)} className="size-4 accent-[#F59E0B]" />
              Add production cost ({fmtZAR(CONTENT_TYPE[inp.contentType].prod)} for {CONTENT_TYPE[inp.contentType].label.toLowerCase()})
            </label>

            <Button
              type="button"
              disabled={!R.valid}
              onClick={() => setShowResult(true)}
              className="w-full bg-[#F59E0B] hover:bg-[#b8963e] text-[#111] font-display font-black uppercase tracking-wide text-sm py-3 h-auto disabled:opacity-40"
            >
              Calculate my rate <ArrowRight className="size-4 ml-1" />
            </Button>
            {!R.valid && (
              <p className="text-center text-[#555] text-xs -mt-2">Enter at least 1,000 followers to calculate.</p>
            )}
            <p className="text-center text-[#777] text-xs">Free. Nothing leaves your browser. Rates in ZAR.</p>
          </div>
        ) : (
          <RateResult R={R} inp={inp} onReset={() => setShowResult(false)} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function RateResult({ R, inp, onReset }: { R: ReturnType<typeof compute>; inp: Inputs; onReset: () => void }) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
          <Sparkles className="size-3.5" /> Your rate, with receipts
        </div>
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#777]">Recommended rate</div>
        <div className="font-display text-5xl sm:text-6xl text-banana mt-1">{fmtZAR(R.total)}</div>
        <div className="text-[#2A2A2A] mt-2">
          Negotiation range <strong>{fmtZAR(R.low)} — {fmtZAR(R.high)}</strong> per {CONTENT_TYPE[inp.contentType].label.toLowerCase()}
        </div>
      </div>

      <div className="border border-[#e8e0d4] rounded-2xl bg-white p-6 sm:p-8 space-y-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.10)]">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-[#F59E0B]/40 rounded-xl p-4 bg-[#FBF7EC]">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#777] mb-1">Minimum floor</div>
            <div className="font-display text-2xl text-[#0F172A]">{fmtZAR(R.low)}</div>
            <p className="text-[#555] text-sm mt-1">Don't go below this. Walk away instead.</p>
          </div>
          <div className="border border-[#e8e0d4] rounded-xl p-4 bg-[#FBFAF8]">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#777] mb-1">Priced on your</div>
            <div className="font-display text-2xl text-[#0F172A] capitalize">{R.leadMetric}</div>
            <p className="text-[#555] text-sm mt-1">The stronger of your reach vs engagement set this rate.</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <Row k={`Tier — ${R.tier.label}`} v={`×${R.tier.mult.toFixed(2)}`} />
          <Row k={`Engagement rate — ${R.er.toFixed(2)}% (${R.cpeTier.label})`} v={R.cpeTier.label} />
          <Row k={`Platform mix avg`} v={`×${R.cpm_mult.toFixed(2)}`} />
          <Row k={`Deliverable — ${R.ct.label}`} v={`×${R.ct.mult.toFixed(2)}`} />
          {inp.platforms.length > 1 && <Row k="Multi-platform discount" v={`×${R.multiDiscount.toFixed(2)}`} />}
          {R.premiumMult > 1 && <Row k="Add-ons" v={`×${R.premiumMult.toFixed(2)}`} />}
          {R.campaignMult !== 1 && <Row k="Goal × scope" v={`×${R.campaignMult.toFixed(2)}`} />}
          {R.productionCost > 0 && <Row k="Production cost" v={`+ ${fmtZAR(R.productionCost)}`} />}
        </div>

        <div className="border border-[#e8e0d4] rounded-xl p-4 bg-[#FBFAF8]">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#777] mb-1">{inp.niche} — SA market note</div>
          <p className="text-[#2A2A2A] text-sm">{R.nicheCPM.note}</p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase text-[#5a5a5a] hover:text-[#0F172A] transition-colors"
        >
          <RotateCcw className="size-3.5" /> Recalculate
        </button>
      </div>

      <div className="mt-8 text-center border border-[#e8e0d4] rounded-2xl p-6 bg-white">
        <h3 className="font-display text-xl uppercase">Now go close the deal</h3>
        <p className="text-[#555] text-sm mt-2 max-w-md mx-auto">
          A number is step one. The Foundation Kit hands you the rate-card template, the "I don't do freebies" reply script, and the system to turn one brand reply into a recurring retainer.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/products/$slug"
            params={{ slug: "called-expert-foundation-kit" }}
            className="cta-glow inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-display font-black uppercase tracking-wide"
          >
            Get the Foundation Kit <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/offer-builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-mono uppercase tracking-[0.15em] border border-[#F59E0B] text-[#0F172A] hover:bg-[#F59E0B] hover:text-[#111] transition-colors"
          >
            Build your offer next
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0ebe1] pb-2">
      <span className="text-[#555]">{k}</span>
      <span className="font-mono text-[#0F172A]">{v}</span>
    </div>
  );
}
