import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import {
  readOffer, EMPTY_OFFER, isOfferComplete, theAsk, defendingSentence,
  type Offer,
} from "@/lib/offer-spine";
import { Lock, ArrowRight, Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/sale-scripts")({
  head: () => ({ meta: [{ title: "The First Sale Scripts — Contentpreneur Africa" }] }),
  component: SaleScripts,
});

// TOOL 07 · THE FIRST SALE SCRIPTS
//
// The four things you will actually hear, and what to say to each. Seeded with
// their price and their defending sentence from the spine.
//
// The one that matters most is "let me think about it", because it is not an
// objection — it is two different objections wearing the same coat. Answering it
// with a question that splits it is the single highest-leverage line in the
// whole kit.

interface Script {
  key: string;
  heard: string;
  whatItReallyIs: string;
  say: (o: Offer) => string;
}

const SCRIPTS: Script[] = [
  {
    key: "expensive",
    heard: "That's a bit expensive.",
    whatItReallyIs:
      "Almost never about the number. It means they cannot yet see what lands on their desk, so they are comparing your price to nothing.",
    say: (o) =>
      `I understand. Can I tell you exactly what you get for it?\n\nYou walk away with ${o.output.trim() || "the deliverable"}${o.timeframe.trim() ? `, in ${o.timeframe.trim()}` : ""}.\n\n${defendingSentence(o) ?? "You are not paying for my time — you are paying to skip the part where you work it out yourself."}\n\nIf it is still too much, tell me and I will say so honestly — it is not for everybody.`,
  },
  {
    key: "think",
    heard: "Let me think about it.",
    whatItReallyIs:
      "Two completely different problems in one sentence — and you can only help with one of them. Splitting it is the whole move.",
    say: (o) =>
      `Of course. Can I ask one thing so I know how to help?\n\nIs it whether it will work, or whether now is the right time?\n\nThose are different problems, and I can help with one of them right now.\n\nIf it is whether it works — tell me what you are unsure about and I will answer it straight.\nIf it is timing — tell me when, and I will come back to you then instead of chasing you.${o.name.trim() ? `\n\nEither way ${o.name.trim()} is not going anywhere.` : ""}`,
  },
  {
    key: "info",
    heard: "Send me some information.",
    whatItReallyIs:
      "Usually a polite exit. Sending a brochure buries it. Sending one paragraph and one question keeps a person on the other end.",
    say: (o) =>
      `I will — but let me send the right thing rather than everything.\n\nIn one line: ${o.name.trim() || "it"} gets ${o.who.trim() || "you"} to ${o.to.trim() || "the outcome"}${o.timeframe.trim() ? ` in ${o.timeframe.trim()}` : ""}, and you keep ${o.output.trim() || "the deliverable"}.\n\nWhat is the one thing you would need to be sure of before saying yes? I will answer that specifically.`,
  },
  {
    key: "later",
    heard: "Not right now.",
    whatItReallyIs:
      "Often true, and worth respecting. The mistake is disappearing — then re-appearing months later with nothing but a pitch.",
    say: (o) =>
      `That is fair. I am not going to chase you.\n\nCan I do one thing: when should I check back? Give me a month and I will note it and leave you alone until then.\n\nIn the meantime, if ${o.from.trim() || "the situation"} gets worse rather than better, message me and we will sort it out sooner.`,
  },
];

function SaleScripts() {
  const { access } = useKitAccess();
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [open, setOpen] = useState<string>("think");

  useEffect(() => setOffer(readOffer()), []);
  const ready = isOfferComplete(offer);
  const ask = useMemo(() => theAsk(offer, ""), [offer]);

  const copy = (text: string, what: string) =>
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${what} copied`),
      () => toast.error("Could not copy"),
    );

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The First Sale Scripts are part of the Foundation Kit.</h2>
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
          <p className="nx-label mt-4">Tool 07 · used live</p>
          <h1 className="mt-2">What to say when they push back.</h1>
          <p className="nx-body max-w-xl mt-3">
            Four things you will hear. Read them once now, so you are not composing a sentence while
            somebody is waiting for one.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-5">
        {!ready && (
          <div className="nx-card !p-5">
            <p className="nx-body">
              These read better with your own price and output in them. Finish the Offer Blueprint
              and every script below fills in.
            </p>
            <Link to="/apps/offer-blueprint" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
              The Offer Blueprint <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        {ask && (
          <div className="nx-card !p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="nx-label">The ask itself</p>
                <p className="text-[15px] mt-1 whitespace-pre-line text-[var(--text-body)]">{ask}</p>
              </div>
              <button onClick={() => copy(ask, "The ask")} className="shrink-0 text-[var(--text-dim)] hover:text-foreground">
                <Copy className="size-4" />
              </button>
            </div>
          </div>
        )}

        {SCRIPTS.map((s) => {
          const text = s.say(offer);
          return (
            <div key={s.key} className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
              <button
                onClick={() => setOpen(open === s.key ? "" : s.key)}
                className="w-full text-left p-5 hover:bg-[var(--bg-surface)] transition-colors"
              >
                <span className="nx-label block">They say</span>
                <span className="font-display text-xl block mt-0.5">“{s.heard}”</span>
              </button>
              {open === s.key && (
                <div className="border-t border-[var(--border)] p-5">
                  <div className="rounded-lg bg-[var(--bg-surface)] px-4 py-3">
                    <span className="nx-label">What it actually is</span>
                    <p className="text-sm text-[var(--text-body)] mt-0.5">{s.whatItReallyIs}</p>
                  </div>
                  <p className="nx-label mt-5">You say</p>
                  <pre className="mt-1 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-[var(--text-body)]">
                    {text}
                  </pre>
                  <button
                    onClick={() => copy(text, "Script")}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline"
                  >
                    <Copy className="size-4" /> Copy this
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* The warning the spec insists ends this tool. */}
        <div className="rounded-2xl border-2 border-[#EA580C] bg-[#EA580C]/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 text-[#9A3412] mt-0.5" />
            <div>
              <h2 className="font-display text-xl text-[#9A3412]">
                You will want to offer a discount before they even ask. Don&apos;t.
              </h2>
              <p className="text-sm text-[#7C2D12] mt-2 leading-relaxed">
                It will feel like kindness. It is not — it is you resolving your own discomfort with
                the silence, using their money.
              </p>
              <p className="text-sm text-[#7C2D12] mt-2 leading-relaxed">
                A discount given to be kind becomes the price permanently. They will tell one person,
                that person will expect it, and you will have quietly repriced your work downward
                without ever deciding to.
              </p>
              <p className="text-sm text-[#7C2D12] mt-2 leading-relaxed">
                If you genuinely want to lower the number, lower the <strong>scope</strong> with it.
                Same price for less work is a negotiation. Less price for the same work is a lesson
                they will apply to you forever.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
          <h2 className="text-white text-2xl">None of this matters until you have asked.</h2>
          <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg mx-auto">
            Objection handling is not the hard part. Sending the first message is.
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
