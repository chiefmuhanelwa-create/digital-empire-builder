import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { submitApplication, type ApplicationInput } from "@/lib/apply.functions";
import type { RecommendationResult } from "@/utils/evaluator";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Audit Your Creative Equation — CHKPLT Cohort 01" },
      {
        name: "description",
        content:
          "A 23-question diagnostic that maps your creator operation against the 7-stage CHKPLT system and routes you to the right next step.",
      },
      { property: "og:title", content: "Audit Your Creative Equation — CHKPLT Cohort 01" },
      {
        property: "og:description",
        content:
          "Find your structural bottleneck in under 4 minutes. Then get a tailored Kingdom-business plan.",
      },
    ],
  }),
  component: ApplyPage,
});

type FormState = Partial<ApplicationInput> & {
  dont_know_engagement?: boolean;
};

const TOTAL_STEPS = 5;

const PRIMARY_E_OPTIONS = ["Entertain", "Educate", "Encourage", "Earn"] as const;

const initialState: FormState = {
  email: "",
  full_name: "",
  total_followers: undefined,
  engagement_rate: undefined,
  dont_know_engagement: false,
  posts_consistently_4x: undefined,
  monthly_income_value: undefined,
  income_streams_count: 1,
  largest_stream_percentage: undefined,
  has_products_for_sale: undefined,
  product_sales_last_month: 0,
  owns_email_list: undefined,
  email_subscribers_count: 0,
  has_private_community: undefined,
  community_members_count: 0,
  email_open_rate: undefined,
  has_automated_funnels: undefined,
  uses_email_marketing_software: undefined,
  batches_content: undefined,
  runs_without_owner_1_week: undefined,
  has_documented_sops: undefined,
  has_clear_niche: undefined,
  has_done_swot: undefined,
  primary_e: undefined,
  abundance_mindset: undefined,
  building_horizon: undefined,
};

