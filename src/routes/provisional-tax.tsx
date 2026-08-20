import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { useToolView, useToolStart, trackToolEvent } from "@/lib/tool-analytics";
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
import {
  INCOME_SOURCES,
  EXPENSE_CATEGORIES,
  BRACKETS,
  CHECKLIST,
  PRIMARY_REBATE,
  TAX_THRESHOLD,
  TAX_YEAR,
  TAX_YEAR_NOTE,
  computeProvisionalTax,
  type TaxResult,
} from "@/lib/provisional-tax-engine";

// Provisional tax calculator. The CHKPLT /sars-calculator tool is a flat 25%
// reserve rule of thumb; this is the real thing — SARS brackets, deductions,
// both IRP6 payments — plus the compliance checklist, and a lead-capture step
// that delivers the estimate as a PDF the creator can hand to an accountant.

export const Route = createFileRoute("/provisional-tax")({
  head: () => ({
    meta: [
      { title: `Free Provisional Tax Calculator for SA Creators (${TAX_YEAR}) | CHKPLT` },
      {
        name: "description",
        content:
          "Work out what you actually owe SARS on creator income — brand deals, AdSense, TikTok, affiliate. Real SARS brackets, your deductions, both IRP6 payment dates. Free.",
      },
      { property: "og:title", content: "Free Provisional Tax Calculator — CHKPLT" },
    ],
  }),
  component: ProvisionalTaxPage,
});

const zar = (n: number) => "R " + Math.round(n).toLocaleString("en-ZA");
const digits = (s: string) => Number(String(s).replace(/[^\d.]/g, "")) || 0;
const grouped = (s: string) => {
  const n = digits(s);
  return n ? n.toLocaleString("en-ZA") : "";
};

