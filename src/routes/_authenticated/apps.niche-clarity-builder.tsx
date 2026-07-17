import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { AiCoach } from "@/components/ai-coach";
import { Lock, Copy, Check, Target, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/niche-clarity-builder")({
  head: () => ({ meta: [{ title: "Niche Clarity Builder — CHKPLT" }] }),
  component: NicheClarityBuilder,
});

const KEY = "nochill-niche-v1";
const VAGUE = ["everyone","anyone","people","everybody","stuff","things","better","success","successful","more","good","great","happy","life","business","world"];

type Fields = { who: string; before: string; after: string; edge: string };
const EMPTY: Fields = { who: "", before: "", after: "", edge: "" };

function hasVague(s: string) {
  const t = (s || "").toLowerCase();
  return VAGUE.some((w) => new RegExp("\\b" + w + "\\b").test(t));
}

const FIELD_META: { key: keyof Fields; label: string; hint: string; ph: string }[] = [
  { key: "who", label: "WHO · the one person you serve", hint: "Not “everyone.” The narrower, the stronger. Name them like you'd name a friend.", ph: "who you serve" },
  { key: "before", label: "FROM · where they're stuck now", hint: "The painful before-state, in their words.", ph: "their stuck point" },
  { key: "after", label: "TO · the outcome you get them", hint: "The after-state. Make it specific and desirable.", ph: "the outcome" },
  { key: "edge", label: "USING · your unfair advantage", hint: "The expertise or lived experience only you bring. This is what you're not being paid what it's worth for.", ph: "your edge" },
];

