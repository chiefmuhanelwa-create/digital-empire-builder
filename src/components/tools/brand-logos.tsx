import * as React from "react";

// Real, full-colour platform marks for the Tools Hub. These are the official
// brand glyphs in official brand colours — Instagram's gradient, YouTube's red
// play badge, TikTok's cyan/red offset — not monochrome lucide approximations.
// A rate card that shows the actual logos reads as a real product; grey
// placeholder icons read as a prototype.
//
// Each is a self-contained <svg> so it inherits size from a wrapping element and
// needs no external asset (nothing to 404, nothing to CSP-block). Keyed by the
// same PlatformKey strings the rate-card engine and media kit already use, so a
// tool can render <BrandLogo platform={k} /> straight off its data.

type LogoProps = { className?: string; title?: string };

function Instagram({ className, title }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title ?? "Instagram"}>
      <defs>
        <radialGradient id="ig-g" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FDF497" />
          <stop offset="5%" stopColor="#FDF497" />
          <stop offset="45%" stopColor="#FD5949" />
          <stop offset="60%" stopColor="#D6249F" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#ig-g)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="17.4" cy="6.6" r="1.25" fill="#fff" />
    </svg>
  );
}

function TikTok({ className, title }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title ?? "TikTok"}>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#010101" />
      <path
        d="M15.6 6.2c.35 1.9 1.5 3.1 3.3 3.3v2.2c-1.1 0-2.1-.35-3.1-1v4.5c0 3.2-2.7 5-5.1 4.2-2.9-.95-3.5-4.7-1-6.4.9-.6 2-.75 3.1-.5v2.3c-.4-.12-.8-.15-1.2-.02-.9.3-1.2 1.4-.6 2.1.6.7 1.9.5 2.2-.5.07-.25.1-.5.1-.75V4.6h2.3c0 .55.03 1.1.1 1.6Z"
        fill="#25F4EE"
        transform="translate(-.7 -.5)"
      />
      <path
        d="M15.6 6.2c.35 1.9 1.5 3.1 3.3 3.3v2.2c-1.1 0-2.1-.35-3.1-1v4.5c0 3.2-2.7 5-5.1 4.2-2.9-.95-3.5-4.7-1-6.4.9-.6 2-.75 3.1-.5v2.3c-.4-.12-.8-.15-1.2-.02-.9.3-1.2 1.4-.6 2.1.6.7 1.9.5 2.2-.5.07-.25.1-.5.1-.75V4.6h2.3c0 .55.03 1.1.1 1.6Z"
        fill="#FE2C55"
        transform="translate(.7 .5)"
      />
      <path
        d="M15.6 6.2c.35 1.9 1.5 3.1 3.3 3.3v2.2c-1.1 0-2.1-.35-3.1-1v4.5c0 3.2-2.7 5-5.1 4.2-2.9-.95-3.5-4.7-1-6.4.9-.6 2-.75 3.1-.5v2.3c-.4-.12-.8-.15-1.2-.02-.9.3-1.2 1.4-.6 2.1.6.7 1.9.5 2.2-.5.07-.25.1-.5.1-.75V4.6h2.3c0 .55.03 1.1.1 1.6Z"
        fill="#fff"
      />
    </svg>
  );
}

function YouTube({ className, title }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title ?? "YouTube"}>
      <rect x="1" y="4.5" width="22" height="15" rx="4.2" fill="#FF0000" />
      <path d="M10 8.7l6 3.3-6 3.3V8.7Z" fill="#fff" />
    </svg>
  );
}

function Facebook({ className, title }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title ?? "Facebook"}>
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path
        d="M15.1 12.4l.5-3.1h-3v-2c0-.85.42-1.68 1.75-1.68H15.7V2.98s-1.24-.21-2.42-.21c-2.47 0-4.08 1.5-4.08 4.2v2.38H6.44v3.1H9.2v7.5a11 11 0 0 0 3.4 0v-7.5h2.5Z"
        fill="#fff"
      />
    </svg>
  );
}

function LinkedIn({ className, title }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title ?? "LinkedIn"}>
      <rect x="1" y="1" width="22" height="22" rx="4" fill="#0A66C2" />
      <path
        d="M7.2 9.4H4.8v9.4h2.4V9.4ZM6 5.3a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm5.6 4.1H9.3v9.4h2.4v-4.9c0-1.3.25-2.55 1.85-2.55 1.58 0 1.6 1.48 1.6 2.63v4.82h2.4v-5.3c0-2.08-.45-3.68-2.88-3.68-1.17 0-1.95.64-2.27 1.25h-.03V9.4Z"
        fill="#fff"
      />
    </svg>
  );
}

function TwitterX({ className, title }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title ?? "X"}>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#000" />
      <path
        d="M14.9 6.2h1.9l-4.15 4.75L17.5 17.8h-3.8l-2.98-3.9-3.4 3.9H5.4l4.44-5.08L5.35 6.2h3.9l2.7 3.57L14.9 6.2Zm-.66 10.45h1.05L8.9 7.28H7.77l6.47 9.37Z"
        fill="#fff"
      />
    </svg>
  );
}

function Pinterest({ className, title }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title ?? "Pinterest"}>
      <circle cx="12" cy="12" r="11" fill="#E60023" />
      <path
        d="M12.3 5.4c-3.8 0-5.8 2.5-5.8 5.1 0 1.2.66 2.7 1.7 3.18.16.07.25.04.28-.12l.13-.53c.04-.16.02-.22-.1-.36-.4-.5-.65-1.1-.65-1.8 0-2.3 1.72-4.35 4.48-4.35 2.44 0 3.78 1.5 3.78 3.5 0 2.63-1.16 4.85-2.9 4.85-.95 0-1.66-.8-1.44-1.77.27-1.17.8-2.42.8-3.26 0-.75-.4-1.38-1.24-1.38-.98 0-1.78 1.02-1.78 2.39 0 .87.3 1.46.3 1.46l-1.18 5c-.35 1.48-.05 3.3-.03 3.48.02.1.15.13.2.05.1-.12 1.3-1.6 1.7-3.08.12-.42.66-2.56.66-2.56.32.62 1.28 1.16 2.3 1.16 3 0 5.05-2.74 5.05-6.4 0-2.77-2.35-5.35-5.92-5.35Z"
        fill="#fff"
      />
    </svg>
  );
}

// Neutral fallback so an unmapped key never renders blank (the exact bug the
// old duplicated-lucide grid had).
function Globe({ className, title }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title ?? "Platform"}>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#1C1C1C" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="#C9A84C" strokeWidth="1.4" />
      <path
        d="M12 6c-2 2-2 10 0 12M12 6c2 2 2 10 0 12M6.4 10h11.2M6.4 14h11.2"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="1.4"
      />
    </svg>
  );
}

const LOGOS: Record<string, React.FC<LogoProps>> = {
  instagram: Instagram,
  tiktok: TikTok,
  youtube: YouTube,
  facebook: Facebook,
  linkedin: LinkedIn,
  twitter_x: TwitterX,
  x: TwitterX,
  twitter: TwitterX,
  pinterest: Pinterest,
};

/** Full-colour brand mark for a platform key. Falls back to a neutral globe. */
export function BrandLogo({
  platform,
  className = "h-6 w-6",
  title,
}: {
  platform: string;
  className?: string;
  title?: string;
}) {
  const Logo = LOGOS[platform] ?? Globe;
  return <Logo className={className} title={title} />;
}

export const HAS_BRAND_LOGO = (platform: string) => platform in LOGOS;
