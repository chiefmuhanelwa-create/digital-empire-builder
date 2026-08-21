import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { readOffer, EMPTY_OFFER, type Offer } from "@/lib/offer-spine";
import { Lock, ArrowRight, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/adjacent-three")({
  head: () => ({ meta: [{ title: "The Adjacent Three — Contentpreneur Africa" }] }),
  component: AdjacentThree,
});

// STAGE 2 · POSITIONING — rebuilt from the content system's "Competitor" tool.
//
// WHAT THE OLD ONE DID AND WHY IT WAS REPLACED
// ============================================
// It asked for a handle, implied it would analyse an account, then quietly did
// nothing but re-read whatever you pasted in. A tool that pretends to fetch
// data it cannot fetch is worse than no tool: the buyer trusts an answer that
// was never grounded in anything.
//
// This version is honest about being manual — and manual is correct here.
// Stage 2 asks them to "look at three adjacent people; note what they charge
// and what they never talk about." The output that matters is not a report on
// a competitor. It is THE GAP: the thing nobody in their lane is saying, which
// becomes their position. That requires a human to look and notice.

const KEY = "nochill-adjacent-v1";

interface Rival {
  name: string;
  where: string;
  charges: string;
  says: string;
  neverSays: string;
}

const BLANK: Rival = { name: "", where: "", charges: "", says: "", neverSays: "" };

interface Saved { rivals: Rival[]; gap: string }
const DEFAULTS: Saved = { rivals: [ { ...BLANK }, { ...BLANK }, { ...BLANK } ], gap: "" };

