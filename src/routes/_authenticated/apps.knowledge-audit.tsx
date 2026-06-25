import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useKitAccess } from "@/lib/use-kit-access";
import { Lock, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/knowledge-audit")({
  head: () => ({ meta: [{ title: "The Knowledge Audit — CHKPLT" }] }),
  component: KnowledgeAudit,
});

type Step = "intro" | "capture" | "rate" | "result";
type Fields = { ask: string; skill: string; problem: string };

const CAPTURE: { key: keyof Fields; n: string; q: string; hint: string }[] = [
  { key: "ask", n: "1", q: "What do people already ask your advice on?", hint: "The DMs, the “can I pick your brain” coffees, the questions at work." },
  { key: "skill", n: "2", q: "Your strongest skill from 10+ years of work", hint: "The thing you do without thinking that others struggle with." },
  { key: "problem", n: "3", q: "A real problem you've personally solved", hint: "You went through it, you came out the other side. That journey is teachable." },
];

const RATE: { key: "ms" | "ts" | "ss"; label: string; q: string }[] = [
  { key: "ms", label: "Mindset", q: "Do you believe you're allowed to charge for this?" },
  { key: "ts", label: "Toolset", q: "Do you have the tools to package and deliver it? (phone, a platform, a way to take payment)" },
  { key: "ss", label: "Skillset", q: "How strong is the actual expertise itself?" },
];

const SUGGESTS: Record<keyof Fields, string> = {
  ask: "Likely a low-ticket guide or mini-course (P) — people already want this.",
  skill: "Likely a paid workshop, service or template (P / S) — your daily edge.",
  problem: "Likely your signature story + course (I) — lived proof sells.",
};

const WEAK_MSG: Record<string, string> = {
  Mindset: "Mindset is your lowest. You don't doubt the knowledge — you doubt that you're allowed to charge for it. That's imposter syndrome, not reality. You weren't qualified either; you were called. Decide you're allowed, and the rest follows.",
  Toolset: "Toolset is your lowest. The expertise is there — you just haven't set up the way to package and sell it. A phone, one platform, one way to take payment. That's the whole toolset. Start with what's in your hand.",
  Skillset: "Skillset is your lowest — but you rated it honestly, which most people won't. Pick the ONE thing you're strongest at and go deep there, rather than spreading thin. Depth in one lane beats shallow in five.",
};

