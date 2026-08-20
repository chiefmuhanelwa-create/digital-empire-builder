import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

// THE WORKSPACE SHELL
//
// The signed-in area had the storefront's chrome around it: a small nav that
// scrolled sideways on a phone, links that led back out to sales pages, and
// type sized for a marketing site rather than a workspace someone actually
// works in.
//
// This is deliberately plain. White ground, black text, one blue for anything
// clickable. Nothing decorative competes with the content, nav items are large
// enough to hit on a phone, and every link stays inside the workspace — a tool
// should never drop somebody onto a page trying to sell them what they already
// bought.

export const BLUE = "#1A4FD6";
export const BLUE_DARK = "#123BA6";
export const INK = "#111318";
export const BODY = "#3C424D";
export const MUTED = "#697082";
export const LINE = "#E2E5EB";
export const TINT = "#F4F6FA";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white" style={{ color: BODY }}>
      <WorkspaceHeader />
      {children}
      <WorkspaceFooter />
    </div>
  );
}

function WorkspaceHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white" style={{ borderBottom: `1px solid ${LINE}` }}>
      <div className="mx-auto max-w-5xl px-5">
        <div className="flex h-[68px] items-center justify-between gap-4">
          <Link to="/dashboard/foundation-kit" className="flex items-center gap-2.5 shrink-0" style={{ textDecoration: "none" }}>
            <span
              className="inline-flex size-8 items-center justify-center rounded-lg text-[15px] font-black"
              style={{ background: BLUE, color: "#fff" }}
            >
              C
            </span>
            <span className="hidden sm:block text-[15px] font-bold" style={{ color: INK }}>
              Your Workspace
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard/foundation-kit">Tools</NavLink>
            <NavLink to="/learn">Course</NavLink>
            <NavLink to="/account">Account</NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3.5 py-2 text-[15px] font-semibold transition-colors"
      style={{ color: BODY, textDecoration: "none" }}
      activeProps={{ style: { color: BLUE, background: TINT } }}
    >
      {children}
    </Link>
  );
}

function WorkspaceFooter() {
  return (
    <footer className="mt-20" style={{ borderTop: `1px solid ${LINE}` }}>
      <div className="mx-auto max-w-5xl px-5 py-8">
        <p className="text-[14px]" style={{ color: MUTED }}>
          Your work saves automatically and follows you between devices.
        </p>
        <p className="mt-1.5 text-[13px]" style={{ color: MUTED }}>
          Contentpreneur Africa &middot; &copy; {new Date().getFullYear()} NOCHILL PTY LTD
        </p>
      </div>
    </footer>
  );
}

/**
 * The one way back. Every tool uses this rather than inventing its own link,
 * so "back" always means the same thing and always lands in the same place.
 */
export function BackToWorkspace() {
  return (
    <Link
      to="/dashboard/foundation-kit"
      className="inline-flex items-center gap-2 text-[15px] font-semibold"
      style={{ color: BLUE, textDecoration: "none" }}
    >
      <ArrowLeft className="size-4" />
      All tools
    </Link>
  );
}
