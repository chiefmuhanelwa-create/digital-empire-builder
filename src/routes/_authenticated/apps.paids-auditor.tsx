import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { Lock, ArrowRight, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/paids-auditor")({
  head: () => ({ meta: [{ title: "PAIDS Income-Stream Auditor — CHKPLT" }] }),
  component: PaidsAuditor,
});

const KEY = "nochill-paids-v1";

type Sid = "p" | "a" | "i" | "d" | "s";
const STREAMS: { id: Sid; letter: string; name: string; examples: string; why: string; product: string }[] = [
  { id: "p", letter: "P", name: "Products", examples: "Courses, templates, apps, ebooks",
    why: "Digital products are your scalable backbone — make once, sell forever. They turn what you know into an asset that earns while you sleep.",
    product: "Package one thing you already teach into a R199–R997 product. The Knowledge Audit names it for you." },
  { id: "a", letter: "A", name: "Ads & Affiliates", examples: "Platform payouts, affiliate links",
    why: "The most passive, most overlooked stream in SA. You're already recommending products — you're just not paid for it. R23,000 in one day from one AdMarula link proved it to me.",
    product: "Join one affiliate network this week (AdMarula, OfferForge, Takealot). Add links to content you already make." },
  { id: "i", letter: "I", name: "Information", examples: "Newsletter, membership, the Vault",
    why: "This is where 'R100K/month without active selling' actually lives. Recurring income that pays whether you show up or not. The single biggest gap in most creators' income.",
    product: "Start a paid letter (R99/mo) or a membership. One recurring product changes everything." },
  { id: "d", letter: "D", name: "Deals", examples: "Brand campaigns, retainers",
    why: "One brand deal is a payday. One retainer is a salary. The skill is turning a campaign into recurring — Savanna paid me R25,000/month for four months that way.",
    product: "Turn your next one-off deal into a retainer offer. Track the pipeline so nothing dies in the DMs." },
  { id: "s", letter: "S", name: "Services", examples: "UGC, management, consulting",
    why: "Lowest leverage, fastest cash. Services fund and validate everything else — but cap them. They pay today; they cannot scale. Use them to build the other four.",
    product: "Offer one high-value 1:1 (an audit call, a sprint). Use the cash + proof to fund your Products and Information." },
];

type Amounts = Record<Sid, string>;
const EMPTY: Amounts = { p: "", a: "", i: "", d: "", s: "" };
const money = (n: number) => "R" + Math.round(n || 0).toLocaleString("en-ZA");
// Priority for what to build next when streams tie: Information first (recurring), then Products, etc.
const NEXT_PRIORITY: Sid[] = ["i", "p", "a", "d", "s"];

