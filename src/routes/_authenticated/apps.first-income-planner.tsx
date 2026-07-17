import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { Lock, ArrowRight, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/first-income-planner")({
  head: () => ({ meta: [{ title: "90-Day First Income Planner — CHKPLT" }] }),
  component: FirstIncomePlanner,
});

const KEY = "nochill-90day-v1";
const PHASES = [
  { k: "p1", days: "Days 1–30", name: "Build", goal: "Pick ONE offer, make it, set up a way to get paid.", milestone: "Offer exists + checkout live" },
  { k: "p2", days: "Days 31–60", name: "Launch", goal: "Tell people daily; make the offer 3× a week.", milestone: "First sale" },
  { k: "p3", days: "Days 61–90", name: "Scale", goal: "Double down on what sold; add one income stream.", milestone: "Repeatable R-amount/week" },
] as const;

type Data = { target: string; why: string; phases: Record<string, string>; done: Record<string, boolean> };
const EMPTY: Data = { target: "", why: "", phases: {}, done: {} };

function FirstIncomePlanner() {
  const { access, loading } = useKitAccess();
  const [d, setD] = useState<Data>(EMPTY);
  useEffect(() => { try { const r = JSON.parse(localStorage.getItem(KEY) || "null"); if (r) setD({ ...EMPTY, ...r }); } catch { /* ignore */ } }, []);
  const save = (nd: Data) => { setD(nd); try { localStorage.setItem(KEY, JSON.stringify(nd)); } catch { /* ignore */ } };

  const doneCount = useMemo(() => PHASES.filter((p) => d.done[p.k]).length, [d.done]);

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Shell><Locked /></Shell>;

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-8">
          <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to your Clarity System</a>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"><Target className="h-5 w-5" /></span>
            <p className="nx-label">Bonus · 90-Day First Income Planner</p>
          </div>
          <h1 className="mt-3">90 days to your first online income.</h1>
          <p className="nx-body max-w-2xl mt-3">Ninety days is the most honest unit of time a creator has. One quarter, run with a plan, beats two years of posting on vibes. Build → Launch → Scale.</p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <label className="block text-sm font-semibold mb-1">Your 90-day income target (be specific)</label>
        <input value={d.target} onChange={(e) => save({ ...d, target: e.target.value })} placeholder="e.g. R10,000 from a R499 mini-course"
          className="w-full rounded-xl border border-[var(--input)] bg-white px-4 py-2.5 text-[15px] outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 mb-4" />
        <label className="block text-sm font-semibold mb-1">Why it matters (your fuel)</label>
        <textarea value={d.why} onChange={(e) => save({ ...d, why: e.target.value })} rows={2} placeholder="The reason you'll show up on the hard days"
          className="w-full rounded-xl border border-[var(--input)] bg-white px-4 py-2.5 text-[15px] outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 mb-8 resize-none" />

        <div className="space-y-4">
          {PHASES.map((p, i) => {
            const done = !!d.done[p.k];
            return (
              <div key={p.k} className="nx-card !p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full font-display ${done ? "bg-[#15803D] text-white" : "bg-[#0F172A] text-[var(--nx-gold-bright)]"}`}>{i + 1}</span>
                    <div>
                      <div className="font-display text-lg">{p.name}</div>
                      <div className="text-xs text-[var(--text-dim)]">{p.days} · milestone: {p.milestone}</div>
                    </div>
                  </div>
                  <button onClick={() => save({ ...d, done: { ...d.done, [p.k]: !done } })}
                    className={`text-xs font-semibold rounded-full px-3 py-1 ${done ? "bg-[var(--bg-card-hi)] text-[#15803D]" : "border border-[var(--border-mid)] text-[var(--text-dim)]"}`}>{done ? "Hit ✓" : "Mark hit"}</button>
                </div>
                <p className="text-sm text-[var(--text-body)] mt-2">{p.goal}</p>
                <textarea value={d.phases[p.k] || ""} onChange={(e) => save({ ...d, phases: { ...d.phases, [p.k]: e.target.value } })} rows={2}
                  placeholder="Your concrete plan for this phase" className="w-full mt-2 rounded-xl border border-[var(--input)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 resize-none" />
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-[#0F172A] p-6 text-center mt-8">
          <p className="nx-label !text-[var(--nx-gold-bright)]">Your next action · {doneCount}/3 phases</p>
          <p className="text-white text-lg mt-1">Pick your Day 1 — an actual date, this week. The 90 days start when you say they do.</p>
          <Link to="/dashboard/foundation-kit" className="cta-glow inline-flex items-center gap-2 mt-4">Back to your Clarity System <ArrowRight className="size-4" /></Link>
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
        <h2 className="mt-4 text-2xl">This bonus is in the Foundation Kit.</h2>
        <p className="nx-body max-w-md mx-auto mt-2">Get the kit to unlock the 90-Day First Income Planner and the full Clarity System.</p>
        <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit</a>
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
