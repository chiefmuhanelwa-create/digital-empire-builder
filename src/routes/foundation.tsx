import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/gardens";
import { useCountry } from "@/lib/currency";
import { Reveal, Orbs, Eyebrow, CTA, GlassCard, StepCard, FunnelNav, FunnelFooter } from "@/components/funnel";
import { Check } from "lucide-react";

// THE FOUNDATION KIT FUNNEL — contentpreneur.africa/foundation
//
// REBUILT 2026-08-22 as a funnel rather than a web page. The founder's note:
// "these do not look like funnel pages — the foundation has a generic form and
// many buttons — this should have ONE CTA button."
//
// He was right, and it was worse than it looked. The old page had an anchor CTA
// in the hero, an inline email + name + Turnstile form halfway down, a submit
// button inside that, a "start free" link back to the top of the ladder, and a
// full site footer full of navigation. Five ways out and one way forward.
//
// Now: ONE destination (/checkout/foundation), the same words on every button,
// no menu, no footer links, no competing offer. The form moved to its own
// screen where nothing else is asking for attention.
//
// Visual language ported from the founder's Mocha export — black ground, gold
// gradient type, glass cards, glowing pill CTA. See src/components/funnel.tsx.
const SLUG = "called-expert-foundation-kit";
const CTA_TO = "/checkout/foundation";

export const Route = createFileRoute("/foundation")({
  head: () => ({
    meta: [
      { title: "Foundation Kit — Contentpreneur Africa" },
      {
        name: "description",
        content:
          "Five steps that end the day somebody pays you. The Charge Gate, 25 tools, 9 workbooks and a 10-video course — for the expert who has never named a price.",
      },
    ],
  }),
  component: FoundationFunnel,
});

