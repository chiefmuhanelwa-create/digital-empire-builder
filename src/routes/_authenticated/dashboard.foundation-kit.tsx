import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { getKitFileUrl } from "@/lib/products.functions";
import { buildClarityPlan } from "@/lib/tool-ai.functions";
import { useKitAccess } from "@/lib/use-kit-access";
import {
  CLARITY_STEPS, CLARITY_BONUSES, CLARITY_TOTAL, STREAM_BASE,
  readClarityProgress, writeClarityProgress, nextClarityStep,
} from "@/lib/clarity-system";
import { Lock, ArrowRight, Check, Download, PlayCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/foundation-kit")({
  head: () => ({ meta: [{ title: "Your Clarity System — CHKPLT" }] }),
  component: ClaritySystem,
});

// PDFs that exist in storage. (All 7 workbooks generated + uploaded in Phase 3.)
const AVAILABLE_PDFS = new Set([
  "niche-clarity", "paids", "ms-ts-ss", "knowledge-audit",
  "4e-content-calendar", "seeds-pipeline", "dares-asset-model",
  "90-day-planner", "cheat-sheet", "30-day-tracker",
]);

function ClaritySystem() {
  const { access } = useKitAccess();
  const kitFileFn = useServerFn(getKitFileUrl);
  const kitFileMut = useMutation({
    mutationFn: kitFileFn,
    onSuccess: (res: { url: string }) => window.open(res.url, "_blank", "noopener,noreferrer"),
    onError: (e: Error) => toast.error(e.message),
  });

  // Clarity Plan — synthesise all 7 tools' saved answers into one personalised plan.
  const planFn = useServerFn(buildClarityPlan);
  const planMut = useMutation({ mutationFn: planFn, onError: (e: Error) => toast.error(e.message) });
  const gatherAnswers = () => {
    const KEYS: [string, string][] = [
      ["Niche", "nochill-niche-v1"], ["Knowledge Audit", "nochill-knowledge-v1"],
      ["MS×TS×SS", "nochill-msts-v1"], ["4E Calendar", "nochill-4e-v1"],
      ["SEEDS", "nochill-seeds-v1"], ["DARES", "nochill-dares-v1"],
      ["PAIDS", "nochill-paids-v1"], ["Right Side", "nochill-rightside-v1"],
    ];
    const parts: string[] = [];
    for (const [label, key] of KEYS) {
      try { const v = localStorage.getItem(key); if (v && v !== "null" && v !== "{}") parts.push(`${label}: ${v}`); } catch { /* ignore */ }
    }
    return parts.join("\n");
  };
  const runPlan = () => {
    const answers = gatherAnswers();
    if (!answers) { toast.error("Do a couple of the tools first, then build your plan."); return; }
    planMut.mutate({ data: { answers: answers.slice(0, 11500) } });
  };

  const [progress, setProgress] = useState<Record<number, boolean>>({});
  useEffect(() => { setProgress(readClarityProgress()); }, []);
  const toggle = (n: number) => {
    setProgress((p) => { const np = { ...p, [n]: !p[n] }; writeClarityProgress(np); return np; });
  };

  const doneCount = CLARITY_STEPS.filter((s) => progress[s.n]).length;
  const next = nextClarityStep(progress);
  const allDone = doneCount === CLARITY_TOTAL;

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">Your Clarity System is for kit owners.</h2>
            <p className="nx-body max-w-md mx-auto mt-2">7 guided steps — watch, do the tool, take the next action — from confused to a clear plan.</p>
            <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit — $97</a>
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Header + progress */}
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-10 pb-8">
          <Link to="/dashboard" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Dashboard</Link>
          <p className="nx-label mt-4">The Clarity System</p>
          <h1 className="mt-2">From “I don't know where to start” to a clear plan — in 7 steps.</h1>
          <p className="nx-body max-w-2xl mt-3">Each step: watch the short video, do the tool, take the one next action. Work top to bottom. Tick each step as you finish.</p>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-[var(--border)] overflow-hidden">
              <div className="h-full bg-[var(--nx-gold)] transition-all" style={{ width: `${(doneCount / CLARITY_TOTAL) * 100}%` }} />
            </div>
            <span className="font-display text-sm whitespace-nowrap">{doneCount}/{CLARITY_TOTAL} done</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6">
        {/* Orientation */}
        <div className="nx-card !p-5">
          <p className="nx-label">How your kit works · ~one focused afternoon</p>
          <p className="nx-body mt-1">
            Work top to bottom. Each step: <strong>1)</strong> watch the short video, <strong>2)</strong> do the tool —
            it reads your answers and your <em>AI coach</em> tells you what to do, <strong>3)</strong> take the one next
            action, then tick it complete. Finish all 7 and hit <strong>Build my Clarity Plan</strong> for your personalised written plan.
          </p>
        </div>

        {CLARITY_STEPS.map((step) => {
          const done = !!progress[step.n];
          const isNext = step.n === next;
          return (
            <div key={step.n} className={`rounded-2xl border bg-white overflow-hidden ${isNext ? "border-[var(--nx-gold)] ring-2 ring-[var(--nx-gold)]/20" : "border-[var(--border)]"}`}>
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg ${done ? "bg-[#15803D] text-white" : "bg-[#0F172A] text-[var(--nx-gold-bright)]"}`}>
                    {done ? <Check className="size-5" /> : step.n}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="nx-label">Step {step.n} · {step.stage}</span>
                      {isNext && !done && <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--nx-gold-text)] bg-[var(--bg-card-hi)] rounded-full px-2 py-0.5">Start here</span>}
                    </div>
                    <h2 className="text-2xl mt-1">{step.title}</h2>
                    <p className="text-sm text-[var(--text-dim)] mt-1">{step.question}</p>
                  </div>
                </div>

                {/* Woven videos */}
                {step.videos.length > 0 && (
                  <div className={`mt-5 grid gap-3 ${step.videos.length > 1 ? "sm:grid-cols-2" : ""}`}>
                    {step.videos.map((vid) => (
                      <figure key={vid.uid}>
                        <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                          <iframe src={`${STREAM_BASE}/${vid.uid}/iframe`} loading="lazy" className="h-full w-full"
                            allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;" allowFullScreen title={vid.title} />
                        </div>
                        <figcaption className="text-xs text-[var(--text-dim)] mt-1">▶ {vid.title} · {vid.minutes}m</figcaption>
                      </figure>
                    ))}
                  </div>
                )}

                {/* Tools */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {step.tools.map((t) => (
                    <span key={t.name} className="inline-flex items-center gap-2">
                      {t.soon ? (
                        <span className="inline-block rounded-full bg-[var(--bg-card-hi)] px-3 py-1.5 text-xs font-semibold text-[var(--text-subtle)]">{t.name} · coming soon</span>
                      ) : t.route ? (
                        <a href={t.route} className="inline-flex items-center gap-1.5 rounded-full bg-[#0F172A] text-white px-4 py-2 text-sm font-semibold hover:bg-[#1E293B] transition-colors">
                          {t.name} <ArrowRight className="size-4" />
                        </a>
                      ) : null}
                      {t.pdf && AVAILABLE_PDFS.has(t.pdf) && (
                        <button onClick={() => kitFileMut.mutate({ data: { key: t.pdf! } })} disabled={kitFileMut.isPending}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)] hover:text-foreground disabled:opacity-50">
                          <Download className="size-4" /> PDF
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {/* Next action + complete */}
                <div className="mt-5 rounded-xl border-l-4 border-[var(--nx-gold)] bg-[var(--bg-surface)] px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--nx-gold-text)]">Your next action</span>
                  <p className="text-sm text-[var(--text-body)] mt-0.5">{step.nextAction}</p>
                </div>
                <button onClick={() => toggle(step.n)}
                  className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${done ? "bg-[var(--bg-card-hi)] text-[#15803D]" : "border-2 border-[var(--border-mid)] text-[var(--text-dim)] hover:border-[var(--nx-gold)] hover:text-[var(--nx-gold-text)]"}`}>
                  <span className={`size-4 rounded inline-flex items-center justify-center ${done ? "bg-[#15803D] text-white" : "border-2 border-current"}`}>{done && <Check className="size-3" />}</span>
                  {done ? "Completed" : "Mark step complete"}
                </button>
              </div>
            </div>
          );
        })}

        {/* Your Clarity Plan / finish */}
        <div className="rounded-2xl bg-[#0F172A] p-6 sm:p-8 text-center">
          {allDone ? (
            <>
              <Sparkles className="size-7 text-[var(--nx-gold-bright)] mx-auto" />
              <h2 className="text-white text-2xl mt-3">You've got your clarity. Now execute it.</h2>
              <p className="text-slate-300 max-w-lg mx-auto mt-2 mb-5">All 7 steps done — you have a plan. The 90-Day Accelerator walks you through doing it, with coaching at every stage.</p>
            </>
          ) : (
            <>
              <PlayCircle className="size-7 text-[var(--nx-gold-bright)] mx-auto" />
              <h2 className="text-white text-2xl mt-3">{next <= CLARITY_TOTAL ? `Up next — Step ${next}` : "Keep going"}</h2>
              <p className="text-slate-300 max-w-lg mx-auto mt-2 mb-5">{next <= CLARITY_TOTAL ? CLARITY_STEPS[next - 1].nextAction : "Finish your remaining steps to unlock your full plan."}</p>
            </>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={runPlan} disabled={planMut.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-5 py-3 text-sm font-bold text-[#0F172A] hover:bg-[var(--nx-gold-deep)] transition-colors disabled:opacity-50">
              <Sparkles className="size-4" /> {planMut.isPending ? "Building your plan…" : planMut.data ? "Rebuild my Clarity Plan" : "Build my Clarity Plan"}
            </button>
            <Link to="/apply" className="inline-flex items-center rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-white/60 transition-colors">Apply for the Accelerator</Link>
          </div>
        </div>

        {/* The personalised Clarity Plan output (printable) */}
        {planMut.data && (
          <div className="nx-card !p-6 sm:!p-8" id="clarity-plan">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="nx-label">Your Clarity Plan</p>
                <h2 className="text-2xl">Built from your own answers.</h2>
              </div>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)] hover:text-foreground shrink-0">
                <Download className="size-4" /> Print / Save PDF
              </button>
            </div>
            <div className="mt-4 text-[15px] text-[var(--text-body)] leading-relaxed whitespace-pre-line">{planMut.data.plan}</div>
          </div>
        )}

        {/* Bonuses */}
        <div>
          <h2 className="text-xl mb-3">Bonus tools</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {CLARITY_BONUSES.map((b) => (
              <div key={b.name} className="nx-card !p-4 flex flex-col gap-2">
                <span className="font-display text-sm">{b.name}</span>
                <div className="mt-auto flex items-center gap-3">
                  {b.route && (
                    <a href={b.route} className="inline-flex items-center gap-1 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
                      Open <ArrowRight className="size-3.5" />
                    </a>
                  )}
                  {b.pdf && AVAILABLE_PDFS.has(b.pdf) && (
                    <button onClick={() => kitFileMut.mutate({ data: { key: b.pdf! } })} disabled={kitFileMut.isPending}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-dim)] hover:text-foreground disabled:opacity-50">
                      <Download className="size-3.5" /> PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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
