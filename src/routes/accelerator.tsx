import { createFileRoute } from "@tanstack/react-router";
import {
  Reveal,
  Orbs,
  Eyebrow,
  CTA,
  GlassCard,
  PriceComparison,
  FunnelNav,
  FunnelFooter,
} from "@/components/funnel";
import { STAGES } from "@/lib/accelerator-stages";
import { ShieldCheck } from "lucide-react";

// THE ACCELERATOR FUNNEL — contentpreneur.africa/accelerator
//
// ⚠️ SARS — READ BEFORE EDITING THIS FILE.
// An earlier draft said penalties were waived and the balance paid over eleven
// months. PROOF.md marks that 🔴 BANNED, and the founder confirmed on
// 2026-08-20 that NO payments have started. The mechanism is contested across
// two records — do not assert either. What is confirmed, and all that may ever
// appear here: the assessment was R207,879.20, and he came forward rather than
// hiding. The teachable lesson is the reserve rule, not a repayment story.
//
// The cohort is NOT sold on this page. No cohort has run — there is no group,
// no schedule, no room. What is real, and what this sells, is the seven stage
// gates and an application a person reads.
//
// ONE CTA: /apply. Every button on this page says the same thing and goes to
// the same place. The old page had two Apply buttons plus a site header full of
// menu links and a footer sitemap.
const CTA_TO = "/apply";
const APPLY = "Apply for the Accelerator";

