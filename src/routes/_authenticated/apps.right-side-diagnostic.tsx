import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { AiCoach } from "@/components/ai-coach";
import { Lock, ArrowRight, ArrowLeft, Compass } from "lucide-react";
import { diagnose, survivalLine } from "@/lib/right-side-engine";

export const Route = createFileRoute("/_authenticated/apps/right-side-diagnostic")({
  head: () => ({ meta: [{ title: "The Right Side Diagnostic — Contentpreneur Africa" }] }),
  component: RightSideDiagnostic,
});

const KEY = "nochill-rightside-v1";

type Q = { id: string; kicker: string; text: string; area: string; options: { label: string; pts: number }[] };
const QUESTIONS: Q[] = [
  { id: "income", kicker: "Income source", text: "Where does most of your income come from?", area: "Income concentration", options: [
    { label: "One platform / one stream", pts: 0 }, { label: "Two platforms or streams", pts: 1 }, { label: "Three or more, including owned channels", pts: 2 } ] },
  { id: "list", kicker: "Email list", text: "Do you own an email list you can contact any time?", area: "Email list", options: [
    { label: "No list at all", pts: 0 }, { label: "A small or neglected list", pts: 1 }, { label: "Yes — and I email it regularly", pts: 2 } ] },
  { id: "home", kicker: "Your home base", text: "Do you have a website or platform you fully control?", area: "Owned home base", options: [
    { label: "No — social profiles only", pts: 0 }, { label: "A link-in-bio or marketplace page", pts: 1 }, { label: "Yes — a site / store I own", pts: 2 } ] },
  { id: "survive", kicker: "The stress test", text: "If your biggest platform banned you tomorrow, what survives?", area: "Platform-loss survival", options: [
    { label: "Almost nothing", pts: 0 }, { label: "Some of it", pts: 1 }, { label: "Most of it — I could rebuild fast", pts: 2 } ] },
  { id: "store", kicker: "Where they buy", text: "When someone buys from you, where does the sale happen?", area: "Sales channel", options: [
    { label: "In DMs / comments only", pts: 0 }, { label: "On one marketplace I don't control", pts: 1 }, { label: "On my own store / checkout", pts: 2 } ] },
  { id: "reach", kicker: "Audience reach", text: "Can you reach your audience off the platform?", area: "Off-platform reach", options: [
    { label: "No — only through the feed", pts: 0 }, { label: "A few contacts / a WhatsApp group", pts: 1 }, { label: "Yes — email + WhatsApp list", pts: 2 } ] },
  { id: "streams", kicker: "PAIDS streams", text: "How many income streams are actually active right now?", area: "PAIDS spread", options: [
    { label: "Just one", pts: 0 }, { label: "Two or three", pts: 1 }, { label: "Four or five (full PAIDS)", pts: 2 } ] },
  { id: "content", kicker: "Your back catalogue", text: "Your best content and products — where do they live?", area: "Owned catalogue", options: [
    { label: "Only on platforms that can delete it", pts: 0 }, { label: "Some backed up, some not", pts: 1 }, { label: "Backed up / hosted on assets I own", pts: 2 } ] },
];

