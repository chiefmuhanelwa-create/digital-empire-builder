import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { getFigureGateData } from "@/lib/figure-gate.functions";
import { BRIEF_FIELDS, checkBrief } from "@/lib/brief-check";
import { buildPitch } from "@/lib/pitch-builder";
import { listDeals } from "@/lib/deals.functions";
import { getInvoiceSettings } from "@/lib/invoice.functions";
import {
  DEFAULT_TERMS, USAGE_OPTIONS, WHITELIST_OPTIONS, contractBlockers, contractWarnings,
  renderContract, valueRights, money, type ContractTerms, type UsageKey, type WhitelistKey,
} from "@/lib/contract-builder";
import type { Deal } from "@/lib/deals-chase-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Lock, Copy, ClipboardCheck, Send, ArrowRight, ShieldCheck, FileSignature, AlertTriangle,
} from "lucide-react";

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
  const [tab, setTab] = useState<"brief" | "pitch" | "contract">("brief");
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Before you say yes</h1>
          <p className="text-muted-foreground max-w-2xl">
            A brief lands with a 24-hour deadline. Check what is missing from it before you reply,
            pitch with numbers your records can back, and put the terms on paper before you start
            making anything.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <Tab active={tab === "brief"} onClick={() => setTab("brief")}><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />Brief check</Tab>
          <Tab active={tab === "pitch"} onClick={() => setTab("pitch")}><Send className="mr-1.5 h-3.5 w-3.5" />Pitch builder</Tab>
          <Tab active={tab === "contract"} onClick={() => setTab("contract")}><FileSignature className="mr-1.5 h-3.5 w-3.5" />Contract</Tab>
        </div>

        {tab === "brief" ? <BriefCheck /> : tab === "pitch" ? <PitchBuilder /> : <ContractBuilder />}
      </div>
    </Shell>
  );
}

