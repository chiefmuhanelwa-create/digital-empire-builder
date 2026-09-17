// ⛔ FACT-LOCK 2026-09-17 — LIVE PUBLIC SALES COPY (contentpreneur.africa).
// Never put a number on this page without checking
// ~/Desktop/NOCHILL-OS/02-INFORMATION/PROOF_BANK.csv.
// Never name the employer, workplace or industry. Never name a real person
// (Article IV). Governing ICP:
// ~/Desktop/NOCHILL-OS/02-UNDERSTANDING/audience/U-A-007-icp-by-tier.md
// Award claims: say "award-winning". State no total.

import { createFileRoute } from "@tanstack/react-router";
import { MailerLiteEmbedForm } from "@/components/MailerLiteEmbedForm";
import { Reveal, GlassCard, FunnelNav, FunnelFooter } from "@/components/funnel";

// THE STARTER KIT OPT-IN — contentpreneur.africa/starterkit
//
// COPY REPLACED 2026-09-01 from STARTERKIT-PAGE-AND-FUNNEL.md (founder brief,
// written for the Creator Lab talk on 2026-09-02). The QR code on the stage
// slide points here, so the page has to look like the slide: the H1 and the
// sub-headline are reproduced EXACTLY as they appear on it. Somebody scanning
// a QR has three seconds to confirm they are in the right place.
//
// THIS IS AN OPT-IN PAGE, NOT A SALES PAGE. Committed in writing to the event
// organiser: "It goes to a free resource, not a sales page." The speaker brief
// adds "please do not use your session to solicit business." So, enforced here:
//   · No price. Anywhere.
//   · No Accelerator, no Foundation Kit, no Community, no book.
//   · One ask, repeated once. No exit-intent, no countdown, no scarcity.
// The offer comes later, by email, once it has been earned.
//
// TAX IS THE DOOR, OWNERSHIP IS THE ROOM. The room arrives with a tax fright.
// Building them a tax product would start a second funnel for a secondary
// audience — the documented failure mode. So the page acknowledges the tax fear
// in the first three lines and reframes it in the next three. Same page, same
// kit, one funnel. The people who only wanted a tax hack will not opt in; that
// is the page working correctly, not failing.
//
// WHAT WAS REMOVED, and why it is not an oversight:
//   · The "780,000 followers" opener. The claim ledger forbids dating that loss
//     and the figure is contested; the new second block replaces it with the
//     R207,879.20 story, which is E1 and cleared.
//   · "What this will not do" — its job is now done by "Who it is not for".
//   · The P.S. It moves to the delivery email, per Part 3 of the brief.
//
// The MailerLite embed and slug v3XiMi are untouched — live lead capture.
// NOTE: the brief asks for ONE field (email only) and a "Send me the kit"
// button. Field count and button label belong to the MailerLite form, not to
// this file — they are a dashboard change, not a code change.
//
// Skin: the `funnel-paper` cream variant (styles.css). Sibling funnel pages
// (/foundation, /accelerator) keep the black-and-gold skin.
export const Route = createFileRoute("/starterkit")({
  head: () => ({
    meta: [
      { title: "Free Starter Kit — Contentpreneur Africa" },
      {
        name: "description",
        content:
          "Tax is the symptom. Ownership is the fix. The free Knowledge Entrepreneur Starter Kit — turn what you know into income you own.",
      },
    ],
    // WARM THE MAILERLITE HOSTS. Measured 2026-09-01 on Slow-4G + 4x CPU:
    // the form's inputs did not exist until 3505ms, because the whole chain
    // only starts AFTER hydration — inject universal.js (2764ms) -> forms
    // JSONP (2986ms) -> this form's JSONP (3042ms) -> their fonts (3321ms).
    // Every hop paid a fresh DNS + TLS handshake at 150ms RTT.
    //
    // preconnect pays those handshakes during HTML parse instead. preload
    // fetches universal.js into the cache WITHOUT executing it, so the
    // injection in MailerLiteEmbedForm hits a warm cache rather than the
    // network. Deliberately NOT moving the script into <head> to execute
    // early: universal.js scans for .ml-embedded nodes, and those do not
    // exist until React renders. Warming is a pure win; re-ordering is not.
    links: [
      { rel: "preconnect", href: "https://assets.mailerlite.com" },
      { rel: "preconnect", href: "https://assets.mlcdn.com" },
      { rel: "dns-prefetch", href: "https://assets.mailerlite.com" },
      { rel: "dns-prefetch", href: "https://assets.mlcdn.com" },
      { rel: "preload", href: "https://assets.mailerlite.com/js/universal.js", as: "script" },
    ],
  }),
  component: StarterKitFunnel,
});