function NicheClarityBuilder() {
  const { access, loading } = useKitAccess();
  const [f, setF] = useState<Fields>(EMPTY);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r && typeof r === "object") setF({ ...EMPTY, ...r });
    } catch { /* ignore */ }
  }, []);

  const set = (k: keyof Fields, v: string) => {
    const next = { ...f, [k]: v };
    setF(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const calc = useMemo(() => {
    const filled = (Object.keys(EMPTY) as (keyof Fields)[]).filter((k) => f[k].trim());
    const vagueFields = filled.filter((k) => hasVague(f[k]));
    let score = Math.round((filled.length / 4) * 100) - vagueFields.length * 15;
    score = Math.max(0, Math.min(100, score));

    let verdict: string, coach = "", tone: "muted" | "danger" | "warn" | "good" = "good";
    if (filled.length === 0) { tone = "muted"; verdict = "Empty"; coach = "Start with WHO. Everything else sharpens around the person you choose to serve."; }
    else if (score < 50) { tone = "danger"; verdict = "Still too broad"; }
    else if (score < 80) { tone = "warn"; verdict = "Getting sharp"; }
    else { tone = "good"; verdict = "Knife-sharp"; }

    if (filled.length > 0 && score < 80) {
      const names: Record<string, string> = { who: "WHO", before: "FROM", after: "TO", edge: "USING" };
      if (vagueFields.length) coach = "Vague words are blunting your edge in " + vagueFields.map((k) => names[k]).join(", ") + ". Words like “people”, “better”, “success” could describe anyone. Get specific — name the exact person and the exact outcome.";
      else if (filled.length < 4) coach = "Fill the remaining " + (4 - filled.length) + " box" + (4 - filled.length > 1 ? "es" : "") + ". A niche needs all four: who, from, to, and your edge.";
      else coach = "Almost there — tighten the wording until a stranger could repeat your lane back to you in one breath.";
    } else if (score >= 80) {
      coach = "This is a lane. Put it in your bio, lead your pitch with it, and point every piece of content back at it.";
    }
    return { score, verdict, coach, tone };
  }, [f]);

  const who = f.who.trim() || "your people";
  const before = f.before.trim() || "where they’re stuck";
  const after = f.after.trim() || "where they want to be";
  const angles = [
    { tag: "Educate", text: "The #1 mistake " + who + " make that keeps them " + before + "." },
    { tag: "Entertain", text: "A brutally honest day-in-the-life of " + who + " — the part nobody admits." },
    { tag: "Encourage", text: "Being " + before + " is not permanent. Here’s proof it changes." },
    { tag: "Earn", text: "How I take " + who + " from " + before + " to " + after + " — here’s how to work with me." },
  ];

  const plainStatement = `I help ${who} go from ${before} to ${after}, using ${f.edge.trim() || "your edge"}.`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(plainStatement); setCopied(true); toast.success("Niche statement copied"); setTimeout(() => setCopied(false), 1800); }
    catch { toast.error("Couldn't copy — select and copy manually."); }
  };

  const toneColor: Record<string, string> = {
    muted: "var(--text-subtle)", danger: "var(--nx-orange-deep)", warn: "var(--nx-gold-deep)", good: "#15803D",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-24 text-center text-muted-foreground">Loading…</main>
        <SiteFooter />
      </div>
    );
  }

  if (!access) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The Niche Clarity Builder is in the Foundation Kit.</h2>
            <p className="nx-body max-w-md mx-auto mt-2">Find your lane in one afternoon. Get the kit to unlock this and every interactive app.</p>
            <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit</a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 pb-8">
          <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to Foundation Kit</a>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"><Target className="h-5 w-5" /></span>
            <p className="nx-label">Niche Clarity Builder</p>
          </div>
          <h1 className="mt-3">Before you seek anything online, seek yourself.</h1>
          <p className="nx-body max-w-2xl mt-3">
            You've been posting about everything. That's why nothing sticks. Your niche isn't a topic you pick —
            it's the lane where your expertise meets a problem someone will pay to solve. Fill the four boxes; watch your
            one-line niche build itself.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 grid gap-8 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-5">
          {FIELD_META.map((m) => (
            <div key={m.key}>
              <label className="block font-display text-sm tracking-wide text-[var(--foreground)]">{m.label}</label>
              <p className="text-xs text-[var(--text-dim)] mt-0.5 mb-2">{m.hint}</p>
              <textarea
                value={f[m.key]}
                onChange={(e) => set(m.key, e.target.value)}
                rows={2}
                placeholder={m.ph}
                className="w-full rounded-xl border border-[var(--input)] bg-white px-4 py-3 text-[15px] text-foreground outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 resize-none"
              />
            </div>
          ))}
        </div>

        {/* Output */}
        <div className="space-y-5 lg:sticky lg:top-6 self-start">
          <div className="rounded-2xl bg-[#0F172A] p-6 text-white">
            <div className="flex items-center justify-between">
              <p className="nx-label !text-[var(--nx-gold-bright)]">Your niche statement</p>
              <span className="font-display text-3xl" style={{ color: toneColor[calc.tone] === "var(--text-subtle)" ? "#94A3B8" : "var(--nx-gold-bright)" }}>{calc.score}<span className="text-base text-slate-400">/100</span></span>
            </div>
            <p className="mt-3 text-lg leading-relaxed">
              I help <Part v={f.who} ph="who you serve" /> go from <Part v={f.before} ph="their stuck point" /> to <Part v={f.after} ph="the outcome" />, using <Part v={f.edge} ph="your edge" />.
            </p>
            <button onClick={copy} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-4 py-2 text-sm font-bold text-[#0F172A] hover:bg-[var(--nx-gold-deep)] transition-colors">
              {copied ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> Copy statement</>}
            </button>
          </div>

          <div className="nx-card !p-5">
            <div className="flex items-center justify-between">
              <span className="nx-label">Clarity score</span>
              <span className="font-display text-base" style={{ color: toneColor[calc.tone] }}>{calc.verdict}</span>
            </div>
            {calc.coach && <p className="text-sm text-[var(--text-dim)] mt-2 leading-relaxed">{calc.coach}</p>}
          </div>

          <div className="nx-card !p-5">
            <p className="font-display text-base">Your lane, in content (the 4E)</p>
            <p className="text-xs text-[var(--text-dim)] mt-0.5 mb-3">Once the lane is clear, the content writes itself. One post per E.</p>
            <ul className="space-y-2.5">
              {angles.map((a) => (
                <li key={a.tag} className="flex gap-3">
                  <span className="shrink-0 mt-0.5 inline-block rounded-full bg-[var(--bg-card-hi)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--nx-gold-text)]">{a.tag}</span>
                  <span className="text-sm text-[var(--text-body)]">{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <AiCoach tool="niche-clarity" getPayload={() => JSON.stringify(f)} />
        </div>
      </main>

      <section className="border-t border-border bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center">
          <p className="nx-body italic">"No Chill in Mzansi" wasn't a topic. It was a decision to own one lane.</p>
          <p className="text-sm text-[var(--text-dim)] mt-3 max-w-xl mx-auto">A niche feels like you're saying no to everyone. You're not — you're becoming unmissable to someone. Pick the lane.</p>
          <Link to="/dashboard/foundation-kit" className="cta-glow inline-flex items-center gap-2 mt-6">Back to your kit <ArrowRight className="size-4" /></Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Part({ v, ph }: { v: string; ph: string }) {
  const t = (v || "").trim();
  if (t) return <span className="text-[var(--nx-gold-bright)] font-semibold">{t}</span>;
  return <span className="text-slate-500 border-b-2 border-dotted border-slate-600">{ph}</span>;
}
