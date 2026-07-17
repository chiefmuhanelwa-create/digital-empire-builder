import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurnstileGate } from "@/components/TurnstileGate";
import { subscribeAlignedToolkit } from "@/lib/aligned.functions";
import { ArrowRight, ArrowLeft, Check, Sparkles, Lock, Download } from "lucide-react";

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
    color: "var(--nx-gold-deep)",
  },
  accelerate: {
    label: "ACCELERATE",
    be: "Momentum · DO · Space",
    verse: 'Genesis 1:28 "Multiply" · Joshua 1:8 "Make your way prosperous"',
    color: "var(--nx-gold-deep)",
  },
  excel: {
    label: "EXCEL",
    be: "Mastery · HAVE · Matter",
    verse: 'Genesis 1:28 "Have dominion" · Joshua 1:8 "Have good success"',
    color: "var(--nx-gold-deep)",
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
    body: "This is where I was on the bathroom floor in 2013 — R47, no plan that made sense. Alignment happens in the dark, before anybody claps. Joshua 1:8 says meditate first, THEN your way prospers. Lock your identity and your daily habits this week, and everything downstream gets easier. The 7-Day Sprint below is built exactly for you.",
  },
  accelerate: {
    kicker: "Start here — ACCELERATE",
    title: "Your roots are set. Now break the friction.",
    body: "You know who you are — but you're still adding when God called you to multiply. My first deal was R350; one aligned link later it was R23,000 in a single day. Acceleration isn't for the talented, it's for the positioned. Publish more, build the owned list, and treat every small job like it's worth R100,000. The Sprint sharpens your execution.",
  },
  excel: {
    kicker: "Guard the dominion — EXCEL",
    title: "You're operating. Now build to last — and stay accountable.",
    body: "You're moving like Daniel's excellent spirit. The danger now isn't speed, it's governance — I learned that with a SARS bill of just over R200,000 because I managed my talent and not my house. Excel means ownership: tax-compliant, an asset your children inherit, and a hand back to the ones behind you. Umuntu ngumuntu ngabantu.",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
function AlignedToolPage() {
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
    <div className="min-h-screen bg-white text-[var(--foreground)]">
      {/* Standalone wordmark — no nav. Keeps the giveaway page distraction-free. */}
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 flex items-center justify-center">
          <span className="font-display text-lg tracking-[0.18em] text-[var(--foreground)]">
            CHK<span className="text-[var(--nx-gold-text)]">PLT</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-14">
        {/* ── INTRO ── */}
        {step === "intro" && (
          <div>
            <div className="rounded-2xl bg-[#0F172A] p-7 sm:p-10 text-white nx-hero-orb">
              <p className="nx-label !text-[var(--nx-gold-bright)] inline-flex items-center gap-2">
                <Sparkles className="size-3.5" /> Aligned 2026 · Excel • Accelerate
              </p>
              <h1 className="text-white mt-3">You're not stuck. You're out of position.</h1>
              <p className="text-slate-300 mt-4 leading-relaxed">
                God gave us the whole map in one verse — Genesis 1:28:{" "}
                <em className="text-white">be fruitful, multiply, have dominion.</em> First you
                <strong className="text-[var(--nx-gold-bright)]"> ALIGN</strong>, then you{" "}
                <strong className="text-[var(--nx-gold-bright)]">ACCELERATE</strong>, then you{" "}
                <strong className="text-[var(--nx-gold-bright)]">EXCEL</strong>. It's the rhythm of
                creation itself — in the beginning (Time) God created the heavens (Space) and the
                earth (Matter). The unseen always comes first. This 12-question check shows you
                exactly which phase to work on right now.
              </p>
              <button
                onClick={() => {
                  setStep("q");
                  setQIndex(0);
                }}
                className="cta-glow inline-flex items-center gap-2 mt-6"
              >
                Find my phase <ArrowRight className="size-4" />
              </button>
              <p className="text-xs text-slate-400 mt-3">12 questions · 90 seconds · free</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {(["align", "accelerate", "excel"] as Phase[]).map((p) => (
                <div key={p} className="nx-card !p-4 text-center">
                  <div className="font-display text-lg text-[var(--nx-gold-deep)]">
                    {PHASE_META[p].label}
                  </div>
                  <div className="text-[11px] text-[var(--text-dim)] mt-1">{PHASE_META[p].be}</div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-[var(--text-dim)] mt-6">
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
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => {
                      if (qIndex === 0) setStep("intro");
                      else setQIndex(qIndex - 1);
                    }}
                    className="inline-flex items-center gap-1 text-sm text-[var(--text-dim)] hover:text-foreground"
                  >
                    <ArrowLeft className="size-4" /> {qIndex === 0 ? "Intro" : "Back"}
                  </button>
                  <span className="font-display text-xs tracking-wide text-[var(--nx-gold-text)]">
                    {qIndex + 1} of {QUESTIONS.length}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden mb-7">
                  <div
                    className="h-full bg-[var(--nx-gold)] transition-all"
                    style={{ width: `${Math.round((qIndex / QUESTIONS.length) * 100)}%` }}
                  />
                </div>

                <p className="nx-label" style={{ color: meta.color }}>
                  {meta.label} · {meta.be}
                </p>
                <h2 className="text-2xl sm:text-3xl mt-2 mb-6">{q.text}</h2>

                <div className="flex flex-col gap-3">
                  {SCALE.map((o) => {
                    const chosen = answers[q.id] === o.v;
                    return (
                      <button
                        key={o.v}
                        onClick={() => choose(q.id, o.v)}
                        className={`flex items-center gap-4 w-full rounded-xl border-[1.5px] px-5 py-4 text-left text-[15px] transition-colors ${
                          chosen
                            ? "border-[var(--nx-gold)] bg-[var(--bg-card-hi)]"
                            : "border-[var(--border)] bg-white hover:border-[var(--border-mid)]"
                        }`}
                      >
                        <span
                          className={`size-7 rounded-full border-2 shrink-0 inline-flex items-center justify-center font-display text-xs ${
                            chosen
                              ? "border-[var(--nx-gold)] bg-[var(--nx-gold)] text-[var(--nx-gold-foreground,#1C1C1C)]"
                              : "border-[var(--input)] text-[var(--text-dim)]"
                          }`}
                        >
                          {o.v}
                        </span>
                        <span className="flex-1">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
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
              className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline"
            >
              ← Retake
            </a>

            <div className="rounded-2xl bg-[#0F172A] p-6 sm:p-8 text-white mt-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <div
                    className="font-display text-5xl"
                    style={{ color: "var(--nx-gold-bright)" }}
                  >
                    {pct}%
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 mt-1">
                    in position
                  </div>
                </div>
                <div className="flex-1 min-w-[230px]">
                  <p className="nx-label !text-[var(--nx-gold-bright)]">{VERDICTS[lowest].kicker}</p>
                  <h2 className="text-white text-2xl mt-1">{VERDICTS[lowest].title}</h2>
                </div>
              </div>
              <p className="text-slate-300 mt-4 text-sm leading-relaxed">{VERDICTS[lowest].body}</p>
            </div>

            {/* Phase bars */}
            <div className="nx-card !p-5 mt-5">
              <p className="font-display text-base">Your three phases</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5 mb-4">
                Your lowest phase is where you start. Don't skip ahead — Align → Accelerate → Excel.
                The sequence matters.
              </p>
              <div className="flex flex-col gap-4">
                {order.map((p) => {
                  const s = scores[p];
                  const isLowest = p === lowest;
                  const band = s >= 15 ? "Strong" : s >= 8 ? "Building" : "Needs work";
                  return (
                    <div key={p}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display text-sm">
                          {PHASE_META[p].label}
                          {isLowest && (
                            <span className="ml-2 rounded-full bg-[var(--nx-gold)] px-2 py-0.5 text-[10px] font-semibold text-[#1C1C1C]">
                              START HERE
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-[var(--text-dim)]">
                          {s}/20 · {band}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${(s / 20) * 100}%`,
                            background: isLowest ? "var(--nx-gold)" : "var(--nx-gold-deep)",
                            opacity: isLowest ? 1 : 0.5,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-r-xl border-l-4 border-[var(--nx-gold)] bg-[var(--bg-surface)] px-6 py-5">
              <p className="font-display text-lg leading-snug">
                "Get off the bathroom floor. Get in position. Take your dominion."
              </p>
              <p className="text-sm text-[var(--text-body)] mt-3">
                Here's your free gift — the exact 7-Day Alignment Sprint I ran at 05:00 every
                morning. One action a day. Start tomorrow.
              </p>
            </div>

            {/* The free gift — full sprint, shown right here. No gate, no selling. */}
            <div className="mt-5">
              <p className="nx-label">Your free 7-Day Alignment Sprint</p>
              <div className="mt-3 flex flex-col gap-3">
                {SPRINT.map((d) => (
                  <div key={d.day} className="nx-card !p-5 flex gap-4">
                    <div className="font-display text-2xl text-[var(--nx-gold-deep)] leading-none shrink-0 w-9">
                      {String(d.day).padStart(2, "0")}
                    </div>
                    <div>
                      <p className="font-display text-base">{d.title}</p>
                      <p className="text-sm text-[var(--text-dim)] leading-relaxed mt-1">{d.task}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email capture — the framework PDF is delivered in the thank-you state. */}
            <ToolkitCapture focusPhase={lowest} />

            <div className="text-center mt-8">
              <p className="font-display text-lg">Align. Accelerate. Excel.</p>
              <p className="text-sm text-[var(--text-dim)] mt-1">
                Ephesians 5:16 — "Redeeming the time."
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Minimal standalone footer — no site menu. */}
      <footer className="border-t border-[var(--border)] mt-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-[var(--text-dim)]">
            contentcreatorhub.online · @nochill_god
          </p>
          <p className="text-[11px] text-[var(--text-subtle)] mt-1">
            © NOCHILL PTY LTD · Ndivhuwo Muhanelwa (Mr NoChill)
          </p>
        </div>
      </footer>
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

  const mut = useMutation({
    mutationFn: subscribeFn,
    onError: (e: Error) => toast.error(e.message ?? "Something went wrong. Try again."),
  });

  if (mut.isSuccess) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--nx-gold)] bg-[var(--bg-card-hi)] p-7 text-center">
        <div className="mx-auto inline-flex size-11 items-center justify-center rounded-full bg-[var(--nx-gold)]">
          <Check className="size-6 text-[#1C1C1C]" />
        </div>
        <h3 className="font-display text-xl mt-3">You're in. Here's your framework.</h3>
        <p className="nx-body max-w-md mx-auto mt-2">
          Thank you, <strong className="text-foreground">{name}</strong>. Download the full
          Align · Accelerate · Excel framework below — scripture, the map, and worked examples.
        </p>
        <a
          href="/align-accelerate-excel-framework"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--nx-gold)] px-6 py-3 font-display text-[#1C1C1C] hover:bg-[var(--nx-gold)]/90 transition-colors"
        >
          <Download className="size-4" /> Download the framework (PDF)
        </a>
        <p className="text-xs text-[var(--text-dim)] mt-4">
          Your 7-day sprint is above — save it and begin tomorrow morning.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl bg-[#0F172A] p-7 text-white">
      <p className="nx-label !text-[var(--nx-gold-bright)]">Free · no spam, no selling</p>
      <h3 className="text-white text-2xl font-display mt-2">
        Get the full framework (PDF)
      </h3>
      <p className="text-slate-300 text-sm mt-2 leading-relaxed">
        The sprint above is yours to screenshot. Leave your details and I'll send you the complete
        Align · Accelerate · Excel framework — scripture, the map, and worked examples — plus a daily
        nudge through your 7 days. That's it.
      </p>

      <div className="mt-5 grid gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name"
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
        />
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="WhatsApp number (optional)"
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
        />
        <TurnstileGate onToken={setTsToken} />
        <Button
          size="lg"
          disabled={!name || !email || mut.isPending}
          onClick={() =>
            mut.mutate({
              data: {
                name,
                email,
                phone: phone || undefined,
                focusPhase,
                turnstileToken: tsToken ?? undefined,
              },
            })
          }
          className="w-full bg-[var(--nx-gold)] text-[#1C1C1C] hover:bg-[var(--nx-gold)]/90 font-display"
        >
          {mut.isPending ? "Saving…" : "Send me the framework →"}
        </Button>
      </div>
      <p className="text-center text-xs text-slate-400 mt-3">
        <Lock className="inline size-3 -mt-0.5" /> Your details stay yours · contentcreatorhub.online
      </p>
    </div>
  );
}
