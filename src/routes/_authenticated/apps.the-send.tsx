import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { readOffer, theAsk, isOfferComplete, type Offer, EMPTY_OFFER } from "@/lib/offer-spine";
import { Lock, Copy, Check, ArrowRight, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/the-send")({
  head: () => ({ meta: [{ title: "The Send — Contentpreneur Africa" }] }),
  component: TheSend,
});

// The only tool in the kit that produces money.
//
// Everything before this is apparatus. The spec is blunt about why this exists
// as its own screen: the kit answers "can I actually do this?", that is a BELIEF
// problem, and belief does not move with more information. It moves when someone
// does the thing once. So the last tool makes them send it, and remembers
// whether they did.

export const SEND_KEY = "nochill-the-send-v1";

interface SendState {
  name: string;
  channel: string;
  date: string;
  sent: boolean;
  sentAt: string | null;
  outcome: "" | "paid" | "talking" | "no";
  attempts: string[];
}

const EMPTY: SendState = {
  name: "", channel: "", date: "", sent: false, sentAt: null, outcome: "", attempts: [],
};

const CHANNELS = ["WhatsApp", "Email", "A phone call", "In person", "LinkedIn DM"];

function readSend(): SendState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = JSON.parse(localStorage.getItem(SEND_KEY) || "null");
    return raw && typeof raw === "object" ? { ...EMPTY, ...raw } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function TheSend() {
  const { access } = useKitAccess();
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [s, setS] = useState<SendState>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOffer(readOffer());
    setS(readSend());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem(SEND_KEY, JSON.stringify(s)); } catch { /* ignore */ }
    }
  }, [s, loaded]);

  const ask = theAsk(offer, s.name);
  const ready = isOfferComplete(offer);

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The Send is part of the Foundation Kit.</h2>
            <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
          </div>
        </main>
      </Shell>
    );
  }

  // Without a finished offer there is nothing to send. Send them back rather
  // than letting them fill in a name and stall.
  if (!ready) {
    return (
      <Shell>
        <Hero />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
          <div className="nx-card !p-8 text-center">
            <h2 className="text-2xl">Your offer is not finished yet.</h2>
            <p className="nx-body max-w-md mx-auto mt-2">
              There is nothing to send until the blueprint is complete. Ten more minutes there and
              this page writes the message for you.
            </p>
            <Link to="/apps/offer-blueprint" className="cta-glow inline-flex items-center gap-2 mt-6">
              Finish the Offer Blueprint <ArrowRight className="size-4" />
            </Link>
          </div>
        </main>
      </Shell>
    );
  }

  // ── Already sent ─────────────────────────────────────────────────────────
  if (s.sent) {
    return (
      <Shell>
        <Hero />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-5">
          <div className="rounded-2xl bg-[var(--obsidian)] p-8 text-center text-white">
            <Check className="size-8 text-[var(--nx-gold-bright)] mx-auto" />
            <h2 className="text-white text-2xl mt-3">You told somebody.</h2>
            <p className="text-[#C8C2B4] mt-2">
              {s.name || "One person"} · {s.channel || "sent"}
              {s.sentAt ? ` · ${new Date(s.sentAt).toLocaleDateString("en-ZA")}` : ""}
            </p>
            <p className="text-[#9A9488] text-sm mt-3 max-w-md mx-auto">
              That is the step nearly everybody skips. The apparatus was never the hard part.
            </p>
          </div>

          <div className="nx-card !p-6">
            <p className="nx-label">What came back?</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {([
                ["paid", "They paid"],
                ["talking", "Still talking"],
                ["no", "No, or no answer"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setS((p) => ({ ...p, outcome: k }))}
                  className={`rounded-xl border p-4 text-sm font-semibold transition-colors ${
                    s.outcome === k
                      ? "border-[var(--nx-gold)] bg-[var(--bg-card-hi)]"
                      : "border-[var(--border-mid)] hover:border-[var(--nx-gold)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {s.outcome === "paid" && (
              <div className="mt-5 rounded-xl border-l-4 border-[#15803D] bg-[#15803D]/5 px-4 py-4">
                <p className="font-display text-lg">That is the whole thing.</p>
                <p className="text-sm text-[var(--text-body)] mt-1">
                  You now have evidence, not theory. The question the kit set out to answer — can I
                  actually do this — is answered, and it was answered by money, which is the only
                  answer that holds.
                </p>
                <p className="text-sm text-[var(--text-body)] mt-2">
                  Send the invoice today, not tomorrow. Then do the same thing for the next person.
                </p>
                <Link to="/accelerator" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
                  When repeating it is the problem, that is the Accelerator <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}

            {s.outcome === "talking" && (
              <div className="mt-5 rounded-xl border-l-4 border-[var(--nx-gold)] bg-[var(--bg-surface)] px-4 py-4">
                <p className="font-display text-lg">Then the next words matter.</p>
                <p className="text-sm text-[var(--text-body)] mt-1">
                  You will want to offer a discount before they even ask. Don&apos;t. A discount given
                  to be kind becomes the price permanently.
                </p>
                <Link to="/apps/seeds-pipeline" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
                  Work the conversation <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}

            {s.outcome === "no" && (
              <div className="mt-5 rounded-xl border-l-4 border-[var(--border-mid)] bg-[var(--bg-surface)] px-4 py-4">
                <p className="font-display text-lg">One no tells you almost nothing.</p>
                <p className="text-sm text-[var(--text-body)] mt-1">
                  Three tell you something real. It could be the person, the price, the wording or
                  the timing, and one data point cannot separate those. Send it to the next name.
                </p>
                <button
                  onClick={() => setS((p) => ({
                    ...p,
                    attempts: [...p.attempts, p.name].filter(Boolean),
                    name: "", channel: "", sent: false, sentAt: null, outcome: "",
                  }))}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--obsidian)] text-white px-4 py-2 text-sm font-semibold hover:bg-[#2A2A2A]"
                >
                  Next name <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {s.attempts.length > 0 && (
            <div className="nx-card !p-5">
              <p className="nx-label">Asked so far</p>
              <p className="text-sm text-[var(--text-dim)] mt-1">
                {s.attempts.join(" · ")} — {s.attempts.length}{" "}
                {s.attempts.length === 1 ? "person" : "people"}
              </p>
            </div>
          )}
        </main>
      </Shell>
    );
  }

  // ── Not sent yet ─────────────────────────────────────────────────────────
  return (
    <Shell>
      <Hero />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-5">
        <div className="nx-card !p-6">
          <p className="nx-label">One person. Not a list.</p>
          <p className="nx-body mt-1">
            A list lets you hide. You can spend three weeks building the perfect list and never send
            anything, and it will feel like work the whole time. Name one human being who could say
            yes this week.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="nx-label">Their name</label>
              <input
                value={s.name}
                onChange={(e) => setS((p) => ({ ...p, name: e.target.value }))}
                placeholder="One name"
                className="mt-1 w-full rounded-lg border border-[var(--border-mid)] bg-white p-3 focus:border-[var(--nx-gold)] focus:outline-none"
              />
            </div>
            <div>
              <label className="nx-label">How you will send it</label>
              <select
                value={s.channel}
                onChange={(e) => setS((p) => ({ ...p, channel: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border-mid)] bg-white p-3 focus:border-[var(--nx-gold)] focus:outline-none"
              >
                <option value="">Choose…</option>
                {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {ask && (
          <div className="nx-card !p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="nx-label">The message — already written, in your words</p>
                <p className="text-[15px] mt-2 whitespace-pre-line text-[var(--text-body)]">{ask}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(ask).then(
                  () => toast.success("Copied"), () => toast.error("Could not copy"))}
                className="shrink-0 text-[var(--text-dim)] hover:text-foreground"
              >
                <Copy className="size-4" />
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
          <p className="text-[#C8C2B4] text-sm max-w-md mx-auto">
            Nothing on this page counts until it has left your phone. Send it, then press the button
            — and press it honestly, because the only person it lies to is you.
          </p>
          <button
            disabled={!s.name.trim() || !s.channel}
            onClick={() => setS((p) => ({ ...p, sent: true, sentAt: new Date().toISOString() }))}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-8 py-4 font-display text-lg font-bold text-[var(--foreground)] hover:bg-[var(--nx-gold-deep)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="size-5" /> Yes — I sent it
          </button>
          {(!s.name.trim() || !s.channel) && (
            <p className="text-[#9A9488] text-xs mt-3">Name the person and the channel first.</p>
          )}
        </div>
      </main>
    </Shell>
  );
}

function Hero() {
  return (
    <section className="nx-hero-orb border-b border-border">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-7">
        <Link to="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">
          ← Your Clarity System
        </Link>
        <p className="nx-label mt-4">Tool 10 · The only one that produces money</p>
        <h1 className="mt-2">The Send</h1>
        <p className="nx-body max-w-xl mt-3">
          Have you actually told anybody? Everything else in this kit is apparatus. This is the step
          that turns it into a sale, and it is the one people skip.
        </p>
      </div>
    </section>
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
