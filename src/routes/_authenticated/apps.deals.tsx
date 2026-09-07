import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { listDeals, upsertDeal, deleteDeal, recordChase } from "@/lib/deals.functions";
import {
  chaseVerdict,
  dealStats,
  rateBenchmarks,
  DEAL_STATUSES,
  COUNTERPARTY_TYPES,
  type Deal,
} from "@/lib/deals-chase-engine";
import { checkConflict, activeExclusivities, CATEGORIES, type ConflictResult } from "@/lib/conflict-check";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Plus, Trash2, Pencil, Bell, AlertTriangle, CheckCircle2, Clock, ShieldAlert, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/deals")({
  head: () => ({ meta: [{ title: "Deal Tracker — Contentpreneur Africa" }] }),
  component: DealsPage,
});

// House style is R1,800 — comma thousands, full stop decimal. en-ZA renders
// "R1 800,00" with a non-breaking space, which the brief bans; en-GB gives the
// documented format. All 46 currency call sites across this codebase were
// converted on 2026-09-07. Date formatting deliberately stays on en-ZA — SA
// date order is correct there, and only the currency was ever wrong.
function rand(n: number) {
  return `R${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function emptyForm() {
  return {
    counterparty: "",
    counterparty_type: "brand" as (typeof COUNTERPARTY_TYPES)[number],
    deliverable: "",
    platform: "",
    category: "",
    exclusive_until: "",
    exclusivity_scope: "",
    amount: "",
    currency: "ZAR" as "ZAR" | "USD",
    status: "lead" as (typeof DEAL_STATUSES)[number],
    quoted_at: "",
    accepted_at: "",
    delivered_at: "",
    invoiced_at: "",
    due_date: "",
    paid_at: "",
    invoice_number: "",
    notes: "",
  };
}

function DealsPage() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Tracker />;
}

function Tracker() {
  const qc = useQueryClient();
  const listFn = useServerFn(listDeals);
  const upsertFn = useServerFn(upsertDeal);
  const deleteFn = useServerFn(deleteDeal);
  const chaseFn = useServerFn(recordChase);

  const [filter, setFilter] = useState<"all" | (typeof DEAL_STATUSES)[number]>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ["deals", filter],
    queryFn: () => listFn({ data: { status: filter } }),
  });

  const deals = (data?.deals ?? []) as Deal[];
  const stats = useMemo(() => dealStats(deals), [deals]);
  const benchmarks = useMemo(() => rateBenchmarks(deals), [deals]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["deals"] });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => upsertFn({ data: payload }),
    onSuccess: () => {
      toast.success(editing ? "Deal updated" : "Deal logged");
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm());
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const chase = useMutation({
    mutationFn: (id: string) => chaseFn({ data: { id } }),
    onSuccess: (r: { chase_count: number }) => {
      toast.success(`Chase ${r.chase_count} recorded`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.counterparty.trim()) return toast.error("Who is paying you?");
    if (!form.deliverable.trim()) return toast.error("What are they paying for?");
    if (!Number.isFinite(amount) || amount < 0) return toast.error("Amount must be a number");
    if (form.status === "invoiced" && !form.due_date)
      return toast.error("An invoice with no due date has no clock. Set the due date.");

    const nulls = (v: string) => (v.trim() === "" ? null : v.trim());
    save.mutate({
      ...(editing ? { id: editing.id } : {}),
      counterparty: form.counterparty.trim(),
      counterparty_type: form.counterparty_type,
      deliverable: form.deliverable.trim(),
      platform: nulls(form.platform),
      category: nulls(form.category),
      exclusive_until: nulls(form.exclusive_until),
      exclusivity_scope: nulls(form.exclusivity_scope),
      amount,
      currency: form.currency,
      status: form.status,
      quoted_at: nulls(form.quoted_at),
      accepted_at: nulls(form.accepted_at),
      delivered_at: nulls(form.delivered_at),
      invoiced_at: nulls(form.invoiced_at),
      due_date: nulls(form.due_date),
      paid_at: nulls(form.paid_at),
      invoice_number: nulls(form.invoice_number),
      notes: nulls(form.notes),
    });
  }

  function startEdit(d: Deal) {
    setEditing(d);
    setForm({
      counterparty: d.counterparty,
      counterparty_type: d.counterparty_type,
      deliverable: d.deliverable,
      platform: d.platform ?? "",
      category: d.category ?? "",
      exclusive_until: d.exclusive_until ?? "",
      exclusivity_scope: d.exclusivity_scope ?? "",
      amount: String(d.amount),
      currency: d.currency,
      status: d.status,
      quoted_at: d.quoted_at ?? "",
      accepted_at: d.accepted_at ?? "",
      delivered_at: d.delivered_at ?? "",
      invoiced_at: d.invoiced_at ?? "",
      due_date: d.due_date ?? "",
      paid_at: d.paid_at ?? "",
      invoice_number: d.invoice_number ?? "",
      notes: d.notes ?? "",
    });
    setShowForm(true);
  }

  // Sorted so the thing that needs doing today is at the top. An overdue
  // invoice outranks a lead, always.
  const sorted = useMemo(() => {
    const rank = { escalate: 0, chase_again: 1, overdue: 2, due_soon: 3, not_invoiced: 4, on_time: 5, settled: 6 };
    return [...deals].sort((a, b) => {
      const ra = rank[chaseVerdict(a).state];
      const rb = rank[chaseVerdict(b).state];
      return ra !== rb ? ra - rb : b.created_at.localeCompare(a.created_at);
    });
  }, [deals]);

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Deal Tracker</h1>
          <p className="text-muted-foreground max-w-2xl">
            Every deal, from first conversation to money in the bank. The invoice is the start
            of the collection, not the end — so this tracks what you are owed, how long it has
            been owed, and what to do about it today.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Outstanding" value={rand(stats.outstandingCents / 100)} />
          <Stat
            label="Overdue"
            value={rand(stats.overdueCents / 100)}
            sub={stats.overdueCount ? `${stats.overdueCount} invoice${stats.overdueCount > 1 ? "s" : ""}` : undefined}
            tone={stats.overdueCents > 0 ? "urgent" : "neutral"}
          />
          <Stat label="Collected" value={rand(stats.paidCents / 100)} tone="good" />
          <Stat
            label="Median days to pay"
            value={stats.medianDaysToPay === null ? "—" : `${stats.medianDaysToPay}`}
            sub={stats.medianDaysToPay === null ? "no paid invoices yet" : "from invoice to payment"}
          />
        </section>

        {stats.neverInvoicedCount > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              {stats.neverInvoicedCount} deal{stats.neverInvoicedCount > 1 ? "s are" : " is"} accepted or
              delivered and never invoiced.
            </p>
            <p className="text-muted-foreground mt-1">
              That is the quietest leak there is. Work you have already done, with no clock running on it.
            </p>
          </div>
        )}

        <ConflictPanel deals={deals} />

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
          {DEAL_STATUSES.map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {s.replace("_", " ")}
            </FilterChip>
          ))}
          <div className="ml-auto">
            <Button onClick={() => { setEditing(null); setForm(emptyForm()); setShowForm((v) => !v); }}>
              <Plus className="mr-1 h-4 w-4" /> Log a deal
            </Button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={submit} className="rounded-lg border p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Who is paying you">
                <Input value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} placeholder="Brand or agency name" />
              </Field>
              <Field label="Type">
                <Select value={form.counterparty_type} onChange={(v) => setForm({ ...form, counterparty_type: v as never })} options={[...COUNTERPARTY_TYPES]} />
              </Field>
              <Field label="What for">
                <Input value={form.deliverable} onChange={(e) => setForm({ ...form, deliverable: e.target.value })} placeholder="e.g. Instagram reel" />
              </Field>
              <Field label="Platform (optional)">
                <Input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="Instagram" />
              </Field>
              <Field label="Category — what the brand competes in">
                <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={["", ...CATEGORIES]} />
              </Field>
              <Field label="Exclusivity runs until (if any)">
                <Input type="date" value={form.exclusive_until} onChange={(e) => setForm({ ...form, exclusive_until: e.target.value })} />
              </Field>
              <Field label="Exclusivity clause, as written">
                <Input
                  value={form.exclusivity_scope}
                  onChange={(e) => setForm({ ...form, exclusivity_scope: e.target.value })}
                  placeholder="e.g. all banking brands — copy it verbatim"
                />
              </Field>
              <Field label="Amount">
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </Field>
              <Field label="Currency">
                <Select value={form.currency} onChange={(v) => setForm({ ...form, currency: v as never })} options={["ZAR", "USD"]} />
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={(v) => setForm({ ...form, status: v as never })} options={[...DEAL_STATUSES]} />
              </Field>
              <Field label="Invoice number (optional)">
                <Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
              </Field>
              <Field label="Invoiced on"><Input type="date" value={form.invoiced_at} onChange={(e) => setForm({ ...form, invoiced_at: e.target.value })} /></Field>
              <Field label="Due date"><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
              <Field label="Delivered on"><Input type="date" value={form.delivered_at} onChange={(e) => setForm({ ...form, delivered_at: e.target.value })} /></Field>
              <Field label="Paid on"><Input type="date" value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })} /></Field>
            </div>
            <Field label="Notes (optional)">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Scope, who signed it off, anything you will forget" />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : editing ? "Update deal" : "Log deal"}</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        )}

        <section className="space-y-3">
          {isLoading && <p className="text-muted-foreground py-8 text-center">Loading…</p>}
          {!isLoading && sorted.length === 0 && (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="font-medium">No deals logged yet.</p>
              <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                Start with the last one you were paid for. You cannot price the next deal from a
                number you cannot find.
              </p>
            </div>
          )}
          {sorted.map((d) => {
            const v = chaseVerdict(d);
            return (
              <article key={d.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{d.counterparty}</h3>
                      <Badge tone={v.tone}>{v.label}</Badge>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{d.status.replace("_", " ")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {d.deliverable}{d.platform ? ` · ${d.platform}` : ""}{d.invoice_number ? ` · ${d.invoice_number}` : ""}
                    </p>
                    <p className="text-sm mt-2">{v.action}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-semibold tabular-nums">
                      {d.currency === "ZAR" ? rand(d.amount) : `$${d.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`}
                    </p>
                    {d.chase_count > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">chased {d.chase_count}×</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {d.status === "invoiced" && (
                    <Button size="sm" variant="outline" onClick={() => chase.mutate(d.id)} disabled={chase.isPending}>
                      <Bell className="mr-1 h-3.5 w-3.5" /> Record a chase
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => startEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete the ${d.counterparty} deal?`)) remove.mutate(d.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </article>
            );
          })}
        </section>

        {benchmarks.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold">Your rate, from your own receipts</h2>
              <p className="text-muted-foreground text-sm max-w-2xl mt-1">
                Built only from deals you have actually been paid for. Not what you hoped for,
                not what you remember — what landed. This is the number to quote from.
              </p>
            </div>
            <div className="rounded-lg border divide-y">
              {benchmarks.map((b) => (
                <div key={b.deliverable} className="flex items-baseline justify-between gap-4 p-3">
                  <div className="min-w-0">
                    <p className="font-medium capitalize truncate">{b.deliverable}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.n} paid deal{b.n > 1 ? "s" : ""}
                      {b.n === 1 ? " · one data point, treat as provisional" : ` · ${rand(b.low)}–${rand(b.high)}`}
                    </p>
                  </div>
                  <p className="text-lg font-semibold tabular-nums shrink-0">{rand(b.median)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}

// ── the conflict check ───────────────────────────────────────────────────────
//
// Every agency brief in the archive asks the same question inside a 24-48 hour
// deadline: have you worked with a competing brand? It is listed first under
// "what kills deals". Answering it from memory is how creators either lose the
// brief or breach a clause they had forgotten about.

function ConflictPanel({ deals }: { deals: Deal[] }) {
  const [category, setCategory] = useState("");
  const [months, setMonths] = useState(6);
  const [result, setResult] = useState<ConflictResult | null>(null);

  const live = useMemo(() => activeExclusivities(deals as never), [deals]);

  function run() {
    if (!category) return toast.error("Which category is the brief in?");
    setResult(checkConflict({ category, lookbackMonths: months, deals: deals as never }));
  }

  const tone = result
    ? { blocked: "border-destructive/50 bg-destructive/5", disclose: "border-amber-500/40 bg-amber-500/5", clear: "border-emerald-500/40 bg-emerald-500/5" }[result.verdict]
    : "";

  return (
    <section className="rounded-lg border p-5 space-y-4">
      <div className="flex items-start gap-2">
        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
        <div>
          <h2 className="font-semibold">Can I take this brief?</h2>
          <p className="text-sm text-muted-foreground">
            Agencies ask for a competitor check before they draft a contract, usually with a
            24-hour deadline. Exclusivity is category-wide, not brand-specific.
          </p>
        </div>
      </div>

      {live.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm font-semibold text-destructive">
            {live.length} exclusivity clause{live.length > 1 ? "s" : ""} currently running
          </p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {live.map((e) => (
              <li key={`${e.counterparty}-${e.until}`}>
                <span className="font-medium">{e.counterparty}</span>{" "}
                <span className="text-muted-foreground">
                  — {e.category}, {e.daysLeft} day{e.daysLeft === 1 ? "" : "s"} left (to {e.until})
                </span>
                {e.scope && <span className="block text-xs text-muted-foreground italic">“{e.scope}”</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field label="Category of the brief you have been offered">
          <Select value={category} onChange={setCategory} options={["", ...CATEGORIES]} />
        </Field>
        <Field label="They asked about the last…">
          <Select value={String(months)} onChange={(v) => setMonths(Number(v))} options={["3", "6", "12"]} />
        </Field>
        <Button type="button" onClick={run}>Check</Button>
      </div>

      {result && (
        <div className={`rounded-md border p-4 space-y-3 ${tone}`}>
          <p className="font-semibold">{result.headline}</p>
          {result.conflicts.length > 0 && (
            <ul className="space-y-2 text-sm">
              {result.conflicts.map((c, i) => (
                <li key={i}>
                  <span className="font-medium">{c.counterparty}</span>{" "}
                  <span className="text-muted-foreground">— {c.reason}</span>
                  <span className="block text-xs text-muted-foreground">{c.detail}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reply with this</p>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">{result.reply}</p>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(result.reply); toast.success("Copied"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Checked against deals you have logged. It cannot see what you never recorded — which is
            the argument for logging everything, including the ones that paid badly.
          </p>
        </div>
      )}
    </section>
  );
}

// ── small local pieces ───────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Locked() {
  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-3">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Deal Tracker</h1>
        <p className="text-muted-foreground">
          Part of the Foundation Kit. It tracks what you are owed and tells you what to do about it today.
        </p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}

function Stat({ label, value, sub, tone = "neutral" }: { label: string; value: string; sub?: string; tone?: "neutral" | "urgent" | "good" }) {
  const colour = tone === "urgent" ? "text-destructive" : tone === "good" ? "text-emerald-600 dark:text-emerald-400" : "";
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums mt-1 ${colour}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Badge({ tone, children }: { tone: "neutral" | "warn" | "urgent" | "good"; children: React.ReactNode }) {
  const cls = {
    neutral: "bg-muted text-muted-foreground",
    warn: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    urgent: "bg-destructive/15 text-destructive",
    good: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  }[tone];
  const Icon = tone === "urgent" ? AlertTriangle : tone === "good" ? CheckCircle2 : Clock;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />{children}
    </span>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${active ? "bg-foreground text-background" : "hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs capitalize"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o.replace("_", " ")}</option>
      ))}
    </select>
  );
}