// ── THE ASSESSMENT LINE ────────────────────────────────────────────────────
// R207,879.20 is E1 and is the ONLY publishable SARS figure. It is written in
// full and never rounded.
//
// ⚠️ THE TAX YEARS ARE A SEPARATE CLAIM AND ARE NOT CLEARED BY THE LEDGER.
// CLAUDE.md, "SARS story specifics": two internal records contradict each other
// "and even disagree on the tax years".
//
// 🔒 FOUNDER RULING 2026-09-01: raised before publishing, and ruled to ship as
// written in STARTERKIT-PAGE-AND-FUNNEL.md. A live founder instruction outranks
// the ledger (authority order, Article I), so this is settled — do NOT re-open
// it or silently remove it in a later session.
//
// Still isolated as one constant: if the records are ever reconciled the other
// way, set this to "" and the sentence reads correctly and stays true with the
// figure alone, which is E1 and the only publishable SARS figure.
const ASSESSMENT_PERIOD = ", across the 2020 to 2022 tax years";

// ── WHAT IS INSIDE ─────────────────────────────────────────────────────────
// Part 2 of the brief marks this block as SLOTS, in red: "fill these from the
// actual PDF. Do not let me or anyone else invent them... If a line isn't
// literally in the PDF, it comes out."
//
// Nothing here is invented. These are the eight worksheet NAMES already carried
// in this file with a dated provenance note — verified against the real
// deliverable PDF (Google Drive, 2026-08-08), which is where the "8 worksheets,
// not 7" correction came from. What changed is only the SHAPE the brief asks
// for: name the tool, never the topic, one line each, verb first.
const INSIDE: [string, string][] = [
  [
    "The Knowledge Audit",
    "List what people already come to you for, so it stops being a habit and starts being an inventory.",
  ],
  [
    "The Scorecard",
    "Score five areas honestly and find the one that is actually holding you back.",
  ],
  ["Your Lowest Score", "Turn that one area into a single instruction for the next thirty days."],
  ["The Positioning Blueprint", "Write the sentence: who you help, and with what."],
  [
    "Your First Content Engine",
    "Build four kinds of post so you never face an empty screen again.",
  ],
  ["River, Fish, Tank", "See why the followers are not yours — and what is."],
  ["Your First Offer", "Sketch one thing somebody could actually buy from you."],
  ["The PAIDS Map", "Map the five ways knowledge turns into income."],
];

const FOR_YOU = [
  "You know more than you are paid for.",
  "You are qualified, experienced, good at the thing — and none of it belongs to you in a form you can sell.",
  "You are busy. You do not need motivation. You need a structure.",
];

const NOT_FOR_YOU = [
  "Anyone looking for a shortcut. There isn't one in here.",
  "Anyone who wants followers rather than income.",
  "Anyone who wants somebody else to do it for them.",
];

/** Section label. A ruled, letter-spaced line — not a pill. */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--p-muted)]">
      {children}
    </p>
  );
}

/** The one hairline that separates every section. */
function Rule() {
  return <div className="mx-auto max-w-3xl border-t border-[var(--p-line)]" />;
}

/**
 * The single ask. Appears twice — same form, same words, same destination.
 *
 * THE HEADING IS OPTIONAL, AND SMALL, ON PURPOSE. MailerLite's form sometimes
 * renders its own title and sometimes does not — it changed under this page
 * twice on 2026-09-01 — so the card cannot depend on their markup for a
 * heading, and equally must not shout over it when it is there. Hence a
 * compact one, passed only by the hero card. The closing card already has a
 * section h2 immediately above it and passes nothing.
 *
 * The full-size heading that used to sit here cost ~46px in the exact place
 * the mobile fold budget is tightest — the difference between the Subscribe
 * button being on an iPhone SE screen or off it.
 *
 * THE SKELETON IS NOT DECORATION. MailerLite renders this form client-side,
 * and measured on Slow-4G that takes ~3.5s. For those 3.5s the card was a
 * heading floating above an empty white gap, which on a phone at an event
 * reads as broken, and the arrival of the real form shifted the page.
 *
 * It is swapped out by CSS alone — `.ml-embedded:empty + .ml-skeleton`, see
 * styles.css. MailerLite fills the div with children, so `:empty` stops
 * matching the instant the real form lands. No JS, no observer, no state,
 * and nothing to go wrong if their script never arrives at all.
 */
