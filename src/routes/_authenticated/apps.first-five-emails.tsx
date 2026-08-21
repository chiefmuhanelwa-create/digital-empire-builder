import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import {
  readOffer, readMagnet, EMPTY_OFFER, EMPTY_MAGNET, isOfferComplete,
  type Offer, type Magnet,
} from "@/lib/offer-spine";
import { Lock, ArrowRight, Copy, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/first-five-emails")({
  head: () => ({ meta: [{ title: "The First Five Emails — Contentpreneur Africa" }] }),
  component: FirstFiveEmails,
});

// TOOL 06 · THE FIRST FIVE EMAILS
//
// Written to the house email rules, not generic copywriting: subject lines are
// lowercase, unpunctuated and four to five words; there is ONE call to action
// per email; the lesson is given away in full before any ask; and links are text
// links, never buttons, because a table-based CTA button is a Promotions-tab
// signal.
//
// WHAT THIS TOOL DELIBERATELY WILL NOT DO
// =======================================
// It does not write their story. Email three is the one that converts and it
// depends on a real thing that happened to a real person — so the tool leaves a
// bracketed gap there rather than inventing an anecdote. A charming story that
// turns out to be fabricated ends the relationship with a professional audience
// permanently, and a kit that fabricates one on their behalf hands them that
// risk without telling them.
//
// The bracket is the feature. Everything around it is done for them.

interface Draft {
  n: number;
  job: string;
  subject: string;
  preheader: string;
  body: string;
  cta: string;
}

function build(o: Offer, m: Magnet): Draft[] {
  const who = o.who.trim() || "the person you help";
  const from = o.from.trim() || "where they are now";
  const to = o.to.trim() || "where they want to be";
  const output = o.output.trim() || "what they keep";
  const name = o.name.trim() || "your offer";
  const time = o.timeframe.trim() || "the timeframe";
  const price = o.price ? `R${o.price.toLocaleString("en-ZA")}` : "the price";
  const magnet = m.title.trim() || "the thing you gave away";

  return [
    {
      n: 1,
      job: "Deliver the magnet. Nothing else.",
      subject: "here it is",
      preheader: "plus the one page to start on",
      body: `{$name}, here is ${magnet}.

[LINK]

Start on point two. That is the one people skip, and it is the one that changes the answer.

I send one email a week. If it is ever not useful, the unsubscribe link is at the bottom and I will not take it personally.

— Ndivhuwo`,
      cta: "The link. Nothing else — this is the highest-open email you will ever send and burning it on a pitch costs more than it earns.",
    },
    {
      n: 2,
      job: "Name the mistake. Teach the fix in full.",
      subject: "the mistake almost everyone makes",
      preheader: "it is not the thing you think",
      body: `{$name}, most ${who.toLowerCase()} get this wrong in the same place.

They try to fix ${from.toLowerCase()} by working harder at it.

It does not move. Not because they are lazy — because effort was never the constraint.

The constraint is that nothing is written down. Nothing is repeatable. Every week starts from nothing.

Here is the fix, in full:

[Teach it completely here — the actual method, not a teaser. Three or four short lines.]

That is the whole thing. No catch.

Hit reply and tell me one line: which part of that are you already doing?

— Ndivhuwo`,
      cta: "A reply. At this list size a reply is worth more than a click, and it is the strongest inbox signal you have.",
    },
    {
      n: 3,
      job: "What it cost you to learn. The one that converts.",
      subject: "what this cost me",
      preheader: "before I knew any of it",
      body: `{$name}, I did not learn this from a book.

[Your own situation, in two or three lines. What was actually happening, and when. Do not tidy it up — the untidy version is the one people believe.]

[What it cost you. A number, a month, a thing you lost. Be specific: a real figure lands where "it was hard" does not.]

[What changed, and what you did differently after.]

That is why ${name} exists in the shape it does. It is the thing I wish someone had handed me.

No link today.

— Ndivhuwo`,
      cta: "None. Deliberately. The absence is what earns the right to email five — do not add one.",
    },
    {
      n: 4,
      job: "Show it working on someone who is not you.",
      subject: "someone who actually did it",
      preheader: "and what changed for them",
      body: `{$name}, here is what it looks like when it works.

[One real person. What they were doing before — the version of ${from.toLowerCase()} that was true for them.]

[What they did. The actual steps, in order.]

[Where they are now. If you have a number, use the number. If you do not, say what changed and do not reach.]

The part worth noticing: they did not do anything you cannot do. They just did it in order, and they finished.

Reply and tell me where you are stuck. I read every one.

— Ndivhuwo`,
      cta: "A reply. If you have no real result yet, say so plainly in one line and skip this email — never write a composite person.",
    },
    {
      n: 5,
      job: "The offer, with the anti-sell.",
      subject: "who this is not for",
      preheader: "read this part first",
      body: `{$name}, this is the only email where I ask.

${name} is for ${who.toLowerCase()} who want to get to ${to.toLowerCase()} in ${time}.

You walk away with ${output}.

It is ${price}.

Who it is not for: anyone still deciding what they are building, anyone looking for a shortcut rather than a system, and anyone who wants the strategy separated from the faith. That is not a filter to make it sound exclusive — those three genuinely do not get their money's worth.

If that is not you, reply with a question and I will answer it straight.

[LINK]

— Ndivhuwo`,
      cta: "One link. Naming who it is wrong for converts better with this audience than pressure ever does.",
    },
  ];
}

