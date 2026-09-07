import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Check, Lock, Download } from "lucide-react";

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
  Chip,
  Input,
  GoldButton,
} from "@/components/tools/premium";
import { subscribeAlignedToolkit } from "@/lib/aligned.functions";
import { getUtm } from "@/lib/utm";
import { useToolView } from "@/lib/tool-analytics";

export const Route = createFileRoute("/align-accelerate-excel")({
  head: () => ({
    meta: [
      { title: "Align · Accelerate · Excel — Free Self-Assessment | CHKPLT" },
      {
        name: "description",
        content:
          "Where are you — Align, Accelerate, or Excel? Take the free 12-question self-assessment built on Genesis 1:28, get your phase score, and the 7-Day Alignment Sprint free. From the Aligned 2026 talk by Ndivhuwo Muhanelwa (Mr NoChill).",
      },
      { property: "og:title", content: "Align · Accelerate · Excel — Free Self-Assessment" },
      {
        property: "og:description",
        content:
          "Know your exact phase in 90 seconds. Get the 7-Day Alignment Sprint free.",
      },
    ],
  }),
  component: AlignedToolPage,
});

// ── Framework data ────────────────────────────────────────────────────────────
type Phase = "align" | "accelerate" | "excel";
type Q = { id: string; phase: Phase; text: string };

const PHASE_META: Record<
  Phase,
  { label: string; be: string; verse: string; color: string }
> = {
  align: {
    label: "ALIGN",
    be: "Identity · BE · Time",
    verse: 'Genesis 1:28 "Be fruitful" · Joshua 1:8 "Meditate day & night"',
    color: "#7C3AED",
  },
  accelerate: {
    label: "ACCELERATE",
    be: "Momentum · DO · Space",
    verse: 'Genesis 1:28 "Multiply" · Joshua 1:8 "Make your way prosperous"',
    color: "#7C3AED",
  },
  excel: {
    label: "EXCEL",
    be: "Mastery · HAVE · Matter",
    verse: 'Genesis 1:28 "Have dominion" · Joshua 1:8 "Have good success"',
    color: "#7C3AED",
  },
};

const QUESTIONS: Q[] = [
  { id: "a1", phase: "align", text: "I know exactly what I want to be known for — my niche, my expertise, my message." },
  { id: "a2", phase: "align", text: "I have a daily habit (prayer, reading, study, creating) that I do BEFORE I check my phone." },
  { id: "a3", phase: "align", text: "I run what I know like a business I own — not just posting content or trading hours for someone else's outcome." },
  { id: "a4", phase: "align", text: "My faith actively shapes my decisions — not as a slogan, but as my operating system." },
  { id: "c1", phase: "accelerate", text: "I create and publish content consistently — at least 3 times per week." },
  { id: "c2", phase: "accelerate", text: "I have more than one income stream from my expertise (products, services, speaking…)." },
  { id: "c3", phase: "accelerate", text: "I have an email or WhatsApp list I can reach WITHOUT depending on an algorithm." },
  { id: "c4", phase: "accelerate", text: "I treat every small opportunity as if it were R100,000 — same excellence, same delivery." },
  { id: "e1", phase: "excel", text: "My work is so excellent that my industry cannot ignore me — people come to ME." },
  { id: "e2", phase: "excel", text: "I am fully tax-compliant — registered, filing, managing my finances properly." },
  { id: "e3", phase: "excel", text: "I am building an ASSET my children or community could inherit — not just income." },
  { id: "e4", phase: "excel", text: "I am helping others rise — investing in my community, not only building for myself." },
];

const SCALE = [
  { v: 1, label: "Not at all" },
  { v: 2, label: "Rarely" },
  { v: 3, label: "Sometimes" },
  { v: 4, label: "Mostly" },
  { v: 5, label: "Fully" },
];

