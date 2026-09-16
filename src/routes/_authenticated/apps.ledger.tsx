import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { listLedger, upsertLedgerEntry, deleteLedgerEntry, bannedAttempts } from "@/lib/ledger.functions";
import { LEDGER_KINDS, LEDGER_PROMPTS, roundDown, type LedgerEntry } from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Plus, Trash2, ShieldCheck, ShieldAlert, ShieldX, X, Repeat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/ledger")({
  head: () => ({ meta: [{ title: "The Ledger — Contentpreneur Africa" }] }),
  component: Page,
});

const INK = "#1C1C1C";
const GOLD = "#D4A82F";

function Page() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Tool />;
}

const BLANK = {
  kind: "money" as const, label: "", value_number: null as number | null, currency: "ZAR",
  value_text: "", status: "verified" as const, source: "", occurred_on: "",
  counterparty: "", replacement: "", notes: "",
};

function Tool() {
  const qc = useQueryClient();
  const listFn = useServerFn(listLedger);
  const saveFn = useServerFn(upsertLedgerEntry);
  const delFn = useServerFn(deleteLedgerEntry);
  const attemptsFn = useServerFn(bannedAttempts);

  const { data } = useQuery({ queryKey: ["ledger"], queryFn: () => listFn() });
  const { data: att } = useQuery({ queryKey: ["ledger-attempts"], queryFn: () => attemptsFn() });

  const [d, setD] = useState<any>({ ...BLANK });
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const entries = (data?.entries ?? []) as LedgerEntry[];
  const attempts = att?.attempts ?? [];

  const counts = useMemo(() => ({
    verified: entries.filter((e) => e.status === "verified").length,
    unverified: entries.filter((e) => e.status === "unverified").length,
    banned: entries.filter((e) => e.status === "banned").length,
  }), [entries]);

  const shown = filter === "all" ? entries : entries.filter((e) => e.status === filter);

  const save = useMutation({
    mutationFn: () => saveFn({ data: {
      ...d,
      value_number: d.value_number === "" || d.value_number === null ? null : Number(d.value_number),
      occurred_on: d.occurred_on || null,
    } }),
    onSuccess: () => { toast.success("In the ledger"); setD({ ...BLANK }); setOpen(false); qc.invalidateQueries({ queryKey: ["ledger"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Shell>
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${INK} 0%, #2a2518 55%, ${INK} 100%)` }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: `radial-gradient(circle at 20% 35%, ${GOLD} 0%, transparent 45%)` }} />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: GOLD }}>Contentpreneur Africa</p>
          <h1 className="mt-3 font-extrabold tracking-tight text-white text-4xl sm:text-6xl leading-[0.95]">
            THE <span style={{ color: GOLD }}>LEDGER</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[#C8C2B4] leading-relaxed">
            Your own verified numbers. Everything you write gets checked against this, and the engine
            refuses to print a figure that isn't in it. <strong className="text-white">It will never make
            you sound like something you're not.</strong>
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button className="bg-[#D4A82F] text-[#1C1C1C] hover:bg-[#D9BC45] font-semibold" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />Add an entry
            </Button>
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-400">{counts.verified} verified</span>
              <span className="text-amber-400">{counts.unverified} unverified</span>
              <span className="text-red-400">{counts.banned} banned</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-7">
        {entries.length === 0 && !open && (
          <section className="rounded-xl border p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Start with eight</h2>
              <p className="text-sm text-muted-foreground">
                These are the shapes every creator needs — the labels are the prompt, the numbers are yours.
                Eight entries is enough for the engine to start catching things.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {LEDGER_PROMPTS.map((p) => (
                <button key={p.label} onClick={() => { setD({ ...BLANK, kind: p.kind, label: p.label }); setOpen(true); }}
                  className="text-left rounded-lg border p-3 hover:bg-muted/40">
                  <span className="text-sm font-medium">{p.label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{p.hint}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {attempts.length > 0 && (
          <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <p className="font-semibold text-sm flex items-center gap-1.5">
              <Repeat className="h-4 w-4 text-destructive" />Banned figures you keep reaching for
            </p>
            <div className="mt-2 space-y-1">
              {attempts.slice(0, 5).map((a: any) => (
                <p key={a.claim} className="text-xs">
                  <strong>{a.claim}</strong> — blocked {a.n} {a.n === 1 ? "time" : "times"}
                </p>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              A banned figure attempted repeatedly is a retraining problem, not a typo. Make sure each one
              has a replacement recorded — a ban without an alternative gets ignored under deadline.
            </p>
          </section>
        )}

        {open && (
          <section className="rounded-xl border p-5 space-y-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">New entry</h2>
              <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setD({ ...BLANK }); }}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <F label="Kind">
                <Sel value={d.kind} onChange={(v) => setD({ ...d, kind: v })}
                  options={LEDGER_KINDS.map((k) => [k.key, k.label] as [string, string])} />
              </F>
              <F label="Status">
                <Sel value={d.status} onChange={(v) => setD({ ...d, status: v })}
                  options={[["verified", "Verified — a source exists"], ["unverified", "Unverified — asserted, needs a hedge"], ["banned", "Banned — never ships"]]} />
              </F>
            </div>
            <p className="text-xs text-muted-foreground">{LEDGER_KINDS.find((k) => k.key === d.kind)?.hint}</p>

            <F label="What this entry is, in plain words">
              <Input value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} placeholder="Highest fee actually received" /></F>

            {d.kind === "quote" ? (
              <F label="The exact words">
                <textarea value={d.value_text} onChange={(e) => setD({ ...d, value_text: e.target.value })} rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder={`"We had a number for this before we ever contacted you."`} /></F>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <F label="The figure"><Input type="number" step="0.01" value={d.value_number ?? ""} onChange={(e) => setD({ ...d, value_number: e.target.value })} /></F>
                <F label="Currency"><Sel value={d.currency} onChange={(v) => setD({ ...d, currency: v })} options={[["ZAR", "ZAR"], ["USD", "USD"]]} /></F>
                <F label="When"><Input type="date" value={d.occurred_on} onChange={(e) => setD({ ...d, occurred_on: e.target.value })} /></F>
              </div>
            )}

            {d.status === "banned" ? (
              <F label="What to say instead — required, or the ban gets ignored under deadline">
                <Input value={d.replacement} onChange={(e) => setD({ ...d, replacement: e.target.value })} placeholder="The defensible figure or phrasing" /></F>
            ) : (
              <F label="The source — what you could produce if challenged">
                <Input value={d.source} onChange={(e) => setD({ ...d, source: e.target.value })} placeholder="Bank statement · signed PO · the email itself" /></F>
            )}

            {d.value_number && d.status === "verified" && (
              <p className="text-xs rounded-md bg-muted px-2.5 py-2">
                Safe rounded form: <strong>{roundDown(Number(d.value_number), d.currency)}</strong> — rounding always rounds down.
              </p>
            )}

            <Button onClick={() => save.mutate()} disabled={!d.label.trim() || save.isPending} className="bg-[#1C1C1C] hover:bg-[#333]">
              {save.isPending ? "Saving…" : "Add to ledger"}
            </Button>
          </section>
        )}

        {entries.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Entries</h2>
              <div className="flex gap-1">
                {["all", "verified", "unverified", "banned"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-full border px-3 py-1 text-xs capitalize ${filter === f ? "bg-[#1C1C1C] text-white" : "hover:bg-muted"}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border divide-y">
              {shown.map((e) => {
                const Icon = e.status === "verified" ? ShieldCheck : e.status === "unverified" ? ShieldAlert : ShieldX;
                const tone = e.status === "verified" ? "text-emerald-600" : e.status === "unverified" ? "text-amber-600" : "text-destructive";
                return (
                  <div key={e.id} className="flex items-start gap-3 p-3">
                    <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${tone}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {e.value_number !== null && <strong>{e.currency === "USD" ? "$" : "R"}{Number(e.value_number).toLocaleString("en-GB")}</strong>}
                        {e.value_text && <em>"{e.value_text.slice(0, 90)}{e.value_text.length > 90 ? "…" : ""}"</em>}
                        {e.occurred_on && ` · ${e.occurred_on}`}
                        {e.source && ` · ${e.source}`}
                      </p>
                      {e.replacement && <p className="text-xs mt-1 rounded bg-muted px-2 py-1">Use instead: <strong>{e.replacement}</strong></p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => delFn({ data: { id: e.id } }).then(() => qc.invalidateQueries({ queryKey: ["ledger"] }))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex flex-col"><SiteHeader /><main className="flex-1">{children}</main><SiteFooter /></div>;
}
function Locked() {
  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-3">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-bold">The Ledger</h1>
        <p className="text-muted-foreground">Part of the Foundation Kit. Your own verified numbers, and an engine that refuses to print anything else.</p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
