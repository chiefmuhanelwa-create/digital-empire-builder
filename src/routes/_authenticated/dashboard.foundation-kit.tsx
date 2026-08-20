import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { STAGES, TOOLS, toolsForStage, startedSlugs, type KitTool, type StageId } from "@/lib/kit-catalog";
import { readOffer, assembleSentence, isOfferComplete, EMPTY_OFFER, type Offer } from "@/lib/offer-spine";
import { Lock, ArrowRight, Check, Circle, Search, Database, Link2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/foundation-kit")({
  head: () => ({ meta: [{ title: "Your Workspace — Contentpreneur Africa" }] }),
  component: Workspace,
});

// THE WORKSPACE
//
// This replaces a dashboard that listed eight of the twenty-four tools a buyer
// had paid for. The rest existed and were reachable only if you knew the URL.
//
// Organised by the seven stages rather than by tool type, because the stages are
// the journey the customer is actually on and the thing the Accelerator's gates
// key off. A buyer should open this and see a route, not an inventory.
//
// Dark by deliberate choice: this is the signed-in room, and it should not look
// like the sales page that sold it. Contrast is checked against the surfaces —
// gold on obsidian, never gold on a mid-tone.

const INK = "#0E0E0C";
const PANEL = "#171714";
const RAISED = "#1E1E1A";
const LINE = "#2C2C27";
const LINE_HI = "#3D3D35";
const TEXT = "#F4F2EA";
const DIM = "#A8A396";
const FAINT = "#77736A";
const GOLD = "#D4A82F";
const GOLD_HI = "#E8C462";

