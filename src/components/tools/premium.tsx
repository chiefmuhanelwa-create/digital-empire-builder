import * as React from "react";
import { cn } from "@/lib/utils";

// Shared visual language for the Tools Hub — the 2026 "Aurora" gradient rebrand.
//
// Founder ruling (2026-08-26): the tools move OFF the cream/charcoal/gold system
// onto an iridescent gradient-mesh + glassmorphism look, inspired by the premium
// fintech/AI references. This is scoped to the TOOLS only — the video, carousel
// and marketing-site palettes are unchanged. Because every tool imports these
// primitives, editing this file rebrands all of them at once.
//
// The look: a soft aurora mesh ground (lavender→pink→blue), frosted-glass cards,
// and a violet→fuchsia→blue accent gradient for the things that should pop.

export const BRAND = {
  // Names kept for backwards-compat with any importer; values repointed to Aurora.
  cream: "#F5F3FF", // light aurora base
  charcoal: "#1A1523", // near-black ink
  toolBlack: "#141019",
  gold: "#8B5CF6", // primary accent (violet) — was heritage gold
  goldDeep: "#7C3AED",
  ink: "#1A1523",
  // Aurora accent stops
  violet: "#8B5CF6",
  fuchsia: "#EC4899",
  blue: "#3B82F6",
} as const;

export const ACCENT_GRADIENT = "linear-gradient(135deg, #8B5CF6 0%, #EC4899 55%, #3B82F6 100%)";

/** Faint dot grid — subtle texture. Violet-tinted on light, white on dark. */
export function DotGrid({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `radial-gradient(${dark ? "rgba(255,255,255,0.06)" : "rgba(124,58,237,0.08)"} 1px, transparent 1px)`,
        backgroundSize: "22px 22px",
      }}
    />
  );
}

/** One soft aurora bloom. Kept name `GoldGlow` for import compat; now iridescent. */
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
        background:
          "radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(236,72,153,0.35) 40%, rgba(59,130,246,0.15) 65%, transparent 78%)",
      }}
    />
  );
}

/** Small uppercase label — the eyebrow tag. */
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
        tone === "gold" ? "text-[#7C3AED]" : "text-neutral-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Outlined / gradient pill. */
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
        tone === "outline" && "border border-[#8B5CF6]/25 bg-white/50 text-[#6D28D9] backdrop-blur",
        tone === "gold" && "text-white",
        tone === "dark" && "bg-[#1A1523] text-white",
        className,
      )}
      style={tone === "gold" ? { backgroundImage: ACCENT_GRADIENT } : undefined}
    >
      {children}
    </span>
  );
}

/** Frosted-glass card. The whole UI is these on the aurora ground. */
export function Panel({
  children,
  className,
  raised = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  raised?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl",
        raised
          ? "shadow-[0_20px_60px_-24px_rgba(76,29,149,0.35)]"
          : "shadow-[0_4px_20px_-8px_rgba(76,29,149,0.18)]",
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
    <div className="flex items-start justify-between gap-4 border-b border-white/50 px-5 py-4 sm:px-6">
      <div>
        <h2 className="font-display text-[15px] font-bold tracking-tight text-[#1A1523] sm:text-base">
          {title}
        </h2>
        {hint && <p className="mt-1 text-[13px] leading-snug text-neutral-500">{hint}</p>}
      </div>
      {step && (
        <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold tracking-widest text-[#8B5CF6]">
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
      <span className="mb-1.5 block text-[13px] font-bold text-[#1A1523]">{label}</span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-[12px] leading-snug text-neutral-500">{hint}</span>
      )}
    </label>
  );
}

// 16px minimum on inputs — anything smaller makes iOS Safari zoom on focus.
const CONTROL =
  "w-full rounded-xl border border-[#8B5CF6]/20 bg-white/80 px-4 py-3 text-[16px] text-[#1A1523] outline-none transition " +
  "placeholder:text-neutral-400 focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/15";

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
      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B5CF6]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
));
Select.displayName = "Select";

/** Multi-select chip. */
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
        "group relative flex min-h-[52px] w-full items-start justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition",
        active
          ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
          : "border-white/60 bg-white/60 hover:border-[#8B5CF6]/40",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold leading-snug text-[#1A1523]">{children}</span>
        {sub && (
          <span className="mt-1 block text-[12.5px] leading-snug text-neutral-500">{sub}</span>
        )}
      </span>
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
          active ? "border-transparent" : "border-neutral-300 bg-white",
        )}
        style={active ? { backgroundImage: ACCENT_GRADIENT } : undefined}
      >
        {active && (
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3 text-white"
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

/** Primary action — the aurora gradient button (name kept for import compat). */
export function GoldButton({
  className,
  children,
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-bold text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.6)] transition",
        "hover:brightness-[1.06] active:scale-[0.99]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100",
        className,
      )}
      style={{ backgroundImage: ACCENT_GRADIENT, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

/** Aurora mesh ground with a faint grid + soft blooms. Every tool sits inside this. */
export function ToolCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 700px at 12% -8%, rgba(139,92,246,0.20), transparent 55%)," +
          "radial-gradient(1000px 650px at 100% 0%, rgba(236,72,153,0.18), transparent 55%)," +
          "radial-gradient(1100px 800px at 60% 108%, rgba(59,130,246,0.16), transparent 55%)," +
          "linear-gradient(180deg, #F7F5FF 0%, #FBF7FE 45%, #F5F7FF 100%)",
      }}
    >
      <DotGrid />
      <div className="relative">{children}</div>
    </div>
  );
}
