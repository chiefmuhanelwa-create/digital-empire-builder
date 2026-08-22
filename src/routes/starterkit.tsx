import { createFileRoute } from "@tanstack/react-router";
import { MailerLiteEmbedForm } from "@/components/MailerLiteEmbedForm";
import { Reveal, Orbs, Eyebrow, GlassCard, FunnelNav, FunnelFooter } from "@/components/funnel";

// THE STARTER KIT OPT-IN — contentpreneur.africa/starterkit
//
// REBUILT 2026-08-22 as a funnel. On a free lead magnet the FORM is the single
// CTA — there is nothing to buy, so every button on the page points at the same
// email field. The old page had the form plus two ladder buttons (Foundation
// Kit and Accelerator) sitting in a card near the bottom, which is a page
// asking a stranger to make three decisions instead of one.
//
// Those two exits are gone. Somebody who opts in gets sold the Foundation Kit
// by the email sequence, which is the entire point of capturing the address.
//
// The MailerLite embed stays exactly as it was — it is live lead capture and
// the founder's instruction was to leave MailerLite alone. It is wrapped in a
// glass card so it reads as part of the page rather than a pasted widget.
export const Route = createFileRoute("/starterkit")({
  head: () => ({
    meta: [
      { title: "Free Knowledge Entrepreneur Starter Kit" },
      {
        name: "description",
        content:
          "8 short worksheets that turn expertise you have never charged for into a positioning sentence, a first offer and a price. Free, no card, no call.",
      },
    ],
  }),
  component: StarterKitFunnel,
});

// Verified against the real deliverable PDF (Google Drive, 2026-08-08) — 8
// modules, not 7. Each carries its benefit, not its label.
const MODULES: [string, string][] = [
  ["The Knowledge Audit", "Stop wondering whether you are expert enough. The thing people already pay others for, in your own handwriting."],
  ["The Scorecard", "Stop working on the wrong thing. Five axes scored honestly, so effort goes where it changes something."],
  ["Your Lowest Axis", "A thirty-day plan you did not have to design. One instruction, not a to-do list."],
  ["The Positioning Blueprint", "A sentence a stranger can repeat. The end of “so what is it you actually do?”"],
  ["Your First Content Engine", "Never open a blank page again. Four jobs, one idea each."],
  ["River, Fish, Tank", "Stop building on ground you do not own, so one morning cannot cost you everything."],
  ["Your First Offer", "A price, written down, for the first time in your career."],
  ["The PAIDS Map", "The five income routes you have been walking past."],
];

