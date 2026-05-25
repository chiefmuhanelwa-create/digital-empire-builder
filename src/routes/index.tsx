import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CHKPLT — Tools and courses for creators" },
      { name: "description", content: "Free guides, paid workbooks, courses and mentorship to help South African creators grow their audience, brand and income." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,oklch(0.62_0.16_75/0.10),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-32 md:pt-36">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
            For creators
          </div>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl lg:text-8xl max-w-4xl">
            Grow your brand.<br />
            <em className="text-banana not-italic">Get paid for it.</em>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-muted-foreground">
            CHKPLT gives creators the workbooks, courses and mentorship to turn an audience
            into income — without selling out or burning out.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-banana text-banana-foreground hover:bg-banana/90">
              <Link to="/products">Browse the shop <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">What is CHKPLT?</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24 grid gap-12 md:grid-cols-3">
          {[
            { n: "01", t: "Learn", d: "Workbooks and courses that teach you exactly what to do next." },
            { n: "02", t: "Build", d: "Frameworks for niche clarity, personal branding, content and offers." },
            { n: "03", t: "Earn", d: "Paid products, brand deals, affiliates and services — diversified income." },
          ].map((p) => (
            <div key={p.n} className="border-t border-border pt-6">
              <div className="font-mono text-xs text-banana">{p.n}</div>
              <h3 className="mt-4 font-display text-3xl">{p.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24 flex flex-col items-start gap-6">
          <h2 className="font-display text-4xl md:text-5xl max-w-2xl">
            Ready to take your creator business seriously?
          </h2>
          <Button asChild size="lg" className="bg-banana text-banana-foreground hover:bg-banana/90">
            <Link to="/signup">Create your account <ArrowRight /></Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