function ContractBuilder() {
  const dealsFn = useServerFn(listDeals);
  const settingsFn = useServerFn(getInvoiceSettings);
  const { data: dData } = useQuery({ queryKey: ["deals", "all"], queryFn: () => dealsFn({ data: { status: "all" } }) });
  const { data: sData } = useQuery({ queryKey: ["invoice-settings"], queryFn: () => settingsFn() });

  const [t, setT] = useState<ContractTerms>(DEFAULT_TERMS);
  const [rendered, setRendered] = useState<string | null>(null);
  const set = <K extends keyof ContractTerms>(k: K, v: ContractTerms[K]) => setT((p) => ({ ...p, [k]: v }));

  // Prefill from whoever you are, so the parties block is not retyped per deal.
  useEffect(() => {
    const s = sData?.settings as { trading_name?: string | null; legal_name?: string | null } | null | undefined;
    if (!s) return;
    setT((p) => ({
      ...p,
      creatorName: p.creatorName || s.trading_name?.trim() || s.legal_name?.trim() || "",
      creatorEntity: p.creatorEntity || (s.trading_name?.trim() ? (s.legal_name?.trim() ?? "") : ""),
    }));
  }, [sData]);

  // Deals that have not been delivered yet — the ones a contract still helps.
  const openDeals = useMemo(
    () => ((dData?.deals ?? []) as Deal[]).filter((d) => ["quoted", "accepted"].includes(d.status)),
    [dData],
  );

  function loadDeal(id: string) {
    const d = openDeals.find((x) => x.id === id);
    if (!d) return;
    setT((p) => ({
      ...p,
      brandName: d.counterparty,
      agencyName: d.counterparty_type === "agency" ? d.counterparty : p.agencyName,
      contractingParty: d.counterparty_type === "agency" ? "agency" : "brand",
      fee: d.amount,
      currency: d.currency,
      deliverables: d.deliverable,
      exclusivityScope: d.exclusivity_scope ?? p.exclusivityScope,
    }));
  }

  const blockers = useMemo(() => contractBlockers(t), [t]);
  const warnings = useMemo(() => contractWarnings(t), [t]);
  const rights = useMemo(() => valueRights(t), [t]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border p-5 space-y-4">
        <div>
          <h2 className="font-semibold">The terms</h2>
          <p className="text-sm text-muted-foreground">
            Most creator contracts are an email thread — the fee in one message, the deliverables in
            another, and the usage rights nowhere. That is how a post fee becomes a year of paid media.
          </p>
        </div>

        {openDeals.length > 0 && (
          <F label="Start from a deal you have already logged">
            <select
              onChange={(e) => loadDeal(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              defaultValue=""
            >
              <option value="">Choose a deal…</option>
              {openDeals.map((d) => (
                <option key={d.id} value={d.id}>{d.counterparty} — {d.deliverable}</option>
              ))}
            </select>
          </F>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Your name"><Input value={t.creatorName} onChange={(e) => set("creatorName", e.target.value)} /></F>
          <F label="Your registered entity (optional)"><Input value={t.creatorEntity} onChange={(e) => set("creatorEntity", e.target.value)} placeholder="Company (Pty) Ltd" /></F>
          <F label="Brand"><Input value={t.brandName} onChange={(e) => set("brandName", e.target.value)} /></F>
          <F label="Agency — who you actually contract and invoice"><Input value={t.agencyName} onChange={(e) => set("agencyName", e.target.value)} placeholder="Leave blank if direct with the brand" /></F>
        </div>

        <F label="Who is the contracting party?">
          <select
            value={t.contractingParty}
            onChange={(e) => set("contractingParty", e.target.value as ContractTerms["contractingParty"])}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="agency">The agency — the usual case</option>
            <option value="brand">The brand directly</option>
          </select>
        </F>

        <F label="Deliverables, counted">
          <textarea
            value={t.deliverables}
            onChange={(e) => set("deliverables", e.target.value)}
            rows={3}
            placeholder={"1× Instagram Reel (up to 60s)\n2× Story frames with link sticker\nOne round of concept before production"}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </F>

        <div className="grid gap-3 sm:grid-cols-3">
          <F label="Fee"><Input type="number" min="0" step="0.01" value={t.fee || ""} onChange={(e) => set("fee", Number(e.target.value) || 0)} /></F>
          <F label="Draft due"><Input type="date" value={t.draftDueDate} onChange={(e) => set("draftDueDate", e.target.value)} /></F>
          <F label="Go live"><Input type="date" value={t.goLiveDate} onChange={(e) => set("goLiveDate", e.target.value)} /></F>
        </div>

        <div className="rounded-md border p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Rights — the half that is actually negotiable
          </p>
          <F label="Usage">
            <select value={t.usage} onChange={(e) => set("usage", e.target.value as UsageKey)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              {USAGE_OPTIONS.map((u) => <option key={u.key} value={u.key}>{u.label}{u.pct ? ` — worth +${u.pct}%` : ""}</option>)}
            </select>
            <span className="text-xs text-muted-foreground">{USAGE_OPTIONS.find((u) => u.key === t.usage)?.note}</span>
          </F>
          <div className="grid gap-3 sm:grid-cols-3">
            <F label="Whitelisting">
              <select value={t.whitelisting} onChange={(e) => set("whitelisting", e.target.value as WhitelistKey)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                {WHITELIST_OPTIONS.map((w) => <option key={w.key} value={w.key}>{w.label}{w.pct ? ` — +${w.pct}%` : ""}</option>)}
              </select>
            </F>
            <F label="Exclusivity (months)"><Input type="number" min="0" max="24" value={t.exclusivityMonths} onChange={(e) => set("exclusivityMonths", Number(e.target.value) || 0)} /></F>
            <F label="Exclusivity scope"><Input value={t.exclusivityScope} onChange={(e) => set("exclusivityScope", e.target.value)} placeholder="e.g. retail banking" disabled={t.exclusivityMonths === 0} /></F>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <F label="Deposit %"><Input type="number" min="0" max="100" value={t.depositPct} onChange={(e) => set("depositPct", Number(e.target.value) || 0)} /></F>
          <F label="Revision rounds"><Input type="number" min="0" max="10" value={t.revisionRounds} onChange={(e) => set("revisionRounds", Number(e.target.value) || 0)} /></F>
          <F label="Kill fee %"><Input type="number" min="0" max="100" value={t.killFeePct} onChange={(e) => set("killFeePct", Number(e.target.value) || 0)} /></F>
          <F label="Terms (days)"><Input type="number" min="0" max="180" value={t.paymentTermsDays} onChange={(e) => set("paymentTermsDays", Number(e.target.value) || 0)} disabled={t.endOfMonthTerms} /></F>
        </div>

        <div className="space-y-2">
          <Check checked={t.endOfMonthTerms} onChange={(v) => set("endOfMonthTerms", v)}
            label="Paid end of month" hint="The agency norm. A campaign ending on the 2nd can mean waiting nearly two months." />
          <Check checked={t.disclosure} onChange={(v) => set("disclosure", v)}
            label="Disclosure clause" hint="Makes #ad the brand's obligation to accept, not just yours to apply." />
          <Check checked={t.latePaymentInterest} onChange={(v) => set("latePaymentInterest", v)}
            label="Interest on late payment" hint="Gives the chase something behind it." />
        </div>
      </section>

      {rights.value > 0 && (
        <section className="rounded-lg border p-5 space-y-2">
          <h3 className="font-semibold">What you are granting is worth {rights.totalPct}% of the fee</h3>
          <div className="space-y-1 text-sm tabular-nums">
            {rights.lines.map((l) => (
              <p key={l.label} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{l.label}</span>
                <span>+{l.pct}% · {money(l.value, t.currency)}</span>
              </p>
            ))}
            <p className="flex justify-between gap-3 border-t pt-1 font-semibold">
              <span>A fee that priced these</span><span>{money(rights.impliedTotal, t.currency)}</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Using the same multipliers as your rate card. Not a demand to charge it — just the number,
            visible before you sign instead of after.
          </p>
        </section>
      )}

      {warnings.length > 0 && (
        <section className="space-y-2">
          {warnings.map((w) => (
            <div key={w.headline}
              className={`rounded-lg border p-4 ${w.severity === "critical" ? "border-destructive/50 bg-destructive/5" : "border-amber-500/40 bg-amber-500/5"}`}>
              <p className={`font-semibold flex items-center gap-1.5 ${w.severity === "critical" ? "text-destructive" : "text-amber-700 dark:text-amber-400"}`}>
                <AlertTriangle className="h-4 w-4 shrink-0" />{w.headline}
              </p>
              <p className="text-sm mt-1">{w.detail}</p>
            </div>
          ))}
        </section>
      )}

      {blockers.length > 0 ? (
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Still needed before this can be drafted</p>
          <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">{blockers.map((b) => <li key={b}>· {b}</li>)}</ul>
        </div>
      ) : (
        <Button onClick={() => setRendered(renderContract(t))}>
          <FileSignature className="mr-1 h-4 w-4" />Draft the agreement
        </Button>
      )}

      {rendered && (
        <section className="rounded-lg border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">The agreement</h2>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(rendered); toast.success("Copied"); }}>
              <Copy className="mr-1 h-3.5 w-3.5" />Copy
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/40 rounded-md p-4 overflow-x-auto">{rendered}</pre>
          <p className="text-xs text-muted-foreground">
            The last block is a note to yourself and is marked to be removed before sending. Everything
            above it is the agreement. It is plain language, not legal advice — where the money or the
            risk is significant, have a lawyer read it first.
          </p>
        </section>
      )}
    </div>
  );
}

function Check({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      {children}
    </label>
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
