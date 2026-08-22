import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentpreneurHeader, ContentpreneurFooter } from "@/components/contentpreneur-header";
import { ProCohortBreakdown } from "@/components/PremiumProgramBreakdown";

// Sales page for the Contentpreneur Accelerator, at contentpreneur.africa/accelerator.
//
// COPY REWRITTEN 2026-08-22.
//
// ⚠️ SARS — READ BEFORE EDITING THIS FILE.
// An earlier draft of this page said penalties were waived and the balance paid
// over eleven months. PROOF.md marks that 🔴 BANNED, and the founder confirmed on
// 2026-08-20 that NO payments have started. The mechanism is contested across two
// records — do not assert either. What is confirmed and all that may ever appear
// here: the assessment was R207,879.20, and he came forward rather than hiding.
// The teachable lesson is the reserve rule, not a repayment story.
//
// The cohort is NOT sold on this page. No cohort has run — there is no group, no
// schedule, no room. What is real, and what this page sells, is the seven stage
// gates and an application a person reads.
export const Route = createFileRoute("/accelerator")({
  head: () => ({
    meta: [
      { title: "Contentpreneur Accelerator — $997 — Contentpreneur Africa" },
      {
        name: "description",
        content:
          "One sale is not a business. Seven stages, seven gates you cannot skip, and an application read by a person. For the professional who has sold once, by hand.",
      },
    ],
  }),
  component: AcceleratorPage,
});

function AcceleratorPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentpreneurHeader />

      {/* Opens on a real prospect's words. A finance leader — fifteen years of
          seniority, a published book, an audience of executives on LinkedIn.
          Profession only, never a name. */}
      <section className="mx-auto max-w-2xl px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          The flagship · $997 · application required
        </div>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl leading-[1.05]">
          “I am not starting from zero, but I do feel like I need direction.”
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          A finance leader wrote that. Fifteen years of seniority. A published book. An audience of
          professionals and executives.
        </p>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">She also wrote:</p>
        <blockquote className="mt-4 border-l-2 border-banana pl-5 font-display text-2xl leading-snug">
          “I published my first book a few years ago, although I did not actively promote it.”
        </blockquote>
        <p className="mt-6 text-lg leading-relaxed">
          A book. Sold. Earning nothing. Not one email address captured from anybody who read it.
        </p>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          That is not a beginner's problem. It is what happens when someone builds every part of a
          business except the part where value changes hands and money moves.
        </p>
        <Link
          to="/apply"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-banana px-8 py-4 font-display text-lg text-banana-foreground hover:bg-banana/90 transition-colors"
        >
          Apply Now →
        </Link>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">One sale is not a business</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            You have made one. By hand, to somebody you already knew, after a conversation.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Good — that is the hard part, and it is behind you.
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            Now do it eleven more times and look at what you have:{" "}
            <strong>a job with worse hours than the one you already have, and no way to stop.</strong>{" "}
            One income stream, and it is Services — the only one of the five that ends the moment you
            do.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="font-display text-3xl">What the next three years cost if this stays manual</h2>
        <div className="mt-8 space-y-6">
          {[
            ["You stay the bottleneck", "Every rand requires you in a conversation. Your income has a hard ceiling and it is your calendar."],
            ["One morning can still take it all", "No list. Your entire audience sits on a platform whose terms can change without warning. Ask me what that morning feels like."],
            ["Your best asset keeps depreciating", "The book, the talks, the frameworks — they earn nothing while you keep making new things instead of monetising what already exists."],
            ["SARS accrues quietly", "Undeclared side income does not disappear. It waits, and it grows. Mine reached R207,879.20 while I felt successful."],
            ["And the version you would rather not think about", "In three years you are still doing this on Saturdays, still trading hours, still telling yourself next year is the year — with three more years of “should have started” behind you."],
          ].map(([h, b]) => (
            <div key={h} className="border-l-2 border-banana pl-5">
              <div className="font-display text-lg">{h}</div>
              <p className="mt-1 text-muted-foreground leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The model, stated plainly. This is the spine of the whole programme. */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">The whole thing, in one picture</h2>
          <p className="mt-5 text-lg leading-relaxed">
            You are the driver. Your knowledge is the cargo. The offer is the delivery — the moment
            the cargo changes hands and money moves.
          </p>
          <p className="mt-4 font-display text-2xl">No delivery, no business. Just mileage.</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Content is the fuel. Marketing is the vehicle. Platforms are roads — public, busy, owned
            by somebody who can close them tomorrow. And your email list is the only depot that is
            yours.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The Foundation Kit teaches the delivery. This teaches everything that turns one delivery
            into a route that runs.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-4">
        <ProCohortBreakdown />
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">The money side, from someone who got it wrong</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            My Finance axis was zero for years. SARS assessed me{" "}
            <strong className="text-foreground">R207,879.20</strong>.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            I went to them before they came for me. That is the part I got right, and it is the only
            part I got right.
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            I still carry it. I am telling you that plainly because the useful lesson is not how it
            ended — it is that none of it would have existed if I had put money aside the week it came
            in, instead of the month it was owed.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            That is what Stage 7 teaches: the reserve rule, the deduction categories, and records that
            survive being looked at. Nobody else teaching this in South Africa touches it. It is the
            stage you will score lowest on, and it is the one that ends businesses quietly, years
            later, in a letter.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="font-display text-3xl">What it is worth against what it costs</h2>
        <div className="mt-6 font-display text-5xl text-banana">$997</div>
        <p className="mt-2 text-sm text-muted-foreground">Billed in ZAR · or two payments</p>
        <ul className="mt-6 space-y-3 text-muted-foreground">
          <li>· One month of a business coach who has never run a business</li>
          <li>· Less than a single postgraduate module</li>
          <li>
            ·{" "}
            <strong className="text-foreground">
              One corporate training day at a proper rate pays for it.
            </strong>{" "}
            One keynote pays for it. One retainer client pays for it four times over.
          </li>
        </ul>
        <p className="mt-6 text-lg leading-relaxed">
          You have spent more than this on qualifications. This is the one that makes them earn.
        </p>
      </section>

      {/* Honest disqualification. This converts better than persuasion with a
          credentialed professional, and it protects the room. */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">Do not apply if</h2>
          <div className="mt-6 space-y-5 text-muted-foreground">
            <p>
              <strong className="text-foreground">You have not sent your offer to anybody yet.</strong>{" "}
              Do the Foundation Kit, sell once, come back. That is the entry requirement and it is the
              honest one — you cannot systematise a delivery you have never made.
            </p>
            <p>
              <strong className="text-foreground">You want to be famous.</strong> This builds owned
              assets. Reach is a side effect, and sometimes it is not one.
            </p>
            <p>
              <strong className="text-foreground">You cannot give it four hours a week.</strong> Seven
              stages, each with a gate. Producing the artifact <em>is</em> the work.
            </p>
          </div>
          <p className="mt-8 text-lg leading-relaxed">
            Applications are read by a person. Not everyone gets in.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-20">
        <div className="text-center">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">FAQ</div>
          <div className="mt-6 space-y-6 text-left">
            <div>
              <div className="font-display text-sm font-bold text-banana">
                Why an application, not just a checkout button?
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Because the gates need somebody to check them, and I would rather turn you away than
                take your money for a room you are not ready for. It takes ten minutes and it is free.
              </p>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-banana">What if I am not ready yet?</div>
              <p className="mt-1 text-sm text-muted-foreground">
                You will be pointed to the{" "}
                <Link to="/foundation" className="text-banana underline">Foundation Kit</Link> instead.
                Not a failure — the right next step, and it is $97.
              </p>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-banana">Do I have to quit my job?</div>
              <p className="mt-1 text-sm text-muted-foreground">
                No. I never did, and the whole thing is built for people who will not. Four hours a
                week, in the hours you already have.
              </p>
            </div>
          </div>
          <Link
            to="/apply"
            className="mt-10 inline-flex items-center justify-center rounded-md bg-banana px-8 py-4 font-display text-lg text-banana-foreground hover:bg-banana/90 transition-colors"
          >
            Apply Now — $997 →
          </Link>
        </div>

        <p className="mt-12 text-sm italic leading-relaxed text-muted-foreground">
          P.S. — What she actually asked me for was help with YouTube and cross-platform strategy. I
          told her that is not her problem. She has a book that sold and earns nothing, three
          frameworks living inside her speeches, and no list. Posting more often does not touch any of
          that. If your version of “where do I focus first” sounds like a platform question, it
          probably is not one.
        </p>
      </section>

      <ContentpreneurFooter />
    </div>
  );
}
