import { createFileRoute } from "@tanstack/react-router";
import { MailerLiteEmbedForm } from "@/components/MailerLiteEmbedForm";
import { Reveal, Orbs, Eyebrow, GlassCard, FunnelNav, FunnelFooter } from "@/components/funnel";

// THE STARTER KIT OPT-IN — contentpreneur.africa/starterkit
//
// COPY REWRITTEN 2026-08-22: "use their language — and make sense".
//
// THE LOGIC THAT MAKES THE LADDER MAKE SENSE.
// Each page now opens on the person whose exact problem that tier solves:
//
//   Starter Kit   "I'm not sure how to put that in one sentence."
//                 → the Positioning Blueprint is literally that sentence.
//   Foundation    "At what point do I start charging?"
//                 → the Charge Gate is literally that answer.
//   Accelerator   "I am not starting from zero, but I need direction."
//                 → seven stages is literally that direction.
//
// Real messages, kept word for word, attributed by profession only.
//
// Note how plain their words are. Nobody writes "monetise your expertise". They
// write not sure, not too certain, I need direction. This page matches that. If
// a line sounds like a course being sold, it is wrong and it goes.
//
// This page does NOT sell the Foundation Kit. It captures the address; the email
// sequence does the selling. The two ladder buttons that used to sit near the
// bottom asked a stranger to make three decisions instead of one.
//
// The MailerLite embed and slug v3XiMi are untouched — live lead capture.
export const Route = createFileRoute("/starterkit")({
  head: () => ({
    meta: [
      { title: "Free Starter Kit — Contentpreneur Africa" },
      {
        name: "description",
        content:
          "Eight short worksheets. Ninety minutes. You finish able to say what you do in one sentence — and what you would charge for it.",
      },
    ],
  }),
  component: StarterKitFunnel,
});

// Verified against the real deliverable PDF (Google Drive, 2026-08-08) — 8
// worksheets, not 7. Each is described by what you end up holding, in the
// plainest words available.
const WORKSHEETS: [string, string][] = [
  ["The Knowledge Audit", "The list of things people already come to you for. Written down, so it stops being a habit and starts being an inventory."],
  ["The Scorecard", "Five areas, scored honestly. You see which one is actually holding you back — it is rarely the one you assume."],
  ["Your Lowest Score", "One instruction for the next thirty days. Not a list of ten things. One."],
  ["The Positioning Blueprint", "The sentence. Who you help, and with what. Short enough that somebody can repeat it back to you correctly."],
  ["Your First Content Engine", "Four kinds of post, one idea each. So you never sit looking at an empty screen again."],
  ["River, Fish, Tank", "Why the followers are not yours, and what is. Ten minutes that change where you put your effort."],
  ["Your First Offer", "One thing somebody could actually buy from you, sketched out on a page."],
  ["The PAIDS Map", "Five ways knowledge turns into income. You are probably walking past three of them."],
];

function StarterKitFunnel() {
  return (
    <div className="funnel min-h-screen">
      <Orbs tint="amber" />
      <FunnelNav ctaHref="#get" ctaLabel="Get the kit" />

      {/* ── HERO. Her sentence, because it is the exact thing the kit fixes. */}
      <section className="relative z-10 px-4 pt-28 pb-14 sm:pt-36">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <Eyebrow>Free · 8 worksheets · about 90 minutes</Eyebrow>
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05]">
              “I'm not sure how to put that in <span className="grad-gold">one sentence.</span>”
            </h1>
            <p className="mt-7 text-lg sm:text-xl leading-relaxed text-slate-300">
              An academic support advisor wrote that to me. Two of the students she helped won
              scholarships. Strangers pass her personal number around. She has never charged anybody.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              She knows the work. She just cannot say what it is.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-white">
              If you have ever been asked what you do and heard yourself waffle — this is that, and
              this kit is the fix.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div id="get" className="scroll-mt-24">
              <GlassCard className="p-6 sm:p-8" accent="rgba(251,191,36,0.35)">
                <h2 className="text-2xl font-black leading-tight">
                  Send me the <span className="grad-gold">eight worksheets</span>
                </h2>
                <p className="mt-2 text-sm text-slate-400">Free. No card. Nothing to attend.</p>
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

      {/* ── WHY IT HAPPENS. Removes the blame, keeps the problem. ────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              It is not that you <span className="grad-gold">don't know enough</span>
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate-300">
              <p className="measure">
                You have spent years getting good at something. Nobody spent ten minutes teaching you
                how to describe it, price it, or put it in front of anybody.
              </p>
              <p className="measure">
                That is not a gap in your knowledge. It is a gap in the structure around it — and it
                is the reason people keep asking you for things and keep not paying you for them.
              </p>
              <p className="measure text-white">
                You cannot charge for something you cannot name. So we start with the name.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── WHAT YOU END UP HOLDING. ─────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-black leading-tight">
              Eight worksheets. <span className="grad-gold">One evening.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
              Nothing to research and nothing to invent. Every question is about work you have already
              done.
            </p>
          </Reveal>
          <div className="mt-10 space-y-3">
            {WORKSHEETS.map(([title, desc], i) => (
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
            <GlassCard className="mt-10 p-7" accent="rgba(34,197,94,0.3)">
              <h3 className="text-xl font-black">By the end you can answer four questions</h3>
              <ul className="mt-5 space-y-3 text-slate-300">
                <li>· What do you actually do — in one sentence somebody could repeat?</li>
                <li>· Who is it for?</li>
                <li>· What is the one thing they could buy from you?</li>
                <li>· What is the first number you would put on it?</li>
              </ul>
              <p className="mt-5 leading-relaxed text-slate-400">
                Four answers, on one page, in your own handwriting. Most people with twenty years of
                expertise have never written them down.
              </p>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* ── PROOF. Short, and pointed at why he is the one saying this. ──── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Why I am the one <span className="grad-gold">handing you this</span>
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate-300">
              <p className="measure">
                I had 780,000 followers and I was still doing sums in my head about the electricity.
                Then one morning the account was gone and nobody owed me an explanation.
              </p>
              <p className="measure">
                Everything I had used to prove I mattered belonged to somebody else, and they switched
                it off.
              </p>
              <p className="measure text-white">
                You are further ahead than I was. You spent your years getting good at something real
                instead of chasing attention. You are just not being paid for it yet.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HONEST LIMITS. Says what it will not do. ─────────────────────── */}
      <section className="relative z-10 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">What this will not do</h2>
            <div className="mt-7 space-y-5 text-slate-300">
              <p>
                <strong className="text-white">It will not motivate you.</strong> There is no pep talk
                in it. You do not need one — you need a structure.
              </p>
              <p>
                <strong className="text-white">It stops at clarity.</strong> You finish knowing what
                you do, who it is for and what you would charge. Actually going and getting paid is
                the next thing, and it is not this.
              </p>
              <p>
                <strong className="text-white">It will not work if you only read it.</strong> Reading
                takes twelve minutes and changes nothing. The questions only work if you answer them.
              </p>
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
              <p className="mt-2 text-center text-sm text-slate-400">Free. No card. Nothing to attend.</p>
              <div className="mt-6">
                <MailerLiteEmbedForm formSlug="v3XiMi" />
              </div>
            </GlassCard>
            <p className="mt-10 text-sm italic leading-relaxed text-slate-500">
              P.S. — The first question is: what have you been doing for three years or more that
              people keep asking you about? If an answer came to you while you read that, write it
              down now. It will be gone by tonight, the way it has been every other time.
            </p>
          </Reveal>
        </div>
      </section>

      <FunnelFooter />
    </div>
  );
}
