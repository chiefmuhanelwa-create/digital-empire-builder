import type { ReactNode } from "react";
import { Eyebrow, Pill } from "@/components/tools/premium";

// Shared lead-magnet landing hero for the free tools. Light + minimal, one gold
// accent, a personal photo, benefit headline + empathy sub + "what you get"
// bullets + a trust line — the conversion structure applied across every tool.
// Reused by rate-card, hook-generator, media-kit, sars-calculator, offer-builder,
// align-accelerate-excel so the pages never drift.

export type LeadMagnetHeroProps = {
  eyebrow: string;
  pill?: string;
  headline: ReactNode; // allow a <span className="text-[#C9A84C]"> highlight
  sub: string;
  bullets: string[];
  photoSrc?: string;
  photoAlt?: string;
  photoCaption?: string;
};

function Tick() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="mt-0.5 h-[18px] w-[18px] shrink-0">
      <circle cx="10" cy="10" r="10" fill="#C9A84C" fillOpacity="0.15" />
      <path
        d="M6 10.5l2.6 2.6L14.5 7.5"
        fill="none"
        stroke="#A9863A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LeadMagnetHero({
  eyebrow,
  pill,
  headline,
  sub,
  bullets,
  photoSrc,
  photoAlt = "Ndivhuwo Muhanelwa (NoChill)",
  photoCaption = "Ndivhuwo Muhanelwa · NoChill",
}: LeadMagnetHeroProps) {
  return (
    <header className="mx-auto max-w-5xl px-5 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
      <div className="grid items-center gap-8 sm:grid-cols-[1.5fr_1fr] sm:gap-10">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Eyebrow>{eyebrow}</Eyebrow>
            {pill && <Pill className="whitespace-nowrap">{pill}</Pill>}
          </div>
          <h1 className="mt-6 font-display text-[32px] font-extrabold leading-[1.07] tracking-[-0.02em] text-[#1C1C1C] sm:text-[50px]">
            {headline}
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.65] text-neutral-600 sm:text-[17px]">
            {sub}
          </p>
          <ul className="mt-6 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[15px] leading-snug text-[#2A2A2A]">
                <Tick />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 h-[3px] w-16 rounded-full bg-[#C9A84C]" />
          <p className="mt-5 text-[13px] text-neutral-500">
            ✓ 100% free · your email stays private · unsubscribe anytime
          </p>
        </div>

        {photoSrc && (
          <figure className="mx-auto w-full max-w-[280px] sm:max-w-none">
            <img
              src={photoSrc}
              alt={photoAlt}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-2xl border border-[#E4DBC6] object-cover object-top shadow-[0_10px_40px_-16px_rgba(28,24,16,0.35)]"
              onError={(e) => {
                (e.currentTarget.closest("figure") as HTMLElement).style.display = "none";
              }}
            />
            <figcaption className="mt-3 text-center text-[12px] font-medium text-neutral-500">
              {photoCaption}
            </figcaption>
          </figure>
        )}
      </div>
    </header>
  );
}
