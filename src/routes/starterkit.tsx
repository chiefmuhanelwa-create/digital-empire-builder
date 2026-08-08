import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ContentpreneurHeader, ContentpreneurFooter } from "@/components/contentpreneur-header";
import { MailerLiteEmbedForm } from "@/components/MailerLiteEmbedForm";

// The free Knowledge Entrepreneur Starter Kit — moved here from the separate
// contentpreneur-africa-site (Next.js) so it lives entirely on CHKPLT's proven
// checkout/lead-capture stack, reachable at contentpreneur.africa/starterkit.
// Content ported verbatim from that site's app/start/page.tsx.
//
// Form: swapped to MailerLite's own embedded form (slug "v3XiMi", "Starter
// Kit Opt-in") per direct instruction 2026-08-06. Delivery of the actual kit
// is now entirely MailerLite's responsibility — that form must be active
// with a real automation attached before this page goes live for real
// traffic (confirmed via the MailerLite API at swap time: it was not).
const MODULES: [string, string][] = [
  ["The Knowledge Audit", "Identify your monetizable knowledge"],
  ["The Knowledge Entrepreneur Scorecard", "Where you actually stand, across 5 axes"],
  ["The Positioning Blueprint", "Who you help, what you help with, why they should listen"],
  ["Your First Content Engine", "Know what to talk about"],
  ["The River → Fish → Tank Framework", "Stop building only on rented platforms"],
  ["Your First Offer", "Create your first paid asset"],
  ["The PAIDS Map", "Your future income roadmap, in 5 streams"],
];

export const Route = createFileRoute("/starterkit")({
  head: () => ({
    meta: [
      { title: "Free Knowledge Entrepreneur Starter Kit" },
      {
        name: "description",
        content:
          "7 short worksheets to take you from having valuable knowledge with no plan, to a clear next step. Free, no login required.",
      },
    ],
  }),
  component: StarterKitPage,
});

function StarterKitPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentpreneurHeader />

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16">
        <div className="grid items-center gap-10 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="text-center sm:text-left">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              Free · No Login Required
            </div>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl leading-[1.05]">
              You already have the knowledge. You just don't have the plan.
            </h1>
            <p className="mt-4 font-display text-sm font-bold uppercase tracking-wide text-banana">
              The Knowledge Entrepreneur Starter Kit
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              7 short worksheets that take you from "I have valuable knowledge but no idea what to
              do with it" to a clear next step — your niche named, your positioning written, your
              first offer sketched out. Most people finish it in one sitting.
            </p>
          </div>
          <img
            src="/product-covers/knowledge-entrepreneur-starter-kit-cover.png"
            alt="The Knowledge Entrepreneur Starter Kit — 7 Worksheets, One Clear Direction"
            className="mx-auto w-full max-w-[280px] rounded-lg shadow-xl"
          />
        </div>
        <div className="mt-10 mx-auto max-w-md">
          <MailerLiteEmbedForm formSlug="v3XiMi" />
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="text-center font-display text-3xl">What's Inside</h2>
          <div className="mt-8 divide-y divide-border border border-border bg-background">
            {MODULES.map(([title, desc], i) => (
              <div key={title} className="flex items-start gap-4 p-5">
                <span className="font-display text-sm font-black text-banana">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-display text-sm font-bold">{title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-border bg-card/30 p-6 text-center">
          <h3 className="font-display text-xl uppercase">This kit stops at clarity</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            You'll walk away knowing your niche, your positioning, and your first offer. The
            Foundation Kit hands you the system to actually build and price it — the Accelerator
            installs the whole seven-stage system with you, faster.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/foundation"
              className="inline-flex items-center gap-2 rounded-md bg-banana px-6 py-3 font-display text-sm font-black uppercase tracking-wide text-banana-foreground hover:bg-banana/90"
            >
              Get the Foundation Kit <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/accelerator"
              className="inline-flex items-center gap-2 rounded-md border border-banana px-6 py-3 font-mono text-sm uppercase tracking-[0.15em] text-foreground hover:bg-banana hover:text-banana-foreground transition-colors"
            >
              Apply for the Accelerator
            </Link>
          </div>
        </div>
      </section>

      <ContentpreneurFooter />
    </div>
  );
}
