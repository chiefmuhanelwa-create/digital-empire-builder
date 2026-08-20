import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { MailerLiteEmbedForm } from "@/components/MailerLiteEmbedForm";
import { useToolView } from "@/lib/tool-analytics";
import { DotGrid, GoldGlow, Eyebrow, Pill } from "@/components/tools/premium";
import { TAX_THRESHOLD, TAX_YEAR } from "@/lib/provisional-tax-engine";

// Step 2 of the tax funnel: calculator (no email) → THIS (email) → paid guide.
//
// Structure is deliberately FORM-FIRST. The first version put the form 1170px
// down the page, behind a hero and a full cover mockup — four swipes on a phone
// before the reader could act. Everything above the form is now one screen's
// worth; the proof and detail sit BELOW it, for the people who need convincing
// rather than in front of the people who don't.
//
// The embed also has to be tamed. MailerLite ships its own container, fonts,
// grey panel and a heading that repeats the offer, which lands as a foreign
// object in the middle of a branded page. ML_FORM_CSS restyles it in place and
// hides the duplicate heading. Everything is scoped under `.ml-brand`, so the
// other MailerLite embeds on the site (/creator-bundle, /starterkit) are
// untouched.

export const Route = createFileRoute("/tax-guide")({
  head: () => ({
    meta: [
      { title: "Free: The Creator Tax Starter — get tax-ready in an afternoon | CHKPLT" },
      {
        name: "description",
        content:
          "SARS sees your creator income from rand one. The Creator Tax Starter walks you through registering, what you can deduct, and the two dates that matter. Free.",
      },
      { property: "og:title", content: "The Creator Tax Starter — Free | CHKPLT" },
    ],
  }),
  component: TaxGuidePage,
});

const ML_FORM_CSS = `
.ml-brand .ml-form-embedContainer,
.ml-brand .ml-form-embedWrapper {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
}
.ml-brand .ml-form-embedBody { padding: 0 !important; margin: 0 !important; }
/* MailerLite repeats the offer title and blurb; the panel above already says
   both. Two competing headings in two type systems is what made this read as
   pasted-in rather than designed. */
.ml-brand .ml-form-embedContent { display: none !important; }
.ml-brand .ml-form-embedContainer * { font-family: inherit !important; }
.ml-brand .ml-form-fieldRow { margin: 0 0 10px !important; }
.ml-brand input.form-control {
  width: 100% !important;
  border: 1px solid #d4cec3 !important;
  border-radius: 12px !important;
  background: #fff !important;
  padding: 14px 16px !important;
  font-size: 16px !important;   /* 16px minimum or iOS zooms the page on focus */
  line-height: 1.3 !important;
  color: #1C1C1C !important;
  height: auto !important;
  box-shadow: none !important;
}
.ml-brand input.form-control:focus {
  border-color: #C9A84C !important;
  box-shadow: 0 0 0 4px rgba(201,168,76,0.15) !important;
  outline: none !important;
}
.ml-brand .ml-form-embedSubmit { margin: 14px 0 0 !important; }
.ml-brand .ml-form-embedSubmit button {
  width: 100% !important;
  background: #1C1C1C !important;
  color: #ffffff !important;
  border: 0 !important;
  border-radius: 12px !important;
  min-height: 54px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
  transition: background .2s, color .2s !important;
}
.ml-brand .ml-form-embedSubmit button:hover {
  background: #C9A84C !important;
  color: #1C1C1C !important;
}
.ml-brand .ml-form-embedPermissions,
.ml-brand .ml-form-embedPermissionsContent,
.ml-brand .ml-form-embedPermissionsContent p {
  font-size: 11.5px !important;
  color: #8a8480 !important;
  line-height: 1.5 !important;
  padding: 0 !important;
  margin: 10px 0 0 !important;
  text-align: left !important;
}
.ml-brand .ml-form-successBody { padding: 0 !important; text-align: left !important; }
.ml-brand .ml-form-successContent h4 {
  font-size: 20px !important;
  font-weight: 800 !important;
  color: #1C1C1C !important;
  margin: 0 0 6px !important;
}
.ml-brand .ml-form-successContent p {
  font-size: 15px !important;
  color: #4b4741 !important;
  margin: 0 !important;
}
/* Hold the space the form will occupy, so nothing below it jumps when the
   MailerLite script finishes loading. */
.ml-brand { min-height: 290px; }
`;

const INSIDE = [
  {
    t: "Whether you even need to register",
    d: `The threshold is R${TAX_THRESHOLD.toLocaleString("en-ZA")}. Most creators have no idea they crossed it two years ago.`,
  },
  {
    t: "Every deduction you're allowed",
    d: "Camera, laptop, data, software, the room you film in, the Uber to the shoot. Most creators claim none of it and overpay.",
  },
  {
    t: "The two dates that actually matter",
    d: "31 August and the last day of February. Miss them and the penalty lands on top of the tax.",
  },
  {
    t: "What SARS wants you to keep",
    d: "Invoices, platform statements, receipts — and how to file them so a tax year takes an hour, not a weekend.",
  },
  {
    t: "How to come forward if you're behind",
    d: "The route I actually used. Coming forward voluntarily is what makes penalties negotiable.",
  },
];

const BULLETS = ["Free, no card", "Lands in under a minute", "Written for SA creators"];

