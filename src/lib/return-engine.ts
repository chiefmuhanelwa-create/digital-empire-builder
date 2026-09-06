// The Return Engine — pipeline Stage 12. Pure, client-safe, no AI in the path.
//
// Every other tool in this product produces an artifact. This is the only one
// whose job is to make you come back to it.
//
// Why it exists, from the founder's own record: six independent income and
// audience channels show one shape — a strong push, then abandonment.
// Affiliate income went R23,524 in a month to no clicks at all. A reachable
// email list fell 1,246 to 148 in 25 days. A 46,251-word workbook was finished
// and never shipped. That is ST-103, and it is not a motivation problem. It is
// the absence of anything that says "this has gone stale, today."
//
// So the design rule here is: BORROW A CALENDAR YOU DO NOT CONTROL. Provisional
// tax has two statutory deadlines a year. SARS enforces the return so the user
// does not have to rely on remembering. Everything else decays against dates
// the user's own data already carries.
//
// Deliberately no LLM call anywhere in this file. The retention mechanic is the
// one feature that must not scale in cost with usage — and a computed number
// the user can check beats a generated sentence they cannot.

export type SignalState = "ok" | "attention" | "urgent";

export type Signal = {
  id: string;
  state: SignalState;
  title: string;
  value: string;
  action: string;
  // Why this is worth acting on. Kept short and specific — a reason that cites
  // a real consequence lands; a reason that says "best practice" does not.
  because?: string;
};

export type ReturnInput = {
  deals: Array<{
    status: string;
    amount: number;
    currency: string;
    due_date: string | null;
    paid_at: string | null;
    chase_count: number;
    created_at: string;
  }>;
  income: Array<{ type: string; amount: number; date: string }>;
  /** Exclusivity windows agreed on deals. Agreed once, in a brief, and then
   *  forgotten — which is how a creator turns down nothing and breaches
   *  something. Optional so older callers keep working. */
  exclusivities?: Array<{ counterparty: string; exclusive_until: string | null; exclusivity_scope: string | null }>;
  /** Dates of saved concentration snapshots, newest anywhere in the list. */
  snapshotDates?: string[];
  /** Percentage of income to hold back for tax. Defaults to 25 to match the
   *  SARS 25% Calculator already shipped in this product, so a user does not
   *  meet two different numbers in one app. */
  reservePercent?: number;
  today?: Date;
};

