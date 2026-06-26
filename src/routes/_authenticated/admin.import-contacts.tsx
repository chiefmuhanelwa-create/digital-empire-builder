import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import Papa from "papaparse";
import { SiteHeader, SiteFooter } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { importContactsBatch } from "@/lib/contacts-import.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/import-contacts")({
  head: () => ({ meta: [{ title: "Import Contacts — Admin" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: ImportContacts,
});

const BATCH_SIZE = 100;
const DELAY_MS = 2500;

type RowObj = Record<string, unknown>;
type ErrRow = {
  row: number;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  reason: string;
  detail: string;
};

function ImportContacts() {
  const importFn = useServerFn(importContactsBatch);
  const [rows, setRows] = useState<RowObj[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [inserted, setInserted] = useState(0);
  const [updated, setUpdated] = useState(0);
  const [tagged, setTagged] = useState(0);
  const [errors, setErrors] = useState<ErrRow[]>([]);
  const stopRef = useRef(false);

  const onFile = (f: File) => {
    setFileName(f.name);
    Papa.parse<RowObj>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data);
        setDone(0);
        setInserted(0);
        setUpdated(0);
        setTagged(0);
        setErrors([]);
      },
      error: (err) => toast.error(`Parse failed: ${err.message}`),
    });
  };

  const start = async () => {
    if (rows.length === 0) return;
    setRunning(true);
    stopRef.current = false;
    let i = 0;
    while (i < rows.length && !stopRef.current) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      try {
        const res = await importFn({ data: { rows: batch } });
        setInserted((x) => x + res.inserted);
        setUpdated((x) => x + res.updated);
        setTagged((x) => x + res.tagged);
        if (res.errors.length) {
          setErrors((x) => [...x, ...res.errors.map((e) => ({ ...e, row: e.row + i }))]);
        }
      } catch (err: any) {
        toast.error(err?.message ?? "Batch failed");
        setErrors((x) => [
          ...x,
          { row: i, email: null, reason: "Network/Server Error", detail: err?.message ?? "Batch error" },
        ]);
      }
      i += BATCH_SIZE;
      setDone(Math.min(i, rows.length));
      if (i < rows.length && !stopRef.current) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }
    setRunning(false);
    toast.success("Import complete");
  };

  const downloadErrors = () => {
    const csv = Papa.unparse({
      fields: ["row", "reason", "email", "first_name", "last_name", "phone", "detail"],
      data: errors.map((e) => ({
        row: e.row,
        reason: e.reason,
        email: e.email ?? "",
        first_name: e.first_name ?? "",
        last_name: e.last_name ?? "",
        phone: e.phone ?? "",
        detail: e.detail,
      })),
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "import-errors.csv";
    a.click();
  };

  const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;
  const preview = rows.slice(0, 10);
  const headers = preview[0] ? Object.keys(preview[0]) : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Admin</div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Import Contacts</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Upload a CSV of legacy contacts. They'll be upserted into subscribers and tagged{" "}
          <code className="font-mono">legacy_prelaunch_may_2026</code>. Batches of {BATCH_SIZE} every{" "}
          {DELAY_MS / 1000}s.
        </p>

        <div className="mt-8 border border-border p-6">
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              CSV file
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={running}
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              className="mt-2 block w-full text-sm"
            />
          </label>
          {fileName && (
            <p className="mt-3 text-xs text-muted-foreground">
              {fileName} — {rows.length.toLocaleString()} rows detected
            </p>
          )}
        </div>

        {preview.length > 0 && (
          <div className="mt-6 border border-border overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-mono uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-2">
                        {String(r[h] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            onClick={start}
            disabled={running || rows.length === 0}
            className="bg-banana text-banana-foreground hover:bg-banana/90"
          >
            {running ? "Importing…" : `Start import (${rows.length.toLocaleString()})`}
          </Button>
          {running && (
            <Button variant="outline" onClick={() => (stopRef.current = true)}>
              Stop
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link to="/dashboard">← Back</Link>
          </Button>
        </div>

        {rows.length > 0 && (
          <div className="mt-8">
            <div className="h-2 bg-muted overflow-hidden">
              <div className="h-full bg-banana transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <Stat label="Processed" value={`${done}/${rows.length}`} />
              <Stat label="Inserted" value={inserted} />
              <Stat label="Updated" value={updated} />
              <Stat label="Tagged" value={tagged} />
            </div>
            {errors.length > 0 && (
              <div className="mt-4 border border-destructive/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-destructive">
                    {errors.length} error{errors.length === 1 ? "" : "s"}
                  </span>
                  <Button size="sm" variant="outline" onClick={downloadErrors}>
                    Download errors CSV
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg">{value}</div>
    </div>
  );
}
