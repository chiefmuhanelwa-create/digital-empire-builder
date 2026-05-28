import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CHKPLT — Stop posting for likes. Own a Kingdom business." },
      {
        name: "description",
        content:
          "CHKPLT trains African creators to escape algorithm bondage and build owned, compliant, generational digital empires. Cohort 01 applications open.",
      },
      {
        property: "og:title",
        content: "CHKPLT — Stop posting for likes. Own a Kingdom business.",
      },
      {
        property: "og:description",
        content:
          "The 20-week master curriculum for creators moving from vanity metrics to sovereign, automated, faith-grounded enterprises.",
      },
    ],
  }),
  component: Landing,
});

const PROOF = ["For Children's Children — Proverbs 13:22"];

const STAGES = [
  {
    weeks: "WEEKS 1–2",
    n: "STAGE 01",
    t: "MS × SS × TS — The Foundation",
    d: "Audit your personal operating systems, run core equation diagnostics, and eliminate the zeros capping your revenue.",
  },
  {
    weeks: "WEEK 3",
    n: "STAGE 02",
    t: "SWOT — Self-Awareness",
    d: "Execute a deep, data-driven self-assessment to isolate your exact competitive edge against market liabilities.",
  },
  {
    weeks: "WEEK 4",
    n: "STAGE 03",
    t: "The 4Es Content Engine",
    d: "Re-architect your publishing model across four strategic pillars: 30% Entertain, 35% Educate, 20% Encourage, 15% Earn.",
  },
  {
    weeks: "WEEKS 5–8",
    n: "STAGE 04",
    t: "Social Media Architecture",
    d: "Move from platform-dependent scrolling to an aggressive, owned subscriber database you fully control.",
  },
  {
    weeks: "WEEKS 9–12",
    n: "STAGE 05",
    t: "The 3Cs — Community in Ubuntu",
    d: "Activate true network equity: Create value, Collaborate with your peers, and Contribute freely.",
  },
  {
    weeks: "WEEKS 13–16",
    n: "STAGE 06",
    t: "The DARES Model",
    d: "Validate and build a modern offer matrix that is strictly Digital, Automated, Recurring, Evergreen, and Scalable.",
  },
  {
    weeks: "WEEKS 17–20",
    n: "STAGE 07",
    t: "PAIDS Revenue Diversification",
    d: "Deploy the 5-tier monetization tracker (Products, Ads/Affiliates, Information, Deals, Services) — no single stream above 40%.",
  },
];

