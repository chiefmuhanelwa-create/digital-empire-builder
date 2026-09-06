import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { getFigureGateData } from "@/lib/figure-gate.functions";
import { BRIEF_FIELDS, checkBrief } from "@/lib/brief-check";
import { buildPitch } from "@/lib/pitch-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Copy, ClipboardCheck, Send, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/brief-check")({
  head: () => ({ meta: [{ title: "Brief Check — Contentpreneur Africa" }] }),
  component: Page,
});

function Page() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Tool />;
}

function Tool() {
  const [tab, setTab] = useState<"brief" | "pitch">("brief");
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Before you say yes</h1>
          <p className="text-muted-foreground max-w-2xl">
            A brief lands with a 24-hour deadline. Check what is missing from it before you reply —
            then send a pitch that only claims what your records can back.
          </p>
        </header>

        <div className="flex gap-2">
          <Tab active={tab === "brief"} onClick={() => setTab("brief")}><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />Brief check</Tab>
          <Tab active={tab === "pitch"} onClick={() => setTab("pitch")}><Send className="mr-1.5 h-3.5 w-3.5" />Pitch builder</Tab>
        </div>

        {tab === "brief" ? <BriefCheck /> : <PitchBuilder />}
      </div>
    </Shell>
  );
}

function BriefCheck() {
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const result = useMemo(() => checkBrief(present), [present]);
  const started = Object.keys(present).length > 0;

  const tone = { incomplete: "border-destructive/50 bg-destructive/5", workable: "border-amber-500/40 bg-amber-500/5", complete: "border-emerald-500/40 bg-emerald-500/5" }[result.verdict];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Tick what the brief actually states</h2>
          <p className="text-sm text-muted-foreground">
            Not what you assume, and not what was said on WhatsApp. What is written down.
          </p>
        </div>
        <div className="space-y-2">
          {BRIEF_FIELDS.map((f) => (
            <label key={f.id} className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0"
                checked={!!present[f.id]}
                onChange={(e) => setPresent({ ...present, [f.id]: e.target.checked })}
              />
              <span className="min-w-0">
                <span className="font-medium text-sm">{f.label}</span>
                <span className={`ml-2 text-[10px] uppercase tracking-wide ${f.weight === "critical" ? "text-destructive" : "text-muted-foreground"}`}>
                  {f.weight}
                </span>
                {!present[f.id] && <span className="block text-xs text-muted-foreground mt-1">{f.risk}</span>}
              </span>
            </label>
          ))}
        </div>
      </section>

      {started && (
        <section className={`rounded-lg border p-5 space-y-3 ${tone}`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">{result.headline}</h2>
            <span className="text-sm tabular-nums text-muted-foreground shrink-0">{result.score}/{result.total}</span>
          </div>
          {result.reply && (
            <div className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Send this back</p>
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(result.reply); toast.success("Copied"); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm mt-2 font-sans">{result.reply}</pre>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Asking these does not make you difficult. Agencies said in their own words that what they
            notice is a creator who read the brief — this is what that looks like in a reply.
          </p>
        </section>
      )}
    </div>
  );
}

function PitchBuilder() {
  const fn = useServerFn(getFigureGateData);
  const { data } = useQuery({ queryKey: ["figure-gate"], queryFn: () => fn() });

  const [brand, setBrand] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [angle, setAngle] = useState("");

  const paidDeals = data?.deals ?? [];
  const brandsPaid = useMemo(
    () => [...new Set(paidDeals.map((d) => d.counterparty.trim()).filter(Boolean))],
    [paidDeals],
  );
  const deliverables = useMemo(
    () => [...new Set(paidDeals.map((d) => d.deliverable.trim()).filter(Boolean))].sort(),
    [paidDeals],
  );

  const { provenRate, provenRateN } = useMemo(() => {
    const key = deliverable.trim().toLowerCase();
    const m = paidDeals.filter((d) => d.deliverable.trim().toLowerCase() === key && d.currency === "ZAR");
    if (!m.length) return { provenRate: null as number | null, provenRateN: 0 };
    const a = m.map((d) => d.amount).sort((x, y) => x - y);
    const med = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    return { provenRate: med, provenRateN: m.length };
  }, [paidDeals, deliverable]);

  const pitch = useMemo(
    () => buildPitch({ brand, deliverable, angle, provenRate, provenRateN, brandsPaid }),
    [brand, deliverable, angle, provenRate, provenRateN, brandsPaid],
  );

  const ready = brand.trim() && deliverable.trim();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border p-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Who you are writing to</span>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand or agency" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">What for</span>
            <Input list="pitch-deliverables" value={deliverable} onChange={(e) => setDeliverable(e.target.value)} placeholder="e.g. Instagram reel" />
            <datalist id="pitch-deliverables">{deliverables.map((d) => <option key={d} value={d} />)}</datalist>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Your angle — the part that shows you read the brief</span>
          <Input value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="One line on how you would actually approach it" />
        </label>
      </section>

      {ready && (
        <>
          <section className="rounded-lg border p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Subject</p>
                <p className="font-medium">{pitch.subject}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(`${pitch.subject}\n\n${pitch.full}`); toast.success("Copied"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-3 border-t pt-3">
              {pitch.sections.map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    {s.label}
                    {s.sourced && <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"><ShieldCheck className="h-3 w-3" />from your records</span>}
                  </p>
                  <p className="text-sm mt-0.5">{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {pitch.gaps.length > 0 && (
            <section className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-5 space-y-2">
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">What would make this stronger</h3>
              <ul className="space-y-2 text-sm">
                {pitch.gaps.map((g, i) => <li key={i}>· {g}</li>)}
              </ul>
              {brandsPaid.length === 0 && (
                <Button asChild size="sm" variant="outline" className="mt-1">
                  <Link to="/apps/deals">Log a paid deal <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              )}
            </section>
          )}

          <p className="text-xs text-muted-foreground">
            Every figure here comes from a deal you logged and were paid for. Nothing on this page is
            generated or estimated — which is the only reason you can send it without checking it first.
          </p>
        </>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm transition-colors ${active ? "bg-foreground text-background" : "hover:bg-muted"}`}
    >
      {children}
    </button>
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
        <h1 className="text-2xl font-bold">Before you say yes</h1>
        <p className="text-muted-foreground">
          Part of the Foundation Kit. Check a brief for what is missing, and pitch with numbers you can prove.
        </p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
