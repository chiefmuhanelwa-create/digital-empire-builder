import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ContentpreneurHeader, ContentpreneurFooter } from "@/components/contentpreneur-header";
import { MailerLiteEmbedForm } from "@/components/MailerLiteEmbedForm";
import { ArrowRight } from "lucide-react";

// THE RIVER → FISH → TANK DIAGNOSTIC — the landing page for the IG keyword "rent".
//
// WHY THIS EXISTS RATHER THAN POINTING THE KEYWORD AT AN EXISTING FUNNEL
// =====================================================================
// The video ends: "if you want to know whether you are renting or you are
// owning, comment the word rent and I'll send you a link." That is a promise of
// a DIAGNOSIS. The two live Instagram automations lead to the Creator Bundle
// (niche + PAIDS workbooks) and the Starter Kit landing page — neither of which
// answers "am I renting or owning?". Sending this traffic to either one breaks
// the promise made 14 seconds earlier, and a broken promise at the top of a
// funnel is why keyword automations stop converting.
//
// So the link fulfils the promise first, then hands them the Starter Kit —
// which is the honest next step, because the Starter Kit's module 6 IS
// River, Fish, Tank. They get the framework they just watched, in full.
//
// Capture uses MailerLite's OWN embedded form (slug "v3XiMi", "Starter Kit
// Opt-in") — the same form /starterkit uses, per the 2026-08-06 instruction that
// Starter Kit delivery is MailerLite's responsibility end to end. A second,
// custom capture path for the same magnet would mean two places to keep in step
// and two ways for delivery to silently diverge.
//
// Verified live before wiring traffic in (2026-08-19): is_broken false, no
// warnings, double_optin FALSE — so signups land active rather than stranded,
// which is what left 33 people with nothing — feeding group StarterKit Leads,
// last registration 00:03 that morning.

export const Route = createFileRoute("/rented")({
  head: () => ({
    meta: [
      { title: "Are you renting or owning? — Contentpreneur Africa" },
      {
        name: "description",
        content:
          "Six questions. Find out whether your audience lives on rented land or in a tank you own — and what to do about it.",
      },
    ],
  }),
  component: RentedPage,
});

// Six questions, in the video's own language. Every one asks whether a thing
// EXISTS, not how the person feels about it — a feelings scale lets everybody
// score themselves comfortable.
const Q = [
  {
    q: "If Instagram deleted your account tonight, could you still reach your audience tomorrow?",
    a: ["No — they'd be gone", "A few people, in my phone contacts", "Yes — I have their emails or numbers"],
  },
  {
    q: "Where does someone's name and contact actually land when they discover you?",
    a: ["Nowhere — they just follow", "In my DMs", "On a list I control"],
  },
  {
    q: "Do you have one thing you give away that requires an email or a number to get?",
    a: ["No", "Something, but nobody really asks for it", "Yes — and people opt in for it"],
  },
  {
    q: "When you want to sell something, how do you tell people?",
    a: ["I post and hope it reaches them", "I post and DM a few", "I email or WhatsApp them directly"],
  },
  {
    q: "How much of your income depends on one platform still liking you?",
    a: ["All of it", "Most of it", "Less than half"],
  },
  {
    q: "Last time reach dropped, what happened to your income?",
    a: ["It dropped with it", "It wobbled", "It didn't move"],
  },
] as const;

function RentedPage() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);

  const score = answers.reduce((a, b) => a + b, 0);
  const max = Q.length * 2;
  const finished = answers.length === Q.length;

  const verdict =
    score <= 3
      ? { tag: "You are renting.", body: "Everything you have is on someone else's land. If the platform changes its mind tomorrow, you start from zero — and you would have no way to tell anyone where you went." }
      : score <= 8
        ? { tag: "You are exposed.", body: "You have started building a tank, but most of your fish are still in the river. One algorithm change and the part you own is not big enough to carry you." }
        : { tag: "You are owning.", body: "You could lose a platform and still reach your people. That is the whole game — now the work is making the tank bigger than the river." };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentpreneurHeader />

      <section className="mx-auto max-w-2xl px-6 pt-16 pb-10">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">River · Fish · Tank</div>
        <h1 className="mt-5 font-display text-4xl sm:text-5xl leading-[1.05]">
          Are you renting, or owning?
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
          One morning I opened my phone and 780,000 followers were gone. My income did not move —
          because by then the people who mattered were not on the platform. They were on a list I owned.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Six questions. Sixty seconds. You will know exactly which one you are.
        </p>
      </section>

      {/* The framework, taught up front and in full. Nothing gated behind the email. */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-10 grid gap-5 sm:grid-cols-3">
          {[
            ["The river", "Social media. Huge, always moving, and not yours. You are only fishing in it."],
            ["The fish", "Your followers. They swim past you. You do not own a single one of them."],
            ["The tank", "Your email list or WhatsApp community. The place you reach people without anyone's permission."],
          ].map(([t, b]) => (
            <div key={t}>
              <div className="font-display text-lg text-banana">{t}</div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-2xl px-6 pb-10 text-base">
          <strong>Your job on social media is not to collect fish. It is to move fish out of the
          river and into your tank.</strong>
        </p>
      </section>

      {!finished ? (
        <section className="mx-auto max-w-2xl px-6 py-12">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-muted-foreground">
            {step + 1} of {Q.length}
          </div>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl leading-tight">{Q[step].q}</h2>
          <div className="mt-6 grid gap-3">
            {Q[step].a.map((label, i) => (
              <button
                key={label}
                onClick={() => {
                  const next = [...answers];
                  next[step] = i;
                  setAnswers(next);
                  setStep((s) => Math.min(Q.length - 1, s + 1));
                  if (next.length === Q.length && next.every((v) => v !== undefined)) setStep(Q.length - 1);
                }}
                className="text-left border border-border bg-background p-4 hover:border-banana transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="mt-5 text-sm text-muted-foreground hover:text-foreground">
              ← Back
            </button>
          )}
        </section>
      ) : (
        <section className="mx-auto max-w-2xl px-6 py-12">
          <div className="border-2 border-banana bg-card/30 p-8" style={{ boxShadow: "0 0 24px rgba(201,168,76,0.25)" }}>
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Your result</div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">{verdict.tag}</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">{verdict.body}</p>
            <div className="mt-6 h-2 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-banana transition-all" style={{ width: `${(score / max) * 100}%` }} />
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {score} / {max} owned
            </p>
          </div>

          <div className="mt-8 border border-border bg-background p-6">
            <h3 className="font-display text-xl">Now build the tank.</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              The free Knowledge Entrepreneur Starter Kit walks you through it — River, Fish, Tank
              is worksheet six, and it ends with your first lead magnet written. No login, no card.
            </p>
            {/* MailerLite's own form. It owns the delivery and the confirmation
                message, so there is no custom success state here to drift out of
                step with what MailerLite actually sends. */}
            <div className="mt-5">
              <MailerLiteEmbedForm formSlug="v3XiMi" />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Free · 8 worksheets · delivered by email
            </p>
            <p className="mt-6 pt-5 border-t border-border text-center">
              <a href="/foundation" className="inline-flex items-center gap-2 text-sm font-bold text-banana hover:underline">
                When you want the whole system <ArrowRight className="size-4" />
              </a>
            </p>
          </div>
        </section>
      )}

      <ContentpreneurFooter />
    </div>
  );
}