const NOT_FOR = [
  "Dishonest Tactics — individuals searching for lazy hacks, shortcuts, or compromised business ethics.",
  "Short-Term Thinking — personal brands chasing temporary clout and vanity metrics over sustainable revenue.",
  "Lack of Execution — creators unwilling to commit to the intense daily execution required to run a real business.",
  "Unstructured Foundations — anyone not committed to building an orderly, legally compliant, and God-honoring corporate entity.",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      {/* 1. HERO */}
      <section className="relative overflow-hidden nx-hero-orb">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-8 sm:py-12 md:py-16">
          <span className="nx-status-live">
            <span className="nx-live-dot" aria-hidden /> CHKPLT Engine Activated — Cohort 01 Application Window Open
          </span>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl md:text-7xl lg:text-[5.5rem] max-w-5xl tracking-tight">
            Stop Chasing Likes.
            <br />
            Start{" "}
            <em className="text-banana not-italic">Building Legacy.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            "I lead African creators out of digital slavery into the Promised Land
            of ownership, wealth, and legacy — because your children's children
            deserve more than algorithms."
          </p>
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
            <Button asChild size="lg" className="cta-glow w-full sm:w-auto">
              <Link to="/apply">
                Apply for Cohort 1 Now <ArrowRight />
              </Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm font-mono tracking-[0.18em] uppercase text-muted-foreground">
            {PROOF.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-banana" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. THE CORE EQUATION */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-8 sm:py-12 md:py-16">
          <div className="nx-label">The Core Equation</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl max-w-3xl tracking-tight">
            Your creative enterprise is governed by a strict,{" "}
            <em className="text-banana not-italic">non-negotiable formula.</em>
          </h2>

          <div className="mt-4 nx-card">
            <div className="font-mono flex flex-wrap items-center gap-x-2 gap-y-1 text-base sm:text-xl md:text-2xl leading-relaxed text-foreground/90">
              <span className="text-banana">Mindset (MS)</span>
              <span>×</span>
              <span className="text-banana">Skillset (SS)</span>
              <span>×</span>
              <span className="text-banana">Toolset (TS)</span>
              <span>=</span>
              <span className="font-display not-italic">Digital Asset</span>
            </div>
            <div className="mt-7 border-t border-border/60 pt-6">
              <div className="nx-label">The Zero Rule</div>
              <p className="mt-3 text-base sm:text-lg text-foreground/85 leading-relaxed">
                If <em className="text-banana not-italic">any</em> single element
                in this equation is <strong>0</strong>, your entire business
                outcome equals <strong>0</strong>. You do not have a visibility
                or talent problem — you have a{" "}
                <em className="text-banana not-italic">structural bottleneck</em>.
                To build a resilient enterprise, all three dimensions must
                multiply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 7-STAGE CURRICULUM */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-8 sm:py-12 md:py-16">
          <div className="nx-label">The Flagship Transformation</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl max-w-3xl tracking-tight">
            The 7-Stage System —{" "}
            <em className="text-banana not-italic">a 20-Week Master Curriculum.</em>
          </h2>
          <p className="mt-5 max-w-3xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Engineered to lead creators out of platform dependence into an
            organized, highly profitable corporate legacy.
          </p>
          <p className="mt-4 max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed italic">
            Note to creators: these 7 stages structurally align with the
            governance and building principles in Exodus and Leviticus —
            breaking you out of algorithmic bondage, establishing operational
            corporate laws, and organising a structured tabernacle for your
            wealth.
          </p>

          <div className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s, i) => (
              <div
                key={s.n}
                className={
                  "nx-card flex flex-col " +
                  (i === 6 ? "lg:col-span-3 md:col-span-2" : "")
                }
              >
                <div className="flex items-center gap-3">
                  <div className="font-mono text-[10px] tracking-[0.28em] text-banana px-2 py-1 rounded border border-banana/40">
                    {s.weeks}
                  </div>
                  <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground">
                    {s.n}
                  </div>
                </div>
                <h3 className="mt-4 font-display text-2xl sm:text-[26px] leading-tight">
                  {s.t}
                </h3>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {s.d}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex">
            <Button asChild size="lg" className="cta-glow w-full sm:w-auto">
              <Link to="/apply">
                Audit your equation & apply for Cohort 01 <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4. THE DATA SANCTUARY (ANTI-SELL) */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-8 sm:py-12 md:py-16">
          <div className="nx-status-live" style={{ color: "var(--nx-orange-deep)" }}>
            <span className="nx-live-dot" aria-hidden /> The Data Sanctuary
          </div>

          <div className="mt-6 nx-antisell">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl">
              The CHKPLT Master Program is strictly closed to:
            </h2>
            <ul className="mt-7 space-y-2.5">
              {NOT_FOR.map((line) => (
                <li
                  key={line}
                  className="nx-antisell-item flex items-start gap-3 normal-case tracking-normal"
                >
                  <Lock className="mt-0.5 size-4 shrink-0 text-banana" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-col items-start gap-5">
            <p className="font-display text-xl sm:text-2xl max-w-2xl">
              If that resonates,{" "}
              <em className="text-banana not-italic">you are in the right place.</em>
            </p>
            <Button asChild size="lg" className="cta-glow w-full sm:w-auto">
              <Link to="/apply">
                Begin your stewardship assessment <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5. SIGNATURE SEAL */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
          <div className="font-display text-3xl sm:text-4xl tracking-tight">
            Contentpreneur
          </div>
          <div className="mt-3 nx-label">
            Built for creators · Grounded in faith · Anchored in Africa
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
