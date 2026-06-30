import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { AiCoach } from "@/components/ai-coach";
import { Lock, ArrowRight, CalendarDays, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/4e-content-calendar")({
  head: () => ({ meta: [{ title: "4E Content Calendar — CHKPLT" }] }),
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

  const days = useMemo(() => {
    const W = who.trim() || "your people", T = topic.trim() || "your topic", P = pain.trim() || "where they're stuck", A = after.trim() || "where they want to be";
    const cycle: TypeKey[] = ["Educate", "Entertain", "Encourage"];
    let ci = 0; const counters: Record<TypeKey, number> = { Educate: 0, Entertain: 0, Encourage: 0, Earn: 0 };
    return Array.from({ length: 30 }, (_, idx) => {
      const day = idx + 1;
      const type: TypeKey = day % 10 === 0 ? "Earn" : cycle[ci++ % 3];
      const prompt = pick(BANK[type], counters[type]++, W, T, P, A);
      return { day, type, prompt };
    });
  }, [who, topic, pain, after]);

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Shell><Locked /></Shell>;

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-10 pb-8">
          <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to your Clarity System</a>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"><CalendarDays className="h-5 w-5" /></span>
            <p className="nx-label">Step 3 · 4E Content Calendar</p>
          </div>
          <h1 className="mt-3">30 days, planned. 9 Educate · 9 Entertain · 9 Encourage · 3 Earn.</h1>
          <p className="nx-body max-w-2xl mt-3">The 27 value posts earn the right for the 3 that sell. Fill the four boxes — your month builds itself.</p>
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

        <div className="rounded-2xl bg-[#0F172A] p-6 text-center mt-8">
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
