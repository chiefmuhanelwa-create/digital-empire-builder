import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, X, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contentpreneur — Build a Kingdom business that scales with honor" },
      {
        name: "description",
        content:
          "Digital systems, audience acquisition funnels, and tax compliance frameworks for Kingdom Contentpreneurs. Built on faith, ethics, and generational impact.",
      },
      { property: "og:title", content: "Contentpreneur — Build a Kingdom business that scales with honor" },
      {
        property: "og:description",
        content:
          "From unprotected creator to fully compliant Contentpreneur. Honor-led systems for ambitious creators in Africa and beyond.",
      },
    ],
  }),
  component: Landing,
});

const PROBLEMS = [
  "Chasing vanity metrics, algorithms, and fleeting internet fame that exhausts your spirit.",
  "Operating with compromise, shaky ethics, or unprotected contracts that risk your integrity.",
  "Stressing over tax season or gray-area bookkeeping because your corporate foundation is out of alignment.",
];

const SOLUTIONS = [
  "Treating your platform and audience as a sacred, trusted distribution asset.",
  "Locking down your digital empire with ironclad, honest, and transparent legal foundations.",
  "Building a scalable enterprise that honors God through immaculate bookkeeping, automated tax splits, and absolute compliance.",
];

const STAGES = [
  {
    n: "STAGE 01",
    t: "Purpose Alignment & Authority",
    d: "Positioning your creative gift with maximum authority. Turning tactical how-tos, transformative storytelling, and your unique testimony into premium content that honors your calling.",
  },
  {
    n: "STAGE 02",
    t: "Automated Asset Capture",
    d: "Building clean, automated DM gateways and landing bridges. Serving your neighbors by delivering high-value toolkits instantly in exchange for their email, building an owned community on a foundation of trust.",
  },
  {
    n: "STAGE 03",
    t: "The Qualification Firewall",
    d: "Implementing an intentional multi-question application flow. This automatically filters out casual seekers and protects your time, reserving your strategic energy for those fully committed to scaling a righteous business.",
  },
  {
    n: "STAGE 04",
    t: "The Diagnostic Session",
    d: "Running structured strategy briefings. A clinical, truth-centered approach to uncover monetization bottlenecks, fix structural alignment gaps, and present the system as the path to professional freedom.",
  },
  {
    n: "STAGE 05",
    t: "Enterprise Execution",
    d: "Transitioning to a structured curriculum, community coaching, and direct workflow implementations to scale your revenue and widen your kingdom footprint.",
  },
];

const NOT_FOR = [
  "Dishonest tactics, shortcut seekers, or compromised business ethics.",
  "Short-term thinkers chasing vanity metrics over sustainable bottom-line revenue.",
  "Individuals unwilling to do the heavy daily execution work.",
  "Anyone not 100% committed to building a legally compliant, God-honoring corporate foundation.",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* 1. HERO */}
      <section className="relative overflow-hidden nx-hero-orb">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24 md:pt-32 md:pb-32">
          <span className="nx-status-live">
            <span className="nx-live-dot" aria-hidden /> Now Accepting Applicants — Cohort 01
          </span>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl md:text-7xl lg:text-[5.5rem] max-w-5xl tracking-tight">
            Stop posting for likes.
            <br />
            Start{" "}
            <em className="text-banana not-italic">owning a Kingdom business</em>{" "}
            that scales with honor.
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            The exact digital systems, audience acquisition funnels, and tax compliance frameworks
            to transition from an unprotected creator into a highly profitable, fully compliant
            Contentpreneur — built securely on a foundation of faith, ethics, and generational impact.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
            <Button asChild size="lg" className="cta-glow w-full sm:w-auto">
              <Link to="/signup">
                Apply for Cohort 01 <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link to="/about">Read our standards</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. CONTEXT SHIFT — TRANSFORMATION MATRIX */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-20 md:py-28">
          <div className="nx-label">The Context Shift</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl max-w-3xl">
            From worldly hustle to{" "}
            <em className="text-banana not-italic">Kingdom stewardship.</em>
          </h2>

          <div className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-2">
            <div className="nx-card">
              <h3 className="font-display text-2xl sm:text-3xl text-destructive">
                ✕ The Worldly Hustle
              </h3>
              <ul className="mt-6 space-y-4">
                {PROBLEMS.map((p) => (
                  <li key={p} className="flex gap-3 text-sm sm:text-base text-muted-foreground">
                    <X className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nx-card">
              <h3 className="font-display text-2xl sm:text-3xl text-banana">
                ✦ Kingdom Stewardship
              </h3>
              <ul className="mt-6 space-y-4">
                {SOLUTIONS.map((s) => (
                  <li key={s} className="flex gap-3 text-sm sm:text-base text-foreground/85">
                    <Check className="mt-0.5 size-5 shrink-0 text-banana" aria-hidden />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 5-STAGE SYSTEM */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-20 md:py-28">
          <div className="nx-label">The Structural Core</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl max-w-3xl">
            The five stages from creator to{" "}
            <em className="text-banana not-italic">compliant Kingdom enterprise.</em>
          </h2>

          <div className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s, i) => (
              <div
                key={s.n}
                className={
                  "nx-card flex flex-col " +
                  (i === 4 ? "lg:col-span-3 md:col-span-2" : "")
                }
              >
                <div className="font-mono text-xs tracking-[0.3em] text-banana">{s.n}</div>
                <h3 className="mt-3 font-display text-2xl sm:text-[26px] leading-tight">
                  {s.t}
                </h3>
                <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE NOT-FOR GATE (ANTI-SELL) */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-14 sm:py-20 md:py-28">
          <div className="nx-status-live" style={{ color: "var(--nx-orange-deep)" }}>
            <span className="nx-live-dot" aria-hidden /> The Data Sanctuary
          </div>

          <div className="mt-6 nx-antisell">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl">
              The CHKPLT Program is strictly closed to:
            </h2>
            <ul className="mt-7 space-y-2.5">
              {NOT_FOR.map((line) => (
                <li key={line} className="nx-antisell-item flex items-start gap-3 normal-case tracking-normal">
                  <Lock className="mt-0.5 size-4 shrink-0 text-banana" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-col items-start gap-5">
            <p className="font-display text-xl sm:text-2xl max-w-2xl">
              If that resonates,{" "}
              <em className="text-banana not-italic">you're in the right place.</em>
            </p>
            <Button asChild size="lg" className="cta-glow w-full sm:w-auto">
              <Link to="/signup">
                Begin your application <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5. SIGNATURE SEAL */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
          <div className="font-display text-3xl sm:text-4xl tracking-tight">Contentpreneur</div>
          <div className="mt-3 nx-label">
            Built for creators · Grounded in faith · Anchored in Africa
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
