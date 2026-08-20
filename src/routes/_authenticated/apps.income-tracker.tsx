import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import {
  listIncomeTransactions,
  upsertIncomeTransaction,
  deleteIncomeTransaction,
} from "@/lib/income-tracker.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, TrendingUp, TrendingDown, DollarSign, Download, Trash2, Pencil, Plus } from "lucide-react";
import { INCOME_CATEGORIES as PAIDS_INCOME_CATEGORIES } from "@/lib/paids-mapping";

export const Route = createFileRoute("/_authenticated/apps/income-tracker")({
  head: () => ({ meta: [{ title: "Income Tracker — Contentpreneur Africa" }] }),
  component: IncomeTrackerPage,
});

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
};

// Categories come from the shared PAIDS map so the Auditor can roll these up
// without a second vocabulary drifting out of sync. "Membership / Subscription"
// was added there: without it, recurring income had nowhere to land and the
// Information stream read zero no matter how much a buyer logged.
const INCOME_CATEGORIES = [...PAIDS_INCOME_CATEGORIES];
const EXPENSE_CATEGORIES = ["Equipment", "Software", "Marketing", "Travel", "Office", "Education", "Other Expense"];

function rand(n: number) {
  return `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function emptyForm() {
  return {
    type: "income" as "income" | "expense",
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().slice(0, 10),
  };
}

function IncomeTrackerPage() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Tracker />;
}

function Tracker() {
  const qc = useQueryClient();
  const listFn = useServerFn(listIncomeTransactions);
  const upsertFn = useServerFn(upsertIncomeTransaction);
  const deleteFn = useServerFn(deleteIncomeTransaction);

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState(emptyForm());

  const list = useQuery({
    queryKey: ["income-transactions", filterType, filterMonth],
    queryFn: () => listFn({ data: { type: filterType, month: filterMonth } }),
  });
  const transactions = (list.data?.transactions ?? []) as Transaction[];

  const stats = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpenses, net: totalIncome - totalExpenses };
  }, [transactions]);

  const saveMut = useMutation({
    mutationFn: upsertFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income-transactions"] });
      toast.success(editing ? "Transaction updated" : "Transaction added");
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income-transactions"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(t: Transaction) {
    setEditing(t);
    setForm({ type: t.type, amount: String(t.amount), description: t.description, category: t.category, date: t.date });
    setShowForm(true);
  }

  function exportCsv() {
    const rows = [
      ["Date", "Type", "Category", "Description", "Amount"],
      ...transactions.map((t) => [t.date, t.type, t.category, t.description, String(t.amount)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income-tracker-${filterMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <p className="nx-label">Income Tracker · PAIDS in practice</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1>Every rand, mapped to a real stream.</h1>
            <p className="nx-body mt-2 max-w-lg">
              Log income and expenses against your PAIDS streams so you know which one is actually carrying you — not guessing.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="size-4 mr-2" /> Export CSV
            </Button>
            <Button
              className="bg-banana text-banana-foreground hover:bg-banana/90"
              onClick={() => { setEditing(null); setForm(emptyForm()); setShowForm(true); }}
            >
              <Plus className="size-4 mr-2" /> Add
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="nx-card !p-5">
            <div className="flex items-center justify-between">
              <TrendingUp className="size-6 text-emerald-600" />
              <span className="font-display text-xl">{rand(stats.totalIncome)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Total income</p>
          </div>
          <div className="nx-card !p-5">
            <div className="flex items-center justify-between">
              <TrendingDown className="size-6 text-red-500" />
              <span className="font-display text-xl">{rand(stats.totalExpenses)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Total expenses</p>
          </div>
          <div className="nx-card !p-5">
            <div className="flex items-center justify-between">
              <DollarSign className="size-6 text-[var(--nx-gold-deep)]" />
              <span className="font-display text-xl">{rand(stats.net)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Net</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="all">All transactions</option>
            <option value="income">Income only</option>
            <option value="expense">Expenses only</option>
          </select>
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="h-9 w-40"
          />
        </div>

        {showForm && (
          <div className="nx-card mt-6 !p-6">
            <h3 className="font-display text-lg">{editing ? "Edit transaction" : "Add transaction"}</h3>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const amount = Number(form.amount);
                if (!amount || !form.description || !form.category) {
                  toast.error("Fill in all fields.");
                  return;
                }
                saveMut.mutate({
                  data: { id: editing?.id, type: form.type, amount, description: form.description, category: form.category, date: form.date },
                });
              }}
            >
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense", category: "" })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <Input
                type="number"
                step="0.01"
                placeholder="Amount (ZAR)"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">Select category</option>
                {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input
                className="sm:col-span-2"
                placeholder="e.g., Brand partnership with XYZ"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit" disabled={saveMut.isPending} className="bg-banana text-banana-foreground hover:bg-banana/90">
                  {saveMut.isPending ? "Saving…" : editing ? "Update" : "Add"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="nx-card mt-6 !p-6">
          <h3 className="font-display text-lg">Transaction history</h3>
          {list.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No transactions for this period.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] p-4">
                  <div>
                    <p className="text-sm font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.category} · {new Date(t.date).toLocaleDateString("en-ZA")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-display text-lg ${t.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}{rand(t.amount)}
                    </span>
                    <button onClick={() => startEdit(t)} className="p-1.5 hover:bg-muted rounded"><Pencil className="size-4 text-muted-foreground" /></button>
                    <button
                      onClick={() => { if (confirm("Delete this transaction?")) deleteMut.mutate({ data: { id: t.id } }); }}
                      className="p-1.5 hover:bg-muted rounded"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </Shell>
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

function Locked() {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className="nx-card !p-10 text-center">
          <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
          <h2 className="mt-4 text-2xl">Income Tracker is in the Foundation Kit.</h2>
          <p className="nx-body max-w-md mx-auto mt-2">Track every PAIDS stream in one place. Get the kit to unlock this and every interactive app.</p>
          <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
        </div>
      </main>
    </Shell>
  );
}