function Workspace() {
  const { access, loading } = useKitAccess();
  const [started, setStarted] = useState<Set<string>>(new Set());
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [q, setQ] = useState("");
  const [openStage, setOpenStage] = useState<StageId | null>(null);

  useEffect(() => {
    setStarted(startedSlugs());
    setOffer(readOffer());
  }, []);

  const doneCount = started.size;
  const pct = Math.round((doneCount / TOOLS.length) * 100);

  // Where they actually are: the first stage with unfinished tools.
  const currentStage = useMemo(() => {
    for (const s of STAGES) {
      const tools = toolsForStage(s.id);
      if (tools.some((t) => !started.has(t.slug))) return s;
    }
    return STAGES[STAGES.length - 1];
  }, [started]);

  const nextTool = useMemo(() => {
    const inStage = toolsForStage(currentStage.id);
    return inStage.find((t) => t.start && !started.has(t.slug))
      ?? inStage.find((t) => !started.has(t.slug))
      ?? null;
  }, [currentStage, started]);

  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return null;
    return TOOLS.filter(
      (t) => t.name.toLowerCase().includes(n) || t.blurb.toLowerCase().includes(n) || t.output.toLowerCase().includes(n),
    );
  }, [q]);

  if (loading) {
    return (
      <Shell>
        <div className="py-32 text-center" style={{ color: FAINT }}>
          <span className="font-mono text-xs tracking-[0.25em] uppercase">Loading your workspace</span>
        </div>
      </Shell>
    );
  }

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-2xl px-5 py-24 text-center">
          <Lock className="size-9 mx-auto" style={{ color: FAINT }} />
          <h1 className="mt-5 text-3xl font-black tracking-tight" style={{ color: TEXT }}>
            Your workspace is part of the Foundation Kit.
          </h1>
          <p className="mt-3" style={{ color: DIM }}>
            Twenty-four tools across seven stages, and your answers carry from one to the next.
          </p>
          <a href="/foundation" className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold"
             style={{ background: GOLD, color: "#111" }}>
            Get the Kit <ArrowRight className="size-4" />
          </a>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* ── masthead */}
      <section style={{ borderBottom: `1px solid ${LINE}` }}>
        <div className="mx-auto max-w-6xl px-5 pt-12 pb-9">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase" style={{ color: GOLD }}>
            Your workspace
          </p>
          <h1 className="mt-3 text-[2.1rem] sm:text-[3rem] font-black leading-[1.03] tracking-tight" style={{ color: TEXT }}>
            {isOfferComplete(offer) ? "Everything you build reads from one sentence." : "Seven stages. Twenty-four tools."}
          </h1>

          {isOfferComplete(offer) ? (
            <p className="mt-4 max-w-3xl text-[1.05rem] leading-relaxed" style={{ color: DIM }}>
              <span style={{ color: GOLD_HI }}>&ldquo;{assembleSentence(offer)}&rdquo;</span>
            </p>
          ) : (
            <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed" style={{ color: DIM }}>
              Work them in order. Each stage ends in something you can point at &mdash; and your
              answers carry forward, so you never type the same thing twice.
            </p>
          )}

          {/* progress + next action */}
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-black text-2xl tabular-nums" style={{ color: TEXT }}>{doneCount}</span>
                <span className="text-sm" style={{ color: FAINT }}>of {TOOLS.length} tools started &middot; {pct}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: LINE }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: GOLD }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STAGES.map((s) => {
                  const tools = toolsForStage(s.id);
                  const done = tools.filter((t) => started.has(t.slug)).length;
                  const full = done === tools.length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setOpenStage(s.id); setQ(""); document.getElementById(`stage-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                      className="rounded-md px-2.5 py-1 font-mono text-[10px] tracking-wider transition-colors"
                      style={{
                        background: full ? GOLD : done > 0 ? RAISED : "transparent",
                        color: full ? "#111" : done > 0 ? GOLD_HI : FAINT,
                        border: `1px solid ${full ? GOLD : LINE_HI}`,
                      }}
                      title={`${s.name} — ${done}/${tools.length}`}
                    >
                      {String(s.id).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>

            {nextTool && (
              <a
                href={`/apps/${nextTool.slug}`}
                className="rounded-xl p-5 transition-transform hover:-translate-y-0.5 lg:max-w-xs"
                style={{ background: RAISED, border: `1px solid ${GOLD}`, textDecoration: "none" }}
              >
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: GOLD }}>
                  Pick up here
                </span>
                <span className="block font-bold text-lg mt-1" style={{ color: TEXT }}>{nextTool.name}</span>
                <span className="block text-xs mt-1" style={{ color: DIM }}>
                  Stage {nextTool.stage} &middot; {STAGES[nextTool.stage - 1].outcome}
                </span>
                <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold" style={{ color: GOLD_HI }}>
                  Open <ArrowRight className="size-3.5" />
                </span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── search */}
      <section style={{ borderBottom: `1px solid ${LINE}`, background: PANEL }}>
        <div className="mx-auto max-w-6xl px-5 py-4">
          <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
               style={{ background: INK, border: `1px solid ${LINE_HI}` }}>
            <Search className="size-4 shrink-0" style={{ color: FAINT }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a tool — or what you need it to do"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: TEXT }}
            />
            {q && (
              <button onClick={() => setQ("")} className="text-xs font-mono shrink-0" style={{ color: FAINT }}>clear</button>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-9">
        {results ? (
          <>
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase mb-4" style={{ color: FAINT }}>
              {results.length} result{results.length === 1 ? "" : "s"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((t) => <ToolCard key={t.slug} t={t} started={started.has(t.slug)} showStage />)}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {STAGES.map((stage) => {
              const tools = toolsForStage(stage.id);
              const done = tools.filter((t) => started.has(t.slug)).length;
              const isOpen = openStage === null ? stage.id === currentStage.id : openStage === stage.id;
              const complete = done === tools.length;

              return (
                <section
                  key={stage.id}
                  id={`stage-${stage.id}`}
                  className="rounded-2xl overflow-hidden scroll-mt-4"
                  style={{ background: PANEL, border: `1px solid ${isOpen ? LINE_HI : LINE}` }}
                >
                  <button
                    onClick={() => setOpenStage(isOpen ? null : stage.id)}
                    className="w-full text-left px-5 sm:px-6 py-5 transition-colors"
                    style={{ background: isOpen ? RAISED : "transparent" }}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold"
                        style={{
                          background: complete ? GOLD : INK,
                          color: complete ? "#111" : GOLD,
                          border: `1px solid ${complete ? GOLD : LINE_HI}`,
                        }}
                      >
                        {complete ? <Check className="size-4" /> : String(stage.id).padStart(2, "0")}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <span className="font-black text-xl tracking-tight" style={{ color: TEXT }}>{stage.name}</span>
                          <span className="font-mono text-[10px] tracking-[0.16em] uppercase px-2 py-0.5 rounded"
                                style={{ color: GOLD, border: `1px solid ${LINE_HI}` }}>
                            {stage.outcome}
                          </span>
                        </div>
                        <p className="text-sm mt-1.5 max-w-2xl" style={{ color: DIM }}>{stage.premise}</p>
                      </div>

                      <span className="font-mono text-xs shrink-0 tabular-nums" style={{ color: done ? GOLD_HI : FAINT }}>
                        {done}/{tools.length}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {tools.map((t) => <ToolCard key={t.slug} t={t} started={started.has(t.slug)} />)}
                      </div>

                      <div className="mt-5 rounded-xl px-4 py-3.5" style={{ background: INK, border: `1px solid ${LINE_HI}` }}>
                        <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: GOLD }}>
                          You leave this stage when
                        </span>
                        <p className="text-sm mt-1" style={{ color: TEXT }}>{stage.gate}</p>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-xs text-center" style={{ color: FAINT }}>
          Your work saves to your account and follows you between devices.
        </p>
      </main>
    </Shell>
  );
}

function ToolCard({ t, started, showStage }: { t: KitTool; started: boolean; showStage?: boolean }) {
  return (
    <a
      href={`/apps/${t.slug}`}
      className="group block rounded-xl p-4 transition-all hover:-translate-y-0.5"
      style={{
        background: RAISED,
        border: `1px solid ${started ? "rgba(212,168,47,0.35)" : LINE}`,
        textDecoration: "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-bold text-[15px] leading-snug" style={{ color: TEXT }}>{t.name}</span>
        {started
          ? <Check className="size-4 shrink-0 mt-0.5" style={{ color: GOLD }} />
          : <Circle className="size-3.5 shrink-0 mt-1" style={{ color: FAINT }} />}
      </div>

      {showStage && (
        <span className="font-mono text-[10px] tracking-wider" style={{ color: GOLD }}>
          Stage {t.stage}
        </span>
      )}

      <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: DIM }}>{t.blurb}</p>

      <p className="text-[12px] mt-2.5 pt-2.5" style={{ color: FAINT, borderTop: `1px solid ${LINE}` }}>
        <span style={{ color: GOLD_HI }}>You get:</span> {t.output}
      </p>

      <div className="flex items-center gap-2.5 mt-2.5">
        {t.start && !started && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded"
                style={{ color: GOLD, border: `1px solid rgba(212,168,47,0.4)` }}>
            <Sparkles className="size-2.5" /> Start here
          </span>
        )}
        {t.storage === "server" && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wider uppercase" style={{ color: FAINT }}>
            <Database className="size-2.5" /> Saved
          </span>
        )}
        {t.readsFrom && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wider uppercase" style={{ color: FAINT }}
                title={`Reads from ${t.readsFrom}`}>
            <Link2 className="size-2.5" /> Linked
          </span>
        )}
      </div>
    </a>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: INK, color: TEXT }}>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
