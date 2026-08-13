import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";

export const Route = createFileRoute("/rate-card")({
  head: () => ({
    meta: [
      { title: "Free Rate Card Calculator — what brands should pay you (SA benchmarks) | CHKPLT" },
      {
        name: "description",
        content:
          "Stop undercharging. Get a defensible brand-deal rate built on real South African CPM benchmarks, your engagement, and the deliverable — in seconds. Free.",
      },
      { property: "og:title", content: "Free Rate Card Calculator — CHKPLT" },
    ],
  }),
  component: RateCardPage,
});

// Founder's explicit instruction: adapt the standalone RateCard Pro tool
// (nochill-rate-card.vercel.app / product-lab/web-tools/rate-card-calculator)
// AS-IS, no changes to the calculator itself — just match CHKPLT's site chrome.
// Implementation: the tool's own index.html is copied VERBATIM into
// public/tools/rate-card/index.html with a few surgical edits (its own
// <header>/<footer> hidden via inline style so it doesn't duplicate CHKPLT's
// SiteHeader/SiteFooter; its send fetch now pointed at CHKPLT's own
// /api/public/rate-card instead of the old nochill-rate-card.vercel.app
// endpoint, whose MailerLite capture had been silently dropping every lead;
// and an upsell line added to the success message). Every calculation,
// input, and pixel of the tool's own UI is
// untouched — diffed against the source file to confirm. It's same-origin
// (served from chkplt.com's own /tools/rate-card/), so this wrapper can
// safely read the iframe's real content height and resize to fit — no
// arbitrary vh guess, no double scrollbar, and no edit to the tool's file.
function RateCardPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1400);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: ResizeObserver | undefined;
    const sync = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      setHeight(doc.body.scrollHeight);
      if (!observer) {
        observer = new ResizeObserver(() => setHeight(doc.body.scrollHeight));
        observer.observe(doc.body);
      }
    };

    iframe.addEventListener("load", sync);
    sync();
    return () => {
      iframe.removeEventListener("load", sync);
      observer?.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <div className="px-5 py-3 sm:px-6">
        <BackNav to="/tools" label="All tools" />
      </div>
      <iframe
        ref={iframeRef}
        src="/tools/rate-card/index.html"
        title="Rate Card Calculator"
        style={{ width: "100%", height, border: "none", display: "block" }}
      />

      {/* The calculator answers "what am I worth?" — this answers "how do I ask
          for it?", which is the only reason the number is useful. Lives in the
          CHKPLT wrapper rather than inside the tool's own HTML so it stays a
          real internal route (client-side nav, no reload) and the tool file
          keeps its verbatim-copy status. */}
      <section className="border-t border-neutral-200 bg-[#FAF7F0] px-5 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C9A84C]">
            Now go and get it
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold text-[#111] sm:text-3xl">
            You know your number. Now send the pitch.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-700">
            Knowing your rate is half of it. Most creators still never send the email — or send one
            that gets ghosted. <strong>Your First Brand Deal Script</strong> is the 4-Part Pitch
            plus the word-for-word cold, warm and upgrade scripts, the WhatsApp DM version, and the
            counter-offer reply for when a brand lowballs the rate you just calculated.
          </p>
          <Link
            to="/products/$slug"
            params={{ slug: "first-brand-deal-script" }}
            className="mt-7 inline-block rounded-lg bg-[#111] px-8 py-4 text-[15px] font-bold text-white transition hover:bg-[#C9A84C] hover:text-[#111]"
          >
            Get the Brand Deal Script →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
