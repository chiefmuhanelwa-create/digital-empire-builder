import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { readOffer, EMPTY_OFFER, invoiceLineItem, type Offer } from "@/lib/offer-spine";
import { Lock, ArrowRight, Copy, Printer, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/money-split")({
  head: () => ({ meta: [{ title: "The Money Split — Contentpreneur Africa" }] }),
  component: MoneySplit,
});

// TOOL 08 · THE MONEY SPLIT — and the only tool covering Accelerator Phase 7.
//
// WHY THIS ONE MATTERS DISPROPORTIONATELY
// =======================================
// Phase 7 (Creator Finance) is the strongest differentiated material in the whole
// programme — the strategic analysis found zero competitors in the category — and
// it had almost no tool coverage. `sars-calculator` computes a 25% RESERVE, which
// is only the SARS half; the canonical framework is the 35% Rule: 25% for SARS,
// 10% back into the business, 65% actually yours. A creator who reserves 25% and
// spends the rest still has nothing to reinvest.
//
// PROOF FIGURES. R207,879.20 assessed — that is the ONLY figure that survives
// both versions of this story on record, so it is the only one this page states.
// Never R285,000 (unverified) and never R207,869 (a transcription error).
//
// DO NOT REINSTATE A REPAYMENT CLAIM. Founder correction 2026-08-20: no payments
// have started. The earlier copy said the debt was paid off over eleven months —
// it was not. PROOF.md independently bans that claim and the final-debt figure.
// The lesson here is the reserve rule, not a repayment success story, and it is
// stronger for being unfinished: the debt is still being carried.
//
// NO IDENTIFIERS. No SARS reference, no VDP number, no practitioner's name — the
// story teaches without them, and publishing them into a customer-facing tool
// would be indefensible.

const SARS_RATE = 0.25;
const BUSINESS_RATE = 0.10;

