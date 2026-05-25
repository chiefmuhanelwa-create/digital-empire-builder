import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Christ Kingdom Platform" },
      { name: "description", content: "Christ Kingdom Platform is a home for Kingdom Contentpreneurs offering workbooks, courses and mentorship to help you grow your brand and income." },
      { property: "og:title", content: "About Christ Kingdom Platform" },
      { property: "og:description", content: "Workbooks, courses and mentorship for Kingdom Contentpreneurs." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">About</div>
        <h1 className="mt-4 font-display text-5xl md:text-6xl">Built for Kingdom Contentpreneurs who want a real business — not just a feed.</h1>
        <div className="mt-10 space-y-6 text-lg text-muted-foreground">
          <p>Christ Kingdom Platform is a home for the workbooks, courses, frameworks and mentorship that help Kingdom Contentpreneurs turn their content into a sustainable income.</p>
          <p>Everything we sell is built to give you a real win: niche clarity, a stronger personal brand, multiple income streams, and the tax know-how to keep what you earn.</p>
          <p>Start with a free guide, grab a workbook when you're ready, and join a premium program when you go full-time.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
