import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Package, Users, Upload, Receipt, AlertCircle, ArrowLeft, LogOut } from "lucide-react";

// Admin-console chrome. Deliberately distinct from the member portal (dark bar,
// orange accent) so admin and member contexts are never confused. Exported as
// SiteHeader/SiteFooter for drop-in, but the admin layout renders it directly.

const navLink =
  "inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap";
const navActive = { className: "text-white font-semibold" };

const NAV = [
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/contacts", label: "Contacts", Icon: Users },
  { to: "/admin/import-contacts", label: "Import", Icon: Upload },
  { to: "/admin/ledger", label: "Ledger", Icon: Receipt },
  { to: "/admin/incidents", label: "Incidents", Icon: AlertCircle },
];

export function SiteHeader() {
  const { signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0F172A]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/admin" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-base sm:text-lg font-extrabold tracking-[0.18em] uppercase text-white">CHKPLT</span>
          <span className="rounded-full bg-[var(--nx-orange)] px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] uppercase text-white">Admin</span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar">
          {NAV.map(({ to, label, Icon }) => (
            <Link key={to} to={to} className={navLink} activeProps={navActive}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[13px] font-semibold text-slate-200 hover:border-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Member view
          </Link>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0F172A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between gap-4">
        <span className="font-display text-sm font-extrabold tracking-[0.18em] uppercase text-[var(--nx-orange-bright)]">
          CHKPLT · Admin
        </span>
        <span className="text-xs text-slate-500">© {new Date().getFullYear()} NOCHILL PTY LTD · internal</span>
      </div>
    </footer>
  );
}
