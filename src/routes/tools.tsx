import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { TOOLS, TOOL_CATEGORY_ORDER, type Tool } from "@/lib/tools";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Tools for Contentpreneurs | CHKPLT" },
      {
        name: "description",
        content:
          "Practical tools for brand deals, creator finance, and content creation — rate card calculator, invoice generator, hook generator, media kit builder, SARS reserve, and more.",
      },
    ],
  }),
  component: ToolsIndex,
});

function ToolTile({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const body = (
    <>
      <div className="flex w-full items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]">
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            tool.tier === "premium" ? "bg-[#111] text-white" : "bg-[#EAF6EE] text-[#1E7A3D]"
          }`}
        >
          {tool.tier === "premium" ? "Premium" : "Free"}
        </span>
      </div>
      <span className="mt-3 font-display text-xl text-[var(--foreground)] group-hover:text-[var(--nx-gold-text)] transition-colors">
        {tool.name}
      </span>
      <span className="text-[15px] text-[var(--text-dim)] leading-relaxed">{tool.blurb}</span>
      <span className="mt-2 text-sm font-semibold text-[var(--nx-gold-text)]">
        {tool.external ? "Open tool ↗ (opens in a new tab)" : "Open tool →"}
      </span>
    </>
  );

  if (tool.external) {
    return (
      <a href={tool.path} target="_blank" rel="noopener noreferrer" className="dash-tile group">
        {body}
      </a>
    );
  }
  return (
    <Link to={tool.path} className="dash-tile group">
      {body}
    </Link>
  );
}

function ToolsIndex() {
  return (
    <div className="min-h-screen bg-white text-[var(--foreground)]">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <BackNav to="/" label="Home" className="mb-6" />
        <p className="nx-label mb-3">Tools</p>
        <h1 className="mb-4">Practical tools. No fluff.</h1>
        <p className="nx-body max-w-2xl mb-12">
          Tools to price your work, manage your money, and sharpen your message — grouped by what
          you're actually trying to do. Use them as often as you like.
        </p>

        {TOOL_CATEGORY_ORDER.map((category) => {
          const tools = TOOLS.filter((t) => t.category === category);
          if (tools.length === 0) return null;
          return (
            <section key={category} className="mb-14">
              <h2 className="mb-5 text-xl sm:text-2xl">{category}</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {tools.map((tool) => (
                  <ToolTile key={tool.name} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-7 sm:p-9">
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
