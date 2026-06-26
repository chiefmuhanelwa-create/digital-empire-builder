import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  getContactsOverview,
  listSubscribers,
  importContacts,
  setSubscriberStatus,
} from "@/lib/contacts.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Christ Kingdom Platform Admin" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminContacts,
});

// ───────────── CSV parser (tiny, RFC-ish) ─────────────
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((v) => v.trim().length))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function AdminContacts() {
  const qc = useQueryClient();
  const overviewFn = useServerFn(getContactsOverview);
  const listFn = useServerFn(listSubscribers);
  const importFn = useServerFn(importContacts);
  const statusFn = useServerFn(setSubscriberStatus);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<"active" | "unsubscribed" | "bounced" | "complained" | undefined>();
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const overview = useQuery({ queryKey: ["contacts-overview"], queryFn: () => overviewFn() });
  const list = useQuery({
    queryKey: ["contacts-list", search, tagFilter, statusFilter, page],
    queryFn: () => listFn({
      data: { search: search || undefined, tagId: tagFilter, status: statusFilter, limit: pageSize, offset: page * pageSize },
    }),
  });

  // Import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importTags, setImportTags] = useState("legacy_list");
  const [importSource, setImportSource] = useState("legacy_list");

  const importMut = useMutation({
    mutationFn: importFn,
    onSuccess: (res: any) => {
      toast.success(`Imported ${res.inserted} new, updated ${res.updated}. ${res.errorCount} errors.`);
      qc.invalidateQueries({ queryKey: ["contacts-overview"] });
      qc.invalidateQueries({ queryKey: ["contacts-list"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Import failed"),
  });

  const statusMut = useMutation({
    mutationFn: statusFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts-overview"] });
      qc.invalidateQueries({ queryKey: ["contacts-list"] });
    },
  });

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { toast.error("File too large (max 15MB)"); return; }
    const text = await f.text();
    const rows = parseCsv(text);
    if (!rows.length) { toast.error("CSV is empty"); return; }
    const tagSlugs = importTags.split(",").map((s) => s.trim()).filter(Boolean);
    importMut.mutate({
      data: { rows, source: importSource || "manual", applyTagSlugs: tagSlugs },
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-24">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Admin</div>
        <h1 className="mt-4 font-display text-5xl">Contacts &amp; Tags</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Every email, every tag, every segment. Owned forever.
        </p>

        {/* Totals */}
        <div className="mt-12 grid gap-px bg-border md:grid-cols-4">
          {[
            { label: "Total subscribers", value: overview.data?.totals.total ?? "—" },
            { label: "Active", value: overview.data?.totals.active ?? "—" },
            { label: "Unsubscribed", value: overview.data?.totals.unsubscribed ?? "—" },
            { label: "Tags", value: overview.data?.tags.length ?? "—" },
          ].map((s) => (
            <div key={s.label} className="bg-background p-6">
              <div className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">{s.label}</div>
              <div className="mt-2 font-display text-4xl tabular-nums">{s.value as any}</div>
            </div>
          ))}
        </div>

        {/* Import */}
        <div className="mt-16 border border-border p-6">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">CSV Import</div>
          <h2 className="mt-2 font-display text-2xl">Import contacts</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload your CSV. Headers like <code className="text-foreground">email</code>, <code className="text-foreground">first_name</code>, <code className="text-foreground">last_name</code>, <code className="text-foreground">phone</code> are auto-detected.
            Existing emails update; new ones insert. Tags merge.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Source label</label>
              <Input value={importSource} onChange={(e) => setImportSource(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Tags to apply (comma-sep slugs)</label>
              <Input value={importTags} onChange={(e) => setImportTags(e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-end">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onFileChosen}
                disabled={importMut.isPending}
                className="block w-full text-sm file:mr-4 file:border-0 file:bg-banana file:text-banana-foreground file:px-4 file:py-2 file:font-mono file:text-xs file:tracking-[0.18em] file:uppercase hover:file:bg-banana/90"
              />
            </div>
          </div>
          {importMut.isPending && <div className="mt-3 text-sm text-muted-foreground">Importing…</div>}
        </div>

        {/* Tag chips */}
        <div className="mt-16">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Segments</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => { setTagFilter(undefined); setPage(0); }}
              className={`px-3 py-1.5 text-xs font-mono tracking-[0.15em] uppercase border ${!tagFilter ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              All
            </button>
            {overview.data?.tags.map((t: any) => (
              <button
                key={t.id}
                onClick={() => { setTagFilter(t.id); setPage(0); }}
                className={`px-3 py-1.5 text-xs font-mono tracking-[0.15em] uppercase border ${tagFilter === t.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                style={tagFilter !== t.id && t.color ? { borderColor: t.color + "55" } : undefined}
              >
                {t.name} <span className="opacity-60">· {t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-10 flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="max-w-xs"
          />
          <select
            value={statusFilter ?? ""}
            onChange={(e) => { setStatusFilter((e.target.value || undefined) as any); setPage(0); }}
            className="h-9 border border-border bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="complained">Complained</option>
          </select>
          <div className="ml-auto font-mono text-xs text-muted-foreground">
            {list.isLoading ? "Loading…" : `${total} match${total === 1 ? "" : "es"}`}
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 border border-border overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/30 px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground min-w-[680px]">
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-2">Tags</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {(list.data?.rows ?? []).map((r: any) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 border-b border-border/60 px-4 py-3 text-sm items-center min-w-[680px]">
              <div className="col-span-4 truncate">{r.email}</div>
              <div className="col-span-2 truncate text-muted-foreground">
                {[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
              </div>
              <div className="col-span-2 font-mono text-xs text-muted-foreground">{r.source}</div>
              <div className="col-span-2 flex flex-wrap gap-1">
                {r.tags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                {r.tags.map((t: any) => (
                  <Badge key={t.id} variant="outline" className="text-[10px]" style={t.color ? { borderColor: t.color + "77" } : undefined}>
                    {t.name}
                  </Badge>
                ))}
              </div>
              <div className="col-span-2 text-right">
                <select
                  value={r.status}
                  onChange={(e) => statusMut.mutate({ data: { subscriberId: r.id, status: e.target.value as any } })}
                  className="h-7 border border-border bg-background px-2 text-xs"
                >
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="bounced">Bounced</option>
                  <option value="complained">Complained</option>
                </select>
              </div>
            </div>
          ))}
          {!list.isLoading && (list.data?.rows.length ?? 0) === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No subscribers yet. Import a CSV above to get started.
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <div className="font-mono text-xs text-muted-foreground">
              Page {page + 1} of {pages}
            </div>
            <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