function TaxGuidePage() {
  useToolView("tax-guide");

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <style dangerouslySetInnerHTML={{ __html: ML_FORM_CSS }} />
      <SiteHeader />

      {/* ── Above the fold: the promise and the form. Nothing else. ────── */}
      <section className="relative overflow-hidden bg-[#FAF7F0]">
        <DotGrid />
        <GoldGlow className="-right-32 -top-40" size={520} opacity={0.5} />
        <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-4 sm:px-6 sm:pb-16">
          <BackNav to="/tools" label="All tools" />

          {/* Mobile stacks headline -> FORM -> reassurance, so the form is in
              the first screen. From lg it becomes two columns with the bullets
              tucked under the headline and the form alongside. */}
          <div className="mt-6 flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_minmax(360px,400px)] lg:items-start lg:gap-x-12 lg:gap-y-6">
            <div className="lg:col-start-1 lg:row-start-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Eyebrow>Free guide</Eyebrow>
                <Pill className="whitespace-nowrap">$12 value</Pill>
              </div>
              <h1 className="mt-5 font-display text-[31px] font-extrabold leading-[1.07] tracking-[-0.02em] text-[#1C1C1C] sm:text-[44px]">
                SARS already knows
                <br />
                about <span className="text-[#C9A84C]">your money</span>.
              </h1>
              <p className="mt-4 max-w-lg text-[15.5px] leading-[1.6] text-neutral-600 sm:text-[16.5px]">
                Brand deals, AdSense, TikTok, affiliate — taxable from rand one, and nobody sits
                creators down and explains it.{" "}
                <strong className="text-[#1C1C1C]">The Creator Tax Starter</strong> does: register
                properly, claim what you're owed, stop dreading the post.
              </p>
            </div>

            {/* The form. On mobile this sits directly under the headline. */}
            <div className="rounded-2xl lg:col-start-2 lg:row-start-1 lg:row-span-2 border border-neutral-200/90 bg-white p-5 shadow-[0_18px_50px_-24px_rgba(28,28,28,0.28)] sm:p-6">
              <div className="flex items-center gap-3 border-b border-neutral-200/70 pb-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1C1C1C] font-display text-[11px] font-extrabold text-[#C9A84C]">
                  TAX
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[16px] font-bold leading-tight text-[#1C1C1C]">
                    Creator Tax Starter
                  </span>
                  <span className="block text-[12.5px] text-neutral-500">
                    Where should I send it?
                  </span>
                </span>
              </div>
              <div className="ml-brand mt-4">
                <MailerLiteEmbedForm formSlug="DkGjRH" />
              </div>
            </div>

            {/* Reassurance sits BELOW the form on a phone — it is what makes
                someone finish, not what makes them start. */}
            <ul className="space-y-2 lg:col-start-1 lg:row-start-2 lg:mt-0">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-[14.5px] text-neutral-700">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]">
                    <svg
                      viewBox="0 0 12 12"
                      className="h-2.5 w-2.5 text-[#1C1C1C]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        d="M2.5 6.5l2.5 2.5 4.5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Below the fold: for the people who need convincing ─────────── */}
      <main className="mx-auto max-w-5xl px-5 pb-20 sm:px-6">
        <section className="pt-2">
          <Eyebrow tone="muted">What's inside</Eyebrow>
          <h2 className="mt-3 font-display text-[24px] font-extrabold leading-tight tracking-tight text-[#1C1C1C] sm:text-[30px]">
            The things nobody tells a creator.
          </h2>
          <div className="mt-6 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {INSIDE.map((i, n) => (
              <div key={i.t} className="flex gap-4 p-5">
                <span className="mt-0.5 font-mono text-[11px] font-bold tracking-widest text-[#C9A84C]">
                  {String(n + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[16px] font-bold leading-snug text-[#1C1C1C]">
                    {i.t}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600">{i.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative mt-10 overflow-hidden rounded-3xl bg-[#1C1C1C] p-6 sm:p-9">
          <DotGrid dark />
          <GoldGlow className="-bottom-32 -left-20" size={420} opacity={0.65} />
          <div className="relative max-w-2xl">
            <Eyebrow className="!text-[#C9A84C]">Why I wrote it</Eyebrow>
            <h2 className="mt-3 font-display text-[24px] font-extrabold leading-tight tracking-tight text-white sm:text-[32px]">
              I got the letter. <span className="text-[#C9A84C]">R207,879.</span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/75">
              I earned from content for years and declared nothing — not because I was hiding,
              because nobody taught me. Then the assessment came:{" "}
              <strong className="text-white">R207,879</strong>, for tax I had already spent. I came
              forward and took proper advice rather than hiding.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/75">
              I am still carrying it. That is exactly why I am telling you now — ignorance is what's
              expensive, and you're reading this before your letter arrives.
            </p>
          </div>
        </section>

        <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center">
          <div className="max-w-md">
            <h3 className="font-display text-[17px] font-bold text-[#1C1C1C] sm:text-[19px]">
              Want your number right now?
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600">
              Free, no email needed — real SARS {TAX_YEAR} brackets and both payment dates.
            </p>
          </div>
          <Link
            to="/provisional-tax"
            className="inline-flex min-h-[50px] shrink-0 items-center rounded-xl bg-[#1C1C1C] px-6 text-[14.5px] font-bold text-white transition hover:bg-[#C9A84C] hover:text-[#1C1C1C]"
          >
            Open the calculator →
          </Link>
        </div>

        <p className="mt-8 text-center text-[12.5px] leading-relaxed text-neutral-500">
          This guide is education, not tax advice. Confirm your own position with a registered tax
          practitioner.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
