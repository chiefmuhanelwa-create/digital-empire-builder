import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { useToolView, useToolStart, trackToolEvent } from "@/lib/tool-analytics";
import {
  ToolCanvas,
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
import {
  NICHE_CPM,
  PLATFORM,
  CONTENT_TYPE,
  ADDONS,
  OBJECTIVES,
  SCOPES,
  BUDGET_TIERS,
  CURRENCIES,
  computeRateCard,
  canConvert,
  formatCurrency,
  type PlatformKey,
  type ContentTypeKey,
  type AddonKey,
  type RateCardResult,
} from "@/lib/rate-card-engine";

// Rebuilt native, 2026-08-13. This was previously an iframe wrapping a copied
// static HTML file — the source of every scroll, height and mobile bug on this
// page (window.scrollTo was a no-op inside the frame; `100vh` resolved to the
// frame's own height and pinned it ~900px taller than its content). Going
// native removes that entire class of problem and lets the tool carry the real
// brand. The maths is untouched: it lives in rate-card-engine.ts, ported
// verbatim and diffed against the original across 5 cases — identical to
// floating-point precision, including the no-platform and sub-1000-follower
// edge cases.

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
  return n ? n.toLocaleString("en-ZA") : "";
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

  // Three screens, same as the original tool: fill it in, watch it work, read
  // the number. Appending results under the form buried the payoff and gave the
  // reader no way back to their inputs.
  const [screen, setScreen] = useState<"form" | "loading" | "results">("form");
  const [result, setResult] = useState<RateCardResult | null>(null);
  const [error, setError] = useState("");

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

  function calculate() {
    const f = digits(followers),
      v = digits(views),
      i = digits(interactions);
    if (!f || !v) return setError("Enter your followers and total views.");
    if (!niche) return setError("Pick your niche — it sets the CPM benchmark.");
    setError("");

    // Computed up front so the loading screen can narrate the real derivation
    // instead of showing a fake spinner — the numbers on screen while it runs
    // are this creator's actual intermediate values.
    const r = computeRateCard({
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
    setResult(r);
    setScreen("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackToolEvent("rate-card", "complete", {
      meta: {
        niche,
        contentType,
        platforms: platforms.join("+"),
        currency,
        totalZar: Math.round(r.total),
      },
    });
  }

  function backToForm() {
    setScreen("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <SiteHeader />
      <ToolCanvas>
        <div className="px-5 pt-3 sm:px-6">
          <BackNav to="/tools" label="All tools" />
        </div>

        {screen === "form" && (
          <header className="mx-auto max-w-5xl px-5 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
            {/* Wraps instead of colliding: on a 390px phone the eyebrow and the
                pill cannot share a row without one of them breaking mid-word. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Eyebrow>Creator · Free Tool</Eyebrow>
              <Pill className="whitespace-nowrap">African CPM Data · 2024/2025</Pill>
            </div>
            <h1 className="mt-7 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#1C1C1C] sm:text-[56px]">
              Know your <span className="text-[#C9A84C]">number</span>
              <br />
              before they ask.
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-[1.65] text-neutral-600 sm:text-[17px]">
              Most creators guess, then discount. Build a rate off real African CPM benchmarks, your
              last 30 days of engagement, and the deliverable — then send the PDF straight to the
              brand.
            </p>
            <div className="mt-7 h-[3px] w-16 rounded-full bg-[#C9A84C]" />
          </header>
        )}

        {screen === "results" && result && (
          <header className="mx-auto max-w-5xl px-5 pb-8 pt-8 sm:px-6 sm:pt-12">
            <button
              onClick={backToForm}
              className="mb-5 inline-flex items-center gap-2 text-[13px] font-bold text-neutral-500 transition hover:text-[#1C1C1C]"
            >
              ← Change my numbers
            </button>
            <div className="flex items-center justify-between gap-4">
              <Eyebrow>Your rate card</Eyebrow>
              <Pill>
                {CURRENCIES[canConvert(rates, currency) ? currency : "ZAR"].flag}{" "}
                {canConvert(rates, currency) ? currency : "ZAR"}
              </Pill>
            </div>
            <h1 className="mt-5 font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#1C1C1C] sm:text-[44px]">
              Here is what they
              <br />
              should be <span className="text-[#C9A84C]">paying you</span>.
            </h1>
            <div className="mt-6 h-[3px] w-16 rounded-full bg-[#C9A84C]" />
          </header>
        )}

        {screen === "loading" && result && (
          <CalculatingScreen result={result} money={money} onDone={() => setScreen("results")} />
        )}

        <main
          className={`mx-auto max-w-5xl px-5 pb-20 sm:px-6 ${screen === "form" ? "" : "hidden"}`}
        >
          {/* Currency */}
          <Panel className="mb-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="sm:w-[300px]">
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
              <p className="text-[13px] text-neutral-500 sm:text-right">
                {converts ? (
                  <>
                    {CURRENCIES[currency].flag} 1 USD = {CURRENCIES[currency].sym}
                    {(rates[currency] ?? 1).toFixed(2)}
                    <span className="ml-1 text-neutral-400">
                      · {ratesLive ? "live" : "approx."}
                    </span>
                  </>
                ) : (
                  <span className="text-[#A98A38]">
                    ⚠ Live rate for {currency} unavailable — showing rands
                  </span>
                )}
              </p>
            </div>
          </Panel>

          {/* Platforms */}
          <Panel className="mb-4">
            <PanelHeader
              title="Where do you post?"
              step="01"
              hint="Pick every platform this deal covers. Two or more applies a 10% bundle discount."
            />
            <div className="grid gap-2.5 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
              {PLATFORM_KEYS.map((k) => (
                <Chip key={k} active={platforms.includes(k)} onClick={() => togglePlatform(k)}>
                  {PLATFORM[k].name}
                </Chip>
              ))}
            </div>
          </Panel>

          {/* Numbers */}
          <Panel className="mb-4">
            <PanelHeader
              title="Your real numbers"
              step="02"
              hint="Pull these from your own analytics, set to the LAST 30 DAYS. Brands ask for a recent window — an all-time average overstates a quiet month and undersells a good one."
            />
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
              <div className="mx-5 mb-5 rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/[0.07] p-4 sm:mx-6 sm:mb-6">
                <Eyebrow>{niche} · African market</Eyebrow>
                <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-700">
                  {NICHE_CPM[niche].notes}
                </p>
              </div>
            )}
          </Panel>

          {/* Deal shape */}
          <Panel className="mb-4">
            <PanelHeader
              title="The deal"
              step="03"
              hint="Optional — leave blank if the brand hasn't said yet."
            />
            <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
              <Field label="Objective">
                <Select value={objective} onChange={(e) => setObjective(e.target.value)}>
                  <option value="">Not specified</option>
                  {Object.entries(OBJECTIVES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Scope">
                <Select value={scope} onChange={(e) => setScope(e.target.value)}>
                  <option value="">Not specified</option>
                  {Object.entries(SCOPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Brand size">
                <Select value={budgetTier} onChange={(e) => setBudgetTier(e.target.value)}>
                  <option value="">Not specified</option>
                  {Object.entries(BUDGET_TIERS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Panel>

          {/* Add-ons */}
          <Panel className="mb-6">
            <PanelHeader
              title="What else are they asking for?"
              step="04"
              hint="Each one is real work or real risk. Charge for it."
            />
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
                onClick={() => setIncludeProduction((v) => !v)}
                sub={`${CONTENT_TYPE[contentType].prod_desc} · +${money(CONTENT_TYPE[contentType].prod)}`}
              >
                Add production costs
              </Chip>
            </div>
          </Panel>

          {error && (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <GoldButton onClick={calculate} className="sm:flex-[2]">
              Calculate my rate →
            </GoldButton>
            <button
              onClick={loadExample}
              className="min-h-[54px] rounded-xl border border-neutral-300 bg-white px-6 text-[14px] font-bold text-neutral-700 transition hover:border-neutral-400 sm:flex-1"
            >
              Load an example
            </button>
          </div>
        </main>

        {screen === "results" && result && (
          <main className="mx-auto max-w-5xl px-5 pb-20 sm:px-6">
            <Results
              result={result}
              money={money}
              currency={currency}
              rates={rates}
              onEdit={backToForm}
            />
          </main>
        )}
      </ToolCanvas>

      {/* Only after there is a number to act on — before that it is a pitch for
          something the reader has no context for yet. */}
      {screen === "results" && <UpsellBand />}
      <SiteFooter />
    </div>
  );
}

// The calculating screen. Deliberately not a spinner: every line that appears
// is a REAL intermediate value from this creator's own result, revealed in the
// order the engine actually derives them. It buys the ~1.7s that makes the
// number feel worked out rather than guessed, and it teaches the method while
// it waits — which is the whole argument the creator later makes to the brand.
function CalculatingScreen({
  result: r,
  money,
  onDone,
}: {
  result: RateCardResult;
  money: (zar: number) => string;
  onDone: () => void;
}) {
  const n = (x: number) => Math.round(x).toLocaleString("en-ZA");
  const steps = useMemo(
    () => [
      {
        label: "Reading the African benchmark",
        value: `${r.niche} · R${r.nicheCPM.cpm.toFixed(2)} CPM`,
      },
      { label: "Adjusting for your tier", value: `${r.tier.label} · ×${r.tier.mult.toFixed(2)}` },
      {
        label: "Weighting your platforms",
        value: `${r.selPlats.map((p) => PLATFORM[p].name).join(" + ") || "Instagram"} · ×${r.cpm_mult.toFixed(2)}`,
      },
      { label: "Pricing on reach (CPM)", value: money(r.price_cpm_final) },
      { label: "Pricing on engagement (CPE)", value: money(r.price_cpe_final) },
      {
        label: "Taking the stronger method",
        value: r.price_cpm_final >= r.price_cpe_final ? "Reach wins" : "Engagement wins",
      },
      { label: "Building your rate card", value: `${n(r.followers)} followers priced` },
    ],
    [r, money],
  );

  const [done, setDone] = useState(0);
  const finish = useRef(onDone);
  finish.current = onDone;

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const perStep = reduced ? 60 : 230;
    if (done >= steps.length) {
      const t = setTimeout(() => finish.current(), reduced ? 60 : 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), perStep);
    return () => clearTimeout(t);
  }, [done, steps.length]);

  const pct = Math.round((done / steps.length) * 100);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-6 sm:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-[#1C1C1C] p-6 sm:p-9">
        <DotGrid dark />
        <GoldGlow className="-right-24 -top-28" size={460} opacity={0.7} />
        <div className="relative" aria-live="polite" aria-busy={done < steps.length}>
          <div className="flex items-center justify-between gap-4">
            <Eyebrow className="!text-[#C9A84C]">Working it out</Eyebrow>
            <span className="font-mono text-[13px] font-bold tabular-nums text-white/50">
              {pct}%
            </span>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#C9A84C] transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="mt-7 space-y-3">
            {steps.map((st, i) => {
              const state = i < done ? "done" : i === done ? "active" : "pending";
              return (
                <li
                  key={st.label}
                  className={`transition-opacity duration-300 ${
                    state === "pending" ? "opacity-25" : "opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                        state === "done"
                          ? "border-[#C9A84C] bg-[#C9A84C]"
                          : state === "active"
                            ? "animate-pulse border-[#C9A84C]"
                            : "border-white/25"
                      }`}
                    >
                      {state === "done" && (
                        <svg
                          viewBox="0 0 12 12"
                          className="h-2.5 w-2.5 text-[#1C1C1C]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            d="M2.5 6.5l2.5 2.5 4.5-5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-[14px] leading-snug text-white/85">
                      {st.label}
                    </span>
                    {/* Two placements, not two values: on a phone the derived
                        figure sits under its label, because side-by-side forces
                        both to wrap into each other. */}
                    <span
                      className={`hidden shrink-0 text-right text-[13px] font-bold tabular-nums text-[#C9A84C] transition-opacity duration-300 sm:block ${
                        i < done ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {st.value}
                    </span>
                  </div>
                  {i < done && (
                    <span className="mt-1 block pl-7 text-[13px] font-bold tabular-nums text-[#C9A84C] sm:hidden">
                      {st.value}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <p className="mt-5 text-center text-[13px] text-neutral-500">
        Every line above is your own number — not a loading bar.
      </p>
    </div>
  );
}

// Count-up on the money numbers. The old tool animated these and it is a big
// part of why the result felt earned rather than printed.
function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      // easeOutExpo — fast, then settles
      setV(target * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Results({
  result: r,
  money,
  currency,
  rates,
  onEdit,
}: {
  result: RateCardResult;
  money: (zar: number) => string;
  currency: string;
  rates: Record<string, number>;
  onEdit: () => void;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const animatedTotal = useCountUp(r.total);
  const n = (x: number) => Math.round(x).toLocaleString("en-ZA");
  const usd = rates.ZAR > 0 ? Math.round(r.total / rates.ZAR).toLocaleString("en-US") : null;
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
    tips.push(
      "CPM dominates your rate — pitch brand-awareness campaigns. Reach is your strongest asset.",
    );
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
    <>
      {/* The money moment — charcoal, so it reads as the payoff, not another form card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#1C1C1C] p-6 sm:p-10">
        <DotGrid dark />
        <GoldGlow className="-bottom-40 -right-24" size={520} opacity={0.75} />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow className="!text-[#C9A84C]">Your opening quote</Eyebrow>
            <Pill tone="gold">{r.tier.label}</Pill>
          </div>

          <p className="mt-6 font-display text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white [font-variant-numeric:tabular-nums] sm:text-[76px]">
            {money(animatedTotal)}
          </p>
          {usd && <p className="mt-2 text-[14px] text-white/40">≈ ${usd} USD</p>}
          <p className="mt-2 text-[14px] text-white/50">
            {r.niche} · {r.ct.label} ·{" "}
            {r.selPlats.map((p) => PLATFORM[p].name).join(" + ") || "Instagram"}
          </p>

          {r.includeProduction && (
            <div className="mt-6 space-y-2 border-t border-white/10 pt-5 text-[14px]">
              <div className="flex justify-between text-white/70">
                <span>Sponsorship fee</span>
                <span className="font-bold text-white">{money(r.sponsorship)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Production ({r.ct.label})</span>
                <span className="font-bold text-white">{money(r.productionCost)}</span>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <RateBox label="Floor rate" value={money(r.range_low)} note="Never go below this" />
            <RateBox label="Standard" value={money(r.total)} note="Quote this first" hero />
            <RateBox label="Premium" value={money(r.range_high)} note="Full rights + exclusivity" />
          </div>
        </div>
      </div>

      {/* Negotiation strategy */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel className="p-5">
          <Eyebrow>Open here</Eyebrow>
          <p className="mt-2 font-display text-[28px] font-extrabold leading-none text-[#1C1C1C]">
            {money(r.total * 1.05)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">
            5% above your calculated rate — leaves room to come down and still land on target.
          </p>
        </Panel>
        <Panel className="p-5">
          <Eyebrow tone="muted">Walk away below</Eyebrow>
          <p className="mt-2 font-display text-[28px] font-extrabold leading-none text-[#1C1C1C]">
            {money(r.range_low)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">
            Your floor. Below this you are paying to work.
          </p>
        </Panel>
      </div>

      {/* How the two methods compare */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel className={`p-5 ${cpmWins ? "ring-2 ring-[#C9A84C]/45" : ""}`}>
          <div className="flex items-center justify-between">
            <Eyebrow tone="muted">CPM method · reach</Eyebrow>
            {cpmWins && <Pill tone="gold">Used</Pill>}
          </div>
          <p className="mt-2 font-display text-[26px] font-extrabold leading-none text-[#1C1C1C]">
            {money(r.price_cpm_final)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">Across {n(r.views)} views</p>
        </Panel>
        <Panel className={`p-5 ${!cpmWins ? "ring-2 ring-[#C9A84C]/45" : ""}`}>
          <div className="flex items-center justify-between">
            <Eyebrow tone="muted">CPE method · engagement</Eyebrow>
            {!cpmWins && <Pill tone="gold">Used</Pill>}
          </div>
          <p className="mt-2 font-display text-[26px] font-extrabold leading-none text-[#1C1C1C]">
            {money(r.price_cpe_final)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">
            Across {n(r.interactions)} interactions
          </p>
        </Panel>
      </div>

      {/* Evidence */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
          <p className="mt-2 font-display text-[22px] font-extrabold leading-tight text-[#1C1C1C]">
            {r.tier.label}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">{n(r.followers)} followers</p>
        </Panel>
        <Panel className="p-5">
          <Eyebrow tone="muted">Adjusted CPM</Eyebrow>
          <p className="mt-2 font-display text-[26px] font-extrabold leading-none text-[#1C1C1C]">
            {money(r.adjustedCPM)}
          </p>
          <p className="mt-2 text-[13px] text-neutral-500">
            Per 1 000 views, after every multiplier
          </p>
        </Panel>
      </div>

      {/* Benchmark bars */}
      <Panel className="mt-4 p-5 sm:p-6">
        <Eyebrow tone="muted">How you compare</Eyebrow>
        <div className="mt-4 space-y-3">
          {[
            { label: "Your rate", value: r.total, fill: "#C9A84C" },
            { label: "African average", value: r.saAvgRate, fill: "#1C1C1C" },
            { label: "Global average", value: r.globalAvgRate, fill: "#B8B2A6" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-[104px] shrink-0 text-[12.5px] font-semibold text-neutral-600 sm:w-[128px]">
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
              <span className="w-[92px] shrink-0 text-right text-[12.5px] font-bold text-[#1C1C1C] sm:w-[112px]">
                {money(b.value)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-neutral-500">
          African creators average <strong className="text-[#A98A38]">3.39% ER</strong> against
          1.49% globally. Use that in every brand conversation. Benchmarks are calibrated on South
          African market data — the strongest creator-rate dataset on the continent.
        </p>
      </Panel>

      {/* Strategic insights */}
      <Panel className="mt-4 p-5 sm:p-6">
        <Eyebrow>What to actually do with this</Eyebrow>
        <ul className="mt-4 space-y-3">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-neutral-700">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Full working */}
      <Panel className="mt-4">
        <button
          onClick={() => setShowBreakdown((v) => !v)}
          aria-expanded={showBreakdown}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
        >
          <span>
            <span className="block font-display text-[15px] font-bold text-[#1C1C1C] sm:text-base">
              Show the full working
            </span>
            <span className="mt-1 block text-[13px] text-neutral-500">
              Every multiplier, line by line — so you can defend the number.
            </span>
          </span>
          <span
            className={`shrink-0 text-neutral-400 transition-transform ${showBreakdown ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {showBreakdown && (
          <div className="space-y-5 border-t border-neutral-200/80 p-5 sm:p-6">
            <BreakdownBlock
              title="CPM calculation — priced on reach"
              rows={[
                [`Base niche CPM (${r.niche})`, `R ${r.nicheCPM.cpm.toFixed(2)} / 1 000 views`],
                [`× Tier (${r.tier.label})`, r.tier.mult.toFixed(2)],
                [
                  `× Platform average (${r.selPlats.join(" + ") || "instagram"})`,
                  r.cpm_mult.toFixed(2),
                ],
                [`× Content type (${r.ct.label})`, r.ct.mult.toFixed(2)],
                ["= Adjusted CPM", `R ${r.adjustedCPM.toFixed(2)} / 1 000`],
                ["× Views", n(r.views)],
              ]}
              total={["CPM rate", money(r.price_cpm)]}
            />
            <BreakdownBlock
              title="CPE calculation — priced on engagement"
              rows={[
                ["Engagement rate", `${r.er.toFixed(2)}%`],
                [
                  `CPE tier (${r.cpeTierData.label})`,
                  `R ${r.cpeTierData.cpe_zar.toFixed(2)} / interaction`,
                ],
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

      <EmailCapture result={r} currency={currency} rates={rates} money={money} />

      <button
        onClick={onEdit}
        className="mt-4 w-full rounded-xl border border-neutral-300 bg-white px-6 py-4 text-[14px] font-bold text-neutral-700 transition hover:border-neutral-400"
      >
        ← Change my numbers
      </button>
    </>
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
        {rows.map(([k, v], i) => (
          <div key={i} className="flex items-start justify-between gap-4 px-4 py-2.5">
            <span className="text-[13px] leading-snug text-neutral-600">{k}</span>
            <span className="shrink-0 text-right text-[13px] font-bold text-[#1C1C1C]">{v}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 bg-[#C9A84C]/10 px-4 py-3">
          <span className="text-[13px] font-bold text-[#1C1C1C]">{total[0]}</span>
          <span className="text-[15px] font-extrabold text-[#1C1C1C]">{total[1]}</span>
        </div>
      </div>
    </div>
  );
}

function RateBox({
  label,
  value,
  note,
  hero,
}: {
  label: string;
  value: string;
  note: string;
  hero?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center ${hero ? "border-[#C9A84C] bg-[#C9A84C]" : "border-white/12 bg-white/[0.04]"}`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${hero ? "text-[#1C1C1C]/70" : "text-white/45"}`}
      >
        {label}
      </p>
      <p
        className={`mt-2 font-display text-[22px] font-extrabold leading-none ${hero ? "text-[#1C1C1C]" : "text-white"}`}
      >
        {value}
      </p>
      <p className={`mt-2 text-[12px] ${hero ? "text-[#1C1C1C]/65" : "text-white/40"}`}>{note}</p>
    </div>
  );
}

function EmailCapture({
  result: r,
  currency,
  rates,
  money,
}: {
  result: RateCardResult;
  currency: string;
  rates: Record<string, number>;
  money: (zar: number) => string;
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
            // Same currency the creator is looking at — the PDF is the document
            // they forward to the brand, so it must never revert to rands.
            floor: money(r.range_low),
            standard: money(r.total),
            ceiling: money(r.range_high),
            followers: Math.round(r.followers).toLocaleString("en-ZA"),
            date: new Date().toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) throw new Error("send-failed");
      setState("sent");
      trackToolEvent("rate-card", "lead", { email, meta: { currency } });
    } catch {
      setState("idle");
      // Never surface a raw server string. A creator once saw the literal word
      // "Forbidden" here and reasonably concluded the tool was broken.
      setMsg(
        "We couldn't send that just now. Check the email address and try again — if it keeps failing, reply to any of our emails and we'll send it manually.",
      );
    }
  }

  if (state === "sent") {
    return (
      <Panel raised className="mt-4 p-6 text-center sm:p-8">
        <p className="font-display text-[22px] font-extrabold text-[#1C1C1C]">Check your inbox.</p>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-neutral-600">
          Your rate card PDF is on its way to <strong>{email}</strong>. Forward it straight to the
          brand — when they push back on the price, that document is your evidence.
        </p>
      </Panel>
    );
  }

  return (
    <Panel raised className="mt-4 p-5 sm:p-7">
      <Eyebrow>Get the PDF</Eyebrow>
      <h3 className="mt-3 font-display text-[22px] font-bold tracking-tight text-[#1C1C1C] sm:text-[26px]">
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
    <section className="relative overflow-hidden border-t border-neutral-200 bg-[#FAF7F0] px-5 py-16 sm:px-6">
      <DotGrid />
      <GoldGlow className="-left-32 bottom-[-14rem]" size={520} opacity={0.5} />
      <div className="relative mx-auto max-w-2xl text-center">
        <Eyebrow>Now go and get it</Eyebrow>
        <h2 className="mt-4 font-display text-[28px] font-extrabold leading-tight tracking-tight text-[#1C1C1C] sm:text-[36px]">
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
          className="mt-8 inline-flex min-h-[54px] items-center rounded-xl bg-[#1C1C1C] px-8 text-[15px] font-bold text-white transition hover:bg-[#C9A84C] hover:text-[#1C1C1C]"
        >
          Get the Brand Deal Script →
        </Link>
      </div>
    </section>
  );
}
