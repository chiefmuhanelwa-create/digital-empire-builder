import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/admin-shell";
import { Package, Users, Upload, Receipt, AlertCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — CHKPLT" }] }),
  component: AdminHome,
});

const SECTIONS = [
  { to: "/admin/products", Icon: Package, label: "Products", sub: "Catalog, pricing, status, curriculum" },
  { to: "/admin/contacts", Icon: Users, label: "Contacts", sub: "Subscribers, tags, segments" },
  { to: "/admin/import-contacts", Icon: Upload, label: "Import CSV", sub: "Bulk-add contacts" },
  { to: "/admin/ledger", Icon: Receipt, label: "Ledger", sub: "Orders, revenue, tax reserve" },
  { to: "/admin/incidents", Icon: AlertCircle, label: "Incidents", sub: "Error + webhook log" },
] as const;

function AdminHome() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <p className="nx-label mb-2 !text-[var(--nx-orange-deep)]">Admin console</p>
      <h1 className="mb-2">Owner controls.</h1>
      <p className="nx-body max-w-xl mb-8">
        Everything that runs the platform. Members never see this — use “Member view” in the top bar to
        return to the customer experience.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ to, Icon, label, sub }) => (
          <Link key={to} to={to} className="dash-tile group">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-orange-deep)]">
              <Icon className="h-5 w-5" />
            </span>
            <span className="mt-2 font-display text-lg group-hover:text-[var(--nx-orange-deep)] transition-colors">{label}</span>
            <span className="text-sm text-[var(--text-dim)]">{sub}</span>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--nx-orange-deep)]">Open <ArrowRight className="size-3" /></span>
          </Link>
        ))}
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