function OptIn({ heading }: { heading?: React.ReactNode }) {
  return (
    <GlassCard className="p-5 sm:p-9">
      {heading && (
        <h2 className="mb-4 text-[1.15rem] leading-tight sm:mb-5 sm:text-[1.4rem]">{heading}</h2>
      )}
      <MailerLiteEmbedForm formSlug="v3XiMi" />
      {/* Only ever seen if MailerLite is slow or never arrives. It carries a
          real sentence, not just grey bars, so a failed third party still
          leaves a card that says something. */}
      <div className="ml-skeleton">
        <p className="ml-skeleton-text">Loading the form&hellip;</p>
        <div className="ml-skeleton-bar ml-skeleton-field" />
        <div className="ml-skeleton-bar ml-skeleton-field" />
        <div className="ml-skeleton-bar ml-skeleton-button" />
      </div>
      <p className="mt-5 text-sm leading-relaxed text-[var(--p-muted)] sm:mt-6">
        The kit arrives immediately. One email. Leave any time.
      </p>
    </GlassCard>
  );
}

function StarterKitFunnel() {
  return (
    <div className="funnel funnel-paper min-h-screen">
      <FunnelNav ctaHref="#get" ctaLabel="Send me the kit" tone="paper" ctaHideOnMobile />

      {/* ── ABOVE THE FOLD. Must read as the stage slide. ────────────────── */}
      {/*
        THE ORDER IS DIFFERENT ON A PHONE, ON PURPOSE.

        Almost everyone arrives here by scanning a QR code off a slide, which
        means a phone, in a room, once. Measured on an iPhone 13 viewport
        (844px tall) BEFORE this change: the Subscribe button sat at 932px —
        below the fold. People had to scroll to find the only thing the page
        asks them to do, having already been told what it was from stage.

        So on mobile the DOM order is: headline -> THE FORM -> the three
        supporting lines. The promise, the ask, then the argument for anyone
        who wants it. On lg and up there is room for both columns, so explicit
        row/column placement puts the prose back in the left column and the
        form in the right, spanning both rows. One set of markup, one form.
      */}
      <section className="paper-hero relative z-10 px-5 pt-[4.5rem] pb-16 sm:pt-32 sm:pb-24 lg:pt-40">
        <div className="mx-auto grid max-w-5xl items-start gap-x-16 gap-y-6 sm:gap-y-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-y-8">
          {/* The promise. */}
          <Reveal className="lg:col-start-1 lg:row-start-1">
            <Label>Free · The Knowledge Entrepreneur Starter Kit</Label>
            <h1 className="mt-5 text-[2.1rem] leading-[1.12] sm:mt-6 sm:text-5xl md:text-[3.35rem] md:leading-[1.08]">
              Turn What You Know Into <span className="grad-gold">Income You Own</span>
            </h1>
            <p className="mt-4 text-lg font-medium leading-snug text-[var(--p-ink)] sm:mt-5 sm:text-2xl">
              Tax is the symptom. Ownership is the fix.
            </p>
          </Reveal>

          {/* The ask. Second on a phone; right-hand column on a desktop. */}
          <Reveal delay={100} className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <div id="get" className="scroll-mt-24">
              <OptIn heading={<>Send me the Starter Kit &mdash; free</>} />
            </div>
          </Reveal>

          {/* The argument, for anyone who wants it before deciding. */}
          <Reveal delay={160} className="lg:col-start-1 lg:row-start-2">
            <div className="space-y-5 text-lg leading-[1.65] text-[var(--p-body)]">
              <p className="max-w-[38ch]">You know more than you are being paid for.</p>
              <p className="max-w-[38ch]">
                The money that does come in arrives on someone else&rsquo;s terms, in someone
                else&rsquo;s format, whenever they decide.
              </p>
              <p className="max-w-[38ch] font-medium text-[var(--p-ink)]">
                This kit is the first step out of that.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <Rule />

      {/* ── THE HONEST REASON IT EXISTS. ─────────────────────────────────── */}
      <section className="relative z-10 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-[1.75rem] leading-[1.2] sm:text-4xl">
              I built this because of <span className="grad-gold">a number</span>
            </h2>
            <div className="mt-9 space-y-6 text-lg leading-[1.7] text-[var(--p-body)]">
              <p className="measure">
                In 2020 I was doing well. Brand money was landing. It felt like winning.
              </p>
              <p className="measure">
                I took a week off and went through my finances. No savings. No investments. No
                assets. Two good years had left nothing structural behind.
              </p>
              <p className="measure">
                Then the assessment came.{" "}
                <strong className="font-semibold text-[var(--p-ink)]">R207,879.20</strong>
                {ASSESSMENT_PERIOD}.
              </p>
              <p className="measure">
                I was not hiding anything. I assumed. I never asked. And assuming is a decision
                &mdash; it just sends its invoice late.
              </p>
              <p className="measure font-medium text-[var(--p-ink)]">
                I am still carrying it. I have not paid it off, and I am not going to pretend
                otherwise to make this page sound better.
              </p>
              <p className="measure">
                What I did do is build the system I wish somebody had handed me in 2020. That system
                is not about tax. Tax was the symptom. The real problem was that everything I earned
                arrived on rented land &mdash; someone else&rsquo;s platform, someone else&rsquo;s
                brief, someone else&rsquo;s timing &mdash; and I owned none of the structure it
                landed in.
              </p>
              <p className="measure font-medium text-[var(--p-ink)]">
                This kit is where that changes.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <Rule />

      {/* ── WHAT IS INSIDE. Named tools, verb first, nothing invented. ───── */}
      <section className="relative z-10 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Label>What is in it</Label>
            <h2 className="mt-5 text-[1.75rem] leading-[1.2] sm:text-4xl">What&rsquo;s inside</h2>
          </Reveal>

          <div className="mt-11 border-t border-[var(--p-line)]">
            {INSIDE.map(([title, line], i) => (
              <Reveal key={title} delay={i * 40}>
                <div className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-[var(--p-line)] py-6 sm:grid-cols-[3.25rem_1fr] sm:py-7">
                  <span className="pt-0.5 text-sm font-semibold tabular-nums text-[var(--p-gold-text)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-semibold text-[var(--p-ink)]">{title}</div>
                    <div className="mt-2 max-w-[58ch] text-[15px] leading-[1.65] text-[var(--p-body)]">
                      {line}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Rule />

      {/* ── THE FILTER. Repels the wrong people, makes the right ones feel
             found. This block does more work than any other on the page. ── */}
      <section className="relative z-10 px-5 py-20 sm:py-28">
        <div className="mx-auto grid max-w-3xl gap-12 sm:grid-cols-2 sm:gap-10">
          <Reveal>
            <h2 className="text-[1.4rem] leading-[1.25] sm:text-[1.6rem]">Who this is for</h2>
            <ul className="mt-6 space-y-4 leading-[1.65] text-[var(--p-body)]">
              {FOR_YOU.map((line) => (
                <li key={line} className="border-t border-[var(--p-line)] pt-4">
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="text-[1.4rem] leading-[1.25] sm:text-[1.6rem]">Who it is not for</h2>
            <ul className="mt-6 space-y-4 leading-[1.65] text-[var(--p-muted)]">
              {NOT_FOR_YOU.map((line) => (
                <li key={line} className="border-t border-[var(--p-line)] pt-4">
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <Rule />

      {/* ── CLOSING CTA. Nothing below this but the legal footer. ────────── */}
      <section className="relative z-10 px-5 pb-28 pt-20 sm:pt-24">
        <div className="mx-auto max-w-lg">
          <Reveal>
            <h2 className="text-center text-[1.75rem] leading-[1.2] sm:text-4xl">
              Start with what you <span className="grad-gold">already know</span>
            </h2>
            <div className="mt-10">
              <OptIn />
            </div>
            <p className="mt-10 text-center text-sm text-[var(--p-muted)]">
              Ndivhuwo Muhanelwa &middot; Founder, Contentpreneur Africa
            </p>
          </Reveal>
        </div>
      </section>

      <FunnelFooter tone="paper" />
    </div>
  );
}