function RightSideDiagnostic() {
  const { access, loading } = useKitAccess();
  const [step, setStep] = useState<"intro" | "q" | "result">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  // Persisted so the Clarity Plan can read it. Without this the dashboard asked
  // for "nochill-rightside-v1" and always got nothing back.
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r && typeof r === "object") setAnswers(r);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!Object.keys(answers).length) return;
    try { localStorage.setItem(KEY, JSON.stringify(answers)); } catch { /* ignore */ }
  }, [answers]);

  const choose = (qid: string, pts: number) => {
    const next = { ...answers, [qid]: pts };
    setAnswers(next);
    if (qIndex + 1 >= QUESTIONS.length) setStep("result");
    else setQIndex(qIndex + 1);
  };

  // Weighted by consequence, not summed. A missing email list and an unbacked-up
  // back catalogue are not the same risk, and the old flat sum priced them the
  // same. See lib/right-side-engine.ts.
  const dx = diagnose(answers);
  const pct = dx.ownership;
  const tone: "warn" | "mustard" | "good" =
    dx.band === "rented" ? "warn" : dx.band === "owned" || dx.band === "building" ? "good" : "mustard";
  const vKicker =
    dx.band === "rented" ? "You are a tenant"
    : dx.band === "exposed" ? "One foot on owned ground"
    : dx.band === "building" ? "The foundation is real"
    : "You own your business";
  const vTitle = dx.headline;
  const vText = dx.body;

  const toneHex: Record<string, string> = { warn: "var(--nx-orange-deep)", mustard: "var(--nx-gold-deep)", good: "#15803D" };
  // Ordered by exposure now, not by question order — the thing that would break
  // first sits at the top where it belongs.
  const areaRows = dx.results.map((r) => ({
    label: r.area.area,
    color: r.status === "owned" ? "#15803D" : r.status === "exposed" ? "var(--nx-gold-deep)" : "var(--nx-orange-deep)",
    tag: r.status === "owned" ? "Owned" : r.status === "exposed" ? "Exposed" : "Rented",
  }));

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className="nx-card !p-10 text-center">
          <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
          <h2 className="mt-4 text-2xl">The Right Side Diagnostic is in the Foundation Kit.</h2>
          <p className="nx-body max-w-md mx-auto mt-2">See how exposed your business is to a platform ban — and how to move onto owned ground. Get the kit to unlock it.</p>
          <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
        </div>
      </main>
    </Shell>
  );

  return (
    <Shell>
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to Foundation Kit</a>

        {step === "intro" && (
          <div className="mt-6">
            <div className="rounded-2xl bg-[var(--obsidian)] p-7 sm:p-10 text-white nx-hero-orb">
              <p className="nx-label !text-[var(--nx-gold-bright)]">Cast your net on the right side</p>
              <h1 className="text-white mt-3">Is your business built on rented land?</h1>
              <p className="text-[#C8C2B4] mt-4 leading-relaxed">
                I had 780,000 followers. Gone overnight — one false claim. Then Google killed my AdSense: R180,000 a year, gone in a
                notification. My income didn't drop to zero, because most of it sat on land I owned.
                <strong className="text-[var(--nx-gold-bright)]"> This 8-question check shows how exposed you are right now.</strong>
              </p>
              <button onClick={() => { setStep("q"); setQIndex(0); }} className="cta-glow inline-flex items-center gap-2 mt-6">Start the diagnostic <ArrowRight className="size-4" /></button>
              <p className="text-xs text-[#9A9488] mt-3">8 questions · 90 seconds</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[["780K", "followers lost overnight"], ["R180K", "AdSense gone in a day"], ["R0", "what I'd have left without owned assets"]].map(([n, l]) => (
                <div key={n} className="nx-card !p-4"><div className="font-display text-2xl text-[var(--nx-gold-deep)]">{n}</div><div className="text-xs text-[var(--text-dim)] mt-1">{l}</div></div>
              ))}
            </div>
          </div>
        )}

        {step === "q" && (() => {
          const q = QUESTIONS[qIndex];
          return (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => { if (qIndex === 0) setStep("intro"); else setQIndex(qIndex - 1); }} className="inline-flex items-center gap-1 text-sm text-[var(--text-dim)] hover:text-foreground">
                  <ArrowLeft className="size-4" /> {qIndex === 0 ? "Intro" : "Back"}
                </button>
                <span className="font-display text-xs tracking-wide text-[var(--nx-gold-text)]">Question {qIndex + 1} of {QUESTIONS.length}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden mb-7">
                <div className="h-full bg-[var(--nx-gold)] transition-all" style={{ width: `${Math.round((qIndex / QUESTIONS.length) * 100)}%` }} />
              </div>
              <p className="nx-label">{q.kicker}</p>
              <h2 className="text-2xl sm:text-3xl mt-2 mb-6">{q.text}</h2>
              <div className="flex flex-col gap-3">
                {q.options.map((o) => {
                  const chosen = answers[q.id] === o.pts;
                  return (
                    <button key={o.label} onClick={() => choose(q.id, o.pts)}
                      className={`flex items-center gap-4 w-full rounded-xl border-[1.5px] px-5 py-4 text-left text-[15px] transition-colors ${chosen ? "border-[var(--nx-gold)] bg-[var(--bg-card-hi)]" : "border-[var(--border)] bg-white hover:border-[var(--border-mid)]"}`}>
                      <span className={`size-5 rounded-full border-2 shrink-0 ${chosen ? "border-[var(--nx-gold)] bg-[var(--nx-gold)]" : "border-[var(--input)]"}`} />
                      <span className="flex-1">{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {step === "result" && (
          <div className="mt-6">
            <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-white">
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <div className="font-display text-4xl sm:text-5xl" style={{ color: tone === "good" ? "#4ADE80" : "var(--nx-gold-bright)" }}>{pct}%</div>
                  <div className="text-[11px] uppercase tracking-wide text-[#9A9488] mt-1">you own</div>
                </div>
                <div className="flex-1 min-w-[230px]">
                  <p className="nx-label !text-[var(--nx-gold-bright)]">{vKicker}</p>
                  <h2 className="text-white text-2xl mt-1">{vTitle}</h2>
                  <p className="text-[#C8C2B4] mt-2 text-sm leading-relaxed">{vText}</p>
                </div>
              </div>
            </div>

            {/* The survival number — a different question to ownership, and the
                one people actually feel. Built only from the four areas that
                decide what is left the morning after an account disappears. */}
            <div className="nx-card !p-6 mt-5">
              <p className="nx-label">The stress test</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-display text-4xl tabular-nums" style={{ color: dx.survival <= 45 ? "var(--nx-orange-deep)" : dx.survival <= 70 ? "var(--nx-gold-deep)" : "#15803D" }}>
                  {dx.survival}%
                </span>
                <span className="text-sm text-[var(--text-dim)]">of this survives losing your biggest platform</span>
              </div>
              <p className="nx-body mt-3">{survivalLine(dx.survival)}</p>
            </div>

            {/* The real output. A total tells them a mood; this tells them what
                to do on Monday. */}
            {dx.weakest && (
              <div className="rounded-2xl border-2 border-[#EA580C] bg-[#EA580C]/5 p-6 mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A3412]">
                  Fix this one first
                </p>
                <h2 className="font-display text-2xl text-[#9A3412] mt-1">{dx.weakest.area.area}</h2>
                <p className="text-sm text-[#7C2D12] mt-3 leading-relaxed">{dx.weakest.area.consequence}</p>
                <div className="mt-4 rounded-lg bg-white/60 px-4 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A3412]">The move</span>
                  <p className="text-sm text-[#7C2D12] mt-1">{dx.weakest.area.move}</p>
                </div>
                <p className="text-xs text-[#9A3412]/80 mt-3">
                  Chosen by consequence, not by score — this is the area where a gap costs you most,
                  which is not always the area where you scored lowest.
                </p>
              </div>
            )}

            <div className="nx-card !p-5 mt-5">
              <p className="font-display text-base">Where you stand, area by area</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5 mb-4">Ordered by what a gap actually costs you — most exposed at the top. Green is owned ground. Amber is exposed. Red is rented.</p>
              <div className="flex flex-col gap-3">
                {areaRows.map((a) => (
                  <div key={a.label} className="flex items-center gap-3">
                    <span className="size-2.5 rounded-full shrink-0" style={{ background: a.color }} />
                    <span className="flex-1 text-sm text-foreground">{a.label}</span>
                    <span className="font-display text-xs" style={{ color: a.color }}>{a.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-r-xl border-l-4 border-[var(--nx-gold)] bg-[var(--bg-surface)] px-6 py-5">
              <p className="font-display text-lg leading-snug">"Build on land you own, not rent. Instagram owes you nothing. Your email list cannot be taken away."</p>
              <p className="text-sm text-[var(--text-body)] mt-3">The fix is always the same three moves: <strong>start an email list</strong> you control, <strong>own your storefront</strong> (not just a marketplace), and <strong>run more than one PAIDS stream</strong> so no single platform can take you to zero.</p>
            </div>

            <AiCoach tool="right-side" getPayload={() => JSON.stringify({ percentOwned: pct, areas: areaRows.map((a) => ({ area: a.label, status: a.tag })) })} />

            <div className="mt-5 rounded-2xl bg-[var(--obsidian)] p-6 text-center">
              <h3 className="text-white text-xl font-display">Get your Ownership Roadmap</h3>
              <p className="text-[#C8C2B4] text-sm mt-1 max-w-md mx-auto">The step-by-step on moving each red area onto owned ground — the Accelerator builds it with you.</p>
              <Link to="/apply" className="cta-glow inline-flex items-center gap-2 mt-4">Apply for the Accelerator <ArrowRight className="size-4" /></Link>
            </div>

            <div className="text-center mt-6">
              <button onClick={() => { setStep("intro"); setQIndex(0); setAnswers({}); }} className="rounded-lg border border-border px-5 py-2.5 text-sm text-[var(--text-dim)] hover:border-[var(--nx-gold)] hover:text-[var(--nx-gold-text)] transition-colors">Retake the diagnostic</button>
            </div>
          </div>
        )}
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
