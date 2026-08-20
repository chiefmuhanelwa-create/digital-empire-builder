import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { readOffer, EMPTY_OFFER, type Offer } from "@/lib/offer-spine";
import {
  CATEGORIES, ALL_HOOKS, isFounderStory, structureOf, personalise,
  AXES, EMPTY_SCORES, scoreHook, verdict, type Hook, type Scores,
} from "@/lib/hook-bank";
import { Lock, ArrowRight, Copy, Search, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/hook-bank")({
  head: () => ({ meta: [{ title: "The Hook Bank — Contentpreneur Africa" }] }),
  component: HookBank,
});

// TOOL · THE HOOK BANK
//
// 120 hooks across six categories, every one annotated against R x A x C x U^B.
// Ported from the founder's own content system, with one change that matters:
// the hooks built on his receipts are marked STRUCTURE ONLY. A buyer copying
// "I went from sleeping in university bathrooms to R600K" is borrowing proof,
// and this audience sells on being trustworthy. They get the shape instead.

function HookBank() {
  const { access } = useKitAccess();
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [scores, setScores] = useState<Scores>(EMPTY_SCORES);

  useEffect(() => setOffer(readOffer()), []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list: { hook: Hook; category: string }[] = [];
    for (const c of CATEGORIES) {
      if (cat != null && c.id !== cat) continue;
      for (const h of c.hooks) list.push({ hook: h, category: c.category });
    }
    if (needle) {
      list = list.filter(
        (r) =>
          r.hook.hook.toLowerCase().includes(needle) ||
          Object.values(r.hook.r_a_c_u_b).some((v) => String(v).toLowerCase().includes(needle)),
      );
    }
    return list;
  }, [q, cat]);

  const score = useMemo(() => scoreHook(scores), [scores]);
  const v = useMemo(() => verdict(score), [score]);

  const copy = (t: string) =>
    navigator.clipboard.writeText(t).then(
      () => toast.success("Copied"),
      () => toast.error("Could not copy"),
    );

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The Hook Bank is part of the Foundation Kit.</h2>
            <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-10 pb-7">
          <Link to="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">
            ← Your Clarity System
          </Link>
          <p className="nx-label mt-4">Tool · 120 hooks, scored</p>
          <h1 className="mt-2">You are not short of ideas. You are short of first lines.</h1>
          <p className="nx-body max-w-2xl mt-3">
            Six categories, twenty hooks each, every one broken down on the five axes that decide
            whether a thumb stops. Steal the structure. Never steal the receipts.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-9 space-y-5">
        {/* search + filter */}
        <div className="nx-card !p-4">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2">
            <Search className="size-4 text-[var(--text-dim)] shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hooks — a word, a feeling, a situation"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setCat(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${
                cat == null
                  ? "bg-[var(--obsidian)] text-white border-transparent"
                  : "border-[var(--border)] text-[var(--text-dim)] hover:text-foreground"
              }`}
            >
              All 120
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id === cat ? null : c.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${
                  cat === c.id
                    ? "bg-[var(--obsidian)] text-white border-transparent"
                    : "border-[var(--border)] text-[var(--text-dim)] hover:text-foreground"
                }`}
              >
                {c.category.replace(/ Hooks$/, "")} <span className="opacity-60">{c.count}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--text-subtle)] mt-3">
            {results.length} of {ALL_HOOKS.length} shown
          </p>
        </div>

        {!offer.who.trim() && (
          <div className="nx-card !p-5">
            <p className="nx-body">
              Finish the Offer Blueprint and the reusable hooks below will rewrite themselves around
              the person you actually help, instead of saying “creators”.
            </p>
            <Link to="/apps/offer-blueprint" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
              The Offer Blueprint <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        {/* the bank */}
        <div className="space-y-3">
          {results.map(({ hook, category }) => {
            const founder = isFounderStory(hook);
            const mine = founder ? null : personalise(hook, offer);
            const isOpen = open === hook.id;
            return (
              <div key={`${category}-${hook.id}`} className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : hook.id)}
                  className="w-full text-left p-5 hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <span className="nx-label block">{category.replace(/ Hooks$/, "")}</span>
                  <span className="block mt-1 text-[17px] leading-snug text-[var(--text-body)]">
                    “{hook.hook}”
                  </span>
                  {founder && (
                    <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold uppercase tracking-wider text-[#9A3412]">
                      <AlertTriangle className="size-3" /> Structure only
                    </span>
                  )}
                  {mine && (
                    <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold uppercase tracking-wider text-[var(--nx-gold-text)]">
                      <Sparkles className="size-3" /> Rewritten for you below
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--border)] p-5 space-y-4">
                    {founder ? (
                      <div className="rounded-lg border-2 border-[#EA580C] bg-[#EA580C]/5 p-4">
                        <p className="text-sm font-bold text-[#9A3412]">
                          This one runs on his receipts. Do not copy it.
                        </p>
                        <p className="text-sm text-[#7C2D12] mt-2 leading-relaxed">
                          Borrowed proof is the one mistake this audience cannot survive — your whole
                          asset is that people believe you. Take the shape and put your own facts in it.
                        </p>
                        <p className="text-sm text-[#7C2D12] mt-3">
                          <strong>The shape:</strong> {structureOf(hook)}
                        </p>
                      </div>
                    ) : mine ? (
                      <div className="rounded-lg bg-[var(--bg-surface)] border-l-4 border-[var(--nx-gold)] px-4 py-3">
                        <span className="nx-label">Yours</span>
                        <p className="text-[16px] mt-1 text-[var(--text-body)]">“{mine}”</p>
                        <button
                          onClick={() => copy(mine)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--nx-gold-text)] hover:underline"
                        >
                          <Copy className="size-3.5" /> Copy this
                        </button>
                      </div>
                    ) : null}

                    <div>
                      <span className="nx-label">Why it works</span>
                      <dl className="mt-2 space-y-1.5">
                        {AXES.map((a) => (
                          <div key={a.key} className="flex gap-3 text-sm">
                            <dt className="w-5 shrink-0 font-mono font-bold text-[var(--nx-gold-text)]">{a.letter}</dt>
                            <dd className="text-[var(--text-dim)]">{hook.r_a_c_u_b[a.key]}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <button
                      onClick={() => copy(hook.hook)}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text-dim)] hover:text-foreground"
                    >
                      <Copy className="size-4" /> Copy the original
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {results.length === 0 && (
            <div className="nx-card !p-8 text-center">
              <p className="nx-body">Nothing matches that. Try a feeling rather than a keyword — “ignored”, “stuck”, “overlooked”.</p>
            </div>
          )}
        </div>

        {/* scorer */}
        <div className="nx-card !p-6">
          <p className="nx-label">Score your own</p>
          <h2 className="text-2xl mt-1">R × A × C × U<sup>B</sup></h2>
          <p className="nx-body mt-2">
            The bank gives you the axes. It will not give you the numbers — judging a hook is the
            skill, and a tool that scores it for you leaves you unable to do it without the tool.
          </p>

          <div className="mt-5 space-y-4">
            {AXES.map((a) => (
              <div key={a.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <label className="text-sm font-bold text-[var(--text-body)]">
                    <span className="font-mono text-[var(--nx-gold-text)]">{a.letter}</span> · {a.label}
                    <span className="block text-xs font-normal text-[var(--text-subtle)]">{a.q}</span>
                  </label>
                  <span className="font-mono text-sm tabular-nums">{scores[a.key]}</span>
                </div>
                <input
                  type="range" min={1} max={5} step={1}
                  value={scores[a.key]}
                  onChange={(e) => setScores({ ...scores, [a.key]: Number(e.target.value) })}
                  className="w-full mt-1.5 accent-[var(--nx-gold)]"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-[var(--obsidian)] p-5">
            <p className="font-mono text-xs text-[#C8C2B4]">
              {scores.relevant} × {scores.awareness} × {scores.clarity} × {scores.unique}
              <sup>{scores.broadened}</sup>
            </p>
            <p className="font-display text-3xl text-white mt-1 tabular-nums">{Math.round(score)}</p>
            <p className="text-[var(--nx-gold-bright)] font-bold text-sm mt-2">{v.band}</p>
            <p className="text-[#C8C2B4] text-sm mt-1 leading-relaxed">{v.note}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
          <h2 className="text-white text-2xl">A hook with nothing behind it is a trick.</h2>
          <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg mx-auto">
            Give the whole lesson away underneath it. That is what earns the next one.
          </p>
          <Link
            to="/apps/4e-content-calendar"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-6 py-3 text-sm font-bold text-[#111111] hover:bg-[var(--nx-gold-deep)] transition-colors"
          >
            Put it in the calendar <ArrowRight className="size-4" />
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
