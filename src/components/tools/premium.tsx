import * as React from "react";
import { cn } from "@/lib/utils";

// Shared visual language for the Tools Hub — the "premium SaaS" pass.
//
// Palette is the canonical NOCHILL brand from the brand guidelines and the
// Contentpreneur carousels: Cream #FAF7F0, Charcoal #1C1C1C, Tool Black
// #111111, Heritage Gold #C9A84C. Note this deliberately differs from the rest
// of chkplt.com, which drifted to amber (#F59E0B) on white/slate. The tools are
// the first surface brought back to brand; if the site follows later, these
// tokens are the reference.
//
// The look is built from four repeatable pieces: a cream ground, a faint dot
// grid, one soft gold bloom, and hairline-bordered white cards. Restraint is
// the point — expensive reads as calm, not decorated.

export const BRAND = {
  cream: "#FAF7F0",
  charcoal: "#1C1C1C",
  toolBlack: "#111111",
  gold: "#C9A84C",
  goldDeep: "#A98A38",
  ink: "#14110C",
} as const;

/** Faint dot grid — the texture under every carousel slide. Purely decorative. */
export function DotGrid({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `radial-gradient(${dark ? "rgba(255,255,255,0.07)" : "rgba(28,28,28,0.09)"} 1px, transparent 1px)`,
        backgroundSize: "22px 22px",
      }}
    />
  );
}

/** One soft gold bloom. Never more than one per viewport — two reads as cheap. */
export function GoldGlow({
  className,
  size = 620,
  opacity = 0.5,
}: {
  className?: string;
  size?: number;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{
        width: size,
        height: size,
        opacity,
        background: `radial-gradient(circle, ${BRAND.gold}66 0%, ${BRAND.gold}1f 45%, transparent 70%)`,
      }}
    />
  );
}

/** Small uppercase label — the "CONTENTPRENEUR" / "THE BOOK · CHAPTER 1" tag. */
export function Eyebrow({
  children,
  className,
  tone = "gold",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "gold" | "muted";
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-bold uppercase leading-none tracking-[0.2em]",
        tone === "gold" ? "text-[#A98A38]" : "text-neutral-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Outlined pill — the "03/07" counter and category chips. */
export function Pill({
  children,
  className,
  tone = "outline",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "outline" | "gold" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]",
        tone === "outline" && "border border-neutral-300/80 text-neutral-600",
        tone === "gold" && "bg-[#C9A84C] text-[#1C1C1C]",
        tone === "dark" && "bg-[#1C1C1C] text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Hairline card. The whole UI is these on cream. */
export function Panel({
  children,
  className,
  raised = false,
}: {
  children: React.ReactNode;
  className?: string;
  raised?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/90 bg-white",
        raised
          ? "shadow-[0_18px_50px_-24px_rgba(28,28,28,0.28)]"
          : "shadow-[0_2px_10px_-4px_rgba(28,28,28,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  step,
  hint,
}: {
  title: string;
  step?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200/80 px-5 py-4 sm:px-6">
      <div>
        <h2 className="font-display text-[15px] font-bold tracking-tight text-[#1C1C1C] sm:text-base">
          {title}
        </h2>
        {hint && <p className="mt-1 text-[13px] leading-snug text-neutral-500">{hint}</p>}
      </div>
      {step && (
        <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold tracking-widest text-neutral-400">
          {step}
        </span>
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-bold text-[#1C1C1C]">{label}</span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-[12px] leading-snug text-neutral-500">{hint}</span>
      )}
    </label>
  );
}

// 16px minimum on inputs — anything smaller makes iOS Safari zoom the page on
// focus, which on a long form feels broken.
const CONTROL =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[16px] text-[#1C1C1C] outline-none transition " +
  "placeholder:text-neutral-400 focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/15";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(CONTROL, className)} {...props} />
));
Input.displayName = "Input";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn(CONTROL, "appearance-none pr-11", className)} {...props}>
      {children}
    </select>
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
));
Select.displayName = "Select";

/** Multi-select chip used for platforms and add-ons. */
export function Chip({
  active,
  onClick,
  children,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        // `min-w-0` + `flex-1` on the text column is load-bearing: without it the
        // column sizes to its content, the button overflows its grid cell, and
        // the whole card runs off the right edge of a phone. Long add-on
        // descriptions wrap to a second line rather than truncating — on mobile
        // an ellipsis hides the thing the creator needs to read.
        "group relative flex min-h-[52px] w-full items-start justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition",
        active
          ? "border-[#C9A84C] bg-[#C9A84C]/10 shadow-[0_0_0_3px_rgba(201,168,76,0.12)]"
          : "border-neutral-200 bg-white hover:border-neutral-300",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold leading-snug text-[#1C1C1C]">{children}</span>
        {sub && (
          <span className="mt-1 block text-[12.5px] leading-snug text-neutral-500">{sub}</span>
        )}
      </span>
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
          active ? "border-[#C9A84C] bg-[#C9A84C]" : "border-neutral-300 bg-white",
        )}
      >
        {active && (
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3 text-[#1C1C1C]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function GoldButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#1C1C1C] px-6 text-[15px] font-bold text-white transition",
        "hover:bg-[#C9A84C] hover:text-[#1C1C1C] active:scale-[0.99]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#1C1C1C] disabled:hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Cream page ground with grid + a single bloom. Every tool sits inside this. */
export function ToolCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-[#FAF7F0]">
      <DotGrid />
      <GoldGlow className="-right-40 -top-32" size={640} opacity={0.55} />
      <div className="relative">{children}</div>
    </div>
  );
}