function PaidsAuditor() {
  const { access, loading } = useKitAccess();
  const [amounts, setAmounts] = useState<Amounts>(EMPTY);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r && typeof r === "object") setAmounts({ ...EMPTY, ...r });
    } catch { /* ignore */ }
  }, []);

  const set = (id: Sid, v: string) => {
    const next = { ...amounts, [id]: v.replace(/[^\d]/g, "") };
    setAmounts(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const r = useMemo(() => {
    const vals = STREAMS.map((s) => Math.max(0, Number(amounts[s.id]) || 0));
    const total = vals.reduce((a, b) => a + b, 0);

    let score = 0;
    if (total > 0) {
      const hhi = vals.reduce((acc, v) => acc + Math.pow(v / total, 2), 0);
      const effective = 1 / hhi; // 1..5
      score = Math.max(0, Math.min(100, Math.round(((effective - 1) / 4) * 100)));
    }

    let verdict: string, tone: "muted" | "danger" | "warn" | "good";
    if (total === 0) { tone = "muted"; verdict = "Enter your income to begin"; }
    else if (score <= 33) { tone = "danger"; verdict = "Dangerously concentrated"; }
    else if (score <= 66) { tone = "warn"; verdict = "Building, still exposed"; }
    else { tone = "good"; verdict = "Well diversified"; }

    let biggestIdx = 0;
    vals.forEach((v, i) => { if (v > vals[biggestIdx]) biggestIdx = i; });
    const depPct = total > 0 ? Math.round((vals[biggestIdx] / total) * 100) : 0;

    const rows = STREAMS.map((s, i) => {
      const v = vals[i];
      const pct = total > 0 ? Math.round((v / total) * 100) : 0;
      let status: string, stone: "danger" | "warn" | "good";
      if (v <= 0) { status = "Missing"; stone = "danger"; }
      else if (pct >= 20) { status = "Strong"; stone = "good"; }
      else { status = "Thin"; stone = "warn"; }
      return { ...s, v, pct, status, stone };
    });

    // build-next: among missing/thin streams, pick by NEXT_PRIORITY; default Information
    const candidates = rows.filter((x) => x.status !== "Strong");
    let next = STREAMS.find((s) => s.id === "i")!;
    for (const pid of NEXT_PRIORITY) {
      const hit = candidates.find((c) => c.id === pid);
      if (hit) { next = STREAMS.find((s) => s.id === pid)!; break; }
    }

    const survivePct = total > 0 ? 100 - depPct : 0;
    const biggestName = total > 0 ? STREAMS[biggestIdx].name : "your biggest stream";
    let surviveMsg: string;
    if (total === 0) surviveMsg = "";
    else if (survivePct < 40) surviveMsg = "That's not a business, that's a tightrope. One bad week and most of your income is gone. Build a second real stream before you do anything else.";
    else if (survivePct < 70) surviveMsg = "You'd take a serious hit but you'd survive. Keep widening — aim for no single stream above 40% of your income.";
    else surviveMsg = "You'd barely feel it. This is what breadth buys you: the freedom to lose a stream and keep building.";

    return { vals, total, score, verdict, tone, depPct, biggestName, rows, next, survivePct, surviveMsg, active: vals.filter((v) => v > 0).length };
  }, [amounts]);

  const toneColor: Record<string, string> = { muted: "var(--text-subtle)", danger: "var(--nx-orange-deep)", warn: "var(--nx-gold-deep)", good: "#15803D" };

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked title="The PAIDS Auditor is in the Foundation Kit." body="See exactly how exposed your income is — and which stream to build next. Get the kit to unlock it." />;

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 pb-8">
          <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to Foundation Kit</a>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)] font-display text-lg">P</span>
            <p className="nx-label">PAIDS Income-Stream Auditor</p>
          </div>
          <h1 className="mt-3">A real empire earns from all five.</h1>
          <p className="nx-body max-w-2xl mt-3">
            “Google killed my AdSense — R180,000 a year, gone overnight. My income didn't hit zero.” Because I wasn't living on
            one stream. Enter what you earn across the five PAIDS streams and see how exposed you are. Breadth is the insurance policy.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 grid gap-8 lg:grid-cols-5">
        {/* Inputs */}
        <div className="lg:col-span-3 space-y-3">
          <p className="font-display text-lg">Your five streams</p>
          <p className="text-sm text-[var(--text-dim)] mb-2">Average monthly income per stream. Leave a stream at zero if you're not earning from it yet — that's the gap.</p>
          {r.rows.map((s) => (
            <div key={s.id} className="nx-card !p-4 flex items-center gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)] font-display text-lg">{s.letter}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display text-base">{s.name}</div>
                <div className="text-xs text-[var(--text-dim)] truncate">{s.examples}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[var(--text-subtle)] font-semibold">R</span>
                <input inputMode="numeric" value={amounts[s.id]} onChange={(e) => set(s.id, e.target.value)} placeholder="0"
                  className="w-24 rounded-lg border border-[var(--input)] bg-white px-2 py-2 text-right text-[15px] outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30" />
              </div>
              <div className="w-16 text-right shrink-0">
                <div className="text-sm font-bold" style={{ color: toneColor[s.stone] }}>{s.status}</div>
                <div className="text-xs text-[var(--text-subtle)]">{s.pct}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Output */}
        <div className="lg:col-span-2 space-y-5 lg:sticky lg:top-6 self-start">
          <div className="rounded-2xl bg-[#0F172A] p-6 text-white text-center">
            <div className="font-display text-5xl" style={{ color: r.tone === "muted" ? "#94A3B8" : "var(--nx-gold-bright)" }}>{r.score}<span className="text-xl text-slate-400">/100</span></div>
            <p className="nx-label !text-[var(--nx-gold-bright)] mt-1">Diversification</p>
            <p className="mt-2 text-sm text-slate-300">{r.verdict}{r.total > 0 ? ` · ${r.active}/5 active` : ""}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-lg bg-white/5 p-3"><div className="text-[11px] uppercase tracking-wide text-slate-400">Total / month</div><div className="font-display text-lg">{money(r.total)}</div></div>
              <div className="rounded-lg bg-white/5 p-3"><div className="text-[11px] uppercase tracking-wide text-slate-400">Biggest dependency</div><div className="font-display text-lg">{r.depPct}%</div></div>
            </div>
          </div>

          {r.total > 0 && (
            <div className="nx-card !p-5">
              <div className="flex items-center gap-2"><ShieldAlert className="size-4 text-[var(--nx-orange-deep)]" /><span className="nx-label">The stress test</span></div>
              <p className="text-sm text-[var(--text-body)] mt-2">If <strong>{r.biggestName}</strong> died tomorrow — a banned account, a killed programme, a lost client —</p>
              <p className="font-display text-2xl mt-1" style={{ color: toneColor[r.survivePct < 40 ? "danger" : r.survivePct < 70 ? "warn" : "good"] }}>{r.survivePct}% of your income survives</p>
              <p className="text-sm text-[var(--text-dim)] mt-1">{r.surviveMsg}</p>
            </div>
          )}

          <div className="nx-card !p-5">
            <span className="nx-label">Build this stream next</span>
            <div className="font-display text-lg mt-1">{r.next.letter} · {r.next.name}</div>
            <p className="text-sm text-[var(--text-dim)] mt-1">{r.next.why}</p>
            <p className="text-sm text-[var(--text-body)] mt-2"><strong>Where to start:</strong> {r.next.product}</p>
          </div>
        </div>
      </main>

      <section className="border-t border-border bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center">
          <p className="nx-label">The stream that changes the game · I — Information</p>
          <p className="nx-body mt-2 max-w-xl mx-auto">“R100K a month without active selling” comes from recurring income: a paid letter, a membership, a vault people pay for monthly. If your I is at zero, that's the whole ceiling on your freedom.</p>
          <Link to="/dashboard/foundation-kit" className="cta-glow inline-flex items-center gap-2 mt-6">Back to your kit <ArrowRight className="size-4" /></Link>
        </div>
      </section>
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

function Locked({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className="nx-card !p-10 text-center">
          <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
          <h2 className="mt-4 text-2xl">{title}</h2>
          <p className="nx-body max-w-md mx-auto mt-2">{body}</p>
          <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit — $97</a>
        </div>
      </main>
    </Shell>
  );
}