function ApplyPage() {
  const submit = useServerFn(submitApplication);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const progress = useMemo(
    () => ((result ? TOTAL_STEPS + 1 : step + 1) / (TOTAL_STEPS + 1)) * 100,
    [step, result],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!state.full_name?.trim()) return "Please share your full name.";
      if (!state.email?.trim()) return "Please share an email we can reach you on.";
      if (state.total_followers == null || Number.isNaN(state.total_followers))
        return "Combined follower count is required.";
      if (!state.dont_know_engagement && (state.engagement_rate == null || Number.isNaN(state.engagement_rate)))
        return "Engagement rate is required (or tick the box).";
      if (state.posts_consistently_4x == null)
        return "Tell us whether you post 4+ times per week.";
    }
    if (step === 1) {
      if (state.monthly_income_value == null) return "Monthly income is required.";
      if (state.income_streams_count == null) return "Income streams is required.";
      if (state.largest_stream_percentage == null)
        return "Largest stream % is required.";
      if (state.has_products_for_sale == null)
        return "Tell us whether you have products for sale.";
      if (state.has_products_for_sale && state.product_sales_last_month == null)
        return "Enter how many sales you made last month.";
    }
    if (step === 2) {
      if (state.owns_email_list == null) return "Email list status is required.";
      if (state.owns_email_list && state.email_subscribers_count == null)
        return "Subscriber count is required.";
      if (state.has_private_community == null)
        return "Community status is required.";
      if (state.has_private_community && state.community_members_count == null)
        return "Community member count is required.";
      if (state.email_open_rate == null) return "Email open rate is required.";
    }
    if (step === 3) {
      const required: Array<keyof FormState> = [
        "has_automated_funnels",
        "uses_email_marketing_software",
        "batches_content",
        "runs_without_owner_1_week",
        "has_documented_sops",
      ];
      if (required.some((k) => state[k] == null))
        return "Please answer every systems question.";
    }
    if (step === 4) {
      if (state.has_clear_niche == null) return "Niche question is required.";
      if (state.has_done_swot == null) return "SWOT question is required.";
      if (!state.primary_e) return "Pick your primary E.";
      if (state.abundance_mindset == null)
        return "Abundance mindset is required.";
      if (!state.building_horizon) return "Pick your building horizon.";
    }
    return null;
  };

  const next = () => {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload: ApplicationInput = {
        email: state.email!,
        full_name: state.full_name!,
        total_followers: Number(state.total_followers),
        engagement_rate: state.dont_know_engagement
          ? null
          : Number(state.engagement_rate),
        posts_consistently_4x: state.posts_consistently_4x!,
        monthly_income_value: Number(state.monthly_income_value),
        income_streams_count: Number(state.income_streams_count),
        largest_stream_percentage: Number(state.largest_stream_percentage),
        has_products_for_sale: state.has_products_for_sale!,
        product_sales_last_month: Number(state.product_sales_last_month ?? 0),
        owns_email_list: state.owns_email_list!,
        email_subscribers_count: Number(state.email_subscribers_count ?? 0),
        has_private_community: state.has_private_community!,
        community_members_count: Number(state.community_members_count ?? 0),
        email_open_rate: Number(state.email_open_rate),
        has_automated_funnels: state.has_automated_funnels!,
        uses_email_marketing_software: state.uses_email_marketing_software!,
        batches_content: state.batches_content!,
        runs_without_owner_1_week: state.runs_without_owner_1_week!,
        has_documented_sops: state.has_documented_sops!,
        has_clear_niche: state.has_clear_niche!,
        has_done_swot: state.has_done_swot!,
        primary_e: state.primary_e!,
        abundance_mindset: state.abundance_mindset!,
        building_horizon: state.building_horizon!,
      };
      const res = await submit({ data: payload });
      setResult(res);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again in a moment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/60 nx-hero-orb">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 pt-12 pb-8 sm:pt-16">
          <span className="nx-status-live">
            <span className="nx-live-dot" aria-hidden /> Stewardship Assessment — Cohort 01
          </span>
          <h1 className="mt-5 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
            Audit your{" "}
            <em className="text-banana not-italic">creative equation.</em>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Twenty-three diagnostic questions. We map your operation against the
            7-stage CHKPLT system and route you to the right next step.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-2xl px-5 sm:px-6 py-10 sm:py-14">
          {!result && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">
                <span>Stewardship Module {step + 1} / {TOTAL_STEPS}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="mt-3 h-1.5 [&>div]:bg-banana" />
            </div>
          )}

          {!result && (
            <div className="nx-card">
              {step === 0 && (
                <Module eyebrow="Module 01" title="Follower Count & Engagement">
                  <Field label="Your full name">
                    <Input
                      value={state.full_name ?? ""}
                      onChange={(e) => set("full_name", e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </Field>
                  <Field label="Email we can reach you on">
                    <Input
                      type="email"
                      value={state.email ?? ""}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@domain.com"
                    />
                  </Field>
                  <Field label="Q1 · Total followers across all platforms">
                    <Input
                      inputMode="numeric"
                      value={state.total_followers ?? ""}
                      onChange={(e) =>
                        set(
                          "total_followers",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                      placeholder="e.g. 12500"
                    />
                  </Field>
                  <Field label="Q2 · Average engagement rate (%)">
                    <Input
                      inputMode="decimal"
                      value={state.engagement_rate ?? ""}
                      disabled={!!state.dont_know_engagement}
                      onChange={(e) =>
                        set(
                          "engagement_rate",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                      placeholder="e.g. 4"
                    />
                    <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <Checkbox
                        checked={!!state.dont_know_engagement}
                        onCheckedChange={(c) => {
                          set("dont_know_engagement", c === true);
                          if (c === true) set("engagement_rate", undefined);
                        }}
                      />
                      I don't know my engagement rate
                    </label>
                  </Field>
                  <YesNo
                    label="Q3 · Do you post consistently (4+ times/week)?"
                    value={state.posts_consistently_4x}
                    onChange={(v) => set("posts_consistently_4x", v)}
                  />
                </Module>
              )}

              {step === 1 && (
                <Module title="Module 2 · Monetization">
                  <Field label="Q4 · Current monthly income from content (ZAR)">
                    <Input
                      inputMode="numeric"
                      value={state.monthly_income_value ?? ""}
                      onChange={(e) =>
                        set(
                          "monthly_income_value",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                      placeholder="e.g. 8500"
                    />
                  </Field>
                  <Field label="Q5 · How many income streams do you have?">
                    <Select
                      value={state.income_streams_count?.toString()}
                      onValueChange={(v) => set("income_streams_count", Number(v))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n === 5 ? "5+" : n.toString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Q6 · What % comes from your largest stream?">
                    <Input
                      inputMode="numeric"
                      value={state.largest_stream_percentage ?? ""}
                      onChange={(e) =>
                        set(
                          "largest_stream_percentage",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                      placeholder="e.g. 60"
                    />
                  </Field>
                  <YesNo
                    label="Q7 · Do you have products or services for sale?"
                    value={state.has_products_for_sale}
                    onChange={(v) => set("has_products_for_sale", v)}
                  />
                  {state.has_products_for_sale && (
                    <Field label="Q8 · How many sales did you make last month?">
                      <Input
                        inputMode="numeric"
                        value={state.product_sales_last_month ?? ""}
                        onChange={(e) =>
                          set(
                            "product_sales_last_month",
                            e.target.value === "" ? undefined : Number(e.target.value),
                          )
                        }
                        placeholder="e.g. 12"
                      />
                    </Field>
                  )}
                </Module>
              )}

              {step === 2 && (
                <Module title="Module 3 · Audience Ownership">
                  <YesNo
                    label="Q9 · Do you have an email list?"
                    value={state.owns_email_list}
                    onChange={(v) => set("owns_email_list", v)}
                  />
                  {state.owns_email_list && (
                    <Field label="Q10 · How many email subscribers?">
                      <Input
                        inputMode="numeric"
                        value={state.email_subscribers_count ?? ""}
                        onChange={(e) =>
                          set(
                            "email_subscribers_count",
                            e.target.value === "" ? undefined : Number(e.target.value),
                          )
                        }
                        placeholder="e.g. 250"
                      />
                    </Field>
                  )}
                  <YesNo
                    label="Q11 · Do you have a private community?"
                    value={state.has_private_community}
                    onChange={(v) => set("has_private_community", v)}
                  />
                  {state.has_private_community && (
                    <Field label="Q12 · How many active members?">
                      <Input
                        inputMode="numeric"
                        value={state.community_members_count ?? ""}
                        onChange={(e) =>
                          set(
                            "community_members_count",
                            e.target.value === "" ? undefined : Number(e.target.value),
                          )
                        }
                        placeholder="e.g. 80"
                      />
                    </Field>
                  )}
                  <Field label="Q13 · Email open rate (%)">
                    <Input
                      inputMode="numeric"
                      value={state.email_open_rate ?? ""}
                      onChange={(e) =>
                        set(
                          "email_open_rate",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                      placeholder="e.g. 35"
                    />
                  </Field>
                </Module>
              )}

              {step === 3 && (
                <Module title="Module 4 · Business Systems">
                  <YesNo label="Q14 · Do you have automated sales funnels?" value={state.has_automated_funnels} onChange={(v) => set("has_automated_funnels", v)} />
                  <YesNo label="Q15 · Do you use email marketing software?" value={state.uses_email_marketing_software} onChange={(v) => set("uses_email_marketing_software", v)} />
                  <YesNo label="Q16 · Do you batch-create content?" value={state.batches_content} onChange={(v) => set("batches_content", v)} />
                  <YesNo label="Q17 · Can your business run without you for 1 week?" value={state.runs_without_owner_1_week} onChange={(v) => set("runs_without_owner_1_week", v)} />
                  <YesNo label="Q18 · Do you have SOPs documented?" value={state.has_documented_sops} onChange={(v) => set("has_documented_sops", v)} />
                </Module>
              )}

              {step === 4 && (
                <Module title="Module 5 · Mindset & Strategy">
                  <YesNo label="Q19 · Do you have a clear niche?" value={state.has_clear_niche} onChange={(v) => set("has_clear_niche", v)} />
                  <YesNo label="Q20 · Have you done a SWOT analysis?" value={state.has_done_swot} onChange={(v) => set("has_done_swot", v)} />
                  <Field label="Q21 · What is your primary E?">
                    <Select
                      value={state.primary_e}
                      onValueChange={(v) => set("primary_e", v as ApplicationInput["primary_e"])}
                    >
                      <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
                      <SelectContent>
                        {PRIMARY_E_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <YesNo label="Q22 · Do you believe in abundance over scarcity?" value={state.abundance_mindset} onChange={(v) => set("abundance_mindset", v)} />
                  <Field label="Q23 · Are you building for generations or just today?">
                    <Select
                      value={state.building_horizon}
                      onValueChange={(v) => set("building_horizon", v as ApplicationInput["building_horizon"])}
                    >
                      <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERATIONS">Generations</SelectItem>
                        <SelectItem value="TODAY">Today</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </Module>
              )}

              {error && (
                <div className="mt-6 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={back}
                  disabled={step === 0 || submitting}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft /> Back
                </Button>
                {step < TOTAL_STEPS - 1 ? (
                  <Button type="button" onClick={next} className="cta-glow w-full sm:w-auto">
                    Continue <ArrowRight />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="cta-glow w-full sm:w-auto"
                  >
                    {submitting ? <><Loader2 className="animate-spin" /> Submitting…</> : <>Submit assessment <ArrowRight /></>}
                  </Button>
                )}
              </div>
            </div>
          )}

          {result && (
            <ResultPanel
              result={result}
              engagementUnknown={!!state.dont_know_engagement}
            />
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Module({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-border/60 pb-3">
        <span className="nx-label text-[#EA580C] text-[10px] block mb-1">{eyebrow}</span>
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup
        value={value === undefined ? "" : value ? "yes" : "no"}
        onValueChange={(v) => onChange(v === "yes")}
        className="flex gap-3"
      >
        {[
          { v: "yes", l: "Yes" },
          { v: "no", l: "No" },
        ].map((o) => (
          <label
            key={o.v}
            className={
              "flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium cursor-pointer transition " +
              ((value === true && o.v === "yes") || (value === false && o.v === "no")
                ? "border-banana bg-banana/10 text-foreground"
                : "border-border hover:border-banana/60")
            }
          >
            <RadioGroupItem value={o.v} className="sr-only" />
            {o.l}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

const DOWNSELL: Record<RecommendationResult["vulnerabilityTag"], { title: string; body: string }> = {
  STAGE_1_DISCOVERY: {
    title: "Content Calendar Template Bundle & Foundation Worksheets",
    body: "Lock in your Mindset × Skillset × Toolset baseline with battle-tested templates before you scale anything.",
  },
  STAGE_2_AWARENESS: {
    title: "Content Calendar Template Bundle & Lead Magnet Blueprint",
    body: "Build the owned audience layer that algorithms can never take away from you.",
  },
  STAGE_3_CONSIDERATION: {
    title: "Contentpreneur: From Memes to Millions",
    body: "The standalone book that maps the exact transition from posting for likes to engineering monetized assets.",
  },
  STAGE_4_CONVERSION: {
    title: "Tax for Contentpreneurs · SARS Compliance Guide + PAIDS Tracker",
    body: "Harden your concentration risk and ringfence your revenue with our compliance toolkit and tracking dashboard.",
  },
  STAGE_5_COMMUNITY: {
    title: "",
    body: "",
  },
};

function ResultPanel({
  result,
  engagementUnknown,
}: {
  result: RecommendationResult;
  engagementUnknown: boolean;
}) {
  if (result.status === "QUALIFIED_FOR_CORE_PROGRAM") {
    return (
      <div className="nx-card">
        <div className="flex items-center gap-3 text-banana">
          <CheckCircle2 className="size-6" />
          <div className="nx-label !text-banana">Qualified · Cohort 01</div>
        </div>
        <h2 className="mt-4 font-display text-3xl sm:text-4xl tracking-tight">
          Your metrics validate entry into the{" "}
          <em className="text-banana not-italic">20-Week Core Curriculum.</em>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          You've cleared every system check. The next step is your{" "}
          <strong>{result.recommendedPackage}</strong> path — focused on{" "}
          {result.focusPillars}.
        </p>
        {engagementUnknown && (
          <p className="mt-4 text-sm text-foreground/80 border-l-2 border-banana pl-3">
            <strong>Optimization Notice:</strong> you indicated you don't know
            your engagement rate. We'll address tracking this baseline
            immediately inside your recommended package.
          </p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="cta-glow w-full sm:w-auto">
            <Link to="/signup">
              Reserve your Cohort 01 seat <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link to="/about">Read our standards</Link>
          </Button>
        </div>
      </div>
    );
  }

  const downsell = DOWNSELL[result.vulnerabilityTag];

  return (
    <div className="space-y-6">
      <div className="nx-card">
        <div className="nx-label" style={{ color: "var(--nx-orange-deep)" }}>
          Diagnostic · {result.vulnerabilityTag.replace(/_/g, " ")}
        </div>
        <h2 className="mt-4 font-display text-3xl sm:text-4xl tracking-tight">
          Your primary bottleneck:{" "}
          <em className="text-banana not-italic">{result.recommendedPackage}.</em>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {result.focusPillars}.
        </p>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Recommended starting point: {result.targetModules}.
        </p>
        {engagementUnknown && (
          <p className="mt-4 text-sm text-foreground/80 border-l-2 border-banana pl-3">
            <strong>Optimization Notice:</strong> you indicated you don't know
            your engagement rate. We'll address tracking this baseline
            immediately inside your recommended package resources.
          </p>
        )}
      </div>

      {downsell.title && (
        <div className="nx-card">
          <div className="nx-label">Your next move</div>
          <h3 className="mt-3 font-display text-2xl sm:text-3xl tracking-tight">
            {downsell.title}
          </h3>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            {downsell.body}
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="cta-glow w-full sm:w-auto">
              <Link to="/products">
                Browse the toolkit <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
