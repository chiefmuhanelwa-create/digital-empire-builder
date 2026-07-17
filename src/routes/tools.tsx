import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Free Tools for Contentpreneurs | CHKPLT" },
      {
        name: "description",
        content:
          "Free, practical tools to price your work, sharpen your message, and build owned assets — rate card calculator, hook generator, media kit builder, SARS reserve, and offer builder.",
      },
    ],
  }),
  component: ToolsIndex,
});

function ToolsIndex() {
  return (
    <div className="min-h-screen bg-white text-[var(--foreground)]">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <p className="nx-label mb-3">Free Tools</p>
        <h1 className="mb-4">Practical tools. No fluff.</h1>
        <p className="nx-body max-w-2xl mb-12">
          Free tools to help you price your expertise, sharpen your message, and build assets you
          own. Use them as often as you like — they're yours.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.path}
                to={tool.path}
                className="dash-tile group"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-3 font-display text-xl text-[var(--foreground)] group-hover:text-[var(--nx-gold-text)] transition-colors">
                  {tool.name}
                </span>
                <span className="text-[15px] text-[var(--text-dim)] leading-relaxed">
                  {tool.blurb}
                </span>
                <span className="mt-2 text-sm font-semibold text-[var(--nx-gold-text)]">
                  Open tool →
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-7 sm:p-9">
          <p className="nx-label mb-2">Ready for the system?</p>
          <h2 className="text-2xl sm:text-3xl mb-3">Tools are the start. The Kit is the system.</h2>
          <p className="nx-body max-w-2xl mb-6">
            The Contentpreneur Foundation Kit turns these one-off wins into a repeatable way to
            package and sell your expertise — built for professionals and knowledge creators who
            want income they own.
          </p>
          <Link
            to="/products/$slug"
            params={{ slug: "called-expert-foundation-kit" }}
            className="cta-glow inline-block"
          >
            See the Foundation Kit
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
