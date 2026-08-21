import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { readOffer, EMPTY_OFFER, priceMirror, type Offer } from "@/lib/offer-spine";
import { Lock, ArrowRight, Check, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/the-ladder")({
  head: () => ({ meta: [{ title: "The Ladder — Contentpreneur Africa" }] }),
  component: TheLadder,
});

const KEY = "nochill-ladder-v1";

interface Rung { name: string; price: number | null; output: string; runsAlone: boolean }
interface Saved { free: Rung; entry: Rung; core: Rung; deep: Rung }

const R = (): Rung => ({ name: "", price: null, output: "", runsAlone: false });
const DEFAULTS: Saved = { free: R(), entry: R(), core: R(), deep: R() };

type RungKey = keyof Saved;

const SPEC: { key: RungKey; label: string; job: string; guide: string; priceHint: string }[] = [
  { key: "free", label: "The way in", job: "Costs an email, not money",
    guide: "One page that solves one small thing completely. Not a taster — a real fix. They should be able to use it that afternoon.",
    priceHint: "Free. Always." },
  { key: "entry", label: "The first yes", job: "Proves they will pay you at all",
    guide: "The cheapest thing you would still be proud to deliver. Its job is not profit — it is turning a reader into a buyer, which is the hardest single step in the whole ladder.",
    priceHint: "Roughly a tenth of your core offer." },
  { key: "core", label: "The offer", job: "This is the business",
    guide: "The thing you actually want to sell. Everything above and below exists to bring people here.",
    priceHint: "Your Offer Blueprint price." },
  { key: "deep", label: "The few",
    job: "For people who want you, not the product",
    guide: "Same expertise, delivered with your time in it. Small numbers, high price. Do not build this until the core sells — it is the tier that eats your calendar.",
    priceHint: "Three to five times your core." },
];

