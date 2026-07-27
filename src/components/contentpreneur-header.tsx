import { Link } from "@tanstack/react-router";

// A dedicated header/footer for the 3 pages that live under contentpreneur.africa
// (starterkit.tsx, foundation.tsx, accelerator.tsx) — deliberately NOT the shared
// SiteHeader/SiteFooter from site-header.tsx, which hardcodes "CHKPLT" as the
// brand name and links the logo to this app's OWN "/" route (CHKPLT's real
// homepage). Reusing that here would show CHKPLT's brand and, on logo-click,
// silently client-side-navigate to CHKPLT's homepage while the URL bar still
// said contentpreneur.africa — confusing and exactly what the founder asked to
// remove. This component keeps the same visual tokens/styling for consistency,
// swaps the brand text, and makes the logo a plain external anchor to the real
// institution homepage (forcing an actual cross-Worker navigation, not a
// client-side route change within this app).
export function ContentpreneurHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="https://contentpreneur.africa/"
          className="font-display text-base sm:text-lg font-extrabold tracking-[0.18em] uppercase text-[var(--foreground)] shrink-0"
        >
          Contentpreneur Africa
        </a>
        <nav className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar text-[15px] font-medium text-[var(--text-dim)]">
          <a href="/foundation" className="hover:text-[var(--foreground)] transition-colors px-1 py-1">Foundation Kit</a>
          <a href="/accelerator" className="hover:text-[var(--foreground)] transition-colors px-1 py-1">Accelerator</a>
          <a href="/starterkit" className="hover:text-[var(--foreground)] transition-colors px-1 py-1">Starter Kit</a>
        </nav>
      </div>
    </header>
  );
}

export function ContentpreneurFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[#0F172A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-xs">
          <div className="font-display text-base font-extrabold tracking-[0.18em] uppercase text-[var(--nx-gold-bright)]">
            Contentpreneur Africa
          </div>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Turn what you know into income you own.
          </p>
        </div>
        <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          <a href="https://contentpreneur.africa/about" className="hover:text-slate-300 transition-colors">About</a>
          <Link to="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
          <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
          <Link to="/refund-policy" className="hover:text-slate-300 transition-colors">Refund Policy</Link>
        </nav>
        <div className="mt-8 border-t border-white/10 pt-6 text-xs tracking-[0.05em] text-slate-500">
          © {new Date().getFullYear()} NOCHILL PTY LTD · Reg 2016/507839/07
        </div>
      </div>
    </footer>
  );
}
