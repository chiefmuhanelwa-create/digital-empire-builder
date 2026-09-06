import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { getInvoiceSettings, saveInvoiceSettings, consumeInvoiceNumber } from "@/lib/invoice.functions";
import { listDeals } from "@/lib/deals.functions";
import {
  buildInvoice, invoiceBlockers, renderInvoiceText, invoiceNumber, dueDate, endOfMonthAfter, rand,
  type InvoiceSettings, type InvoiceLine,
} from "@/lib/invoice-engine";
import type { Deal } from "@/lib/deals-chase-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Copy, FileText, Settings2, ArrowRight, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/invoice")({
  head: () => ({ meta: [{ title: "Invoice — Contentpreneur Africa" }] }),
  component: Page,
});

const BLANK: InvoiceSettings = {
  trading_name: "", legal_name: "", registration_number: "", vat_number: "",
  is_vat_registered: false, address: "", contact_email: "", contact_phone: "",
  bank_name: "", account_holder: "", account_number: "", branch_code: "", account_type: "",
  payment_terms_days: 30, invoice_prefix: "INV", next_invoice_number: 1, notes: "",
};

function Page() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Tool />;
}

function Tool() {
  const qc = useQueryClient();
  const getFn = useServerFn(getInvoiceSettings);
  const saveFn = useServerFn(saveInvoiceSettings);
  const consumeFn = useServerFn(consumeInvoiceNumber);
  const dealsFn = useServerFn(listDeals);

  const { data: sData, isLoading } = useQuery({ queryKey: ["invoice-settings"], queryFn: () => getFn() });
  const { data: dData } = useQuery({ queryKey: ["deals", "all"], queryFn: () => dealsFn({ data: { status: "all" } }) });

  const [s, setS] = useState<InvoiceSettings>(BLANK);
  const [showSettings, setShowSettings] = useState(false);
  const [dealId, setDealId] = useState("");
  const [billTo, setBillTo] = useState("");
  const [issuedOn, setIssuedOn] = useState(new Date().toISOString().slice(0, 10));
  const [useEOM, setUseEOM] = useState(true);
  const [lines, setLines] = useState<InvoiceLine[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [rendered, setRendered] = useState<string | null>(null);

  useEffect(() => {
    if (sData?.settings) setS({ ...BLANK, ...(sData.settings as Partial<InvoiceSettings>) });
    else if (sData && !sData.settings) setShowSettings(true);
  }, [sData]);

  // Deals ready to invoice — accepted or delivered, not yet invoiced. This is
  // the list the Deal Tracker flags as the quietest leak in the product.
  const invoiceable = useMemo(
    () => ((dData?.deals ?? []) as Deal[]).filter((d) => ["accepted", "delivered"].includes(d.status)),
    [dData],
  );

  function loadDeal(id: string) {
    setDealId(id);
    const d = invoiceable.find((x) => x.id === id);
    if (!d) return;
    setBillTo(d.counterparty);
    setLines([{ description: d.deliverable, quantity: 1, unitPrice: d.amount }]);
  }

  const save = useMutation({
    mutationFn: () => saveFn({ data: s }),
    onSuccess: () => { toast.success("Saved"); setShowSettings(false); qc.invalidateQueries({ queryKey: ["invoice-settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const blockers = useMemo(() => invoiceBlockers(s), [s]);

  const preview = useMemo(() => {
    if (blockers.length) return null;
    return buildInvoice({ settings: s, billTo, reference: billTo, lines, issuedOn, useEndOfMonth: useEOM });
  }, [s, billTo, lines, issuedOn, useEOM, blockers.length]);

  async function generate() {
    if (!billTo.trim()) return toast.error("Who is this invoice going to?");
    if (!preview || preview.lines.length === 0) return toast.error("Add at least one line item");
    setRendered(renderInvoiceText(preview, s));
    try {
      const r = await consumeFn();
      setS((prev) => ({ ...prev, next_invoice_number: r.next_invoice_number }));
      qc.invalidateQueries({ queryKey: ["invoice-settings"] });
    } catch { /* number stays; the invoice is still valid */ }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Invoice</h1>
            <p className="text-muted-foreground max-w-xl">
              Bill a deal without leaving the place it lives. Agencies pay by EFT, end of month —
              so the details that make it payable matter more than how it looks.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings((v) => !v)}>
            <Settings2 className="mr-1 h-4 w-4" />Details
          </Button>
        </header>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}

        {blockers.length > 0 && !showSettings && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <p className="font-semibold text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />This invoice cannot be paid yet
            </p>
            <ul className="text-sm mt-1.5 space-y-0.5">{blockers.map((b) => <li key={b}>· {b}</li>)}</ul>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowSettings(true)}>Add them</Button>
          </div>
        )}

        {showSettings && (
          <section className="rounded-lg border p-5 space-y-4">
            <h2 className="font-semibold">Your details — entered once</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <F label="Trading name"><Input value={s.trading_name ?? ""} onChange={(e) => setS({ ...s, trading_name: e.target.value })} /></F>
              <F label="Legal / registered name"><Input value={s.legal_name ?? ""} onChange={(e) => setS({ ...s, legal_name: e.target.value })} /></F>
              <F label="Company reg number (optional)"><Input value={s.registration_number ?? ""} onChange={(e) => setS({ ...s, registration_number: e.target.value })} /></F>
              <F label="Contact email"><Input value={s.contact_email ?? ""} onChange={(e) => setS({ ...s, contact_email: e.target.value })} /></F>
              <F label="Contact phone"><Input value={s.contact_phone ?? ""} onChange={(e) => setS({ ...s, contact_phone: e.target.value })} /></F>
              <F label="Address"><Input value={s.address ?? ""} onChange={(e) => setS({ ...s, address: e.target.value })} /></F>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Banking — what makes it payable</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <F label="Bank"><Input value={s.bank_name ?? ""} onChange={(e) => setS({ ...s, bank_name: e.target.value })} /></F>
                <F label="Account holder"><Input value={s.account_holder ?? ""} onChange={(e) => setS({ ...s, account_holder: e.target.value })} /></F>
                <F label="Account number"><Input value={s.account_number ?? ""} onChange={(e) => setS({ ...s, account_number: e.target.value })} /></F>
                <F label="Branch code"><Input value={s.branch_code ?? ""} onChange={(e) => setS({ ...s, branch_code: e.target.value })} /></F>
                <F label="Account type"><Input value={s.account_type ?? ""} onChange={(e) => setS({ ...s, account_type: e.target.value })} placeholder="Cheque / Savings" /></F>
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4" checked={s.is_vat_registered}
                  onChange={(e) => setS({ ...s, is_vat_registered: e.target.checked })} />
                <span>
                  <span className="font-medium">I am VAT registered</span>
                  <span className="block text-xs text-muted-foreground">
                    Leave this off unless you actually are. SA registration is compulsory above R1m turnover,
                    and charging VAT without a number is an offence, not a formatting choice.
                  </span>
                </span>
              </label>
              {s.is_vat_registered && (
                <F label="VAT number"><Input value={s.vat_number ?? ""} onChange={(e) => setS({ ...s, vat_number: e.target.value })} /></F>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <F label="Invoice prefix"><Input value={s.invoice_prefix} onChange={(e) => setS({ ...s, invoice_prefix: e.target.value })} /></F>
              <F label="Next number"><Input type="number" min="1" value={s.next_invoice_number} onChange={(e) => setS({ ...s, next_invoice_number: Number(e.target.value) || 1 })} /></F>
              <F label="Payment terms (days)"><Input type="number" min="0" max="180" value={s.payment_terms_days} onChange={(e) => setS({ ...s, payment_terms_days: Number(e.target.value) || 0 })} /></F>
            </div>

            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save details"}</Button>
          </section>
        )}

        <section className="rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold">The invoice</h2>

          {invoiceable.length > 0 && (
            <F label="Bill a deal that is delivered but not yet invoiced">
              <select value={dealId} onChange={(e) => loadDeal(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Choose a deal…</option>
                {invoiceable.map((d) => (
                  <option key={d.id} value={d.id}>{d.counterparty} — {d.deliverable} — {rand(d.amount)}</option>
                ))}
              </select>
            </F>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Bill to — the agency's billing contact, not the brand">
              <Input value={billTo} onChange={(e) => setBillTo(e.target.value)} placeholder="Agency name / billing entity" />
            </F>
            <F label="Issued on"><Input type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} /></F>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={useEOM} onChange={(e) => setUseEOM(e.target.checked)} />
            <span>
              <span className="font-medium">Due end of month</span>
              <span className="block text-xs text-muted-foreground">
                The observed agency norm. Due {useEOM ? endOfMonthAfter(issuedOn) : dueDate(issuedOn, s.payment_terms_days)}
                {useEOM ? "" : ` — ${s.payment_terms_days} days`}.
              </span>
            </span>
          </label>

          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_5rem_8rem_2rem] sm:items-end">
                <F label={i === 0 ? "Description" : ""}>
                  <Input value={l.description} onChange={(e) => { const n = [...lines]; n[i] = { ...l, description: e.target.value }; setLines(n); }} placeholder="1× Instagram reel" />
                </F>
                <F label={i === 0 ? "Qty" : ""}>
                  <Input type="number" min="1" value={l.quantity} onChange={(e) => { const n = [...lines]; n[i] = { ...l, quantity: Number(e.target.value) || 1 }; setLines(n); }} />
                </F>
                <F label={i === 0 ? "Unit price" : ""}>
                  <Input type="number" step="0.01" min="0" value={l.unitPrice} onChange={(e) => { const n = [...lines]; n[i] = { ...l, unitPrice: Number(e.target.value) || 0 }; setLines(n); }} />
                </F>
                <Button type="button" variant="ghost" size="sm" onClick={() => setLines(lines.filter((_, j) => j !== i))} disabled={lines.length === 1}>×</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { description: "", quantity: 1, unitPrice: 0 }])}>Add line</Button>
          </div>

          {preview && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-0.5 tabular-nums">
              <p className="flex justify-between"><span className="text-muted-foreground">Number</span><span>{invoiceNumber(s)}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{rand(preview.subtotal)}</span></p>
              {preview.vatApplied && <p className="flex justify-between"><span className="text-muted-foreground">VAT @ 15%</span><span>{rand(preview.vat)}</span></p>}
              <p className="flex justify-between font-semibold pt-1 border-t"><span>Total due</span><span>{rand(preview.total)}</span></p>
            </div>
          )}

          <Button onClick={generate} disabled={blockers.length > 0}>
            <FileText className="mr-1 h-4 w-4" />Generate invoice
          </Button>
        </section>

        {rendered && (
          <section className="rounded-lg border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Ready to send</h2>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(rendered); toast.success("Copied"); }}>
                <Copy className="mr-1 h-3.5 w-3.5" />Copy
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/40 rounded-md p-4 overflow-x-auto">{rendered}</pre>
            <p className="text-xs text-muted-foreground">
              Paste it into the email body. Agency billing contacts reply to invoices with queries —
              a document they can read without opening an attachment gets answered faster.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to="/apps/deals">Mark the deal invoiced <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </section>
        )}
      </div>
    </Shell>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      {children}
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader /><main className="flex-1">{children}</main><SiteFooter />
    </div>
  );
}

function Locked() {
  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-3">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Invoice</h1>
        <p className="text-muted-foreground">Part of the Foundation Kit. Bill a deal without leaving the app.</p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
