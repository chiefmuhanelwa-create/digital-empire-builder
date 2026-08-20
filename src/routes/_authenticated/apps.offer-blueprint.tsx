import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import {
  PROFESSIONS, professionByKey, EMPTY_OFFER, readOffer, writeOffer,
  assembleSentence, offerCompleteness, critiqueWho, critiqueFromTo, critiqueOutput,
  priceMirror, nudgeUp, theAsk, defendingSentence,
  type Offer, type ProfessionKey,
} from "@/lib/offer-spine";
import { Lock, ArrowRight, Check, Printer, Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/offer-blueprint")({
  head: () => ({ meta: [{ title: "The Offer Blueprint — Contentpreneur Africa" }] }),
  component: OfferBlueprint,
});

// Seven steps, in the spec's order. The order is load-bearing: price comes LAST,
// after they have written the output. Asking for a price before the deliverable
// exists is how people arrive at R500 — they are pricing their nerves, not the work.
const STEPS = [
  { k: "who", label: "Who exactly", q: "Who is the one person this is for?",
    help: "Not a category. A person, at a moment. What has just happened to them that makes this urgent?" },
  { k: "from", label: "Where they are now", q: "What is true for them today?",
    help: "In their words, not yours. What are they doing at 22:00 that they wish they were not?" },
  { k: "to", label: "Where they end up", q: "What can they do afterwards that they cannot do now?",
    help: "An ability, not a feeling. 'Confident' is not an outcome. 'Can hand the audit over without apologising' is." },
  { k: "timeframe", label: "How long", q: "How long does it take?",
    help: "A real number. Vague timeframes read as 'I have not done this before'." },
  { k: "output", label: "What they keep", q: "What physically changes hands?",
    help: "A document, a pack, a schedule, a template. If you cannot email it, it is not the output." },
  { k: "format", label: "How it is delivered", q: "How do you actually deliver it?",
    help: "Sessions, async review, a workshop. Say it plainly so nobody imagines something bigger." },
  { k: "name", label: "What it is called", q: "What is it called?",
    help: "Name the outcome, not the process. 'Audit-Ready in 21 Days' beats 'Financial Advisory Services'." },
] as const;

type StepKey = (typeof STEPS)[number]["k"];

