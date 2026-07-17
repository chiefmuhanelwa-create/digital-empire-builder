import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { AiCoach } from "@/components/ai-coach";
import { Lock, ArrowRight, Workflow } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/seeds-pipeline")({
  head: () => ({ meta: [{ title: "SEEDS Pipeline — CHKPLT" }] }),
  component: SeedsPipeline,
});

const KEY = "nochill-seeds-v1";
const STAGES = [
  { k: "signal", letter: "S", name: "Signal", q: "Where do strangers first see you?", hint: "Content + ads. The post/reel/ad that gets attention from the right person.", ph: "e.g. daily Reels on nurse burnout + a R50/day Meta ad" },
  { k: "engagement", letter: "E", name: "Engagement", q: "How does the conversation start?", hint: "Comments, DMs, a keyword reply. You meet them where they reply.", ph: "e.g. 'comment SLEEP and I'll send the guide' → auto-DM" },
  { k: "education", letter: "E", name: "Education", q: "How do you build trust before selling?", hint: "Lead magnet + email. Give value free; trust becomes income.", ph: "e.g. free sleep-reset checklist → 5-email story sequence" },
  { k: "decision", letter: "D", name: "Decision", q: "How do you make the offer?", hint: "The clear ask — sales page, checkout, or a call.", ph: "e.g. R499 mini-course on a simple checkout page" },
  { k: "success", letter: "S", name: "Success", q: "How do they get a real win?", hint: "Delivery + onboarding so they succeed and refer.", ph: "e.g. welcome email + week-1 quick win + ask for a testimonial" },
] as const;

type Vals = Record<string, string>;

function SeedsPipeline() {
  const { access, loading } = useKitAccess();
  const [v, setV] = useState<Vals>({});
  useEffect(() => { try { const r = JSON.parse(localStorage.getItem(KEY) || "null"); if (r) setV(r); } catch { /* ignore */ } }, []);
  const set = (k: string, val: string) => { const nv = { ...v, [k]: val }; setV(nv); try { localStorage.setItem(KEY, JSON.stringify(nv)); } catch { /* ignore */ } };

  const filled = useMemo(() => STAGES.filter((s) => (v[s.k] || "").trim()).length, [v]);

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Shell><Locked /></Shell>;

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-8">
          <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to your Clarity System</a>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"><Workflow className="h-5 w-5" /></span>
            <p className="nx-label">Step 5 · SEEDS Pipeline · {filled}/5</p>
          </div>
          <h1 className="mt-3">How a stranger becomes a buyer.</h1>
          <p className="nx-body max-w-2xl mt-3">Signal → Engagement → Education → Decision → Success. Map each step for YOUR offer — every gap is where buyers fall out.</p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-4">
        {STAGES.map((s, i) => {
          const done = (v[s.k] || "").trim().length > 0;
          return (
            <div key={s.k} className="nx-card !p-5">
              <div className="flex items-start gap-4">
                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-lg ${done ? "bg-[#15803D] text-white" : "bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"}`}>{s.letter}</span>
                <div className="flex-1">
                  <div className="font-display text-lg">{i + 1}. {s.name}</div>
                  <div className="text-sm text-foreground/80">{s.q}</div>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5 mb-2">{s.hint}</p>
                  <textarea value={v[s.k] || ""} onChange={(e) => set(s.k, e.target.value)} rows={2} placeholder={s.ph}
                    className="w-full rounded-xl border border-[var(--input)] bg-white px-4 py-2.5 text-[15px] outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 resize-none" />
                </div>
              </div>
            </div>
          );
        })}

        <AiCoach tool="seeds-pipeline" getPayload={() => JSON.stringify(v)} />

        <div className="rounded-2xl bg-[#0F172A] p-6 text-center mt-4">
          <p className="nx-label !text-[var(--nx-gold-bright)]">Your next action</p>
          <p className="text-white text-lg mt-1">{filled < 5 ? `Fill the ${5 - filled} missing stage${5 - filled > 1 ? "s" : ""} — a gap is a leak.` : "Pipeline mapped. Now set up your first free opt-in (the Education step) this week."}</p>
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
        <h2 className="mt-4 text-2xl">This is Step 5 of the Clarity System.</h2>
        <p className="nx-body max-w-md mx-auto mt-2">Get the Foundation Kit to unlock the SEEDS Pipeline and the full 7-step system.</p>
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