// The free gift — shown in full on the results page. No gate, no selling.
const SPRINT: { day: number; title: string; task: string }[] = [
  { day: 1, title: "Define your one thing", task: "Write one sentence: what do you want to be KNOWN for? Not a title — your expertise. What do you solve better than anyone you know?" },
  { day: 2, title: "Set your 05:00 habit", task: "Before you check your phone tomorrow, give 30 minutes to ONE thing: prayer, reading, journaling, or creating. The half-hour before the world wakes up is where alignment happens." },
  { day: 3, title: "Audit your income streams", task: "Open your bank statement. Count how many DIFFERENT sources paid you last month. If it's under 3, you have a single-point-of-failure." },
  { day: 4, title: "Create your first digital asset", task: "Take ONE thing from your head and put it on paper — a checklist, a template, a one-page guide someone could use. This is the seed of your first product. Done beats perfect." },
  { day: 5, title: "Tell one person your vision", task: "Not social media. ONE person you trust. Speak what you're building out loud. Habakkuk 2:2 — write the vision and make it plain. Today you SPEAK it plain." },
  { day: 6, title: "Calculate your rate", task: "What is one hour of your BEST advice worth to a client? Not what you're paid per hour — what your expertise is worth. Write the number. If you don't know it, you're undercharging." },
  { day: 7, title: "Declare your alignment", task: 'Read Joshua 1:8 out loud. Then say: "I am aligned. My identity is settled. My habits are set. My vision is spoken. I am ready to accelerate." Write today\'s date — day one of your aligned life.' },
];

