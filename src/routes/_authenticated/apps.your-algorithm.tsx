import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { Lock, ArrowRight, Plus, Trash2, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/your-algorithm")({
  head: () => ({ meta: [{ title: "Your Algorithm — Contentpreneur Africa" }] }),
  component: YourAlgorithm,
});

// STAGE 4 · PROFILE — rebuilt from the content system's "My Algorithm".
//
// WHY IT COULD NOT BE PORTED
// ==========================
// The original was a static page of the founder's own conclusions about his own
// account. Useful to him, useless and slightly misleading to anyone else: what
// works on a 780k meme page has almost nothing to teach a governance consultant
// posting to 400 people on LinkedIn.
//
// This version has no opinions of its own. The buyer logs what they actually
// published and what actually happened, and the tool reports which of THEIR
// choices correlate with THEIR best posts. It refuses to say anything at all
// until there is enough data to mean something — which is the honest behaviour
// the original lacked, and the reason most creators chase the wrong lesson.

const KEY = "nochill-your-algorithm-v1";
const MIN_POSTS = 9; // three per bucket. Below this, ranking is noise.

const PLATFORMS = ["LinkedIn", "YouTube", "Instagram", "TikTok", "Facebook", "Email"] as const;
const FORMATS = ["Talking head", "Carousel", "Text only", "Long-form video", "Story", "Photo"] as const;
const ANGLES = ["Teaching", "Story", "Contrarian", "Behind the scenes", "Proof / result", "Ask / question"] as const;

interface Post {
  id: string;
  title: string;
  platform: string;
  format: string;
  angle: string;
  views: number | null;
  engagements: number | null; // comments + saves + shares
  leads: number | null;       // replies, DMs, sign-ups — the only one that pays
}

interface Saved { posts: Post[] }
const DEFAULTS: Saved = { posts: [] };

const blank = (): Post => ({
  id: Math.random().toString(36).slice(2, 9),
  title: "", platform: "LinkedIn", format: "Talking head", angle: "Teaching",
  views: null, engagements: null, leads: null,
});

/** Leads first, then engagement, then views. Reach that produces nothing is not a win. */
function scoreOf(p: Post): number {
  const v = p.views ?? 0;
  const e = p.engagements ?? 0;
  const l = p.leads ?? 0;
  const engRate = v > 0 ? (e / v) * 100 : 0;
  return l * 100 + engRate * 10 + (v > 0 ? Math.log10(v) : 0);
}

