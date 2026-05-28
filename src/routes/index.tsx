import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Christ Kingdom Platform — Tools and courses for Kingdom Contentpreneurs" },
      { name: "description", content: "Free guides, paid workbooks, courses and mentorship to help Kingdom Contentpreneurs grow their audience, brand and income." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden nx-hero-orb">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24 md:pt-32 md:pb-32">
          <span className="nx-status-live">
            <span className="nx-live-dot" aria-hidden /> Live · Kingdom Cohort Open
          </span>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl md:text-7xl lg:text-8xl max-w-4xl">
            Build your brand.<br />
            <em className="text-banana not-italic">Monetize your calling.</em>
          </h1>
          <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground">
            Christ Kingdom Platform gives Kingdom Contentpreneurs the workbooks, courses
            and mentorship to turn an audience into income — without selling out or burning out.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
            <Button asChild size="lg" className="cta-glow w-full sm:w-auto">
              <Link to="/products">Browse resources <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link to="/about">What is CHKPLT?</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-20 md:py-24 grid gap-8 sm:gap-12 md:grid-cols-3">
          {[
            { n: "01", t: "Learn", d: "Workbooks and courses that teach you exactly what to do next." },
            { n: "02", t: "Build", d: "Frameworks for niche clarity, personal branding, content and offers." },
            { n: "03", t: "Earn", d: "Paid products, brand deals, affiliates and services — multiple income streams." },
          ].map((p) => (
            <div key={p.n} className="border-t border-border pt-5 sm:pt-6">
              <div className="font-mono text-xs text-banana">{p.n}</div>
              <h3 className="mt-3 sm:mt-4 font-display text-2xl sm:text-3xl">{p.t}</h3>
              <p className="mt-2 sm:mt-3 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-20 md:py-24 flex flex-col items-start gap-5 sm:gap-6">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl max-w-2xl">
            Ready to take your Kingdom content business seriously?
          </h2>
          <Button asChild size="lg" className="cta-glow w-full sm:w-auto">
            <Link to="/signup">Join the community <ArrowRight /></Link>
          </Button>
        </div>
      </section>


      <SiteFooter />
    </div>
  );
}
