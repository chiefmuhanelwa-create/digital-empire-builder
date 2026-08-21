import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-is-admin";
import { LayoutDashboard, GraduationCap, User, ShieldCheck, LogOut, MessageCircle } from "lucide-react";

// Secured member-portal chrome. Deliberately NOT the marketing header — no public
// links, no "Get the Kit" CTA. The member area is a separate, signed-in space.
// Exported as SiteHeader/SiteFooter so member routes only swap the import path.
//
// Branded "Contentpreneur Africa" since 2026-08-18, not CHKPLT: the whole member
// area now lives on contentpreneur.africa and chkplt.com 301s member paths there
// (src/server.ts). A buyer who reads "Contentpreneur Africa" on the ad, the
// /foundation sales page and the receipt must not open their workspace and meet a
// brand name they have never seen. CHKPLT is still the storefront — that chrome
// lives in site-header.tsx and is unchanged.

// Nav targets are 16px semibold with real padding, not 14px medium in a mid
// grey. Founder feedback: "navigation buttons are all over and not visible."
// They are also now a rounded hit area rather than bare text, so on a phone
// there is something to actually aim at.
const navLink =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[16px] font-semibold text-[var(--text-dim)] hover:text-[var(--foreground)] hover:bg-[var(--bg-surface)] transition-colors";
const navActive = { className: "text-[var(--nx-gold-text)] bg-[var(--bg-surface)] font-bold" };

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  const firstName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Member";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between gap-4 px-5">
        {/* Logo → the member home (NOT the public site) */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          {/* "Contentpreneur Africa" is 3x the width the old "CHKPLT" wordmark
              needed, so mobile drops the tracking and a size step (same treatment
              contentpreneur-header.tsx already uses) rather than shoving the nav
              off-screen. */}
          <span
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[15px] font-black text-white"
            style={{ background: "var(--nx-gold)" }}
          >
            C
          </span>
          <span className="text-[16px] font-bold text-[var(--foreground)]">
            Your Workspace
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
          <Link to="/dashboard" className={navLink} activeProps={navActive}>
            <LayoutDashboard className="size-4" /> Dashboard
          </Link>
          <Link to="/learn" className={navLink} activeProps={navActive}>
            <GraduationCap className="size-4" /> Learn
          </Link>
          <Link to="/account" className={navLink} activeProps={navActive}>
            <User className="size-4" /> Account
          </Link>
          {isAdmin && (
            <Link to="/admin" className={`${navLink} text-[var(--nx-orange-deep)]`} activeProps={navActive}>
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
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-[var(--foreground)]">Contentpreneur Africa</div>
          <p className="mt-1 text-[14px] text-[var(--text-subtle)]">
            Your work saves automatically and follows you between devices.
          </p>
        </div>
        <div className="flex items-center gap-5 text-[14px] text-[var(--text-subtle)]">
          <Link to="/dashboard/foundation-kit" className="font-semibold text-[var(--nx-gold-text)]">All tools</Link>
          <Link to="/account" className="hover:text-[var(--foreground)] transition-colors">Account</Link>
          <span>© {new Date().getFullYear()} NOCHILL PTY LTD</span>
        </div>
      </div>
      <SupportChatButton />
    </footer>
  );
}

// Click-to-chat support panel (docs/COVENANT-ENGINE.md §8.3). Renders nothing
// unless VITE_WHATSAPP_SUPPORT_NUMBER is set — safe to ship before the owner
// has configured a number. Fixed position, so mounting it here still floats
// correctly over the whole page regardless of footer scroll position.
function SupportChatButton() {
  const number = import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER as string | undefined;
  if (!number) return null;

  const message = encodeURIComponent("Hey — I need help with my Contentpreneur Africa workspace.");
  const href = `https://wa.me/${number}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with support on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:scale-105"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}
