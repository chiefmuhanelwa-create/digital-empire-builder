import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useKitAccess } from "@/lib/use-kit-access";
import { WorkspaceShell, BLUE, BLUE_DARK, INK, BODY, MUTED, LINE, TINT } from "@/components/workspace-shell";
import { STAGES, TOOLS, toolsForStage, startedSlugs, type KitTool } from "@/lib/kit-catalog";
import { readOffer, assembleSentence, isOfferComplete, EMPTY_OFFER, type Offer } from "@/lib/offer-spine";
import { Lock, ArrowRight, Check, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/foundation-kit")({
  head: () => ({ meta: [{ title: "Your Workspace — Contentpreneur Africa" }] }),
  component: Workspace,
});

// THE WORKSPACE — rebuilt after founder feedback: "I don't know where to start,
// everything is all over, the words are too small, links leave the workspace."
//
// Every one of those was true, and they share one cause: the page presented
// twenty-four equal options and let the person work out the order themselves.
//
// The fix is not decoration. It is subtraction:
//   • ONE thing at the top. Not a dashboard — a next action.
//   • Stages closed by default, current one open. Seven headings beats
//     twenty-four cards.
//   • Body text at 16-17px, headings large. Nothing under 13px anywhere.
//   • Black on white, one blue for anything clickable. No mid-greys on white,
//     no gold-on-cream, no tiny uppercase mono labels.
//   • Nothing links out of the workspace.

