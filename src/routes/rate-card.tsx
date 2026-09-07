import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Printer, Sparkles, Check, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { TurnstileGate, type TurnstileGateHandle } from "@/components/TurnstileGate";
import { useToolView, useToolStart, trackToolEvent } from "@/lib/tool-analytics";
import {
  DotGrid,
  GoldGlow,
  Eyebrow,
  Pill,
  Panel,
  PanelHeader,
  Field,
  Input,
  Select,
  Chip,
  GoldButton,
} from "@/components/tools/premium";
import { BrandLogo } from "@/components/tools/brand-logos";
import { joinToolProWaitlist } from "@/lib/tool-pro-waitlist.functions";
import { getUtm } from "@/lib/utm";
import {
  NICHE_CPM,
  PLATFORM,
  CONTENT_TYPE,
  ADDONS,
  OBJECTIVES,
  SCOPES,
  BUDGET_TIERS,
  CURRENCIES,
  DISTRIBUTION_ADDONS,
  USAGE_DURATION,
  WHITELISTING,
  VALIDITY_DAYS,
  computeRateCard,
  computePackages,
  canConvert,
  formatCurrency,
  type PlatformKey,
  type ContentTypeKey,
  type AddonKey,
  type RateCardResult,
} from "@/lib/rate-card-engine";

// Rebuilt native, 2026-08-13. Re-architected 2026-08-25 into a live two-column
// workspace: the maths runs on every keystroke and the dark obsidian summary
// card recalculates in real time — no "Calculate" button, no loading theatre.
// On desktop the summary is a sticky right rail; on mobile it collapses into a
// bottom bar that expands to a bottom-sheet drawer, so the running total and the
// PDF action are always one thumb away no matter how far the form scrolls.
//
// The maths is untouched — it lives in rate-card-engine.ts, ported verbatim from
// the original iframed tool and diffed to floating-point precision.

export const Route = createFileRoute("/rate-card")({
  head: () => ({
    meta: [
      {
        title:
          "Free Rate Card Calculator — what brands should pay you (African benchmarks) | CHKPLT",
      },
      {
        name: "description",
        content:
          "Stop undercharging. Get a defensible brand-deal rate built on real African CPM benchmarks, your last 30 days of engagement, and the deliverable — in seconds. Free.",
      },
      { property: "og:title", content: "Free Rate Card Calculator — CHKPLT" },
    ],
  }),
  component: RateCardPage,
});

const PLATFORM_KEYS = Object.keys(PLATFORM) as PlatformKey[];
const NICHES = Object.keys(NICHE_CPM);
const CURRENCY_KEYS = Object.keys(CURRENCIES);
const POPULAR = ["ZAR", "NGN", "KES", "GHS", "EGP", "TZS", "UGX"];

const EXAMPLE = {
  followers: "50000",
  views: "120000",
  interactions: "3500",
  niche: "Fashion & Beauty",
  contentType: "reel_short" as ContentTypeKey,
  platforms: ["instagram", "tiktok"] as PlatformKey[],
};

function digits(s: string) {
  return Number(String(s).replace(/[^\d.]/g, "")) || 0;
}
function grouped(s: string) {
  const n = digits(s);
  return n ? n.toLocaleString("en-GB") : "";
}

