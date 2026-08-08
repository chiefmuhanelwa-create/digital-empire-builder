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
// Verified against the real deliverable PDF (Google Drive, checked 2026-08-08)
// — it's 8 modules, not 7. "Your Lowest Axis" was missing from this list.
const MODULES: [string, string][] = [
  ["The Knowledge Audit", "Find the thing you know that people pay for"],
  ["The Scorecard", "Where you actually stand, across 5 axes"],
  ["Your Lowest Axis", "What to do about it, depending on which one"],
  ["The Positioning Blueprint", "Who you help, and why they should listen"],
  ["Your First Content Engine", "What to talk about, in the right ratio"],
  ["River, Fish, Tank", "Stop building on ground you do not own"],
  ["Your First Offer", "One thing, priced, that someone can buy"],
  ["The PAIDS Map", "Five ways knowledge becomes income"],
];

export const Route = createFileRoute("/starterkit")({
  head: () => ({
    meta: [
      { title: "Free Knowledge Entrepreneur Starter Kit" },
      {
        name: "description",
        content:
          "8 short worksheets to take you from having valuable knowledge with no plan, to a clear next step. Free, no login required.",
      },
    ],
  }),
  component: StarterKitPage,
});

function StarterKitPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentpreneurHeader />

      <section className="mx-auto max-w-4xl px-6 pt-2 sm:pt-20 pb-16">
        <div className="grid gap-2 sm:gap-x-10 sm:gap-y-8 items-center [grid-template-areas:'hook''form''image''description'] sm:[grid-template-areas:'hook_image''description_image''form_form'] sm:grid-cols-[1.1fr_0.9fr]">
          <div className="[grid-area:hook] text-center sm:text-left">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              Free · Delivered By Email + WhatsApp
            </div>
            <h1 className="mt-2 sm:mt-6 font-display text-2xl sm:text-5xl leading-tight sm:leading-[1.05]">
              You already have the knowledge. You just don't have the plan.
            </h1>
            <p className="hidden sm:block mt-4 font-display text-sm font-bold uppercase tracking-wide text-banana">
              The Knowledge Entrepreneur Starter Kit
            </p>
          </div>

          <div className="[grid-area:form] mx-auto w-full max-w-md">
            <MailerLiteEmbedForm formSlug="v3XiMi" />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              We'll email your kit, and WhatsApp you if there's something worth your time — no spam,
              unsubscribe anytime.
            </p>
          </div>

          <img
            src="/product-covers/knowledge-entrepreneur-starter-kit-cover.png"
            alt="The Knowledge Entrepreneur Starter Kit — 7 Worksheets, One Clear Direction"
            className="[grid-area:image] mx-auto w-full max-w-[220px] sm:max-w-[280px] rounded-lg shadow-xl"
          />

          <div className="[grid-area:description] text-center sm:text-left">
            <p className="sm:hidden font-display text-sm font-bold uppercase tracking-wide text-banana">
              The Knowledge Entrepreneur Starter Kit
            </p>
            <p className="mt-2 sm:mt-0 text-lg text-muted-foreground leading-relaxed">
              8 short worksheets that take you from "I have valuable knowledge but no idea what to
              do with it" to a clear next step — your niche named, your positioning written, your
              first offer sketched out. Most people finish it in one sitting.
            </p>
          </div>
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