function FoundationFunnel() {
  const country = useCountry();
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

  // formatPrice NEEDS the slug and the buyer's country. Without them it falls
  // through to a generic ZAR→USD conversion and renders "$94" to everyone.
  const priceLabel = product
    ? formatPrice(product.price_cents, product.currency, product.is_free, product.slug, country)
    : "$97";

  const BUY = `Get the Foundation Kit — ${priceLabel}`;
  const TRUST = "Instant access · lifetime · full refund if you do the work and it fails you";

  return (
    <div className="funnel min-h-screen">
      <Orbs tint="amber" />
      <FunnelNav ctaTo={CTA_TO} ctaLabel={priceLabel} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-28 pb-16 sm:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Step 2 of 3 · {priceLabel}</Eyebrow>
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05]">
              “At what point do I <span className="grad-gold">start charging?</span>”
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-300">
              That is the message, word for word, from a medical professional building something
              around her career. Not <em>how do I get more followers</em>. Not{" "}
              <em>what should I post</em>.
            </p>
            <p className="mt-6 text-2xl sm:text-3xl font-black">
              Nobody answers that with a number.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-400">
              They answer with encouragement — which is worse, because encouragement can be nodded at
              and then ignored.
            </p>
            <div className="mt-10 flex justify-center">
              <CTA to={CTA_TO} sub={TRUST}>{BUY}</CTA>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── THE GAP ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Be honest about what has happened <span className="grad-gold">since the free kit</span>
            </h2>
            <div className="mt-7 space-y-5 text-lg leading-relaxed text-slate-300">
              <p className="measure">You have a positioning sentence and a first offer written on a page.</p>
              <p className="measure">
                And then? Nothing. The page is in a downloads folder. You went back to work on Monday,
                and the person who asked you in March asked somebody else in June.
              </p>
              <p className="measure text-white">
                That is not a discipline problem. It is what happens when a plan has no next mechanical
                step. <em>“Go and price it”</em> is not an instruction. It is a wish.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── COST OF INACTION ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              What another year of this <span className="text-red-400">costs</span>
            </h2>
            <p className="mt-4 text-center text-lg text-slate-400">
              Run it forward twelve months from today, changing nothing.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {[
              ["The money", "Another year of work given away — compounding, because the people you help for free tell other people you help for free."],
              ["The position", "Every free delivery teaches your market what you cost. A reputation for generosity is almost impossible to re-price. You are not starting from zero next year — you are starting from below it."],
              ["The window", "Somebody with half your experience is charging triple your rate in your field right now. They are not better. They just did not wait."],
              ["The evidence", "Nothing you did this year is quotable. No permission asked, no result recorded. Twelve more months of proof evaporating in real time."],
            ].map(([h, b], i) => (
              <Reveal key={h} delay={i * 80}>
                <GlassCard className="h-full p-7">
                  <h3 className="text-xl font-black">{h}</h3>
                  <p className="mt-2.5 leading-relaxed text-slate-300">{b}</p>
                </GlassCard>
              </Reveal>
            ))}
          </div>
          <Reveal delay={320}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-slate-300">
              And the quiet one: you will still be answering the same WhatsApp question in 2027, still
              for nothing — and you will have started to believe that is what your knowledge is worth.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── THE PATH ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              Five steps. It ends when <span className="grad-gold">money moves.</span>
            </h2>
          </Reveal>

          <div className="mt-12 space-y-6">
            <StepCard
              n={1} title="The Knowledge Audit" badge="Your cargo"
              body="You stop calling it “just helping out.” Everything people come to you for, listed as inventory instead of favours."
              accent="#fbbf24"
            />
            <StepCard
              n={2} title="The Leak" badge="The number that stings"
              body="What giving it away has cost, in rand, counted — using an hourly rate worked out from what your own industry pays for your qualification. Most people stop reading their own answer halfway down."
              accent="#f59e0b" delay={60}
            />
            <StepCard
              n={3} title="The Offer Blueprint" badge="A thing with a name"
              body="A package with a promise and something that actually changes hands. It ends in a printable one-pager — name, promise, what they get — that you can send today."
              accent="#3b82f6" delay={120}
            />
            <StepCard
              n={4} title="The Charge Gate" badge="The number"
              body="Four checkable conditions, not feelings. Then the price — the highest of three floors, never the average, because averaging lets your weakest input drag you down."
              points={[
                "Has more than one person asked you for this?",
                "Did you deliver it once, and can you quote what changed?",
                "Is the output a thing, or a feeling?",
                "Can you say what it costs them NOT to have it?",
              ]}
              accent="#a855f7" delay={180}
            />
            <StepCard
              n={5} title="The Send" badge="Money moves"
              body="One person. One date. One message. Not a list — a list lets you hide, and building the perfect one feels like work the entire time you are not sending anything."
              accent="#22c55e" delay={240}
            />
          </div>

          <Reveal delay={300}>
            <div className="mt-12 flex justify-center">
              <CTA to={CTA_TO} sub={TRUST}>{BUY}</CTA>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── WHAT'S INSIDE + PRICE ────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-black leading-tight">
              Everything you get
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <GlassCard className="mt-10 p-8 sm:p-11">
              <div className="text-center">
                <div className="text-6xl font-black grad-gold">{priceLabel}</div>
                <div className="mt-2 text-slate-400">One payment · lifetime access</div>
              </div>

              <ul className="mt-9 space-y-4">
                {[
                  ["The five-step path, saved across devices", "Start on your phone at lunch, finish on the laptop at 21:00. Nothing is typed twice."],
                  ["The Charge Gate", "The number, and the sentence that defends it."],
                  ["25 tools in total", "Five are the path. Twenty more for after your first delivery."],
                  ["Sale scripts, four objections answered", "You know what to say when they say “that is expensive.”"],
                  ["The Money Split", "You get paid properly and keep what is SARS's aside, before you spend it."],
                  ["9 workbooks and a 10-video course", "All ten videos open on day one. No drip."],
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

          <Reveal delay={140}>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 text-center text-sm text-slate-400">
              <div>One hour of the consultant you would hire to answer this instead</div>
              <div>Less than the course you bought last year and did not finish</div>
              <div className="text-white">If your first sale is R2,500, it pays for itself once</div>
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
                My guarantee, and what it asks of you
              </h2>
              <p className="mt-4 leading-relaxed text-slate-300">
                Do all five steps. Send your offer to one real person. If you get to the end and do not
                have a priced offer you would actually put in front of somebody — show me the five steps
                completed, and I refund you in full.
              </p>
              <p className="mt-4 leading-relaxed text-white">
                I will not refund someone who bought it and never opened it. That is not a risk I can
                carry for you, and pretending otherwise would make this page like every other one you
                have read.
              </p>
            </GlassCard>
          </Reveal>

          <div className="mt-10 space-y-5">
            {[
              ["“I do not have time.”", "One step an evening, saved between sessions. You have spent longer than that this month answering questions for free."],
              ["“What if my field is different?”", "Every tool works from your answers, not a template. The Leak prices your hour from what your own industry pays for your qualification — an auditor and a nurse get different numbers because they should."],
              ["“I am not ready to charge yet.”", "Step four is literally a test for that. If you are not ready it tells you so, and tells you exactly what to do first. That answer alone is worth the price."],
            ].map(([q, a], i) => (
              <Reveal key={q} delay={i * 80}>
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
              Name the number.
            </h2>
            <div className="mt-9 flex justify-center">
              <CTA to={CTA_TO} sub={TRUST}>{BUY}</CTA>
            </div>
            <p className="mt-12 text-sm italic leading-relaxed text-slate-500">
              P.S. — Step two asks you to count what the free version has cost you. Do that page even
              if you buy nothing else. Most people have never added it up, and the number is almost
              always larger than every course they have ever bought, combined.
            </p>
          </Reveal>
        </div>
      </section>

      <FunnelFooter />
    </div>
  );
}