const VERDICTS: Record<Phase, { kicker: string; title: string; body: string }> = {
  align: {
    kicker: "Start here — ALIGN",
    title: "You're trying to DO before you've settled who you BE.",
    body: "This is where I was on the bathroom floor in 2013 — no plan that made sense. Alignment happens in the dark, before anybody claps. Joshua 1:8 says meditate first, THEN your way prospers. Lock your identity and your daily habits this week, and everything downstream gets easier. The 7-Day Sprint below is built exactly for you.",
  },
  accelerate: {
    kicker: "Start here — ACCELERATE",
    title: "Your roots are set. Now break the friction.",
    body: "You know who you are — but you're still adding when God called you to multiply. For years my standing rate was R15,000 — my number, never one I had worked out. In April 2020 I costed a job properly and it came to R45,000. Same account, same week. And one month of affiliate commission came to R23,524 — 41.6% of everything that channel ever paid me, which is a spike, not a business. Acceleration isn't for the talented, it's for the positioned. Publish more, build the owned list, and cost every job before you quote it. The Sprint sharpens your execution.",
  },
  excel: {
    kicker: "Guard the dominion — EXCEL",
    title: "You're operating. Now build to last — and stay accountable.",
    body: "You're moving like Daniel's excellent spirit. The danger now isn't speed, it's governance — I learned that with a SARS bill of just over R200,000 because I managed my talent and not my house. Excel means ownership: tax-compliant, an asset your children inherit, and a hand back to the ones behind you. Umuntu ngumuntu ngabantu.",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
function AlignedToolPage() {
  useToolView("align-accelerate-excel");
  const [step, setStep] = useState<"intro" | "q" | "result">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const choose = (qid: string, v: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
    if (qIndex + 1 >= QUESTIONS.length) setStep("result");
    else setQIndex(qIndex + 1);
  };

  const phaseScore = (p: Phase) =>
    QUESTIONS.filter((q) => q.phase === p).reduce((s, q) => s + (answers[q.id] ?? 0), 0);

  const scores: Record<Phase, number> = {
    align: phaseScore("align"),
    accelerate: phaseScore("accelerate"),
    excel: phaseScore("excel"),
  };
  const total = scores.align + scores.accelerate + scores.excel;
  const pct = Math.round((total / 60) * 100);

  // Lowest phase = where you start. Tie-break respects the BE→DO→HAVE order.
  const order: Phase[] = ["align", "accelerate", "excel"];
  const lowest = order.reduce((lo, p) => (scores[p] < scores[lo] ? p : lo), "align" as Phase);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F5F3FF]">
      <SiteHeader />
      <ToolCanvas>
        <div className="px-5 pt-3 sm:px-6">
          <BackNav to="/tools" label="All tools" />
        </div>

        {/* ── HEADER (intro only, mirrors the reference tool) ── */}
        {step === "intro" && (
          <header className="mx-auto max-w-2xl px-5 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-12">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Eyebrow>Aligned 2026 · Free Tool</Eyebrow>
              <Pill className="whitespace-nowrap">Genesis 1:28</Pill>
            </div>
            <h1 className="mt-7 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#1A1523] sm:text-[52px]">
              You're not stuck. You're <span className="text-[#8B5CF6]">out of position.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-[1.65] text-neutral-600 sm:text-[17px]">
              God gave us the whole map in one verse — Genesis 1:28: be fruitful, multiply, have
              dominion. First you ALIGN, then you ACCELERATE, then you EXCEL. This 12-question check
              shows you exactly which phase to work on right now.
            </p>
            <div className="mt-7 h-[3px] w-16 rounded-full bg-[#8B5CF6]" />
          </header>
        )}

        <main className="mx-auto max-w-2xl px-5 pb-20 sm:px-6">
          {/* ── INTRO ── */}
          {step === "intro" && (
            <div className="space-y-4">
              <Panel>
                <PanelHeader
                  title="The rhythm of creation itself"
                  step="01"
                  hint="Time → Space → Matter. The unseen always comes first."
                />
                <div className="p-5 sm:p-6">
                  <p className="text-[15px] leading-[1.7] text-neutral-700">
                    In the beginning (Time) God created the heavens (Space) and the earth (Matter).
                    The unseen always comes first — so does your alignment. Answer honestly and I'll
                    show you the one phase to build on next: Align, Accelerate, or Excel.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {(["align", "accelerate", "excel"] as Phase[]).map((p) => (
                      <div
                        key={p}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-4 text-center"
                      >
                        <div className="font-display text-[15px] font-extrabold text-[#7C3AED]">
                          {PHASE_META[p].label}
                        </div>
                        <div className="mt-1 text-[11px] leading-snug text-neutral-500">
                          {PHASE_META[p].be}
                        </div>
                      </div>
                    ))}
                  </div>

                  <GoldButton
                    type="button"
                    onClick={() => {
                      setStep("q");
                      setQIndex(0);
                    }}
                    className="mt-6"
                  >
                    Find my phase <ArrowRight className="size-4" />
                  </GoldButton>
                  <p className="mt-3 text-center text-[12px] text-neutral-500">
                    12 questions · 90 seconds · free
                  </p>
                </div>
              </Panel>

              <p className="px-4 text-center text-[12px] leading-relaxed text-neutral-500">
                From the talk by Ndivhuwo Muhanelwa (Mr NoChill) · Ephesians 5:16 — "Redeeming the
                time."
              </p>
            </div>
          )}

          {/* ── QUESTIONS ── */}
          {step === "q" &&
            (() => {
              const q = QUESTIONS[qIndex];
              const meta = PHASE_META[q.phase];
              return (
                <Panel>
                  <div className="flex items-center justify-between gap-4 border-b border-neutral-200/80 px-5 py-4 sm:px-6">
                    <button
                      type="button"
                      onClick={() => {
                        if (qIndex === 0) setStep("intro");
                        else setQIndex(qIndex - 1);
                      }}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-neutral-500 transition hover:text-[#1A1523]"
                    >
                      <ArrowLeft className="size-4" /> {qIndex === 0 ? "Intro" : "Back"}
                    </button>
                    <span className="font-mono text-[11px] font-bold tracking-widest text-neutral-400">
                      {qIndex + 1} / {QUESTIONS.length}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="mb-7 h-2 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className="h-full bg-[#8B5CF6] transition-all"
                        style={{ width: `${Math.round((qIndex / QUESTIONS.length) * 100)}%` }}
                      />
                    </div>

                    <Eyebrow>
                      {meta.label} · {meta.be}
                    </Eyebrow>
                    <h2 className="mb-6 mt-2 font-display text-[22px] font-extrabold leading-snug tracking-tight text-[#1A1523] sm:text-[26px]">
                      {q.text}
                    </h2>

                    <div className="grid gap-2.5">
                      {SCALE.map((o) => (
                        <Chip
                          key={o.v}
                          active={answers[q.id] === o.v}
                          onClick={() => choose(q.id, o.v)}
                        >
                          <span className="inline-flex items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1A1523] text-[12px] font-extrabold text-[#8B5CF6]">
                              {o.v}
                            </span>
                            {o.label}
                          </span>
                        </Chip>
                      ))}
                    </div>
                  </div>
                </Panel>
              );
            })()}

          {/* ── RESULT ── */}
          {step === "result" && (
            <div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setStep("intro");
                  setQIndex(0);
                  setAnswers({});
                }}
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#7C3AED] transition hover:text-[#1A1523]"
              >
                <ArrowLeft className="size-3.5" /> Retake
              </a>

              {/* Score hero — charcoal card */}
              <Panel raised className="mt-4 overflow-hidden">
                <div className="relative overflow-hidden bg-[#1A1523] px-6 py-8 text-white sm:px-10">
                  <DotGrid dark />
                  <GoldGlow className="-right-24 -top-28" size={420} opacity={0.6} />
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-center">
                        <div className="font-display text-[44px] font-extrabold leading-none text-[#C4B5FD] sm:text-[56px]">
                          {pct}%
                        </div>
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-white/50">
                          in position
                        </div>
                      </div>
                      <div className="min-w-[230px] flex-1">
                        <Eyebrow className="!text-[#C4B5FD]">{VERDICTS[lowest].kicker}</Eyebrow>
                        <h2 className="mt-2 font-display text-[24px] font-extrabold tracking-tight text-white">
                          {VERDICTS[lowest].title}
                        </h2>
                      </div>
                    </div>
                    <p className="mt-4 text-[14px] leading-relaxed text-white/70">
                      {VERDICTS[lowest].body}
                    </p>
                  </div>
                </div>
              </Panel>

              {/* Phase bars */}
              <Panel className="mt-5 p-5 sm:p-6">
                <p className="font-display text-[15px] font-bold text-[#1A1523]">Your three phases</p>
                <p className="mb-4 mt-0.5 text-[12.5px] leading-snug text-neutral-500">
                  Your lowest phase is where you start. Don't skip ahead — Align → Accelerate →
                  Excel. The sequence matters.
                </p>
                <div className="flex flex-col gap-4">
                  {order.map((p) => {
                    const s = scores[p];
                    const isLowest = p === lowest;
                    const band = s >= 15 ? "Strong" : s >= 8 ? "Building" : "Needs work";
                    return (
                      <div key={p}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-display text-[13px] font-bold text-[#1A1523]">
                            {PHASE_META[p].label}
                            {isLowest && (
                              <span className="ml-2 rounded-full bg-[#8B5CF6] px-2 py-0.5 text-[10px] font-bold text-white">
                                START HERE
                              </span>
                            )}
                          </span>
                          <span className="text-[12px] text-neutral-500">
                            {s}/20 · {band}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${(s / 20) * 100}%`,
                              background: isLowest ? "#8B5CF6" : "#7C3AED",
                              opacity: isLowest ? 1 : 0.5,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              {/* Quote */}
              <Panel className="mt-5 overflow-hidden">
                <div className="border-l-4 border-[#8B5CF6] px-6 py-5">
                  <p className="font-display text-[18px] font-bold leading-snug text-[#1A1523]">
                    "Get off the bathroom floor. Get in position. Take your dominion."
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">
                    Here's your free gift — the exact 7-Day Alignment Sprint I ran at 05:00 every
                    morning. One action a day. Start tomorrow.
                  </p>
                </div>
              </Panel>

              {/* The free gift — full sprint, shown right here. No gate, no selling. */}
              <div className="mt-6">
                <Eyebrow>Your free 7-Day Alignment Sprint</Eyebrow>
                <div className="mt-3 flex flex-col gap-3">
                  {SPRINT.map((d) => (
                    <Panel key={d.day} className="flex gap-4 p-5">
                      <div className="w-9 shrink-0 font-display text-[22px] font-extrabold leading-none text-[#7C3AED]">
                        {String(d.day).padStart(2, "0")}
                      </div>
                      <div>
                        <p className="font-display text-[15px] font-bold text-[#1A1523]">{d.title}</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">{d.task}</p>
                      </div>
                    </Panel>
                  ))}
                </div>
              </div>

              {/* Email capture — the framework PDF is delivered in the thank-you state. */}
              <ToolkitCapture focusPhase={lowest} />

              <div className="mt-8 text-center">
                <p className="font-display text-[18px] font-bold text-[#1A1523]">
                  Align. Accelerate. Excel.
                </p>
                <p className="mt-1 text-[14px] text-neutral-500">
                  Ephesians 5:16 — "Redeeming the time."
                </p>
              </div>
            </div>
          )}
        </main>
      </ToolCanvas>
      <SiteFooter />
    </div>
  );
}

// ── Lead capture (the giveaway) ────────────────────────────────────────────────
function ToolkitCapture({ focusPhase }: { focusPhase: Phase }) {
  const subscribeFn = useServerFn(subscribeAlignedToolkit);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tsToken, setTsToken] = useState<string | null>(null);
  // A Turnstile token is single-use — reset after EVERY attempt so a retry
  // (or a second run of this tool) gets a fresh one instead of re-sending a
  // spent token, which Cloudflare rejects as `timeout-or-duplicate`.
  const tsRef = useRef<TurnstileGateHandle>(null);

  const mut = useMutation({
    mutationFn: subscribeFn,
    onError: (e: Error) => toast.error(e.message ?? "Something went wrong. Try again."),
    onSettled: () => tsRef.current?.reset(),
  });

  if (mut.isSuccess) {
    return (
      <Panel raised className="mt-8 overflow-hidden">
        <div className="relative overflow-hidden bg-[#1A1523] px-6 py-9 text-center text-white sm:px-10">
          <DotGrid dark />
          <GoldGlow className="-bottom-32 -right-20" size={440} opacity={0.6} />
          <div className="relative">
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[#8B5CF6] text-white">
              <Check className="size-6" />
            </div>
            <h3 className="mt-4 font-display text-[22px] font-extrabold tracking-tight text-white sm:text-[26px]">
              You're in. Here's your framework.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
              Thank you, <strong className="text-white">{name}</strong>. Download the full
              Align · Accelerate · Excel framework below — scripture, the map, and worked examples.
            </p>
            <a
              href="/align-accelerate-excel-framework"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-[15px] font-bold text-white transition hover:brightness-110"
            >
              <Download className="size-4" /> Download the framework (PDF)
            </a>
            <p className="mt-4 text-[12px] text-white/45">
              Your 7-day sprint is above — save it and begin tomorrow morning.
            </p>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-[14px] leading-relaxed text-white/70">
                Alignment is the start. The Foundation Kit is the system that turns it into income
                you own.
              </p>
              <Link
                to="/products/$slug"
                params={{ slug: "called-expert-foundation-kit" }}
                className="mt-4 inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-white/25 px-7 text-[14px] font-bold text-white transition hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
              >
                See the Foundation Kit <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel raised className="mt-8 overflow-hidden">
      <div className="relative overflow-hidden bg-[#1A1523] px-6 py-8 text-white sm:px-10">
        <DotGrid dark />
        <GoldGlow className="-right-24 -top-24" size={420} opacity={0.55} />
        <div className="relative">
          <Eyebrow className="!text-[#C4B5FD]">Free · no spam, no selling</Eyebrow>
          <h3 className="mt-2 font-display text-[24px] font-extrabold tracking-tight text-white">
            Get the full framework (PDF)
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-white/70">
            The sprint above is yours to screenshot. Leave your details and I'll send you the
            complete Align · Accelerate · Excel framework — scripture, the map, and worked examples
            — plus a daily nudge through your 7 days. That's it.
          </p>

          <div className="mt-5 grid gap-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#C4B5FD]"
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#C4B5FD]"
            />
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="WhatsApp number (optional)"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#C4B5FD]"
            />
            <TurnstileGate ref={tsRef} onToken={setTsToken} />
            <GoldButton
              type="button"
              disabled={!name || !email || !tsToken || mut.isPending}
              onClick={() =>
                mut.mutate({
                  data: {
                    name,
                    email,
                    phone: phone || undefined,
                    focusPhase,
                    turnstileToken: tsToken ?? undefined,
                    ...getUtm(),
                  },
                })
              }
              className="bg-[#8B5CF6] text-white hover:brightness-110 disabled:hover:brightness-100"
            >
              {mut.isPending ? "Saving…" : "Send me the framework"}
              <ArrowRight className="size-4" />
            </GoldButton>
          </div>
          <p className="mt-3 text-center text-[12px] text-white/50">
            <Lock className="-mt-0.5 inline size-3" /> Your details stay yours ·
            contentcreatorhub.online
          </p>
        </div>
      </div>
    </Panel>
  );
}
