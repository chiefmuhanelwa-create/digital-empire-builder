import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";

const getAuditLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await supabaseAdmin
      .from("audit_ledgers")
      .select(
        "id,order_id,provider_reference,gross_cents,vat_allocation_cents,tax_reserve_cents,net_cents,currency,customer_email_hash,paid_at",
      )
      .order("paid_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const totals = (data ?? []).reduce(
      (acc, r) => {
        acc.gross += r.gross_cents;
        acc.vat += r.vat_allocation_cents;
        acc.tax += r.tax_reserve_cents;
        acc.net += r.net_cents;
        return acc;
      },
      { gross: 0, vat: 0, tax: 0, net: 0 },
    );

    return { rows: data ?? [], totals };
  });

export const Route = createFileRoute("/_authenticated/admin/ledger")({
  head: () => ({ meta: [{ title: "Audit Ledger — Admin" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: LedgerPage,
});

function fmt(cents: number, currency = "ZAR") {
  const sym = currency === "ZAR" ? "R" : currency + " ";
  return `${sym} ${(cents / 100).toFixed(2)}`;
}

function LedgerPage() {
  const fn = useServerFn(getAuditLedger);
  const q = useQuery({ queryKey: ["audit-ledger"], queryFn: () => fn() });

  const downloadCsv = () => {
    if (!q.data) return;
    const header = [
      "paid_at",
      "order_id",
      "provider_reference",
      "currency",
      "gross",
      "vat_15",
      "tax_25",
      "net",
      "email_hash",
    ];
    const rows = q.data.rows.map((r) => [
      r.paid_at,
      r.order_id,
      r.provider_reference ?? "",
      r.currency,
      (r.gross_cents / 100).toFixed(2),
      (r.vat_allocation_cents / 100).toFixed(2),
      (r.tax_reserve_cents / 100).toFixed(2),
      (r.net_cents / 100).toFixed(2),
      r.customer_email_hash,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chkplt-audit-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Admin · Audit Ledger
        </div>
        <h1 className="mt-4 font-display text-5xl">Immutable Tax Trail</h1>
        <p className="mt-4 text-sm text-muted-foreground max-w-2xl">
          Permanent, read-only record of every paid order. 15% VAT allocation,
          25% tax reserve, and net captured at the moment of confirmation.
          Database-level triggers reject any update or delete attempt — even
          from an admin session.
        </p>

        {q.isLoading && (
          <div className="mt-10 text-sm text-muted-foreground">Loading ledger…</div>
        )}
        {q.error && (
          <div className="mt-10 text-sm text-destructive">{(q.error as Error).message}</div>
        )}

        {q.data && (
          <>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
              {[
                { label: "Gross", value: fmt(q.data.totals.gross) },
                { label: "VAT (15%)", value: fmt(q.data.totals.vat) },
                { label: "Tax reserve (25%)", value: fmt(q.data.totals.tax) },
                { label: "Net", value: fmt(q.data.totals.net) },
              ].map((s) => (
                <div key={s.label} className="bg-background p-5">
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-2 font-display text-2xl">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={downloadCsv}>
                Download CSV
              </Button>
            </div>

            <div className="mt-4 overflow-x-auto border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40 font-mono text-[10px] tracking-[0.2em] uppercase">
                  <tr>
                    <th className="text-left p-3">Paid</th>
                    <th className="text-left p-3">Reference</th>
                    <th className="text-right p-3">Gross</th>
                    <th className="text-right p-3">VAT</th>
                    <th className="text-right p-3">Tax</th>
                    <th className="text-right p-3">Net</th>
                    <th className="text-left p-3">Email hash</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-3 whitespace-nowrap">
                        {new Date(r.paid_at).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {r.provider_reference ?? "—"}
                      </td>
                      <td className="p-3 text-right">{fmt(r.gross_cents, r.currency)}</td>
                      <td className="p-3 text-right">{fmt(r.vat_allocation_cents, r.currency)}</td>
                      <td className="p-3 text-right">{fmt(r.tax_reserve_cents, r.currency)}</td>
                      <td className="p-3 text-right">{fmt(r.net_cents, r.currency)}</td>
                      <td className="p-3 font-mono text-[10px] text-muted-foreground">
                        {r.customer_email_hash.slice(0, 16)}…
                      </td>
                    </tr>
                  ))}
                  {q.data.rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No paid orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
