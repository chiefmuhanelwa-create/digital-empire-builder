import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/dashboard/tools")({
  head: () => ({ meta: [{ title: "Free Tools — CHKPLT" }] }),
  component: DashboardTools,
});

function DashboardTools() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/dashboard" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 mb-2">Your Tools</h1>
        <p className="nx-body max-w-2xl mb-10">
          Use these as often as you like. They're built to give you a real win in minutes — pricing,
          messaging, media kits, tax, and offers.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.path} to={tool.path} className="dash-tile group">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-3 font-display text-xl text-[var(--foreground)] group-hover:text-[var(--nx-gold-text)] transition-colors">
                  {tool.name}
                </span>
                <span className="text-[15px] text-[var(--text-dim)] leading-relaxed">{tool.blurb}</span>
                <span className="mt-2 text-sm font-semibold text-[var(--nx-gold-text)]">Open tool →</span>
              </Link>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