function RateCardPage() {
  useToolView("rate-card");
  const markStart = useToolStart("rate-card");

  const [platforms, setPlatforms] = useState<PlatformKey[]>(["instagram"]);
  const [niche, setNiche] = useState("");
  const [contentType, setContentType] = useState<ContentTypeKey>("reel_short");
  const [followers, setFollowers] = useState("");
  const [views, setViews] = useState("");
  const [interactions, setInteractions] = useState("");
  const [objective, setObjective] = useState("");
  const [scope, setScope] = useState("");
  const [budgetTier, setBudgetTier] = useState("");
  const [addons, setAddons] = useState<AddonKey[]>([]);
  const [includeProduction, setIncludeProduction] = useState(false);

  const [currency, setCurrency] = useState("ZAR");
  const [rates, setRates] = useState<Record<string, number>>({ ZAR: 18.5, USD: 1 });
  const [ratesLive, setRatesLive] = useState(false);

  // Every section is always open — accordions hid the form behind chevrons and
  // read as dead buttons on mobile. The only collapsible thing left is the
  // summary drawer.
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Lifted so "See the full working" in the summary can both open it and scroll
  // to it in a single tap, instead of landing on a still-collapsed panel.
  const [showWorking, setShowWorking] = useState(false);

  // The "Partnership Investment" document — the forwardable 1% deliverable built
  // on top of the calculated rate. Packages price off the computed base; the
  // value stack is shown à-la-carte. Customization (accent/logo/footer) is the
  // Pro payoff — it styles the (watermarked) preview; the clean export is Pro.
  const [docName, setDocName] = useState("");
  const [docHandle, setDocHandle] = useState("");
  const [docProof, setDocProof] = useState("");
  const [docQuarter, setDocQuarter] = useState("");
  const [docNotes, setDocNotes] = useState("");
  const [retainer, setRetainer] = useState(false);
  const [accent, setAccent] = useState("#8B5CF6");
  const [logo, setLogo] = useState("");
  const [footer, setFooter] = useState("");

  function readLogo(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) {
      toast.error("Logo must be under 2MB.");
      return;
    }
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(file);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.rates) return;
        setRates(d.rates);
        setRatesLive(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const money = (zar: number) => formatCurrency(rates, currency, zar);
  const converts = canConvert(rates, currency);

  const f = digits(followers);
  const v = digits(views);
  const i = digits(interactions);
  const valid = f > 0 && v > 0 && !!niche;

  // The whole tool is this line now: recompute on every change. computeRateCard
  // is pure and cheap, so a live useMemo replaces the old three-screen flow.
  const result = useMemo<RateCardResult | null>(() => {
    if (!valid) return null;
    return computeRateCard({
      followers: f,
      views: v,
      interactions: i,
      niche,
      contentType,
      platforms,
      addons,
      objective: objective as never,
      scope: scope as never,
      budgetTier: budgetTier as never,
      includeProduction,
    });
  }, [
    valid,
    f,
    v,
    i,
    niche,
    contentType,
    platforms,
    addons,
    objective,
    scope,
    budgetTier,
    includeProduction,
  ]);

  // The 3-package offer ladder, priced off the creator's own computed rate.
  const packages = useMemo(
    () => (result ? computePackages(result.total, { retainer }) : []),
    [result, retainer],
  );

  function printDocument() {
    trackToolEvent("rate-card", "complete", { meta: { document: true } });
    if (typeof window !== "undefined") window.print();
  }

  // Fire the "complete" analytic once, the first time a full rate exists.
  const firedComplete = useRef(false);
  useEffect(() => {
    if (!result || firedComplete.current) return;
    firedComplete.current = true;
    trackToolEvent("rate-card", "complete", {
      meta: {
        niche,
        contentType,
        platforms: platforms.join("+"),
        currency,
        totalZar: Math.round(result.total),
      },
    });
  }, [result, niche, contentType, platforms, currency]);

  // Lock the page behind the drawer while it's up.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const togglePlatform = (k: PlatformKey) => {
    markStart();
    setPlatforms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  };
  const toggleAddon = (k: AddonKey) => {
    markStart();
    setAddons((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  };
  function loadExample() {
    markStart();
    setFollowers(grouped(EXAMPLE.followers));
    setViews(grouped(EXAMPLE.views));
    setInteractions(grouped(EXAMPLE.interactions));
    setNiche(EXAMPLE.niche);
    setContentType(EXAMPLE.contentType);
    setPlatforms(EXAMPLE.platforms);
  }

  // Closing the drawer unlocks the body via an effect that runs AFTER this
  // handler — so scrolling here would fire while the body is still locked and do
  // nothing (the "dead button"). Unlock synchronously, then scroll on the next
  // frame once the drawer has actually gone.
  function scrollToId(id: string) {
    if (typeof document === "undefined") return;
    document.body.style.overflow = "";
    setDrawerOpen(false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      ),
    );
  }
  const goToPdf = () => scrollToId("get-pdf");
  const goToWorking = () => {
    setShowWorking(true);
    scrollToId("full-working");
  };

  return (
    // No overflow-clipping wrapper around the workspace: an ancestor with
    // `overflow: hidden` silently breaks `position: sticky`, which is what made
    // the summary rail scroll away instead of pinning. The dot grid is a plain
    // absolute backdrop (it doesn't bleed, so it needs no clipping); the only
    // bleeding glows live inside cards that clip themselves.
    <div
      className="relative min-h-screen overflow-x-clip"
      style={{
        background:
          "radial-gradient(1200px 700px at 12% -8%, rgba(139,92,246,0.20), transparent 55%)," +
          "radial-gradient(1000px 650px at 100% 0%, rgba(236,72,153,0.18), transparent 55%)," +
          "radial-gradient(1100px 800px at 60% 108%, rgba(59,130,246,0.16), transparent 55%)," +
          "linear-gradient(180deg, #F7F5FF 0%, #FBF7FE 45%, #F5F7FF 100%)",
      }}
    >
      <SiteHeader />
      <DotGrid />
      <div className="relative">
        <div className="px-5 pt-3 sm:px-6">
          <BackNav to="/tools" label="All tools" />
        </div>

        <header className="mx-auto max-w-6xl px-5 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Eyebrow>Creator · Free Tool</Eyebrow>
            <Pill className="whitespace-nowrap">African CPM Data · 2024/2025</Pill>
          </div>
          <h1 className="mt-6 font-display text-[32px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#1A1523] sm:text-[52px]">
            Know your <span className="text-[#8B5CF6]">number</span> before they ask.
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-[1.6] text-neutral-600 sm:text-[17px]">
            Configure the deal on the left. Your rate builds itself in real time — off real African
            CPM benchmarks, your last 30 days, and the deliverable.
          </p>
          <div className="mt-6 h-[3px] w-16 rounded-full bg-[#8B5CF6]" />
        </header>

        {/* Two-column workspace. Left scrolls; right rail is sticky on desktop. */}
        <div className="mx-auto grid max-w-6xl gap-5 px-5 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1fr)_368px] lg:items-start lg:gap-6 lg:pb-20">
          {/* LEFT — configuration */}
          <div className="space-y-4">
            {/* Currency */}
            <Panel className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="sm:w-[320px]">
                  <Field label="Currency">
                    <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <optgroup label="Most used">
                        {POPULAR.map((c) => (
                          <option key={c} value={c}>
                            {CURRENCIES[c].flag} {c} — {CURRENCIES[c].label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="All of Africa (A–Z)">
                        {CURRENCY_KEYS.slice()
                          .sort((a, b) => CURRENCIES[a].label.localeCompare(CURRENCIES[b].label))
                          .map((c) => (
                            <option key={c} value={c}>
                              {CURRENCIES[c].flag} {c} — {CURRENCIES[c].label}
                            </option>
                          ))}
                      </optgroup>
                    </Select>
                  </Field>
                </div>
                <p className="text-[12.5px] text-neutral-500 sm:pb-3 sm:text-right">
                  {converts ? (
                    <>
                      {CURRENCIES[currency].flag} 1 USD = {CURRENCIES[currency].sym}
                      {(rates[currency] ?? 1).toFixed(2)}
                      <span className="ml-1 text-neutral-400">· {ratesLive ? "live" : "approx."}</span>
                    </>
                  ) : (
                    <span className="text-[#7C3AED]">⚠ Live rate for {currency} unavailable — showing rands</span>
                  )}
                </p>
              </div>
            </Panel>

            {/* Platforms */}
            <Section
              title="Where do you post?"
              step="1"
              hint="Pick every platform this deal covers. Two or more applies a 10% bundle discount."
            >
              <div className="grid gap-2.5 p-5 sm:grid-cols-2 sm:p-6">
                {PLATFORM_KEYS.map((k) => (
                  <Chip key={k} active={platforms.includes(k)} onClick={() => togglePlatform(k)}>
                    <span className="inline-flex items-center gap-2.5">
                      <BrandLogo platform={k} className="h-5 w-5 shrink-0" />
                      {PLATFORM[k].name}
                    </span>
                  </Chip>
                ))}
              </div>
            </Section>

            {/* Numbers */}
            <Section
              title="Your real numbers"
              step="2"
              hint="Pull these from your own analytics, set to the LAST 30 DAYS — brands ask for a recent window."
            >
              <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
                <Field label="Followers" hint="Total today, across the platforms above">
                  <Input
                    inputMode="numeric"
                    placeholder="50 000"
                    value={followers}
                    onChange={(e) => {
                      markStart();
                      setFollowers(e.target.value);
                    }}
                    onBlur={(e) => setFollowers(grouped(e.target.value))}
                  />
                </Field>
                <Field label="Views per post" hint="Your average over the last 30 days">
                  <Input
                    inputMode="numeric"
                    placeholder="120 000"
                    value={views}
                    onChange={(e) => {
                      markStart();
                      setViews(e.target.value);
                    }}
                    onBlur={(e) => setViews(grouped(e.target.value))}
                  />
                </Field>
                <Field label="Interactions" hint="Likes + comments + saves + shares, last 30 days">
                  <Input
                    inputMode="numeric"
                    placeholder="3 500"
                    value={interactions}
                    onChange={(e) => {
                      markStart();
                      setInteractions(e.target.value);
                    }}
                    onBlur={(e) => setInteractions(grouped(e.target.value))}
                  />
                </Field>
                <Field
                  label="Your niche"
                  hint="Sets the CPM benchmark — this moves the number more than anything else"
                  className="sm:col-span-2"
                >
                  <Select
                    value={niche}
                    onChange={(e) => {
                      markStart();
                      setNiche(e.target.value);
                    }}
                  >
                    <option value="">Select your niche…</option>
                    {NICHES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Deliverable">
                  <Select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentTypeKey)}
                  >
                    {(Object.keys(CONTENT_TYPE) as ContentTypeKey[]).map((k) => (
                      <option key={k} value={k}>
                        {CONTENT_TYPE[k].label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              {niche && (
                <div className="mx-5 mb-5 rounded-xl border border-[#8B5CF6]/35 bg-[#8B5CF6]/[0.07] p-4 sm:mx-6 sm:mb-6">
                  <Eyebrow>{niche} · African market</Eyebrow>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-700">
                    {NICHE_CPM[niche].notes}
                  </p>
                </div>
              )}
            </Section>

            {/* Deal shape */}
            <Section
              title="The deal"
              step="3"
              hint="Optional — leave blank if the brand hasn't said yet."
            >
              <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
                <Field label="Objective">
                  <Select value={objective} onChange={(e) => setObjective(e.target.value)}>
                    <option value="">Not specified</option>
                    {Object.entries(OBJECTIVES).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Scope">
                  <Select value={scope} onChange={(e) => setScope(e.target.value)}>
                    <option value="">Not specified</option>
                    {Object.entries(SCOPES).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Brand size">
                  <Select value={budgetTier} onChange={(e) => setBudgetTier(e.target.value)}>
                    <option value="">Not specified</option>
                    {Object.entries(BUDGET_TIERS).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </Section>

            {/* Add-ons */}
            <Section
              title="What else are they asking for?"
              step="4"
              hint="Each one is real work or real risk. Charge for it."
            >
              <div className="grid gap-2.5 p-5 sm:grid-cols-2 sm:p-6">
                {(Object.keys(ADDONS) as AddonKey[]).map((k) => (
                  <Chip
                    key={k}
                    active={addons.includes(k)}
                    onClick={() => toggleAddon(k)}
                    sub={ADDONS[k].desc}
                  >
                    {ADDONS[k].label} · {ADDONS[k].pct}
                  </Chip>
                ))}
                <Chip
                  active={includeProduction}
                  onClick={() => setIncludeProduction((val) => !val)}
                  sub={`${CONTENT_TYPE[contentType].prod_desc} · +${money(CONTENT_TYPE[contentType].prod)}`}
                >
                  Add production costs
                </Chip>
              </div>
            </Section>

            <button
              onClick={loadExample}
              className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-6 text-[14px] font-bold text-neutral-700 transition hover:border-neutral-400"
            >
              Load an example
            </button>

            <Section
              title="Your details"
              step="5"
              hint="For the Partnership Investment document you send the brand."
            >
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <Field label="Name / brand"><Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Ndivhuwo Muhanelwa" /></Field>
                <Field label="@handle"><Input value={docHandle} onChange={(e) => setDocHandle(e.target.value)} placeholder="@nochill_god" /></Field>
                <Field label="One-line proof" className="sm:col-span-2"><Input value={docProof} onChange={(e) => setDocProof(e.target.value)} placeholder="Avg 120K views · 4.6% ER · 1.1M monthly reach" /></Field>
                <Field label="Quarter / period"><Input value={docQuarter} onChange={(e) => setDocQuarter(e.target.value)} placeholder="Q3 2026" /></Field>
              </div>
            </Section>

            <Section
              title="Retainer & notes"
              step="6"
              hint={`Rates stay valid for ${VALIDITY_DAYS} days — that's on the document automatically.`}
            >
              <div className="space-y-4 p-5 sm:p-6">
                <Chip active={retainer} onClick={() => setRetainer((v) => !v)} sub="−15% off every package — pushes brands to 3+ campaigns">
                  Offer a monthly retainer discount
                </Chip>
                <Field label="Notes for brands" hint="Shows you think like a partner, not inventory.">
                  <textarea
                    className="w-full min-h-[88px] rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[16px] text-[#1A1523] outline-none transition placeholder:text-neutral-400 focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 resize-y"
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    placeholder="Open to long-term ambassadorships. Happy to align on KPIs (clicks, sign-ups, sales) and provide UTM/coupon tracking."
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Design & branding"
              step="7"
              hint="Make the document yours — colour, logo, footer."
            >
              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-[#1A1523]">
                    Accent colour <span className="rounded bg-[#8B5CF6]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7C3AED]">Pro</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {["#8B5CF6", "#EC4899", "#3B82F6", "#1A1523", "#0F766E", "#DB2777", "#EA580C", "#F59E0B"].map((c) => (
                      <button key={c} type="button" onClick={() => setAccent(c)} aria-label={c}
                        className={`h-9 w-9 rounded-full border-2 transition ${accent === c ? "scale-110 border-[#1A1523]" : "border-transparent"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                    <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 text-[13px] font-semibold text-neutral-600">
                      Custom
                      <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0" />
                    </label>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-[#1A1523]">
                    Logo <span className="rounded bg-[#8B5CF6]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7C3AED]">Pro</span>
                  </div>
                  {logo ? (
                    <div className="flex items-center gap-3">
                      <img src={logo} alt="" className="h-12 w-12 rounded-lg border border-neutral-200 object-contain" />
                      <button type="button" onClick={() => setLogo("")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500 hover:text-red-500"><X className="size-3.5" /> Remove</button>
                    </div>
                  ) : (
                    <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 text-[13px] font-semibold text-neutral-500 hover:border-[#8B5CF6]">
                      <Upload className="size-4" /> Upload logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => readLogo(e.target.files?.[0])} />
                    </label>
                  )}
                </div>
                <Field label="Custom footer"><Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="© 2026 Your Name · yoursite.com" /></Field>
              </div>
            </Section>
          </div>

          {/* RIGHT — sticky summary (desktop only). top-20 clears the 64px
              sticky site header; the parent no longer clips overflow, so this
              actually pins now. The max-height + internal scroll is load-bearing:
              without it, a card taller than the viewport pins its top and hangs
              its bottom (the buttons) off-screen — the "stuck in the middle" bug.
              Capping it to the viewport lets the whole card, buttons included,
              always be reachable. */}
          <aside className="hidden lg:block">
            <div className="no-scrollbar sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto">
              <SummaryCard
                result={result}
                money={money}
                currency={currency}
                rates={rates}
                onPdf={goToPdf}
                onWorking={goToWorking}
              />
            </div>
          </aside>
        </div>

        {/* The forwardable 1% deliverable + the analytical backing, once a rate exists */}
        {result && (
          <div className="mx-auto max-w-6xl space-y-6 px-5 pb-24 sm:px-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <Eyebrow>Your partnership investment</Eyebrow>
                <GoldButton type="button" onClick={printDocument} className="!min-h-[44px] w-auto px-5 text-[13px]">
                  <Printer className="size-4" /> Save as PDF
                </GoldButton>
              </div>
              <div className="rc-document">
                <InvestmentDocument
                  result={result}
                  money={money}
                  packages={packages}
                  name={docName}
                  handle={docHandle}
                  niche={niche}
                  proof={docProof}
                  quarter={docQuarter}
                  notes={docNotes}
                  retainer={retainer}
                  accent={accent}
                  logo={logo}
                  footer={footer}
                />
              </div>
            </div>

            <ProWaitlist tool="rate-card" fullName={docName} />

            <DeepDive
              result={result}
              money={money}
              currency={currency}
              rates={rates}
              showWorking={showWorking}
              onToggleWorking={() => setShowWorking((v) => !v)}
              docExtras={{ packages, quarter: docQuarter, notes: docNotes }}
            />
          </div>
        )}
      </div>

      {/* Print only the Partnership Investment document (visibility trick keeps
          its watermark; everything else is hidden). */}
      <style>{`@media print {
        body { visibility: hidden !important; }
        .rc-document, .rc-document * { visibility: visible !important; }
        .rc-document { position: absolute !important; left: 0; top: 0; width: 100%; }
      }`}</style>

      {result && <UpsellBand />}
      <SiteFooter />

      {/* MOBILE — sticky bottom bar + expandable drawer. Only once there's a
          rate to act on; before that it's empty chrome. The spacer gives the
          footer room to clear the fixed bar at the very bottom of the scroll. */}
      {result && (
        <>
          <MobileSummaryBar
            result={result}
            money={money}
            onExpand={() => setDrawerOpen(true)}
            onPdf={goToPdf}
          />
          <div className="h-20 lg:hidden" aria-hidden />
        </>
      )}
      {drawerOpen && (
        <MobileDrawer onClose={() => setDrawerOpen(false)}>
          <SummaryCard
            result={result}
            money={money}
            currency={currency}
            rates={rates}
            onPdf={goToPdf}
            onWorking={goToWorking}
          />
        </MobileDrawer>
      )}
    </div>
  );
}

// A titled section card — always open. The step sits in a gold badge so the
// header reads as a heading, never a tappable/dead control.
function Section({
  title,
  step,
  hint,
  children,
}: {
  title: string;
  step: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <Panel>
      <div className="flex items-start gap-3.5 px-5 py-4 sm:px-6">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A1523] font-display text-[13px] font-extrabold text-[#8B5CF6]">
          {step}
        </span>
        <div>
          <h2 className="font-display text-[15px] font-bold tracking-tight text-[#1A1523] sm:text-base">
            {title}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-neutral-500">{hint}</p>
        </div>
      </div>
      <div className="border-t border-neutral-200/80">{children}</div>
    </Panel>
  );
}

// The dark obsidian summary — the one component shared by the desktop rail and
// the mobile drawer. It reads `result` live; before the form is valid it shows
// what's still needed rather than a zero.
function SummaryCard({
  result: r,
  money,
  currency,
  rates,
  onPdf,
  onWorking,
}: {
  result: RateCardResult | null;
  money: (zar: number) => string;
  currency: string;
  rates: Record<string, number>;
  onPdf: () => void;
  onWorking: () => void;
}) {
  const usableCurrency = canConvert(rates, currency) ? currency : "ZAR";
  const base = r ? Math.max(r.price_cpm, r.price_cpe) : 0;
  const adjustments = r ? r.sponsorship - base : 0;
  const usd =
    r && rates.ZAR > 0 ? Math.round(r.total / rates.ZAR).toLocaleString("en-US") : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#8B5CF6]/30 bg-[#1A1523] p-6 shadow-[0_28px_70px_-30px_rgba(0,0,0,0.8)] sm:p-7">
      <DotGrid dark />
      <GoldGlow className="-right-24 -top-28" size={420} opacity={0.6} />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow className="!text-[#8B5CF6]">Your opening quote</Eyebrow>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        </div>

        {!r ? (
          <div className="mt-5">
            <p className="font-display text-[34px] font-extrabold leading-none tracking-[-0.03em] text-white/25">
              {CURRENCIES[usableCurrency].sym} —
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-white/55">
              Add your <strong className="text-white/80">followers</strong>,{" "}
              <strong className="text-white/80">views</strong> and{" "}
              <strong className="text-white/80">niche</strong> and your rate appears here — and
              updates as you go.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Pill tone="gold">{r.tier.label}</Pill>
              <span className="text-[12px] text-white/45">
                {CURRENCIES[usableCurrency].flag} {usableCurrency}
              </span>
            </div>

            <p className="mt-4 font-display text-[42px] font-extrabold leading-none tracking-[-0.03em] text-[#C4B5FD] [font-variant-numeric:tabular-nums] sm:text-[52px]">
              {money(r.total)}
            </p>
            {usd && <p className="mt-2 text-[13px] text-white/40">≈ ${usd} USD</p>}
            <p className="mt-2 text-[13px] text-white/50">
              {r.niche} · {r.ct.label} ·{" "}
              {r.selPlats.map((p) => PLATFORM[p].name).join(" + ") || "Instagram"}
            </p>

            {/* Itemized lineage */}
            <div className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-[13.5px]">
              <SummaryRow label="Base rate (CPM/CPE)" value={money(base)} />
              {adjustments > 0.5 && (
                <SummaryRow label="Add-ons & campaign terms" value={`+${money(adjustments)}`} />
              )}
              {r.includeProduction && (
                <SummaryRow label={`Production (${r.ct.label})`} value={`+${money(r.productionCost)}`} />
              )}
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                <span className="text-[13px] font-bold uppercase tracking-wider text-white/60">Total</span>
                <span className="font-display text-[18px] font-extrabold text-[#C4B5FD]">
                  {money(r.total)}
                </span>
              </div>
            </div>

            {/* Floor / Standard / Premium */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <MiniRate label="Floor" value={money(r.range_low)} />
              <MiniRate label="Standard" value={money(r.total)} hero />
              <MiniRate label="Premium" value={money(r.range_high)} />
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onPdf}
          disabled={!r}
          className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] px-6 text-[15px] font-bold text-white transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Email me the rate card PDF →
        </button>
        <button
          type="button"
          onClick={onWorking}
          disabled={!r}
          className="mt-2.5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/20 px-6 text-[14px] font-bold text-white/85 transition hover:border-[#8B5CF6] hover:text-[#C4B5FD] disabled:cursor-not-allowed disabled:opacity-40"
        >
          See the full working
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/55">{label}</span>
      <span className="font-bold text-white [font-variant-numeric:tabular-nums]">{value}</span>
    </div>
  );
}

function MiniRate({ label, value, hero }: { label: string; value: string; hero?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-2.5 text-center ${
        hero ? "border-[#8B5CF6] bg-[#8B5CF6]/15" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${hero ? "text-[#C4B5FD]" : "text-white/40"}`}>
        {label}
      </p>
      <p className="mt-1 font-display text-[13px] font-extrabold leading-tight text-white [font-variant-numeric:tabular-nums]">
        {value}
      </p>
    </div>
  );
}

// Fixed bottom bar on mobile. Always shows the running total and routes to the
// PDF; tapping the total opens the full drawer.
function MobileSummaryBar({
  result: r,
  money,
  onExpand,
  onPdf,
}: {
  result: RateCardResult | null;
  money: (zar: number) => string;
  onExpand: () => void;
  onPdf: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#8B5CF6]/25 bg-[#1A1523] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.6)] lg:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExpand}
          className="flex min-h-[48px] flex-1 flex-col justify-center text-left"
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {r ? "Your rate · tap for breakdown" : "Live rate"}
          </span>
          <span className="mt-0.5 font-display text-[22px] font-extrabold leading-none text-[#C4B5FD] [font-variant-numeric:tabular-nums]">
            {r ? money(r.total) : "R —"}
          </span>
        </button>
        <button
          type="button"
          onClick={onPdf}
          disabled={!r}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] px-5 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          Get PDF →
        </button>
      </div>
    </div>
  );
}

function MobileDrawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Mount off-screen, then slide up on the next frame — a proper app-style
  // bottom sheet rather than a card that just pops into existence.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto overscroll-contain rounded-t-3xl bg-[#0d0d0d] p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out ${shown ? "translate-y-0" : "translate-y-full"}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-white/25"
        />
        {children}
      </div>
    </div>
  );
}

function DeepDive({
  result: r,
  money,
  currency,
  rates,
  showWorking,
  onToggleWorking,
  docExtras,
}: {
  result: RateCardResult;
  money: (zar: number) => string;
  currency: string;
  rates: Record<string, number>;
  showWorking: boolean;
  onToggleWorking: () => void;
  docExtras: { packages: ReturnType<typeof computePackages>; quarter: string; notes: string };
}) {
  const n = (x: number) => Math.round(x).toLocaleString("en-GB");
  const cpmWins = r.price_cpm_final >= r.price_cpe_final;
  const maxBar = Math.max(r.total, r.saAvgRate, r.globalAvgRate) * 1.1;

  const tips: string[] = [];
  if (r.er > 3.39)
    tips.push(
      `Your ER of ${r.er.toFixed(2)}% beats the African average of 3.39%. Lead with it — "my audience engages ${((r.er / 3.39) * 100 - 100).toFixed(0)}% more than the market average."`,
    );
  else if (r.er > 0)
    tips.push(
      `Your ER of ${r.er.toFixed(2)}% is below the 3.39% African average. Reply to comments in the first hour — it is the fastest way to lift it.`,
    );
  if (r.price_cpm_final > r.price_cpe_final * 1.2)
    tips.push("CPM dominates your rate — pitch brand-awareness campaigns. Reach is your strongest asset.");
  else if (r.price_cpe_final > r.price_cpm_final * 1.2)
    tips.push(
      `CPE dominates (${money(r.price_cpe_final)} vs ${money(r.price_cpm_final)} on CPM). Quote CPE to conversion-focused brands — they will see the ROI.`,
    );
  else
    tips.push(
      "Your CPM and CPE rates are balanced — you have both reach and engagement value. Mention both when negotiating.",
    );
  if (r.multiDiscount < 1)
    tips.push(
      "Multi-platform detected, so a 10% volume discount was applied. Counter it with cross-platform analytics showing combined reach.",
    );
  if (r.premiumMult > 1)
    tips.push(
      `Add-ons add ${Math.round((r.premiumMult - 1) * 100)}% to your base. List each one line-by-line on the rate card — brands often do not know to ask.`,
    );
  else
    tips.push(
      "No add-ons selected. Usage rights alone adds 35% — if the brand runs ads with your content, that is a usage-rights conversation.",
    );

  return (
    <div className="space-y-4">
      {/* Negotiation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel className="p-5">
          <Eyebrow>Open here</Eyebrow>
          <p className="mt-2 font-display text-[28px] font-extrabold leading-none text-[#1A1523]">
            {money(r.total * 1.05)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">
            5% above your calculated rate — leaves room to come down and still land on target.
          </p>
        </Panel>
        <Panel className="p-5">
          <Eyebrow tone="muted">Walk away below</Eyebrow>
          <p className="mt-2 font-display text-[28px] font-extrabold leading-none text-[#1A1523]">
            {money(r.range_low)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">
            Your floor. Below this you are paying to work.
          </p>
        </Panel>
      </div>

      {/* Method comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel className={`p-5 ${cpmWins ? "ring-2 ring-[#8B5CF6]/45" : ""}`}>
          <div className="flex items-center justify-between">
            <Eyebrow tone="muted">CPM method · reach</Eyebrow>
            {cpmWins && <Pill tone="gold">Used</Pill>}
          </div>
          <p className="mt-2 font-display text-[26px] font-extrabold leading-none text-[#1A1523]">
            {money(r.price_cpm_final)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">Across {n(r.views)} views</p>
        </Panel>
        <Panel className={`p-5 ${!cpmWins ? "ring-2 ring-[#8B5CF6]/45" : ""}`}>
          <div className="flex items-center justify-between">
            <Eyebrow tone="muted">CPE method · engagement</Eyebrow>
            {!cpmWins && <Pill tone="gold">Used</Pill>}
          </div>
          <p className="mt-2 font-display text-[26px] font-extrabold leading-none text-[#1A1523]">
            {money(r.price_cpe_final)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">Across {n(r.interactions)} interactions</p>
        </Panel>
      </div>

      {/* Evidence */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <Eyebrow tone="muted">Engagement rate</Eyebrow>
          <p
            className="mt-2 font-display text-[30px] font-extrabold leading-none"
            style={{ color: r.cpeTierData.color }}
          >
            {r.er.toFixed(2)}%
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">
            {r.cpeTierData.label} · African average is 3.39%
          </p>
        </Panel>
        <Panel className="p-5">
          <Eyebrow tone="muted">Your tier</Eyebrow>
          <p className="mt-2 font-display text-[22px] font-extrabold leading-tight text-[#1A1523]">
            {r.tier.label}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">{n(r.followers)} followers</p>
        </Panel>
        <Panel className="p-5">
          <Eyebrow tone="muted">Adjusted CPM</Eyebrow>
          <p className="mt-2 font-display text-[26px] font-extrabold leading-none text-[#1A1523]">
            {money(r.adjustedCPM)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">Per 1 000 views, after every multiplier</p>
        </Panel>
      </div>

      {/* Benchmark bars */}
      <Panel className="p-5 sm:p-6">
        <Eyebrow tone="muted">How you compare</Eyebrow>
        <div className="mt-4 space-y-3">
          {[
            { label: "Your rate", value: r.total, fill: "#8B5CF6" },
            { label: "African average", value: r.saAvgRate, fill: "#1A1523" },
            { label: "Global average", value: r.globalAvgRate, fill: "#B8B2A6" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-[84px] shrink-0 text-[12px] font-semibold text-neutral-600 sm:w-[128px] sm:text-[12.5px]">
                {b.label}
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <span
                  className="block h-full rounded-full transition-[width] duration-[900ms] ease-out"
                  style={{
                    width: `${maxBar > 0 ? (b.value / maxBar) * 100 : 0}%`,
                    background: b.fill,
                  }}
                />
              </span>
              <span className="w-[84px] shrink-0 text-right text-[11.5px] font-bold tabular-nums text-[#1A1523] sm:w-[112px] sm:text-[12.5px]">
                {money(b.value)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-neutral-500">
          African creators average <strong className="text-[#7C3AED]">3.39% ER</strong> against 1.49%
          globally. Use that in every brand conversation. Benchmarks are calibrated on South African
          market data — the strongest creator-rate dataset on the continent.
        </p>
      </Panel>

      {/* Tips */}
      <Panel className="p-5 sm:p-6">
        <Eyebrow>What to actually do with this</Eyebrow>
        <ul className="mt-4 space-y-3">
          {tips.map((t, idx) => (
            <li key={idx} className="flex gap-3 text-[14px] leading-relaxed text-neutral-700">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Full working */}
      <Panel id="full-working" className="scroll-mt-24">
        <button
          onClick={onToggleWorking}
          aria-expanded={showWorking}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
        >
          <span>
            <span className="block font-display text-[15px] font-bold text-[#1A1523] sm:text-base">
              Show the full working
            </span>
            <span className="mt-1 block text-[13px] text-neutral-500">
              Every multiplier, line by line — so you can defend the number.
            </span>
          </span>
          <span
            className={`shrink-0 text-neutral-400 transition-transform ${showWorking ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {showWorking && (
          <div className="space-y-5 border-t border-neutral-200/80 p-5 sm:p-6">
            <BreakdownBlock
              title="CPM calculation — priced on reach"
              rows={[
                [`Base niche CPM (${r.niche})`, `R / 1 000 views`],
                [`× Tier (${r.tier.label})`, r.tier.mult.toFixed(2)],
                [`× Platform average (${r.selPlats.join(" + ") || "instagram"})`, r.cpm_mult.toFixed(2)],
                [`× Content type (${r.ct.label})`, r.ct.mult.toFixed(2)],
                ["= Adjusted CPM", `R / 1 000`],
                ["× Views", n(r.views)],
              ]}
              total={["CPM rate", money(r.price_cpm)]}
            />
            <BreakdownBlock
              title="CPE calculation — priced on engagement"
              rows={[
                ["Engagement rate", `${r.er.toFixed(2)}%`],
                [`CPE tier (${r.cpeTierData.label})`, `R / interaction`],
                ["× Platform CPE average", r.cpe_mult.toFixed(2)],
                ["× Total interactions", n(r.interactions)],
              ]}
              total={["CPE rate", money(r.price_cpe)]}
            />
            <BreakdownBlock
              title="Final price"
              rows={[
                [
                  "Higher of the two methods",
                  `${money(Math.max(r.price_cpm, r.price_cpe))} (${cpmWins ? "CPM" : "CPE"})`,
                ],
                [
                  "Add-ons",
                  r.selAddons.length
                    ? r.selAddons.map((k) => `${ADDONS[k].label} (${ADDONS[k].pct})`).join(", ")
                    : "None",
                ],
                ["Premium multiplier", `×${r.premiumMult.toFixed(2)}`],
                ["Multi-platform discount", `×${r.multiDiscount.toFixed(2)}`],
                ["Campaign multiplier", `×${r.campaignMult.toFixed(2)}`],
                ["Sponsorship fee", money(r.sponsorship)],
                ...(r.includeProduction
                  ? ([[`+ Production (${r.ct.label})`, `+${money(r.productionCost)}`]] as [
                      string,
                      string,
                    ][])
                  : []),
              ]}
              total={["Total quote", money(r.total)]}
            />
          </div>
        )}
      </Panel>

      <EmailCapture result={r} currency={currency} rates={rates} money={money} docExtras={docExtras} />
    </div>
  );
}

function BreakdownBlock({
  title,
  rows,
  total,
}: {
  title: string;
  rows: [string, string][];
  total: [string, string];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <p className="border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">
        {title}
      </p>
      <div className="divide-y divide-neutral-100">
        {rows.map(([k, val], idx) => (
          <div key={idx} className="flex items-start justify-between gap-4 px-4 py-2.5">
            <span className="text-[13px] leading-snug text-neutral-600">{k}</span>
            <span className="shrink-0 text-right text-[13px] font-bold text-[#1A1523]">{val}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 bg-[#8B5CF6]/10 px-4 py-3">
          <span className="text-[13px] font-bold text-[#1A1523]">{total[0]}</span>
          <span className="text-[15px] font-extrabold text-[#1A1523]">{total[1]}</span>
        </div>
      </div>
    </div>
  );
}

function EmailCapture({
  result: r,
  currency,
  rates,
  money,
  docExtras,
}: {
  result: RateCardResult;
  currency: string;
  rates: Record<string, number>;
  money: (zar: number) => string;
  docExtras: { packages: ReturnType<typeof computePackages>; quarter: string; notes: string };
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [brand, setBrand] = useState("");
  const [handle, setHandle] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [msg, setMsg] = useState("");

  async function send() {
    if (!name.trim()) return setMsg("Enter your name — it goes on the rate card.");
    if (!email.includes("@")) return setMsg("Enter a valid email address.");
    setMsg("");
    setState("sending");
    try {
      const res = await fetch("/api/public/rate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          brand,
          rateData: {
            creatorName: name,
            handle,
            platform: `${r.selPlats.map((p) => PLATFORM[p].name).join(" + ") || "Instagram"} · ${r.niche} · ${r.ct.label}`,
            tier: r.tier.label,
            er: r.er.toFixed(2),
            erLabel: r.cpeTierData.label,
            floor: money(r.range_low),
            standard: money(r.total),
            ceiling: money(r.range_high),
            followers: Math.round(r.followers).toLocaleString("en-GB"),
            date: new Date().toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            quarter: docExtras.quarter,
            notes: docExtras.notes,
            validity: `Rates valid for ${VALIDITY_DAYS} days from issue.`,
            packages: docExtras.packages.map((p) => ({
              tier: p.tier,
              includes: [...p.includes],
              from: money(p.from),
              popular: p.popular,
            })),
          },
        }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) throw new Error("send-failed");
      setState("sent");
      trackToolEvent("rate-card", "lead", { email, meta: { currency } });
    } catch {
      setState("idle");
      setMsg(
        "We couldn't send that just now. Check the email address and try again — if it keeps failing, reply to any of our emails and we'll send it manually.",
      );
    }
  }

  if (state === "sent") {
    return (
      <Panel raised id="get-pdf" className="scroll-mt-24 p-6 text-center sm:p-8">
        <p className="font-display text-[22px] font-extrabold text-[#1A1523]">Check your inbox.</p>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-neutral-600">
          Your rate card PDF is on its way to <strong>{email}</strong>. Forward it straight to the
          brand — when they push back on the price, that document is your evidence.
        </p>
      </Panel>
    );
  }

  return (
    <Panel raised id="get-pdf" className="scroll-mt-24 p-5 sm:p-7">
      <Eyebrow>Get the PDF</Eyebrow>
      <h3 className="mt-3 font-display text-[22px] font-bold tracking-tight text-[#1A1523] sm:text-[26px]">
        Send yourself the rate card.
      </h3>
      <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-neutral-600">
        A designed one-page PDF with your rates, your terms and your engagement evidence — built to
        forward straight to a brand.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="@yourhandle (optional)"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <Input
          placeholder="Prepared for which brand? (optional)"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
      </div>
      {msg && <p className="mt-3 text-[14px] font-semibold text-red-600">{msg}</p>}
      <GoldButton onClick={send} disabled={state === "sending"} className="mt-4">
        {state === "sending" ? "Building your PDF…" : "Email me the PDF →"}
      </GoldButton>
      <p className="mt-3 text-[12px] text-neutral-500">
        Free. No spam — your rate card and the odd thing worth reading.
      </p>
    </Panel>
  );
}

function UpsellBand() {
  return (
    <section className="relative overflow-hidden border-t border-neutral-200 bg-[#F5F3FF] px-5 py-16 sm:px-6">
      <DotGrid />
      <GoldGlow className="-left-32 bottom-[-14rem]" size={520} opacity={0.5} />
      <div className="relative mx-auto max-w-2xl text-center">
        <Eyebrow>Now go and get it</Eyebrow>
        <h2 className="mt-4 font-display text-[28px] font-extrabold leading-tight tracking-tight text-[#1A1523] sm:text-[36px]">
          You know your number.
          <br />
          Now send the pitch.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-neutral-600">
          Knowing your rate is half of it. Most creators still never send the email — or send one
          that gets ghosted. <strong>Your First Brand Deal Script</strong> is the 4-Part Pitch plus
          the word-for-word cold, warm and upgrade scripts, the WhatsApp DM version, and the
          counter-offer reply for when a brand lowballs the rate you just calculated.
        </p>
        <Link
          to="/products/$slug"
          params={{ slug: "first-brand-deal-script" }}
          className="mt-8 inline-flex min-h-[54px] items-center rounded-xl bg-[#1A1523] px-8 text-[15px] font-bold text-white transition hover:bg-[#8B5CF6] hover:text-white"
        >
          Get the Brand Deal Script →
        </Link>
      </div>
    </section>
  );
}

// The "Partnership Investment" document — the forwardable 1% deliverable. Free
// but watermarked; the clean, brand-styled export is the Pro payoff. Prices are
// derived from the creator's own computed rate; the value stack is à-la-carte.
function InvestmentDocument({
  result: r,
  money,
  packages,
  name,
  handle,
  niche,
  proof,
  quarter,
  notes,
  retainer,
  accent,
  logo,
  footer,
}: {
  result: RateCardResult;
  money: (zar: number) => string;
  packages: ReturnType<typeof computePackages>;
  name: string;
  handle: string;
  niche: string;
  proof: string;
  quarter: string;
  notes: string;
  retainer: boolean;
  accent: string;
  logo: string;
  footer: string;
}) {
  const stack = [
    ...Object.values(DISTRIBUTION_ADDONS),
    ...Object.values(USAGE_DURATION),
    ...Object.values(WHITELISTING),
  ];
  const date = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long" });

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_18px_50px_-24px_rgba(28,28,28,0.28)] print:rounded-none print:border-0 print:shadow-none"
      style={{ ["--accent" as string]: accent || "#8B5CF6" } as React.CSSProperties}
    >
      <div aria-hidden className="mk-watermark pointer-events-none absolute inset-0 z-20 flex flex-wrap content-center justify-center gap-x-8 gap-y-14 overflow-hidden opacity-[0.06]">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="rotate-[-30deg] whitespace-nowrap font-display text-xl font-black uppercase tracking-widest text-[#1A1523]">PREVIEW · chkplt.com</span>
        ))}
      </div>

      {/* Header */}
      <div className="bg-[#1A1523] p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>
              Partnership Investment{quarter ? ` · ${quarter}` : ""}
            </div>
            <h2 className="mt-1 font-display text-3xl text-white">{name || "Your Name"}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: accent }}>
              {handle || "@handle"}
              {niche && <span className="text-white/45">· {niche}</span>}
            </div>
            {proof && <p className="mt-2 font-mono text-[11px] uppercase tracking-wide" style={{ color: accent }}>{proof}</p>}
          </div>
          {logo && <img src={logo} alt="logo" className="h-12 w-auto max-w-[120px] object-contain" />}
        </div>
      </div>

      <div className="space-y-6 p-7">
        {/* Packages */}
        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Choose your partnership</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {packages.map((p) => (
              <div
                key={p.tier}
                className="relative flex flex-col rounded-xl border p-4"
                style={p.popular ? { borderColor: accent, boxShadow: `0 0 0 2px color-mix(in srgb, ${accent} 30%, transparent)` } : { borderColor: "#e5e5e5" }}
              >
                {p.popular && (
                  <span className="absolute -top-2 right-3 rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-[#1A1523]" style={{ backgroundColor: accent }}>Most popular</span>
                )}
                <div className="font-display text-[15px] font-extrabold text-[#1A1523]">{p.tier}</div>
                <ul className="mt-2 flex-1 space-y-1">
                  {p.includes.map((inc, j) => (
                    <li key={j} className="flex gap-1.5 text-[12px] leading-snug text-neutral-600">
                      <span style={{ color: accent }}>✦</span>{inc}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 border-t border-neutral-200/80 pt-2">
                  <span className="text-[11px] text-neutral-500">Investment from</span>
                  <div className="font-display text-lg font-extrabold text-[#1A1523]">{money(p.from)}</div>
                </div>
              </div>
            ))}
          </div>
          {retainer && (
            <p className="mt-2 text-[12px] font-semibold" style={{ color: accent }}>
              Monthly retainer (3+ campaigns): −15% applied to every package.
            </p>
          )}
        </div>

        {/* À-la-carte value stack */}
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Add to any package</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {stack.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="text-neutral-600">{s.label}</span>
                <span className="font-bold text-[#1A1523]">+{s.pct}%</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">Usage, whitelisting & exclusivity are priced as a % of the base fee — that's where the real value lives.</p>
        </div>

        {notes && (
          <div className="rounded-lg p-3 text-[13px] text-[#2A2A2A]" style={{ backgroundColor: `color-mix(in srgb, ${accent} 8%, transparent)` }}>
            {notes}
          </div>
        )}

        {/* Terms */}
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Terms</div>
          <ul className="space-y-0.5 text-[12px] text-neutral-600">
            <li>Payment: 50% deposit to book, balance on delivery (or Net 15/30 for approved brands).</li>
            <li>Revisions: 1 round included per deliverable; extra rounds billed.</li>
            <li>Disclosure: all sponsored content marked per local rules (#ad / #sponsored).</li>
            <li>Rates valid for {VALIDITY_DAYS} days from issue. Prices exclude VAT where applicable.</li>
          </ul>
        </div>
      </div>

      <div className="border-t bg-[#F5F3FF] p-4 text-center text-[11px] text-neutral-400" style={{ borderColor: `color-mix(in srgb, ${accent} 30%, transparent)` }}>
        {footer || `Prepared ${date}${name ? ` · ${name}` : ""} · Investment starting figures — final quote on brief`}
      </div>
    </div>
  );
}

function ProWaitlist({ tool, fullName }: { tool: "media-kit" | "rate-card"; fullName: string }) {
  const [proEmail, setProEmail] = useState("");
  const [proJoined, setProJoined] = useState(false);
  const [tsToken, setTsToken] = useState<string | null>(null);
  const tsRef = useRef<TurnstileGateHandle>(null);
  const proFn = useServerFn(joinToolProWaitlist);
  const proMut = useMutation({
    mutationFn: proFn,
    onSuccess: () => {
      setProJoined(true);
      trackToolEvent(tool, "lead", { email: proEmail, meta: { pro_waitlist: true } });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => tsRef.current?.reset(),
  });
  const pending = proMut.isPending;
  function onJoin() {
    if (!/\S+@\S+\.\S+/.test(proEmail)) {
      toast.error("Enter a valid email.");
      return;
    }
    proMut.mutate({
      data: { tool, email: proEmail.trim(), fullName: fullName || undefined, turnstileToken: tsToken ?? undefined, ...getUtm() },
    });
  }
  return (
    <Panel raised className="overflow-hidden">
      <div className="relative overflow-hidden bg-[#1A1523] p-6 sm:p-8">
        <DotGrid dark />
        <GoldGlow className="-right-24 -top-28" size={420} opacity={0.6} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#8B5CF6]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C4B5FD]"><Sparkles className="size-3.5" /> Rate Card Pro</div>
          <h3 className="mt-4 font-display text-[22px] font-extrabold tracking-tight text-white sm:text-[26px]">Send it clean, in your brand.</h3>
          <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-white/70">
            Pro gives you a watermark-free, brand-styled PDF (your colours + logo), saved rate cards you can update any time, and premium templates — <strong className="text-white">7 days free</strong>. Launching soon.
          </p>
          {proJoined ? (
            <p className="mt-5 flex items-center gap-2 text-[14px] text-[#C4B5FD]"><Check className="size-4" /> You're on the list — we'll email you the moment Pro opens.</p>
          ) : (
            <div className="mt-5">
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Input type="email" value={proEmail} onChange={(e) => setProEmail(e.target.value)} placeholder="you@email.com" className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/40" />
                <button type="button" disabled={pending || !tsToken} onClick={onJoin}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] px-6 text-[14px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50 sm:w-auto">
                  {pending ? "Joining…" : "Join the waitlist"}
                </button>
              </div>
              <div className="mt-3"><TurnstileGate ref={tsRef} onToken={setTsToken} /></div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
