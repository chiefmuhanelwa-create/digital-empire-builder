import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useCurrencyOverride } from "@/lib/currency";

const navLink =
  "text-[15px] font-medium text-[var(--text-dim)] hover:text-[var(--foreground)] transition-colors px-1 py-1";
const navActive = { className: "text-[var(--foreground)] font-semibold" };

// Mirrors the real store's top-left "ZAR ▼" switcher — lets a shopper
// manually pick their billing currency instead of trusting geo-detection
// (useful for anyone browsing on a VPN, or who just prefers USD pricing).
function CurrencySwitcher() {
  const { override, setOverride } = useCurrencyOverride();
  const [open, setOpen] = useState(false);
  const label = override ?? "ZAR";

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1 text-[13px] font-medium text-[var(--text-dim)] hover:text-[var(--foreground)] transition-colors"
      >
        {label} <span className="text-[10px]">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-32 rounded-md border border-[var(--border)] bg-white py-1 shadow-lg">
          {(["ZAR", "USD"] as const).map((c) => (
            <button
              key={c}
              onMouseDown={() => {
                setOverride(c);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-[13px] hover:bg-[#f5f5f5] ${
                label === c ? "font-semibold text-[#000]" : "text-[#666]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderIcons() {
  const { user } = useAuth();
  const { slugs } = useCart();
  return (
    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
      <Link
        to={user ? "/dashboard" : "/login"}
        aria-label={user ? "My account" : "Sign in"}
        className="text-[var(--foreground)] opacity-80 hover:opacity-100 transition-opacity"
      >
        <User className="size-[18px]" />
      </Link>
      <Link
        to="/search"
        aria-label="Search products"
        className="text-[var(--foreground)] opacity-80 hover:opacity-100 transition-opacity"
      >
        <Search className="size-[18px]" />
      </Link>
      <Link
        to="/cart"
        aria-label="Cart"
        className="relative text-[var(--foreground)] opacity-80 hover:opacity-100 transition-opacity"
      >
        <ShoppingBag className="size-[18px]" />
        {slugs.length > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: "sienna" }}
          >
            {slugs.length}
          </span>
        )}
      </Link>
    </div>
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
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <CurrencySwitcher />

        <Link
          to="/"
          className="font-display text-base sm:text-lg font-extrabold tracking-[0.18em] uppercase text-[var(--foreground)] shrink-0 absolute left-1/2 -translate-x-1/2"
        >
          CHKPLT
        </Link>

        {/* Members see workspace nav. The public funnel stays distraction-free —
            no About/Contact/etc up top; those live small in the footer. */}
        {user && (
          <nav className="hidden md:flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar ml-24">
            <Link to="/dashboard" className={navLink} activeProps={navActive}>My workspace</Link>
            <Link to="/products" className={navLink} activeProps={navActive}>Products</Link>
            <Link to="/tools" className={navLink} activeProps={navActive}>Free Tools</Link>
            {isAdminQ.data && (
              <Link to="/admin" className={`${navLink} text-[var(--nx-orange-deep)]`} activeProps={navActive}>
                Admin
              </Link>
            )}
          </nav>
        )}
        {!user && <div className="flex-1" />}

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <HeaderIcons />
          {user && (
            <button
              onClick={() => signOut()}
              className="hidden sm:block rounded-full border-2 border-[var(--border-mid)] text-[13px] font-semibold text-[var(--text-dim)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)] transition-colors px-3.5 py-1.5 cursor-pointer"
            >
              Sign out
            </button>
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
