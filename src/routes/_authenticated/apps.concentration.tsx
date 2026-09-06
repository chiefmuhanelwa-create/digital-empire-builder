import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { listSnapshots, saveSnapshot } from "@/lib/audience.functions";
import {
  stressTest, ifThisEnded, migrationPlan, nextMove, type Channel,
} from "@/lib/concentration-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Waves, Anchor, Save, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/concentration")({
  head: () => ({ meta: [{ title: "Concentration Stress Test — Contentpreneur Africa" }] }),
  component: Page,
});

const STARTER: Channel[] = [
  { id: "c1", platform: "Instagram", kind: "rented", size: 0, reachable: 0, monthlyIncome: 0 },
  { id: "c2", platform: "Email list", kind: "owned", size: 0, reachable: 0, monthlyIncome: 0 },
];

function Page() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Tool />;
}

function Tool() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSnapshots);
  const saveFn = useServerFn(saveSnapshot);
  const { data } = useQuery({ queryKey: ["audience-snapshots"], queryFn: () => listFn() });

  const [channels, setChannels] = useState<Channel[]>(STARTER);
  const [ended, setEnded] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Pick up where the last snapshot left off, so this is a re-run rather than
  // a blank form every time. That is the whole difference between a tool and
  // a record.
  useEffect(() => {
    if (loaded || !data?.snapshots?.length) return;
    const last = data.snapshots[0]?.channels as Channel[] | undefined;
    if (last?.length) setChannels(last);
    setLoaded(true);
  }, [data, loaded]);

  const result = useMemo(() => stressTest(channels), [channels]);
  const aftermath = useMemo(() => (ended ? ifThisEnded(channels, ended) : null), [channels, ended]);
  const plan = useMemo(() => migrationPlan(result), [result]);
  const move = useMemo(() => nextMove(result), [result]);

  const prev = data?.snapshots?.[0];
  const prevOwned = useMemo(() => {
    if (!prev) return null;
    const r = stressTest((prev.channels as Channel[]) ?? []);
    return r.totalReach > 0 ? r.ownedPct : null;
  }, [prev]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { channels, notes: null } }),
    onSuccess: () => { toast.success("Snapshot saved"); qc.invalidateQueries({ queryKey: ["audience-snapshots"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (i: number, patch: Partial<Channel>) =>
    setChannels((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const tone = { fragile: "border-destructive/50 bg-destructive/5", exposed: "border-amber-500/40 bg-amber-500/5", spread: "border-emerald-500/40 bg-emerald-500/5" }[result.verdict];

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">If it ended tonight</h1>
          <p className="text-muted-foreground max-w-2xl">
            The river carries the fish. It is not yours, and it can be diverted without notice —
            no warning, no export, and an appeal process that can simply say no twice. This works
            out how much of your business is sitting in the river, and what is left standing if
            the biggest one stops.
          </p>
        </header>

        <section className="rounded-lg border p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-semibold">Your channels</h2>
            <Button size="sm" variant="outline" onClick={() =>
              setChannels([...channels, { id: `c${Date.now()}`, platform: "", kind: "rented", size: 0, reachable: 0, monthlyIncome: 0 }])}>
              Add channel
            </Button>
          </div>

          <div className="hidden sm:grid grid-cols-[1fr_7rem_6rem_6rem_7rem_2rem] gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Channel</span><span>Owned?</span><span>Size</span><span>Reach</span><span>Income / mo</span><span />
          </div>

          {channels.map((c, i) => (
            <div key={c.id} className="grid gap-2 sm:grid-cols-[1fr_7rem_6rem_6rem_7rem_2rem] sm:items-center">
              <Input value={c.platform} onChange={(e) => set(i, { platform: e.target.value })} placeholder="Platform" />
              <select value={c.kind} onChange={(e) => set(i, { kind: e.target.value as Channel["kind"] })}
                className="flex h-9 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="rented">Rented</option>
                <option value="owned">Owned</option>
              </select>
              <Input type="number" min="0" value={c.size || ""} onChange={(e) => set(i, { size: Number(e.target.value) || 0 })} placeholder="0" />
              <Input type="number" min="0" value={c.reachable || ""} onChange={(e) => set(i, { reachable: Number(e.target.value) || 0 })} placeholder="0" />
              <Input type="number" min="0" value={c.monthlyIncome || ""} onChange={(e) => set(i, { monthlyIncome: Number(e.target.value) || 0 })} placeholder="0" />
              <Button variant="ghost" size="sm" onClick={() => setChannels(channels.filter((_, j) => j !== i))} disabled={channels.length === 1}>×</Button>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            <strong>Owned</strong> means you keep it if the platform closes your account — an email
            list, a WhatsApp list, a customer database. A follower count is rented, however large.
            <strong> Reach</strong> is how many you actually get in front of, not how many exist.
          </p>
        </section>

        {result.risks.length > 0 && (
          <section className={`rounded-lg border p-5 space-y-4 ${tone}`}>
            <h2 className="text-lg font-semibold">{result.headline}</h2>

            <div className="grid gap-3 sm:grid-cols-3 text-sm tabular-nums">
              <Stat label="Owned audience" value={`${Math.round(result.ownedPct)}%`}
                sub={prevOwned !== null ? `was ${Math.round(prevOwned)}% at the last snapshot` : "of everyone you can reach"} />
              <Stat label="Biggest channel" value={`${Math.round(result.topIncomeShare)}%`} sub="of monthly income" />
              <Stat label="Reachable, total" value={result.totalReach.toLocaleString("en-GB")} sub={`${result.ownedReach.toLocaleString("en-GB")} of them yours`} />
            </div>

            <div className="space-y-1.5">
              {result.risks.slice().sort((a, b) => b.incomeShare - a.incomeShare).map((r) => (
                <div key={r.channel.id} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 truncate flex items-center gap-1">
                    {r.channel.kind === "owned"
                      ? <Anchor className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      : <Waves className="h-3 w-3 text-muted-foreground shrink-0" />}
                    {r.channel.platform}
                  </span>
                  <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <span className={`block h-full ${r.channel.kind === "owned" ? "bg-emerald-500" : "bg-foreground/40"}`}
                      style={{ width: `${Math.min(100, r.incomeShare)}%` }} />
                  </span>
                  <span className="w-12 text-right tabular-nums text-muted-foreground">{Math.round(r.incomeShare)}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {result.risks.length > 0 && (
          <section className="rounded-lg border p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-1.5"><TrendingDown className="h-4 w-4" />Run the test</h2>
            <select value={ended ?? ""} onChange={(e) => setEnded(e.target.value || null)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">Which channel ends tonight?</option>
              {result.risks.map((r) => <option key={r.channel.id} value={r.channel.id}>{r.channel.platform}</option>)}
            </select>

            {aftermath && (
              <div className="rounded-md border bg-muted/30 p-4 space-y-2">
                <p className="text-sm">
                  You wake up without{" "}
                  <strong>{aftermath.lostReach.toLocaleString("en-GB")}</strong> of the people you could
                  reach and <strong>{rand(aftermath.lostIncome)}</strong> a month.
                </p>
                <p className="text-sm">
                  What is left: <strong>{rand(aftermath.remainingIncome)}</strong> a month —{" "}
                  {Math.round(aftermath.survivingPct)}% of what you had — reaching{" "}
                  <strong>{aftermath.remainingReach.toLocaleString("en-GB")}</strong> people.
                </p>
                <p className="text-xs text-muted-foreground">
                  Assume no export and no appeal. That is not pessimism — an ad account terminated at
                  the end of 2024 in this founder's own business went to two appeals and was refused
                  both times, the second as final.
                </p>
              </div>
            )}
          </section>
        )}

        {plan && (
          <section className="rounded-lg border p-5 space-y-2">
            <h2 className="font-semibold">Getting to {plan.targetPct}% owned</h2>
            <p className="text-sm">
              You would need to move <strong>{plan.toMove.toLocaleString("en-GB")}</strong> people onto
              something you own.
            </p>
            <p className="text-xs text-muted-foreground">{plan.note}</p>
          </section>
        )}

        {result.risks.length > 0 && (
          <section className="rounded-lg border p-5 space-y-3">
            <h2 className="font-semibold">The one thing</h2>
            <p className="text-sm">{move}</p>
            <Button onClick={() => save.mutate()} disabled={save.isPending} variant="outline" size="sm">
              <Save className="mr-1 h-3.5 w-3.5" />{save.isPending ? "Saving…" : "Save this snapshot"}
            </Button>
            <p className="text-xs text-muted-foreground">
              One snapshot is a number. Two is a direction — and the direction is the only part that
              tells you whether any of this is working.
            </p>
          </section>
        )}

        {(data?.snapshots?.length ?? 0) > 1 && (
          <section className="rounded-lg border p-5 space-y-2">
            <h2 className="font-semibold">History</h2>
            <div className="space-y-1 text-sm tabular-nums">
              {data!.snapshots.map((s) => {
                const r = stressTest((s.channels as Channel[]) ?? []);
                return (
                  <p key={s.id} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{s.taken_on}</span>
                    <span>{Math.round(r.ownedPct)}% owned · {Math.round(r.topIncomeShare)}% in one channel</span>
                  </p>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function rand(n: number) {
  return `R${Math.round(n).toLocaleString("en-GB")}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader /><main className="flex-1">{children}</main><SiteFooter />
    </div>
  );
}

function Locked() {
  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-3">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-bold">If it ended tonight</h1>
        <p className="text-muted-foreground">
          Part of the Foundation Kit. Work out how much of your business is sitting on rented land.
        </p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
