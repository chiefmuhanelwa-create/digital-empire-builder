import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Christ Kingdom Platform" },
      { name: "description", content: "CHKPLT is the business infrastructure and training ecosystem for Kingdom Contentpreneurs — legal, financial, and automation systems to scale your creative calling with honor." },
      { property: "og:title", content: "About CHKPLT — Built for Kingdom Contentpreneurs" },
      { property: "og:description", content: "Corporate infrastructure, the 20-Week Master Curriculum, and SARS-compliant frameworks for digital creators. Built under NO CHILL PTY LTD." },
    ],
  }),
  component: About,
});

const PILLARS = [
  {
    t: "Asset Ownership",
    d: "Migrating your attention equity off volatile social media algorithms onto secure databases and owned list infrastructure.",
  },
  {
    t: "Product Engineering — The DARES Model",
    d: "Transitioning you away from trading time for money into building products that are Digital, Automated, Recurring, Evergreen, and Scalable.",
  },
  {
    t: "Revenue Security — The PAIDS Engine",
    d: "Balancing your income across 5 distinct streams (Products, Ads/Affiliates, Information, Deals, Services) so that no single platform or corporate brand deal ever controls more than 40% of your business.",
  },
  {
    t: "SARS Regulatory Compliance",
    d: "Equipping you with specialized, battle-tested tax frameworks to ensure your creator entity is registered properly as a company, keeping you completely bulletproof with provisional and income tax filings.",
  },
];

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="mx-auto max-w-3xl px-5 sm:px-6 pt-20 sm:pt-24 pb-10">
        <div className="nx-label">About CHKPLT</div>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05]">
          Built for Kingdom Contentpreneurs who want a real{" "}
          <em className="text-banana not-italic">corporate enterprise</em> — not just a rented feed.
        </h1>
        <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
          Christ Kingdom Platform (CHKPLT) is the definitive business infrastructure and training ecosystem for digital creators. We don't teach you how to make content; we establish the legal frameworks, financial structures, and automation systems required to scale your creative calling with honor.
        </p>
      </section>

      {/* INFRASTRUCTURE */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-14 sm:py-20">
          <div className="nx-label">The Infrastructure</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
            How the <em className="text-banana not-italic">ecosystem runs.</em>
          </h2>
          <div className="mt-8 nx-card">
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed">
              The platform is engineered to move you systematically through our canonical 7-Stage System, a high-intensity, 20-Week Master Curriculum that structurally mirrors the systemic liberation and building principles of the Books of Exodus and Leviticus. We take you out of platform dependence, establish the corporate law of your business, and organize a compliant, orderly asset framework for your wealth.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT WE SOLVE */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-14 sm:py-20">
          <div className="nx-label">What We Solve</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight max-w-3xl">
            Eliminating the operational{" "}
            <em className="text-banana not-italic">"zeros"</em> capping your growth.
          </h2>
          <p className="mt-5 max-w-3xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Everything deployed inside CHKPLT is built under the corporate standards of NO CHILL PTY LTD.
          </p>

          <div className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.t} className="nx-card flex flex-col">
                <h3 className="font-display text-2xl sm:text-[26px] leading-tight">{p.t}</h3>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PATH TO STEWARDSHIP */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-14 sm:py-20">
          <div className="nx-label">Your Path to Stewardship</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
            We meet you exactly{" "}
            <em className="text-banana not-italic">where your metrics are.</em>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            By auditing your creative equation, our system instantly diagnoses your immediate operational gaps. Start with our foundational compliance guides, leverage our standalone stage utility tools, or apply to join our direct premium group advisory when you are ready to scale a multi-generational legacy.
          </p>
        </div>
      </section>

      {/* SEAL */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
          <div className="font-display text-3xl sm:text-4xl tracking-tight">
            CHKPLT — Kingdom Contentpreneurs
          </div>
          <div className="mt-3 nx-label">
            Built for Creators · Grounded in Faith · Anchored in Africa
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
