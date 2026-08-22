import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { AiCoach } from "@/components/ai-coach";
import { Lock, ArrowRight, CalendarDays, RefreshCw } from "lucide-react";
import { ToolHeader, ToolFooter } from "@/components/tool-frame";

export const Route = createFileRoute("/_authenticated/apps/4e-content-calendar")({
  head: () => ({ meta: [{ title: "4E Content Calendar — Contentpreneur Africa" }] }),
  component: FourECalendar,
});

const KEY = "nochill-4e-v1";

type TypeKey = "Educate" | "Entertain" | "Encourage" | "Earn";
const TONE: Record<TypeKey, string> = {
  Educate: "#2563EB", Entertain: "#9333EA", Encourage: "#15803D", Earn: "var(--nx-gold-deep)",
};

// Prompt banks. {who}/{topic}/{pain}/{after} get filled from the two inputs.
const BANK: Record<TypeKey, string[]> = {
  Educate: [
    "The #1 mistake {who} make about {topic}",
    "3 steps to fix {pain}",
    "What nobody tells you about {topic}",
    "A simple framework for {topic}",
    "{topic}: the 80/20 — what actually matters",
    "How to know if your {topic} is working",
    "5 myths about {topic} — busted",
    "The fastest way for {who} to start with {topic}",
    "A checklist for {topic}",
  ],
  Entertain: [
    "A real day in my life working on {topic}",
    "The worst advice I ever got about {topic}",
    "Behind the scenes: how I handle {pain}",
    "Things {who} say vs what they mean",
    "My biggest fail with {topic} (and the lesson)",
    "Myth vs reality in {topic}",
    "Rating common {topic} 'hacks' 1–10",
    "The moment I realised {pain} was fixable",
    "If {topic} was a person, they'd be…",
  ],
  Encourage: [
    "If you're stuck at {pain}, read this",
    "You're not behind. Here's proof it changes.",
    "The day I almost quit {topic} — and didn't",
    "One small win beats a perfect plan",
    "Permission to start before you feel ready",
    "{who}: your knowledge is already worth paying for",
    "Consistency over intensity — why it wins",
    "From {pain} to {after}: it's a process, not a leap",
    "Your future self is built on today's reps",
  ],
  Earn: [
    "How I help {who} go from {pain} to {after} — here's how to work with me",
    "Doors are open: the offer that takes {who} to {after}",
    "Tired of {pain}? This is the shortcut — limited spots",
  ],
};

function pick(bank: string[], i: number, who: string, topic: string, pain: string, after: string) {
  return bank[i % bank.length]
    .replaceAll("{who}", who).replaceAll("{topic}", topic)
    .replaceAll("{pain}", pain).replaceAll("{after}", after);
}

