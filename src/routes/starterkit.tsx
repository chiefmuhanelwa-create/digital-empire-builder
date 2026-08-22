import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ContentpreneurHeader, ContentpreneurFooter } from "@/components/contentpreneur-header";
import { MailerLiteEmbedForm } from "@/components/MailerLiteEmbedForm";

// The free Knowledge Entrepreneur Starter Kit, at contentpreneur.africa/starterkit.
//
// COPY REWRITTEN 2026-08-22 in the ICP's own language. The opening is a real
// prospect's situation, not a persona: an academic support advisor whose personal
// number gets passed between strangers, who has helped two students win
// scholarships, and who has never charged anybody a cent. Asked to describe what
// she does, she wrote back "I'm not sure how to put that in one sentence."
//
// Professions only — never a name, never an identifying detail. These are other
// people's lives and they did not consent to being marketing.
//
// Form: MailerLite's own embedded form (slug "v3XiMi"). Delivery of the kit is
// entirely MailerLite's responsibility.
// Verified against the real deliverable PDF (Google Drive, 2026-08-08) — 8
// modules, not 7.
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
  component: StarterKitPage,
});

function StarterKitPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentpreneurHeader />

      <section className="mx-auto max-w-4xl px-6 pt-2 sm:pt-20 pb-16">
        <div className="grid gap-2 sm:gap-x-10 sm:gap-y-8 items-center [grid-template-areas:'hook''form''image''description'] sm:[grid-template-areas:'hook_image''description_image''form_form'] sm:grid-cols-[1.1fr_0.9fr]">
          <div className="[grid-area:hook] text-center sm:text-left">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              Free · Delivered By Email + WhatsApp
            </div>
            <h1 className="mt-2 sm:mt-6 font-display text-2xl sm:text-5xl leading-tight sm:leading-[1.05]">
              Strangers share your number.
            </h1>
            <p className="hidden sm:block mt-4 font-display text-sm font-bold uppercase tracking-wide text-banana">
              The Knowledge Entrepreneur Starter Kit
            </p>
          </div>

          <div className="[grid-area:form] mx-auto w-full max-w-md">
            <MailerLiteEmbedForm formSlug="v3XiMi" />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              We'll email your kit, and WhatsApp you if there's something worth your time — no spam,
              unsubscribe anytime.
            </p>
          </div>

          <div className="[grid-area:image] mx-auto w-full max-w-[220px] sm:max-w-[280px] rounded-xl border-4 border-banana bg-card p-4 shadow-xl">
            <img
              src="/product-covers/knowledge-entrepreneur-starter-kit-cover.png"
              alt="The Knowledge Entrepreneur Starter Kit — 8 Worksheets, One Clear Direction"
              className="w-full h-auto"
            />
          </div>

          <div className="[grid-area:description] text-center sm:text-left">
            <p className="sm:hidden font-display text-sm font-bold uppercase tracking-wide text-banana">
              The Knowledge Entrepreneur Starter Kit
            </p>
            <p className="mt-2 sm:mt-0 text-lg text-muted-foreground leading-relaxed">
              Not your business card. Your personal number, passed along by someone you have never
              met, because you are the one who knows how to do the thing.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              You answer. You always answer. It takes you twenty minutes and eleven years.
            </p>
            <p className="mt-4 text-lg leading-relaxed">
              And then nothing happens — because there is nothing to happen. There is no price.
              There was never going to be a price.
            </p>
          </div>
        </div>
      </section>

      {/* The prospect, in her own words. Profession only, no name. */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-lg leading-relaxed text-muted-foreground">
            An academic support advisor wrote to me. Two of the students she helped won scholarships —
            the kind that change what a family looks like in ten years.
          </p>
          <p className="mt-4 text-lg leading-relaxed">She has never charged anybody a cent.</p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            When I asked her to describe what she does, she wrote back:
          </p>
          <blockquote className="mt-4 border-l-2 border-banana pl-5 font-display text-2xl leading-snug">
            “I'm not sure how to put that in one sentence.”
          </blockquote>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            That is the whole problem, and it is not a knowledge problem. She knows more than most
            people charging R5,000 an hour for the same work. What she does not have is a structure
            around it.
          </p>
        </div>
      </section>

      {/* Cost of delay. Framed as the reader's own arithmetic — never a claim we
          would have to defend. */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="font-display text-3xl">Count what this year cost you</h2>
        <p className="mt-3 text-muted-foreground">Not what you spent. What you never charged.</p>
        <ul className="mt-6 space-y-3 text-muted-foreground">
          <li>The talk you gave. How many times? What would a trainer have been paid for that day?</li>
          <li>
            The WhatsApp questions. Say two a week, twenty minutes each — that is roughly{" "}
            <strong className="text-foreground">thirty full working days</strong>, unbilled.
          </li>
          <li>The document you reviewed as a favour. The one you rewrote. The junior you carried.</li>
          <li>
            The person who asked you in March and asked somebody else in June, because you never said
            a number.
          </li>
        </ul>
        <p className="mt-6 text-lg leading-relaxed">
          Put a rough rate on your own hour and multiply. Whatever number you land on, it is not money
          you lost — it is money that was offered to you and you handed back, politely, over and over,
          because nobody ever taught you the sentence.
        </p>
        <p className="mt-4 font-display text-xl">And the meter is still running.</p>
      </section>

      {/* Proof. Every figure traced to PROOF.md. No date on the 780K — the
          press-confirmed 288K figure does not reconcile with it. */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">You are further ahead than I was</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            I had 780,000 followers and some months I was doing maths in my head about the electricity
            while strangers stopped me in shops.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Then one morning the account was gone. No explanation, and nobody owed me one. Every number
            I had used to prove I mattered belonged to somebody else, and they switched it off.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["780,000", "followers, gone in one morning"],
              ["R207,879", "assessed by SARS when I had no system"],
              ["R200", "my first ever payment online"],
            ].map(([n, l]) => (
              <div key={n} className="border border-border bg-background p-5">
                <div className="font-display text-2xl font-black text-banana">{n}</div>
                <div className="mt-1 text-sm text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-lg leading-relaxed">
            You did not spend a decade chasing attention. You spent it becoming genuinely good at
            something. Which means you are further ahead than I was — and you are being paid for
            almost none of it.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="text-center font-display text-3xl">Eight worksheets. Ninety minutes.</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          Nothing new to make. Everything it asks about, you already have.
        </p>
        <div className="mt-8 divide-y divide-border border border-border bg-background">
          {MODULES.map(([title, desc], i) => (
            <div key={title} className="flex items-start gap-4 p-5">
              <span className="font-display text-sm font-black text-banana">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="font-display text-sm font-bold">{title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          You finish with a one-page summary: your positioning sentence, your weakest axis, your first
          offer, and a price. That is further than most people with twenty years of expertise ever get.
        </p>
      </section>

      {/* Honest boundaries. A free product should never fake scarcity, and this
          one names what it is not. */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">Three things this is not</h2>
          <div className="mt-6 space-y-5">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Not a motivational PDF.</strong> No live sessions,
              nothing to wait for, nothing to attend.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Not a sales letter in disguise.</strong> The kit stops
              at <em>I know exactly what to do next</em>, and says so on its first page.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Not going to work if you do not write in it.</strong>{" "}
              Reading it takes twelve minutes and changes nothing.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-border bg-card/30 p-6 text-center">
          <h3 className="font-display text-xl uppercase">This kit stops at clarity</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            You walk away knowing your niche, your positioning and your first offer. The Foundation Kit
            takes you the rest of the way — to a price you can defend and an offer actually sent. The
            Accelerator turns that one sale into a system.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/foundation"
              className="inline-flex items-center gap-2 rounded-md bg-banana px-6 py-3 font-display text-sm font-black uppercase tracking-wide text-banana-foreground hover:bg-banana/90"
            >
              Get the Foundation Kit <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/accelerator"
              className="inline-flex items-center gap-2 rounded-md border border-banana px-6 py-3 font-mono text-sm uppercase tracking-[0.15em] text-foreground hover:bg-banana hover:text-banana-foreground transition-colors"
            >
              Apply for the Accelerator
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-20">
        <p className="text-sm italic leading-relaxed text-muted-foreground">
          P.S. — Question one is “what have you done for 3+ years that people regularly ask you
          about?” If the answer came to you while reading that sentence, you are closer than you
          think. Write it down before you close this page — that thought will be gone by tonight, the
          way it has been every other time.
        </p>
      </section>

      <ContentpreneurFooter />
    </div>
  );
}
