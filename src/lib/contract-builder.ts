// THE CONTRACT BUILDER — pure, client-safe, no AI.
//
// Most creator "contracts" in the archive are an email thread. The fee is in
// one message, the deliverables in another, and the usage rights are nowhere —
// which is exactly how a post fee turns into twelve months of paid media for
// free.
//
// This does two things that a template download cannot:
//
//   1. It writes the agreement in plain language, covering the terms the Brief
//      Check found missing, so the document and the questions come from the
//      same twelve fields.
//
//   2. It PRICES the rights clauses while you are agreeing to them. Usage and
//      whitelisting have published multipliers in this product's own rate card
//      — paid usage for twelve months is +300% of base, whitelisting for 60
//      days is +80%. So the builder can say: you agreed to R8,000, and the
//      rights you signed away are worth R24,000 more. That number arrives
//      before signature instead of after.
//
// It is a plain-language agreement, not legal advice, and it says so on the
// document. For anything with real money or real risk on it, a lawyer reads it.

import { USAGE_DURATION, WHITELISTING } from "@/lib/rate-card-engine";

export type UsageKey = "organic_only" | "organic_12mo" | keyof typeof USAGE_DURATION;
export type WhitelistKey = "none" | keyof typeof WHITELISTING;

export const USAGE_OPTIONS: { key: UsageKey; label: string; pct: number; note: string }[] = [
  {
    key: "organic_only",
    label: "Organic only — 30 days, brand's own channels",
    pct: 0,
    note: "The narrowest grant, and the one to default to. Anything wider is a separate thing you are selling.",
  },
  {
    key: "organic_12mo",
    label: "Organic only — 12 months, brand's own channels",
    pct: 15,
    note: "Still no ad spend behind it, but the brand keeps the asset for a year. Modest, and worth naming.",
  },
  { key: "paid_3mo", label: USAGE_DURATION.paid_3mo.label, pct: USAGE_DURATION.paid_3mo.pct, note: "The brand runs your content as their advertising. This is a media buy using your face." },
  { key: "paid_6mo", label: USAGE_DURATION.paid_6mo.label, pct: USAGE_DURATION.paid_6mo.pct, note: "Six months of paid distribution. Nearly double the base fee on its own." },
  { key: "paid_12mo", label: USAGE_DURATION.paid_12mo.label, pct: USAGE_DURATION.paid_12mo.pct, note: "A year of paid media. Worth three times the post itself — never give it away inside a post fee." },
];

export const WHITELIST_OPTIONS: { key: WhitelistKey; label: string; pct: number }[] = [
  { key: "none", label: "No whitelisting", pct: 0 },
  { key: "wl_30d", label: WHITELISTING.wl_30d.label, pct: WHITELISTING.wl_30d.pct },
  { key: "wl_60d", label: WHITELISTING.wl_60d.label, pct: WHITELISTING.wl_60d.pct },
];

export type ContractTerms = {
  // Parties
  creatorName: string;
  creatorEntity: string;
  brandName: string;
  agencyName: string;
  /** Who is actually contracting and paying. Usually the agency. */
  contractingParty: "agency" | "brand";

  // Commercials
  fee: number;
  currency: string;
  depositPct: number;
  paymentTermsDays: number;
  endOfMonthTerms: boolean;

  // Scope
  deliverables: string;
  goLiveDate: string;
  draftDueDate: string;
  revisionRounds: number;

  // Rights
  usage: UsageKey;
  whitelisting: WhitelistKey;
  exclusivityMonths: number;
  exclusivityScope: string;

  // Protections
  killFeePct: number;
  disclosure: boolean;
  latePaymentInterest: boolean;
};

export const DEFAULT_TERMS: ContractTerms = {
  creatorName: "",
  creatorEntity: "",
  brandName: "",
  agencyName: "",
  contractingParty: "agency",
  fee: 0,
  currency: "ZAR",
  depositPct: 50,
  paymentTermsDays: 30,
  endOfMonthTerms: true,
  deliverables: "",
  goLiveDate: "",
  draftDueDate: "",
  revisionRounds: 2,
  usage: "organic_only",
  whitelisting: "none",
  exclusivityMonths: 0,
  exclusivityScope: "",
  killFeePct: 50,
  disclosure: true,
  latePaymentInterest: true,
};