const STAGE_TINTS = ["#fbbf24", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#06b6d4", "#ef4444"];

export const Route = createFileRoute("/accelerator")({
  head: () => ({
    meta: [
      { title: "Contentpreneur Accelerator — Contentpreneur Africa" },
      {
        name: "description",
        content:
          "One sale is not a business. Seven stages, seven gates you cannot skip, and an application read by a person. For the professional who has sold once, by hand.",
      },
    ],
  }),
  component: AcceleratorFunnel,
});

function AcceleratorFunnel() {
  return (
    <div className="funnel min-h-screen">
      <Orbs tint="blue" />
      <FunnelNav ctaTo={CTA_TO} ctaLabel="Apply" />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-28 pb-16 sm:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow tint="#60a5fa">The flagship · $997 · application required</Eyebrow>
            <h1 className="mt-6 text-3xl sm:text-5xl md:text-6xl font-black leading-[1.08]">
              You are not a beginner. That is what makes this so{" "}
              <span className="grad-gold">frustrating.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-300">
              Years of seniority. A qualification people respect. Maybe a book, or the talks
              everybody keeps asking you to give. You have sold something once, by hand, to somebody
              you already knew.
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
              And you still cannot point at the thing that turns any of it into money that arrives
              whether or not you are in the room.
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white">
              A finance leader put it to me like this:{" "}
              <span className="italic">
                “I am not starting from zero, but I do feel like I need direction.”
              </span>{" "}
              She has a book that sold and earns nothing — “although I did not actively promote it”
              — and not one email address from anybody who read it.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-400">
              That is not a beginner's problem. It is what happens when you build every part of a
              business except the part where value changes hands and money moves.
            </p>
            <div className="mt-10 flex justify-center">
              <CTA to={CTA_TO} sub="10 minutes · free · read by a person">
                {APPLY}
              </CTA>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ONE SALE IS NOT A BUSINESS ───────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              One sale is <span className="grad-gold">not a business</span>
            </h2>
            <div className="mt-7 space-y-5 text-lg leading-relaxed text-slate-300">
              <p className="measure">
                You have made one. By hand, to somebody you already knew, after a conversation. Good
                — that is the hard part, and it is behind you.
              </p>
              <p className="measure text-white">
                Now do it eleven more times and look at what you have: a job with worse hours than
                the one you already have, and no way to stop.
              </p>
              <p className="measure">
                One income stream, and it is Services — the only one of the five that ends the
                moment you do.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── THE MODEL ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <GlassCard className="p-8 sm:p-12" accent="rgba(251,191,36,0.3)">
              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                The whole thing, in <span className="grad-gold">one picture</span>
              </h2>
              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white">
                You are the driver. Your knowledge is the cargo. The offer is the delivery — the
                moment the cargo changes hands and money moves.
              </p>
              <p className="mt-6 text-2xl sm:text-3xl font-black grad-gold">
                No delivery, no business. Just mileage.
              </p>
              <p className="mt-6 leading-relaxed text-slate-300">
                Content is the fuel. Marketing is the vehicle. Platforms are roads — public, busy,
                owned by somebody who can close them tomorrow. And your email list is the only depot
                that is yours.
              </p>
              <p className="mt-5 leading-relaxed text-slate-400">
                The Foundation Kit teaches the delivery. This teaches everything that turns one
                delivery into a route that runs.
              </p>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* ── THE SEVEN GATES. The actual product. ─────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              Seven stages. <span className="grad-gold">Seven gates you cannot skip.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-slate-300">
              You do not advance because a week passed. You advance because you produced the
              artifact. That is the whole difference between this and a video library — and we
              already sell a video library, for a tenth of the price.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {STAGES.map((s, i) => {
              const tint = STAGE_TINTS[i % STAGE_TINTS.length];
              return (
                <Reveal key={s.n} delay={i * 60}>
                  <GlassCard className="flex h-full flex-col p-7" accent={`${tint}44`}>
                    <div
                      className="text-xs font-bold uppercase tracking-[0.2em]"
                      style={{ color: tint }}
                    >
                      Stage {s.n} · {s.element}
                    </div>
                    <h3 className="mt-2 text-xl sm:text-2xl font-black leading-tight">{s.title}</h3>
                    <p className="mt-3 text-sm italic text-slate-400">{s.question}</p>
                    <div className="mt-auto pt-5">
                      <div className="border-t border-white/10 pt-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          You cannot advance without
                        </div>
                        <p className="mt-1.5 text-sm font-medium leading-snug text-slate-200">
                          {s.gate}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={200}>
            <p className="mx-auto mt-10 max-w-2xl text-center leading-relaxed text-slate-400">
              Stage 6 is the one nobody asks for and everybody needs. Every person who has come to
              me asked about roads. Not one asked about a depot.
            </p>
            <div className="mt-10 flex justify-center">
              <CTA to={CTA_TO} sub="10 minutes · free · read by a person">
                {APPLY}
              </CTA>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── COST OF STAYING MANUAL ───────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-black leading-tight">
              What the next three years cost{" "}
              <span className="text-red-400">if this stays manual</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {[
              [
                "You stay the bottleneck",
                "Every dollar requires you in a conversation. Your income has a hard ceiling and it is your calendar.",
              ],
              [
                "One morning can still take it all",
                "No list. Your entire audience sits on a platform whose terms can change without warning. Ask me what that morning feels like.",
              ],
              [
                "Your best asset keeps depreciating",
                "The book, the talks, the frameworks — they earn nothing while you keep making new things instead of monetising what already exists.",
              ],
              [
                "SARS accrues quietly",
                "Undeclared side income does not disappear. It waits, and it grows. Mine reached R207,879.20 while I felt successful.",
              ],
            ].map(([h, b], i) => (
              <Reveal key={h} delay={i * 80}>
                <GlassCard className="h-full p-7">
                  <h3 className="text-xl font-black">{h}</h3>
                  <p className="mt-2.5 leading-relaxed text-slate-300">{b}</p>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE MONEY SIDE. See the SARS warning at the top of this file. ── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              The money side, from someone who <span className="grad-gold">got it wrong</span>
            </h2>
            <div className="mt-7 space-y-5 text-lg leading-relaxed text-slate-300">
              <p className="measure">
                My Finance axis was zero for years. SARS assessed me{" "}
                <strong className="text-white">R207,879.20</strong>.
              </p>
              <p className="measure">
                I went to them before they came for me. That is the part I got right, and it is the
                only part I got right.
              </p>
              <p className="measure text-white">
                I still carry it. I am telling you that plainly because the useful lesson is not how
                it ended — it is that none of it would have existed if I had put money aside the
                week it came in, instead of the month it was owed.
              </p>
              <p className="measure">
                That is what Stage 7 teaches: the reserve rule, the deduction categories, and
                records that survive being looked at. It is the stage you will score lowest on, and
                it is the one that ends businesses quietly, years later, in a letter.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICE + GUARANTEE ────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <GlassCard className="p-8 sm:p-12">
              <div className="text-center">
                <div className="text-6xl font-black grad-gold">$997</div>
                <div className="mt-2 text-slate-400">
                  One payment, or two · charged in your local currency
                </div>
              </div>
              {/* Anchored on their own numbers. A keynote fee and a training day
                  are figures this buyer already knows, which is what makes the
                  comparison checkable rather than persuasive. */}
              <div className="mt-9 border-t border-white/10 pt-8">
                <PriceComparison
                  price="$997"
                  priceNote="Once. Seven stages, every tool, no expiry."
                  rows={[
                    {
                      label: "One postgraduate module",
                      amount: "More",
                      note: "And it does not end in an income",
                    },
                    {
                      label: "A month of a business coach",
                      amount: "Comparable",
                      note: "Ask whether they have run one",
                    },
                    {
                      label: "One corporate training day, at a proper rate",
                      amount: "Pays for this",
                      note: "You already know your own number here",
                    },
                    {
                      label: "One keynote, paid instead of free",
                      amount: "Pays for this",
                      note: "You have given away more than one",
                    },
                    {
                      label: "One retainer client",
                      amount: "Pays for it four times",
                      note: "Stage 5 is where retainers come from",
                    },
                  ]}
                />
              </div>
              <p className="mt-7 text-lg leading-relaxed text-white">
                You have spent more than this on qualifications. This is the one that makes them
                earn.
              </p>
              <div className="mt-9">
                <CTA to={CTA_TO} full sub="10 minutes · free · read by a person">
                  {APPLY}
                </CTA>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-8 flex items-start gap-4">
              <ShieldCheck className="mt-1 size-6 shrink-0 text-amber-400" />
              <p className="leading-relaxed text-slate-300">
                Clear the first three gates inside thirty days. If you have done that and do not
                believe this will pay for itself, tell me before day 30 and I refund you in full.
                Conditional, deliberately — the gates are the product, and somebody who never
                produces an artifact has not used the thing they are asking to be refunded for.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── DISQUALIFY. Converts better than persuasion with this buyer. ─── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">Do not apply if</h2>
            <div className="mt-7 space-y-5 text-slate-300">
              <p className="measure">
                <strong className="text-white">You have not sent your offer to anybody yet.</strong>{" "}
                Do the Foundation Kit, sell once, come back. That is the entry requirement and it is
                the honest one — you cannot systematise a delivery you have never made.
              </p>
              <p className="measure">
                <strong className="text-white">You want to be famous.</strong> This builds owned
                assets. Reach is a side effect, and sometimes it is not one.
              </p>
              <p className="measure">
                <strong className="text-white">You cannot give it four hours a week.</strong> Seven
                stages, each with a gate. Producing the artifact <em>is</em> the work.
              </p>
            </div>
            <p className="mt-8 text-xl font-bold text-white">
              Applications are read by a person. Not everyone gets in.
            </p>
            {/* The limit here is real and it is founder time — it is not a seat
                count, because no cohort has run and inventing one would be the
                exact thing this buyer checks. */}
            <p className="mt-5 leading-relaxed text-slate-400">
              I read them myself, which is the actual limit. When there are more than I can get
              through properly, applications close until I have. That is not a marketing device — it
              is arithmetic, and it is the same reason the gates work.
            </p>
            <p className="mt-5 leading-relaxed text-slate-400">
              Waiting does not make this cheaper. It makes the three years in the section above
              start later.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CLOSE ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-24 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight">
              Stop driving. <span className="grad-gold">Start delivering.</span>
            </h2>
            <div className="mt-9 flex justify-center">
              <CTA to={CTA_TO} sub="10 minutes · free · read by a person">
                {APPLY}
              </CTA>
            </div>
            <p className="mt-12 text-sm italic leading-relaxed text-slate-500">
              P.S. — What she actually asked me for was help with YouTube and cross-platform
              strategy. I told her that is not her problem. She has a book that sold and earns
              nothing, three frameworks living inside her speeches, and no list. Posting more often
              does not touch any of that. If your version of “where do I focus first” sounds like a
              platform question, it probably is not one.
            </p>
          </Reveal>
        </div>
      </section>

      <FunnelFooter />
    </div>
  );
}
