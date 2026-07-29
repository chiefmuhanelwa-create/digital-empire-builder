import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

const navLink =
  "text-[15px] font-medium text-[var(--text-dim)] hover:text-[var(--foreground)] transition-colors px-1 py-1";
const navActive = { className: "text-[var(--foreground)] font-semibold" };

function HeaderSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/products", search: { q: term } });
      }}
      className="relative flex items-center"
    >
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search products…"
        className="h-9 w-32 sm:w-40 rounded-full border border-[var(--border)] bg-white pl-3 pr-9 text-xs text-[var(--foreground)] outline-none transition-[width] focus:w-40 sm:focus:w-56 focus:border-[var(--nx-gold)]"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-dim)] hover:text-[var(--foreground)] hover:bg-muted transition-colors"
      >
        <Search className="size-3.5" />
      </button>
    </form>
  );
}

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

        {/* Members see workspace nav. The public funnel stays distraction-free —
            no About/Contact/etc up top; those live small in the footer. */}
        {user ? (
          <nav className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar">
            <Link to="/dashboard" className={navLink} activeProps={navActive}>My workspace</Link>
            <Link to="/products" className={navLink} activeProps={navActive}>Products</Link>
            <Link to="/tools" className={navLink} activeProps={navActive}>Free Tools</Link>
            {isAdminQ.data && (
              <Link to="/admin" className={`${navLink} text-[var(--nx-orange-deep)]`} activeProps={navActive}>
                Admin
              </Link>
            )}
          </nav>
        ) : (
          <div className="flex flex-1 justify-center">
            <HeaderSearch />
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              <HeaderSearch />
              <button
                onClick={() => signOut()}
                className="rounded-full border-2 border-[var(--border-mid)] text-[14px] font-semibold text-[var(--text-dim)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)] transition-colors px-4 py-2 cursor-pointer"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-[15px] font-medium text-[var(--text-dim)] hover:text-[var(--foreground)] transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              {/* CHKPLT is a marketplace now (2026-07-28) — no single "the Kit" to
                  route to. The old ?buy=1 checkout modal was removed with the
                  Foundation Kit funnel; this now points at the shop itself. */}
              <Link
                to="/products"
                className="inline-flex items-center gap-1 rounded-full bg-[var(--nx-gold)] px-5 py-2.5 text-[14px] font-bold text-[#0F172A] shadow-sm hover:bg-[var(--nx-gold-deep)] hover:-translate-y-px transition-all"
              >
                Shop Now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Matches the real, live contentcreatorhub.online footer structure and style
// (scraped directly 2026-07-28: white bg, centered, payment badge row,
// "© YEAR STORE. A NOCHILL PTY LTD Brand." copyright) — not the old dark
// CHKPLT-branded footer, per the explicit instruction to match the real
// store's footer.
const PAY_BADGES = [
  {
    title: "Paystack",
    svg: (
      <svg width="74" height="18" viewBox="0 0 74 18" xmlns="http://www.w3.org/2000/svg" aria-label="Paystack">
        <text x="0" y="14" fontFamily="Arial,sans-serif" fontSize="14" fontWeight="800" fill="#00C3F7">Pay</text>
        <text x="28" y="14" fontFamily="Arial,sans-serif" fontSize="14" fontWeight="800" fill="#011B33">stack</text>
      </svg>
    ),
  },
  {
    title: "Visa",
    svg: (
      <svg width="42" height="18" viewBox="0 0 42 18" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
        <text x="0" y="14" fontFamily="Arial,sans-serif" fontSize="16" fontWeight="900" letterSpacing="-0.5" fill="#1A1F71">VISA</text>
      </svg>
    ),
  },
  {
    title: "Mastercard",
    svg: (
      <svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
        <circle cx="13" cy="12" r="11" fill="#EB001B" />
        <circle cx="23" cy="12" r="11" fill="#F79E1B" />
      </svg>
    ),
  },
  {
    title: "Google Pay",
    svg: (
      <svg width="56" height="18" viewBox="0 0 56 18" xmlns="http://www.w3.org/2000/svg" aria-label="Google Pay">
        <text x="0" y="14" fontFamily="Arial,sans-serif" fontSize="15" fontWeight="700" fill="#4285F4">G</text>
        <text x="12" y="14" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="400" fill="#5f6368">Pay</text>
      </svg>
    ),
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e0e0e0] bg-white py-6 px-4 text-center">
      <nav className="mb-3.5 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link to="/products" className="py-1 text-xs text-[#666] hover:text-[#333] transition-colors">Shop</Link>
        <Link to="/tools" className="py-1 text-xs text-[#666] hover:text-[#333] transition-colors">Free Tools</Link>
        <Link to="/about" className="py-1 text-xs text-[#666] hover:text-[#333] transition-colors">About</Link>
        <Link to="/contact" className="py-1 text-xs text-[#666] hover:text-[#333] transition-colors">Contact</Link>
        <Link to="/refund-policy" className="py-1 text-xs text-[#666] hover:text-[#333] transition-colors">Refund Policy</Link>
        <Link to="/privacy" className="py-1 text-xs text-[#666] hover:text-[#333] transition-colors">Privacy Policy</Link>
        <Link to="/terms" className="py-1 text-xs text-[#666] hover:text-[#333] transition-colors">Terms of Service</Link>
      </nav>

      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#999]">
        Multiple payment options supported
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PAY_BADGES.map((b) => (
          <div
            key={b.title}
            title={b.title}
            className="flex h-8 items-center justify-center rounded-md border border-[#e8e8e8] bg-[#f8f8f8] px-2.5"
          >
            {b.svg}
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-[#999]">
        © {new Date().getFullYear()} CHKPLT. A NOCHILL PTY LTD Brand.
      </p>
    </footer>
  );
}