function FirstFiveEmails() {
  const { access } = useKitAccess();
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [magnet, setMagnet] = useState<Magnet>(EMPTY_MAGNET);
  const [open, setOpen] = useState(1);

  useEffect(() => {
    setOffer(readOffer());
    setMagnet(readMagnet());
  }, []);

  const drafts = useMemo(() => build(offer, magnet), [offer, magnet]);
  const ready = isOfferComplete(offer);

  const copy = (d: Draft) =>
    navigator.clipboard
      .writeText(`Subject: ${d.subject}\nPreheader: ${d.preheader}\n\n${d.body}`)
      .then(() => toast.success(`Email ${d.n} copied`), () => toast.error("Could not copy"));

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The First Five Emails is part of the Foundation Kit.</h2>
            <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-7">
          <Link to="/dashboard/foundation-kit" className="inline-flex items-center gap-1 text-[16px] font-semibold text-[var(--nx-gold-text)] hover:underline">
            ← All tools
          </Link>
          <p className="nx-label mt-4">Tool 06 · after the magnet</p>
          <h1 className="mt-2">The First Five Emails</h1>
          <p className="nx-body max-w-xl mt-3">
            A name in your tank is not a customer yet. These five are what turn one into the other —
            written around your offer, in your words.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-5">
        {!ready && (
          <div className="nx-card !p-5">
            <p className="nx-body">
              Finish the Offer Blueprint first. Right now these drafts have placeholders where your
              buyer, your output and your price should be.
            </p>
            <Link to="/apps/offer-blueprint" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
              The Offer Blueprint <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        <div className="nx-card !p-5">
          <p className="nx-label">Why there are brackets in emails three and four</p>
          <p className="nx-body mt-1">
            Everything that can be written from your offer already is. What is left in brackets is
            the part only you know — your situation, your numbers, a real person you actually helped.
            This tool will not invent those. A story that turns out to be made up ends the
            relationship with this audience permanently, and it would be your name on it, not mine.
          </p>
        </div>

        {drafts.map((d) => (
          <div key={d.n} className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
            <button
              onClick={() => setOpen(open === d.n ? 0 : d.n)}
              className="w-full text-left p-5 flex items-start gap-4 hover:bg-[var(--bg-surface)] transition-colors"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--obsidian)] font-display text-[var(--nx-gold-bright)]">
                {d.n}
              </span>
              <span className="flex-1 min-w-0">
                <span className="nx-label block">{d.job}</span>
                <span className="font-display text-lg block mt-0.5">{d.subject}</span>
                <span className="text-sm text-[var(--text-dim)] block">{d.preheader}</span>
              </span>
            </button>

            {open === d.n && (
              <div className="border-t border-[var(--border)] p-5">
                <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-[var(--text-body)]">
                  {d.body}
                </pre>
                <div className="mt-4 rounded-lg border-l-4 border-[var(--nx-gold)] bg-[var(--bg-surface)] px-4 py-3">
                  <span className="nx-label">The one ask</span>
                  <p className="text-sm text-[var(--text-body)] mt-0.5">{d.cta}</p>
                </div>
                <button
                  onClick={() => copy(d)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline"
                >
                  <Copy className="size-4" /> Copy email {d.n}
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)] hover:text-foreground"
          >
            <Printer className="size-4" /> Print all five
          </button>
        </div>

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
          <h2 className="text-white text-2xl">Send them one at a time, a few days apart.</h2>
          <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg mx-auto">
            Load them into MailerLite as a sequence. Then go and tell one person directly — that is
            still the fastest route to the first sale, and it does not wait for a list.
          </p>
          <Link
            to="/apps/the-send"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-6 py-3 text-sm font-bold text-[#111111] hover:bg-[var(--nx-gold-deep)] transition-colors"
          >
            The Send <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