function TheLadder() {
  const { access } = useKitAccess();
  const [s, setS] = useState<Saved>(DEFAULTS);
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);

  useEffect(() => {
    const o = readOffer();
    setOffer(o);
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r?.core) { setS({ ...DEFAULTS, ...r }); return; }
    } catch { /* ignore */ }
    // First run: seed the core rung from the offer they already built rather
    // than making them type it twice.
    if (o.name.trim() || o.price) {
      setS({ ...DEFAULTS, core: { name: o.name, price: o.price, output: o.output, runsAlone: false } });
    }
  }, []);

  const save = (next: Saved) => {
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const set = (k: RungKey, patch: Partial<Rung>) => save({ ...s, [k]: { ...s[k], ...patch } });

  const core = s.core.price;

  const checks = useMemo(() => {
    const out: { ok: boolean; text: string }[] = [];

    out.push({
      ok: !!s.free.name.trim(),
      text: s.free.name.trim()
        ? "There is a way in that costs an email."
        : "No free rung. Without one you are asking strangers to pay before they have ever received anything from you.",
    });

    if (core && s.entry.price) {
      const ratio = s.entry.price / core;
      out.push({
        ok: ratio <= 0.25,
        text: ratio <= 0.25
          ? "The first rung is genuinely cheap next to the core."
          : `Your entry offer is ${Math.round(ratio * 100)}% of your core price. That is not a first yes, it is a second offer — and it will cannibalise the thing you actually want to sell.`,
      });
    }

    if (core && s.deep.price) {
      out.push({
        ok: s.deep.price >= core * 2.5,
        text: s.deep.price >= core * 2.5
          ? "The top rung is far enough above the core to be worth your time."
          : "Your top tier is too close to your core price. If it costs your calendar it has to cost them properly, or you will resent it by month two.",
      });
    }

    const runners = (Object.keys(s) as RungKey[]).filter((k) => s[k].runsAlone && s[k].name.trim());
    out.push({
      ok: runners.length > 0,
      text: runners.length > 0
        ? `${runners.length} rung${runners.length > 1 ? "s" : ""} run without you. That is the part that is actually an asset.`
        : "Nothing on this ladder runs without you. Right now this is a job with extra steps — pick one rung and make it deliverable while you sleep.",
    });

    const priced = (Object.keys(s) as RungKey[]).filter((k) => k !== "free" && s[k].price);
    out.push({
      ok: priced.length >= 2,
      text: priced.length >= 2
        ? "More than one paid rung. A single price point is a single point of failure."
        : "Only one paid thing. If that one offer stops selling, revenue is zero — the same lesson as one platform.",
    });

    return out;
  }, [s, core]);

  const mirror = useMemo(() => priceMirror(core), [core]);
  const passing = checks.filter((c) => c.ok).length;

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The Ladder is part of the Foundation Kit.</h2>
            <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-7">
          <Link to="/dashboard/foundation-kit" className="inline-flex items-center gap-1 text-[16px] font-semibold text-[var(--nx-gold-text)] hover:underline">
            ← All tools
          </Link>
          <p className="nx-label mt-4">Stage 6 · An asset that runs</p>
          <h1 className="mt-2">One offer is a job. A ladder is a business.</h1>
          <p className="nx-body max-w-xl mt-3">
            Four rungs: the way in, the first yes, the offer, and the few. Most people build the
            middle one and wonder why nobody arrives — and why the ones who do never come back.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-9 space-y-5">
        {SPEC.map((spec) => {
          const r = s[spec.key];
          return (
            <div key={spec.key} className="nx-card !p-5">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="nx-label">{spec.label}</p>
                <span className="text-xs text-[var(--text-subtle)]">{spec.job}</span>
              </div>
              <p className="nx-body mt-2">{spec.guide}</p>

              <div className="grid gap-3 sm:grid-cols-2 mt-4">
                <label className="block">
                  <span className="text-sm font-bold text-[var(--text-body)]">What is it called?</span>
                  <input
                    value={r.name}
                    onChange={(e) => set(spec.key, { name: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--nx-gold)]"
                  />
                </label>
                {spec.key !== "free" ? (
                  <label className="block">
                    <span className="text-sm font-bold text-[var(--text-body)]">Price (R)</span>
                    <span className="block text-xs text-[var(--text-subtle)]">{spec.priceHint}</span>
                    <input
                      type="number" min={0} inputMode="numeric"
                      value={r.price ?? ""}
                      onChange={(e) => set(spec.key, { price: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
                      className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm tabular-nums outline-none focus:border-[var(--nx-gold)]"
                    />
                  </label>
                ) : (
                  <div className="flex items-end">
                    <span className="text-sm text-[var(--text-subtle)] pb-2">{spec.priceHint}</span>
                  </div>
                )}
              </div>

              <label className="block mt-3">
                <span className="text-sm font-bold text-[var(--text-body)]">What do they walk away holding?</span>
                <input
                  value={r.output}
                  onChange={(e) => set(spec.key, { output: e.target.value })}
                  placeholder="A thing, not a feeling"
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--nx-gold)]"
                />
              </label>

              <button
                onClick={() => set(spec.key, { runsAlone: !r.runsAlone })}
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  r.runsAlone
                    ? "border-[#2A6B4C] bg-[#2A6B4C]/8 text-[#2A6B4C]"
                    : "border-[var(--border)] text-[var(--text-dim)] hover:text-foreground"
                }`}
              >
                {r.runsAlone && <Check className="size-4" />}
                This one delivers without me
              </button>
            </div>
          );
        })}

        {mirror && (
          <div className="nx-card !p-5">
            <p className="nx-label">On your core price</p>
            <h3 className="text-lg mt-1">{mirror.headline}</h3>
            <p className="nx-body mt-1">{mirror.body}</p>
          </div>
        )}

        <div className="nx-card !p-6">
          <p className="nx-label">Does this ladder hold up?</p>
          <p className="font-display text-2xl mt-1">{passing} of {checks.length} clear</p>
          <ul className="mt-4 space-y-3">
            {checks.map((c, i) => (
              <li key={i} className="flex gap-3">
                <span className={`mt-0.5 shrink-0 ${c.ok ? "text-[#2A6B4C]" : "text-[#B4650F]"}`}>
                  {c.ok ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
                </span>
                <span className="text-sm text-[var(--text-dim)]">{c.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
          <h2 className="text-white text-2xl">Build one rung at a time, in order.</h2>
          <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg mx-auto">
            The free one, then the core. Everything else can wait — a four-rung ladder with nothing
            selling is four times the work and none of the proof.
          </p>
          <Link
            to="/apps/the-send"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-6 py-3 text-sm font-bold text-[#111111] hover:bg-[var(--nx-gold-deep)] transition-colors"
          >
            Send it to one person <ArrowRight className="size-4" />
          </Link>
        </div>
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
