import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

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
// public/tools/rate-card/index.html with exactly 3 surgical edits (its own
// <header>/<footer> hidden via inline style so it doesn't duplicate CHKPLT's
// SiteHeader/SiteFooter, and its one relative /api/send-rate-card fetch made
// absolute so email-delivery keeps hitting its own already-working Vercel
// backend). Every calculation, input, and pixel of the tool's own UI is
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
      <iframe
        ref={iframeRef}
        src="/tools/rate-card/index.html"
        title="Rate Card Calculator"
        style={{ width: "100%", height, border: "none", display: "block" }}
      />
      <SiteFooter />
    </div>
  );
}
