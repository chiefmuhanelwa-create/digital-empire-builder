import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — CHKPLT" },
      { name: "description", content: "CHKPLT is a custom-built platform for digital creators who want to own their stack." },
      { property: "og:title", content: "About CHKPLT" },
      { property: "og:description", content: "A custom-built platform for digital creators who want to own their stack." },
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
        <h1 className="mt-4 font-display text-5xl md:text-6xl">A platform built for the work, not the gatekeepers.</h1>
        <div className="mt-10 space-y-6 text-lg text-muted-foreground">
          <p>CHKPLT replaces the patchwork of tools creators rent — checkout, LMS, email, community — with a single owned stack.</p>
          <p>Every subsystem is purpose-built: from Paystack-native checkout to drip-scheduled courses, from broadcast email to affiliate payouts.</p>
          <p>This is Phase 01 — the foundation. Storefront, brand, and authentication. The empire grows from here.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
