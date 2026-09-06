import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { getFigureGateData } from "@/lib/figure-gate.functions";
import { checkFigure, CLAIM_LABELS, type ClaimType, type GateResult } from "@/lib/figure-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, ShieldCheck, ShieldAlert, ShieldQuestion, TrendingUp, Copy, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/figure-check")({
  head: () => ({ meta: [{ title: "Figure Check — Contentpreneur Africa" }] }),
  component: FigureCheckPage,
});

function FigureCheckPage() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Gate />;
}

function Gate() {
  const fn = useServerFn(getFigureGateData);
  const { data, isLoading } = useQuery({ queryKey: ["figure-gate"], queryFn: () => fn() });

  const [claim, setClaim] = useState<ClaimType>("rate_for_deliverable");
  const [value, setValue] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [result, setResult] = useState<GateResult | null>(null);

  const deliverables = useMemo(() => {
    const s = new Set((data?.deals ?? []).map((d) => d.deliverable.trim()).filter(Boolean));
    return [...s].sort();
  }, [data]);

  const hasNothing = !isLoading && (data?.deals.length ?? 0) === 0 && (data?.income.length ?? 0) === 0;

  function run(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return toast.error("Enter the number you were about to say");
    if (claim === "rate_for_deliverable" && !deliverable.trim())
      return toast.error("Which deliverable?");
    setResult(
      checkFigure({
        claim,
        value: n,
        deliverable,
        deals: (data?.deals ?? []) as never,
        income: (data?.income ?? []) as never,
      }),
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">The Verified-Figure Gate</p>
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Check the number before you say it out loud
          </h1>
          <p className="text-muted-foreground">
            Type a figure you are about to put in a pitch, a caption or a rate reply. This checks it
            against what your own records actually show.
          </p>
        </header>

        {hasNothing ? (
          <div className="rounded-lg border border-dashed p-10 text-center space-y-3">
            <p className="font-medium">There is nothing to check against yet.</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              This works off deals you have been paid for. Log one — the last deal that actually
              landed — and every number you say afterwards has a receipt behind it.
            </p>
            <Button asChild size="sm">
              <Link to="/apps/deals">Log a deal <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={run} className="rounded-lg border p-5 space-y-4">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">What are you about to claim?</span>
              <select
                value={claim}
                onChange={(e) => { setClaim(e.target.value as ClaimType); setResult(null); }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {(Object.keys(CLAIM_LABELS) as ClaimType[]).map((k) => (
                  <option key={k} value={k}>{CLAIM_LABELS[k]}</option>
                ))}
              </select>
            </label>

            {claim === "rate_for_deliverable" && (
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted-foreground">For what</span>
                <Input
                  list="deliverables"
                  value={deliverable}
                  onChange={(e) => setDeliverable(e.target.value)}
                  placeholder="e.g. Instagram reel"
                />
                <datalist id="deliverables">
                  {deliverables.map((d) => <option key={d} value={d} />)}
                </datalist>
              </label>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                {claim === "brand_count" ? "How many brands" : "The number you were going to say"}
              </span>
              <Input
                type="number"
                step={claim === "brand_count" ? "1" : "0.01"}
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={claim === "brand_count" ? "50" : "15000"}
              />
            </label>

            <Button type="submit" disabled={isLoading}>Check it</Button>
          </form>
        )}

        {result && <ResultCard result={result} />}

        <section className="rounded-lg border bg-muted/30 p-5 space-y-2">
          <h2 className="font-semibold">Why this is worth doing</h2>
          <p className="text-sm text-muted-foreground">
            Ten figures were once audited across one creator's public claims — rates, totals, list
            sizes. Ten were wrong. Every one was wrong in the direction that flattered him, and not
            one was wrong the other way.
          </p>
          <p className="text-sm text-muted-foreground">
            None of it was lying. Memory does not drift randomly. It drifts toward the version that
            makes you look better, and you cannot feel it happening — which is the entire reason a
            number needs checking before it is said, not after somebody challenges it.
          </p>
        </section>
      </div>
    </Shell>
  );
}

function ResultCard({ result }: { result: GateResult }) {
  const tone = {
    verified: { border: "border-emerald-500/40", bg: "bg-emerald-500/5", text: "text-emerald-600 dark:text-emerald-400", Icon: ShieldCheck },
    overstated: { border: "border-destructive/40", bg: "bg-destructive/5", text: "text-destructive", Icon: ShieldAlert },
    understated: { border: "border-amber-500/40", bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400", Icon: TrendingUp },
    no_record: { border: "border-border", bg: "bg-muted/40", text: "text-muted-foreground", Icon: ShieldQuestion },
  }[result.verdict];

  return (
    <article className={`rounded-lg border p-5 space-y-3 ${tone.border} ${tone.bg}`}>
      <div className="flex items-start gap-2">
        <tone.Icon className={`h-5 w-5 shrink-0 mt-0.5 ${tone.text}`} />
        <h2 className="font-semibold text-lg leading-tight">{result.headline}</h2>
      </div>

      <p className="text-sm">{result.detail}</p>

      {result.evidence.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {result.evidence.map((e, i) => <li key={i}>· {e}</li>)}
        </ul>
      )}

      {result.sayInstead && (
        <div className="rounded-md border bg-background p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Say this</p>
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{result.sayInstead}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(result.sayInstead);
                toast.success("Copied");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Rounded down, never up. “Over” survives a challenge. “About” and “roughly” do not.
          </p>
        </div>
      )}
    </article>
  );
}

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
        <h1 className="text-2xl font-bold">Figure Check</h1>
        <p className="text-muted-foreground">
          Part of the Foundation Kit. It checks a number against your own records before you say it.
        </p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
