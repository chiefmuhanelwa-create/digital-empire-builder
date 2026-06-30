import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { AiCoach } from "@/components/ai-coach";
import { Lock, ArrowRight, Gauge } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/ms-ts-ss")({
  head: () => ({ meta: [{ title: "MS×TS×SS Readiness — CHKPLT" }] }),
  component: MsTsSs,
});

const KEY = "nochill-msts-v1";
const DIMS = [
  { k: "ms", label: "Mindset", q: "Do you believe you're allowed to charge for what you know?",
    fix: "Mindset is lowest. You don't doubt the knowledge — you doubt you're allowed to charge. That's imposter syndrome, not reality. You weren't qualified; you were called. Decide you're allowed." },
  { k: "ts", label: "Toolset", q: "Can you package, deliver and get paid? (phone, one platform, one checkout)",
    fix: "Toolset is lowest. The expertise is there — you just haven't set up the way to package and sell it. A phone, one platform, one way to take payment. Start with what's in your hand." },
  { k: "ss", label: "Skillset", q: "How strong is the actual expertise itself?",
    fix: "Skillset is lowest — but you rated it honestly. Pick the ONE thing you're strongest at and go deep, rather than spreading thin. Depth in one lane beats shallow in five." },
] as const;

type Vals = { ms: number; ts: number; ss: number };

function MsTsSs() {
  const { access, loading } = useKitAccess();
  const [v, setV] = useState<Vals>({ ms: 5, ts: 5, ss: 5 });

  useEffect(() => {
    try { const r = JSON.parse(localStorage.getItem(KEY) || "null"); if (r) setV({ ms: 5, ts: 5, ss: 5, ...r }); } catch { /* ignore */ }
  }, []);
  const set = (k: keyof Vals, n: number) => { const nv = { ...v, [k]: n }; setV(nv); try { localStorage.setItem(KEY, JSON.stringify(nv)); } catch { /* ignore */ } };

  const r = useMemo(() => {
    const product = v.ms * v.ts * v.ss; // 0..1000
    const pct = Math.round((product / 1000) * 100);
    const trio = [{ k: "ms", v: v.ms }, { k: "ts", v: v.ts }, { k: "ss", v: v.ss }].sort((a, b) => a.v - b.v);
    const weakKey = trio[0].k;
    const weak = DIMS.find((d) => d.k === weakKey)!;
    let title: string, text: string, tone: "danger" | "warn" | "good";
    if (product === 0) { tone = "danger"; title = "A zero stops everything"; text = "One of your three is at zero — and they multiply, so the whole thing is zero. Lift the zero before anything else."; }
    else if (pct <= 33) { tone = "danger"; title = "The raw material is there"; text = "Real expertise, low readiness. The weakest multiplier below is the fastest fix and lifts the whole score."; }
    else if (pct <= 66) { tone = "warn"; title = "You're closer than you think"; text = "Most of the way to a sellable offer. Close your weakest gap and you cross from 'I know things' into 'I have a product.'"; }
    else { tone = "good"; title = "Ship it — you're ready"; text = "Mindset, tools and skill are firing. Stop auditing, start packaging. Move to Step 2 and find your product."; }
    return { product, pct, weak, title, text, tone };
  }, [v]);

  const toneColor = { danger: "var(--nx-orange-deep)", warn: "var(--nx-gold-deep)", good: "#15803D" }[r.tone];

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-8">
          <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to your Clarity System</a>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"><Gauge className="h-5 w-5" /></span>
            <p className="nx-label">Step 1 · MS × TS × SS Readiness</p>
          </div>
          <h1 className="mt-3">They multiply — they don't add.</h1>
          <p className="nx-body max-w-2xl mt-3">Mindset × Toolset × Skillset. A zero anywhere is a zero everywhere. Rate yourself honestly — this shows the ONE thing to fix first.</p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="space-y-6">
          {DIMS.map((d) => {
            const val = v[d.k as keyof Vals];
            return (
              <div key={d.k}>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg">{d.label}</span>
                  <span className="font-display text-2xl text-[var(--nx-gold-text)]">{val}</span>
                </div>
                <p className="text-sm text-[var(--text-dim)] mb-2">{d.q}</p>
                <input type="range" min={0} max={10} value={val} onChange={(e) => set(d.k as keyof Vals, Number(e.target.value))} className="w-full accent-[var(--nx-gold)]" />
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-[#0F172A] p-6 text-white text-center mt-8">
          <div className="font-display text-2xl">{v.ms} × {v.ts} × {v.ss} = <span className="text-[var(--nx-gold-bright)]">{r.product}</span><span className="text-slate-400 text-lg"> / 1000</span></div>
          <div className="font-display text-5xl mt-2" style={{ color: r.tone === "good" ? "#4ADE80" : "var(--nx-gold-bright)" }}>{r.pct}%</div>
          <p className="nx-label !text-[var(--nx-gold-bright)] mt-1">Readiness</p>
          <h2 className="text-white text-2xl mt-3">{r.title}</h2>
          <p className="text-slate-300 mt-2 max-w-lg mx-auto">{r.text}</p>
        </div>

        <div className="nx-card !p-5 mt-5">
          <span className="nx-label">Your next action — fix this first</span>
          <p className="text-sm text-[var(--text-body)] mt-2"><strong>{r.weak.label}.</strong> {r.weak.fix}</p>
        </div>

        <AiCoach tool="ms-ts-ss" getPayload={() => JSON.stringify({ mindset: v.ms, toolset: v.ts, skillset: v.ss, score: r.product })} />

        <div className="mt-6 text-center">
          <Link to="/dashboard/foundation-kit" className="cta-glow inline-flex items-center gap-2">Mark done → next step <ArrowRight className="size-4" /></Link>
        </div>
      </main>
    </Shell>
  );

  function Locked() {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">This is Step 1 of the Clarity System.</h2>
            <p className="nx-body max-w-md mx-auto mt-2">Get the Foundation Kit to unlock the full 7-step system.</p>
            <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit — $97</a>
          </div>
        </main>
      </Shell>
    );
  }
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
