import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

// THE FUNNEL KIT.
//
// Built to the visual language in the founder's Mocha export ("NoChill — Turn
// Content Into Cash"): black ground, gold gradient type, glass cards, and one
// glowing pill CTA. Utilities live under `.funnel` in styles.css so none of it
// can leak into the workspace or the site theme.
//
// THE RULE THIS FILE EXISTS TO ENFORCE: ONE CTA.
//
// A funnel page is not a website. It has no menu, no footer sitemap, no "browse
// products", and no inline email form competing with the button. Every escape
// hatch is a place the buyer leaves. The sales page's only job is to get one
// click; collecting details is the CHECKOUT page's job, on its own screen,
// where nothing else is asking for attention.
//
// That is why <FunnelNav> renders a logo and the CTA and nothing else, and why
// <FunnelFooter> has no links at all.

/**
 * Scroll reveal. Renders SHOWN on the server and flips to hidden on mount only
 * if the browser supports IntersectionObserver — so a page with JS disabled, or
 * mid-hydration, shows its content rather than a column of blank space.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;
    setArmed(true);
    setShown(false);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${armed ? "reveal" : ""} ${shown ? "shown" : ""} ${className}`}
      style={armed && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** Ambient colour orbs behind the hero. Pure decoration, never interactive. */
export function Orbs({ tint = "amber" }: { tint?: "amber" | "blue" | "green" }) {
  const a =
    tint === "blue" ? "rgba(30,58,138,0.25)" : tint === "green" ? "rgba(6,78,59,0.25)" : "rgba(120,53,15,0.28)";
  const b = tint === "blue" ? "rgba(88,28,135,0.2)" : "rgba(113,63,18,0.22)";
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-24 left-1/4 size-[28rem] rounded-full blur-3xl" style={{ background: a }} />
      <div className="absolute -bottom-24 right-1/4 size-[28rem] rounded-full blur-3xl" style={{ background: b }} />
    </div>
  );
}

/** The eyebrow pill above the headline. */
export function Eyebrow({ children, tint = "#fbbf24" }: { children: React.ReactNode; tint?: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
      style={{ background: `${tint}22`, border: `1px solid ${tint}55`, color: tint }}
    >
      {children}
    </div>
  );
}

/**
 * THE button. There is one of these per page — repeated, but always the same
 * destination and the same words. `to` for in-app routes, `href` for anchors.
 */
export function CTA({
  to,
  href,
  children,
  sub,
  full = false,
}: {
  to?: string;
  href?: string;
  children: React.ReactNode;
  sub?: string;
  full?: boolean;
}) {
  const cls =
    `${full ? "flex w-full" : "inline-flex"} items-center justify-center gap-3 rounded-full ` +
    "bg-gradient-to-r from-amber-400 to-amber-500 px-9 py-5 text-lg sm:text-xl font-black text-black " +
    "glow-gold transition-transform hover:scale-[1.02] active:scale-[0.99] " +
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50";

  const inner = (
    <>
      {children}
      <ArrowRight className="size-5 shrink-0" />
    </>
  );

  return (
    <div className={full ? "w-full" : ""}>
      {to ? (
        <Link to={to} className={cls} style={{ textDecoration: "none" }}>{inner}</Link>
      ) : (
        <a href={href} className={cls} style={{ textDecoration: "none" }}>{inner}</a>
      )}
      {sub && <p className="mt-4 text-center text-sm text-amber-200/70">{sub}</p>}
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`card-glass rounded-3xl ${className}`}
      style={accent ? { border: `2px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}

/** A numbered step card — the module/step pattern from the export. */
export function StepCard({
  n, title, badge, body, points, accent = "#fbbf24", delay = 0,
}: {
  n: number | string;
  title: string;
  badge?: string;
  body: string;
  points?: string[];
  accent?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <GlassCard className="overflow-hidden" accent={`${accent}4d`}>
        <div className="p-7 sm:p-9">
          <div className="flex items-start gap-5">
            <div
              className="grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-black text-black"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}
            >
              {n}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl sm:text-3xl font-black">{title}</h3>
                {badge && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                    style={{ background: `${accent}22`, border: `1px solid ${accent}66`, color: accent }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <p className="mt-3 text-lg leading-relaxed text-slate-300">{body}</p>
              {points && points.length > 0 && (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-0.5 shrink-0 font-black" style={{ color: accent }}>✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </Reveal>
  );
}

/**
 * Sticky nav with a logo and the CTA. NOTHING ELSE — no menu, no product links,
 * no account link. Every extra item here is a way out of the funnel.
 */
export function FunnelNav({ ctaTo, ctaHref, ctaLabel }: { ctaTo?: string; ctaHref?: string; ctaLabel: string }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cls =
    "rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-black text-black " +
    "transition-transform hover:scale-[1.03]";

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors"
      style={{
        background: solid ? "rgba(0,0,0,0.85)" : "transparent",
        backdropFilter: solid ? "blur(12px)" : undefined,
        borderBottom: solid ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="text-sm font-black tracking-tight text-white">
          CONTENTPRENEUR<span className="grad-gold"> AFRICA</span>
        </span>
        {ctaTo ? (
          <Link to={ctaTo} className={cls} style={{ textDecoration: "none" }}>{ctaLabel}</Link>
        ) : (
          <a href={ctaHref} className={cls} style={{ textDecoration: "none" }}>{ctaLabel}</a>
        )}
      </div>
    </header>
  );
}

/**
 * No navigation. Deliberately.
 *
 * The only links here are the legal ones — two of these pages collect an email
 * address, and a privacy link is the one link that earns its place on a funnel.
 * Everything else a normal footer carries is an exit.
 */
export function FunnelFooter() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} NOCHILL PTY LTD · Contentpreneur Africa</p>
        <p className="mt-2">Turn What You Know Into Income You Own.</p>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
          <Link to="/privacy" className="text-slate-500 hover:text-slate-300">Privacy</Link>
          <Link to="/terms" className="text-slate-500 hover:text-slate-300">Terms</Link>
          <Link to="/refund-policy" className="text-slate-500 hover:text-slate-300">Refunds</Link>
        </p>
      </div>
    </footer>
  );
}
