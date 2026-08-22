import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/gardens";
import { useCountry } from "@/lib/currency";
import { useServerFn } from "@tanstack/react-start";
import {
  Reveal, Orbs, Eyebrow, CTA, GlassCard, StepCard, Contrast, PriceAnchor,
  FoundingBanner, PriceComparison, FunnelNav, FunnelFooter,
} from "@/components/funnel";
import { paidUnitsForSlug } from "@/lib/products.functions";
import { FOUNDATION_FOUNDING, foundingState, foundingLine, ONGOING_COST } from "@/lib/launch-offer";
import { Check, Clock } from "lucide-react";

// THE FOUNDATION KIT FUNNEL — contentpreneur.africa/foundation
//
// COPY REWRITTEN 2026-08-22. Three instructions from the founder:
//
//   1. "The copy should talk about their pain."
//   2. "Do not connect the Foundation with the Starter Kit in copy."
//      Every "Step 2 of 3" and the whole "since the free kit" section is gone.
//      Most people who land here have never seen the Starter Kit, and a page
//      that assumes they did tells them they are in the wrong place.
//   3. "Use Unathi, Kea and Lerato's language — understandable words — that
//      will make them say, THIS IS ME."
//
// So the vocabulary here is theirs, not a copywriter's. Their actual words,
// from actual messages:
//
//   Lerato   "I'm not sure how to put that in one sentence."
//            Academic support advisor. Two of her students won scholarships.
//            Has never charged. Strangers pass her personal number around.
//   Kea      "I am just not too certain in terms of pricing and at what point
//            do I start charging."
//   Unathi   "I am not starting from zero, but I do feel like I need direction."
//            "I published my first book a few years ago, although I did not
//            actively promote it."
//
// Note how plain that is. Nobody says "monetise your expertise" or "unlock your
// potential". They say not too certain, direction, not sure how to put it. The
// page matches that register on purpose — short sentences, ordinary words. If a
// line sounds like a course being sold, it is wrong.
//
// Professions only, never names. These are real people's lives.
//
// STRUCTURE ported from NicheFinderProduct.tsx in the founder's Mocha export,
// which is the copy mechanism he asked to be copied:
//   day-in-the-life specifics → the flattering story they tell themselves →
//   the one-line reframe → what they overhear → red trap vs green outcome →
//   numbered steps → proof → anchored price.
//
// One deliberate substitution: the Mocha pages carry testimonial cards. There
// are no real buyer results yet, and a composite testimonial ends the
// relationship with this audience permanently. His own receipts go there
// instead — every figure cleared against PROOF.md.
const SLUG = "called-expert-foundation-kit";
const CTA_TO = "/checkout/foundation";

export const Route = createFileRoute("/foundation")({
  head: () => ({
    meta: [
      { title: "Foundation Kit — Contentpreneur Africa" },
      {
        name: "description",
        content:
          "You know more than you are paid for. Five steps that end with one person paying you — including the part nobody explains: what to charge, and when you are allowed to start.",
      },
    ],
  }),
  component: FoundationFunnel,
});

