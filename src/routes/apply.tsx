import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TurnstileGate } from "@/components/TurnstileGate";

import { submitApplication } from "@/lib/apply.functions";
import type { RecommendationResult } from "@/utils/evaluator";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply — 90-Day Called Expert Accelerator PRO | CHKPLT" },
      {
        name: "description",
        content:
          "Apply for the 90-Day Called Expert Accelerator PRO. 4 minutes. We review within 24 hours.",
      },
    ],
  }),
  component: ApplyPage,
});

const TOTAL_STEPS = 4;

const STEPS = [
  { num: "01", label: "Who You Are" },
  { num: "02", label: "Expertise & Income" },
  { num: "03", label: "Your Owned Assets" },
  { num: "04", label: "Readiness & Mindset" },
];

const GOLD_GLOW = {
  boxShadow: "0 0 24px rgba(245,158,11,0.55), 0 0 56px rgba(245,158,11,0.25)",
} as const;

const FOLLOWER_MAP: Record<string, number> = {
  "0": 0,
  "1-500": 250,
  "500-2000": 1250,
  "2000-10000": 6000,
  "10000-50000": 30000,
  "50000+": 75000,
};

const INCOME_MAP: Record<string, number> = {
  "under-10": 9000,
  "10-30": 20000,
  "30-70": 50000,
  "70-150": 110000,
  "150+": 200000,
};

const STREAM_MAP: Record<string, number> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5+": 5,
};

const DOMINANCE_MAP: Record<string, number> = {
  "90-100": 95,
  "70-89": 80,
  "50-69": 60,
  "under-50": 40,
};

interface Fields {
  full_name: string;
  email: string;
  followers: string;
  posts_content: "" | "yes" | "no";
  income_range: string;
  income_streams: string;
  income_dominance: string;
  has_products: "" | "yes" | "no";
  product_sales: string;
  has_email_list: "" | "yes" | "no";
  subscribers: string;
  has_community: "" | "yes" | "no";
  community_members: string;
  uses_email_tools: "" | "yes" | "no";
  can_commit_hours: "" | "yes" | "no";
  has_clear_niche: "" | "yes" | "no";
  has_done_swot: "" | "yes" | "no";
  primary_e: "" | "Educate" | "Entertain" | "Encourage" | "Earn";
  expertise_worth_more: "" | "yes" | "no";
  building_for: "" | "GENERATIONS" | "TODAY";
}

const INITIAL: Fields = {
  full_name: "",
  email: "",
  followers: "",
  posts_content: "",
  income_range: "",
  income_streams: "",
  income_dominance: "",
  has_products: "",
  product_sales: "0",
  has_email_list: "",
  subscribers: "0",
  has_community: "",
  community_members: "0",
  uses_email_tools: "",
  can_commit_hours: "",
  has_clear_niche: "",
  has_done_swot: "",
  primary_e: "",
  expertise_worth_more: "",
  building_for: "",
};

