import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ShieldCheck, Plus, Trash2, PiggyBank } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/sars-calculator")({
  head: () => ({
    meta: [
      { title: "Free SARS 25% Reserve Calculator — never get caught by tax | CHKPLT" },
      {
        name: "description",
        content:
          "Reserve 25% of every rand the day it lands, so a tax bill never blindsides you. Log your income, see exactly what to set aside, keep the rest with a clear conscience. Free.",
      },
      { property: "og:title", content: "Free SARS 25% Reserve Calculator — CHKPLT" },
    ],
  }),
  component: SarsPage,
});

const RESERVE_RATE = 0.25;
const KEY = "chkplt-sars-entries-v1";

interface Entry { id: string; source: string; amount: number; }

const fmtZAR = (n: number) => "R " + Math.round(n).toLocaleString("en-ZA");
const parseNum = (s: string) => parseFloat(String(s).replace(/[,\s]/g, "")) || 0;

function load(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return [];
  }
}

function SarsPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");

  // hydrate from localStorage after mount (SSR-safe)
  useEffect(() => setEntries(load()), []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem(KEY, JSON.stringify(entries)); } catch {}
    }
  }, [entries]);

  const totals = useMemo(() => {
    const income = entries.reduce((s, e) => s + e.amount, 0);
    const reserve = income * RESERVE_RATE;
    return { income, reserve, keep: income - reserve };
  }, [entries]);

  const add = () => {
    const amt = parseNum(amount);
    if (amt <= 0) return;
    setEntries((e) => [
      { id: Math.random().toString(36).slice(2), source: source.trim() || "Income", amount: amt },
      ...e,
    ]);
    setSource("");
    setAmount("");
  };

  return (
    <div className="min-h-screen bg-white text-[#1C1C1C]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 pt-24 pb-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
            <ShieldCheck className="size-3.5" /> Free SARS 25% Reserve Calculator
          </div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase leading-[1.05]">
            The 25% you <strong>don't touch.</strong>
          </h1>
          <p className="text-[#555] mt-3 max-w-md mx-auto">
            Reserve a quarter of every rand the day it lands — so a tax bill never blindsides you. Log what you earn, see exactly what to move into a separate account, keep the rest with a clear conscience.
          </p>
        </div>

        {/* The story / why */}
        <div className="border border-[#C9A84C]/40 rounded-2xl bg-[#FBF7EC] p-5 mb-6">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#777] mb-1">Why 25%, why now</div>
          <p className="text-[#2A2A2A] text-sm leading-relaxed">
            I learned this the hard way: an assessment of <strong>R207,879</strong> landed because the tax was never set aside. Don't let that be you. The fix is boring and it works — the moment money hits your account, move 25% out of reach. When SARS comes, it's already waiting.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Income logged" value={fmtZAR(totals.income)} tone="ink" />
          <Stat label="Reserve (25%)" value={fmtZAR(totals.reserve)} tone="gold" />
          <Stat label="Yours to keep" value={fmtZAR(totals.keep)} tone="ink" />
        </div>

        {/* Add entry */}
        <div className="border border-[#e8e0d4] rounded-2xl bg-white p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.10)] mb-6">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-banana mb-3">Log income</div>
          <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_auto] gap-2">
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source (e.g. Capitec brand deal)"
              className="h-11 border-[#d0c8bc] focus:border-[#C9A84C] focus:ring-0"
            />
            <Input
              value={amount}
              inputMode="numeric"
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Amount (R)"
              className="h-11 border-[#d0c8bc] focus:border-[#C9A84C] focus:ring-0"
            />
            <Button
              type="button"
              onClick={add}
              disabled={parseNum(amount) <= 0}
              className="h-11 bg-[#C9A84C] hover:bg-[#b8963e] text-[#111] font-display font-black uppercase tracking-wide text-sm px-5 disabled:opacity-40"
            >
              <Plus className="size-4 mr-1" /> Add
            </Button>
          </div>
          {amount && parseNum(amount) > 0 && (
            <p className="mt-3 text-sm text-[#555]">
              From this, set aside <strong className="text-banana">{fmtZAR(parseNum(amount) * RESERVE_RATE)}</strong>, keep <strong>{fmtZAR(parseNum(amount) * (1 - RESERVE_RATE))}</strong>.
            </p>
          )}
        </div>

        {/* The action */}
        {totals.reserve > 0 && (
          <div className="border border-[#1C1C1C] rounded-2xl bg-[#1C1C1C] text-[#f1e7c3] p-5 mb-6 flex items-start gap-3">
            <PiggyBank className="size-5 text-[#C9A84C] shrink-0 mt-0.5" />
            <div>
              <div className="font-display text-lg text-white">Move {fmtZAR(totals.reserve)} to your SARS account.</div>
              <p className="text-[#cdc3a8] text-sm mt-1">
                Open a separate savings account you never spend from. That balance isn't yours — it's SARS's, sitting safely until provisional tax is due (Aug &amp; Feb).
              </p>
            </div>
          </div>
        )}

        {/* Entries */}
        {entries.length > 0 && (
          <div className="border border-[#e8e0d4] rounded-2xl bg-white overflow-hidden mb-2">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#f0ebe1] last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1C1C1C] truncate">{e.source}</div>
                  <div className="text-xs text-[#777]">reserve {fmtZAR(e.amount * RESERVE_RATE)}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-sm text-[#1C1C1C]">{fmtZAR(e.amount)}</span>
                  <button
                    type="button"
                    onClick={() => setEntries((list) => list.filter((x) => x.id !== e.id))}
                    className="text-[#bbb] hover:text-[#b3582c] transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {entries.length > 0 && (
          <p className="text-[#777] text-xs text-center mb-2">Saved on this device. This is a discipline tool, not tax advice — confirm your bracket with a practitioner.</p>
        )}

        {/* Bridge CTA */}
        <div className="mt-8 text-center border border-[#e8e0d4] rounded-2xl p-6 bg-white">
          <h3 className="font-display text-xl uppercase">Reserving is step one. Stewardship is the system.</h3>
          <p className="text-[#555] text-sm mt-2 max-w-md mx-auto">
            The 25% habit keeps you safe. The Tax &amp; Money bundle shows you the full picture — provisional tax dates, what's deductible, and how to register without fear.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/products/$slug"
              params={{ slug: "tax-creator-bundle" }}
              className="cta-glow inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-display font-black uppercase tracking-wide"
            >
              Get the Tax &amp; Money bundle <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/rate-card"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-mono uppercase tracking-[0.15em] border border-[#C9A84C] text-[#1C1C1C] hover:bg-[#C9A84C] hover:text-[#111] transition-colors"
            >
              Price your next deal
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "ink" | "gold" }) {
  return (
    <div className={`rounded-xl p-4 text-center border ${tone === "gold" ? "border-[#C9A84C]/50 bg-[#FBF7EC]" : "border-[#e8e0d4] bg-[#FBFAF8]"}`}>
      <div className={`font-display text-xl sm:text-2xl ${tone === "gold" ? "text-banana" : "text-[#1C1C1C]"}`}>{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-wide text-[#777] mt-1">{label}</div>
    </div>
  );
}
