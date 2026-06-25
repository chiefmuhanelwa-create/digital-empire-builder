import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

const GOLD_GLOW_SOFT = {
  boxShadow: "0 0 14px rgba(201,168,76,0.35), 0 0 32px rgba(201,168,76,0.12)",
} as const;

export function SiteHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[#e0d8cc] bg-white/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-sm sm:text-base font-black tracking-[0.22em] uppercase text-[#1C1C1C]">
          CHKPLT
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#555] hover:text-[#1C1C1C] transition-colors px-3 py-1.5"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="font-mono text-[11px] tracking-[0.15em] uppercase border border-[#e0d8cc] text-[#555] hover:border-[#C9A84C] hover:text-banana transition-colors px-3 py-1.5"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#555] hover:text-[#1C1C1C] transition-colors px-3 py-1.5 hidden sm:block"
              >
                Sign in
              </Link>
              <Link
                to="/products/$slug"
                params={{ slug: "called-expert-starter-bundle" }}
                className="inline-flex items-center gap-1 border border-[#C9A84C] text-[#1C1C1C] font-mono text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 hover:bg-[#C9A84C] hover:text-[#111] transition-colors"
                style={GOLD_GLOW_SOFT}
              >
                Get Started — $97
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
    <footer className="border-t border-[#e0d8cc] bg-[#1C1C1C]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="font-display text-sm font-black tracking-[0.22em] uppercase text-banana">CHKPLT</div>
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <nav className="flex flex-col gap-2.5">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#C9A84C]">Free Tools</div>
              {(
                [
                  ["Rate Card Calculator", "/rate-card"],
                  ["Hook Generator", "/hook-generator"],
                  ["Media Kit Builder", "/media-kit"],
                  ["SARS 25% Calculator", "/sars-calculator"],
                  ["Offer Builder", "/offer-builder"],
                ] as const
              ).map(([label, to]) => (
                <Link key={to} to={to} className="text-xs text-[#bbb] hover:text-banana transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
            <nav className="flex flex-col gap-2.5">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#C9A84C]">Company</div>
              {(
                [
                  ["About", "/about"],
                  ["Contact", "/contact"],
                  ["Terms", "/terms"],
                  ["Privacy", "/privacy"],
                  ["Refunds", "/refund-policy"],
                ] as const
              ).map(([label, to]) => (
                <Link key={to} to={to} className="text-xs text-[#bbb] hover:text-banana transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 font-mono text-[10px] tracking-[0.08em] uppercase text-[#999]">
          © {new Date().getFullYear()} NOCHILL PTY LTD · Reg 2016/507839/07
        </div>
      </div>
    </footer>
  );
}
