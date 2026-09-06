// The Receivables Chase Cadence — pure, deterministic, client-safe.
//
// Separated from deals.functions.ts on purpose: that file imports
// supabaseAdmin, and this one is called from the browser. Same split as
// rate-card-engine.ts / leak-engine.ts.
//
// No AI in the path. Given an invoice and a date, there is exactly one right
// answer about what to do today, and it should be the same answer every time.
//
// The bands are short by design. The estate's failure has never been chasing
// too hard — it is not returning at all: six channels, one shape, push then
// abandon (ST-103). Waiting a month to send a first reminder is how an invoice
// quietly becomes a write-off.

export const DEAL_STATUSES = [
  "lead",
  "quoted",
  "accepted",
  "delivered",
  "invoiced",
  "paid",
  "written_off",
] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const COUNTERPARTY_TYPES = [
  "brand",
  "agency",
  "client",
  "platform",
  "affiliate-network",
  "individual",
] as const;
export type CounterpartyType = (typeof COUNTERPARTY_TYPES)[number];

export type Deal = {
  id: string;
  counterparty: string;
  counterparty_type: CounterpartyType;
  deliverable: string;
  platform: string | null;
  category: string | null;
  exclusive_until: string | null;
  exclusivity_scope: string | null;
  amount: number;
  currency: "ZAR" | "USD";
  status: DealStatus;
  quoted_at: string | null;
  accepted_at: string | null;
  delivered_at: string | null;
  invoiced_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  invoice_number: string | null;
  chase_count: number;
  last_chased_at: string | null;
  notes: string | null;
  created_at: string;
};

export type ChaseState =
  | "not_invoiced"
  | "on_time"
  | "due_soon"
  | "overdue"
  | "chase_again"
  | "escalate"
  | "settled";

export type ChaseVerdict = {
  state: ChaseState;
  daysOverdue: number | null;
  label: string;
  action: string;
  tone: "neutral" | "warn" | "urgent" | "good";
};

export function chaseVerdict(
  deal: Pick<Deal, "status" | "due_date" | "chase_count">,
  today = new Date(),
): ChaseVerdict {
  if (deal.status === "paid")
    return { state: "settled", daysOverdue: null, label: "Paid", action: "Nothing. The rate is now yours to quote.", tone: "good" };

  if (deal.status === "written_off")
    return { state: "settled", daysOverdue: null, label: "Written off", action: "Nothing.", tone: "neutral" };

  if (deal.status !== "invoiced" || !deal.due_date)
    return {
      state: "not_invoiced",
      daysOverdue: null,
      label: "Not invoiced",
      action: "No invoice, no clock. Send it — the invoice is the start of the collection, not the end.",
      tone: "neutral",
    };

  const due = new Date(`${deal.due_date}T00:00:00Z`);
  const now = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const days = Math.floor((now.getTime() - due.getTime()) / 86_400_000);
  const chases = deal.chase_count ?? 0;

  if (days < -7)
    return { state: "on_time", daysOverdue: days, label: `Due in ${-days} days`, action: "Nothing yet.", tone: "neutral" };

  if (days < 0)
    return {
      state: "due_soon",
      daysOverdue: days,
      label: `Due in ${-days} days`,
      action: "Send the polite pre-due note. It lands better than the annoyed one a fortnight later.",
      tone: "neutral",
    };

  if (days === 0)
    return { state: "overdue", daysOverdue: 0, label: "Due today", action: "Send the reminder today.", tone: "warn" };

  if (chases === 0)
    return {
      state: "overdue",
      daysOverdue: days,
      label: `${days} days overdue`,
      action: "First chase. Short, factual, attach the invoice again.",
      tone: "warn",
    };

  if (chases === 1 && days < 21)
    return {
      state: "chase_again",
      daysOverdue: days,
      label: `${days} days overdue · chased once`,
      action: "Second chase. Ask who processes payments and copy them in.",
      tone: "warn",
    };

  return {
    state: "escalate",
    daysOverdue: days,
    label: `${days} days overdue · chased ${chases}×`,
    action:
      "Escalate. Ask outright whether the payment batch failed — five chases across two networks and an agency found exactly that once, and it would never have surfaced otherwise.",
    tone: "urgent",
  };
}

// ── The numbers the tracker exists to surface ────────────────────────────────

export type DealStats = {
  outstandingCents: number;
  overdueCents: number;
  paidCents: number;
  overdueCount: number;
  neverInvoicedCount: number;
  medianDaysToPay: number | null;
  chasedTotal: number;
};

export function dealStats(deals: Deal[], today = new Date()): DealStats {
  const zar = deals.filter((d) => d.currency === "ZAR");
  let outstanding = 0;
  let overdue = 0;
  let paid = 0;
  let overdueCount = 0;
  let neverInvoiced = 0;
  let chased = 0;
  const daysToPay: number[] = [];

  for (const d of zar) {
    const cents = Math.round(d.amount * 100);
    chased += d.chase_count ?? 0;

    if (d.status === "paid") {
      paid += cents;
      if (d.invoiced_at && d.paid_at) {
        const a = new Date(`${d.invoiced_at}T00:00:00Z`).getTime();
        const b = new Date(`${d.paid_at}T00:00:00Z`).getTime();
        const diff = Math.floor((b - a) / 86_400_000);
        if (diff >= 0) daysToPay.push(diff);
      }
      continue;
    }
    if (d.status === "written_off") continue;

    outstanding += cents;

    // Delivered work that was never invoiced is the quietest leak in the set.
    if (["accepted", "delivered"].includes(d.status)) neverInvoiced += 1;

    const v = chaseVerdict(d, today);
    if (v.state === "overdue" || v.state === "chase_again" || v.state === "escalate") {
      overdue += cents;
      overdueCount += 1;
    }
  }

  daysToPay.sort((a, b) => a - b);
  const median =
    daysToPay.length === 0
      ? null
      : daysToPay.length % 2
        ? daysToPay[(daysToPay.length - 1) / 2]
        : Math.round((daysToPay[daysToPay.length / 2 - 1] + daysToPay[daysToPay.length / 2]) / 2);

  return {
    outstandingCents: outstanding,
    overdueCents: overdue,
    paidCents: paid,
    overdueCount,
    neverInvoicedCount: neverInvoiced,
    medianDaysToPay: median,
    chasedTotal: chased,
  };
}

// Your own rate benchmark, from your own paid deals. This is the Proof Vault
// in miniature: a figure you can quote because a bank confirmed it, not
// because you remember it. Ten of the founder's own stated figures drifted
// upward and none down (ST-101) — this is the correction, per user.
export type RateBenchmark = { deliverable: string; n: number; median: number; low: number; high: number };

export function rateBenchmarks(deals: Deal[]): RateBenchmark[] {
  const byDeliverable = new Map<string, number[]>();
  for (const d of deals) {
    if (d.status !== "paid" || d.currency !== "ZAR") continue;
    const key = d.deliverable.trim().toLowerCase();
    if (!key) continue;
    if (!byDeliverable.has(key)) byDeliverable.set(key, []);
    byDeliverable.get(key)!.push(d.amount);
  }
  const out: RateBenchmark[] = [];
  for (const [key, amounts] of byDeliverable) {
    amounts.sort((a, b) => a - b);
    const median =
      amounts.length % 2
        ? amounts[(amounts.length - 1) / 2]
        : (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2;
    out.push({ deliverable: key, n: amounts.length, median, low: amounts[0], high: amounts[amounts.length - 1] });
  }
  return out.sort((a, b) => b.n - a.n || b.median - a.median);
}