function StarterKitFunnel() {
  return (
    <div className="funnel min-h-screen">
      <Orbs tint="amber" />
      <FunnelNav ctaHref="#get" ctaLabel="Get the kit" />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-28 pb-14 sm:pt-36">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <Eyebrow>Free · Delivered by email + WhatsApp</Eyebrow>
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05]">
              Strangers share <span className="grad-gold">your number.</span>
            </h1>
            <p className="mt-7 text-lg sm:text-xl leading-relaxed text-slate-300">
              Not your business card. Your personal number, passed along by someone you have never
              met, because you are the one who knows how to do the thing.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              You answer. You always answer. It takes you twenty minutes and eleven years.
            </p>
            <p className="mt-4 text-xl leading-relaxed text-white">
              And then nothing happens — because there is nothing to happen. There is no price. There
              was never going to be a price.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div id="get" className="scroll-mt-24">
              <GlassCard className="p-6 sm:p-8" accent="rgba(251,191,36,0.35)">
                <h2 className="text-2xl font-black leading-tight">
                  Send me the <span className="grad-gold">eight worksheets</span>
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Ninety minutes. No card, no call.
                </p>
                <div className="mt-5">
                  <MailerLiteEmbedForm formSlug="v3XiMi" />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  We'll email your kit, and WhatsApp you if there is something worth your time. No
                  spam, unsubscribe anytime.
                </p>
              </GlassCard>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── THE PROSPECT, IN HER OWN WORDS ───────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="text-lg leading-relaxed text-slate-300">
              An academic support advisor wrote to me. Two of the students she helped won scholarships
              — the kind that change what a family looks like in ten years.
            </p>
            <p className="mt-4 text-xl text-white">She has never charged anybody a cent.</p>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              When I asked her to describe what she does, she wrote back:
            </p>
            <blockquote className="mt-6 border-l-2 border-amber-400 pl-6 text-2xl sm:text-3xl font-black leading-snug">
              “I'm not sure how to put that in one sentence.”
            </blockquote>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              That is the whole problem, and it is not a knowledge problem. She knows more than most
              people charging R5,000 an hour for the same work. What she does not have is a structure
              around it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── COST OF DELAY. The reader's own arithmetic, never our claim. ─── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              Count what this year <span className="grad-gold">cost you</span>
            </h2>
            <p className="mt-3 text-lg text-slate-400">Not what you spent. What you never charged.</p>
          </Reveal>
          <div className="mt-10 space-y-4">
            {[
              "The talk you gave. How many times? What would a trainer have been paid for that day?",
              "The WhatsApp questions. Say two a week, twenty minutes each — that is roughly thirty full working days, unbilled.",
              "The document you reviewed as a favour. The one you rewrote. The junior you carried.",
              "The person who asked you in March and asked somebody else in June, because you never said a number.",
            ].map((t, i) => (
              <Reveal key={t} delay={i * 70}>
                <div className="flex items-start gap-4 border-b border-white/10 pb-4">
                  <span className="font-black text-amber-400">—</span>
                  <p className="leading-relaxed text-slate-300">{t}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={300}>
            <p className="mt-8 text-lg leading-relaxed text-slate-300">
              Put a rough rate on your own hour and multiply. Whatever number you land on, it is not
              money you lost — it is money that was offered to you and you handed back, politely, over
              and over, because nobody ever taught you the sentence.
            </p>
            <p className="mt-5 text-2xl sm:text-3xl font-black">And the meter is still running.</p>
          </Reveal>
        </div>
      </section>

      {/* ── PROOF. Every figure traced to PROOF.md. No date on the 780K. ─── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-black leading-tight">
              You are further ahead <span className="grad-gold">than I was</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-center leading-relaxed text-slate-300">
              I had 780,000 followers and some months I was doing maths in my head about the
              electricity while strangers stopped me in shops. Then one morning the account was gone.
              No explanation, and nobody owed me one.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              ["780,000", "followers, gone in one morning"],
              ["R207,879", "assessed by SARS when I had no system"],
              ["R200", "my first ever payment online"],
            ].map(([n, l], i) => (
              <Reveal key={n} delay={i * 90}>
                <GlassCard className="p-7 text-center">
                  <div className="text-3xl font-black grad-gold">{n}</div>
                  <div className="mt-2 text-sm text-slate-400">{l}</div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
          <Reveal delay={280}>
            <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-white">
              You did not spend a decade chasing attention. You spent it becoming genuinely good at
              something. You are further ahead than I was — and you are being paid for almost none of it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── WHAT'S INSIDE ────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-black leading-tight">
              Eight worksheets. <span className="grad-gold">Ninety minutes.</span>
            </h2>
            <p className="mt-4 text-center text-slate-400">
              Nothing new to make. Everything it asks about, you already have.
            </p>
          </Reveal>
          <div className="mt-10 space-y-3">
            {MODULES.map(([title, desc], i) => (
              <Reveal key={title} delay={i * 45}>
                <GlassCard className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="font-black text-amber-400">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="font-bold">{title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-slate-400">{desc}</div>
                    </div>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
          <Reveal delay={400}>
            <p className="mt-8 leading-relaxed text-slate-300">
              You finish with a one-page summary: your positioning sentence, your weakest axis, your
              first offer, and a price. That is further than most people with twenty years of expertise
              ever get.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── HONEST BOUNDARIES ────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">Three things this is not</h2>
            <div className="mt-7 space-y-5 text-slate-300">
              <p><strong className="text-white">Not a motivational PDF.</strong> No live sessions, nothing to wait for, nothing to attend.</p>
              <p><strong className="text-white">Not a sales letter in disguise.</strong> The kit stops at <em>I know exactly what to do next</em>, and says so on its first page.</p>
              <p><strong className="text-white">Not going to work if you do not write in it.</strong> Reading it takes twelve minutes and changes nothing.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CLOSE. The same single ask. ──────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-24 pt-8">
        <div className="mx-auto max-w-lg">
          <Reveal>
            <GlassCard className="p-7 sm:p-9" accent="rgba(251,191,36,0.35)">
              <h2 className="text-center text-2xl sm:text-3xl font-black leading-tight">
                Send me the <span className="grad-gold">eight worksheets</span>
              </h2>
              <div className="mt-6">
                <MailerLiteEmbedForm formSlug="v3XiMi" />
              </div>
            </GlassCard>
            <p className="mt-10 text-sm italic leading-relaxed text-slate-500">
              P.S. — Question one is “what have you done for 3+ years that people regularly ask you
              about?” If the answer came to you while reading that sentence, you are closer than you
              think. Write it down before you close this page — that thought will be gone by tonight,
              the way it has been every other time.
            </p>
          </Reveal>
        </div>
      </section>

      <FunnelFooter />
    </div>
  );
}
