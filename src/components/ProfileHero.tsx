import { Instagram, Facebook, Youtube } from "lucide-react";

// Replicates the real "cp-profile-hero" section from the live Shopify store
// (contentcreatorhub.online) — fetched and parsed directly 2026-07-28, not
// guessed from planning docs. Same structure: photo in a gold-gradient ring,
// handle, name, stat pills, a gold-bordered "trusted seller" bio card, social
// links. Colors are the exact values pulled from that site's own
// contentpreneur.css, not approximations.

// lucide-react has no TikTok icon — this is the real path data from the live
// site's own inline SVG, not an approximation.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z" />
    </svg>
  );
}

const SOCIALS = [
  { href: "https://www.instagram.com/nochill_god/", label: "Instagram", Icon: Instagram },
  { href: "https://www.tiktok.com/@nochillgod", label: "TikTok", Icon: TikTokIcon },
  { href: "https://www.youtube.com/channel/UCJfGaqEo8zY3nNybI0Sd53g", label: "YouTube", Icon: Youtube },
  { href: "https://www.facebook.com/NdivhuwoMuhanelwaQuotes/", label: "Facebook", Icon: Facebook },
];

export function ProfileHero() {
  return (
    <section className="border-b border-border bg-white py-10 text-center">
      <div className="mx-auto max-w-md px-6">
        <div
          className="mx-auto flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full"
          style={{
            border: "2.5px solid #D4AF37",
            boxShadow: "0 0 0 4px #d4af3726, 0 4px 16px #0000001a",
          }}
        >
          <img src="/ndivhuwo-profile.png" alt="Ndivhuwo Muhanelwa" className="h-full w-full object-cover" />
        </div>

        <p className="mt-3 text-sm text-[#000]">@nochill_god</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-[#000]">Ndivhuwo Muhanelwa</h1>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {["3M+ Followers", "50+ Brand Deals", "Author"].map((s) => (
            <span
              key={s}
              className="rounded-full border border-[#D4AF37]/40 bg-[#f5f5f5] px-3 py-1 text-xs font-semibold text-[#000]"
            >
              {s}
            </span>
          ))}
        </div>

        <div
          className="relative mt-5 rounded-xl p-4 text-left"
          style={{
            background:
              "linear-gradient(#fff,#fffdf8) padding-box, linear-gradient(135deg,#c9a84c,#f5d77e 18%,#d4af37 42%,#ffe57a,#b8860b 82%,#d4af37) border-box",
            border: "2px solid transparent",
            boxShadow: "0 0 0 1px #d4af3714, 0 4px 20px #d4af3733, 0 1px 6px #0000000d",
          }}
        >
          <span
            className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-[18px] py-[5px] text-[9px] font-extrabold uppercase tracking-[2px]"
            style={{ background: "#111", color: "#d4af37", border: "1px solid rgba(212,175,55,.4)" }}
          >
            ★★★★ Best Trusted Seller
          </span>
          <p className="text-sm leading-relaxed text-[#000]">
            Digital resources for African content creators who are serious about building a business — not
            just a following. Created by Ndivhuwo Muhanelwa | 3M+ Followers |{" "}
            <span className="font-bold" style={{ color: "#6b4600" }}>50+ Brand Deals</span> | Author |{" "}
            <span className="font-bold" style={{ color: "#6b4600" }}>Humanz Top 20 African Creators 2026</span> |
            10x Industry Award Winner. Everything here is built from real experience — these are the exact
            tools used to turn content into multiple income streams.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4">
          {SOCIALS.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-[#000] opacity-70 transition-opacity hover:opacity-100"
            >
              <Icon className="size-5" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
