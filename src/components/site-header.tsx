import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

const navLink =
  "text-[15px] font-medium text-[var(--text-dim)] hover:text-[var(--foreground)] transition-colors px-1 py-1";
const navActive = { className: "text-[var(--foreground)] font-semibold" };

export function SiteHeader() {
  const { user, signOut } = useAuth();

  // Only fetch role once we know there's a user; cached so it doesn't refetch per page.
  const isAdminQ = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="font-display text-base sm:text-lg font-extrabold tracking-[0.18em] uppercase text-[var(--foreground)] shrink-0"
        >
          CHKPLT
        </Link>

        {/* Primary nav — clear, labelled, scrollable on small screens */}
        <nav className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar">
          {user ? (
            <>
              <Link to="/dashboard" className={navLink} activeProps={navActive}>Dashboard</Link>
              <Link to="/dashboard/tools" className={navLink} activeProps={navActive}>Free Tools</Link>
              <Link to="/dashboard/products/free" className={navLink} activeProps={navActive}>Products</Link>
              <Link to="/learn" className={navLink} activeProps={navActive}>Courses</Link>
              <Link to="/account" className={navLink} activeProps={navActive}>Account</Link>
              {isAdminQ.data && (
                <Link to="/admin/products" className={`${navLink} text-[var(--nx-orange-deep)]`} activeProps={navActive}>
                  Admin
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/about" className={`hidden sm:block ${navLink}`} activeProps={navActive}>About</Link>
              <Link to="/contact" className={`hidden sm:block ${navLink}`} activeProps={navActive}>Contact</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <button
              onClick={() => signOut()}
              className="rounded-full border-2 border-[var(--border-mid)] text-[14px] font-semibold text-[var(--text-dim)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)] transition-colors px-4 py-2 cursor-pointer"
            >
              Sign out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-[15px] font-medium text-[var(--text-dim)] hover:text-[var(--foreground)] transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                to="/products/$slug"
                params={{ slug: "called-expert-foundation-kit" }}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--nx-gold)] px-5 py-2.5 text-[14px] font-bold text-[#0F172A] shadow-sm hover:bg-[var(--nx-gold-deep)] hover:-translate-y-px transition-all"
              >
                Get the Kit — $97
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[#0F172A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="font-display text-base font-extrabold tracking-[0.18em] uppercase text-[var(--nx-gold-bright)]">
              CHKPLT
            </div>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Christ's Kingdom Platform. Build on land you own.
            </p>
          </div>
          <nav className="flex flex-col gap-3">
            <div className="text-xs font-bold tracking-[0.18em] uppercase text-[var(--nx-gold-bright)]">
              Company
            </div>
            {(
              [
                ["About", "/about"],
                ["Contact", "/contact"],
                ["Terms", "/terms"],
                ["Privacy", "/privacy"],
                ["Refunds", "/refund-policy"],
              ] as const
            ).map(([label, to]) => (
              <Link key={to} to={to} className="text-sm text-slate-300 hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs tracking-[0.05em] text-slate-500">
          © {new Date().getFullYear()} NOCHILL PTY LTD · Reg 2016/507839/07
        </div>
      </div>
    </footer>
  );
}
