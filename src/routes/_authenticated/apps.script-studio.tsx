import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { listScripts, upsertScript, deleteScript, scriptToPiece } from "@/lib/scripts.functions";
import { listContent } from "@/lib/content-os.functions";
import { listLedger, recordChecks } from "@/lib/ledger.functions";
import { generateSlots } from "@/lib/grounded.functions";
import { checkScript, type LedgerEntry } from "@/lib/ledger";
import {
  STYLES, HOOK_SHAPES, SCREEN_BANK, REHOOKS, REHOOK_RULE, HORSEMEN,
  judgeHook, hookScore, buildBeats, buildCta, scriptWarnings,
  type Style, type HookCandidate, type Beat,
} from "@/lib/script-engine";
import { PILLARS, DEFAULT_SETTINGS, type Settings } from "@/lib/content-os";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Lock, Plus, X, Copy, Trash2, AlertTriangle, Check, ArrowRight, FileText,
  ShieldCheck, ShieldAlert, ShieldX, HelpCircle, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/script-studio")({
  head: () => ({ meta: [{ title: "Script Studio — Contentpreneur Africa" }] }),
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

const EMPTY_HOOK: HookCandidate = { text: "", shape: "", screen: "", r: 0, a: 0, c: 0, u: 0, b: 0 };

type Draft = {
  id?: string; title: string; style: Style; format: string; pillar: string | null;
  symptom: string; money_cost: string; raw_material: string;
  hooks: HookCandidate[]; chosen_hook: number | null; screen_text: string;
  story: string; receipt: string; outside_voice: string; mechanism: string;
  cta_artifact: string; cta_purpose: string; cta_keyword: string;
  closing_question: string; runtime_target: number | null;
};

const BLANK: Draft = {
  title: "", style: "nochill", format: "epiphany", pillar: null,
  symptom: "", money_cost: "", raw_material: "",
  hooks: [{ ...EMPTY_HOOK }, { ...EMPTY_HOOK }, { ...EMPTY_HOOK }],
  chosen_hook: null, screen_text: "",
  story: "", receipt: "", outside_voice: "", mechanism: "",
  cta_artifact: "", cta_purpose: "", cta_keyword: "", closing_question: "", runtime_target: 95,
};

