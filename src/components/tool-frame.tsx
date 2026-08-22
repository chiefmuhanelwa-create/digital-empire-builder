import { Link } from "@tanstack/react-router";
import { WorkspaceShell, BLUE, INK, BODY, MUTED, LINE, TINT } from "@/components/workspace-shell";
import { KitDownload } from "@/components/kit-download";
import { toolBySlug, nextInPath, prevInPath, PATH_LENGTH } from "@/lib/kit-catalog";
import { ArrowLeft, ArrowRight, PlayCircle, Check } from "lucide-react";

// THE TOOL PAGE TEMPLATE.
//
// Founder feedback on the kit, verbatim: "tools are just there, generic,
// filling forms... no instructions, no explanations, coaching nor leading...
// I do not know what I bought and why is it important or where it is leading."
//
// Every one of those is a missing frame, not a missing feature. The tools do
// real work; they just never said where the buyer was, why this step existed,
// what a good answer looked like, or what came next. This supplies all four in
// the same order on every page, so the shape of a step becomes familiar by the
// second one:
//
//   where am I  ->  why this matters  ->  an example  ->  the work  ->
//   what I now have  ->  what's next
//
// Tool bodies are passed as children and are not touched.
//
// SHIPPED AS TWO PIECES, NOT ONE WRAPPER. Replacing each tool's whole layout
// would mean rewriting six working files and discarding heroes that are
// genuinely good (The Leak states the problem before asking for anything).
// <ToolHeader> and <ToolFooter> slot into what is already there — two small
// edits per tool instead of a rewrite — and <ToolFrame> composes both for any
// tool that wants the full treatment.

export function ToolHeader({ slug, why }: { slug: string; why?: string }) {
  const tool = toolBySlug(slug);
  const step = tool?.path ?? null;

  return (
    <div className="mb-7">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          to="/dashboard/foundation-kit"
          className="inline-flex items-center gap-1.5 text-[15px] font-semibold"
          style={{ color: BLUE, textDecoration: "none" }}
        >
          <ArrowLeft className="size-4" /> All tools
        </Link>
        {step && (
          <span className="text-[15px] font-semibold" style={{ color: MUTED }}>
            Step {step} of {PATH_LENGTH}
          </span>
        )}
      </div>

      {step && (
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: PATH_LENGTH }, (_, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < step ? BLUE : LINE }} />
          ))}
        </div>
      )}

      {why && (
        <p className="mt-4 text-[17px] leading-relaxed" style={{ color: BODY }}>
          {why}
        </p>
      )}

      {(tool?.lessonSlug || tool?.pdfKey) && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {tool?.lessonSlug && (
            <Link
              to="/learn/$slug/$lessonSlug"
              params={{ slug: "called-expert-foundation-kit", lessonSlug: tool.lessonSlug }}
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold"
              style={{ color: BLUE, textDecoration: "none" }}
            >
              <PlayCircle className="size-4" /> Watch the lesson first
            </Link>
          )}
          {tool?.pdfKey && <KitDownload pdfKey={tool.pdfKey} label="Download the workbook" compact />}
        </div>
      )}
    </div>
  );
}