function FoundationFunnel() {
  const country = useCountry();

  // Real paid units. If this query fails the counter renders nothing at all
  // rather than a plausible-looking number — see src/lib/launch-offer.ts.
  const unitsFn = useServerFn(paidUnitsForSlug);
  const { data: unitsRes } = useQuery({
    queryKey: ["paid-units", SLUG],
    queryFn: () => unitsFn({ data: { slug: SLUG } }),
    staleTime: 60_000,
  });
  const founding = foundingState(unitsRes?.units ?? null, FOUNDATION_FOUNDING);
  const foundingText = FOUNDATION_FOUNDING.active ? foundingLine(founding) : null;
  const { data: product } = useQuery({
    queryKey: ["product", SLUG],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug,title,price_cents,currency,is_free")
        .eq("slug", SLUG)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // formatPrice NEEDS the slug and the country. Without them it falls through to
  // a generic ZAR→USD conversion and shows "$94" to everybody.
  const priceLabel = product
    ? formatPrice(product.price_cents, product.currency, product.is_free, product.slug, country)
    : "$97";

  const BUY = `Get the Foundation Kit — ${priceLabel}`;
  const TRUST = "Instant access · lifetime · full refund if you do the work and it fails you";

  return (
    <div className="funnel min-h-screen">
      <Orbs tint="amber" />
      <FunnelNav ctaTo={CTA_TO} ctaLabel={priceLabel} />

      {/* ── HERO. Their sentence, not ours. ──────────────────────────────── */}
      <section className="relative z-10 px-4 pt-28 pb-16 sm:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Five evenings · you finish with a price</Eyebrow>
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05]">
              You already know what you would charge. You have never{" "}
              <span className="grad-gold">said it out loud.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-300">
              The number has been in your head for months. Then somebody asks, and you hear yourself
              say “don't worry about it” before you have decided anything.
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
              You tell yourself you will charge the next one. You have been telling yourself that for
              a while now.
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              You are not missing knowledge. You are missing a structure to put around it.
            </p>
            <div className="mt-10 flex justify-center">
              <CTA to={CTA_TO} sub={TRUST}>{BUY}</CTA>
            </div>
            {foundingText && (
              <div className="mt-8">
                <FoundingBanner
                  line={foundingText}
                  reason={FOUNDATION_FOUNDING.reason}
                  after={FOUNDATION_FOUNDING.afterPriceLabel}
                />
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── THE PROBLEM. Day-in-the-life, then the reframe. ──────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              You call it <span className="text-slate-400">helping out</span>
            </h2>
          </Reveal>
          <div className="mt-10 space-y-5 text-lg leading-relaxed text-slate-300">
            <Reveal delay={60}>
              <p className="measure mx-auto">
                Sunday night, a message comes in. You answer it properly, because a half answer is
                worse than none.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <p className="measure mx-auto">
                Tuesday, someone forwards your number to a person you have never met. You take that
                call too.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <p className="measure mx-auto">
                Last month you spoke at something. You prepared for two nights. You were thanked warmly
                and you went home.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <p className="measure mx-auto">
                And there is the document you reviewed. The one you basically rewrote. The junior you
                have been carrying since March.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <p className="measure mx-auto text-white">
                You tell yourself you are being generous. That you are not the kind of person who
                charges people who ask nicely.
              </p>
            </Reveal>
          </div>

          <Reveal delay={280}>
            <p className="mt-12 text-center text-2xl sm:text-3xl font-black text-red-400">
              It is not generosity. It is a leak.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-slate-300">
              And here is how you find out. Someone you helped for free turns to the room and asks:{" "}
              <span className="italic text-white">
                “Do you know anybody who does this properly? Someone we can actually pay?”
              </span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── THIS IS ME. Three real situations, in their own words. ───────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-black leading-tight">
              You are stuck in one of <span className="grad-gold">three places</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
              Three people described theirs to me in the last few months. Their words, their names
              left out. You will recognise one of them as yours.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                who: "An academic support advisor",
                quote: "I'm not sure how to put that in one sentence.",
                body: "Two of the students she helped won scholarships — the kind that change what a family looks like in ten years. Strangers pass her personal number around. She has never charged anybody a cent.",
                pain: "Cannot name it",
              },
              {
                who: "A medical professional",
                quote: "I am just not too certain in terms of pricing and at what point do I start charging.",
                body: "Not how do I get more followers. Not what should I post. She knows what she does. She does not know what she is allowed to ask for it, or when.",
                pain: "Cannot price it",
              },
              {
                who: "A finance leader",
                quote: "I am not starting from zero, but I do feel like I need direction.",
                body: "Fifteen years. An MBA. A published book — “although I did not actively promote it.” Twelve keynotes. Paid for none of them. An audience of executives, and no way to reach the same person twice.",
                pain: "Reach, no revenue",
              },
            ].map((p, i) => (
              <Reveal key={p.who} delay={i * 100}>
                <GlassCard className="flex h-full flex-col p-7">
                  <span
                    className="self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                    style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24" }}
                  >
                    {p.pain}
                  </span>
                  <p className="mt-5 text-lg font-bold italic leading-snug text-white">“{p.quote}”</p>
                  <p className="mt-4 text-sm leading-relaxed text-slate-400">{p.body}</p>
                  <p className="mt-auto pt-5 text-sm font-semibold text-slate-500">{p.who}</p>
                </GlassCard>
              </Reveal>
            ))}
          </div>

          <Reveal delay={340}>
            <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-slate-300">
              Not one of them asked how to get more followers. They are all stuck in the same place,
              and it is not the place everybody sells advice about.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── THE CONTRAST. Recognition on the left, the way out on the right. */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              Same expertise. <span className="grad-gold">Two different lives.</span>
            </h2>
          </Reveal>
          <div className="mt-12">
            <Contrast
              badTitle="Where you are now"
              bad={[
                "You cannot say what you do in one sentence, so people describe you as “someone who helps with…”",
                "You are asked constantly and paid occasionally, and you cannot explain the difference",
                "Somebody with half your experience charges triple, and you have watched it happen",
                "You have no idea what to charge, or whether you are even allowed to yet",
                "Nothing you did this year is written down anywhere you could show somebody",
                "You are doing this at 22:00 after a full day, and it is going nowhere",
              ]}
              goodTitle="Where this takes you"
              good={[
                "One sentence a stranger can repeat back to you correctly",
                "A named thing with a price, so asking and paying are the same conversation",
                "A number you can say out loud without your voice going up at the end",
                "Four checkable conditions that tell you whether it is time — no more guessing",
                "Your past results written down and quotable, with permission",
                "Still 22:00, still after a full day. But one person has paid you.",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── THE FIVE STEPS ───────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              Five steps. It ends when <span className="grad-gold">somebody pays you.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-slate-400">
              One step an evening. You answer questions about your own work — nothing to invent,
              nothing to research.
            </p>
          </Reveal>

          <div className="mt-12 space-y-6">
            <StepCard
              n={1} title="Name what you know" badge="Step one"
              body="Everything people already come to you for, written down as a list instead of a habit. This is the step where “just helping out” stops being the words you use."
              accent="#fbbf24"
            />
            <StepCard
              n={2} title="Count what it has cost you" badge="The hard one"
              body="What giving it away has cost you, as an amount of money rather than a feeling. It works out your hourly rate from what your own profession actually pays someone with your qualification, then counts the hours you have handed over. Most people stop reading their own answer halfway down."
              accent="#f59e0b" delay={60}
            />
            <StepCard
              n={3} title="Turn it into one thing people can buy" badge="Step three"
              body="A favour has no edges, so it stays free. This gives it a name, a promise, and something the other person keeps at the end. You finish with a one-page document you could send to somebody tonight."
              accent="#3b82f6" delay={120}
            />
            <StepCard
              n={4} title="Decide what to charge — and whether you are ready" badge="The question nobody answers"
              body="Two questions, in that order, because answering the first one with a number is why most advice fails here. First: are you ready? Four things you can check, not feel."
              points={[
                "Has more than one person asked you for this?",
                "Have you done it once, and can you say what changed?",
                "Do they keep something at the end, or just feel better?",
                "Can you say what it costs them not to have it?",
              ]}
              accent="#a855f7" delay={180}
            />
            <StepCard
              n={5} title="Send it to one person" badge="This week"
              body="One person. One date. One message, already written. Not a list — a list lets you hide, and building the perfect one feels like work the whole time you are not sending anything."
              accent="#22c55e" delay={240}
            />
          </div>

          <Reveal delay={300}>
            <GlassCard className="mx-auto mt-12 max-w-2xl p-8 text-center" accent="rgba(251,191,36,0.3)">
              <Clock className="mx-auto size-10 text-amber-400" />
              <h3 className="mt-4 text-2xl font-black">You are not quitting anything</h3>
              <p className="mt-3 leading-relaxed text-slate-300">
                Five evenings, one step each. Your answers save as you go, so you can start on your
                phone at lunch and finish on the laptop at 21:00. I built my own thing on night shifts
                and never resigned. This is made for people who will not either.
              </p>
            </GlassCard>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-12 flex justify-center">
              <CTA to={CTA_TO} sub={TRUST}>{BUY}</CTA>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PROOF. His receipts, because there are no buyer results yet and a
           made-up testimonial would end this relationship permanently. ───── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-black leading-tight">
              Why I am the one <span className="grad-gold">telling you this</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center leading-relaxed text-slate-300">
              I am not going to show you other people's results, because this is new and I do not have
              them yet. I will show you mine, and what they cost me.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              ["R132,500", "lost by undercharging across my first 50 brand deals, because I never had a number"],
              ["780,000", "followers gone in one morning, on a platform that owed me no explanation"],
              ["R207,879", "assessed by SARS, because I built the income before I built the structure"],
            ].map(([n, l], i) => (
              <Reveal key={n} delay={i * 90}>
                <GlassCard className="h-full p-7 text-center">
                  <div className="text-3xl font-black grad-gold">{n}</div>
                  <div className="mt-3 text-sm leading-relaxed text-slate-400">{l}</div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
          <Reveal delay={300}>
            <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-white">
              Every one of those was a structure problem, not a knowledge problem. You are further
              ahead than I was — you spent your years becoming genuinely good at something instead of
              chasing attention. You are just not being paid for it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── PRICE ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-black leading-tight">
              What you get
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <GlassCard className="mt-10 p-8 sm:p-11">
              <PriceAnchor
                anchor="One hour with a consultant who would answer this for you"
                price={priceLabel}
                note="One payment · lifetime access"
              />

              <ul className="mt-9 space-y-4">
                {[
                  ["The five steps, saved as you go", "Start on your phone, finish on the laptop. You never type the same answer twice."],
                  ["The part nobody explains", "What to charge, and how to know you are ready to ask for it."],
                  ["25 tools", "Five are the path. Twenty more for after somebody has paid you."],
                  ["What to say when they hesitate", "The four things people say back, answered — including “that is expensive”."],
                  ["Money kept properly", "What to put aside for SARS the week it comes in, not the month it is owed."],
                  ["9 workbooks and 10 short videos", "Everything opens on day one. Nothing is held back for later."],
                ].map(([t, b]) => (
                  <li key={t} className="flex items-start gap-3 border-b border-white/10 pb-4 last:border-0">
                    <Check className="mt-1 size-5 shrink-0 text-amber-400" />
                    <div>
                      <div className="font-bold">{t}</div>
                      <div className="mt-0.5 text-sm text-slate-400">{b}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <CTA to={CTA_TO} full sub={TRUST}>{BUY}</CTA>
              </div>
            </GlassCard>
          </Reveal>

          {/* Comparison anchored on the reader's OWN numbers first — those are
              facts they can check in their own head. The outside price is a
              hedged range, because we cannot receipt what somebody else charges. */}
          <Reveal delay={140}>
            <div className="mt-12">
              <h3 className="text-center text-2xl font-black">Put it next to what you already spend</h3>
              <div className="mt-7">
                <PriceComparison
                  price={priceLabel}
                  priceNote="Once. Yours for good."
                  rows={[
                    { label: "The qualification that made you good at this", amount: "You know", note: "Years, and considerably more than this" },
                    { label: "One hour with a consultant who would answer this for you", amount: "Typically more", note: "And you would still have to do the work afterwards" },
                    { label: "The course you bought last year", amount: "More", note: "Be honest about whether you finished it" },
                    { label: "What you gave away last month", amount: "More", note: "Step two makes you add this up. It is the number that decides it." },
                    { label: "Your first sale, if it is $150", amount: "Pays this back once", note: "At $500 it has paid for itself five times before lunch" },
                  ]}
                />
              </div>
              <p className="mt-8 text-center leading-relaxed text-slate-400">
                You have already spent far more than this on the qualifications that made you good at
                the thing.{" "}
                <span className="text-white">This is the first money you would spend on being paid for it.</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── GUARANTEE + OBJECTIONS ───────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <GlassCard className="p-8 sm:p-10" accent="rgba(251,191,36,0.35)">
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                If it does not work, I refund you
              </h2>
              <p className="mt-4 leading-relaxed text-slate-300">
                Do the five steps. Send your thing to one real person. If you get to the end without a
                price you would actually put in front of somebody, show me the five steps and I will
                refund you in full.
              </p>
              <p className="mt-4 leading-relaxed text-white">
                I will not refund somebody who bought it and never opened it. That is not a risk I can
                carry for you, and pretending otherwise would make this page like every other one you
                have read.
              </p>
            </GlassCard>
          </Reveal>

          <div className="mt-10 space-y-6">
            {[
              ["“I do not have the time.”", "One step an evening, and it remembers where you stopped. You have already spent longer than that this month answering questions for free."],
              ["“My field is different.”", "It works from your answers, not a template. Step two prices your hour from what your own profession pays somebody with your qualification — an auditor and a nurse get different numbers, because they should."],
              ["“I do not think I am ready to charge.”", "Step four is a test for exactly that. If you are not ready it says so, and tells you the one thing to go and do first. Most people find they were ready two years ago."],
              ["“Do I have to leave my job?”", "No. I never did, and none of this assumes you will. Five evenings, in the hours you already have."],
            ].map(([q, a], i) => (
              <Reveal key={q} delay={i * 70}>
                <div>
                  <div className="font-black text-amber-300">{q}</div>
                  <p className="mt-1.5 leading-relaxed text-slate-300">{a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSE ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-24 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight">
              Somebody is going to ask you again <span className="grad-gold">this week.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              You already know they will. The only question is whether you have a number by then.
            </p>
            <p className="mx-auto mt-5 max-w-xl text-slate-400">{ONGOING_COST}</p>
            <div className="mt-9 flex justify-center">
              <CTA to={CTA_TO} sub={TRUST}>{BUY}</CTA>
            </div>
            <p className="mt-12 text-sm italic leading-relaxed text-slate-500">
              P.S. — Step two asks you to add up what you have given away. Do that one page even if you
              buy nothing else. Almost nobody has ever added it up, and the number is usually bigger
              than every course they have ever bought, put together.
            </p>
          </Reveal>
        </div>
      </section>

      <FunnelFooter />
    </div>
  );
}
