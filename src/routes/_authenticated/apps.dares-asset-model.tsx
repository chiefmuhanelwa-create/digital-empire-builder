import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { Lock, ArrowRight, Boxes } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/dares-asset-model")({
  head: () => ({ meta: [{ title: "DARES Asset Model — CHKPLT" }] }),
  component: DaresAssetModel,
});

const KEY = "nochill-dares-v1";
const DIMS = [
  { k: "d", letter: "D", name: "Digital", q: "Is it digital — no physical stock or shipping?", lift: "Make it digital: a PDF, course, template or app. Physical = caps and costs." },
  { k: "a", letter: "A", name: "Automated", q: "Does it sell & deliver without you in the loop?", lift: "Automate delivery: checkout → instant access. If you hand-deliver, it's a job." },
  { k: "r", letter: "R", name: "Recurring", q: "Can it earn every month (membership / letter)?", lift: "Add recurring: a paid letter or membership. One recurring product changes everything." },
  { k: "e", letter: "E", name: "Evergreen", q: "Will it still sell in 6 months without redoing it?", lift: "Make it evergreen: teach the durable principle, not a dated tactic." },
  { k: "s", letter: "S", name: "Scalable", q: "Can 1 or 1,000 buy it with no extra work from you?", lift: "Make it scalable: sell the same asset many times. 1:1 time doesn't scale." },
] as const;

const OPTS = [{ v: 0, label: "No" }, { v: 1, label: "Partly" }, { v: 2, label: "Yes" }];
type Vals = Record<string, number>;

function DaresAssetModel() {
  const { access, loading } = useKitAccess();
  const [idea, setIdea] = useState("");
  const [v, setV] = useState<Vals>({});
  useEffect(() => { try { const r = JSON.parse(localStorage.getItem(KEY) || "null"); if (r) { setIdea(r.idea || ""); setV(r.v || {}); } } catch { /* ignore */ } }, []);
  const persist = (idea: string, v: Vals) => { try { localStorage.setItem(KEY, JSON.stringify({ idea, v })); } catch { /* ignore */ } };
  const setScore = (k: string, val: number) => { const nv = { ...v, [k]: val }; setV(nv); persist(idea, nv); };

  const r = useMemo(() => {
    const score = DIMS.reduce((s, d) => s + (v[d.k] ?? 0), 0); // 0..10
    const weakest = [...DIMS].sort((a, b) => (v[a.k] ?? 0) - (v[b.k] ?? 0))[0];
    let title: string, tone: "danger" | "warn" | "good";
    if (score <= 4) { tone = "danger"; title = "That's a job, not an asset"; }
    else if (score <= 7) { tone = "warn"; title = "Good idea — sharpen it into an asset"; }
    else { tone = "good"; title = "This is a real asset — build it"; }
    return { score, weakest, title, tone };
  }, [v]);
  const toneColor = { danger: "var(--nx-orange-deep)", warn: "var(--nx-gold-deep)", good: "#15803D" }[r.tone];

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Shell><Locked /></Shell>;

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-8">
          <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to your Clarity System</a>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"><Boxes className="h-5 w-5" /></span>
            <p className="nx-label">Step 6 · DARES Asset Model</p>
          </div>
          <h1 className="mt-3">Build assets, not just posts.</h1>
          <p className="nx-body max-w-2xl mt-3">Digital · Automated · Recurring · Evergreen · Scalable. Score your idea — a true asset earns while you sleep.</p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <label className="block text-sm font-semibold mb-1">Your asset idea</label>
        <input value={idea} onChange={(e) => { setIdea(e.target.value); persist(e.target.value, v); }} placeholder="e.g. a R499 sleep-reset mini-course for nurses"
          className="w-full rounded-xl border border-[var(--input)] bg-white px-4 py-2.5 text-[15px] outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 mb-6" />

        <div className="space-y-3">
          {DIMS.map((d) => (
            <div key={d.k} className="nx-card !p-4 flex items-center gap-4">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)] font-display">{d.letter}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display text-base">{d.name}</div>
                <div className="text-xs text-[var(--text-dim)]">{d.q}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {OPTS.map((o) => (
                  <button key={o.v} onClick={() => setScore(d.k, o.v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${(v[d.k] ?? -1) === o.v ? "border-[var(--nx-gold)] bg-[var(--bg-card-hi)] text-[var(--nx-gold-text)]" : "border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-mid)]"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[#0F172A] p-6 text-center mt-8">
          <div className="font-display text-5xl" style={{ color: r.tone === "good" ? "#4ADE80" : "var(--nx-gold-bright)" }}>{r.score}<span className="text-slate-400 text-xl">/10</span></div>
          <h2 className="text-white text-2xl mt-2">{r.title}</h2>
          <p className="text-slate-300 mt-2 max-w-lg mx-auto">Lowest: <strong style={{ color: "var(--nx-gold-bright)" }}>{r.weakest.name}</strong> — {r.weakest.lift}</p>
        </div>

        <div className="nx-card !p-5 mt-5 text-center">
          <span className="nx-label">Your next action</span>
          <p className="text-sm text-[var(--text-body)] mt-2">Don't build five things. Pick <strong>ONE</strong> asset (the highest-scoring, closest-to-money idea), finish it, then add the next.</p>
          <Link to="/dashboard/foundation-kit" className="cta-glow inline-flex items-center gap-2 mt-4">Mark done → next step <ArrowRight className="size-4" /></Link>
        </div>
      </main>
    </Shell>
  );
}

function Locked() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <div className="nx-card !p-10 text-center">
        <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
        <h2 className="mt-4 text-2xl">This is Step 6 of the Clarity System.</h2>
        <p className="nx-body max-w-md mx-auto mt-2">Get the Foundation Kit to unlock the DARES Asset Model and the full 7-step system.</p>
        <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit — $97</a>
      </div>
    </main>
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
