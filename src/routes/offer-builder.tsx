import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef} from "react";
import { ArrowRight, ArrowLeft, Loader2, Check, Lock } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { TurnstileGate, type TurnstileGateHandle } from "@/components/TurnstileGate";
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
  Chip,
  GoldButton,
} from "@/components/tools/premium";
import { buildOffer, type GeneratedOffer } from "@/lib/offer-builder.functions";
import { trackLead } from "@/lib/track";
import { getUtm } from "@/lib/utm";
import { useToolView } from "@/lib/tool-analytics";

export const Route = createFileRoute("/offer-builder")({
  head: () => ({
    meta: [
      { title: "Offer Builder — turn your skill into a sellable offer | CHKPLT" },
      {
        name: "description",
        content:
          "Answer 4 quick questions and get a complete, sellable offer — name, promise, deliverables, price, and your first move this week. 2 free, then Foundation Kit.",
      },
      { property: "og:title", content: "Offer Builder — CHKPLT" },
    ],
  }),
  component: OfferBuilderPage,
});

const TOTAL_STEPS = 4;

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

const TA_CLASS =
  "w-full min-h-[96px] rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[16px] text-[#1A1523] outline-none transition placeholder:text-neutral-400 focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15 resize-y";

function OfferBuilderPage() {
  useToolView("offer-builder");
  const build = useServerFn(buildOffer);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [tsToken, setTsToken] = useState<string | null>(null);
  // A Turnstile token is single-use — reset after EVERY attempt so a retry
  // (or a second run of this tool) gets a fresh one instead of re-sending a
  // spent token, which Cloudflare rejects as `timeout-or-duplicate`.
  const tsRef = useRef<TurnstileGateHandle>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<GeneratedOffer | null>(null);
  const [locked, setLocked] = useState(false);

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
          ...getUtm(),
        },
      });
      trackLead();
      if (result.locked) setLocked(true);
      else setOffer(result.offer);
    } catch (e) {
      setError((e as Error).message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      // Spent token — swap it for a fresh one so a retry after an error works.
      tsRef.current?.reset();
    }
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F5F3FF]">
      <SiteHeader />
      <ToolCanvas>
        <div className="px-5 pt-3 sm:px-6">
          <BackNav to="/tools" label="All tools" />
        </div>

        {!offer && !locked && (
          <header className="mx-auto max-w-2xl px-5 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-12">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Eyebrow>Creator · Free Tool</Eyebrow>
              <Pill className="whitespace-nowrap">Offer Builder</Pill>
            </div>
            <h1 className="mt-7 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#1A1523] sm:text-[52px]">
              Turn your skill into a <span className="text-[#8B5CF6]">sellable offer.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-[1.65] text-neutral-600 sm:text-[17px]">
              Four questions. You walk away with a real offer — name, promise, price, and your first
              move this week. No fluff.
            </p>
            <div className="mt-7 h-[3px] w-16 rounded-full bg-[#8B5CF6]" />
          </header>
        )}

        <main className="mx-auto max-w-2xl px-5 pb-20 sm:px-6">
          {locked ? (
            <OfferLimitReached />
          ) : !offer ? (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#8B5CF6]" : "bg-[#EDE9FE]"}`}
                  />
                ))}
              </div>

              <Panel>
                {/* STEP 0 — who do you serve */}
                {step === 0 && (
                  <>
                    <PanelHeader
                      title="Who do you serve?"
                      step="01"
                      hint="This sets the whole offer — pricing, tone, positioning."
                    />
                    <div className="grid gap-2.5 p-5 sm:p-6">
                      {([
                        { val: "called_expert" as const, t: "A professional / specialist", d: "You have real expertise — a skill, a field, a track record — and you want to monetise your knowledge. (Higher-ticket.)" },
                        { val: "content_creator" as const, t: "A Knowledge Creator (coach / podcaster / creator)", d: "You already have the knowledge and often an audience — you just don't own the income yet. (Accessible-to-mid ticket.)" },
                      ]).map((o) => (
                        <Chip
                          key={o.val}
                          active={fields.icp === o.val}
                          onClick={() => set("icp", o.val)}
                          sub={o.d}
                        >
                          {o.t}
                        </Chip>
                      ))}
                    </div>
                  </>
                )}

                {/* STEP 1 — expertise + level */}
                {step === 1 && (
                  <>
                    <PanelHeader
                      title="What are you building around?"
                      step="02"
                      hint="Be specific — the sharper the input, the sharper the offer."
                    />
                    <div className="space-y-5 p-5 sm:p-6">
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
                      <div>
                        <span className="mb-1.5 block text-[13px] font-bold text-[#1A1523]">
                          Where are you right now?
                        </span>
                        <div className="grid gap-2.5">
                          {([
                            { val: "starting" as const, t: "Just starting — no offer yet" },
                            { val: "traction" as const, t: "Some traction — early sales or clients" },
                            { val: "established" as const, t: "Established — selling already, want to package it better" },
                          ]).map((o) => (
                            <Chip
                              key={o.val}
                              active={fields.experienceLevel === o.val}
                              onClick={() => set("experienceLevel", o.val)}
                            >
                              {o.t}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2 — audience + transformation + proof */}
                {step === 2 && (
                  <>
                    <PanelHeader
                      title="Who it's for & the result"
                      step="03"
                      hint="The more specific, the stronger the offer."
                    />
                    <div className="space-y-5 p-5 sm:p-6">
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
                    </div>
                  </>
                )}

                {/* STEP 3 — gate */}
                {step === 3 && (
                  <>
                    <PanelHeader
                      title="Where do we send it?"
                      step="04"
                      hint="Your offer is built. Drop your name and email — you'll see it on the next screen and get a copy."
                    />
                    <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                      <Field label="Your name">
                        <Input
                          value={fields.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="First name"
                        />
                      </Field>
                      <Field label="Your email">
                        <Input
                          type="email"
                          value={fields.email}
                          onChange={(e) => set("email", e.target.value)}
                          placeholder="you@email.com"
                        />
                      </Field>
                    </div>
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                      <TurnstileGate ref={tsRef} onToken={setTsToken} />
                    </div>
                  </>
                )}

                {error && (
                  <div className="mx-5 mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700 sm:mx-6 sm:mb-6">
                    {error}
                  </div>
                )}

                {/* Nav */}
                <div className="flex items-center justify-between gap-4 border-t border-neutral-200/80 px-5 py-4 sm:px-6">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-neutral-500 transition hover:text-[#1A1523]"
                    >
                      <ArrowLeft className="size-3.5" /> Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < TOTAL_STEPS - 1 ? (
                    <GoldButton
                      type="button"
                      disabled={!canProceed()}
                      onClick={() => setStep((s) => s + 1)}
                      className="w-auto px-8"
                    >
                      Continue <ArrowRight className="size-4" />
                    </GoldButton>
                  ) : (
                    <GoldButton
                      type="button"
                      disabled={!canProceed() || loading}
                      onClick={handleSubmit}
                      className="w-auto px-8"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Building your offer…
                        </>
                      ) : (
                        <>
                          Build my offer <ArrowRight className="size-4" />
                        </>
                      )}
                    </GoldButton>
                  )}
                </div>
              </Panel>

              <p className="text-center text-[12px] leading-relaxed text-neutral-500">
                Free. No card. We build it with AI on NoChill's frameworks — then it's yours to use.
              </p>
            </div>
          ) : (
            <OfferResult offer={offer} icp={fields.icp as Icp} name={fields.name.trim()} />
          )}
        </main>
      </ToolCanvas>
      <SiteFooter />
    </div>
  );
}