function KnowledgeAudit() {
  const { access, loading } = useKitAccess();
  const [step, setStep] = useState<Step>("intro");
  const [fields, setFields] = useState<Fields>({ ask: "", skill: "", problem: "" });
  const [ms, setMs] = useState(5);
  const [ts, setTs] = useState(5);
  const [ss, setSs] = useState(5);

  const res = useMemo(() => {
    const product = ms * ts * ss;
    const pct = Math.round((product / 1000) * 100);
    let title: string, text: string;
    if (product === 0) { title = "A zero stops everything"; text = "One of your three is at zero — and because they multiply, the whole thing is zero. You can have world-class skill and still earn nothing if your mindset or tools are at zero. Lift the zero first."; }
    else if (pct <= 33) { title = "The raw material is there"; text = "You have real expertise — the readiness just isn't built yet. The weakest multiplier below is almost always the fastest to fix, and it lifts the whole score with it."; }
    else if (pct <= 66) { title = "You're closer than you think"; text = "You're most of the way to a sellable offer. Close the gap on your weakest multiplier and you cross from 'I know things' into 'I have a product.'"; }
    else { title = "Ship it — you're ready"; text = "Mindset, tools and skill are all firing. You're sitting on a product you could launch this month. Stop auditing. Start packaging."; }

    const trio = [{ k: "Mindset", v: ms }, { k: "Toolset", v: ts }, { k: "Skillset", v: ss }].sort((a, b) => a.v - b.v);
    const order: (keyof Fields)[] = ["ask", "skill", "problem"];
    const assets = order.filter((k) => fields[k].trim()).map((k, i) => ({ tag: String(i + 1), text: fields[k].trim(), suggest: SUGGESTS[k] }));
    return { product, pct, title, text, weakMsg: WEAK_MSG[trio[0].k], assets };
  }, [ms, ts, ss, fields]);

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;

  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to Foundation Kit</a>

        {step === "intro" && (
          <div className="nx-hero-orb mt-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"><Sparkles className="h-5 w-5" /></span>
              <p className="nx-label">The Knowledge Audit · For the called expert</p>
            </div>
            <h1 className="mt-3">You're sitting on expertise you can't see.</h1>
            <p className="nx-body mt-3">
              Ten, twenty years of real knowledge — and you think you have nothing to sell. I built R600,000+ in the 4-hour gaps
              between air-traffic shifts. I wasn't qualified. I was called. This audit finds the knowledge you already have and runs
              it through the one formula that decides if it'll sell.
            </p>
            <p className="nx-body italic mt-4 text-[var(--text-dim)]">“Attention is better than qualification. Skills pay more than education.”</p>
            <button onClick={() => setStep("capture")} className="cta-glow inline-flex items-center gap-2 mt-6">Start the audit <ArrowRight className="size-4" /></button>
            <p className="text-xs text-[var(--text-subtle)] mt-3">3 steps · 2 minutes</p>
          </div>
        )}

        {step === "capture" && (
          <div className="mt-6">
            <button onClick={() => setStep("intro")} className="inline-flex items-center gap-1 text-sm text-[var(--text-dim)] hover:text-foreground"><ArrowLeft className="size-4" /> Intro</button>
            <p className="nx-label mt-4">Step 1 of 3 · Inventory</p>
            <h1 className="mt-1 text-3xl">Name what you already know.</h1>
            <p className="nx-body mt-2">Don't overthink it. The thing you'd dismiss as “obvious” is usually the product.</p>
            <div className="space-y-5 mt-6">
              {CAPTURE.map((c) => (
                <div key={c.key}>
                  <label className="block font-display text-base">{c.n} · {c.q}</label>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5 mb-2">{c.hint}</p>
                  <textarea value={fields[c.key]} onChange={(e) => setFields((f) => ({ ...f, [c.key]: e.target.value }))} rows={2}
                    className="w-full rounded-xl border border-[var(--input)] bg-white px-4 py-3 text-[15px] outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 resize-none" />
                </div>
              ))}
            </div>
            <button onClick={() => setStep("rate")} className="cta-glow inline-flex items-center gap-2 mt-6">Next: score your readiness <ArrowRight className="size-4" /></button>
          </div>
        )}

        {step === "rate" && (
          <div className="mt-6">
            <button onClick={() => setStep("capture")} className="inline-flex items-center gap-1 text-sm text-[var(--text-dim)] hover:text-foreground"><ArrowLeft className="size-4" /> Inventory</button>
            <p className="nx-label mt-4">Step 2 of 3 · MS × TS × SS</p>
            <h1 className="mt-1 text-3xl">Rate yourself on the formula.</h1>
            <p className="nx-body mt-2">Mindset × Toolset × Skillset. They multiply — they don't add. A zero anywhere is a zero everywhere. Be honest; this is where the gap shows.</p>
            <div className="space-y-6 mt-6">
              {RATE.map((row) => {
                const val = row.key === "ms" ? ms : row.key === "ts" ? ts : ss;
                const setV = row.key === "ms" ? setMs : row.key === "ts" ? setTs : setSs;
                return (
                  <div key={row.key}>
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-base">{row.label}</span>
                      <span className="font-display text-xl text-[var(--nx-gold-text)]">{val}</span>
                    </div>
                    <p className="text-xs text-[var(--text-dim)] mb-2">{row.q}</p>
                    <input type="range" min={0} max={10} value={val} onChange={(e) => setV(Number(e.target.value))} className="w-full accent-[var(--nx-gold)]" />
                  </div>
                );
              })}
            </div>
            <div className="nx-card !p-4 mt-6 text-center">
              <span className="font-display text-lg">{ms} × {ts} × {ss} = <span className="text-[var(--nx-gold-text)]">{res.product}</span> / 1000</span>
            </div>
            <button onClick={() => setStep("result")} className="cta-glow inline-flex items-center gap-2 mt-6">See my audit <ArrowRight className="size-4" /></button>
          </div>
        )}

        {step === "result" && (
          <div className="mt-6">
            <button onClick={() => setStep("rate")} className="inline-flex items-center gap-1 text-sm text-[var(--text-dim)] hover:text-foreground"><ArrowLeft className="size-4" /> Edit ratings</button>
            <div className="rounded-2xl bg-[#0F172A] p-6 text-white text-center mt-4">
              <div className="font-display text-5xl text-[var(--nx-gold-bright)]">{res.pct}%</div>
              <p className="nx-label !text-[var(--nx-gold-bright)] mt-1">Your readiness</p>
              <h2 className="text-white text-2xl mt-3">{res.title}</h2>
              <p className="text-slate-300 mt-2 max-w-lg mx-auto">{res.text}</p>
            </div>

            <div className="nx-card !p-5 mt-5">
              <span className="nx-label">Your multiplier to fix first</span>
              <p className="text-sm text-[var(--text-body)] mt-2">{res.weakMsg}</p>
            </div>

            {res.assets.length > 0 && (
              <div className="mt-5">
                <h3 className="font-display text-xl">Your monetisable knowledge</h3>
                <p className="text-sm text-[var(--text-dim)] mt-0.5 mb-3">This is the product hiding in plain sight. One of these is your first paid offer.</p>
                <div className="space-y-3">
                  {res.assets.map((a) => (
                    <div key={a.tag} className="nx-card !p-4">
                      <div className="flex gap-3">
                        <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-card-hi)] text-sm font-bold text-[var(--nx-gold-text)]">{a.tag}</span>
                        <div>
                          <p className="text-[15px] text-foreground font-medium">{a.text}</p>
                          <p className="text-sm text-[var(--text-dim)] mt-1">{a.suggest}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-[var(--bg-surface)] border border-border p-6 text-center">
              <h3 className="font-display text-xl">Get your Knowledge-to-Product roadmap</h3>
              <p className="text-sm text-[var(--text-dim)] mt-1 max-w-md mx-auto">The path from “I just know stuff” to your first paid product — built around the expertise you named above.</p>
              <Link to="/apply" className="cta-glow inline-flex items-center gap-2 mt-4">Apply for the Accelerator <ArrowRight className="size-4" /></Link>
            </div>

            <button onClick={() => { setStep("intro"); setFields({ ask: "", skill: "", problem: "" }); setMs(5); setTs(5); setSs(5); }}
              className="mt-6 text-sm text-[var(--text-dim)] hover:text-foreground">Run the audit again</button>
          </div>
        )}
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

function Locked() {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className="nx-card !p-10 text-center">
          <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
          <h2 className="mt-4 text-2xl">The Knowledge Audit is in the Foundation Kit.</h2>
          <p className="nx-body max-w-md mx-auto mt-2">Find the product hiding in your expertise. Get the kit to unlock this and every interactive app.</p>
          <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit — $97</a>
        </div>
      </main>
    </Shell>
  );
}
