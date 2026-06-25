import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Loader2, Sparkles, Check } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurnstileGate } from "@/components/TurnstileGate";
import { buildOffer, type GeneratedOffer } from "@/lib/offer-builder.functions";
import { trackLead } from "@/lib/track";

export const Route = createFileRoute("/offer-builder")({
  head: () => ({
    meta: [
      { title: "Free Offer Builder — turn your skill into a sellable offer | CHKPLT" },
      {
        name: "description",
        content:
          "Answer 4 quick questions and get a complete, sellable offer — name, promise, deliverables, price, and your first move this week. Free.",
      },
      { property: "og:title", content: "Free Offer Builder — CHKPLT" },
    ],
  }),
  component: OfferBuilderPage,
});

const TOTAL_STEPS = 4;
const GOLD_GLOW = {
  boxShadow: "0 0 24px rgba(245,158,11,0.55), 0 0 56px rgba(245,158,11,0.25)",
} as const;

type Icp = "called_expert" | "content_creator";
type Exp = "starting" | "traction" | "established";

interface Fields {
  icp: "" | Icp;
  expertise: string;
  experienceLevel: "" | Exp;
  audience: string;
  transformation: string;
  proof: string;
  name: string;
  email: string;
}

const INITIAL: Fields = {
  icp: "",
  expertise: "",
  experienceLevel: "",
  audience: "",
  transformation: "",
  proof: "",
  name: "",
  email: "",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="font-display text-[#0F172A] text-sm font-bold leading-snug block">{label}</label>
      {hint && <p className="text-[#555] text-xs -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

const TA_CLASS =
  "w-full min-h-[88px] border border-[#d0c8bc] bg-white rounded-md px-3 py-2 text-[15px] text-[#0F172A] focus:border-[#F59E0B] focus:outline-none focus:ring-0 resize-y";

function OfferBuilderPage() {
  const build = useServerFn(buildOffer);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [tsToken, setTsToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<GeneratedOffer | null>(null);

  const set = <K extends keyof Fields>(key: K, val: Fields[K]) =>
    setFields((f) => ({ ...f, [key]: val }));

  function canProceed(): boolean {
    if (step === 0) return fields.icp !== "";
    if (step === 1) return fields.expertise.trim().length >= 2 && fields.experienceLevel !== "";
    if (step === 2) return fields.audience.trim().length >= 2 && fields.transformation.trim().length >= 2;
    if (step === 3)
      return (
        fields.name.trim().length >= 1 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) &&
        tsToken !== null
      );
    return false;
  }

  async function handleSubmit() {
    if (!canProceed() || fields.icp === "" || fields.experienceLevel === "") return;
    setLoading(true);
    setError(null);
    try {
      const result = await build({
        data: {
          email: fields.email.trim().toLowerCase(),
          name: fields.name.trim(),
          icp: fields.icp,
          expertise: fields.expertise.trim(),
          audience: fields.audience.trim(),
          transformation: fields.transformation.trim(),
          proof: fields.proof.trim(),
          experienceLevel: fields.experienceLevel,
          turnstileToken: tsToken!,
        },
      });
      trackLead();
      setOffer(result);
    } catch (e) {
      setError((e as Error).message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 pt-24 pb-20">
        {!offer ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
                <Sparkles className="size-3.5" /> Free Offer Builder
              </div>
              <h1 className="font-display text-3xl sm:text-4xl uppercase leading-[1.05]">
                Turn your skill into a <strong>sellable offer</strong>
              </h1>
              <p className="text-[#555] mt-3 max-w-md mx-auto">
                Four questions. You walk away with a real offer — name, promise, price, and your first move this week. No fluff.
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#F59E0B]" : "bg-[#e8e0d4]"}`}
                />
              ))}
            </div>

            <div className="border border-[#e8e0d4] rounded-2xl bg-white p-6 sm:p-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.10)]">
              <div className="space-y-6">
                {/* STEP 0 — who do you serve */}
                {step === 0 && (
                  <Field label="Who do you serve?" hint="This sets the whole offer — pricing, tone, positioning.">
                    <div className="grid gap-3">
                      {([
                        { val: "called_expert" as const, t: "A professional / expert", d: "You have real expertise — a skill, a field, a track record — and you want to monetise your knowledge. (Higher-ticket.)" },
                        { val: "content_creator" as const, t: "A creator / aspiring creator", d: "You're building an audience — posting on Instagram, TikTok, Facebook — and want your first real income. (Accessible-ticket.)" },
                      ]).map((o) => (
                        <button
                          key={o.val}
                          type="button"
                          onClick={() => set("icp", o.val)}
                          className={`text-left p-4 border rounded-xl transition-all ${
                            fields.icp === o.val
                              ? "border-[#F59E0B] bg-[#FBF7EC]"
                              : "border-[#d0c8bc] bg-white hover:border-[#F59E0B]"
                          }`}
                          style={fields.icp === o.val ? GOLD_GLOW : undefined}
                        >
                          <div className="font-display font-bold text-[#0F172A]">{o.t}</div>
                          <div className="text-[#555] text-sm mt-1">{o.d}</div>
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                {/* STEP 1 — expertise + level */}
                {step === 1 && (
                  <>
                    <Field
                      label="What's the skill, knowledge, or topic you want to build an offer around?"
                      hint="One or two sentences. Be specific."
                    >
                      <textarea
                        className={TA_CLASS}
                        value={fields.expertise}
                        onChange={(e) => set("expertise", e.target.value)}
                        placeholder="e.g. Helping nurses pass their HPCSA board exam · Editing cinematic phone videos · Tax for freelancers"
                      />
                    </Field>
                    <Field label="Where are you right now?">
                      <div className="grid gap-2">
                        {([
                          { val: "starting" as const, t: "Just starting — no offer yet" },
                          { val: "traction" as const, t: "Some traction — early sales or clients" },
                          { val: "established" as const, t: "Established — selling already, want to package it better" },
                        ]).map((o) => (
                          <button
                            key={o.val}
                            type="button"
                            onClick={() => set("experienceLevel", o.val)}
                            className={`text-left py-3 px-4 border rounded-lg font-medium text-sm transition-all ${
                              fields.experienceLevel === o.val
                                ? "bg-[#F59E0B] border-[#F59E0B] text-[#111]"
                                : "border-[#d0c8bc] bg-white text-[#555] hover:border-[#F59E0B]"
                            }`}
                          >
                            {o.t}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </>
                )}

                {/* STEP 2 — audience + transformation + proof */}
                {step === 2 && (
                  <>
                    <Field label="Who exactly do you want to serve?" hint="The more specific, the stronger the offer.">
                      <textarea
                        className={TA_CLASS}
                        value={fields.audience}
                        onChange={(e) => set("audience", e.target.value)}
                        placeholder="e.g. Final-year nursing students in South Africa who keep failing the board exam"
                      />
                    </Field>
                    <Field label="What result or transformation do you help them get?">
                      <textarea
                        className={TA_CLASS}
                        value={fields.transformation}
                        onChange={(e) => set("transformation", e.target.value)}
                        placeholder="e.g. They pass the board exam first try and start earning as a registered nurse"
                      />
                    </Field>
                    <Field label="What proof or credibility do you have?" hint="Optional. Results, experience, your story. Don't invent anything.">
                      <textarea
                        className={TA_CLASS}
                        value={fields.proof}
                        onChange={(e) => set("proof", e.target.value)}
                        placeholder="e.g. I've tutored 40 students, 9 in 10 passed · 7 years in the field · I failed twice then cracked it"
                      />
                    </Field>
                  </>
                )}

                {/* STEP 3 — gate */}
                {step === 3 && (
                  <>
                    <div className="text-center mb-2">
                      <h2 className="font-display text-xl uppercase">Where do we send it?</h2>
                      <p className="text-[#555] text-sm mt-1">
                        Your offer is built. Drop your name and email — you'll see it on the next screen and get a copy.
                      </p>
                    </div>
                    <Field label="Your name">
                      <Input
                        value={fields.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="First name"
                        className="h-12 border-[#d0c8bc] bg-white focus:border-[#F59E0B] focus:ring-0"
                      />
                    </Field>
                    <Field label="Your email">
                      <Input
                        type="email"
                        value={fields.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="you@email.com"
                        className="h-12 border-[#d0c8bc] bg-white focus:border-[#F59E0B] focus:ring-0"
                      />
                    </Field>
                    <TurnstileGate onToken={setTsToken} className="pt-1" />
                  </>
                )}
              </div>

              {error && (
                <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}

              {/* Nav */}
              <div className="mt-7 flex items-center justify-between gap-4">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase text-[#5a5a5a] hover:text-[#0F172A] transition-colors"
                  >
                    <ArrowLeft className="size-3.5" /> Back
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
                    Continue <ArrowRight className="size-4 ml-1" />
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
                      <><Loader2 className="size-4 animate-spin mr-1" /> Building your offer…</>
                    ) : (
                      <>Build my offer <ArrowRight className="size-4 ml-1" /></>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <p className="mt-6 text-center text-[#555] text-xs leading-relaxed">
              Free. No card. We build it with AI on NoChill's frameworks — then it's yours to use.
            </p>
          </>
        ) : (
          <OfferResult offer={offer} icp={fields.icp as Icp} name={fields.name.trim()} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function OfferResult({ offer, icp, name }: { offer: GeneratedOffer; icp: Icp; name: string }) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
          <Check className="size-3.5" /> Your offer is ready{name ? `, ${name}` : ""}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase leading-[1.05]">{offer.offerName}</h1>
        <p className="text-[#2A2A2A] text-lg mt-3 max-w-xl mx-auto">{offer.headline}</p>
      </div>

      <div className="border border-[#e8e0d4] rounded-2xl bg-white p-6 sm:p-8 space-y-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.10)]">
        <Block label="Who it's for">{offer.whoItsFor}</Block>

        <div>
          <SectionLabel>What it kills</SectionLabel>
          <ul className="space-y-2">
            {offer.problemsSolved.map((p, i) => (
              <li key={i} className="flex gap-2 text-[#2A2A2A]">
                <span className="text-banana shrink-0">✗</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-[#e8e0d4] rounded-xl p-4 bg-[#FBFAF8]">
            <SectionLabel>Before</SectionLabel>
            <p className="text-[#2A2A2A]">{offer.transformation.before}</p>
          </div>
          <div className="border border-[#F59E0B]/40 rounded-xl p-4 bg-[#FBF7EC]">
            <SectionLabel>After</SectionLabel>
            <p className="text-[#2A2A2A]">{offer.transformation.after}</p>
          </div>
        </div>

        <div>
          <SectionLabel>What's inside</SectionLabel>
          <ul className="space-y-2">
            {offer.deliverables.map((d, i) => (
              <li key={i} className="flex gap-2 text-[#2A2A2A]">
                <Check className="size-4 text-banana shrink-0 mt-0.5" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-y border-[#e8e0d4] py-5">
          <SectionLabel>Suggested price</SectionLabel>
          <div className="font-display text-3xl text-banana">{offer.pricing.suggestion}</div>
          <p className="text-[#555] text-sm mt-1">{offer.pricing.rationale}</p>
        </div>

        <Block label="Your angle">{offer.positioning}</Block>
        <Block label="Your first CTA">{offer.firstCTA}</Block>

        <div className="border border-[#F59E0B]/40 rounded-xl p-5 bg-[#FBF7EC]">
          <SectionLabel>Do this week</SectionLabel>
          <p className="text-[#0F172A] font-medium">{offer.thisWeekAction}</p>
        </div>

        <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#777]">
          Built on the {offer.frameworkUsed} framework
        </p>
      </div>

      {/* Bridge to the paid path */}
      <div className="mt-8 text-center border border-[#e8e0d4] rounded-2xl p-6 bg-white">
        <h3 className="font-display text-xl uppercase">Now build it for real</h3>
        <p className="text-[#555] text-sm mt-2 max-w-md mx-auto">
          {icp === "called_expert"
            ? "You've got the offer. The Foundation Kit hands you the system to package, price, and sell it — then apply when you're ready for the Accelerator."
            : "You've got the offer. The Foundation Kit gives you the templates and steps to actually launch it and make your first sales."}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/products/$slug"
            params={{ slug: "called-expert-foundation-kit" }}
            className="cta-glow inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-display font-black uppercase tracking-wide"
          >
            Get the Foundation Kit <ArrowRight className="size-4" />
          </Link>
          {icp === "called_expert" && (
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-mono uppercase tracking-[0.15em] border border-[#F59E0B] text-[#0F172A] hover:bg-[#F59E0B] hover:text-[#111] transition-colors"
            >
              Apply for the Accelerator
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#777] mb-2">{children}</div>
  );
}
function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="text-[#2A2A2A]">{children}</p>
    </div>
  );
}
