import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useKitAccess } from "@/lib/use-kit-access";
import { WorkspaceShell, BLUE, BLUE_DARK, INK, BODY, MUTED, LINE, TINT } from "@/components/workspace-shell";
import { KitDownload } from "@/components/kit-download";
import {
  pathTools, libraryTools, toolsWithWorkbooks, startedSlugs, PATH_LENGTH, type KitTool,
} from "@/lib/kit-catalog";
import { readOffer, assembleSentence, isOfferComplete, EMPTY_OFFER, type Offer } from "@/lib/offer-spine";
import { Lock, ArrowRight, Check, ChevronDown, PlayCircle, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/foundation-kit")({
  head: () => ({ meta: [{ title: "Your Workspace — Contentpreneur Africa" }] }),
  component: Workspace,
});

// THE WORKSPACE.
//
// Rebuilt after the founder walked it as a first-time buyer: "I don't know
// where to start, everything is all over, I do not know what I bought and why
// is it important or where it is leading me."
//
// The cause was structural. This page showed twenty-five equal options and let
// the buyer infer the point. Now it shows ONE promise, ONE next step, and a
// five-step path — with the other twenty tools kept but demoted to a library.
//
// It also finally surfaces the two things the buyer paid for and could not
// reach: the workbooks (the download function existed with no caller) and the
// ten-lesson course (the workspace never mentioned it).
//
// The voice matches the sales page deliberately. Somebody who bought after
// reading "at what point do I start charging" should not land in a product that
// talks like a different company.

