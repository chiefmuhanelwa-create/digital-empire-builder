import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, GraduationCap, User, ShieldCheck, LogOut } from "lucide-react";

// Secured member-portal chrome. Deliberately NOT the marketing header — no public
// links, no "Get the Kit" CTA. The member area is a separate, signed-in space.
// Exported as SiteHeader/SiteFooter so member routes only swap the import path.

const navLink =
  "inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--text-dim)] hover:text-[var(--foreground)] transition-colors px-1 py-1";
const navActive = { className: "text-[var(--foreground)] font-semibold" };

export function SiteHeader() {
  const { user, signOut } = useAuth();

  const isAdminQ = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });

  const firstName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Member";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo → the member home (NOT the public site) */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-base sm:text-lg font-extrabold tracking-[0.18em] uppercase text-[var(--foreground)]">
            CHKPLT
          </span>
          <span className="hidden sm:inline rounded-full bg-[var(--bg-card-hi)] px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--nx-gold-text)]">
            Members
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
          <Link to="/dashboard" className={navLink} activeProps={navActive}>
            <LayoutDashboard className="size-4" /> Dashboard
          </Link>
          <Link to="/learn" className={navLink} activeProps={navActive}>
            <GraduationCap className="size-4" /> My Courses
          </Link>
          <Link to="/account" className={navLink} activeProps={navActive}>
            <User className="size-4" /> Account
          </Link>
          {isAdminQ.data && (
            <Link to="/admin/products" className={`${navLink} text-[var(--nx-orange-deep)]`} activeProps={navActive}>
              <ShieldCheck className="size-4" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline text-sm text-[var(--text-subtle)]">Hi, {firstName}</span>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--border-mid)] text-[14px] font-semibold text-[var(--text-dim)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)] transition-colors px-4 py-2 cursor-pointer"
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
    <footer className="border-t border-[var(--border)] bg-[#0F172A]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="font-display text-sm font-extrabold tracking-[0.18em] uppercase text-[var(--nx-gold-bright)]">
            CHKPLT · Members
          </div>
          <p className="mt-1 text-xs text-slate-400">Your secured workspace. Build on land you own.</p>
        </div>
        <div className="flex items-center gap-5 text-xs text-slate-400">
          <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link to="/account" className="hover:text-white transition-colors">Account</Link>
          <span className="text-slate-600">© {new Date().getFullYear()} NOCHILL PTY LTD</span>
        </div>
      </div>
    </footer>
  );
}