const rand = (n: number) =>
  `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function MoneySplit() {
  const { access } = useKitAccess();
  const [amount, setAmount] = useState<number | null>(null);
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);

  // Invoice fields
  const [biz, setBiz] = useState("");
  const [reg, setReg] = useState("");
  const [client, setClient] = useState("");
  const [ref, setRef] = useState("");
  const [deposit, setDeposit] = useState(true);
  const [vatReg, setVatReg] = useState(false);

  useEffect(() => setOffer(readOffer()), []);

  const split = useMemo(() => {
    if (!amount || amount <= 0) return null;
    const sars = amount * SARS_RATE;
    const business = amount * BUSINESS_RATE;
    return { sars, business, yours: amount - sars - business };
  }, [amount]);

  const lineItem = invoiceLineItem(offer) ?? "";

  const invoiceText = useMemo(() => {
    const today = new Date().toLocaleDateString("en-ZA");
    return [
      `${biz || "[Your business name]"}`,
      `${reg ? `Registration / ID: ${reg}` : "Registration / ID: [required — an invoice without it is not a real invoice]"}`,
      "",
      `INVOICE ${ref || "[reference number]"}`,
      `Date: ${today}`,
      `Payment terms: 30 days from date of invoice`,
      "",
      `Billed to: ${client || "[Client name]"}`,
      `Purchase order: [PO number, if they use one]`,
      "",
      "DESCRIPTION",
      lineItem || "[What they are paying for — the deliverable, not your hours]",
      "",
      `Amount due: ${amount ? rand(amount) : "[amount]"}`,
      vatReg ? "VAT @ 15%: [calculate]" : "(Not VAT registered — no VAT charged.)",
      deposit ? "\n50% deposit payable before work begins. Balance on delivery." : "",
      "",
      "Banking details:",
      "[Account name / Bank / Account number / Branch code]",
    ]
      .filter((l) => l !== undefined)
      .join("\n");
  }, [biz, reg, client, ref, deposit, vatReg, amount, lineItem]);

  const copy = (t: string, what: string) =>
    navigator.clipboard.writeText(t).then(
      () => toast.success(`${what} copied`),
      () => toast.error("Could not copy"),
    );

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The Money Split is part of the Foundation Kit.</h2>
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
          <Link to="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">
            ← Your Clarity System
          </Link>
          <p className="nx-label mt-4">Tool 08 · the day money lands</p>
          <h1 className="mt-2">The Money Split</h1>
          <p className="nx-body max-w-xl mt-3">
            What to do the moment money arrives, and what makes an invoice a real one.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
        {/* The receipt. The lesson lands harder with one attached. */}
        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-white">
          <p className="nx-label text-[var(--nx-gold-bright)]">Why I teach this first</p>
          <h2 className="text-white text-2xl mt-2">I got the number wrong for three years.</h2>
          <p className="text-[#C8C2B4] mt-3 leading-relaxed">
            The money came in and it all felt like mine. It was not. SARS assessed me{" "}
            <strong className="text-white">R207,879.20</strong> for 2020–2022 — tax I had already
            spent.
          </p>
          <p className="text-[#C8C2B4] mt-2 leading-relaxed">
            I came forward and corrected it rather than hiding. I am still carrying that debt today
            — it did not disappear, and no amount of working harder afterwards made it cheaper.
          </p>
          <p className="text-[#C8C2B4] mt-3 leading-relaxed">
            Not one rand of that was unaffordable at the time it was earned. It only became
            unaffordable because I treated all of it as income.
          </p>
        </div>

        {/* The 35% Rule */}
        <div className="nx-card !p-6">
          <p className="nx-label">The 35% Rule</p>
          <h2 className="text-2xl mt-1">Split it the day it lands. Not at year end.</h2>
          <p className="nx-body mt-2">
            Twenty-five percent is not yours — it is SARS&apos;s, being held by you. Ten percent is
            the business&apos;s, so the next thing can be built without borrowing. What is left is
            actually yours, and you can spend it without checking.
          </p>

          <div className="mt-5 flex items-center gap-2">
            <span className="font-display text-2xl text-[var(--text-dim)]">R</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount ?? ""}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : null)}
              placeholder="What just landed"
              className="w-56 rounded-lg border border-[var(--border-mid)] bg-white p-3 font-display text-2xl focus:border-[var(--nx-gold)] focus:outline-none"
            />
          </div>

          {split && (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Not yours — SARS", split.sars, "25%", "#9A3412"],
                  ["Back into the business", split.business, "10%", "var(--nx-gold-text)"],
                  ["Actually yours", split.yours, "65%", "#15803D"],
                ].map(([label, val, pct, colour]) => (
                  <div key={label as string} className="rounded-xl border border-[var(--border)] bg-white p-4">
                    <div className="nx-label">{label as string}</div>
                    <div className="font-display text-2xl mt-1" style={{ color: colour as string }}>
                      {rand(val as number)}
                    </div>
                    <div className="text-xs text-[var(--text-subtle)] mt-0.5">{pct as string}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-[var(--text-body)]">
                Move the {rand(split.sars)} to a separate account <em>today</em>. Not a mental note
                — a different account you do not carry a card for. The reserve only works if
                spending it requires a deliberate act.
              </p>
            </>
          )}
        </div>

        {/* The invoice */}
        <div className="nx-card !p-6">
          <p className="nx-label">What makes an invoice real</p>
          <h2 className="text-2xl mt-1">Most creators send a WhatsApp message and call it billing.</h2>
          <p className="nx-body mt-2">
            An invoice missing a registration number, terms and a reference is not a document a
            finance department can pay. It sits in someone&apos;s inbox and you assume they are
            ignoring you.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Your business name" v={biz} set={setBiz} ph="NOCHILL PTY LTD" />
            <Field label="Registration or ID number" v={reg} set={setReg} ph="2016/507839/07" />
            <Field label="Client" v={client} set={setClient} ph="Who is paying" />
            <Field label="Invoice reference" v={ref} set={setRef} ph="INV-2026-001" />
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={deposit} onChange={(e) => setDeposit(e.target.checked)} />
              50% deposit before work begins
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={vatReg} onChange={(e) => setVatReg(e.target.checked)} />
              I am VAT registered
            </label>
          </div>

          {lineItem && (
            <p className="mt-4 text-sm text-[var(--text-dim)]">
              The description below came from your Offer Blueprint. You are billing for the
              deliverable, not for hours.
            </p>
          )}

          <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 font-mono text-[13px] leading-relaxed text-[var(--text-body)]">
            {invoiceText}
          </pre>

          <div className="mt-4 flex flex-wrap gap-4">
            <button onClick={() => copy(invoiceText, "Invoice")} className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
              <Copy className="size-4" /> Copy the invoice
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)] hover:text-foreground">
              <Printer className="size-4" /> Print
            </button>
          </div>
        </div>

        {/* The two warnings that cost the most */}
        <div className="rounded-2xl border-2 border-[#EA580C] bg-[#EA580C]/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 text-[#9A3412] mt-0.5" />
            <div>
              <h2 className="font-display text-xl text-[#9A3412]">Two things to check today</h2>
              <p className="text-sm text-[#7C2D12] mt-2 leading-relaxed">
                <strong>Do not write VAT on an invoice unless you are registered.</strong> Charging
                VAT you are not registered to collect is not a paperwork slip — it is money you took
                that was never yours, and it compounds quietly until someone asks for it.
              </p>
              <p className="text-sm text-[#7C2D12] mt-2 leading-relaxed">
                <strong>Check whether your turnover has crossed R1 million in any twelve
                months.</strong> At that point VAT registration stops being optional. Most creators
                find out late, and late is the expensive way to find out.
              </p>
            </div>
          </div>
        </div>

        <div className="nx-card !p-5">
          <p className="nx-body">
            Once money is landing regularly, the next question is what you can legitimately deduct —
            and both SARS tools are already built and free.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <a href="/provisional-tax" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
              Work out what you actually owe <ArrowRight className="size-3.5" />
            </a>
            <a href="/sars-calculator" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
              The reserve calculator <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </main>
    </Shell>
  );
}

function Field({ label, v, set, ph }: { label: string; v: string; set: (s: string) => void; ph: string }) {
  return (
    <div>
      <label className="nx-label">{label}</label>
      <input
        value={v}
        onChange={(e) => set(e.target.value)}
        placeholder={ph}
        className="mt-1 w-full rounded-lg border border-[var(--border-mid)] bg-white p-3 text-[15px] focus:border-[var(--nx-gold)] focus:outline-none"
      />
    </div>
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
