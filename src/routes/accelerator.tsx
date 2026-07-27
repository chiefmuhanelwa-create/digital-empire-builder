import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ProCohortBreakdown } from "@/components/PremiumProgramBreakdown";

// Full standalone sales page for the Contentpreneur Accelerator, reachable at
// contentpreneur.africa/accelerator. The qualification flow at /apply is
// reused as-is (already a real, live route on this same app) — since this app
// now also serves contentpreneur.africa, /apply resolves natively on that
// domain too (see wrangler.jsonc's added route for it) with chkplt.com never
// appearing anywhere in the journey. Copy ported from contentpreneur-africa-
// site's app/accelerator/page.tsx; the phase/investment breakdown reuses the
// existing ProCohortBreakdown component rather than re-deriving that table a
// third time.
export const Route = createFileRoute("/accelerator")({
  head: () => ({
    meta: [
      { title: "Contentpreneur Accelerator — $499 — Contentpreneur Africa" },
      {
        name: "description",
        content:
          "Turn your expertise into assets, audience, income and ownership. The full 7-phase system, gated by a real application.",
      },
    ],
  }),
  component: AcceleratorPage,
});

function AcceleratorPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto max-w-2xl px-6 pt-20 pb-16 text-center">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">The Flagship · $499</div>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl leading-[1.05]">Become A Contentpreneur.</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Turn your expertise into assets, audience, income and ownership. Not another course — the full
          system, built over 7 phases, gated by a real application so every cohort stays serious.
        </p>
        <Link
          to="/apply"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-banana px-8 py-4 font-display text-lg text-banana-foreground hover:bg-banana/90 transition-colors"
        >
          Apply Now →
        </Link>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl">A Different Problem Than The Foundation Kit</h2>
          <p className="mt-5 text-muted-foreground">
            Not "I don't know what to do." It's <em>"I know what to do — I haven't built the system."</em>{" "}
            Expertise alone was never going to be enough — knowledge isn't income until it's packaged,
            distributed, and sold, on repeat.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <ProCohortBreakdown />
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">FAQ</div>
          <div className="mt-6 space-y-6 text-left">
            <div>
              <div className="font-display text-sm font-bold text-banana">
                Why an application, not just a checkout button?
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                So the room stays full of people ready to build, not just curious. It takes 10 minutes and is free.
              </p>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-banana">What if I'm not ready yet?</div>
              <p className="mt-1 text-sm text-muted-foreground">
                You'll be pointed to the Foundation Kit instead — not a failure, just the right next step.
              </p>
            </div>
          </div>
          <Link
            to="/apply"
            className="mt-10 inline-flex items-center justify-center rounded-md bg-banana px-8 py-4 font-display text-lg text-banana-foreground hover:bg-banana/90 transition-colors"
          >
            Apply Now — $499 →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