export function ToolFooter({ slug, youNowHave }: { slug: string; youNowHave?: string }) {
  const tool = toolBySlug(slug);
  const next = nextInPath(slug);
  const prev = prevInPath(slug);

  return (
    <>
      <div className="mt-10 rounded-2xl p-5" style={{ background: TINT, border: `1px solid ${LINE}` }}>
        <p className="inline-flex items-center gap-2 text-[15px] font-bold" style={{ color: INK }}>
          <Check className="size-4" style={{ color: BLUE }} />
          When this step is done you have
        </p>
        <p className="mt-1.5 text-[16px]" style={{ color: BODY }}>
          {youNowHave ?? tool?.output ?? "your answers saved."}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
        {prev ? (
          <a
            href={`/apps/${prev.slug}`}
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold"
            style={{ color: MUTED, textDecoration: "none" }}
          >
            <ArrowLeft className="size-4" /> {prev.name}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a
            href={`/apps/${next.slug}`}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[16px] font-bold"
            style={{ background: BLUE, color: "#fff", textDecoration: "none" }}
          >
            Next: {next.name} <ArrowRight className="size-4" />
          </a>
        ) : (
          <Link
            to="/dashboard/foundation-kit"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[16px] font-bold"
            style={{ background: BLUE, color: "#fff", textDecoration: "none" }}
          >
            Back to your path <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </>
  );
}

export function ToolFrame({
  slug,
  why,
  youNowHave,
  children,
}: {
  slug: string;
  /** Why this step exists, in the buyer's terms. Two sentences at most. */
  why: string;
  /** What they are holding when they leave. Falls back to the catalog's output. */
  youNowHave?: string;
  children: React.ReactNode;
}) {
  const tool = toolBySlug(slug);
  const next = nextInPath(slug);
  const prev = prevInPath(slug);
  const step = tool?.path ?? null;

  return (
    <WorkspaceShell>
      <main className="mx-auto max-w-3xl px-5 py-9">
        {/* ── where am I */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            to="/dashboard/foundation-kit"
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold"
            style={{ color: BLUE, textDecoration: "none" }}
          >
            <ArrowLeft className="size-4" /> All tools
          </Link>
          {step && (
            <span className="text-[15px] font-semibold" style={{ color: MUTED }}>
              Step {step} of {PATH_LENGTH}
            </span>
          )}
        </div>

        {step && (
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: PATH_LENGTH }, (_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: i < step ? BLUE : LINE }}
              />
            ))}
          </div>
        )}

        <h1 className="mt-5 text-[30px] sm:text-[38px] font-black leading-[1.1]" style={{ color: INK }}>
          {tool?.name ?? "Tool"}
        </h1>

        {/* ── why this matters */}
        <p className="mt-3 text-[17px] leading-relaxed" style={{ color: BODY }}>
          {why}
        </p>

        {/* ── watch first / workbook */}
        {(tool?.lessonSlug || tool?.pdfKey) && (
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {tool?.lessonSlug && (
              <Link
                to="/learn/$slug/$lessonSlug"
                params={{ slug: "called-expert-foundation-kit", lessonSlug: tool.lessonSlug }}
                className="inline-flex items-center gap-1.5 text-[15px] font-semibold"
                style={{ color: BLUE, textDecoration: "none" }}
              >
                <PlayCircle className="size-4" /> Watch the lesson first
              </Link>
            )}
            {tool?.pdfKey && <KitDownload pdfKey={tool.pdfKey} label="Download the workbook" compact />}
          </div>
        )}

        {/* ── the work */}
        <div className="mt-8">{children}</div>

        {/* ── what I now have */}
        <div className="mt-10 rounded-2xl p-5" style={{ background: TINT, border: `1px solid ${LINE}` }}>
          <p className="inline-flex items-center gap-2 text-[15px] font-bold" style={{ color: INK }}>
            <Check className="size-4" style={{ color: BLUE }} />
            When this step is done you have
          </p>
          <p className="mt-1.5 text-[16px]" style={{ color: BODY }}>
            {youNowHave ?? tool?.output ?? "your answers saved."}
          </p>
        </div>

        {/* ── what's next */}
        <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
          {prev ? (
            <a
              href={`/apps/${prev.slug}`}
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold"
              style={{ color: MUTED, textDecoration: "none" }}
            >
              <ArrowLeft className="size-4" /> {prev.name}
            </a>
          ) : (
            <span />
          )}

          {next ? (
            <a
              href={`/apps/${next.slug}`}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[16px] font-bold"
              style={{ background: BLUE, color: "#fff", textDecoration: "none" }}
            >
              Next: {next.name} <ArrowRight className="size-4" />
            </a>
          ) : (
            <Link
              to="/dashboard/foundation-kit"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[16px] font-bold"
              style={{ background: BLUE, color: "#fff", textDecoration: "none" }}
            >
              Back to your path <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </main>
    </WorkspaceShell>
  );
}