function YesNo({
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
}: {
  value: "" | "yes" | "no";
  onChange: (v: "yes" | "no") => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="flex gap-3">
      {(["yes", "no"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-3 px-4 border font-display font-bold uppercase text-sm tracking-wide transition-all ${
            value === opt
              ? "bg-[#F59E0B] border-[#F59E0B] text-[#111]"
              : "border-[#d0c8bc] bg-white text-[#555] hover:border-[#F59E0B] hover:text-[#0F172A]"
          }`}
        >
          {opt === "yes" ? yesLabel : noLabel}
        </button>
      ))}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-display text-[#0F172A] text-sm font-bold leading-snug">{label}</Label>
      {children}
    </div>
  );
}

function ApplyPage() {
  const submit = useServerFn(submitApplication);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [tsToken, setTsToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(RecommendationResult & { applicationId: string }) | null>(null);

  const set = <K extends keyof Fields>(key: K, val: Fields[K]) =>
    setFields((f) => ({ ...f, [key]: val }));

  function canProceed(): boolean {
    if (step === 0) {
      return (
        fields.full_name.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) &&
        fields.followers !== "" &&
        fields.posts_content !== ""
      );
    }
    if (step === 1) {
      return (
        fields.income_range !== "" &&
        fields.income_streams !== "" &&
        fields.income_dominance !== "" &&
        fields.has_products !== ""
      );
    }
    if (step === 2) {
      return (
        fields.has_email_list !== "" &&
        fields.has_community !== "" &&
        fields.uses_email_tools !== ""
      );
    }
    if (step === 3) {
      return (
        fields.can_commit_hours !== "" &&
        fields.has_clear_niche !== "" &&
        fields.has_done_swot !== "" &&
        fields.primary_e !== "" &&
        fields.expertise_worth_more !== "" &&
        fields.building_for !== "" &&
        tsToken !== null
      );
    }
    return false;
  }

  async function handleSubmit() {
    if (!canProceed()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await submit({
        data: {
          full_name: fields.full_name.trim(),
          email: fields.email.trim().toLowerCase(),
          total_followers: FOLLOWER_MAP[fields.followers] ?? 0,
          engagement_rate: null,
          posts_consistently_4x: fields.posts_content === "yes",
          monthly_income_value: INCOME_MAP[fields.income_range] ?? 0,
          income_streams_count: STREAM_MAP[fields.income_streams] ?? 1,
          largest_stream_percentage: DOMINANCE_MAP[fields.income_dominance] ?? 80,
          has_products_for_sale: fields.has_products === "yes",
          product_sales_last_month: parseInt(fields.product_sales, 10) || 0,
          owns_email_list: fields.has_email_list === "yes",
          email_subscribers_count: parseInt(fields.subscribers, 10) || 0,
          has_private_community: fields.has_community === "yes",
          community_members_count: parseInt(fields.community_members, 10) || 0,
          email_open_rate: 0,
          has_automated_funnels: false,
          uses_email_marketing_software: fields.uses_email_tools === "yes",
          batches_content: false,
          runs_without_owner_1_week: fields.can_commit_hours === "yes",
          has_documented_sops: false,
          has_clear_niche: fields.has_clear_niche === "yes",
          has_done_swot: fields.has_done_swot === "yes",
          primary_e: fields.primary_e as "Educate" | "Entertain" | "Encourage" | "Earn",
          abundance_mindset: fields.expertise_worth_more === "yes",
          building_horizon: fields.building_for as "GENERATIONS" | "TODAY",
        },
      });
      setResult(res);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const isQualified = result?.status === "QUALIFIED_FOR_CORE_PROGRAM";

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-20 pb-24">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-banana mb-3">
            Application
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#0F172A] leading-[1.05] tracking-tight uppercase mb-4">
            90-Day Called Expert
            <br /><span className="text-banana">Accelerator PRO</span>
          </h1>
          <p className="text-[#777] text-base leading-relaxed max-w-md mx-auto">
            4 minutes. We review within 24 hours. No sales call pressure — just an honest qualification to make sure you're ready.
          </p>
        </div>

        {/* Result state */}
        {result ? (
          <div
            className="border-2 bg-white p-8 sm:p-10 text-center"
            style={{
              borderColor: isQualified ? "#F59E0B" : "#d0c8bc",
              ...GOLD_GLOW,
            }}
          >
            {isQualified ? (
              <>
                <CheckCircle2 className="size-12 text-banana mx-auto mb-4" />
                <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-banana mb-3">
                  YOU QUALIFY
                </div>
                <h2 className="font-display text-2xl sm:text-3xl text-[#0F172A] uppercase mb-4">
                  You're In, {fields.full_name.split(" ")[0]}.
                </h2>
                <p className="text-[#555] text-base leading-relaxed mb-6 max-w-sm mx-auto">
                  Your diagnostic passed. Check your inbox — we sent you the next steps. One more thing to do: create your account and we'll confirm your cohort start date.
                </p>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-[#111] font-display font-black uppercase tracking-wide text-base py-4 px-10 hover:bg-[#b8963e] transition-colors w-full max-w-xs"
                  style={GOLD_GLOW}
                >
                  Create Your Account
                  <ArrowRight className="size-4" />
                </Link>
                <p className="mt-4 text-[#555] text-xs">
                  Free to create · No payment until cohort confirmation
                </p>
              </>
            ) : (
              <>
                <XCircle className="size-12 text-banana/50 mx-auto mb-4" />
                <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#5a5a5a] mb-3">
                  NOT YET
                </div>
                <h2 className="font-display text-2xl sm:text-3xl text-[#0F172A] uppercase mb-4">
                  The Foundation Kit First.
                </h2>
                <p className="text-[#555] text-base leading-relaxed mb-6 max-w-sm mx-auto">
                  You're not ready for the Accelerator PRO yet — and that's not a failure. It means we caught your gap before you paid $970 for something you'd struggle to execute. Start with the Foundation Kit. Build the base. Apply again in 90 days.
                </p>
                {result.focusPillars && (
                  <p className="text-[#777] text-sm mb-6 max-w-xs mx-auto">
                    <strong className="text-[#0F172A]">Your focus area:</strong> {result.focusPillars}
                  </p>
                )}
                <Link
                  to="/products/$slug"
                  params={{ slug: "called-expert-foundation-kit" }}
                  className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-[#0F172A] font-display font-black uppercase tracking-wide text-base py-4 px-10 hover:bg-[#D97706] transition-colors w-full max-w-xs"
                  style={GOLD_GLOW}
                >
                  Get the Foundation Kit — $97
                  <ArrowRight className="size-4" />
                </Link>
                <p className="mt-4 text-sm">
                  <Link to="/tools" className="text-[var(--nx-gold-text)] font-semibold hover:underline">
                    Or start with the free tools →
                  </Link>
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-8">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`size-8 flex items-center justify-center font-mono text-xs font-bold border transition-all ${
                        i < step
                          ? "bg-[#F59E0B] border-[#F59E0B] text-[#111]"
                          : i === step
                          ? "border-[#F59E0B] text-banana bg-white"
                          : "border-[#d0c8bc] text-[#555] bg-white"
                      }`}
                    >
                      {i < step ? "✓" : s.num}
                    </div>
                    <div
                      className={`mt-1 font-mono text-[9px] tracking-wide uppercase hidden sm:block ${
                        i === step ? "text-[#0F172A]" : "text-[#555]"
                      }`}
                    >
                      {s.label}
                    </div>
                  </div>
                  {i < TOTAL_STEPS - 1 && (
                    <div
                      className={`h-px flex-1 mx-1 transition-colors ${
                        i < step ? "bg-[#F59E0B]" : "bg-[#d0c8bc]"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className="border border-[#d0c8bc] bg-white p-6 sm:p-8">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana mb-1">
                Step {step + 1} of {TOTAL_STEPS}
              </div>
              <h2 className="font-display text-xl sm:text-2xl text-[#0F172A] uppercase mb-6">
                {STEPS[step].label}
              </h2>

              <div className="space-y-5">

                {/* ── STEP 1: Who You Are ─────────────────────────────── */}
                {step === 0 && (
                  <>
                    <FieldRow label="Your full name">
                      <Input
                        value={fields.full_name}
                        onChange={(e) => set("full_name", e.target.value)}
                        placeholder="Your full name"
                        className="h-12 border-[#d0c8bc] bg-white focus:border-[#F59E0B] focus:ring-0"
                      />
                    </FieldRow>
                    <FieldRow label="Your email address">
                      <Input
                        type="email"
                        value={fields.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="you@domain.com"
                        className="h-12 border-[#d0c8bc] bg-white focus:border-[#F59E0B] focus:ring-0"
                      />
                    </FieldRow>
                    <FieldRow label="How many people follow you across all your platforms? (LinkedIn, Instagram, Facebook, YouTube — total)">
                      <Select
                        value={fields.followers}
                        onValueChange={(v) => set("followers", v)}
                      >
                        <SelectTrigger className="h-12 border-[#d0c8bc] bg-white">
                          <SelectValue placeholder="Select a range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">I don't have a following yet (0)</SelectItem>
                          <SelectItem value="1-500">1 – 500 followers</SelectItem>
                          <SelectItem value="500-2000">500 – 2,000 followers</SelectItem>
                          <SelectItem value="2000-10000">2,000 – 10,000 followers</SelectItem>
                          <SelectItem value="10000-50000">10,000 – 50,000 followers</SelectItem>
                          <SelectItem value="50000+">50,000+ followers</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="Do you currently post or share content about your expertise — even occasionally?">
                      <YesNo
                        value={fields.posts_content}
                        onChange={(v) => set("posts_content", v)}
                        yesLabel="Yes, I post"
                        noLabel="Not yet"
                      />
                    </FieldRow>
                  </>
                )}

                {/* ── STEP 2: Expertise & Income ──────────────────────── */}
                {step === 1 && (
                  <>
                    <FieldRow label="What is your approximate monthly income from your professional work? (salary, freelance, consulting, business — combined)">
                      <Select
                        value={fields.income_range}
                        onValueChange={(v) => set("income_range", v)}
                      >
                        <SelectTrigger className="h-12 border-[#d0c8bc] bg-white">
                          <SelectValue placeholder="Select a range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-10">Under $500/month</SelectItem>
                          <SelectItem value="10-30">$500 – $1,500/month</SelectItem>
                          <SelectItem value="30-70">$1,500 – $4,000/month</SelectItem>
                          <SelectItem value="70-150">$4,000 – $8,000/month</SelectItem>
                          <SelectItem value="150+">$8,000+/month</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="How many different income sources do you currently have?">
                      <Select
                        value={fields.income_streams}
                        onValueChange={(v) => set("income_streams", v)}
                      >
                        <SelectTrigger className="h-12 border-[#d0c8bc] bg-white">
                          <SelectValue placeholder="Number of income sources" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Just 1 (salary or single business)</SelectItem>
                          <SelectItem value="2">2 sources</SelectItem>
                          <SelectItem value="3">3 sources</SelectItem>
                          <SelectItem value="4">4 sources</SelectItem>
                          <SelectItem value="5+">5 or more</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="What percentage of your total income comes from a single source?">
                      <Select
                        value={fields.income_dominance}
                        onValueChange={(v) => set("income_dominance", v)}
                      >
                        <SelectTrigger className="h-12 border-[#d0c8bc] bg-white">
                          <SelectValue placeholder="Select a percentage range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="90-100">90–100% (one source dominates)</SelectItem>
                          <SelectItem value="70-89">70–89%</SelectItem>
                          <SelectItem value="50-69">50–69%</SelectItem>
                          <SelectItem value="under-50">Less than 50% (balanced)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="Do you already have any paid offerings — courses, consulting, ebooks, speaking, coaching?">
                      <YesNo
                        value={fields.has_products}
                        onChange={(v) => set("has_products", v)}
                        yesLabel="Yes"
                        noLabel="Not yet"
                      />
                    </FieldRow>
                    {fields.has_products === "yes" && (
                      <FieldRow label="How many clients or sales did you deliver/close last month?">
                        <Input
                          type="number"
                          min={0}
                          value={fields.product_sales}
                          onChange={(e) => set("product_sales", e.target.value)}
                          placeholder="0"
                          className="h-12 border-[#d0c8bc] bg-white focus:border-[#F59E0B] focus:ring-0"
                        />
                      </FieldRow>
                    )}
                  </>
                )}

                {/* ── STEP 3: Owned Assets ─────────────────────────────── */}
                {step === 2 && (
                  <>
                    <FieldRow label="Do you have an email list or subscriber database?">
                      <YesNo
                        value={fields.has_email_list}
                        onChange={(v) => set("has_email_list", v)}
                      />
                    </FieldRow>
                    {fields.has_email_list === "yes" && (
                      <FieldRow label="How many subscribers?">
                        <Input
                          type="number"
                          min={0}
                          value={fields.subscribers}
                          onChange={(e) => set("subscribers", e.target.value)}
                          placeholder="0"
                          className="h-12 border-[#d0c8bc] bg-white focus:border-[#F59E0B] focus:ring-0"
                        />
                      </FieldRow>
                    )}
                    <FieldRow label="Do you have a private online community? (WhatsApp group, Telegram, Facebook group, Discord)">
                      <YesNo
                        value={fields.has_community}
                        onChange={(v) => set("has_community", v)}
                      />
                    </FieldRow>
                    {fields.has_community === "yes" && (
                      <FieldRow label="How many active members?">
                        <Input
                          type="number"
                          min={0}
                          value={fields.community_members}
                          onChange={(e) => set("community_members", e.target.value)}
                          placeholder="0"
                          className="h-12 border-[#d0c8bc] bg-white focus:border-[#F59E0B] focus:ring-0"
                        />
                      </FieldRow>
                    )}
                    <FieldRow label="Do you use any email or audience communication tools? (MailerLite, WhatsApp Business, Substack, Mailchimp)">
                      <YesNo
                        value={fields.uses_email_tools}
                        onChange={(v) => set("uses_email_tools", v)}
                      />
                    </FieldRow>
                  </>
                )}

                {/* ── STEP 4: Readiness & Mindset ─────────────────────── */}
                {step === 3 && (
                  <>
                    <FieldRow label="If your current job or income continued as normal, could you dedicate 5–7 hours per week to building this alongside it?">
                      <YesNo
                        value={fields.can_commit_hours}
                        onChange={(v) => set("can_commit_hours", v)}
                        yesLabel="Yes, I can"
                        noLabel="Not right now"
                      />
                    </FieldRow>
                    <FieldRow label="Do you have a clear area of expertise you want to build a business around?">
                      <YesNo
                        value={fields.has_clear_niche}
                        onChange={(v) => set("has_clear_niche", v)}
                        yesLabel="Yes, I know it"
                        noLabel="Still figuring it out"
                      />
                    </FieldRow>
                    <FieldRow label="Have you ever done a serious self-assessment of your strengths, knowledge gaps, and growth opportunities?">
                      <YesNo
                        value={fields.has_done_swot}
                        onChange={(v) => set("has_done_swot", v)}
                        yesLabel="Yes"
                        noLabel="Not formally"
                      />
                    </FieldRow>
                    <FieldRow label="What type of content feels most natural to you?">
                      <div className="grid grid-cols-2 gap-2">
                        {(["Educate", "Entertain", "Encourage", "Earn"] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => set("primary_e", opt)}
                            className={`py-3 px-4 border font-display font-bold uppercase text-sm tracking-wide transition-all ${
                              fields.primary_e === opt
                                ? "bg-[#F59E0B] border-[#F59E0B] text-[#111]"
                                : "border-[#d0c8bc] bg-white text-[#555] hover:border-[#F59E0B]"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </FieldRow>
                    <FieldRow label="Do you believe your expertise is currently worth more than what you earn from it?">
                      <YesNo
                        value={fields.expertise_worth_more}
                        onChange={(v) => set("expertise_worth_more", v)}
                        yesLabel="100%, yes"
                        noLabel="I'm not sure"
                      />
                    </FieldRow>
                    <FieldRow label="Who are you building this for?">
                      <div className="flex gap-3">
                        {([
                          { val: "GENERATIONS", label: "My children & legacy" },
                          { val: "TODAY", label: "My own freedom now" },
                        ] as const).map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => set("building_for", opt.val)}
                            className={`flex-1 py-3 px-3 border font-display font-bold text-sm tracking-wide transition-all text-center ${
                              fields.building_for === opt.val
                                ? "bg-[#F59E0B] border-[#F59E0B] text-[#111]"
                                : "border-[#d0c8bc] bg-white text-[#555] hover:border-[#F59E0B]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </FieldRow>
                    <TurnstileGate onToken={setTsToken} className="pt-1" />
                  </>
                )}

              </div>

              {/* Error */}
              {error && (
                <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-7 flex items-center justify-between gap-4">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase text-[#5a5a5a] hover:text-[#0F172A] transition-colors"
                  >
                    <ArrowLeft className="size-3.5" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < TOTAL_STEPS - 1 ? (
                  <Button
                    type="button"
                    disabled={!canProceed()}
                    onClick={() => setStep((s) => s + 1)}
                    className="bg-[#F59E0B] hover:bg-[#b8963e] text-[#111] font-display font-black uppercase tracking-wide text-sm px-8 py-3 h-auto disabled:opacity-40 disabled:cursor-not-allowed"
                    style={canProceed() ? GOLD_GLOW : undefined}
                  >
                    Continue
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={!canProceed() || loading}
                    onClick={handleSubmit}
                    className="bg-[#F59E0B] hover:bg-[#b8963e] text-[#111] font-display font-black uppercase tracking-wide text-sm px-8 py-3 h-auto disabled:opacity-40 disabled:cursor-not-allowed"
                    style={canProceed() && !loading ? GOLD_GLOW : undefined}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-1" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="size-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Footer note */}
            <p className="mt-6 text-center text-[#555] text-xs leading-relaxed">
              We review every application within 24 hours. No automated rejection — a real human reads your answers.
              <br />
              Investment: $970 once-off or $350 × 3 months · billed in ZAR. Application is free and non-binding.
            </p>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
