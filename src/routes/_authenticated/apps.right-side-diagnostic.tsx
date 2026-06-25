import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useKitAccess } from "@/lib/use-kit-access";
import { Lock, ArrowRight, ArrowLeft, Compass } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/right-side-diagnostic")({
  head: () => ({ meta: [{ title: "The Right Side Diagnostic — CHKPLT" }] }),
  component: RightSideDiagnostic,
});

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

  const choose = (qid: string, pts: number) => {
    const next = { ...answers, [qid]: pts };
    setAnswers(next);
    if (qIndex + 1 >= QUESTIONS.length) setStep("result");
    else setQIndex(qIndex + 1);
  };

  const raw = QUESTIONS.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
  const pct = Math.round((raw / (QUESTIONS.length * 2)) * 100);
  let tone: "warn" | "mustard" | "good", vKicker: string, vTitle: string, vText: string;
  if (pct <= 33) { tone = "warn"; vKicker = "You are a tenant"; vTitle = "You're renting almost everything"; vText = "Right now you're one platform decision away from zero — exactly where I was before I lost 780K followers. Every red area below moves onto owned ground faster than you think. Start with an email list this week."; }
  else if (pct <= 66) { tone = "mustard"; vKicker = "One foot on owned ground"; vTitle = "You've started — but you're still exposed"; vText = "You'd survive a platform loss, but it would hurt. Close the amber and red gaps below and you turn a potential disaster into a speed bump. Owning the channel is the difference."; }
  else { tone = "good"; vKicker = "You own your business"; vTitle = "You're building on land you own"; vText = "If a platform vanished tomorrow, most of this survives — that's the whole game. Keep widening your PAIDS spread and feeding the assets you control."; }

  const toneHex: Record<string, string> = { warn: "var(--nx-orange-deep)", mustard: "var(--nx-gold-deep)", good: "#15803D" };
  const areaRows = QUESTIONS.map((q) => {
    const v = answers[q.id];
    if (v === 2) return { label: q.area, color: "#15803D", tag: "Owned" };
    if (v === 1) return { label: q.area, color: "var(--nx-gold-deep)", tag: "Exposed" };
    return { label: q.area, color: "var(--nx-orange-deep)", tag: "Rented" };
  });

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className="nx-card !p-10 text-center">
          <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
          <h2 className="mt-4 text-2xl">The Right Side Diagnostic is in the Foundation Kit.</h2>
          <p className="nx-body max-w-md mx-auto mt-2">See how exposed your business is to a platform ban — and how to move onto owned ground. Get the kit to unlock it.</p>
          <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit — $97</a>
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
            <div className="rounded-2xl bg-[#0F172A] p-7 sm:p-10 text-white nx-hero-orb">
              <p className="nx-label !text-[var(--nx-gold-bright)]">Cast your net on the right side</p>
              <h1 className="text-white mt-3">Is your business built on rented land?</h1>
              <p className="text-slate-300 mt-4 leading-relaxed">
                I had 780,000 followers. Gone overnight — one false claim. Then Google killed my AdSense: R180,000 a year, gone in a
                notification. My income didn't drop to zero, because most of it sat on land I owned.
                <strong className="text-[var(--nx-gold-bright)]"> This 8-question check shows how exposed you are right now.</strong>
              </p>
              <button onClick={() => { setStep("q"); setQIndex(0); }} className="cta-glow inline-flex items-center gap-2 mt-6">Start the diagnostic <ArrowRight className="size-4" /></button>
              <p className="text-xs text-slate-400 mt-3">8 questions · 90 seconds</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
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
            <div className="rounded-2xl bg-[#0F172A] p-6 sm:p-8 text-white">
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <div className="font-display text-5xl" style={{ color: tone === "good" ? "#4ADE80" : "var(--nx-gold-bright)" }}>{pct}%</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 mt-1">you own</div>
                </div>
                <div className="flex-1 min-w-[230px]">
                  <p className="nx-label !text-[var(--nx-gold-bright)]">{vKicker}</p>
                  <h2 className="text-white text-2xl mt-1">{vTitle}</h2>
                  <p className="text-slate-300 mt-2 text-sm leading-relaxed">{vText}</p>
                </div>
              </div>
            </div>

            <div className="nx-card !p-5 mt-5">
              <p className="font-display text-base">Where you stand, area by area</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5 mb-4">Green is owned ground. Amber is exposed. Red is rented — fix these first.</p>
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

            <div className="mt-5 rounded-2xl bg-[#0F172A] p-6 text-center">
              <h3 className="text-white text-xl font-display">Get your Ownership Roadmap</h3>
              <p className="text-slate-300 text-sm mt-1 max-w-md mx-auto">The step-by-step on moving each red area onto owned ground — the Accelerator builds it with you.</p>
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