export type RightsValuation = {
  /** Percentage of base fee the granted rights are worth. */
  totalPct: number;
  /** Currency value of those rights at the stated fee. */
  value: number;
  lines: { label: string; pct: number; value: number }[];
  /** What the engagement is worth with the rights priced in. */
  impliedTotal: number;
};

/** What the rights you are granting are worth, using this product's own
 *  published multipliers. The point is not to renegotiate every deal — it is
 *  that the number should be visible at the moment of signing. */
export function valueRights(terms: ContractTerms): RightsValuation {
  const base = Math.max(0, terms.fee);
  const lines: RightsValuation["lines"] = [];

  const usage = USAGE_OPTIONS.find((u) => u.key === terms.usage);
  if (usage && usage.pct > 0) {
    lines.push({ label: usage.label, pct: usage.pct, value: (base * usage.pct) / 100 });
  }

  const wl = WHITELIST_OPTIONS.find((w) => w.key === terms.whitelisting);
  if (wl && wl.pct > 0) {
    lines.push({ label: wl.label, pct: wl.pct, value: (base * wl.pct) / 100 });
  }

  // Exclusivity is not in the rate card's add-on tables, because it is not a
  // deliverable — it is the deals you are prevented from taking. Priced here at
  // 10% of base per month locked, which is deliberately conservative against
  // the observed four-month category-wide clauses.
  if (terms.exclusivityMonths > 0) {
    const pct = terms.exclusivityMonths * 10;
    lines.push({
      label: `Category exclusivity — ${terms.exclusivityMonths} month${terms.exclusivityMonths > 1 ? "s" : ""}`,
      pct,
      value: (base * pct) / 100,
    });
  }

  const totalPct = lines.reduce((s, l) => s + l.pct, 0);
  const value = lines.reduce((s, l) => s + l.value, 0);
  return { totalPct, value, lines, impliedTotal: base + value };
}

export type ContractWarning = {
  severity: "critical" | "caution";
  headline: string;
  detail: string;
};

/** Terms that cost money later. Ordered worst first. */
export function contractWarnings(terms: ContractTerms): ContractWarning[] {
  const out: ContractWarning[] = [];
  const rights = valueRights(terms);

  if (rights.totalPct >= 100 && terms.fee > 0) {
    out.push({
      severity: "critical",
      headline: `The rights are worth more than the fee`,
      detail: `You are granting rights valued at ${rights.totalPct}% of the base fee. On ${money(terms.fee, terms.currency)} that is ${money(rights.value, terms.currency)} of value moving across for nothing. If the fee is fixed, narrow the rights instead — that is the negotiable half.`,
    });
  }

  if (terms.exclusivityMonths > 0 && !terms.exclusivityScope.trim()) {
    out.push({
      severity: "critical",
      headline: "Exclusivity with no stated scope",
      detail: "Observed clauses run category-wide, not brand-wide — one read “all banking brands” for four months. Unscoped exclusivity is read against you. Name the exact category and nothing wider.",
    });
  }

  if (terms.revisionRounds > 3) {
    out.push({
      severity: "caution",
      headline: `${terms.revisionRounds} revision rounds is unpaid work`,
      detail: "Two to three is the norm in the archive. Every round past that is a day you did not quote for. Cap it, and price further rounds as a stated hourly or per-round fee.",
    });
  }

  if (terms.revisionRounds === 0) {
    out.push({
      severity: "caution",
      headline: "No revision cap stated",
      detail: "A contract silent on revisions can absorb a week. State the number even if it is generous.",
    });
  }

  if (terms.depositPct === 0) {
    out.push({
      severity: "caution",
      headline: "No deposit",
      detail: "You are financing the production and carrying all of the non-payment risk. 50% upfront is standard and is normally granted if asked before the contract is drafted.",
    });
  }

  if (terms.killFeePct === 0) {
    out.push({
      severity: "caution",
      headline: "No kill fee",
      detail: "Campaigns get cancelled after the concept work is done. Without a kill fee, a cancellation two days before go-live pays nothing for work already delivered.",
    });
  }

  if (!terms.disclosure) {
    out.push({
      severity: "critical",
      headline: "No disclosure clause",
      detail: "Paid content must be disclosed. Putting it in the contract makes it the brand's obligation to accept as well as yours to apply — which protects you when a brand asks you to leave it off.",
    });
  }

  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));
}

