import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useAuth } from "@/lib/auth-context";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CHKPLT" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Dashboard</div>
        <h1 className="mt-4 font-display text-5xl md:text-6xl">
          Welcome, {user?.user_metadata?.full_name ?? user?.email}.
        </h1>
        <p className="mt-6 text-muted-foreground max-w-2xl">
          Your purchases, courses, and account live here. This dashboard fills out in Phase 04.
        </p>
        <div className="mt-8">
          <Link
            to="/admin/contacts"
            className="inline-flex items-center gap-2 border border-banana/40 px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase text-banana hover:bg-banana hover:text-banana-foreground transition-colors"
          >
            Admin · Contacts &amp; Tags →
          </Link>
        </div>


        <div className="mt-16 grid gap-px bg-border md:grid-cols-3">
          {[
            { t: "Purchases", d: "Order history & receipts", p: "Phase 02" },
            { t: "Courses", d: "Your enrolled programs", p: "Phase 03" },
            { t: "Account", d: "Profile, billing, settings", p: "Phase 04" },
          ].map((c) => (
            <div key={c.t} className="bg-background p-8">
              <div className="font-mono text-xs text-muted-foreground">{c.p}</div>
              <h3 className="mt-3 font-display text-2xl">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