// House style is R1,800 — comma thousands, full stop decimal. en-ZA renders
// "R1 800,00" with a non-breaking space, which the brief bans. en-GB gives the
// documented format. NOTE: 40 existing call sites across this codebase still
// use en-ZA and render the wrong format in production — logged, not fixed here.
function rand(n: number) {
  return `R${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function utcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ── The borrowed calendar ────────────────────────────────────────────────────
//
// Provisional tax runs on the last day of August and the last day of February.
// Expressed as a recurring pattern rather than hard-coded years, matching
// provisional-tax-engine.ts — hard-coded dates go stale and then mislead,
// which is worse than not showing them.

export function nextProvisionalDeadline(today = new Date()): { date: Date; label: string; period: 1 | 2 } {
  const now = utcDay(today);
  const y = now.getUTCFullYear();

  const augustEnd = new Date(Date.UTC(y, 7, 31)); // 31 August
  const februaryEnd = new Date(Date.UTC(y, 2, 0)); // last day of February this year
  const februaryEndNext = new Date(Date.UTC(y + 1, 2, 0));

  if (now <= februaryEnd) return { date: februaryEnd, label: "2nd provisional return (IRP6)", period: 2 };
  if (now <= augustEnd) return { date: augustEnd, label: "1st provisional return (IRP6)", period: 1 };
  return { date: februaryEndNext, label: "2nd provisional return (IRP6)", period: 2 };
}

/** The tax year runs 1 March to end of February. Income is assessed against it,
 *  so the reserve has to be measured against it too. */
export function taxYearStart(today = new Date()): Date {
  const now = utcDay(today);
  const y = now.getUTCFullYear();
  const march1 = new Date(Date.UTC(y, 2, 1));
  return now >= march1 ? march1 : new Date(Date.UTC(y - 1, 2, 1));
}

// ── The signals ──────────────────────────────────────────────────────────────

export function returnSignals(input: ReturnInput): Signal[] {
  const today = utcDay(input.today ?? new Date());
  const reservePct = input.reservePercent ?? 25;
  const out: Signal[] = [];

  // 1 · Money you are owed, past its due date.
  const overdue = input.deals.filter(
    (d) => d.status === "invoiced" && d.due_date && d.currency === "ZAR" && utcDay(new Date(`${d.due_date}T00:00:00Z`)) < today,
  );
  const overdueTotal = overdue.reduce((s, d) => s + d.amount, 0);
  const neverChased = overdue.filter((d) => (d.chase_count ?? 0) === 0).length;
  if (overdue.length > 0) {
    out.push({
      id: "overdue",
      state: "urgent",
      title: "Invoices past their due date",
      value: `${rand(overdueTotal)} across ${overdue.length}`,
      action:
        neverChased > 0
          ? `${neverChased} of them have never been chased once. Send the first reminder today.`
          : "Chase again, and ask outright whether the payment batch failed.",
      because:
        "Five chases across two networks and an agency once turned up a failed payment batch that would never have surfaced otherwise.",
    });
  }

  // 2 · Work already done, with no clock running on it. The quietest leak here.
  const uninvoiced = input.deals.filter((d) => ["accepted", "delivered"].includes(d.status));
  const uninvoicedTotal = uninvoiced.reduce((s, d) => s + (d.currency === "ZAR" ? d.amount : 0), 0);
  if (uninvoiced.length > 0) {
    out.push({
      id: "uninvoiced",
      state: "attention",
      title: "Accepted or delivered, never invoiced",
      value: `${rand(uninvoicedTotal)} across ${uninvoiced.length}`,
      action: "Invoice it. Nothing is owed to you until you have asked for it in writing.",
      because: "No invoice, no due date. No due date, no clock — and no clock is how work quietly becomes free.",
    });
  }

  // 3 · The borrowed calendar. This is the mechanic the whole engine rests on.
  const nd = nextProvisionalDeadline(today);
  const daysToDeadline = daysBetween(today, nd.date);
  out.push({
    id: "provisional",
    state: daysToDeadline <= 30 ? "urgent" : daysToDeadline <= 60 ? "attention" : "ok",
    title: nd.label,
    value: daysToDeadline === 0 ? "Due today" : `${daysToDeadline} days`,
    action:
      daysToDeadline <= 60
        ? "Reconcile your income for the period now, not in the last week."
        : "Nothing yet. It will not move, and neither will the date.",
    because: "This is the one deadline in your year that somebody else enforces.",
  });

  // 4 · What should already be set aside. Measured against the tax year, because
  //     that is the period the return is actually assessed on.
  const yearStart = taxYearStart(today);
  const incomeThisYear = input.income
    .filter((t) => t.type === "income" && new Date(`${t.date}T00:00:00Z`) >= yearStart)
    .reduce((s, t) => s + t.amount, 0);
  if (incomeThisYear > 0) {
    out.push({
      id: "reserve",
      state: "attention",
      title: `What ${reservePct}% of this year's logged income comes to`,
      value: rand((incomeThisYear * reservePct) / 100),
      action: `On ${rand(incomeThisYear)} logged since 1 March. If that is not sitting in a separate account, it is already spent.`,
      because: "Brand income arrives in full and feels like yours. The tax on three years of it can arrive in one number.",
    });
  }

  // 5 · Silence. The ST-103 signal — the thing no other tool measures.
  const lastTouch = [
    ...input.deals.map((d) => d.created_at.slice(0, 10)),
    ...input.income.map((t) => t.date),
  ].sort().pop();
  if (lastTouch) {
    const quiet = daysBetween(utcDay(new Date(`${lastTouch}T00:00:00Z`)), today);
    if (quiet >= 14) {
      out.push({
        id: "silence",
        state: quiet >= 45 ? "urgent" : "attention",
        title: "Nothing logged",
        value: `${quiet} days`,
        action: "Log the last thing you were paid for. Start there, not with a new idea.",
        because:
          "Every channel that ever stopped paying stopped the same way: not a decision, just a gap that got longer.",
      });
    }
  }

  // 6 · A rate goes stale. If nothing has been paid in a quarter, the number
  //     being quoted is from an older market.
  const paid = input.deals.filter((d) => d.status === "paid" && d.paid_at).map((d) => d.paid_at!).sort();
  const lastPaid = paid[paid.length - 1];
  if (lastPaid) {
    const since = daysBetween(utcDay(new Date(`${lastPaid}T00:00:00Z`)), today);
    if (since >= 90) {
      out.push({
        id: "stale-rate",
        state: "attention",
        title: "Since the last deal actually paid",
        value: `${since} days`,
        action: "Your quoted rate is now based on an old market. Re-check it before the next quote goes out.",
      });
    }
  }

  // 7 · An exclusivity window nobody is tracking. Agreed inside a brief months
  //     ago, then forgotten — so the creator either breaches it or, more often,
  //     keeps declining category work long after the clause has expired.
  for (const ex of input.exclusivities ?? []) {
    if (!ex.exclusive_until) continue;
    const left = daysBetween(today, utcDay(new Date(`${ex.exclusive_until}T00:00:00Z`)));
    const scope = ex.exclusivity_scope?.trim() || "an unstated category";

    if (left >= 0 && left <= 21) {
      out.push({
        id: `exclusivity-ending-${ex.counterparty}`,
        state: "attention",
        title: `Exclusivity with ${ex.counterparty} ends`,
        value: left === 0 ? "today" : `in ${left} day${left === 1 ? "" : "s"}`,
        action: `You are free to take ${scope} work again from ${ex.exclusive_until}. Line something up now rather than finding out later.`,
        because: "An expired clause you never noticed is a quarter of turned-down work you never had to turn down.",
      });
    } else if (left > 21) {
      out.push({
        id: `exclusivity-active-${ex.counterparty}`,
        state: "ok",
        title: `Locked out of ${scope}`,
        value: `${left} days left`,
        action: `From ${ex.counterparty}. Decline competing briefs in this category until ${ex.exclusive_until}.`,
      });
    }
  }

  // 8 · The concentration snapshot goes stale. Unlike everything above it, this
  //     one has no external date forcing it — so it decays on the only schedule
  //     that makes a trend readable, which is monthly.
  const lastSnapshot = (input.snapshotDates ?? []).slice().sort().pop();
  if (!lastSnapshot) {
    out.push({
      id: "no-snapshot",
      state: "attention",
      title: "You have never run the concentration test",
      value: "—",
      action: "Ten minutes. It works out what is left if your biggest channel stops.",
      because: "An account termination arrives with no warning and no export. The time to know the number is before.",
    });
  } else {
    const age = daysBetween(utcDay(new Date(`${lastSnapshot}T00:00:00Z`)), today);
    if (age >= 60) {
      out.push({
        id: "stale-snapshot",
        state: "attention",
        title: "Since you last checked where your audience sits",
        value: `${age} days`,
        action: "Re-run it. One snapshot is a number; two is a direction.",
      });
    }
  }

  const rank: Record<SignalState, number> = { urgent: 0, attention: 1, ok: 2 };
  return out.sort((a, b) => rank[a.state] - rank[b.state]);
}

/** One line for the top of the page. Computed, never generated — the whole
 *  point is that the user can check it against their own rows. */
export function digestHeadline(signals: Signal[]): string {
  const urgent = signals.filter((s) => s.state === "urgent").length;
  const attention = signals.filter((s) => s.state === "attention").length;
  if (urgent === 0 && attention === 0) return "Nothing needs you today. That is allowed to be the answer.";
  if (urgent === 0) return `${attention} thing${attention > 1 ? "s" : ""} worth twenty minutes this week.`;
  return `${urgent} thing${urgent > 1 ? "s" : ""} need${urgent > 1 ? "" : "s"} you today.`;
}
