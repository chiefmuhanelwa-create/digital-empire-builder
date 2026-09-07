import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { TOOLS, TOOL_CATEGORY_ORDER, type Tool } from "@/lib/tools";
import { useToolView } from "@/lib/tool-analytics";
import { ToolCanvas, DotGrid, GoldGlow, Eyebrow, Pill } from "@/components/tools/premium";

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
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#7C3AED] transition group-hover:bg-[#8B5CF6] group-hover:text-white">
          <Icon className="h-5 w-5" />
        </span>
        <Pill tone={tool.tier === "premium" ? "dark" : "outline"}>
          {tool.tier === "premium" ? "Premium" : "Free"}
        </Pill>
      </div>
      <span className="mt-4 block font-display text-[19px] font-bold tracking-tight text-[#1A1523]">
        {tool.name}
      </span>
      <span className="mt-1.5 block text-[14.5px] leading-relaxed text-neutral-600">
        {tool.blurb}
      </span>
      <span className="mt-4 block text-[13px] font-bold text-[#7C3AED]">
        {tool.external ? "Open tool \u2197" : "Open tool \u2192"}
      </span>
    </>
  );

  const cls =
    "group flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-5 " +
    "shadow-[0_2px_10px_-4px_rgba(28,28,28,0.08)] transition " +
    "hover:-translate-y-0.5 hover:border-[#8B5CF6]/60 hover:shadow-[0_18px_40px_-22px_rgba(28,28,28,0.35)]";

  if (tool.external) {
    return (
      <a href={tool.path} target="_blank" rel="noopener noreferrer" className={cls}>
        {body}
      </a>
    );
  }
  return (
    <Link to={tool.path} className={cls}>
      {body}
    </Link>
  );
}

function ToolsIndex() {
  useToolView("tools-hub");
  return (
    <div className="min-h-screen overflow-x-clip bg-[#F5F3FF]">
      <SiteHeader />
      <ToolCanvas>
        <main className="mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
          <BackNav to="/" label="Home" className="mb-6" />
          <Eyebrow>Contentpreneur · Toolkit</Eyebrow>
          <h1 className="mt-5 font-display text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#1A1523] sm:text-[52px]">
            Practical tools.
            <br />
            <span className="text-[#8B5CF6]">No fluff.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-neutral-600 sm:text-[17px]">
            Price your work, manage your money, and sharpen your message — grouped by what you're
            actually trying to do. Free, and yours to use as often as you like.
          </p>
          <div className="mb-14 mt-6 h-[3px] w-16 rounded-full bg-[#8B5CF6]" />

          {TOOL_CATEGORY_ORDER.map((category) => {
            const tools = TOOLS.filter((t) => t.category === category);
            if (tools.length === 0) return null;
            return (
              <section key={category} className="mb-14">
                <h2 className="mb-5 font-display text-[22px] font-bold tracking-tight text-[#1A1523] sm:text-[26px]">
                  {category}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {tools.map((tool) => (
                    <ToolTile key={tool.name} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })}

          <div className="relative mt-4 overflow-hidden rounded-3xl bg-[#1A1523] p-7 sm:p-10">
            <DotGrid dark />
            <GoldGlow className="-bottom-40 -right-24" size={480} opacity={0.7} />
            <div className="relative">
              <Eyebrow className="!text-[#8B5CF6]">Ready for the system?</Eyebrow>
              <h2 className="mb-3 mt-4 font-display text-[26px] font-extrabold leading-tight tracking-tight text-white sm:text-[34px]">
                Tools are the start.
                <br />
                The Kit is the system.
              </h2>
              <p className="mb-7 max-w-2xl text-[15.5px] leading-relaxed text-white/70">
                The Contentpreneur Foundation Kit turns these one-off wins into a repeatable way to
                package and sell your expertise — built for professionals and knowledge creators who
                want income they own.
              </p>
              <Link
                to="/products/$slug"
                params={{ slug: "called-expert-foundation-kit" }}
                className="inline-flex min-h-[54px] items-center rounded-xl bg-[#8B5CF6] px-8 text-[15px] font-bold text-white transition hover:brightness-110"
              >
                See the Foundation Kit →
              </Link>
            </div>
          </div>
        </main>
      </ToolCanvas>

      <SiteFooter />
    </div>
  );
}