export function contractBlockers(terms: ContractTerms): string[] {
  const out: string[] = [];
  if (!terms.creatorName.trim()) out.push("Your name");
  if (!terms.brandName.trim()) out.push("The brand");
  if (terms.contractingParty === "agency" && !terms.agencyName.trim())
    out.push("The agency — they are the contracting party and the one you invoice");
  if (terms.fee <= 0) out.push("The fee");
  if (!terms.deliverables.trim()) out.push("The deliverables, counted");
  if (!terms.goLiveDate) out.push("The go-live date");
  return out;
}

export function money(n: number, currency = "ZAR") {
  const symbol = currency === "ZAR" ? "R" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${Math.round(n).toLocaleString("en-GB")}`;
}

function usageClause(terms: ContractTerms): string {
  switch (terms.usage) {
    case "organic_only":
      return "The Brand may re-share the Content organically on its own social channels for 30 days from the go-live date. No paid media, no third-party channels, no other use.";
    case "organic_12mo":
      return "The Brand may re-share the Content organically on its own social channels for 12 months from the go-live date. No paid media behind it, and no third-party channels.";
    case "paid_3mo":
      return "The Brand may use the Content as paid advertising for 3 months from the go-live date, on the platforms named above. Rights end automatically on expiry.";
    case "paid_6mo":
      return "The Brand may use the Content as paid advertising for 6 months from the go-live date, on the platforms named above. Rights end automatically on expiry.";
    case "paid_12mo":
      return "The Brand may use the Content as paid advertising for 12 months from the go-live date, on the platforms named above. Rights end automatically on expiry.";
  }
}

/** The agreement. Plain language on purpose — a document both sides actually
 *  read beats a template neither side does. */
export function renderContract(terms: ContractTerms): string {
  const t = terms;
  const counterparty = t.contractingParty === "agency" ? t.agencyName : t.brandName;
  const creator = [t.creatorName.trim(), t.creatorEntity.trim() ? `(${t.creatorEntity.trim()})` : ""]
    .filter(Boolean)
    .join(" ");
  const rights = valueRights(t);

  const deposit = t.depositPct > 0 ? (t.fee * t.depositPct) / 100 : 0;
  const balance = t.fee - deposit;

  const payWhen = t.endOfMonthTerms
    ? "at the end of the month following the month in which the invoice is issued"
    : `within ${t.paymentTermsDays} days of the invoice date`;

  const sections: string[] = [];

  sections.push(`CONTENT COLLABORATION AGREEMENT

Between
  ${creator || "[Creator]"}  ("the Creator")
and
  ${counterparty || "[Counterparty]"}  ("the ${t.contractingParty === "agency" ? "Agency" : "Brand"}")
${t.contractingParty === "agency" && t.brandName.trim() ? `\nfor the brand: ${t.brandName.trim()}` : ""}

Date: ${new Date().toISOString().slice(0, 10)}`);

  sections.push(`1. WHAT IS BEING MADE

${t.deliverables.trim() || "[Deliverables]"}

Draft due:    ${t.draftDueDate || "to be confirmed"}
Go live:      ${t.goLiveDate || "[go-live date]"}
Revisions:    ${t.revisionRounds} round${t.revisionRounds === 1 ? "" : "s"} included. Further rounds are quoted separately before they begin.`);

  sections.push(`2. THE FEE

${money(t.fee, t.currency)} for the scope in clause 1 and the rights in clause 3.

${
  t.depositPct > 0
    ? `${t.depositPct}% (${money(deposit, t.currency)}) is payable before production begins.\nThe balance of ${money(balance, t.currency)} is invoiced on delivery and payable ${payWhen}.`
    : `Invoiced on delivery and payable ${payWhen}.`
}

Invoices are addressed to ${counterparty || "[Counterparty]"}. Payment is by EFT to the account stated on the invoice.${
    t.latePaymentInterest
      ? "\n\nAmounts outstanding beyond the due date carry interest at the prescribed legal rate, and the Creator may pause further work until the account is settled."
      : ""
  }`);

  sections.push(`3. RIGHTS — WHAT THE ${t.contractingParty === "agency" ? "AGENCY" : "BRAND"} MAY DO WITH THE CONTENT

The Creator owns the Content and licenses it as follows.

Usage:        ${usageClause(t)}

Whitelisting: ${
    t.whitelisting === "none"
      ? "Not included. Running advertising through the Creator's handle is a separate service and a separate fee."
      : `${WHITELIST_OPTIONS.find((w) => w.key === t.whitelisting)?.label}. Ad-account access is granted for that period only and is revoked on expiry.`
  }

Exclusivity:  ${
    t.exclusivityMonths > 0
      ? `The Creator will not work with a directly competing brand in the category "${t.exclusivityScope.trim() || "[scope not stated]"}" for ${t.exclusivityMonths} month${t.exclusivityMonths > 1 ? "s" : ""} from the go-live date. This is limited to that category and to no other work.`
      : "None. The Creator is free to work with other brands, including in the same category."
  }

Any use beyond what is written above — a longer period, another platform, paid
media where none is granted — is a new licence and a new fee, agreed in writing
first. Silence is not a grant.`);

  sections.push(`4. IF IT IS CANCELLED

${
  t.killFeePct > 0
    ? `If the ${t.contractingParty === "agency" ? "Agency" : "Brand"} cancels after this agreement is signed, ${t.killFeePct}% of the fee (${money((t.fee * t.killFeePct) / 100, t.currency)}) is payable for work already done and time already reserved. Any deposit already paid counts toward it.`
    : "No kill fee has been agreed. Work already completed at the point of cancellation is invoiced at the Creator's discretion."
}`);

  const clauses: string[] = [];
  if (t.disclosure)
    clauses.push(
      "Disclosure. The Content will be disclosed as a paid partnership, using the platform's own paid-partnership tool and/or #ad. Both parties accept this as a requirement and not an option.",
    );
  clauses.push(
    "Approvals. The Creator writes in their own voice. The Brand may request changes for factual accuracy, legal compliance and brand safety within the revision rounds above.",
  );
  clauses.push(
    "Reporting. The Creator supplies a post-campaign report — screen grabs and available metrics — within 7 days of go-live, if requested.",
  );
  clauses.push(
    "Personal information. Both parties handle any personal information exchanged under this agreement in line with applicable data-protection law, and use it only for this campaign.",
  );
  clauses.push(
    "Removal. The Creator will not delete the Content during the usage period without agreement, except where required by law or by the platform.",
  );

  sections.push(`5. THE REST\n\n${clauses.map((c, i) => `5.${i + 1}  ${c}`).join("\n\n")}`);

  sections.push(`SIGNED

Creator                                   ${t.contractingParty === "agency" ? "Agency" : "Brand"}

_______________________                   _______________________
${(creator || "[Creator]").padEnd(42).slice(0, 42)}${counterparty || "[Counterparty]"}
Date:                                     Date:`);

  if (rights.value > 0) {
    sections.push(`— — —
NOT PART OF THE AGREEMENT — for the Creator only, remove before sending.

The rights granted in clause 3 are worth ${rights.totalPct}% of the base fee:
${rights.lines.map((l) => `  ${l.label} — +${l.pct}% (${money(l.value, t.currency)})`).join("\n")}

On a fee of ${money(t.fee, t.currency)}, that is ${money(rights.value, t.currency)} of value.
A fee that priced them would be ${money(rights.impliedTotal, t.currency)}.`);
  }

  sections.push(`This is a plain-language agreement, not legal advice. For a deal where the
money or the risk is significant, have a lawyer read it before you sign.`);

  return sections.join("\n\n\n");
}
