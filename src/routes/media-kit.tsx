import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowRight, Printer, Check, Plus, Trash2, Upload, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { TurnstileGate, type TurnstileGateHandle } from "@/components/TurnstileGate";
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
import { emailMediaKit, joinMediaKitProWaitlist } from "@/lib/media-kit.functions";
import { AFRICAN_AVG_ER, ADDONS, CURRENCIES, type AddonKey } from "@/lib/rate-card-engine";
import { getUtm } from "@/lib/utm";
import { useToolView, useToolStart, trackToolEvent } from "@/lib/tool-analytics";

export const Route = createFileRoute("/media-kit")({
  head: () => ({
    meta: [
      { title: "Free Media Kit Builder — a brand-ready one-pager in minutes | CHKPLT" },
      {
        name: "description",
        content:
          "Turn your stats into a professional media kit brands take seriously. Fill the form, watch it build live, save it as a PDF. Free.",
      },
      { property: "og:title", content: "Free Media Kit Builder — CHKPLT" },
    ],
  }),
  component: MediaKitPage,
});

interface Platform { name: string; followers: string; er: string; avgViews: string; growth: string; verifiedOn: string; }
interface Pillar { name: string; desc: string; }
interface Rate { name: string; price: string; }
interface CaseStudy { brand: string; objective: string; whatWeDid: string; result: string; }
interface Testimonial { quote: string; author: string; }
interface Package { tier: string; name: string; includes: string; startingAt: string; }

type FontChoice = "bold" | "editorial" | "modern";

interface Kit {
  name: string; handle: string; tagline: string; bio: string; location: string; niches: string;
  platforms: Platform[];
  targetAudience: string; ageBracket: string; genderSplit: string;
  audiencePsychographics: string; audienceBuying: string; audienceCities: string; audienceInterests: string; authenticity: string;
  pillars: Pillar[]; formats: string;
  rates: Rate[]; currency: string; addons: string[];
  positioning: string; oneLineProof: string;
  caseStudies: CaseStudy[];
  testimonials: Testimonial[];
  packages: Package[];
  rightsUsage: string; rightsWhitelisting: string; rightsExclusivity: string;
  termsTurnaround: string; termsRevisions: string; termsComms: string; paymentTerms: string;
  availability: string; press: string; lastUpdated: string;
  stats: string; brands: string; email: string; booking: string;
  // Design & branding
  accent: string; kitTheme: "dark" | "light"; font: FontChoice; logo: string; image: string; footer: string;
}

const INITIAL: Kit = {
  name: "", handle: "", tagline: "", bio: "", location: "", niches: "",
  platforms: [
    { name: "Instagram", followers: "", er: "", avgViews: "", growth: "", verifiedOn: "" },
    { name: "TikTok", followers: "", er: "", avgViews: "", growth: "", verifiedOn: "" },
    { name: "YouTube", followers: "", er: "", avgViews: "", growth: "", verifiedOn: "" },
  ],
  targetAudience: "", ageBracket: "25–34", genderSplit: "",
  audiencePsychographics: "", audienceBuying: "", audienceCities: "", audienceInterests: "", authenticity: "",
  pillars: [{ name: "", desc: "" }, { name: "", desc: "" }, { name: "", desc: "" }], formats: "",
  rates: [
    { name: "Single Reel / Short Video", price: "" },
    { name: "Story Package (3–5 stories)", price: "" },
    { name: "Monthly Retainer", price: "" },
  ],
  currency: "ZAR", addons: [],
  positioning: "", oneLineProof: "",
  caseStudies: [{ brand: "", objective: "", whatWeDid: "", result: "" }],
  testimonials: [{ quote: "", author: "" }],
  packages: [
    { tier: "Silver", name: "Content Package", includes: "", startingAt: "" },
    { tier: "Gold", name: "Authority Package", includes: "", startingAt: "" },
    { tier: "Platinum", name: "Acquisition Package", includes: "", startingAt: "" },
  ],
  rightsUsage: "", rightsWhitelisting: "", rightsExclusivity: "",
  termsTurnaround: "", termsRevisions: "", termsComms: "", paymentTerms: "",
  availability: "", press: "", lastUpdated: "",
  stats: "", brands: "", email: "", booking: "",
  accent: "#8B5CF6", kitTheme: "dark", font: "bold", logo: "", image: "", footer: "",
};

const TA =
  "w-full min-h-[96px] rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[16px] text-[#1A1523] outline-none transition placeholder:text-neutral-400 focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 resize-y";

const ACCENT_SWATCHES = ["#8B5CF6", "#EC4899", "#3B82F6", "#1A1523", "#0F766E", "#DB2777", "#EA580C", "#F59E0B"];
const FONTS: Record<FontChoice, { head: string; body: string; label: string }> = {
  bold: { head: "font-display", body: "font-sans", label: "Bold" },
  editorial: { head: "font-serif", body: "font-sans", label: "Editorial" },
  modern: { head: "font-sans font-extrabold tracking-tight", body: "font-sans", label: "Modern" },
};
// Only codes that actually exist in the African CURRENCIES map — USD is NOT a
// key there, and CURRENCIES[c].flag on a missing code crashes the whole page.
const POPULAR_CUR = ["ZAR", "NGN", "KES", "GHS", "EGP", "TZS", "UGX"].filter((c) => CURRENCIES[c]);

function platformKey(name: string): string {
  const n = name.toLowerCase().replace(/[^a-z]/g, "");
  if (n.includes("tiktok")) return "tiktok";
  if (n.includes("insta") || n === "ig") return "instagram";
  if (n.includes("youtube") || n === "yt") return "youtube";
  if (n.includes("facebook") || n === "fb") return "facebook";
  if (n.includes("linkedin")) return "linkedin";
  if (n.includes("pinterest")) return "pinterest";
  if (n.includes("twitter") || n === "x") return "twitter_x";
  return n;
}

