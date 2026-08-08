import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ContentpreneurHeader, ContentpreneurFooter } from "@/components/contentpreneur-header";
import { MailerLiteEmbedForm } from "@/components/MailerLiteEmbedForm";

// Dedicated, branded landing page for the "Creator Starter Bundle" free lead
// magnet. Exists so the Facebook/ManyChat funnel has somewhere on-brand to
// send people that actually captures their email, instead of delivering the
// bundle natively inside Messenger where no lead ever reaches MailerLite.
//
// Form: MailerLite's own embedded form (slug "BPvaab", "Creator Bundle
// Opt-in v2") per direct instruction 2026-08-08 — replaces the original
// "q6qiYX" form. Delivery of the actual bundle is entirely MailerLite's
// responsibility — confirmed via the MailerLite API at swap time that this
// form is still inactive with no automation attached, same gap as before.
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

      <section className="mx-auto max-w-4xl px-6 pt-2 sm:pt-20 pb-16">
        <div className="grid gap-2 sm:gap-x-10 sm:gap-y-8 items-center [grid-template-areas:'hook''form''image''description'] sm:[grid-template-areas:'hook_image''description_image''form_form'] sm:grid-cols-[1.1fr_0.9fr]">
          <div className="[grid-area:hook] text-center sm:text-left">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              Free · Delivered By Email + Phone
            </div>
            <h1 className="mt-2 sm:mt-6 font-display text-2xl sm:text-5xl leading-tight sm:leading-[1.05]">
              You're posting. You're consistent. Nothing's converting.
            </h1>
            <p className="hidden sm:block mt-4 font-display text-sm font-bold uppercase tracking-wide text-banana">
              The Creator Starter Bundle
            </p>
          </div>

          <div className="[grid-area:form] mx-auto w-full max-w-md">
            <MailerLiteEmbedForm formSlug="BPvaab" />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              We'll email both PDFs straight away, and may call or message about the bundle — no
              spam, unsubscribe anytime.
            </p>
          </div>

          <div className="[grid-area:image] mx-auto w-full max-w-[220px] sm:max-w-[280px] rounded-xl border-4 border-banana bg-card p-4 shadow-xl">
            <img
              src="/product-covers/creator-starter-bundle-cover.png"
              alt="The Creator Starter Kit — Niche Clarity Workbook + PAIDS Framework Workbook, free"
              className="w-full h-auto"
            />
          </div>

          <div className="[grid-area:description] text-center sm:text-left">
            <p className="sm:hidden font-display text-sm font-bold uppercase tracking-wide text-banana">
              The Creator Starter Bundle
            </p>
            <p className="mt-2 sm:mt-0 text-lg text-muted-foreground leading-relaxed">
              You're missing two things: clarity on your niche, and a real monetisation system. This
              free bundle gives you both — two guided PDFs built specifically for South African
              creators. No card, no catch.
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