function ProvisionalTaxPage() {
  useToolView("provisional-tax");
  const markStart = useToolStart("provisional-tax");

  const [income, setIncome] = useState<Record<string, string>>({});
  const [expenses, setExpenses] = useState<Record<string, string>>({});
  const [screen, setScreen] = useState<"form" | "results">("form");
  const [result, setResult] = useState<TaxResult | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const nums = useMemo(
    () => ({
      income: Object.fromEntries(Object.entries(income).map(([k, v]) => [k, digits(v)])),
      expenses: Object.fromEntries(Object.entries(expenses).map(([k, v]) => [k, digits(v)])),
    }),
    [income, expenses],
  );

  const live = useMemo(() => computeProvisionalTax(nums), [nums]);

  function calculate() {
    if (live.totalIncome <= 0) {
      setError("Enter at least one income figure — that's what gets taxed.");
      return;
    }
    setError("");
    setResult(live);
    setScreen("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackToolEvent("provisional-tax", "complete", {
      meta: {
        taxableZar: Math.round(live.taxable),
        annualTaxZar: Math.round(live.annualTax),
        belowThreshold: live.belowThreshold,
      },
    });
  }

  const set =
    (which: "income" | "expenses", key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      markStart();
      const fn = which === "income" ? setIncome : setExpenses;
      fn((p) => ({ ...p, [key]: e.target.value }));
    };
  const blur =
    (which: "income" | "expenses", key: string) => (e: React.FocusEvent<HTMLInputElement>) => {
      const fn = which === "income" ? setIncome : setExpenses;
      fn((p) => ({ ...p, [key]: grouped(e.target.value) }));
    };

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <SiteHeader />
      <ToolCanvas>
        <div className="px-5 pt-3 sm:px-6">
          <BackNav to="/tools" label="All tools" />
        </div>

        {screen === "form" && (
          <header className="mx-auto max-w-5xl px-5 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Eyebrow>Creator · Free Tool</Eyebrow>
              <Pill className="whitespace-nowrap">SARS {TAX_YEAR}</Pill>
            </div>
            <h1 className="mt-7 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#1C1C1C] sm:text-[56px]">
              What you actually
              <br />
              owe <span className="text-[#C9A84C]">SARS</span>.
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-[1.65] text-neutral-600 sm:text-[17px]">
              Brand deals, AdSense, TikTok, affiliate — SARS sees all of it from rand one. Put your
              year in, take your deductions off, and get both provisional payments with the dates
              they're due.
            </p>
            <div className="mt-7 h-[3px] w-16 rounded-full bg-[#C9A84C]" />
          </header>
        )}

        {screen === "results" && result && (
          <header className="mx-auto max-w-5xl px-5 pb-8 pt-8 sm:px-6 sm:pt-12">
            <button
              onClick={() => {
                setScreen("form");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mb-5 inline-flex items-center gap-2 text-[13px] font-bold text-neutral-500 transition hover:text-[#1C1C1C]"
            >
              ← Change my figures
            </button>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Eyebrow>Your estimate</Eyebrow>
              <Pill className="whitespace-nowrap">SARS {TAX_YEAR}</Pill>
            </div>
            <h1 className="mt-5 font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#1C1C1C] sm:text-[44px]">
              Here is what to
              <br />
              <span className="text-[#C9A84C]">set aside</span>.
            </h1>
            <div className="mt-6 h-[3px] w-16 rounded-full bg-[#C9A84C]" />
          </header>
        )}

        <main
          className={`mx-auto max-w-5xl px-5 pb-20 sm:px-6 ${screen === "form" ? "" : "hidden"}`}
        >
          <Panel className="mb-4">
            <PanelHeader
              title="What came in"
              step="01"
              hint="Everything you earned this tax year, before expenses. Leave a row blank if it doesn't apply."
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              {INCOME_SOURCES.map((s) => (
                <Field key={s.key} label={`${s.icon}  ${s.label}`} hint={s.hint}>
                  <Input
                    inputMode="numeric"
                    placeholder="0"
                    value={income[s.key] ?? ""}
                    onChange={set("income", s.key)}
                    onBlur={blur("income", s.key)}
                  />
                </Field>
              ))}
            </div>
            <div className="border-t border-neutral-200/80 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[#1C1C1C]">Total income</span>
                <span className="font-display text-[22px] font-extrabold text-[#1C1C1C]">
                  {zar(live.totalIncome)}
                </span>
              </div>
            </div>
          </Panel>

          <Panel className="mb-4">
            <PanelHeader
              title="What you can take off"
              step="02"
              hint="Legitimate business costs reduce what you're taxed on. Most creators claim nothing here and overpay."
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              {EXPENSE_CATEGORIES.map((c) => (
                <Field key={c.key} label={`${c.icon}  ${c.label}`} hint={c.hint}>
                  <Input
                    inputMode="numeric"
                    placeholder="0"
                    value={expenses[c.key] ?? ""}
                    onChange={set("expenses", c.key)}
                    onBlur={blur("expenses", c.key)}
                  />
                </Field>
              ))}
            </div>
            <div className="border-t border-neutral-200/80 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[#1C1C1C]">Total deductions</span>
                <span className="font-display text-[22px] font-extrabold text-[#A98A38]">
                  −{zar(live.totalExpenses)}
                </span>
              </div>
            </div>
          </Panel>

          <Panel className="mb-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[14px] font-bold text-[#1C1C1C]">Taxable income</span>
              <span className="font-display text-[26px] font-extrabold text-[#1C1C1C]">
                {zar(live.taxable)}
              </span>
            </div>
          </Panel>

          {error && (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
              {error}
            </p>
          )}

          <GoldButton onClick={calculate}>Work out what I owe →</GoldButton>
          <p className="mt-3 text-center text-[12px] text-neutral-500">{TAX_YEAR_NOTE}</p>
        </main>

        {screen === "results" && result && (
          <main ref={resultRef} className="mx-auto max-w-5xl px-5 pb-20 sm:px-6">
            <Results result={result} income={nums.income} expenses={nums.expenses} />
          </main>
        )}
      </ToolCanvas>
      <SiteFooter />
    </div>
  );
}

function Results({
  result: r,
  income,
  expenses,
}: {
  result: TaxResult;
  income: Record<string, number>;
  expenses: Record<string, number>;
}) {
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-[#1C1C1C] p-6 sm:p-10">
        <DotGrid dark />
        <GoldGlow className="-bottom-40 -right-24" size={520} opacity={0.75} />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow className="!text-[#C9A84C]">Tax for the year</Eyebrow>
            <Pill tone="gold">{(r.marginalRate * 100).toFixed(0)}% marginal</Pill>
          </div>

          {r.belowThreshold ? (
            <>
              <p className="mt-6 font-display text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white sm:text-[64px]">
                {zar(0)}
              </p>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">
                On {zar(r.taxable)} taxable income you're below the R
                {TAX_THRESHOLD.toLocaleString("en-ZA")} threshold, so your estimated tax is nil. One
                good month changes that — keep the record and re-run it.
              </p>
            </>
          ) : (
            <>
              <p className="mt-6 font-display text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white sm:text-[72px]">
                {zar(r.annualTax)}
              </p>
              <p className="mt-3 text-[14px] text-white/50">
                On {zar(r.taxable)} taxable · {(r.effectiveRate * 100).toFixed(1)}% effective rate
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <PayBox
                  label="1st provisional (IRP6)"
                  value={zar(r.firstPayment)}
                  when="By 31 August"
                  hero
                />
                <PayBox
                  label="2nd provisional (IRP6)"
                  value={zar(r.secondPayment)}
                  when="By the last day of February"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 p-5">
                <Eyebrow className="!text-[#C9A84C]">The habit that makes this painless</Eyebrow>
                <p className="mt-2 font-display text-[20px] font-extrabold text-white sm:text-[24px]">
                  {zar(r.monthlySetAside)} a month, into an account you never spend from.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <Eyebrow tone="muted">Total income</Eyebrow>
          <p className="mt-2 font-display text-[26px] font-extrabold leading-none text-[#1C1C1C]">
            {zar(r.totalIncome)}
          </p>
        </Panel>
        <Panel className="p-5">
          <Eyebrow tone="muted">Deductions claimed</Eyebrow>
          <p className="mt-2 font-display text-[26px] font-extrabold leading-none text-[#A98A38]">
            {zar(r.totalExpenses)}
          </p>
          {r.totalExpenses === 0 && (
            <p className="mt-2 text-[13px] text-neutral-500">
              You claimed nothing. Equipment, data, software and travel are all deductible.
            </p>
          )}
        </Panel>
        <Panel className="p-5">
          <Eyebrow tone="muted">Yours after tax</Eyebrow>
          <p className="mt-2 font-display text-[26px] font-extrabold leading-none text-[#1C1C1C]">
            {zar(r.takeHome)}
          </p>
        </Panel>
      </div>

      {r.vatRegistrationLikely && (
        <Panel className="mt-4 border-[#C9A84C] p-5">
          <Eyebrow>Heads up — VAT</Eyebrow>
          <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-700">
            Your turnover is over R1 000 000, which makes VAT registration compulsory. That's a
            separate registration from income tax — speak to a practitioner this month.
          </p>
        </Panel>
      )}

      <EmailCapture result={r} income={income} expenses={expenses} />

      <BracketTable taxable={r.taxable} />
      <Checklist />

      <section className="relative mt-4 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 sm:p-9">
        <Eyebrow>The part nobody tells creators</Eyebrow>
        <h2 className="mt-3 font-display text-[24px] font-extrabold leading-tight tracking-tight text-[#1C1C1C] sm:text-[30px]">
          I got the letter. R207,879.
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-700">
          I earned from content for years and declared nothing — not because I was hiding, because
          nobody taught me. Then the assessment came. I came forward, corrected it properly, and
          SARS waived <strong>R45,705</strong> in penalties. The final debt was{" "}
          <strong>R162,174</strong>, paid off at about R17,000 a month. It was survivable. Ignorance
          is what's expensive — and you're reading this before your letter arrives.
        </p>
        <Link
          to="/products/$slug"
          params={{ slug: "sars-creator-income" }}
          className="mt-7 inline-flex min-h-[54px] items-center rounded-xl bg-[#1C1C1C] px-8 text-[15px] font-bold text-white transition hover:bg-[#C9A84C] hover:text-[#1C1C1C]"
        >
          Get SARS &amp; Creator Income →
        </Link>
      </section>
    </>
  );
}

function PayBox({
  label,
  value,
  when,
  hero,
}: {
  label: string;
  value: string;
  when: string;
  hero?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${hero ? "border-[#C9A84C] bg-[#C9A84C]" : "border-white/12 bg-white/[0.04]"}`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${hero ? "text-[#1C1C1C]/70" : "text-white/45"}`}
      >
        {label}
      </p>
      <p
        className={`mt-2 font-display text-[28px] font-extrabold leading-none ${hero ? "text-[#1C1C1C]" : "text-white"}`}
      >
        {value}
      </p>
      <p className={`mt-2 text-[12.5px] ${hero ? "text-[#1C1C1C]/65" : "text-white/40"}`}>{when}</p>
    </div>
  );
}

function BracketTable({ taxable }: { taxable: number }) {
  let low = 1;
  const rows = BRACKETS.map((b) => {
    const range =
      b.upTo === Infinity
        ? `R${low.toLocaleString("en-ZA")} and above`
        : `R${low.toLocaleString("en-ZA")} – R${b.upTo.toLocaleString("en-ZA")}`;
    const active = taxable >= low && (b.upTo === Infinity || taxable <= b.upTo);
    low = b.upTo + 1;
    return { range, rate: `${(b.rate * 100).toFixed(0)}%`, active };
  });
  return (
    <Panel className="mt-4 p-5 sm:p-6">
      <Eyebrow tone="muted">{TAX_YEAR} SARS tax table</Eyebrow>
      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
        {rows.map((r) => (
          <div
            key={r.range}
            className={`flex items-center justify-between gap-4 border-b border-neutral-100 px-4 py-2.5 last:border-0 ${
              r.active ? "bg-[#C9A84C]/15" : ""
            }`}
          >
            <span
              className={`text-[13.5px] ${r.active ? "font-bold text-[#1C1C1C]" : "text-neutral-600"}`}
            >
              {r.range}
            </span>
            <span
              className={`text-[13.5px] ${r.active ? "font-bold text-[#1C1C1C]" : "text-neutral-600"}`}
            >
              {r.rate}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-neutral-500">
        Primary rebate {zar(PRIMARY_REBATE)} · Tax threshold {zar(TAX_THRESHOLD)} · your band is
        highlighted. {TAX_YEAR_NOTE}
      </p>
    </Panel>
  );
}

const CHECKLIST_KEY = "chkplt-tax-checklist-v1";

function Checklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* storage blocked — the checklist still works, it just won't persist */
    }
  }, []);
  const toggle = (id: string) =>
    setDone((p) => {
      const next = { ...p, [id]: !p[id] };
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  const total = CHECKLIST.length;
  const complete = CHECKLIST.filter((c) => done[c.id]).length;
  const categories = [...new Set(CHECKLIST.map((c) => c.category))];

  return (
    <Panel className="mt-4">
      <PanelHeader
        title="Your compliance checklist"
        hint="Fifteen things that keep SARS off your back. Ticks are saved on this device."
      />
      <div className="px-5 pt-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-bold text-[#1C1C1C]">
            {complete} of {total} done
          </span>
          <span className="text-[13px] font-bold text-[#A98A38]">
            {Math.round((complete / total) * 100)}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-[#C9A84C] transition-[width] duration-500"
            style={{ width: `${(complete / total) * 100}%` }}
          />
        </div>
      </div>
      <div className="space-y-6 p-5 sm:p-6">
        {categories.map((cat) => (
          <div key={cat}>
            <Eyebrow tone="muted">{cat}</Eyebrow>
            <div className="mt-3 space-y-2">
              {CHECKLIST.filter((c) => c.category === cat).map((item) => {
                const checked = !!done[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-pressed={checked}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                      checked
                        ? "border-[#C9A84C] bg-[#C9A84C]/10"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        checked ? "border-[#C9A84C] bg-[#C9A84C]" : "border-neutral-300 bg-white"
                      }`}
                    >
                      {checked && (
                        <svg
                          viewBox="0 0 12 12"
                          className="h-3 w-3 text-[#1C1C1C]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            d="M2.5 6.5l2.5 2.5 4.5-5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={`text-[14px] font-bold leading-snug ${checked ? "text-neutral-400 line-through" : "text-[#1C1C1C]"}`}
                        >
                          {item.title}
                        </span>
                        {item.priority === "High" && !checked && (
                          <span className="rounded-full bg-[#1C1C1C] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                            High
                          </span>
                        )}
                        {item.when && (
                          <span className="text-[11.5px] font-bold text-[#A98A38]">
                            {item.when}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-[12.5px] leading-snug text-neutral-500">
                        {item.detail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function EmailCapture({
  result: r,
  income,
  expenses,
}: {
  result: TaxResult;
  income: Record<string, number>;
  expenses: Record<string, number>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [msg, setMsg] = useState("");

  async function send() {
    if (!name.trim()) return setMsg("Enter your name — it goes on the document.");
    if (!email.includes("@")) return setMsg("Enter a valid email address.");
    setMsg("");
    setState("sending");
    try {
      const res = await fetch("/api/public/provisional-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, income, expenses }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) throw new Error("send-failed");
      setState("sent");
      trackToolEvent("provisional-tax", "lead", { email });
    } catch {
      setState("idle");
      setMsg(
        "We couldn't send that just now. Check the email address and try again — if it keeps failing, reply to any of our emails and we'll send it manually.",
      );
    }
  }

  if (state === "sent") {
    return (
      <Panel raised className="mt-4 p-6 text-center sm:p-8">
        <p className="font-display text-[22px] font-extrabold text-[#1C1C1C]">Check your inbox.</p>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-neutral-600">
          Your estimate is on its way to <strong>{email}</strong> — the full breakdown, the SARS
          bracket table and both payment dates, as a PDF you can forward to an accountant.
        </p>
      </Panel>
    );
  }

  return (
    <Panel raised className="mt-4 p-5 sm:p-7">
      <Eyebrow>Keep the record</Eyebrow>
      <h3 className="mt-3 font-display text-[22px] font-bold tracking-tight text-[#1C1C1C] sm:text-[26px]">
        Email me this estimate as a PDF.
      </h3>
      <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-neutral-600">
        A one-page document with your figures, the bracket table and both IRP6 dates — built to
        forward straight to an accountant, or to keep for your own filing.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {msg && <p className="mt-3 text-[14px] font-semibold text-red-600">{msg}</p>}
      <GoldButton onClick={send} disabled={state === "sending"} className="mt-4">
        {state === "sending" ? "Building your PDF…" : "Email me the PDF →"}
      </GoldButton>
      <p className="mt-3 text-[12px] text-neutral-500">
        Free. No spam — your estimate, and the odd thing worth reading.
      </p>
    </Panel>
  );
}