function Workspace() {
  const { access, loading } = useKitAccess();
  const [started, setStarted] = useState<Set<string>>(new Set());
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  useEffect(() => {
    setStarted(startedSlugs());
    setOffer(readOffer());
  }, []);

  const path = pathTools();
  const library = libraryTools();
  const workbooks = toolsWithWorkbooks();
  const doneOnPath = path.filter((t) => started.has(t.slug)).length;
  const next = useMemo(() => path.find((t) => !started.has(t.slug)) ?? null, [path, started]);

  if (loading) {
    return <WorkspaceShell><div className="py-32 text-center text-[16px]" style={{ color: MUTED }}>Loading…</div></WorkspaceShell>;
  }

  if (!access) {
    return (
      <WorkspaceShell>
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <Lock className="size-10 mx-auto" style={{ color: MUTED }} />
          <h1 className="mt-5 text-[32px] font-black leading-tight" style={{ color: INK }}>
            Your workspace is part of the Foundation Kit.
          </h1>
          <a href="/foundation" className="mt-7 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
             style={{ background: BLUE, color: "#fff", textDecoration: "none" }}>
            Get the Kit <ArrowRight className="size-4" />
          </a>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main className="mx-auto max-w-3xl px-5 py-10">

        {/* ── WHAT THIS IS. The founder's first question was "I do not know what
             I bought." So the page answers it before anything else. */}
        <section>
          <p className="text-[15px] font-semibold" style={{ color: BLUE }}>Your Foundation Kit</p>
          <h1 className="mt-2 text-[30px] sm:text-[38px] font-black leading-[1.1]" style={{ color: INK }}>
            Five steps, ending the day somebody pays you.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed" style={{ color: BODY }}>
            Not twenty-five things to work out. One path, in order — name what you know, count what
            you have given away, package it, price it, and send it to one person.
          </p>
          <p className="mt-3 text-[17px] leading-relaxed" style={{ color: BODY }}>
            You are the driver. Your knowledge is the cargo. The offer is the delivery — the moment it
            changes hands and money moves. Everything else in here is for after that.{" "}
            <strong style={{ color: INK }}>No delivery, no business. Just mileage.</strong>
          </p>
        </section>

        {/* ── the one next action */}
        {next ? (
          <section className="mt-7 rounded-2xl p-6 sm:p-7" style={{ background: TINT, border: `1px solid ${LINE}` }}>
            <p className="text-[15px] font-semibold" style={{ color: BLUE }}>
              {doneOnPath === 0 ? "Start here" : `Step ${next.path} of ${PATH_LENGTH}`}
            </p>
            <h2 className="mt-2 text-[26px] sm:text-[30px] font-black leading-tight" style={{ color: INK }}>
              {next.name}
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed" style={{ color: BODY }}>{next.blurb}</p>
            <p className="mt-3 text-[16px]" style={{ color: BODY }}>
              <strong style={{ color: INK }}>You'll finish with:</strong> {next.output}
            </p>
            <a href={`/apps/${next.slug}`}
               className="mt-6 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
               style={{ background: BLUE, color: "#fff", textDecoration: "none" }}
               onMouseOver={(e) => (e.currentTarget.style.background = BLUE_DARK)}
               onMouseOut={(e) => (e.currentTarget.style.background = BLUE)}>
              Open this step <ArrowRight className="size-4" />
            </a>
          </section>
        ) : (
          <section className="mt-7 rounded-2xl p-6" style={{ background: TINT, border: `1px solid ${LINE}` }}>
            <h2 className="text-[26px] font-black leading-tight" style={{ color: INK }}>
              You have been through all five steps.
            </h2>
            <p className="mt-2 text-[17px]" style={{ color: BODY }}>
              Come back to any of them whenever the answer changes. They keep what you wrote.
            </p>
          </section>
        )}

        {/* ── their sentence, once it exists */}
        {isOfferComplete(offer) && (
          <section className="mt-5 rounded-2xl p-6" style={{ border: `1px solid ${LINE}` }}>
            <p className="text-[15px] font-semibold" style={{ color: MUTED }}>Your offer, so far</p>
            <p className="mt-2 text-[19px] font-bold leading-relaxed" style={{ color: INK }}>
              &ldquo;{assembleSentence(offer)}&rdquo;
            </p>
          </section>
        )}

        {/* ── the path */}
        <section className="mt-9">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[22px] font-black" style={{ color: INK }}>Your path</h2>
            <span className="text-[15px]" style={{ color: MUTED }}>{doneOnPath} of {PATH_LENGTH} done</span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: LINE }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${Math.round((doneOnPath / PATH_LENGTH) * 100)}%`, background: BLUE }} />
          </div>

          <ol className="mt-5 space-y-3">
            {path.map((t) => <StepRow key={t.slug} t={t} started={started.has(t.slug)} isNext={next?.slug === t.slug} />)}
          </ol>
        </section>

        {/* ── the course. Previously unreachable from this page entirely. */}
        <section className="mt-9 rounded-2xl p-5" style={{ border: `1px solid ${LINE}` }}>
          <div className="flex items-start gap-3.5">
            <PlayCircle className="size-6 shrink-0 mt-0.5" style={{ color: BLUE }} />
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-bold" style={{ color: INK }}>The course · 10 lessons, 51 minutes</h2>
              <p className="mt-1 text-[16px]" style={{ color: BODY }}>
                Watch alongside the steps, or straight through in one sitting. All of it is open now.
              </p>
              <Link to="/learn" className="mt-2.5 inline-flex items-center gap-1.5 text-[15px] font-semibold"
                    style={{ color: BLUE, textDecoration: "none" }}>
                Open the course <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── the workbooks. Promised on the sales page since launch and never
             reachable, because the download function had no caller. */}
        <section className="mt-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          <button onClick={() => setShowFiles(!showFiles)} className="w-full text-left px-5 py-5 flex items-center gap-3.5"
                  style={{ background: showFiles ? TINT : "#fff" }}>
            <FileText className="size-6 shrink-0" style={{ color: BLUE }} />
            <span className="flex-1 min-w-0">
              <span className="block text-[18px] font-bold" style={{ color: INK }}>Your workbooks</span>
              <span className="block text-[15px] mt-0.5" style={{ color: MUTED }}>
                Printable versions of the tools — {workbooks.length} of them
              </span>
            </span>
            <ChevronDown className="size-5 shrink-0 transition-transform"
                         style={{ color: MUTED, transform: showFiles ? "rotate(180deg)" : "none" }} />
          </button>
          {showFiles && (
            <div className="px-5 pb-5 space-y-2.5" style={{ borderTop: `1px solid ${LINE}` }}>
              <p className="text-[15px] pt-4" style={{ color: BODY }}>
                Every one of these opens in a new tab. Print them if you think better on paper.
              </p>
              {workbooks.map((t) => (
                <div key={t.slug} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                     style={{ border: `1px solid ${LINE}` }}>
                  <span className="text-[16px] font-semibold" style={{ color: INK }}>{t.name}</span>
                  <KitDownload pdfKey={t.pdfKey!} label="Download" compact />
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ border: `1px solid ${LINE}` }}>
                <span className="text-[16px] font-semibold" style={{ color: INK }}>The one-page cheat sheet</span>
                <KitDownload pdfKey="cheat-sheet" label="Download" compact />
              </div>
            </div>
          )}
        </section>

        {/* ── the library. Kept, not deleted — just not the front door. */}
        <section className="mt-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
          <button onClick={() => setShowLibrary(!showLibrary)} className="w-full text-left px-5 py-5 flex items-center gap-3.5"
                  style={{ background: showLibrary ? TINT : "#fff" }}>
            <span className="flex-1 min-w-0">
              <span className="block text-[18px] font-bold" style={{ color: INK }}>More tools ({library.length})</span>
              <span className="block text-[15px] mt-0.5" style={{ color: MUTED }}>
                For when you need them. Nothing here is required to finish the path.
              </span>
            </span>
            <ChevronDown className="size-5 shrink-0 transition-transform"
                         style={{ color: MUTED, transform: showLibrary ? "rotate(180deg)" : "none" }} />
          </button>
          {showLibrary && (
            <div className="px-5 pb-5 pt-4 grid gap-2.5 sm:grid-cols-2" style={{ borderTop: `1px solid ${LINE}` }}>
              {library.map((t) => (
                <a key={t.slug} href={`/apps/${t.slug}`} className="rounded-xl p-4"
                   style={{ border: `1px solid ${LINE}`, textDecoration: "none" }}>
                  <span className="flex items-center gap-2">
                    <span className="text-[16px] font-bold" style={{ color: INK }}>{t.name}</span>
                    {started.has(t.slug) && <Check className="size-4" style={{ color: BLUE }} />}
                  </span>
                  <span className="block text-[15px] mt-1 leading-relaxed" style={{ color: BODY }}>{t.blurb}</span>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </WorkspaceShell>
  );
}

function StepRow({ t, started, isNext }: { t: KitTool; started: boolean; isNext: boolean }) {
  return (
    <li>
      <a href={`/apps/${t.slug}`} className="flex items-start gap-4 rounded-2xl p-4"
         style={{ border: `1px solid ${isNext ? BLUE : LINE}`, textDecoration: "none", background: "#fff" }}>
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-[16px] font-black"
              style={{ background: started ? BLUE : TINT, color: started ? "#fff" : BLUE,
                       border: `1px solid ${started ? BLUE : LINE}` }}>
          {started ? <Check className="size-5" /> : t.path}
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-[17px] font-bold" style={{ color: INK }}>{t.name}</span>
            {isNext && (
              <span className="text-[13px] font-bold px-2 py-0.5 rounded-md" style={{ background: TINT, color: BLUE }}>
                You're here
              </span>
            )}
          </span>
          <span className="block text-[15px] mt-1 leading-relaxed" style={{ color: BODY }}>{t.blurb}</span>
          <span className="block text-[15px] mt-1.5" style={{ color: MUTED }}>You get: {t.output}</span>
        </span>
        <ArrowRight className="size-5 shrink-0 mt-1" style={{ color: BLUE }} />
      </a>
    </li>
  );
}