function Workspace() {
  const { access, loading } = useKitAccess();
  const [started, setStarted] = useState<Set<string>>(new Set());
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    setStarted(startedSlugs());
    setOffer(readOffer());
  }, []);

  const done = started.size;

  // Where they actually are — the first stage with anything unfinished.
  const current = useMemo(
    () => STAGES.find((s) => toolsForStage(s.id).some((t) => !started.has(t.slug))) ?? STAGES[6],
    [started],
  );

  // The single next action. A "start here" tool if the stage has one, else the
  // first unfinished tool in that stage.
  const next = useMemo(() => {
    const inStage = toolsForStage(current.id);
    return inStage.find((t) => t.start && !started.has(t.slug)) ?? inStage.find((t) => !started.has(t.slug)) ?? null;
  }, [current, started]);

  useEffect(() => { setOpen(current.id); }, [current.id]);

  if (loading) {
    return (
      <WorkspaceShell>
        <div className="py-32 text-center text-[16px]" style={{ color: MUTED }}>Loading…</div>
      </WorkspaceShell>
    );
  }

  if (!access) {
    return (
      <WorkspaceShell>
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <Lock className="size-10 mx-auto" style={{ color: MUTED }} />
          <h1 className="mt-5 text-[32px] font-black leading-tight" style={{ color: INK }}>
            Your workspace is part of the Foundation Kit.
          </h1>
          <p className="mt-3 text-[17px]" style={{ color: BODY }}>
            Twenty-four tools, in the order you need them.
          </p>
          <a
            href="/foundation"
            className="mt-7 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
            style={{ background: BLUE, color: "#fff", textDecoration: "none" }}
          >
            Get the Kit <ArrowRight className="size-4" />
          </a>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main className="mx-auto max-w-3xl px-5 py-10">

        {/* ─── ONE next action. Everything else is below the fold, on purpose. */}
        {next ? (
          <section className="rounded-2xl p-6 sm:p-8" style={{ background: TINT, border: `1px solid ${LINE}` }}>
            <p className="text-[15px] font-semibold" style={{ color: BLUE }}>
              {done === 0 ? "Start here" : "Next up"}
            </p>
            <h1 className="mt-2 text-[28px] sm:text-[34px] font-black leading-[1.15]" style={{ color: INK }}>
              {next.name}
            </h1>
            <p className="mt-3 text-[17px] leading-relaxed" style={{ color: BODY }}>
              {next.blurb}
            </p>
            <p className="mt-4 text-[16px]" style={{ color: BODY }}>
              <strong style={{ color: INK }}>You'll finish with:</strong> {next.output}
            </p>
            <a
              href={`/apps/${next.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
              style={{ background: BLUE, color: "#fff", textDecoration: "none" }}
              onMouseOver={(e) => (e.currentTarget.style.background = BLUE_DARK)}
              onMouseOut={(e) => (e.currentTarget.style.background = BLUE)}
            >
              Open this tool <ArrowRight className="size-4" />
            </a>
            <p className="mt-4 text-[15px]" style={{ color: MUTED }}>
              Step {current.id} of 7 &middot; {current.name} &mdash; {current.outcome}
            </p>
          </section>
        ) : (
          <section className="rounded-2xl p-6 sm:p-8" style={{ background: TINT, border: `1px solid ${LINE}` }}>
            <h1 className="text-[30px] font-black leading-tight" style={{ color: INK }}>
              You have been through all seven stages.
            </h1>
            <p className="mt-3 text-[17px]" style={{ color: BODY }}>
              Come back to any tool whenever the answer changes. They keep what you wrote.
            </p>
          </section>
        )}

        {/* ─── their sentence, once it exists */}
        {isOfferComplete(offer) && (
          <section className="mt-6 rounded-2xl p-6" style={{ border: `1px solid ${LINE}` }}>
            <p className="text-[15px] font-semibold" style={{ color: MUTED }}>Your sentence</p>
            <p className="mt-2 text-[19px] font-bold leading-relaxed" style={{ color: INK }}>
              &ldquo;{assembleSentence(offer)}&rdquo;
            </p>
            <p className="mt-2 text-[15px]" style={{ color: MUTED }}>
              Every tool below fills itself in from this.
            </p>
          </section>
        )}

        {/* ─── progress, stated plainly */}
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <p className="text-[16px] font-semibold" style={{ color: INK }}>
              {done} of {TOOLS.length} tools started
            </p>
            <p className="text-[15px]" style={{ color: MUTED }}>Stage {current.id} of 7</p>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: LINE }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((done / TOOLS.length) * 100)}%`, background: BLUE }}
            />
          </div>
        </section>

        {/* ─── the seven stages. Closed by default; current one open. */}
        <section className="mt-8">
          <h2 className="text-[22px] font-black" style={{ color: INK }}>All tools, in order</h2>
          <p className="mt-1.5 text-[16px]" style={{ color: BODY }}>
            Seven stages. Work them top to bottom &mdash; each one builds on the last.
          </p>

          <div className="mt-5 space-y-3">
            {STAGES.map((stage) => {
              const tools = toolsForStage(stage.id);
              const doneHere = tools.filter((t) => started.has(t.slug)).length;
              const isOpen = open === stage.id;
              const complete = doneHere === tools.length;

              return (
                <div key={stage.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
                  <button
                    onClick={() => setOpen(isOpen ? null : stage.id)}
                    className="w-full text-left px-5 py-5 flex items-center gap-4"
                    style={{ background: isOpen ? TINT : "#fff" }}
                  >
                    <span
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-[17px] font-black"
                      style={{
                        background: complete ? BLUE : isOpen ? "#fff" : TINT,
                        color: complete ? "#fff" : BLUE,
                        border: `1px solid ${complete ? BLUE : LINE}`,
                      }}
                    >
                      {complete ? <Check className="size-5" /> : stage.id}
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="block text-[18px] font-bold leading-tight" style={{ color: INK }}>
                        {stage.outcome}
                      </span>
                      <span className="block text-[15px] mt-0.5" style={{ color: MUTED }}>
                        {tools.length} tool{tools.length === 1 ? "" : "s"} &middot; {doneHere} started
                      </span>
                    </span>

                    <ChevronDown
                      className="size-5 shrink-0 transition-transform"
                      style={{ color: MUTED, transform: isOpen ? "rotate(180deg)" : "none" }}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5" style={{ borderTop: `1px solid ${LINE}` }}>
                      <p className="text-[16px] leading-relaxed mt-4" style={{ color: BODY }}>
                        {stage.premise}
                      </p>

                      <div className="mt-4 space-y-2.5">
                        {tools.map((t) => <ToolRow key={t.slug} t={t} started={started.has(t.slug)} />)}
                      </div>

                      <div className="mt-4 rounded-xl px-4 py-3.5" style={{ background: TINT }}>
                        <p className="text-[15px] font-semibold" style={{ color: INK }}>
                          You finish this stage when:
                        </p>
                        <p className="text-[16px] mt-1" style={{ color: BODY }}>{stage.gate}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </WorkspaceShell>
  );
}

function ToolRow({ t, started }: { t: KitTool; started: boolean }) {
  return (
    <a
      href={`/apps/${t.slug}`}
      className="flex items-start gap-3.5 rounded-xl p-4 transition-colors"
      style={{ border: `1px solid ${LINE}`, textDecoration: "none", background: "#fff" }}
      onMouseOver={(e) => (e.currentTarget.style.background = TINT)}
      onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
    >
      <span
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full mt-0.5"
        style={{ background: started ? BLUE : "#fff", border: `1px solid ${started ? BLUE : LINE}` }}
      >
        {started && <Check className="size-3.5" style={{ color: "#fff" }} />}
      </span>

      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-[17px] font-bold" style={{ color: INK }}>{t.name}</span>
          {t.start && !started && (
            <span
              className="text-[13px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: TINT, color: BLUE }}
            >
              Start here
            </span>
          )}
        </span>
        <span className="block text-[15px] mt-1 leading-relaxed" style={{ color: BODY }}>
          {t.blurb}
        </span>
        <span className="block text-[15px] mt-1.5" style={{ color: MUTED }}>
          You get: {t.output}
        </span>
      </span>

      <ArrowRight className="size-5 shrink-0 mt-1" style={{ color: BLUE }} />
    </a>
  );
}