function YourAlgorithm() {
  const { access } = useKitAccess();
  const [s, setS] = useState<Saved>(DEFAULTS);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r?.posts) setS({ posts: r.posts });
    } catch { /* ignore */ }
  }, []);

  const save = (next: Saved) => {
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const scored = useMemo(
    () => s.posts.filter((p) => p.title.trim()).map((p) => ({ p, score: scoreOf(p) })).sort((a, b) => b.score - a.score),
    [s.posts],
  );

  const findings = useMemo(() => {
    if (scored.length < MIN_POSTS) return null;
    const third = Math.max(3, Math.floor(scored.length / 3));
    const top = scored.slice(0, third).map((x) => x.p);
    const bottom = scored.slice(-third).map((x) => x.p);

    const dims: { label: string; get: (p: Post) => string }[] = [
      { label: "Platform", get: (p) => p.platform },
      { label: "Format", get: (p) => p.format },
      { label: "Angle", get: (p) => p.angle },
    ];

    const out: { dim: string; value: string; topN: number; bottomN: number; verdict: string }[] = [];
    for (const d of dims) {
      const values = Array.from(new Set(scored.map((x) => d.get(x.p))));
      for (const v of values) {
        const t = top.filter((p) => d.get(p) === v).length;
        const b = bottom.filter((p) => d.get(p) === v).length;
        if (t + b < 2) continue; // too rare to say anything about
        if (t >= b + 2) out.push({ dim: d.label, value: v, topN: t, bottomN: b, verdict: "works" });
        else if (b >= t + 2) out.push({ dim: d.label, value: v, topN: t, bottomN: b, verdict: "drags" });
      }
    }
    return { top, bottom, out, third };
  }, [scored]);

  const totals = useMemo(() => {
    const withLeads = s.posts.filter((p) => (p.leads ?? 0) > 0).length;
    const totalViews = s.posts.reduce((a, p) => a + (p.views ?? 0), 0);
    const totalLeads = s.posts.reduce((a, p) => a + (p.leads ?? 0), 0);
    return { withLeads, totalViews, totalLeads };
  }, [s.posts]);

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">Your Algorithm is part of the Foundation Kit.</h2>
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
          <p className="nx-label mt-4">Stage 4 · Profile</p>
          <h1 className="mt-2">Stop reading advice about somebody else's account.</h1>
          <p className="nx-body max-w-2xl mt-3">
            What works on a meme page with a million followers has nothing to teach your account.
            Log what you actually posted and what actually came back. After nine posts this will tell
            you which of <em>your</em> choices are working — and it will say nothing before then.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-9 space-y-5">
        {/* the honest gate */}
        {scored.length < MIN_POSTS && (
          <div className="nx-card !p-5">
            <p className="nx-label">Not enough yet</p>
            <p className="nx-body mt-1">
              <strong>{scored.length} of {MIN_POSTS} posts logged.</strong> Below nine, ranking your
              own content is reading noise — one post going well tells you nothing repeatable, and
              acting on it sends you in the wrong direction for a month.
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-[var(--bg-surface)] overflow-hidden">
              <div
                className="h-full bg-[var(--nx-gold)] transition-all"
                style={{ width: `${Math.min(100, (scored.length / MIN_POSTS) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* findings */}
        {findings && (
          <div className="nx-card !p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-[var(--nx-gold-text)]" />
              <p className="nx-label">Your patterns</p>
            </div>
            <p className="nx-body mt-2">
              Comparing your top {findings.third} posts against your bottom {findings.third}.
            </p>

            {findings.out.length === 0 ? (
              <p className="nx-body mt-4">
                No clear pattern yet. Your choices are spread too evenly, or the results are too
                close. Keep logging — and try varying one thing deliberately rather than everything
                at once.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {findings.out.map((f, i) => (
                  <li
                    key={i}
                    className={`rounded-lg border-l-4 px-4 py-3 ${
                      f.verdict === "works"
                        ? "border-[#2A6B4C] bg-[#2A6B4C]/5"
                        : "border-[#B4650F] bg-[#B4650F]/5"
                    }`}
                  >
                    <span className="block text-sm font-bold text-[var(--text-body)]">
                      {f.dim}: {f.value} — {f.verdict === "works" ? "this is working" : "this is dragging"}
                    </span>
                    <span className="block text-xs text-[var(--text-dim)] mt-0.5">
                      {f.topN} of your best {findings.third}, {f.bottomN} of your worst.
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {totals.totalLeads === 0 && totals.totalViews > 0 && (
              <div className="mt-5 rounded-lg border-2 border-[#EA580C] bg-[#EA580C]/5 p-4">
                <p className="text-sm font-bold text-[#9A3412]">
                  {totals.totalViews.toLocaleString("en-ZA")} views. Zero leads.
                </p>
                <p className="text-sm text-[#7C2D12] mt-1.5 leading-relaxed">
                  This is the most expensive pattern there is, and it is almost never a content
                  problem. Attention is arriving and finding no way to act. Put one ask on every
                  piece and one real destination behind your link.
                </p>
                <Link to="/apps/lead-magnet" className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-[#9A3412] hover:underline">
                  Build the thing they opt in for <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* log */}
        <div className="nx-card !p-5">
          <div className="flex items-center justify-between">
            <p className="nx-label">The log</p>
            <button
              onClick={() => save({ posts: [...s.posts, blank()] })}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline"
            >
              <Plus className="size-4" /> Add a post
            </button>
          </div>

          {s.posts.length === 0 && (
            <p className="nx-body mt-3">
              Start with the last nine things you published. Guess the numbers if you have to —
              roughly right beats not logged.
            </p>
          )}

          <div className="mt-4 space-y-3">
            {s.posts.map((p, i) => (
              <div key={p.id} className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-start gap-3">
                  <input
                    value={p.title}
                    onChange={(e) => save({ posts: s.posts.map((x, n) => (n === i ? { ...x, title: e.target.value } : x)) })}
                    placeholder="What was it about?"
                    className="flex-1 bg-transparent text-sm font-semibold outline-none border-b border-transparent focus:border-[var(--nx-gold)] pb-1"
                  />
                  <button
                    onClick={() => save({ posts: s.posts.filter((_, n) => n !== i) })}
                    className="text-[var(--text-subtle)] hover:text-[#B3352B] shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                  <Select label="Platform" value={p.platform} options={PLATFORMS} onChange={(v) => save({ posts: s.posts.map((x, n) => (n === i ? { ...x, platform: v } : x)) })} />
                  <Select label="Format" value={p.format} options={FORMATS} onChange={(v) => save({ posts: s.posts.map((x, n) => (n === i ? { ...x, format: v } : x)) })} />
                  <Select label="Angle" value={p.angle} options={ANGLES} onChange={(v) => save({ posts: s.posts.map((x, n) => (n === i ? { ...x, angle: v } : x)) })} />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Num label="Views" value={p.views} onChange={(v) => save({ posts: s.posts.map((x, n) => (n === i ? { ...x, views: v } : x)) })} />
                  <Num label="Comments + saves" value={p.engagements} onChange={(v) => save({ posts: s.posts.map((x, n) => (n === i ? { ...x, engagements: v } : x)) })} />
                  <Num label="Leads / replies" value={p.leads} onChange={(v) => save({ posts: s.posts.map((x, n) => (n === i ? { ...x, leads: v } : x)) })} gold />
                </div>
              </div>
            ))}
          </div>

          {s.posts.length > 0 && (
            <p className="text-xs text-[var(--text-subtle)] mt-4">
              Leads is the column that decides the ranking. Views are the cheapest number on this
              page and the easiest to mistake for progress.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
          <h2 className="text-white text-2xl">One primary platform. Written down, with the reason.</h2>
          <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg mx-auto">
            Once the pattern is clear, choose. A choice without a written reason gets reversed within
            a week of the first quiet post.
          </p>
        </div>
      </main>
    </Shell>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: readonly string[]; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-[var(--text-subtle)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--nx-gold)]"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Num({ label, value, onChange, gold }: {
  label: string; value: number | null; onChange: (v: number | null) => void; gold?: boolean;
}) {
  return (
    <label className="block">
      <span className={`block text-[11px] uppercase tracking-wider ${gold ? "text-[var(--nx-gold-text)]" : "text-[var(--text-subtle)]"}`}>{label}</span>
      <input
        type="number" min={0} inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
        className={`mt-1 w-full rounded-md border bg-transparent px-2 py-1.5 text-sm tabular-nums outline-none focus:border-[var(--nx-gold)] ${
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