function OfferLimitReached() {
  return (
    <Panel raised className="overflow-hidden">
      <div className="relative overflow-hidden bg-[#1A1523] px-6 py-9 text-center sm:px-10">
        <DotGrid dark />
        <GoldGlow className="-right-24 -top-28" size={420} opacity={0.6} />
        <div className="relative">
          <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[#8B5CF6] text-white">
            <Lock className="size-5" />
          </div>
          <h3 className="mt-5 font-display text-[24px] font-extrabold tracking-tight text-white sm:text-[28px]">
            You've used your 2 free offers
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
            Opus-tier AI generation costs real money to run — 2 free was the trial. Unlimited offer
            building comes with the Foundation Kit.
          </p>
          <Link
            to="/products/$slug"
            params={{ slug: "called-expert-foundation-kit" }}
            className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-[15px] font-bold text-white transition hover:brightness-110"
          >
            Get the Foundation Kit <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 text-[12px] text-white/45">
            Already own it? Use the same email you purchased with, then try again.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function OfferResult({ offer, icp, name }: { offer: GeneratedOffer; icp: Icp; name: string }) {
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Eyebrow className="!text-[#7C3AED]">
            Your offer is ready{name ? `, ${name}` : ""}
          </Eyebrow>
        </div>
        <h1 className="mt-4 font-display text-[30px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#1A1523] sm:text-[42px]">
          {offer.offerName}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[17px] leading-relaxed text-neutral-600">
          {offer.headline}
        </p>
        <div className="mx-auto mt-6 h-[3px] w-16 rounded-full bg-[#8B5CF6]" />
      </div>

      <Panel raised className="space-y-7 p-6 sm:p-8">
        <Block label="Who it's for">{offer.whoItsFor}</Block>

        <div>
          <SectionLabel>What it kills</SectionLabel>
          <ul className="space-y-2">
            {offer.problemsSolved.map((p, i) => (
              <li key={i} className="flex gap-2 text-[15px] text-neutral-700">
                <span className="shrink-0 text-[#8B5CF6]">✗</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-[#FAF9FF] p-4">
            <SectionLabel>Before</SectionLabel>
            <p className="text-[15px] text-neutral-700">{offer.transformation.before}</p>
          </div>
          <div className="rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 p-4">
            <SectionLabel>After</SectionLabel>
            <p className="text-[15px] text-neutral-700">{offer.transformation.after}</p>
          </div>
        </div>

        <div>
          <SectionLabel>What's inside</SectionLabel>
          <ul className="space-y-2">
            {offer.deliverables.map((d, i) => (
              <li key={i} className="flex gap-2 text-[15px] text-neutral-700">
                <Check className="mt-0.5 size-4 shrink-0 text-[#8B5CF6]" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-y border-neutral-200 py-5">
          <SectionLabel>Suggested price</SectionLabel>
          <div className="font-display text-[30px] font-extrabold text-[#8B5CF6]">
            {offer.pricing.suggestion}
          </div>
          <p className="mt-1 text-[14px] text-neutral-500">{offer.pricing.rationale}</p>
        </div>

        <Block label="Your angle">{offer.positioning}</Block>
        <Block label="Your first CTA">{offer.firstCTA}</Block>

        <div className="rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 p-5">
          <SectionLabel>Do this week</SectionLabel>
          <p className="text-[15px] font-medium text-[#1A1523]">{offer.thisWeekAction}</p>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
          Built on the {offer.frameworkUsed} framework
        </p>
      </Panel>

      {/* Bridge to the paid path */}
      <Panel raised className="mt-6 overflow-hidden">
        <div className="relative overflow-hidden bg-[#1A1523] px-6 py-9 text-center sm:px-10">
          <DotGrid dark />
          <GoldGlow className="-bottom-32 -right-20" size={440} opacity={0.6} />
          <div className="relative">
            <Eyebrow className="!text-[#8B5CF6]">The offer is the door</Eyebrow>
            <h3 className="mt-4 font-display text-[24px] font-extrabold tracking-tight text-white sm:text-[30px]">
              Now build it for real.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
              {icp === "called_expert"
                ? "You've got the offer. The Foundation Kit hands you the system to package, price, and sell it — then apply when you're ready for the Accelerator."
                : "You've got the offer. The Foundation Kit gives you the templates and steps to actually launch it and make your first sales."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/products/$slug"
                params={{ slug: "called-expert-foundation-kit" }}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-[15px] font-bold text-white transition hover:brightness-110"
              >
                Get the Foundation Kit <ArrowRight className="size-4" />
              </Link>
              {icp === "called_expert" && (
                <Link
                  to="/apply"
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-white/25 px-7 text-[14px] font-bold text-white transition hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
                >
                  Apply for the Accelerator
                </Link>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7C3AED]">
      {children}
    </div>
  );
}
function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="text-[15px] text-neutral-700">{children}</p>
    </div>
  );
}