function Tool() {
  const qc = useQueryClient();
  const listFn = useServerFn(listScripts);
  const saveFn = useServerFn(upsertScript);
  const delFn = useServerFn(deleteScript);
  const pushFn = useServerFn(scriptToPiece);
  const contentFn = useServerFn(listContent);
  const ledgerFn = useServerFn(listLedger);
  const recordFn = useServerFn(recordChecks);
  const genFn = useServerFn(generateSlots);

  const { data } = useQuery({ queryKey: ["scripts"], queryFn: () => listFn() });
  const { data: content } = useQuery({ queryKey: ["content-os"], queryFn: () => contentFn() });
  const { data: ledgerData } = useQuery({ queryKey: ["ledger"], queryFn: () => ledgerFn() });
  const settings: Settings = { ...DEFAULT_SETTINGS, ...((content?.settings ?? {}) as Partial<Settings>) };

  const [d, setD] = useState<Draft>({ ...BLANK });
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const scripts = (data?.scripts ?? []) as any[];

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const style = STYLES.find((s) => s.key === d.style)!;

  const judged = useMemo(() => d.hooks.map((h) => judgeHook(h)), [d.hooks]);
  const best = useMemo(() => {
    let bi = -1, bs = -1;
    judged.forEach((j, i) => { if (j.passes && j.score > bs) { bs = j.score; bi = i; } });
    return bi;
  }, [judged]);

  const chosen = d.chosen_hook !== null ? d.hooks[d.chosen_hook] : null;
  const beats: Beat[] = useMemo(() => buildBeats(d.style, d.format, {
    hook: chosen?.text ?? "", screen: d.screen_text, symptom: d.symptom, moneyCost: d.money_cost,
    story: d.story, receipt: d.receipt, outsideVoice: d.outside_voice, mechanism: d.mechanism,
    cta: buildCta(d.cta_keyword, d.cta_artifact, d.cta_purpose), closing: d.closing_question,
  }), [d, chosen]);

  const warnings = useMemo(() => scriptWarnings({
    style: d.style, runtime: d.runtime_target, ctaKeyword: d.cta_keyword,
    wired: settings.wired_keywords, receipt: d.receipt, story: d.story,
    closing: d.closing_question, hook: chosen?.text ?? "",
  }), [d, settings, chosen]);

  const fullText = useMemo(() => renderScript(d, chosen, beats, style.name), [d, chosen, beats, style.name]);

  // THE LEDGER GATE. Every checkable claim in the script, matched against the
  // user's own entries. A banned figure blocks the save outright — that is the
  // only hard stop, because no_record on day one is normal, not an error.
  const ledger = (ledgerData?.entries ?? []) as LedgerEntry[];
  const report = useMemo(() => checkScript(fullText, ledger), [fullText, ledger]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: {
      id: d.id, title: d.title, style: d.style, format: d.format, pillar: d.pillar,
      symptom: d.symptom, money_cost: d.money_cost, raw_material: d.raw_material,
      hooks: d.hooks.filter((h) => h.text.trim()), chosen_hook: d.chosen_hook,
      screen_text: d.screen_text, beats, cta_keyword: d.cta_keyword,
      story: d.story, receipt: d.receipt, outside_voice: d.outside_voice,
      mechanism: d.mechanism, cta_artifact: d.cta_artifact, cta_purpose: d.cta_purpose,
      closing_question: d.closing_question, runtime_target: d.runtime_target, status: "draft",
    } as any }),
    onSuccess: (r) => {
      toast.success("Saved");
      setD((p) => ({ ...p, id: r.id }));
      qc.invalidateQueries({ queryKey: ["scripts"] });
      // Keep the source trace, and the record of what kept being reached for.
      if (report.verdicts.length) {
        recordFn({ data: {
          script_id: r.id,
          checks: report.verdicts.slice(0, 60).map((v) => ({
            claim: v.claim.raw.slice(0, 400), verdict: v.verdict, entry_id: v.entry?.id ?? null,
          })),
        } }).then(() => qc.invalidateQueries({ queryKey: ["ledger-attempts"] })).catch(() => {});
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // GENERATE. The studio was a form: every slot typed by hand, which is a
  // worksheet, not a tool. This fills them from the corpus and the ledger, and
  // whatever it could not source comes back named rather than invented.
  const generate = useMutation({
    mutationFn: () => genFn({ data: { topic: d.title, pillar: d.pillar, style: d.style, format: d.format } }),
    onSuccess: (r: any) => {
      if (r.note) { toast.error(r.note); return; }
      const sl = r.slots;
      if (!sl) { toast.error("Nothing came back."); return; }
      setD((p) => ({
        ...p,
        hooks: [0, 1, 2].map((i) => ({
          ...EMPTY_HOOK,
          text: sl.hooks?.[i]?.text ?? "",
          screen: (sl.hooks?.[i]?.screen ?? "").toUpperCase(),
          shape: sl.hooks?.[i]?.shape ?? "",
          note: sl.hooks?.[i]?.why ?? "",
        })),
        symptom: sl.symptom ?? p.symptom,
        money_cost: sl.money_cost ?? p.money_cost,
        story: sl.story ?? p.story,
        receipt: sl.receipt ?? p.receipt,
        outside_voice: sl.outside_voice ?? p.outside_voice,
        mechanism: sl.mechanism ?? p.mechanism,
        closing_question: sl.closing_question ?? p.closing_question,
        screen_text: (sl.hooks?.[0]?.screen ?? p.screen_text).toUpperCase(),
      }));
      setMissing(sl.missing ?? []);
      toast.success("Filled from your corpus — now score the hooks and edit.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function loadScript(s: any) {
    setD({
      id: s.id, title: s.title, style: s.style, format: s.format, pillar: s.pillar,
      symptom: s.symptom ?? "", money_cost: s.money_cost ?? "", raw_material: s.raw_material ?? "",
      hooks: [...(s.hooks ?? []), ...Array(3).fill(EMPTY_HOOK)].slice(0, 3).map((h: any) => ({ ...EMPTY_HOOK, ...h })),
      chosen_hook: s.chosen_hook, screen_text: s.screen_text ?? "",
      story: s.story ?? "", receipt: s.receipt ?? "",
      outside_voice: s.outside_voice ?? "", mechanism: s.mechanism ?? "",
      cta_artifact: s.cta_artifact ?? "", cta_purpose: s.cta_purpose ?? "",
      cta_keyword: s.cta_keyword ?? "",
      closing_question: s.closing_question ?? "", runtime_target: s.runtime_target ?? 95,
    });
    setOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Shell>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${INK} 0%, #2a2518 55%, ${INK} 100%)` }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: `radial-gradient(circle at 25% 30%, ${GOLD} 0%, transparent 45%), radial-gradient(circle at 75% 70%, ${GOLD} 0%, transparent 40%)` }} />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: GOLD }}>Contentpreneur Africa</p>
          <h1 className="mt-3 font-extrabold tracking-tight text-white text-4xl sm:text-6xl leading-[0.95]">
            SCRIPT <span style={{ color: GOLD }}>STUDIO</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[#C8C2B4] leading-relaxed">
            Two houses, built side by side. The evidence does not settle which is better for this
            account — so the studio writes both and lets you choose, rather than telling you.
          </p>
          <Button className="mt-6 bg-[#D4A82F] text-[#1C1C1C] hover:bg-[#D9BC45] font-semibold"
            onClick={() => { setD({ ...BLANK }); setOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" />New script
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-7">
        {/* House picker */}
        <section className="grid gap-3 sm:grid-cols-2">
          {STYLES.map((s) => {
            const active = d.style === s.key;
            return (
              <button key={s.key} onClick={() => { set("style", s.key); set("format", s.formats[0].key); set("runtime_target", s.runtime[0] + 5); setOpen(true); }}
                className={`text-left rounded-xl border-2 p-5 transition-all ${active ? "border-[#D4A82F] bg-[#D4A82F]/5" : "border-border hover:border-muted-foreground/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-lg tracking-tight">{s.name}</span>
                  {active && <Check className="h-4 w-4" style={{ color: GOLD }} />}
                </div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mt-0.5">{s.tag} · {s.runtime[0]}–{s.runtime[1]}s</p>
                <p className="text-sm mt-2"><strong>Optimises:</strong> {s.optimises}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.basis}</p>
              </button>
            );
          })}
        </section>

        {open && (
          <>
            {/* Intake */}
            <Section title="1 · Intake" sub="Run before the hook. If none of the six starting points applies, this isn't a script yet.">
              <F label="Title — or just the topic, then generate"><Input value={d.title} onChange={(e) => set("title", e.target.value)} /></F>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => generate.mutate()} disabled={!d.title.trim() || generate.isPending}
                  className="bg-[#D4A82F] text-[#1C1C1C] hover:bg-[#D9BC45] font-semibold">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  {generate.isPending ? "Retrieving, then writing…" : "Generate from my corpus"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Fills the hooks and every beat from your own stories, receipts and voice rules. You edit from a filled page, not a blank one.
                </span>
              </div>
              {missing.length > 0 && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                  <p className="text-xs font-semibold">It could not source these — they are left empty on purpose:</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {missing.map((m, i) => <li key={i}>· {m}</li>)}
                  </ul>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                <F label="Pillar"><Sel value={d.pillar ?? ""} onChange={(v) => set("pillar", v || null)}
                  options={[["", "—"], ...PILLARS.map((p) => [p.key, `${p.key} · ${p.share}%`] as [string, string])]} /></F>
                <F label="Format"><Sel value={d.format} onChange={(v) => set("format", v)}
                  options={style.formats.map((f) => [f.key, f.label] as [string, string])} /></F>
                <F label="Runtime target (s)"><Input type="number" value={d.runtime_target ?? ""} onChange={(e) => set("runtime_target", e.target.value ? Number(e.target.value) : null)} /></F>
              </div>
              <p className="text-xs text-muted-foreground">{style.formats.find((f) => f.key === d.format)?.when}</p>
              <F label="The symptom — in THEIR words, from comments or DMs">
                <Input value={d.symptom} onChange={(e) => set("symptom", e.target.value)} placeholder="If a phrase keeps appearing in your DMs, that phrase is the accusation. Don't improve it." /></F>
              <F label="The money it costs — not the emotion, the cost">
                <Input value={d.money_cost} onChange={(e) => set("money_cost", e.target.value)} placeholder="In rands or in unpaid hours. If you can't name the cost, the topic isn't ready." /></F>
            </Section>

            {/* Hook gate */}
            <Section title="2 · The hook gate" sub="Three candidates, all three scored. Scoring one and listing two is not scoring three — the discard reason is what tells you why the winner won.">
              <div className="space-y-4">
                {d.hooks.map((h, i) => {
                  const j = judged[i];
                  const isBest = i === best && h.text.trim() !== "";
                  return (
                    <div key={i} className={`rounded-xl border p-4 space-y-3 ${d.chosen_hook === i ? "border-[#D4A82F] bg-[#D4A82F]/5" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Option {String.fromCharCode(65 + i)}</span>
                        {isBest && <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: GOLD, color: INK }}>highest</span>}
                        <span className="ml-auto text-sm tabular-nums">{j.score > 0 ? j.score : "—"}</span>
                        <Button size="sm" variant={d.chosen_hook === i ? "default" : "outline"}
                          disabled={!j.passes || !h.text.trim()}
                          onClick={() => { set("chosen_hook", i); if (h.screen) set("screen_text", h.screen); }}>
                          {d.chosen_hook === i ? "Chosen" : "Choose"}
                        </Button>
                      </div>

                      <F label="Spoken line — second person, presupposes money already earned">
                        <Input value={h.text} onChange={(e) => updHook(setD, i, { text: e.target.value })} /></F>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <F label="Screen text — the VERDICT. Max 5 words, no punctuation, reads on mute">
                          <Input value={h.screen} onChange={(e) => updHook(setD, i, { screen: e.target.value.toUpperCase() })} /></F>
                        <F label="Shape"><Sel value={h.shape} onChange={(v) => updHook(setD, i, { shape: v })}
                          options={[["", "—"], ...HOOK_SHAPES.map((s) => [s.key, s.label] as [string, string])]} /></F>
                      </div>
                      {h.shape && <p className="text-xs text-muted-foreground">{HOOK_SHAPES.find((s) => s.key === h.shape)?.template} — {HOOK_SHAPES.find((s) => s.key === h.shape)?.note}</p>}

                      <div className="grid grid-cols-5 gap-2">
                        {(["r", "a", "c", "u", "b"] as const).map((ax) => (
                          <F key={ax} label={ax.toUpperCase()}>
                            <Input type="number" min="0" max="5" value={h[ax] || ""} onChange={(e) => updHook(setD, i, { [ax]: Number(e.target.value) || 0 } as any)} />
                          </F>
                        ))}
                      </div>

                      {j.failures.map((f, k) => (
                        <p key={k} className="text-xs rounded-md border border-destructive/40 bg-destructive/5 px-2.5 py-1.5 flex gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive" />{f}
                        </p>
                      ))}
                      {j.warnings.map((w, k) => (
                        <p key={k} className="text-xs rounded-md border border-amber-500/40 bg-amber-500/5 px-2.5 py-1.5">{w}</p>
                      ))}
                    </div>
                  );
                })}
              </div>

              <details className="rounded-lg border p-3">
                <summary className="text-sm font-medium cursor-pointer">The four Horsemen — run on all three</summary>
                <div className="mt-2 space-y-1.5">
                  {HORSEMEN.map((h) => (
                    <p key={h.key} className="text-xs"><strong>{h.label}.</strong> {h.failure} → <em>{h.fix}</em></p>
                  ))}
                </div>
              </details>

              <details className="rounded-lg border p-3">
                <summary className="text-sm font-medium cursor-pointer">Screen-text bank — the verdict, and the object in frame</summary>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {SCREEN_BANK.map((s) => (
                    <button key={s.text} onClick={() => set("screen_text", s.text)}
                      className="text-left rounded-md border px-2.5 py-2 hover:bg-muted">
                      <span className="text-xs font-bold tracking-wide">{s.text}</span>
                      <span className="block text-[11px] text-muted-foreground">{s.object}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  🚨 No document goes on screen without a redaction pass — sender, agency, account numbers, email addresses, anything identifying a third party.
                </p>
              </details>
            </Section>

            {/* Body */}
            <Section title="3 · The body" sub={`${style.name} · ${style.formats.find((f) => f.key === d.format)?.label}`}>
              {d.style === "nochill" ? (
                <>
                  <F label="Beat 3 — the naive me. First-person PAST TENSE, 25–35 words">
                    <TA value={d.story} onChange={(v) => set("story", v)} rows={2}
                      placeholder="The belief as it felt at the time. Never 'I was stupid' — state the belief, not the verdict on it." /></F>
                  <F label="Beat 6 — the outside voice. Reported speech, in quotes, never named">
                    <TA value={d.outside_voice} onChange={(v) => set("outside_voice", v)} rows={2}
                      placeholder={`She said: "We had a number for this before we ever contacted you. You came in under it."`} /></F>
                </>
              ) : (
                <F label="The cost — what doing it costs them">
                  <TA value={d.money_cost} onChange={(v) => set("money_cost", v)} rows={2} /></F>
              )}
              <F label={d.style === "jatho" ? "The tap path — every step ends in its own payoff" : "Beat 8 — the mechanism. What you changed, then the law generalised to YOU"}>
                <TA value={d.mechanism} onChange={(v) => set("mechanism", v)} rows={4}
                  placeholder={d.style === "jatho"
                    ? "Open the post, tap view insights, add the four numbers under the chart, divide by reach. → Now you have the number a brand is actually buying."
                    : "I stopped pricing off followers. I price off reach, engagement and what that audience is worth to that brand. Here's what nobody tells you: …"} /></F>
              <F label="The receipt — one figure the ledger carries">
                <Input value={d.receipt} onChange={(e) => set("receipt", e.target.value)} placeholder="R15,000 → R45,000, April 2020" /></F>

              <details className="rounded-lg border p-3">
                <summary className="text-sm font-medium cursor-pointer">Rehooks — two per script, never three</summary>
                <p className="text-xs text-muted-foreground mt-1">{REHOOK_RULE}</p>
                <div className="mt-2 space-y-1.5">
                  {REHOOKS.map((r) => (
                    <div key={r.key} className="text-xs border-l-2 pl-2.5 py-0.5" style={{ borderColor: GOLD }}>
                      <strong>{r.label}.</strong> <em>{r.template}</em>{r.note && <span className="block text-muted-foreground">{r.note}</span>}
                    </div>
                  ))}
                </div>
              </details>
            </Section>

            {/* Close */}
            <Section title="4 · The close" sub={d.style === "jatho"
              ? "No CTA in this house — the loop replaces the outro. The tail must complete the opening line grammatically."
              : "Comment WORD → the artifact named by what they put in → the purpose clause → the closing question."}>
              {d.style === "nochill" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <F label="Keyword"><Input value={d.cta_keyword} onChange={(e) => set("cta_keyword", e.target.value.toUpperCase())} placeholder="TAX" /></F>
                  <F label="The artifact — by what they put IN"><Input value={d.cta_artifact} onChange={(e) => set("cta_artifact", e.target.value)} placeholder="the reserve calculator" /></F>
                  <F label="So you can…"><Input value={d.cta_purpose} onChange={(e) => set("cta_purpose", e.target.value)} placeholder="so SARS is never a surprise" /></F>
                </div>
              )}
              <F label={d.style === "jatho" ? "The loop tail — reads as one sentence with the hook" : "Closing question — answerable in four words"}>
                <Input value={d.closing_question} onChange={(e) => set("closing_question", e.target.value)} /></F>
              {d.style === "jatho" && chosen?.text && (
                <p className="text-xs rounded-md bg-muted px-2.5 py-2">
                  <strong>Tail check:</strong> “{d.closing_question} {chosen.text}” — read it aloud. One sentence?
                </p>
              )}
            </Section>

            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((w, i) => (
                  <div key={i} className={`rounded-lg border p-3 text-sm ${w.severity === "stop" ? "border-destructive/50 bg-destructive/5" : "border-amber-500/40 bg-amber-500/5"}`}>
                    {w.message}
                  </div>
                ))}
              </div>
            )}

            {/* Output */}
            <Section title="5 · The script" sub="Structure and slots. It never writes a figure — the ledger does.">
              <LedgerPanel report={report} hasLedger={ledger.length > 0} />
              <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/40 rounded-lg p-4 overflow-x-auto max-h-[28rem]">{fullText}</pre>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => save.mutate()} disabled={!d.title.trim() || save.isPending || report.blocked} className="bg-[#1C1C1C] hover:bg-[#333]">
                  {save.isPending ? "Saving…" : d.id ? "Save changes" : "Save script"}
                </Button>
                {report.blocked && <span className="text-xs text-destructive self-center">A banned figure is in this script. It does not save until that is out.</span>}
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(fullText); toast.success("Copied"); }}>
                  <Copy className="mr-1 h-3.5 w-3.5" />Copy
                </Button>
                {d.id && (
                  <Button variant="outline" onClick={() => pushFn({ data: { id: d.id! } }).then(() => { toast.success("In the tracker"); qc.invalidateQueries({ queryKey: ["content-os"] }); })}>
                    Send to tracker <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Section>
          </>
        )}

        {/* Saved */}
        {scripts.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold">Saved scripts</h2>
            <div className="rounded-xl border divide-y">
              {scripts.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3">
                  <button onClick={() => loadScript(s)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate">{s.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {STYLES.find((x) => x.key === s.style)?.name} · {s.format}
                      {s.pillar ? ` · ${s.pillar}` : ""}{s.piece_id ? " · in tracker" : ""}
                    </p>
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => delFn({ data: { id: s.id } }).then(() => qc.invalidateQueries({ queryKey: ["scripts"] }))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}

function LedgerPanel({ report, hasLedger }: { report: ReturnType<typeof checkScript>; hasLedger: boolean }) {
  if (!hasLedger) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
        <p className="text-sm font-semibold">Your ledger is empty, so nothing here is being checked.</p>
        <p className="text-xs text-muted-foreground mt-1">
          The ledger is what stops a figure you cannot defend reaching a script. Eight entries is enough
          for it to start catching things.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-2">
          <a href="/apps/ledger">Build the ledger <ArrowRight className="ml-1 h-3 w-3" /></a>
        </Button>
      </div>
    );
  }

  const tone = report.blocked
    ? "border-destructive/50 bg-destructive/5"
    : report.noRecord > 0
      ? "border-amber-500/40 bg-amber-500/5"
      : "border-emerald-500/40 bg-emerald-500/5";

  const Icon = (v: string) =>
    v === "verified" ? ShieldCheck : v === "unverified" ? ShieldAlert : v === "banned" ? ShieldX : HelpCircle;
  const colour = (v: string) =>
    v === "verified" ? "text-emerald-600" : v === "unverified" ? "text-amber-600" : v === "banned" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className={`rounded-lg border p-4 space-y-2.5 ${tone}`}>
      <p className="text-sm font-semibold">{report.headline}</p>
      {report.verdicts.length > 0 && (
        <div className="space-y-1.5">
          {report.verdicts.map((v, i) => {
            const I = Icon(v.verdict);
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <I className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${colour(v.verdict)}`} />
                <span className="min-w-0">
                  <strong className="font-mono">{v.claim.raw}</strong>
                  <span className="block text-muted-foreground leading-relaxed">{v.message}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground pt-1 border-t">
        Every figure carries a source trace. If a beat needs a bigger number than the receipt supports,
        the beat is wrong — not the receipt.
      </p>
    </div>
  );
}

function updHook(setD: React.Dispatch<React.SetStateAction<Draft>>, i: number, patch: Partial<HookCandidate>) {
  setD((p) => ({ ...p, hooks: p.hooks.map((h, k) => (k === i ? { ...h, ...patch } : h)) }));
}

function renderScript(d: Draft, chosen: HookCandidate | null, beats: Beat[], styleName: string): string {
  const head = [
    `${d.title || "[untitled]"}`,
    `${styleName} · ${d.format} · ${d.pillar ?? "no pillar"} · target ${d.runtime_target ?? "—"}s`,
    ``,
    `SCREEN AT 0:00   ${d.screen_text || "[the verdict — max 5 words, no punctuation]"}`,
    `SPOKEN HOOK      ${chosen?.text || "[choose a hook above]"}`,
    ``,
    `— the screen states the verdict, the voice gives the evidence.`,
    `  Different jobs, not different words.`,
    ``,
    `${"─".repeat(64)}`,
  ].join("\n");

  const body = beats.map((b) => {
    const guard = b.guard ? `\n     ⚠ ${b.guard}` : "";
    return `\n[${b.t}]  ${b.name}\n     ${b.job}${guard}\n\n     ${b.slot || "[ ]"}\n`;
  }).join("");

  return `${head}${body}\n${"─".repeat(64)}\nEvery figure must appear in your receipts list. If a beat needs a bigger\nnumber than the receipt supports, the beat is wrong — not the receipt.`;
}

// ── bits ─────────────────────────────────────────────────────────────────────

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border p-5 space-y-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {sub && <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function TA({ value, onChange, rows, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows ?? 3} placeholder={placeholder}
    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />;
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
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      {children}
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex flex-col"><SiteHeader /><main className="flex-1">{children}</main><SiteFooter /></div>;
}

function Locked() {
  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-3">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Script Studio</h1>
        <p className="text-muted-foreground">Part of the Foundation Kit. Two houses, scored hooks, and a script that cannot invent a figure.</p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
