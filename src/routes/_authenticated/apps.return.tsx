import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { getReturnData } from "@/lib/return-engine.functions";
import { returnSignals, digestHeadline, nextProvisionalDeadline, type Signal } from "@/lib/return-engine";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/return")({
  head: () => ({ meta: [{ title: "What Needs You — Contentpreneur Africa" }] }),
  component: ReturnPage,
});

function ReturnPage() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Engine />;
}

function Engine() {
  const fn = useServerFn(getReturnData);
  const { data, isLoading } = useQuery({
    queryKey: ["return-engine"],
    queryFn: () => fn({ data: {} }),
  });

  const signals = useMemo(() => {
    if (!data) return [];
    return returnSignals({
      deals: data.deals as never,
      income: data.income as never,
      reservePercent: data.reservePercent,
    });
  }, [data]);

  const headline = useMemo(() => digestHeadline(signals), [signals]);
  const deadline = useMemo(() => nextProvisionalDeadline(), []);
  const hasNothing = !isLoading && (data?.deals.length ?? 0) === 0 && (data?.income.length ?? 0) === 0;

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">The Return</p>
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            {isLoading ? "Checking…" : headline}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Every other tool here makes something. This one tells you what has gone quiet since
            you last looked — computed from your own rows, not guessed.
          </p>
        </header>

        {isLoading && <p className="text-muted-foreground py-8">Reading your numbers…</p>}

        {hasNothing && (
          <div className="rounded-lg border border-dashed p-10 text-center space-y-3">
            <p className="font-medium">There is nothing to check yet.</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              This page works off your deals and your income log. Put one real deal in — the last
              one you were paid for — and it starts working immediately.
            </p>
            <Button asChild size="sm">
              <Link to="/apps/deals">Log a deal <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        )}

        {!isLoading && !hasNothing && (
          <section className="space-y-3">
            {signals.map((s) => <SignalCard key={s.id} signal={s} />)}
          </section>
        )}

        <section className="rounded-lg border bg-muted/30 p-5 space-y-2">
          <h2 className="font-semibold">Why this page exists</h2>
          <p className="text-sm text-muted-foreground">
            The pattern that costs creators the most money is not a bad launch. It is a good one
            that never gets returned to — a channel that paid well, then quietly stopped, and the
            algorithm got the blame.
          </p>
          <p className="text-sm text-muted-foreground">
            So this page borrows a deadline you do not control. Your{" "}
            <span className="text-foreground font-medium">{deadline.label.toLowerCase()}</span> is
            a date SARS enforces whether you remember it or not. Everything else here decays
            against dates your own records already carry.
          </p>
        </section>

        <p className="text-xs text-muted-foreground">
          Every number on this page is computed from your rows. Nothing here is generated, estimated
          or inferred — if a figure looks wrong, the underlying record is wrong, and you can go and
          fix it. Not tax advice; confirm anything you file with a registered practitioner.
        </p>
      </div>
    </Shell>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const tone = {
    urgent: { border: "border-destructive/40", bg: "bg-destructive/5", text: "text-destructive", Icon: AlertTriangle },
    attention: { border: "border-amber-500/40", bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400", Icon: Clock },
    ok: { border: "border-border", bg: "", text: "text-emerald-600 dark:text-emerald-400", Icon: CheckCircle2 },
  }[signal.state];

  return (
    <article className={`rounded-lg border p-5 ${tone.border} ${tone.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <tone.Icon className={`h-4 w-4 shrink-0 ${tone.text}`} />
            <h3 className="font-semibold">{signal.title}</h3>
          </div>
          <p className="text-sm mt-2">{signal.action}</p>
          {signal.because && (
            <p className="text-xs text-muted-foreground mt-2 italic">{signal.because}</p>
          )}
        </div>
        <p className={`text-xl font-semibold tabular-nums shrink-0 ${tone.text}`}>{signal.value}</p>
      </div>
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
        <h1 className="text-2xl font-bold">The Return</h1>
        <p className="text-muted-foreground">
          Part of the Foundation Kit. It tells you what has gone quiet since you last looked.
        </p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
