import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ContentpreneurHeader, ContentpreneurFooter } from "@/components/contentpreneur-header";
import { MailerLiteEmbedForm } from "@/components/MailerLiteEmbedForm";

// Dedicated, branded landing page for the "Creator Starter Bundle" free lead
// magnet. Exists so the Facebook/ManyChat funnel has somewhere on-brand to
// send people that actually captures their email, instead of delivering the
// bundle natively inside Messenger where no lead ever reaches MailerLite.
//
// Form: swapped to MailerLite's own embedded form (slug "q6qiYX", "Creator
// Bundle Opt-in") per direct instruction 2026-08-06. Delivery of the actual
// bundle is now entirely MailerLite's responsibility — that form must be
// active with a real automation attached before this page goes live for
// real traffic (confirmed via the MailerLite API at swap time: it was not,
// despite already having 45 historical conversions on it).
const MODULES: [string, string][] = [
  [
    "The Niche Clarity Workbook",
    "A 7-step, 90-minute guided workbook to a documented niche and content pillars",
  ],
  ["The PAIDS Framework Workbook", "The complete 5-income-stream implementation guide"],
];

export const Route = createFileRoute("/creator-bundle")({
  head: () => ({
    meta: [
      { title: "Free Creator Starter Bundle — Niche Clarity + PAIDS Map" },
      {
        name: "description",
        content:
          "Two free guided PDFs — the Niche Clarity Workbook and the PAIDS Framework Workbook. Free, no login required.",
      },
    ],
  }),
  component: CreatorBundlePage,
});

function CreatorBundlePage() {
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
              You're posting. You're consistent. Nothing's converting.
            </h1>
            <p className="mt-4 font-display text-sm font-bold uppercase tracking-wide text-banana">
              The Creator Starter Bundle
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              You're missing two things: clarity on your niche, and a real monetisation system. This
              free bundle gives you both — two guided PDFs built specifically for South African
              creators. No card, no catch.
            </p>
          </div>
          <img
            src="/product-covers/creator-starter-bundle-cover.png"
            alt="The Creator Starter Kit — Niche Clarity Workbook + PAIDS Framework Workbook, free"
            className="mx-auto w-full max-w-[280px] rounded-lg shadow-xl"
          />
        </div>
        <div className="mt-10 mx-auto max-w-md">
          <MailerLiteEmbedForm formSlug="q6qiYX" />
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
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Both PDFs, instant access, mobile-friendly. Free — no card required.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-border bg-card/30 p-6 text-center">
          <h3 className="font-display text-xl uppercase">This bundle stops at clarity</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            You'll walk away with a documented niche and a 5-stream income plan. The Foundation Kit
            hands you the system to actually build and price your first offer — the Accelerator
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
