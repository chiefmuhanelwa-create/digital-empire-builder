// INVOICE ENGINE — pure, client-safe, no AI.
//
// The Deal Tracker opens a loop: invoiced → due → chased → paid. Until now
// there was nothing in this product that could actually produce the invoice —
// the tools hub linked out to a separate Vercel app, which meant leaving the
// place where the deal lives to make the document that gets you paid.
//
// From the agency archive, this is what an SA brand-deal invoice has to carry:
//   · Invoice goes to the AGENCY's billing contact, not the brand.
//   · Payment is EFT, at end of month, after the campaign ends — so a campaign
//     finishing on the 2nd can mean waiting the better part of two months.
//   · Banking details are what makes it payable. An invoice without them
//     bounces back and restarts the clock.
//
// VAT is off by default and that is deliberate. South African registration is
// compulsory above R1m turnover; at the fees in this archive most creators are
// well below it, and charging VAT while unregistered is an offence rather than
// a formatting choice.

export const VAT_RATE = 0.15;

export type InvoiceSettings = {
  trading_name: string | null;
  legal_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  is_vat_registered: boolean;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
  branch_code: string | null;
  account_type: string | null;
  payment_terms_days: number;
  invoice_prefix: string;
  next_invoice_number: number;
  notes: string | null;
};

export type InvoiceLine = { description: string; quantity: number; unitPrice: number };

export type Invoice = {
  number: string;
  issuedOn: string;
  dueOn: string;
  billTo: string;
  reference: string;
  lines: InvoiceLine[];
  subtotal: number;
  vat: number;
  total: number;
  vatApplied: boolean;
};

export function invoiceNumber(settings: Pick<InvoiceSettings, "invoice_prefix" | "next_invoice_number">) {
  const prefix = (settings.invoice_prefix || "INV").trim().toUpperCase();
  return `${prefix}-${String(settings.next_invoice_number).padStart(4, "0")}`;
}

/** Agencies pay end of month, not net-30 from the invoice date. Terms of 30
 *  days from the 3rd is really the 30th; from the 28th it is the following
 *  month. Both are normal and the difference is worth showing before you send. */
export function dueDate(issued: string, termsDays: number): string {
  const d = new Date(`${issued}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + termsDays);
  return d.toISOString().slice(0, 10);
}

export function endOfMonthAfter(issued: string): string {
  const d = new Date(`${issued}T00:00:00Z`);
  // last day of the month the invoice lands in
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
}

export function buildInvoice(args: {
  settings: InvoiceSettings;
  billTo: string;
  reference: string;
  lines: InvoiceLine[];
  issuedOn: string;
  useEndOfMonth?: boolean;
}): Invoice {
  const lines = args.lines.filter((l) => l.description.trim() && l.quantity > 0);
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const vatApplied = args.settings.is_vat_registered && !!args.settings.vat_number?.trim();
  const vat = vatApplied ? Math.round(subtotal * VAT_RATE * 100) / 100 : 0;

  return {
    number: invoiceNumber(args.settings),
    issuedOn: args.issuedOn,
    dueOn: args.useEndOfMonth
      ? endOfMonthAfter(args.issuedOn)
      : dueDate(args.issuedOn, args.settings.payment_terms_days),
    billTo: args.billTo,
    reference: args.reference,
    lines,
    subtotal,
    vat,
    total: subtotal + vat,
    vatApplied,
  };
}

/** What is missing before this can be sent. An invoice that cannot be paid is
 *  worse than no invoice: it restarts the clock and looks unprofessional at
 *  the exact moment you are asking for money. */
export function invoiceBlockers(s: InvoiceSettings): string[] {
  const out: string[] = [];
  if (!s.trading_name?.trim() && !s.legal_name?.trim()) out.push("Your name or trading name");
  if (!s.contact_email?.trim()) out.push("A contact email — agencies query invoices by reply");
  if (!s.bank_name?.trim()) out.push("Bank name");
  if (!s.account_holder?.trim()) out.push("Account holder");
  if (!s.account_number?.trim()) out.push("Account number");
  if (!s.branch_code?.trim()) out.push("Branch code");
  if (s.is_vat_registered && !s.vat_number?.trim())
    out.push("A VAT number — you have marked yourself VAT registered, and charging VAT without one is not allowed");
  return out;
}

export function rand(n: number) {
  return `R${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Plain-text invoice. Deliberately not a PDF: it can be pasted into an email
 *  body, which is how agency billing contacts actually receive these, and it
 *  cannot silently fail to render on someone else's machine. */
export function renderInvoiceText(inv: Invoice, s: InvoiceSettings): string {
  const from = [
    s.trading_name?.trim() || s.legal_name?.trim(),
    s.legal_name?.trim() && s.trading_name?.trim() ? s.legal_name.trim() : null,
    s.registration_number?.trim() ? `Reg: ${s.registration_number.trim()}` : null,
    inv.vatApplied ? `VAT: ${s.vat_number?.trim()}` : null,
    s.address?.trim(),
    s.contact_email?.trim(),
    s.contact_phone?.trim(),
  ].filter(Boolean).join("\n");

  const items = inv.lines
    .map((l) => `  ${l.quantity} × ${l.description}\n     ${rand(l.unitPrice)} each — ${rand(l.quantity * l.unitPrice)}`)
    .join("\n");

  const totals = [
    `  Subtotal        ${rand(inv.subtotal)}`,
    inv.vatApplied ? `  VAT @ 15%       ${rand(inv.vat)}` : null,
    `  TOTAL DUE       ${rand(inv.total)}`,
  ].filter(Boolean).join("\n");

  const banking = [
    `  Bank            ${s.bank_name?.trim() ?? ""}`,
    `  Account holder  ${s.account_holder?.trim() ?? ""}`,
    `  Account number  ${s.account_number?.trim() ?? ""}`,
    `  Branch code     ${s.branch_code?.trim() ?? ""}`,
    s.account_type?.trim() ? `  Account type    ${s.account_type.trim()}` : null,
    `  Reference       ${inv.number}`,
  ].filter(Boolean).join("\n");

  return `INVOICE ${inv.number}

FROM
${from}

TO
${inv.billTo}

Issued   ${inv.issuedOn}
Due      ${inv.dueOn}
Ref      ${inv.reference}

ITEMS
${items}

${totals}

PAYMENT — EFT
${banking}
${s.notes?.trim() ? `\nNOTES\n  ${s.notes.trim()}` : ""}`;
}