function AdjacentThree() {
  const { access } = useKitAccess();
  const [s, setS] = useState<Saved>(DEFAULTS);
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);

  useEffect(() => {
    setOffer(readOffer());
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r?.rivals) setS({ ...DEFAULTS, ...r });
    } catch { /* ignore */ }
  }, []);

  const save = (next: Saved) => {
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const setRival = (i: number, patch: Partial<Rival>) => {
    const rivals = s.rivals.map((r, n) => (n === i ? { ...r, ...patch } : r));
    save({ ...s, rivals });
  };

  const filled = useMemo(() => s.rivals.filter((r) => r.name.trim()).length, [s.rivals]);
  const silences = useMemo(
    () => s.rivals.filter((r) => r.neverSays.trim()).map((r) => r.neverSays.trim()),
    [s.rivals],
  );

  // The whole point of the exercise: what NONE of them say. If the same silence
  // appears more than once it is not an oversight in one person's content, it
  // is a hole in the market.
  const sharedSilence = silences.length >= 2;

  const positioningDraft = useMemo(() => {
    if (!s.gap.trim()) return null;
    const who = offer.who.trim() || "the person you help";
    return `Everyone in this lane talks about the same things. Nobody talks about ${s.gap.trim()}. That is what I help ${who} with.`;
  }, [s.gap, offer.who]);

  const copy = (t: string) =>
    navigator.clipboard.writeText(t).then(() => toast.success("Copied"), () => toast.error("Could not copy"));

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The Adjacent Three is part of the Foundation Kit.</h2>
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
          <p className="nx-label mt-4">Stage 2 · Positioning</p>
          <h1 className="mt-2">Find the thing nobody in your lane is saying.</h1>
          <p className="nx-body max-w-xl mt-3">
            Three people doing something adjacent to you. Not to copy them — to find the silence.
            The gap between what they all say and what none of them say is where your position lives.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-9 space-y-5">
        <div className="nx-card !p-5">
          <p className="nx-body">
            <strong>This one is deliberately manual.</strong> No tool can fetch what someone is
            avoiding — the silence is only visible to a person who knows the field. That is you.
            Twenty minutes of actually looking beats any report.
          </p>
        </div>

        {s.rivals.map((r, i) => (
          <div key={i} className="nx-card !p-5">
            <div className="flex items-center justify-between">
              <p className="nx-label">Person {i + 1}</p>
              {s.rivals.length > 3 && (
                <button
                  onClick={() => save({ ...s, rivals: s.rivals.filter((_, n) => n !== i) })}
                  className="text-[var(--text-subtle)] hover:text-[#B3352B]"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mt-3">
              <Field label="Who are they?" value={r.name} onChange={(v) => setRival(i, { name: v })} placeholder="A name, or how you'd describe them" />
              <Field label="Where do they show up?" value={r.where} onChange={(v) => setRival(i, { where: v })} placeholder="LinkedIn, a podcast, conferences" />
            </div>

            <Field
              label="What do they charge?"
              value={r.charges}
              onChange={(v) => setRival(i, { charges: v })}
              placeholder="A number if it's public. 'Unknown' is a finding too."
              hint="If nobody in your lane publishes a price, that itself is the gap."
            />
            <Field
              label="What do they talk about constantly?"
              value={r.says}
              onChange={(v) => setRival(i, { says: v })}
              placeholder="The two or three things they always come back to"
            />
            <Field
              label="What do they never talk about?"
              value={r.neverSays}
              onChange={(v) => setRival(i, { neverSays: v })}
              placeholder="The thing you'd expect an expert here to cover — and they don't"
              hint="This is the field that matters. Take your time on it."
              gold
            />
          </div>
        ))}

        <button
          onClick={() => save({ ...s, rivals: [...s.rivals, { ...BLANK }] })}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline"
        >
          <Plus className="size-4" /> Add another
        </button>

        {/* the finding */}
        <div className="nx-card !p-6">
          <p className="nx-label">The gap</p>
          <h2 className="text-2xl mt-1">What are all three of them avoiding?</h2>

          {filled === 0 ? (
            <p className="nx-body mt-3">Fill in at least one person above and this opens up.</p>
          ) : (
            <>
              {silences.length > 0 && (
                <div className="mt-4 rounded-lg bg-[var(--bg-surface)] p-4">
                  <span className="nx-label">Their silences</span>
                  <ul className="mt-2 space-y-1.5">
                    {silences.map((x, n) => (
                      <li key={n} className="text-sm text-[var(--text-body)]">— {x}</li>
                    ))}
                  </ul>
                  {sharedSilence && (
                    <p className="text-sm text-[var(--nx-gold-text)] font-bold mt-3">
                      More than one of them is avoiding the same ground. That is not an oversight.
                      That is the opening.
                    </p>
                  )}
                </div>
              )}

              <label className="block mt-4">
                <span className="text-sm font-bold text-[var(--text-body)]">
                  Say the gap in one line
                </span>
                <textarea
                  value={s.gap}
                  onChange={(e) => save({ ...s, gap: e.target.value })}
                  rows={2}
                  placeholder="e.g. what it actually costs, in rands, to get compliant"
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm outline-none focus:border-[var(--nx-gold)]"
                />
              </label>

              {positioningDraft && (
                <div className="mt-4 rounded-xl bg-[var(--obsidian)] p-5">
                  <span className="nx-label">A first draft of your position</span>
                  <p className="text-white text-[15px] mt-2 leading-relaxed">{positioningDraft}</p>
                  <button
                    onClick={() => copy(positioningDraft)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--nx-gold-bright)] hover:underline"
                  >
                    <Copy className="size-3.5" /> Copy
                  </button>
                  <p className="text-[#C8C2B4] text-xs mt-3 leading-relaxed">
                    Rough on purpose. Take it into the Offer Blueprint and sharpen it there — this is
                    the raw material, not the finished sentence.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
          <h2 className="text-white text-2xl">Now make it your sentence.</h2>
          <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg mx-auto">
            The gap tells you where to stand. The Blueprint turns it into something a stranger can
            repeat back to you.
          </p>
          <Link
            to="/apps/offer-blueprint"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-6 py-3 text-sm font-bold text-[#111111] hover:bg-[var(--nx-gold-deep)] transition-colors"
          >
            The Offer Blueprint <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </Shell>
  );
}

function Field({ label, value, onChange, placeholder, hint, gold }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; gold?: boolean;
}) {
  return (
    <label className="block mt-3">
      <span className={`text-sm font-bold ${gold ? "text-[var(--nx-gold-text)]" : "text-[var(--text-body)]"}`}>{label}</span>
      {hint && <span className="block text-xs text-[var(--text-subtle)]">{hint}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1.5 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--nx-gold)] ${
          gold ? "border-[var(--nx-gold)]/40" : "border-[var(--border)]"
        }`}
      />
    </label>
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