type RowArrayKey = "platforms" | "pillars" | "rates" | "caseStudies" | "testimonials" | "packages";

function MediaKitPage() {
  useToolView("media-kit");
  const markStart = useToolStart("media-kit");
  const [k, setK] = useState<Kit>(INITIAL);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sent, setSent] = useState(false);

  // Pro waitlist (Phase 1 — subscription not built yet)
  const [proEmail, setProEmail] = useState("");
  const [proJoined, setProJoined] = useState(false);
  const [tsToken, setTsToken] = useState<string | null>(null);
  const tsRef = useRef<TurnstileGateHandle>(null);

  const sendFn = useServerFn(emailMediaKit);
  const sendMut = useMutation({
    mutationFn: sendFn,
    onSuccess: () => {
      setSent(true);
      trackToolEvent("media-kit", "lead", { email: recipientEmail });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const proFn = useServerFn(joinMediaKitProWaitlist);
  const proMut = useMutation({
    mutationFn: proFn,
    onSuccess: () => {
      setProJoined(true);
      trackToolEvent("media-kit", "lead", { email: proEmail, meta: { pro_waitlist: true } });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => tsRef.current?.reset(),
  });

  const set = <K extends keyof Kit>(key: K, v: Kit[K]) => {
    markStart();
    setK((s) => ({ ...s, [key]: v }));
  };
  const setArr = <T extends Platform | Pillar | Rate | CaseStudy | Testimonial | Package>(
    key: RowArrayKey, i: number, field: keyof T, v: string,
  ) => {
    markStart();
    setK((s) => ({ ...s, [key]: (s[key] as T[]).map((row, idx) => (idx === i ? { ...row, [field]: v } : row)) }));
  };
  const addRow = (key: "caseStudies" | "testimonials" | "packages", blank: CaseStudy | Testimonial | Package) =>
    setK((s) => ({ ...s, [key]: [...(s[key] as (CaseStudy | Testimonial | Package)[]), blank] }));
  const removeRow = (key: "caseStudies" | "testimonials" | "packages", i: number) =>
    setK((s) => ({ ...s, [key]: (s[key] as (CaseStudy | Testimonial | Package)[]).filter((_, idx) => idx !== i) }));
  const toggleAddon = (key: AddonKey) => {
    markStart();
    setK((s) => ({ ...s, addons: s.addons.includes(key) ? s.addons.filter((a) => a !== key) : [...s.addons, key] }));
  };

  function readImage(file: File | undefined, key: "logo" | "image") {
    if (!file) return;
    if (file.size > 2_000_000) {
      toast.error("Image must be under 2MB.");
      return;
    }
    const r = new FileReader();
    r.onload = () => set(key, String(r.result));
    r.readAsDataURL(file);
  }

  function print() {
    trackToolEvent("media-kit", "complete", {});
    window.print();
  }

  function joinPro() {
    if (!/\S+@\S+\.\S+/.test(proEmail)) {
      toast.error("Enter a valid email.");
      return;
    }
    proMut.mutate({
      data: { email: proEmail.trim(), fullName: k.name || undefined, turnstileToken: tsToken ?? undefined, ...getUtm() },
    });
  }

  const premiumPayload = {
    positioning: k.positioning,
    oneLineProof: k.oneLineProof,
    formats: k.formats,
    audiencePsychographics: k.audiencePsychographics,
    audienceBuying: k.audienceBuying,
    audienceCities: k.audienceCities,
    audienceInterests: k.audienceInterests,
    authenticity: k.authenticity,
    caseStudies: k.caseStudies.filter((c) => c.brand.trim() || c.result.trim()),
    testimonials: k.testimonials.filter((t) => t.quote.trim()),
    packages: k.packages.filter((p) => p.tier.trim() && (p.includes.trim() || p.startingAt.trim())),
    addons: k.addons.map((key) => (ADDONS[key as AddonKey] ? `${ADDONS[key as AddonKey].label} (${ADDONS[key as AddonKey].pct})` : key)),
    rightsUsage: k.rightsUsage,
    rightsWhitelisting: k.rightsWhitelisting,
    rightsExclusivity: k.rightsExclusivity,
    termsTurnaround: k.termsTurnaround,
    termsRevisions: k.termsRevisions,
    termsComms: k.termsComms,
    paymentTerms: k.paymentTerms,
    availability: k.availability,
    press: k.press,
    currency: k.currency,
    lastUpdated: k.lastUpdated,
  };

  return (
    <div
      className="relative min-h-screen overflow-x-clip"
      style={{ background: "radial-gradient(1200px 700px at 12% -8%, rgba(139,92,246,0.20), transparent 55%),radial-gradient(1000px 650px at 100% 0%, rgba(236,72,153,0.18), transparent 55%),radial-gradient(1100px 800px at 60% 108%, rgba(59,130,246,0.16), transparent 55%),linear-gradient(180deg, #F7F5FF 0%, #FBF7FE 45%, #F5F7FF 100%)" }}
    >
      <SiteHeader />
      <DotGrid />
      <div className="relative">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="pt-3 print:hidden">
            <BackNav to="/tools" label="All tools" />
          </div>

          <header className="max-w-2xl pb-8 pt-8 sm:pb-10 sm:pt-12 print:hidden">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Eyebrow>Creator · Free Tool</Eyebrow>
              <Pill className="whitespace-nowrap">Top-1% Media Kit</Pill>
            </div>
            <h1 className="mt-7 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#1A1523] sm:text-[52px]">
              Make brands take you <span className="text-[#8B5CF6]">seriously.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-[1.65] text-neutral-600 sm:text-[17px]">
              Build the kit brands actually decide on — verified metrics, audience buying-power, real
              case studies, an offer ladder. Style it in your colours, then save it as a PDF.
            </p>
            <div className="mt-7 h-[3px] w-16 rounded-full bg-[#8B5CF6]" />
          </header>

          <div className="grid items-start gap-8 pb-4 lg:grid-cols-2">
            {/* FORM */}
            <div className="space-y-4 print:hidden">
              <Panel>
                <PanelHeader title="The basics" step="01" hint="Who you are and who you serve." />
                <div className="space-y-5 p-5 sm:p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Name"><Input value={k.name} onChange={(e) => set("name", e.target.value)} placeholder="Ndivhuwo Muhanelwa" /></Field>
                    <Field label="@handle"><Input value={k.handle} onChange={(e) => set("handle", e.target.value)} placeholder="@nochill_god" /></Field>
                  </div>
                  <Field label="Tagline"><Input value={k.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Helping professionals turn expertise into income" /></Field>
                  <Field label="Forwardable line" hint="I help [brand type] reach [audience] to [outcome] through [method].">
                    <textarea className={TA} value={k.positioning} onChange={(e) => set("positioning", e.target.value)} placeholder="I help education & tech brands reach SA professionals turning into knowledge entrepreneurs to drive product adoption, through education-first content." />
                  </Field>
                  <Field label="One-line proof stat" hint="Your above-the-fold hook."><Input value={k.oneLineProof} onChange={(e) => set("oneLineProof", e.target.value)} placeholder="60K engaged followers · 8% avg engagement · 1.2M monthly views" /></Field>
                  <Field label="Bio"><textarea className={TA} value={k.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Who you are, who you serve, why your audience trusts you." /></Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Location"><Input value={k.location} onChange={(e) => set("location", e.target.value)} placeholder="Johannesburg, SA" /></Field>
                    <Field label="Niches" hint="Comma-separated."><Input value={k.niches} onChange={(e) => set("niches", e.target.value)} placeholder="Finance, Business, Faith" /></Field>
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Platforms & verified metrics" step="02" hint="Consistency and a verified date beat one viral spike. Reach-based ER wins deals." />
                <div className="space-y-4 p-5 sm:p-6">
                  {k.platforms.map((p, i) => (
                    <div key={i} className="space-y-2 rounded-xl border border-neutral-200 p-3">
                      <div className="flex items-center gap-2.5">
                        <BrandLogo platform={platformKey(p.name)} className="h-6 w-6 shrink-0" />
                        <Input value={p.name} onChange={(e) => setArr<Platform>("platforms", i, "name", e.target.value)} placeholder="Platform" />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input value={p.followers} onChange={(e) => setArr<Platform>("platforms", i, "followers", e.target.value)} placeholder="Followers" />
                        <Input value={p.er} onChange={(e) => setArr<Platform>("platforms", i, "er", e.target.value)} placeholder="ER %" inputMode="numeric" />
                        <Input value={p.avgViews} onChange={(e) => setArr<Platform>("platforms", i, "avgViews", e.target.value)} placeholder="Avg views / post" />
                        <Input value={p.growth} onChange={(e) => setArr<Platform>("platforms", i, "growth", e.target.value)} placeholder="Growth e.g. +12% MoM" />
                      </div>
                      <Input value={p.verifiedOn} onChange={(e) => setArr<Platform>("platforms", i, "verifiedOn", e.target.value)} placeholder="Verified e.g. Aug 2026" />
                    </div>
                  ))}
                  <Field label="Kit last updated"><Input value={k.lastUpdated} onChange={(e) => set("lastUpdated", e.target.value)} placeholder="August 2026" /></Field>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Audience" step="03" hint="Demographics get you seen. Buying behaviour gets you paid." />
                <div className="space-y-5 p-5 sm:p-6">
                  <Field label="Who they are"><Input value={k.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} placeholder="SA professionals aged 25–45 building a side income" /></Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Core age bracket">
                      <Select value={k.ageBracket} onChange={(e) => set("ageBracket", e.target.value)}>
                        {["13–17", "18–24", "25–34", "35–44", "45–54", "55+"].map((a) => <option key={a}>{a}</option>)}
                      </Select>
                    </Field>
                    <Field label="Gender split"><Input value={k.genderSplit} onChange={(e) => set("genderSplit", e.target.value)} placeholder="62% F · 38% M" /></Field>
                    <Field label="Top cities / locations"><Input value={k.audienceCities} onChange={(e) => set("audienceCities", e.target.value)} placeholder="Johannesburg, Cape Town, Durban" /></Field>
                    <Field label="Top interests"><Input value={k.audienceInterests} onChange={(e) => set("audienceInterests", e.target.value)} placeholder="Notion, AI tools, monetisation" /></Field>
                  </div>
                  <Field label="Psychographics" hint="Who they are beyond age/gender."><textarea className={TA} value={k.audiencePsychographics} onChange={(e) => set("audiencePsychographics", e.target.value)} placeholder="My audience is in transition — not chasing fame, but monetising what they know. 78% identify as coaches, consultants and experts." /></Field>
                  <Field label="Buying behaviour" hint="The closer — proven spend / purchase intent."><textarea className={TA} value={k.audienceBuying} onChange={(e) => set("audienceBuying", e.target.value)} placeholder="43% have bought a digital product from my link; average spend on education in the last 90 days is R1,200." /></Field>
                  <Field label="Audience authenticity" hint="e.g. a HypeAuditor / Modash score."><Input value={k.authenticity} onChange={(e) => set("authenticity", e.target.value)} placeholder="94% real audience (HypeAuditor)" /></Field>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Content pillars & formats" step="04" hint="The things you're known for, and how you make them." />
                <div className="space-y-3 p-5 sm:p-6">
                  {k.pillars.map((p, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
                      <Input value={p.name} onChange={(e) => setArr<Pillar>("pillars", i, "name", e.target.value)} placeholder={`Pillar ${i + 1}`} />
                      <Input value={p.desc} onChange={(e) => setArr<Pillar>("pillars", i, "desc", e.target.value)} placeholder="What you cover" />
                    </div>
                  ))}
                  <Field label="Best formats"><Input value={k.formats} onChange={(e) => set("formats", e.target.value)} placeholder="Reels, tutorials, carousels, UGC-style ads" /></Field>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Case studies & proof" step="05" hint="One case study beats a wall of logos." />
                <div className="space-y-4 p-5 sm:p-6">
                  {k.caseStudies.map((c, i) => (
                    <div key={i} className="space-y-2 rounded-xl border border-neutral-200 p-3">
                      <div className="flex items-center gap-2">
                        <Input value={c.brand} onChange={(e) => setArr<CaseStudy>("caseStudies", i, "brand", e.target.value)} placeholder="Brand" />
                        {k.caseStudies.length > 1 && (
                          <button type="button" onClick={() => removeRow("caseStudies", i)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-500" aria-label="Remove"><Trash2 className="size-4" /></button>
                        )}
                      </div>
                      <Input value={c.objective} onChange={(e) => setArr<CaseStudy>("caseStudies", i, "objective", e.target.value)} placeholder="Objective — e.g. drive trial for a new app" />
                      <Input value={c.whatWeDid} onChange={(e) => setArr<CaseStudy>("caseStudies", i, "whatWeDid", e.target.value)} placeholder="What we did — e.g. 1 tutorial + 1 breakdown post" />
                      <Input value={c.result} onChange={(e) => setArr<CaseStudy>("caseStudies", i, "result", e.target.value)} placeholder="Result with numbers — e.g. 3,100 trials in 72h, 18% conversion" />
                    </div>
                  ))}
                  <button type="button" onClick={() => addRow("caseStudies", { brand: "", objective: "", whatWeDid: "", result: "" })} className="inline-flex min-h-[44px] items-center gap-2 text-[13px] font-bold text-[#7C3AED]"><Plus className="size-4" /> Add case study</button>
                  <div className="border-t border-neutral-200/80 pt-4">
                    {k.testimonials.map((t, i) => (
                      <div key={i} className="mb-2 flex items-start gap-2">
                        <div className="grid flex-1 gap-2">
                          <textarea className={TA} value={t.quote} onChange={(e) => setArr<Testimonial>("testimonials", i, "quote", e.target.value)} placeholder="Testimonial from a brand partner" />
                          <Input value={t.author} onChange={(e) => setArr<Testimonial>("testimonials", i, "author", e.target.value)} placeholder="— Name, Role, Brand" />
                        </div>
                        {k.testimonials.length > 1 && (
                          <button type="button" onClick={() => removeRow("testimonials", i)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-500" aria-label="Remove"><Trash2 className="size-4" /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addRow("testimonials", { quote: "", author: "" })} className="inline-flex min-h-[44px] items-center gap-2 text-[13px] font-bold text-[#7C3AED]"><Plus className="size-4" /> Add testimonial</button>
                  </div>
                  <Field label="Past brand collabs" hint="Comma-separated — shown as a 'Trusted by' row."><Input value={k.brands} onChange={(e) => set("brands", e.target.value)} placeholder="Capitec, SA Tourism, Playa Bets" /></Field>
                  <Field label="Extra proof stats" hint="One per line."><textarea className={TA} value={k.stats} onChange={(e) => set("stats", e.target.value)} placeholder={"• 3 years finance content\n• 60K+ active community"} /></Field>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Pricing, packages & rights" step="06" hint="Package like an agency — 'from…', never a fixed public price." />
                <div className="space-y-4 p-5 sm:p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Currency">
                      <Select value={k.currency} onChange={(e) => set("currency", e.target.value)}>
                        <optgroup label="Most used">
                          {POPULAR_CUR.map((c) => <option key={c} value={c}>{CURRENCIES[c].flag} {c} — {CURRENCIES[c].label}</option>)}
                        </optgroup>
                        <optgroup label="All of Africa (A–Z)">
                          {Object.keys(CURRENCIES).sort((a, b) => CURRENCIES[a].label.localeCompare(CURRENCIES[b].label)).map((c) => (
                            <option key={c} value={c}>{CURRENCIES[c].flag} {c} — {CURRENCIES[c].label}</option>
                          ))}
                        </optgroup>
                      </Select>
                    </Field>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[13px] font-bold text-[#1A1523]">Deliverable rates</div>
                    {k.rates.map((r, i) => (
                      <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1.6fr_1fr]">
                        <Input value={r.name} onChange={(e) => setArr<Rate>("rates", i, "name", e.target.value)} placeholder="Package" />
                        <Input value={r.price} onChange={(e) => setArr<Rate>("rates", i, "price", e.target.value)} placeholder="4,500" />
                      </div>
                    ))}
                    <p className="text-[13px] leading-snug text-neutral-500">Not sure what to charge? <Link to="/rate-card" className="font-bold text-[#7C3AED] underline underline-offset-2">Use the Rate Card Calculator</Link> first.</p>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[13px] font-bold text-[#1A1523]">Packages (offer ladder)</div>
                    {k.packages.map((p, i) => (
                      <div key={i} className="mb-2 space-y-2 rounded-xl border border-neutral-200 p-3">
                        <div className="grid gap-2 sm:grid-cols-[0.8fr_1.4fr_0.8fr]">
                          <Input value={p.tier} onChange={(e) => setArr<Package>("packages", i, "tier", e.target.value)} placeholder="Silver" />
                          <Input value={p.name} onChange={(e) => setArr<Package>("packages", i, "name", e.target.value)} placeholder="Package name" />
                          <Input value={p.startingAt} onChange={(e) => setArr<Package>("packages", i, "startingAt", e.target.value)} placeholder="from 4,500" />
                        </div>
                        <Input value={p.includes} onChange={(e) => setArr<Package>("packages", i, "includes", e.target.value)} placeholder="What's included — e.g. 1 hero reel + 3 stories + 30-day usage" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="mb-1.5 text-[13px] font-bold text-[#1A1523]">Add-ons brands pay for</div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {(Object.keys(ADDONS) as AddonKey[]).map((key) => (
                        <Chip key={key} active={k.addons.includes(key)} onClick={() => toggleAddon(key)} sub={ADDONS[key].desc}>
                          {ADDONS[key].label} · {ADDONS[key].pct}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Usage rights"><Input value={k.rightsUsage} onChange={(e) => set("rightsUsage", e.target.value)} placeholder="Organic: 30 days included" /></Field>
                    <Field label="Whitelisting"><Input value={k.rightsWhitelisting} onChange={(e) => set("rightsWhitelisting", e.target.value)} placeholder="+40% of base / 30 days" /></Field>
                    <Field label="Exclusivity"><Input value={k.rightsExclusivity} onChange={(e) => set("rightsExclusivity", e.target.value)} placeholder="14 / 30 / 60 days — priced" /></Field>
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Terms, availability & authority" step="07" hint="Reads like a company, not a kid." />
                <div className="space-y-4 p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Turnaround"><Input value={k.termsTurnaround} onChange={(e) => set("termsTurnaround", e.target.value)} placeholder="72 hours" /></Field>
                    <Field label="Revisions"><Input value={k.termsRevisions} onChange={(e) => set("termsRevisions", e.target.value)} placeholder="1 included" /></Field>
                    <Field label="Comms"><Input value={k.termsComms} onChange={(e) => set("termsComms", e.target.value)} placeholder="Email / WhatsApp" /></Field>
                    <Field label="Payment terms"><Input value={k.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} placeholder="50% deposit · Net 15 · #ad disclosed" /></Field>
                  </div>
                  <Field label="Availability" hint="A little scarcity reads as premium."><Input value={k.availability} onChange={(e) => set("availability", e.target.value)} placeholder="Accepting Q4 2026 partnerships" /></Field>
                  <Field label="Press & authority"><Input value={k.press} onChange={(e) => set("press", e.target.value)} placeholder="Award-winning · industry judge · conference speaker" /></Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Contact email"><Input type="email" value={k.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></Field>
                    <Field label="Booking link"><Input value={k.booking} onChange={(e) => set("booking", e.target.value)} placeholder="calendly.com/you" /></Field>
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Design & branding" step="08" hint="Make it yours — colour, theme, fonts, logo, images." />
                <div className="space-y-5 p-5 sm:p-6">
                  <div>
                    <div className="mb-1.5 text-[13px] font-bold text-[#1A1523]">Accent colour</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {ACCENT_SWATCHES.map((c) => (
                        <button key={c} type="button" onClick={() => set("accent", c)} aria-label={c}
                          className={`h-9 w-9 rounded-full border-2 transition ${k.accent === c ? "border-[#1A1523] scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 text-[13px] font-semibold text-neutral-600">
                        Custom
                        <input type="color" value={k.accent} onChange={(e) => set("accent", e.target.value)} className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0" />
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Kit theme">
                      <Select value={k.kitTheme} onChange={(e) => set("kitTheme", e.target.value as "dark" | "light")}>
                        <option value="dark">Dark header</option>
                        <option value="light">Light / minimal</option>
                      </Select>
                    </Field>
                    <Field label="Font style">
                      <Select value={k.font} onChange={(e) => set("font", e.target.value as FontChoice)}>
                        {(Object.keys(FONTS) as FontChoice[]).map((f) => <option key={f} value={f}>{FONTS[f].label}</option>)}
                      </Select>
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ImageField label="Logo" value={k.logo} onPick={(f) => readImage(f, "logo")} onClear={() => set("logo", "")} />
                    <ImageField label="Headshot / brand image" value={k.image} onPick={(f) => readImage(f, "image")} onClear={() => set("image", "")} />
                  </div>
                  <Field label="Custom footer" hint="Shown at the bottom of the kit."><Input value={k.footer} onChange={(e) => set("footer", e.target.value)} placeholder="© 2026 Your Name · yoursite.com" /></Field>
                </div>
              </Panel>

              <GoldButton type="button" onClick={print}><Printer className="size-4" /> Save as PDF</GoldButton>

              {/* Go Pro — waitlist (Phase 1) */}
              <Panel raised className="overflow-hidden">
                <div className="relative overflow-hidden bg-[#1A1523] p-6 sm:p-8">
                  <DotGrid dark />
                  <GoldGlow className="-right-24 -top-28" size={420} opacity={0.6} />
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#8B5CF6]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C4B5FD]"><Sparkles className="size-3.5" /> Media Kit Pro</div>
                    <h3 className="mt-4 font-display text-[22px] font-extrabold tracking-tight text-white sm:text-[26px]">Remove the watermark. Save & re-edit your kit.</h3>
                    <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-white/70">
                      Pro gives you a clean, watermark-free PDF, saved kits you can update any time, and
                      premium templates — <strong className="text-white">7 days free</strong>. It's launching soon.
                    </p>
                    {proJoined ? (
                      <p className="mt-5 flex items-center gap-2 text-[14px] text-[#C4B5FD]"><Check className="size-4" /> You're on the list — we'll email you the moment Pro opens.</p>
                    ) : (
                      <div className="mt-5">
                        <div className="flex flex-col gap-2.5 sm:flex-row">
                          <Input type="email" value={proEmail} onChange={(e) => setProEmail(e.target.value)} placeholder="you@email.com" className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/40" />
                          <button type="button" disabled={proMut.isPending || !tsToken} onClick={joinPro}
                            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] px-6 text-[14px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50 sm:w-auto">
                            {proMut.isPending ? "Joining…" : "Join the waitlist"}
                          </button>
                        </div>
                        <div className="mt-3"><TurnstileGate ref={tsRef} onToken={setTsToken} /></div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Email me this kit" step="09" hint="Get a copy sent straight to your inbox." />
                <div className="p-5 sm:p-6">
                  {sent ? (
                    <p className="flex items-center justify-center gap-2 text-[14px] text-[#1A1523]"><Check className="size-4 text-[#8B5CF6]" /> Sent to {recipientEmail} — check your inbox (or spam).</p>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input className="flex-1" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="you@example.com" />
                      <GoldButton type="button" disabled={sendMut.isPending}
                        onClick={() => {
                          if (!recipientEmail) { toast.error("Enter your email."); return; }
                          sendMut.mutate({
                            data: {
                              recipientEmail,
                              fullName: k.name || undefined,
                              name: k.name, handle: k.handle, tagline: k.tagline, bio: k.bio,
                              location: k.location || undefined, niches: k.niches || undefined,
                              platforms: k.platforms,
                              targetAudience: k.targetAudience || undefined, ageBracket: k.ageBracket || undefined, genderSplit: k.genderSplit || undefined,
                              pillars: k.pillars, rates: k.rates,
                              statLines: k.stats.split("\n").map((s) => s.replace(/^[•\-\s]+/, "").trim()),
                              brands: k.brands || undefined,
                              contactEmail: k.email, booking: k.booking,
                              premium: premiumPayload,
                              ...getUtm(),
                            },
                          });
                        }}
                        className="sm:w-auto sm:px-8">
                        {sendMut.isPending ? "Sending…" : "Send"}
                      </GoldButton>
                    </div>
                  )}
                </div>
              </Panel>
            </div>

            {/* LIVE PREVIEW (the deliverable) */}
            <div className="no-scrollbar lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
              <KitPreview k={k} />
            </div>
          </div>

          {/* Bridge CTA */}
          <Panel raised className="mb-20 mt-10 overflow-hidden print:hidden">
            <div className="relative overflow-hidden bg-[#1A1523] px-6 py-9 text-center sm:px-10">
              <DotGrid dark />
              <GoldGlow className="-bottom-32 -right-20" size={440} opacity={0.6} />
              <div className="relative">
                <Eyebrow className="!text-[#8B5CF6]">A kit gets the meeting</Eyebrow>
                <h3 className="mt-4 font-display text-[24px] font-extrabold tracking-tight text-white sm:text-[30px]">A system closes the deal.</h3>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/70">The Foundation Kit hands you the pitch email, the negotiation scripts, and the path from one brand reply to a recurring retainer.</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link to="/products/$slug" params={{ slug: "called-expert-foundation-kit" }} className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-[15px] font-bold text-white transition hover:brightness-110">Get the Foundation Kit <ArrowRight className="size-4" /></Link>
                  <Link to="/rate-card" className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-white/25 px-7 text-[14px] font-bold text-white transition hover:border-[#8B5CF6] hover:text-[#8B5CF6]">Price your rate</Link>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
      <div className="print:hidden"><SiteFooter /></div>

      <style>{`@media print { .pointer-events-none.absolute:not(.mk-watermark) { display: none !important; } }`}</style>
    </div>
  );
}

function ImageField({ label, value, onPick, onClear }: { label: string; value: string; onPick: (f: File | undefined) => void; onClear: () => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-bold text-[#1A1523]">{label}</div>
      {value ? (
        <div className="flex items-center gap-3">
          <img src={value} alt="" className="h-12 w-12 rounded-lg border border-neutral-200 object-cover" />
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500 hover:text-red-500"><X className="size-3.5" /> Remove</button>
        </div>
      ) : (
        <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 text-[13px] font-semibold text-neutral-500 hover:border-[#8B5CF6]">
          <Upload className="size-4" /> Upload
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}

function KitPreview({ k }: { k: Kit }) {
  const accent = k.accent || "#8B5CF6";
  const dark = k.kitTheme !== "light";
  const font = FONTS[k.font] ?? FONTS.bold;
  const cur = CURRENCIES[k.currency] ?? CURRENCIES.ZAR;
  const money = (raw: string) => {
    const s = raw.trim();
    if (!s) return "";
    return /[^\d.,\s]/.test(s) ? s : `${cur.sym}${s}`;
  };
  const tint = (pct: number) => `color-mix(in srgb, ${accent} ${pct}%, transparent)`;

  const niches = k.niches.split(",").map((s) => s.trim()).filter(Boolean);
  const brands = k.brands.split(",").map((s) => s.trim()).filter(Boolean);
  const platforms = k.platforms.filter((p) => p.name.trim() && p.followers.trim());
  const pillars = k.pillars.filter((p) => p.name.trim());
  const rates = k.rates.filter((r) => r.name.trim());
  const statLines = k.stats.split("\n").map((s) => s.replace(/^[•\-\s]+/, "").trim()).filter(Boolean);
  const caseStudies = k.caseStudies.filter((c) => c.brand.trim() || c.result.trim());
  const testimonials = k.testimonials.filter((t) => t.quote.trim());
  const packages = k.packages.filter((p) => p.tier.trim() && (p.includes.trim() || p.startingAt.trim()));
  const addons = k.addons.map((key) => (ADDONS[key as AddonKey] ? `${ADDONS[key as AddonKey].label} ${ADDONS[key as AddonKey].pct}` : key));
  const hasRights = k.rightsUsage || k.rightsWhitelisting || k.rightsExclusivity;
  const hasTerms = k.termsTurnaround || k.termsRevisions || k.termsComms || k.paymentTerms;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_18px_50px_-24px_rgba(28,28,28,0.28)] print:rounded-none print:border-0 print:shadow-none ${font.body}`}
      style={{ ["--accent" as string]: accent } as React.CSSProperties}
    >
      {/* Watermark — free/Phase-1 output. Kept at print (Pro removes it later). */}
      <div aria-hidden className="mk-watermark pointer-events-none absolute inset-0 z-20 flex flex-wrap content-center justify-center gap-x-8 gap-y-14 overflow-hidden opacity-[0.06]">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="rotate-[-30deg] whitespace-nowrap font-display text-xl font-black uppercase tracking-widest text-[#1A1523]">PREVIEW · chkplt.com</span>
        ))}
      </div>

      {/* Header */}
      <div className={dark ? "bg-[#1A1523] p-7" : "border-b border-neutral-200 bg-[#F5F3FF] p-7"}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>Media Kit</div>
            <h2 className={`mt-1 text-3xl ${font.head} ${dark ? "text-white" : "text-[#1A1523]"}`}>{k.name || "Your Name"}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: accent }}>
              {k.handle || "@handle"}
              {k.location && <span className={dark ? "text-white/45" : "text-neutral-400"}>· {k.location}</span>}
            </div>
          </div>
          {k.logo && <img src={k.logo} alt="logo" className="h-12 w-auto max-w-[120px] object-contain" />}
        </div>
        {k.positioning && <p className={`mt-3 max-w-md text-sm font-medium ${dark ? "text-white/85" : "text-[#2A2A2A]"}`}>{k.positioning}</p>}
        {k.oneLineProof && <p className="mt-2 font-mono text-[11px] uppercase tracking-wide" style={{ color: accent }}>{k.oneLineProof}</p>}
        {k.tagline && <p className={`mt-3 max-w-md text-sm ${dark ? "text-white/70" : "text-neutral-600"}`}>{k.tagline}</p>}
        {niches.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {niches.map((n) => <span key={n} className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#1A1523]" style={{ backgroundColor: accent }}>{n}</span>)}
          </div>
        )}
      </div>

      {k.image && <img src={k.image} alt="" className="h-40 w-full object-cover" />}

      <div className="space-y-6 p-7">
        {k.bio && <p className="text-sm leading-relaxed text-[#2A2A2A]">{k.bio}</p>}

        {platforms.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {platforms.map((p) => {
              const erNum = Number(p.er);
              const mult = erNum > 0 ? erNum / AFRICAN_AVG_ER : 0;
              return (
                <div key={p.name} className="rounded-xl border border-neutral-200/90 bg-[#F5F3FF] p-3 text-center">
                  <BrandLogo platform={platformKey(p.name)} className="mx-auto h-6 w-6" />
                  <div className="mt-1.5 text-2xl font-extrabold text-[#1A1523]">{p.followers}</div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wide text-neutral-500">{p.name}</div>
                  {p.avgViews && <div className="mt-1 text-[11px] text-neutral-500">{p.avgViews} avg views</div>}
                  {p.er && <div className="mt-0.5 text-[11px] text-neutral-500">{p.er}% ER{mult > 0 ? ` · ${mult.toFixed(1)}× SA avg` : ""}</div>}
                  {p.growth && <div className="mt-0.5 text-[11px] font-semibold" style={{ color: accent }}>{p.growth}</div>}
                  {p.verifiedOn && <div className="mt-0.5 font-mono text-[8px] uppercase tracking-wide" style={{ color: accent }}>✓ {p.verifiedOn}</div>}
                </div>
              );
            })}
          </div>
        )}

        {(k.targetAudience || k.genderSplit || k.audiencePsychographics || k.audienceBuying) && (
          <Block label="Audience">
            {k.targetAudience && <p className="text-sm text-[#2A2A2A]">{k.targetAudience}</p>}
            <p className="mt-1 text-xs text-neutral-500">Core: {k.ageBracket}{k.genderSplit ? ` · ${k.genderSplit}` : ""}{k.audienceCities ? ` · ${k.audienceCities}` : ""}</p>
            {k.audienceInterests && <p className="mt-1 text-xs text-neutral-500">Interests: {k.audienceInterests}</p>}
            {k.audiencePsychographics && <p className="mt-2 text-sm text-[#2A2A2A]">{k.audiencePsychographics}</p>}
            {k.audienceBuying && <p className="mt-1.5 rounded-lg p-2.5 text-sm text-[#2A2A2A]" style={{ backgroundColor: tint(9) }}><span className="font-bold" style={{ color: accent }}>Buying behaviour: </span>{k.audienceBuying}</p>}
            {k.authenticity && <p className="mt-1 text-xs text-neutral-500">Authenticity: {k.authenticity}</p>}
          </Block>
        )}

        {pillars.length > 0 && (
          <Block label="Content pillars">
            <ul className="space-y-1.5">
              {pillars.map((p) => <li key={p.name} className="text-sm"><span className="font-bold text-[#1A1523]">{p.name}</span>{p.desc && <span className="text-neutral-500"> — {p.desc}</span>}</li>)}
            </ul>
            {k.formats && <p className="mt-2 text-xs text-neutral-500">Best formats: {k.formats}</p>}
          </Block>
        )}

        {caseStudies.length > 0 && (
          <Block label="Case studies">
            <div className="space-y-3">
              {caseStudies.map((c, i) => (
                <div key={i} className="rounded-xl border border-neutral-200/90 p-3">
                  <div className={`text-sm font-bold text-[#1A1523] ${font.head}`}>{c.brand}</div>
                  {c.objective && <p className="mt-1 text-xs text-neutral-500"><span className="font-semibold">Objective:</span> {c.objective}</p>}
                  {c.whatWeDid && <p className="mt-0.5 text-xs text-neutral-500"><span className="font-semibold">What we did:</span> {c.whatWeDid}</p>}
                  {c.result && <p className="mt-1 text-sm font-bold" style={{ color: accent }}>{c.result}</p>}
                </div>
              ))}
            </div>
          </Block>
        )}

        {testimonials.length > 0 && (
          <Block label="What partners say">
            <div className="space-y-2">
              {testimonials.map((t, i) => (
                <blockquote key={i} className="border-l-2 pl-3 text-sm text-[#2A2A2A]" style={{ borderColor: accent }}>
                  “{t.quote}”{t.author && <span className="mt-0.5 block text-xs text-neutral-500">{t.author}</span>}
                </blockquote>
              ))}
            </div>
          </Block>
        )}

        {statLines.length > 0 && (
          <Block label="Why brands work with me">
            <ul className="space-y-1">{statLines.map((s, i) => <li key={i} className="flex gap-2 text-sm text-[#2A2A2A]"><span style={{ color: accent }}>✦</span>{s}</li>)}</ul>
          </Block>
        )}

        {(packages.length > 0 || rates.length > 0) && (
          <Block label={`Rates${k.currency ? ` · ${k.currency}` : ""}`}>
            {packages.length > 0 ? (
              <div className="space-y-2">
                {packages.map((p, i) => (
                  <div key={i} className="rounded-xl border border-neutral-200/90 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-[#1A1523]"><span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: accent }}>{p.tier}</span>{p.name ? ` · ${p.name}` : ""}</span>
                      {p.startingAt && <span className="text-sm font-bold text-[#1A1523]">from {money(p.startingAt)}</span>}
                    </div>
                    {p.includes && <p className="mt-1 text-xs text-neutral-500">{p.includes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-neutral-200/80">
                {rates.map((r) => <div key={r.name} className="flex items-center justify-between py-1.5 text-sm"><span className="text-[#2A2A2A]">{r.name}</span><span className="font-bold text-[#1A1523]">{money(r.price) || "—"}</span></div>)}
              </div>
            )}
            {addons.length > 0 && <p className="mt-2 text-xs text-neutral-500"><span className="font-semibold">Add-ons:</span> {addons.join(" · ")}</p>}
          </Block>
        )}

        {(hasRights || hasTerms || k.press) && (
          <Block label="Usage, terms & authority">
            {hasRights && (
              <ul className="space-y-0.5 text-xs text-neutral-600">
                {k.rightsUsage && <li><span className="font-semibold">Usage:</span> {k.rightsUsage}</li>}
                {k.rightsWhitelisting && <li><span className="font-semibold">Whitelisting:</span> {k.rightsWhitelisting}</li>}
                {k.rightsExclusivity && <li><span className="font-semibold">Exclusivity:</span> {k.rightsExclusivity}</li>}
              </ul>
            )}
            {hasTerms && <p className="mt-1.5 text-xs text-neutral-500">{[k.termsTurnaround && `Turnaround ${k.termsTurnaround}`, k.termsRevisions && `${k.termsRevisions} revisions`, k.termsComms, k.paymentTerms].filter(Boolean).join(" · ")}</p>}
            {k.press && <p className="mt-1.5 text-xs font-semibold text-[#1A1523]">{k.press}</p>}
          </Block>
        )}

        {brands.length > 0 && (
          <Block label="Trusted by">
            <div className="flex flex-wrap gap-2">{brands.map((b) => <span key={b} className="rounded border border-neutral-200/90 px-2.5 py-1 text-sm text-[#2A2A2A]">{b}</span>)}</div>
          </Block>
        )}
      </div>

      {(k.email || k.booking || k.availability || k.footer) && (
        <div className="border-t bg-[#F5F3FF] p-5" style={{ borderColor: tint(30) }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className={`text-sm font-bold uppercase text-[#1A1523] ${font.head}`}>Let's work together</div>
              {k.availability && <div className="mt-0.5 text-xs" style={{ color: accent }}>{k.availability}</div>}
            </div>
            <div className="text-right text-sm text-[#1A1523]">
              {k.email}{k.email && k.booking ? " · " : ""}{k.booking}
              {k.lastUpdated && <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wide text-neutral-400">Updated {k.lastUpdated}</div>}
            </div>
          </div>
          {k.footer && <div className="mt-3 border-t border-neutral-200/70 pt-2 text-center text-[11px] text-neutral-400">{k.footer}</div>}
        </div>
      )}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
      {children}
    </div>
  );
}