function OfferBlueprint() {
  const { access } = useKitAccess();
  const [profession, setProfession] = useState<ProfessionKey | null>(null);
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const o = readOffer();
    setOffer(o);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) writeOffer(offer);
  }, [offer, loaded]);

  const prof = professionByKey(profession);
  const pct = offerCompleteness(offer);
  const sentence = assembleSentence(offer);

  const set = (k: keyof Offer, v: string | number | null) =>
    setOffer((o) => ({ ...o, [k]: v }));

  const verdict = useMemo(() => priceMirror(offer.price), [offer.price]);

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The Offer Blueprint is part of the Foundation Kit.</h2>
            <p className="nx-body max-w-md mx-auto mt-2">
              One hour here writes your rate card, your invoice, your content calendar and your emails.
            </p>
            <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
          </div>
        </main>
      </Shell>
    );
  }

  // ── Profession picker ────────────────────────────────────────────────────
  // Shown first and only once. The spec is right that this must come before any
  // blank field: a worked offer from your own field is arguable, a blank field
  // is not.
  if (!profession && !offer.who) {
    return (
      <Shell>
        <Header pct={0} />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
          <h2 className="text-2xl">First — what do you actually do?</h2>
          <p className="nx-body mt-2">
            Pick the closest one. Every step after this shows you a complete, finished offer from
            your field, which you can take and edit rather than start from nothing.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {PROFESSIONS.map((p) => (
              <button
                key={p.key}
                onClick={() => setProfession(p.key)}
                className="text-left rounded-xl border border-[var(--border)] bg-white p-5 hover:border-[var(--nx-gold)] transition-colors"
              >
                <div className="font-display text-lg">{p.label}</div>
                <p className="text-sm text-[var(--text-dim)] mt-1">{p.blurb}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setProfession("finance-leader")}
            className="mt-5 text-sm font-semibold text-[var(--nx-gold-text)] hover:underline"
          >
            None of these are close — just show me one →
          </button>
        </main>
      </Shell>
    );
  }

  const current = STEPS[step];
  const exampleValue = prof ? (prof.example[current.k as StepKey] as string) : "";

  // Live critique for the current step only — the spec's point is that the
  // correction IS the teaching, so it appears the moment the answer is weak.
  const critique =
    current.k === "who" ? critiqueWho(offer.who)
    : current.k === "to" ? critiqueFromTo(offer.from, offer.to)
    : current.k === "output" ? critiqueOutput(offer.output)
    : { ok: true, note: "" };

  return (
    <Shell>
      <Header pct={pct} />

      {/* The live sentence. Clauses gold as they fill — a half-finished sentence
          is visibly half-finished in a way a progress bar never is. */}
      <section className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
          <p className="nx-label">Your offer, so far</p>
          <p className="mt-2 text-lg leading-relaxed">
            {sentence.split("…").map((chunk, i, arr) => (
              <span key={i}>
                <span className="text-[var(--foreground)]">{chunk}</span>
                {i < arr.length - 1 && (
                  <span className="text-[var(--text-subtle)] font-mono text-sm">［to fill］</span>
                )}
              </span>
            ))}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 flex-wrap">
          {STEPS.map((s, i) => (
            <button
              key={s.k}
              onClick={() => setStep(i)}
              className={`text-xs rounded-full px-3 py-1.5 font-semibold transition-colors ${
                i === step
                  ? "bg-[var(--obsidian)] text-white"
                  : (offer[s.k as keyof Offer] as string)?.toString().trim()
                    ? "bg-[var(--bg-card-hi)] text-[#15803D]"
                    : "border border-[var(--border-mid)] text-[var(--text-dim)]"
              }`}
            >
              {(offer[s.k as keyof Offer] as string)?.toString().trim() && i !== step && (
                <Check className="inline size-3 mr-1" />
              )}
              {s.label}
            </button>
          ))}
        </div>

        <div className="nx-card !p-6 mt-6">
          <p className="nx-label">Step {step + 1} of {STEPS.length}</p>
          <h2 className="text-2xl mt-1">{current.q}</h2>
          <p className="nx-body mt-2">{current.help}</p>

          <textarea
            value={(offer[current.k as keyof Offer] as string) ?? ""}
            onChange={(e) => set(current.k as keyof Offer, e.target.value)}
            rows={current.k === "timeframe" || current.k === "name" ? 2 : 3}
            placeholder="Type it in your own words…"
            className="mt-4 w-full rounded-lg border border-[var(--border-mid)] bg-white p-3 text-[15px] focus:border-[var(--nx-gold)] focus:outline-none"
          />

          {!critique.ok && critique.note && (
            <div className="mt-3 rounded-lg border-l-4 border-[#EA580C] bg-[#EA580C]/5 px-4 py-3">
              <p className="text-sm text-[#7C2D12]">{critique.note}</p>
            </div>
          )}

          {prof && exampleValue && (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <p className="nx-label">A finished one from your field</p>
              <p className="text-[15px] mt-1 text-[var(--text-body)]">{exampleValue}</p>
              <button
                onClick={() => set(current.k as keyof Offer, exampleValue)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline"
              >
                <Wand2 className="size-3.5" /> Use this and edit it
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-sm font-semibold text-[var(--text-dim)] disabled:opacity-30"
            >
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--obsidian)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#2A2A2A]"
              >
                Next <ArrowRight className="size-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Price comes last, on its own, after the output exists. */}
        {step === STEPS.length - 1 && (
          <div className="nx-card !p-6 mt-5">
            <p className="nx-label">Last one</p>
            <h2 className="text-2xl mt-1">What does it cost?</h2>
            <p className="nx-body mt-2">
              In rand. This is what your client pays you — not what anything on this site costs.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="font-display text-2xl text-[var(--text-dim)]">R</span>
              <input
                type="number"
                inputMode="numeric"
                value={offer.price ?? ""}
                onChange={(e) => set("price", e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
                className="w-48 rounded-lg border border-[var(--border-mid)] bg-white p-3 font-display text-2xl focus:border-[var(--nx-gold)] focus:outline-none"
              />
            </div>

            {verdict && (
              <div className="mt-4 rounded-xl border-l-4 border-[var(--nx-gold)] bg-[var(--bg-surface)] px-4 py-4">
                <p className="font-display text-lg">{verdict.headline}</p>
                <p className="text-sm text-[var(--text-body)] mt-1">{verdict.body}</p>
                {verdict.band === "real" && offer.price && (
                  <button
                    onClick={() => set("price", nudgeUp(offer.price!))}
                    className="mt-3 text-sm font-bold text-[var(--nx-gold-text)] hover:underline"
                  >
                    It came out easily — make it R{nudgeUp(offer.price).toLocaleString("en-ZA")} →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {pct === 100 && <Blueprint offer={offer} />}
      </main>
    </Shell>
  );
}

// ── The artifact ────────────────────────────────────────────────────────────
// Every tool must end in something they keep. This is the printable one-pager
// plus the ready-to-send message with their own words already in it.
function Blueprint({ offer }: { offer: Offer }) {
  const ask = theAsk(offer, "");
  const defend = defendingSentence(offer);

  const copy = (text: string, what: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${what} copied`),
      () => toast.error("Could not copy"),
    );
  };

  return (
    <div className="mt-8" id="blueprint">
      <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-white">
        <p className="nx-label">Your blueprint</p>
        <h2 className="text-white text-2xl mt-1">This is the spine. Everything else reads from it.</h2>
        <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg">
          Your rate card, your invoice, Day 7 of your content calendar and the closing line of your
          fifth email are already written, because you just wrote them here.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)]"
          >
            <Printer className="size-4" /> Print the one-pager
          </button>
          <Link
            to="/apps/the-send"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:border-white/60"
          >
            Now go and send it <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="nx-card !p-6 mt-5">
        <p className="nx-label">The offer, in one sentence</p>
        <p className="text-lg mt-1">{assembleSentence(offer)}</p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Called" value={offer.name} />
          <Field label="Price" value={offer.price ? `R${offer.price.toLocaleString("en-ZA")}` : "—"} />
          <Field label="Delivered as" value={offer.format} />
          <Field label="They keep" value={offer.output} />
        </dl>
      </div>

      {defend && (
        <div className="nx-card !p-6 mt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="nx-label">When they ask why it costs that</p>
              <p className="text-[15px] mt-1 text-[var(--text-body)]">{defend}</p>
            </div>
            <button onClick={() => copy(defend, "Sentence")} className="shrink-0 text-[var(--text-dim)] hover:text-foreground">
              <Copy className="size-4" />
            </button>
          </div>
        </div>
      )}

      {ask && (
        <div className="nx-card !p-6 mt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="nx-label">The message you can send today</p>
              <p className="text-[15px] mt-1 whitespace-pre-line text-[var(--text-body)]">{ask}</p>
            </div>
            <button onClick={() => copy(ask, "Message")} className="shrink-0 text-[var(--text-dim)] hover:text-foreground">
              <Copy className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="nx-label">{label}</dt>
      <dd className="text-[15px] mt-0.5 text-[var(--text-body)]">{value || "—"}</dd>
    </div>
  );
}

function Header({ pct }: { pct: number }) {
  return (
    <section className="nx-hero-orb border-b border-border">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-7">
        <Link to="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">
          ← Your Clarity System
        </Link>
        <p className="nx-label mt-4">Tool 01 · The spine</p>
        <h1 className="mt-2">The Offer Blueprint</h1>
        <p className="nx-body max-w-xl mt-3">
          What is the one thing somebody can buy from you this month? Answer it once, properly, and
          the rest of the kit fills itself in.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-[var(--border)] overflow-hidden">
            <div className="h-full bg-[var(--nx-gold)] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-display text-sm whitespace-nowrap">{pct}%</span>
        </div>
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