function FourECalendar() {
  const { access, loading } = useKitAccess();
  const [who, setWho] = useState("");
  const [topic, setTopic] = useState("");
  const [pain, setPain] = useState("");
  const [after, setAfter] = useState("");

  useEffect(() => {
    try { const r = JSON.parse(localStorage.getItem(KEY) || "null"); if (r) { setWho(r.who || ""); setTopic(r.topic || ""); setPain(r.pain || ""); setAfter(r.after || ""); } } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ who, topic, pain, after })); } catch { /* ignore */ }
  }, [who, topic, pain, after]);

  // THE GENERATOR USED TO BREAK ITS OWN FRAMEWORK.
  //
  // It rotated Educate/Entertain/Encourage evenly with an Earn every tenth day,
  // producing 30/30/30/10 — while 4E Evolution specifies 35/30/20/15. So the
  // tool taught one ratio and handed out a calendar built on another, and
  // over-weighted Encourage while under-weighting the only category that asks
  // for money.
  //
  // Now it builds to the real ratio, and spreads each type with a largest-
  // remainder walk so the Earn days land evenly instead of clumping.
  const MIX: Record<TypeKey, number> = { Educate: 35, Entertain: 30, Encourage: 20, Earn: 15 };

  const days = useMemo(() => {
    const W = who.trim() || "your people", T = topic.trim() || "your topic", P = pain.trim() || "where they're stuck", A = after.trim() || "where they want to be";
    const N = 30;

    // Target counts, largest-remainder rounded so they sum to exactly 30.
    const exact = (Object.keys(MIX) as TypeKey[]).map((k) => ({ k, raw: (MIX[k] / 100) * N }));
    const counts: Record<TypeKey, number> = { Educate: 0, Entertain: 0, Encourage: 0, Earn: 0 };
    let assigned = 0;
    exact.forEach((e) => { counts[e.k] = Math.floor(e.raw); assigned += counts[e.k]; });
    exact.sort((a, b) => (b.raw % 1) - (a.raw % 1)).forEach((e) => {
      if (assigned < N) { counts[e.k]++; assigned++; }
    });

    // Spread by smallest running ratio — keeps each type evenly distributed
    // across the month rather than bunched at the end.
    const remaining = { ...counts };
    const placed: Record<TypeKey, number> = { Educate: 0, Entertain: 0, Encourage: 0, Earn: 0 };
    const order: TypeKey[] = [];
    for (let i = 0; i < N; i++) {
      let best: TypeKey | null = null, bestScore = Infinity;
      (Object.keys(remaining) as TypeKey[]).forEach((k) => {
        if (remaining[k] <= 0) return;
        const score = (placed[k] + 0.5) / (counts[k] || 1);
        if (score < bestScore) { bestScore = score; best = k; }
      });
      const chosen = (best ?? "Educate") as TypeKey;
      order.push(chosen); remaining[chosen]--; placed[chosen]++;
    }

    const used: Record<TypeKey, number> = { Educate: 0, Entertain: 0, Encourage: 0, Earn: 0 };
    return order.map((type, idx) => ({
      day: idx + 1,
      type,
      prompt: pick(BANK[type], used[type]++, W, T, P, A),
    }));
  }, [who, topic, pain, after]);

  // What the month actually is, against what 4E says it should be.
  const mixCheck = useMemo(() => {
    const total = days.length || 1;
    return (Object.keys(MIX) as TypeKey[]).map((k) => {
      const n = days.filter((d) => d.type === k).length;
      const pct = Math.round((n / total) * 100);
      return { type: k, n, pct, target: MIX[k], drift: pct - MIX[k] };
    });
  }, [days]);

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Shell><Locked /></Shell>;

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-10 pb-8">
          <ToolHeader slug="4e-content-calendar" why={"A professional with a job cannot publish by inspiration. This builds thirty dated slots from the offer you just made, so the work exists whether or not you feel like it."} />
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"><CalendarDays className="h-5 w-5" /></span>
            <p className="nx-label">Step 3 · 4E Content Calendar</p>
          </div>
          <h1 className="mt-3">30 days, planned. 11 Educate · 9 Entertain · 6 Encourage · 4 Earn.</h1>
          <p className="nx-body max-w-2xl mt-3">The 26 value posts earn the right for the 4 that sell. That split is 4E Evolution exactly &mdash; 35/30/20/15 &mdash; not an even rotation. Fill the four boxes and your month builds itself.</p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[["Who you serve", who, setWho, "e.g. overworked nurses"],
            ["Your topic", topic, setTopic, "e.g. natural sleep recovery"],
            ["Their pain (before)", pain, setPain, "e.g. exhausted every shift"],
            ["The outcome (after)", after, setAfter, "e.g. energy that lasts"]].map(([label, val, setter, ph]: any) => (
            <div key={label}>
              <label className="block text-sm font-semibold mb-1">{label}</label>
              <input value={val} onChange={(e) => setter(e.target.value)} placeholder={ph}
                className="w-full rounded-xl border border-[var(--input)] bg-white px-4 py-2.5 text-[15px] outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl">Your 30-day plan</h2>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)] hover:text-foreground">
            <RefreshCw className="size-4" /> Print / save
          </button>
        </div>

        {/* The month against the framework it claims to follow. */}
        <div className="nx-card !p-5 mb-4">
          <p className="nx-label">Your month, against 4E</p>
          <div className="space-y-2.5 mt-3">
            {mixCheck.map((m) => (
              <div key={m.type} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-bold" style={{ color: TONE[m.type] }}>{m.type}</span>
                <span className="flex-1 h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden relative">
                  <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${m.pct}%`, background: TONE[m.type] }} />
                  <span className="absolute inset-y-[-3px] w-px bg-[var(--text-subtle)]" style={{ left: `${m.target}%` }} title={`4E target ${m.target}%`} />
                </span>
                <span className="w-20 shrink-0 text-right font-mono text-xs tabular-nums text-[var(--text-dim)]">
                  {m.n} · {m.pct}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-subtle)] mt-3 leading-relaxed">
            The thin line on each bar is the 4E target — Educate 35, Entertain 30, Encourage 20,
            Earn 15. Earn is the one people cut first and the only one that asks for money; three
            Earn days in thirty is why a month of good content produces nothing.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((d) => (
            <div key={d.day} className="rounded-xl border border-[var(--border)] bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm">Day {d.day}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ color: TONE[d.type], background: "var(--bg-card-hi)" }}>{d.type}</span>
              </div>
              <p className="text-sm text-[var(--text-body)] mt-1.5 leading-snug">{d.prompt}</p>
            </div>
          ))}
        </div>

        <AiCoach tool="4e-content-calendar" getPayload={() => JSON.stringify({ who, topic, pain, after })} />

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 text-center mt-8">
          <p className="nx-label !text-[var(--nx-gold-bright)]">Your next action</p>
          <p className="text-white text-lg mt-1">Don't plan all 30 — film and post <strong>Day 1 today</strong>. Momentum first, perfection never.</p>
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
        <h2 className="mt-4 text-2xl">This is Step 3 of the Clarity System.</h2>
        <p className="nx-body max-w-md mx-auto mt-2">Get the Foundation Kit to unlock the 4E Content Calendar and the full 7-step system.</p>
        <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
      </div>
      <ToolFooter slug="4e-content-calendar" youNowHave="a month of content, with Day 7 already naming your offer." />
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
