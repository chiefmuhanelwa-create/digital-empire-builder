import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { corpusStats, askCorpus, draftGrounded } from "@/lib/grounded.functions";
import { listLedger } from "@/lib/ledger.functions";
import { listContent } from "@/lib/content-os.functions";
import { PILLARS } from "@/lib/content-os";
import { STYLES } from "@/lib/script-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Lock, Database, BookLock, Wand2, LayoutGrid, Search, Sparkles, ArrowRight,
  ShieldCheck, ShieldAlert, ShieldX, HelpCircle, FileText,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/os")({
  head: () => ({ meta: [{ title: "The OS — Contentpreneur Africa" }] }),
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

type Stage = "corpus" | "ask" | "draft";

function Tool() {
  const statsFn = useServerFn(corpusStats);
  const askFn = useServerFn(askCorpus);
  const draftFn = useServerFn(draftGrounded);
  const ledgerFn = useServerFn(listLedger);
  const contentFn = useServerFn(listContent);

  const { data: stats } = useQuery({ queryKey: ["corpus"], queryFn: () => statsFn() });
  const { data: ledgerData } = useQuery({ queryKey: ["ledger"], queryFn: () => ledgerFn() });
  const { data: content } = useQuery({ queryKey: ["content-os"], queryFn: () => contentFn() });

  const [stage, setStage] = useState<Stage>("draft");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<any>(null);
  const [topic, setTopic] = useState("");
  const [pillar, setPillar] = useState<string>("");
  const [style, setStyle] = useState("nochill");
  const [result, setResult] = useState<any>(null);

  const chunks = stats?.chunks ?? 0;
  const sources = stats?.sources ?? 0;
  const ledgerN = (ledgerData?.entries ?? []).length;
  const pieces = (content?.pieces ?? []).length;

  const ask = useMutation({
    mutationFn: () => askFn({ data: { question } }),
    onSuccess: (r) => setAnswer(r),
    onError: (e: Error) => toast.error(e.message),
  });
  const draft = useMutation({
    mutationFn: () => draftFn({ data: { topic, pillar: pillar || null, style: style as any, format: "epiphany" } }),
    onSuccess: (r) => setResult(r),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Shell>
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${INK} 0%, #2a2518 55%, ${INK} 100%)` }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: `radial-gradient(circle at 20% 30%, ${GOLD} 0%, transparent 45%), radial-gradient(circle at 80% 70%, ${GOLD} 0%, transparent 40%)` }} />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: GOLD }}>Contentpreneur Africa</p>
          <h1 className="mt-3 font-extrabold tracking-tight text-white text-4xl sm:text-6xl leading-[0.95]">
            THE <span style={{ color: GOLD }}>OS</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[#C8C2B4] leading-relaxed">
            One workflow, not four tools. Your estate is the database, the AI writes only from what it
            retrieves out of it, and the ledger refuses anything the data cannot back.
          </p>
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            <Stat n={sources} label="sources" sub={`${chunks.toLocaleString("en-GB")} chunks`} />
            <Stat n={ledgerN} label="ledger entries" sub={ledgerN === 0 ? "nothing checked yet" : "figures gated"} />
            <Stat n={pieces} label="pieces tracked" sub="idea → measured" />
            <Stat n={4} label="collections" sub="estate · skills · global · icp" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-7">
        {/* The chain, as one thing */}
        <section className="rounded-xl border overflow-hidden">
          <div className="grid sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x">
            {[
              { icon: Database, label: "Corpus", sub: `${sources} sources`, to: null, on: () => setStage("corpus") },
              { icon: BookLock, label: "Ledger", sub: `${ledgerN} entries`, to: "/apps/ledger" },
              { icon: Wand2, label: "Draft", sub: "grounded", to: null, on: () => setStage("draft") },
              { icon: LayoutGrid, label: "Track", sub: `${pieces} pieces`, to: "/apps/content-os" },
            ].map((s, i) => {
              const Inner = (
                <div className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors w-full text-left">
                  <s.icon className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                  {i < 3 && <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground hidden sm:block" />}
                </div>
              );
              return s.to
                ? <Link key={s.label} to={s.to}>{Inner}</Link>
                : <button key={s.label} onClick={s.on}>{Inner}</button>;
            })}
          </div>
        </section>

        {chunks === 0 && (
          <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 space-y-2">
            <p className="font-semibold">The corpus is empty, so every draft will be generic.</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nothing is wired into the model yet. Run the ingest to load the estate, the skills, the
              global rulings and the ICP research — then the AI writes from your material instead of
              from what it happens to know about content creation.
            </p>
            <pre className="text-xs font-mono bg-background rounded-md p-3 mt-1 overflow-x-auto">bun run scripts/ingest-corpus.ts &lt;your-user-id&gt;</pre>
          </section>
        )}

        <nav className="flex gap-1.5 border-b pb-3">
          {([["draft", "Draft", Sparkles], ["ask", "Ask the corpus", Search], ["corpus", "What's loaded", Database]] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setStage(k as Stage)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${stage === k ? "bg-[#1C1C1C] text-white" : "text-muted-foreground hover:bg-muted"}`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </nav>

        {stage === "draft" && (
          <section className="space-y-4">
            <div className="rounded-xl border p-5 space-y-4">
              <div>
                <h2 className="font-semibold">Draft from your own material</h2>
                <p className="text-sm text-muted-foreground">
                  Retrieval runs first — the story, the receipt and the voice rules are pulled out of your
                  corpus, and the model is told to use nothing else. Anything it needed and could not find
                  comes back under <strong>MISSING</strong> rather than invented.
                </p>
              </div>
              <F label="Topic"><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What a brand is actually buying when they ask for a post" /></F>
              <div className="grid gap-3 sm:grid-cols-2">
                <F label="Pillar"><Sel value={pillar} onChange={setPillar}
                  options={[["", "—"], ...PILLARS.map((p) => [p.key, p.key] as [string, string])]} /></F>
                <F label="House"><Sel value={style} onChange={setStyle}
                  options={STYLES.map((s) => [s.key, `${s.name} · ${s.runtime[0]}–${s.runtime[1]}s`] as [string, string])} /></F>
              </div>
              <Button onClick={() => draft.mutate()} disabled={!topic.trim() || draft.isPending || chunks === 0}
                className="bg-[#D4A82F] text-[#1C1C1C] hover:bg-[#D9BC45] font-semibold">
                {draft.isPending ? "Retrieving, then writing…" : "Draft it"}
              </Button>
            </div>

            {result?.note && <p className="text-sm rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">{result.note}</p>}

            {result?.report && <LedgerStrip report={result.report} />}

            {result?.draft && (
              <div className="rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold">The draft</h3>
                <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/40 rounded-lg p-4 overflow-x-auto max-h-[32rem]">{result.draft}</pre>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(result.draft); toast.success("Copied"); }}>Copy</Button>
                  <Button asChild size="sm" variant="outline"><Link to="/apps/script-studio">Open in Script Studio <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
                </div>
              </div>
            )}

            {result?.sources?.length > 0 && <Sources rows={result.sources} />}
          </section>
        )}

        {stage === "ask" && (
          <section className="space-y-4">
            <div className="rounded-xl border p-5 space-y-3">
              <div>
                <h2 className="font-semibold">Ask your own estate</h2>
                <p className="text-sm text-muted-foreground">
                  Answers come only from retrieved rows, with the file each line came from. If the corpus
                  does not answer it, it says so rather than filling the gap.
                </p>
              </div>
              <Input value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="What does the record actually say about my rate story?"
                onKeyDown={(e) => { if (e.key === "Enter" && question.trim()) ask.mutate(); }} />
              <Button onClick={() => ask.mutate()} disabled={!question.trim() || ask.isPending || chunks === 0}
                className="bg-[#1C1C1C] hover:bg-[#333]">
                {ask.isPending ? "Searching…" : "Ask"}
              </Button>
            </div>
            {answer?.answer && (
              <div className="rounded-xl border p-5 space-y-3">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{answer.answer}</pre>
              </div>
            )}
            {answer?.sources?.length > 0 && <Sources rows={answer.sources} />}
          </section>
        )}

        {stage === "corpus" && (
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {Object.entries(stats?.byCollection ?? {}).map(([k, v]) => (
                <div key={k} className="rounded-xl border p-4">
                  <p className="text-2xl font-bold tabular-nums">{v as number}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border divide-y max-h-[32rem] overflow-y-auto">
              {(stats?.list ?? []).map((s: any) => (
                <div key={s.path} className="flex items-center gap-3 p-2.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{s.title}</span>
                  {s.evidence_tier && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted">{s.evidence_tier}</span>}
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.collection}</span>
                </div>
              ))}
              {(stats?.list ?? []).length === 0 && <p className="p-5 text-sm text-muted-foreground">Nothing ingested yet.</p>}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ⛔ Raw sources, extracts, mailboxes, the intake sheet and anything naming a third party are
              deliberately excluded from the corpus. A corpus is a claim surface like any other — a file
              that names someone must never become a chunk a model can quote from.
            </p>
          </section>
        )}
      </div>
    </Shell>
  );
}

function LedgerStrip({ report }: { report: any }) {
  const tone = report.blocked ? "border-destructive/50 bg-destructive/5"
    : report.noRecord > 0 ? "border-amber-500/40 bg-amber-500/5" : "border-emerald-500/40 bg-emerald-500/5";
  const Icon = (v: string) => v === "verified" ? ShieldCheck : v === "unverified" ? ShieldAlert : v === "banned" ? ShieldX : HelpCircle;
  const colour = (v: string) => v === "verified" ? "text-emerald-600" : v === "unverified" ? "text-amber-600" : v === "banned" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${tone}`}>
      <p className="text-sm font-semibold">{report.headline}</p>
      {report.verdicts.slice(0, 12).map((v: any, i: number) => {
        const I = Icon(v.verdict);
        return (
          <div key={i} className="flex items-start gap-2 text-xs">
            <I className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${colour(v.verdict)}`} />
            <span><strong className="font-mono">{v.claim.raw}</strong> <span className="text-muted-foreground">{v.message}</span></span>
          </div>
        );
      })}
    </div>
  );
}

function Sources({ rows }: { rows: any[] }) {
  return (
    <details className="rounded-xl border p-4">
      <summary className="text-sm font-medium cursor-pointer">
        {rows.length} sources retrieved — every line traces to one of these
      </summary>
      <div className="mt-3 space-y-2">
        {rows.map((r, i) => (
          <div key={r.chunk_id} className="text-xs border-l-2 pl-2.5" style={{ borderColor: GOLD }}>
            <p className="font-medium">[{i + 1}] {r.source_title}{r.heading ? ` — ${r.heading}` : ""}
              {r.evidence_tier && <span className="ml-1.5 font-bold">{r.evidence_tier}</span>}</p>
            <p className="text-muted-foreground font-mono text-[10px]">{r.source_path}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

function Stat({ n, label, sub }: { n: number; label: string; sub: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <p className="text-2xl font-bold text-white tabular-nums">{n.toLocaleString("en-GB")}</p>
      <p className="text-[11px] uppercase tracking-wide" style={{ color: GOLD }}>{label}</p>
      <p className="text-[11px] text-[#9A9488]">{sub}</p>
    </div>
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
        <h1 className="text-2xl font-bold">The OS</h1>
        <p className="text-muted-foreground">Part of the Foundation Kit. Your estate as the database, and an AI that writes only from it.</p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
