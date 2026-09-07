import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, Trash2, PiggyBank } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import {
  ToolCanvas,
  DotGrid,
  GoldGlow,
  Eyebrow,
  Pill,
  Panel,
  PanelHeader,
  Field,
  Input,
  GoldButton,
} from "@/components/tools/premium";
import { useToolView } from "@/lib/tool-analytics";

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

interface Entry {
  id: string;
  source: string;
  amount: number;
}

const fmtZAR = (n: number) => "R" + Math.round(n).toLocaleString("en-GB");
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
  useToolView("sars-calculator");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");

  // hydrate from localStorage after mount (SSR-safe)
  useEffect(() => setEntries(load()), []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(entries));
      } catch {
        /* private mode / storage blocked — entries just won't persist */
      }
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
    <div className="min-h-screen overflow-x-clip bg-[#F5F3FF]">
      <SiteHeader />
      <ToolCanvas>
        <div className="px-5 pt-3 sm:px-6">
          <BackNav to="/tools" label="All tools" />
        </div>

        <header className="mx-auto max-w-2xl px-5 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-12">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Eyebrow>Creator · Free Tool</Eyebrow>
            <Pill className="whitespace-nowrap">SARS 25% Reserve</Pill>
          </div>
          <h1 className="mt-7 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#1A1523] sm:text-[52px]">
            The 25% you <span className="text-[#8B5CF6]">don't touch.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15.5px] leading-[1.65] text-neutral-600 sm:text-[17px]">
            Reserve a quarter of every rand the day it lands — so a tax bill never blindsides you.
            Log what you earn, see exactly what to move into a separate account, keep the rest with
            a clear conscience.
          </p>
          <div className="mt-7 h-[3px] w-16 rounded-full bg-[#8B5CF6]" />
        </header>

        <main className="mx-auto max-w-2xl space-y-4 px-5 pb-20 sm:px-6">
          {/* This tool is the habit; the provisional calculator is the number.
              Without this pointer the two tax tools read as duplicates. */}
          <Panel raised className="overflow-hidden">
            <div className="relative overflow-hidden bg-[#1A1523] px-6 py-6 text-center sm:px-8">
              <Eyebrow className="!text-[#8B5CF6]">Want the exact figure?</Eyebrow>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-white/70">
                This reserves a flat 25% — a safe habit, not a calculation. The{" "}
                <Link to="/provisional-tax" className="font-bold text-[#8B5CF6] underline">
                  Provisional Tax Calculator
                </Link>{" "}
                runs your real income and deductions through the current SARS brackets and gives you
                both IRP6 payments with their dates.
              </p>
            </div>
          </Panel>

          {/* The story / why */}
          <Panel className="border-[#8B5CF6]/35 bg-[#8B5CF6]/[0.06] p-5 sm:p-6">
            <Eyebrow>Why 25%, why now</Eyebrow>
            <p className="mt-3 text-[14.5px] leading-relaxed text-neutral-700">
              I learned this the hard way: an assessment of <strong>R207,879</strong> landed because
              the tax was never set aside. Don't let that be you. The fix is boring and it works — the
              moment money hits your account, move 25% out of reach. When SARS comes, it's already
              waiting.
            </p>
          </Panel>

          {/* Summary — the money card */}
          <Panel raised className="overflow-hidden">
            <div className="relative overflow-hidden bg-[#1A1523] px-6 py-8 sm:px-8">
              <DotGrid dark />
              <GoldGlow className="-right-24 -top-28" size={420} opacity={0.6} />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <Eyebrow className="!text-[#8B5CF6]">Your reserve</Eyebrow>
                  <Pill tone="gold">25%</Pill>
                </div>
                <p className="mt-4 font-display text-[42px] font-extrabold leading-none tracking-[-0.03em] text-[#C4B5FD] [font-variant-numeric:tabular-nums] sm:text-[52px]">
                  {fmtZAR(totals.reserve)}
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-white/50">
                  Set this aside from {fmtZAR(totals.income)} logged, and keep{" "}
                  {fmtZAR(totals.keep)}.
                </p>
                <div className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-[13.5px]">
                  <SummaryRow label="Income logged" value={fmtZAR(totals.income)} />
                  <SummaryRow label="Reserve (25%)" value={fmtZAR(totals.reserve)} gold />
                  <SummaryRow label="Yours to keep" value={fmtZAR(totals.keep)} />
                </div>
              </div>
            </div>
          </Panel>

          {/* Add entry */}
          <Panel>
            <PanelHeader
              title="Log income"
              step="01"
              hint="Add each payment the day it lands — the reserve updates as you go."
            />
            <div className="space-y-5 p-5 sm:p-6">
              <Field label="Source" hint="Where the money came from.">
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Source (e.g. Capitec brand deal)"
                />
              </Field>
              <Field label="Amount" hint="What landed in your account, in rands.">
                <Input
                  value={amount}
                  inputMode="numeric"
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="Amount (R)"
                />
              </Field>
              <GoldButton type="button" onClick={add} disabled={parseNum(amount) <= 0}>
                <Plus className="size-4" /> Add income
              </GoldButton>
              {amount && parseNum(amount) > 0 && (
                <p className="text-center text-[13.5px] text-neutral-600">
                  From this, set aside{" "}
                  <strong className="text-[#7C3AED]">
                    {fmtZAR(parseNum(amount) * RESERVE_RATE)}
                  </strong>
                  , keep <strong>{fmtZAR(parseNum(amount) * (1 - RESERVE_RATE))}</strong>.
                </p>
              )}
            </div>
          </Panel>

          {/* The action */}
          {totals.reserve > 0 && (
            <Panel raised className="overflow-hidden">
              <div className="relative flex items-start gap-3 overflow-hidden bg-[#1A1523] p-5 sm:p-6">
                <PiggyBank className="mt-0.5 size-5 shrink-0 text-[#8B5CF6]" />
                <div>
                  <div className="font-display text-lg font-bold text-white">
                    Move {fmtZAR(totals.reserve)} to your SARS account.
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/70">
                    Open a separate savings account you never spend from. That balance isn't yours —
                    it's SARS's, sitting safely until provisional tax is due (Aug &amp; Feb).
                  </p>
                </div>
              </div>
            </Panel>
          )}

          {/* Entries */}
          {entries.length > 0 && (
            <Panel className="overflow-hidden">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 border-b border-neutral-200/70 px-5 py-3.5 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-[#1A1523]">
                      {e.source}
                    </div>
                    <div className="text-[12px] text-neutral-500">
                      reserve {fmtZAR(e.amount * RESERVE_RATE)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-[14px] text-[#1A1523] [font-variant-numeric:tabular-nums]">
                      {fmtZAR(e.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEntries((list) => list.filter((x) => x.id !== e.id))}
                      className="inline-flex size-11 items-center justify-center text-neutral-400 transition-colors hover:text-[#7C3AED]"
                      aria-label="Remove"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </Panel>
          )}
          {entries.length > 0 && (
            <p className="text-center text-[12px] text-neutral-500">
              Saved on this device. This is a discipline tool, not tax advice — confirm your bracket
              with a practitioner.
            </p>
          )}

          {/* Bridge CTA */}
          <Panel raised className="mt-2 overflow-hidden">
            <div className="relative overflow-hidden bg-[#1A1523] px-6 py-9 text-center sm:px-10">
              <DotGrid dark />
              <GoldGlow className="-bottom-32 -right-20" size={440} opacity={0.6} />
              <div className="relative">
                <Eyebrow className="!text-[#8B5CF6]">Reserving is step one</Eyebrow>
                <h3 className="mt-4 font-display text-[24px] font-extrabold tracking-tight text-white sm:text-[30px]">
                  Knowing the rules is the system.
                </h3>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
                  The 25% habit keeps you safe. SARS &amp; Creator Income shows you the full picture —
                  provisional tax dates, what's deductible, and how to register without fear.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/products/$slug"
                    params={{ slug: "sars-creator-income" }}
                    className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-[15px] font-bold text-white transition hover:brightness-110"
                  >
                    Get SARS &amp; Creator Income <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    to="/provisional-tax"
                    className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-white/25 px-7 text-[14px] font-bold text-white transition hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
                  >
                    Work out what you owe
                  </Link>
                </div>
              </div>
            </div>
          </Panel>
        </main>
      </ToolCanvas>
      <SiteFooter />
    </div>
  );
}

function SummaryRow({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/55">{label}</span>
      <span
        className={`font-bold [font-variant-numeric:tabular-nums] ${gold ? "text-[#C4B5FD]" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
