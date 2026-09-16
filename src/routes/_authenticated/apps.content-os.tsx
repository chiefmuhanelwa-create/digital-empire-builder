import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import {
  listContent, upsertPiece, deletePiece, saveContentSettings, seedStarterPieces,
  listIdeas, upsertIdea, deleteIdea, promoteIdea, listResources, upsertResource, seedLibrary,
} from "@/lib/content-os.functions";
import {
  PILLARS, HOOK_SHAPES, FORMATS, STATUSES, DEFAULT_SETTINGS,
  pieceBlockers, shapeVerdicts, pillarBalance, contentSignals,
  type Piece, type Settings,
} from "@/lib/content-os";
import { KANBAN_COLUMNS, LIBRARY_KINDS, nextStatus, prevStatus } from "@/lib/content-library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Lock, Plus, AlertTriangle, Settings2, Trash2, TrendingUp, X, Star, ExternalLink,
  ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, Lightbulb, Library, Target, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/content-os")({
  head: () => ({ meta: [{ title: "Content OS — Contentpreneur Africa" }] }),
  component: Page,
});

// House palette — charcoal and gold. Locked.
const INK = "#1C1C1C";
const GOLD = "#D4A82F";

type Tab = "tracker" | "month" | "ideas" | "library" | "insights";

function Page() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Tool />;
}

const BLANK: Omit<Piece, "id" | "updated_at"> & { id?: string } = {
  title: "", pillar: null, format: "reel", status: "idea", hook: null, hook_shape: null,
  screen_text: null, story_ref: null, receipt_ref: null, cta_keyword: null, runtime_seconds: null,
  scheduled_for: null, posted_at: null, platform: null, permalink: null,
  reach: null, saves: null, comments: null, shares: null, completion_pct: null, notes: null,
};

function Tool() {
  const qc = useQueryClient();
  const fns = {
    list: useServerFn(listContent), upsert: useServerFn(upsertPiece), del: useServerFn(deletePiece),
    settings: useServerFn(saveContentSettings), seed: useServerFn(seedStarterPieces),
    ideas: useServerFn(listIdeas), upIdea: useServerFn(upsertIdea), delIdea: useServerFn(deleteIdea),
    promote: useServerFn(promoteIdea), res: useServerFn(listResources), upRes: useServerFn(upsertResource),
    seedLib: useServerFn(seedLibrary),
  };

  const { data, isLoading } = useQuery({ queryKey: ["content-os"], queryFn: () => fns.list() });
  const { data: ideaData } = useQuery({ queryKey: ["content-ideas"], queryFn: () => fns.ideas() });
  const { data: resData } = useQuery({ queryKey: ["content-res"], queryFn: () => fns.res() });

  const [tab, setTab] = useState<Tab>("tracker");
  const [editing, setEditing] = useState<(typeof BLANK) | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const pieces = (data?.pieces ?? []) as Piece[];
  const settings: Settings = { ...DEFAULT_SETTINGS, ...((data?.settings ?? {}) as Partial<Settings>) };
  const ideas = (ideaData?.ideas ?? []) as any[];
  const resources = (resData?.resources ?? []) as any[];

  const signals = useMemo(() => contentSignals(pieces, settings), [pieces, settings]);
  const urgent = signals.filter((s) => s.state !== "ok");

  // Seed the library once, quietly. An empty library is the thing this replaces.
  useEffect(() => {
    if (resData && resources.length === 0) fns.seedLib().then(() => qc.invalidateQueries({ queryKey: ["content-res"] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resData]);

  const save = useMutation({
    mutationFn: (p: typeof BLANK) => fns.upsert({ data: p }),
    onSuccess: () => { toast.success("Saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["content-os"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const move = useMutation({
    mutationFn: (p: Piece & { _to: string }) => fns.upsert({ data: { ...p, status: p._to } as any }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-os"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => fns.del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["content-os"] }); },
  });
  const seed = useMutation({
    mutationFn: () => fns.seed(),
    onSuccess: (r) => { toast.success(r.seeded ? `${r.seeded} ideas queued` : "Already has pieces"); qc.invalidateQueries({ queryKey: ["content-os"] }); },
  });

  return (
    <Shell>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${INK} 0%, #2a2518 55%, ${INK} 100%)` }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: `radial-gradient(circle at 20% 30%, ${GOLD} 0%, transparent 45%), radial-gradient(circle at 80% 70%, ${GOLD} 0%, transparent 40%)` }} />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
            Contentpreneur Africa
          </p>
          <h1 className="mt-3 font-extrabold tracking-tight text-white text-4xl sm:text-6xl leading-[0.95]">
            CONTENT <span style={{ color: GOLD }}>OS</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[#C8C2B4] leading-relaxed">
            Every piece from idea to what it actually did. The generators make things and forget them —
            this is the part that remembers, and it is the only reason the numbers here can be yours
            rather than somebody else's.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => { setTab("tracker"); setEditing({ ...BLANK }); }}
              className="bg-[#D4A82F] text-[#1C1C1C] hover:bg-[#D9BC45] font-semibold">
              <Plus className="mr-1.5 h-4 w-4" />New piece
            </Button>
            <Button onClick={() => setTab("ideas")} variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Lightbulb className="mr-1.5 h-4 w-4" />New idea
            </Button>
            <Button onClick={() => setShowSettings((v) => !v)} variant="ghost" className="text-[#C8C2B4] hover:text-white hover:bg-white/10">
              <Settings2 className="mr-1.5 h-4 w-4" />Setup
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-7">
        {/* ── Signals ────────────────────────────────────────────────────── */}
        {urgent.length > 0 && (
          <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {urgent.map((s) => (
              <div key={s.title}
                className={`rounded-xl border p-4 ${s.state === "urgent" ? "border-destructive/40 bg-destructive/5" : "border-amber-500/40 bg-amber-500/5"}`}>
                <p className="font-semibold text-sm leading-snug">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </section>
        )}

        {showSettings && (
          <SettingsPanel settings={settings}
            onSave={(s) => fns.settings({ data: s }).then(() => { toast.success("Saved"); setShowSettings(false); qc.invalidateQueries({ queryKey: ["content-os"] }); })} />
        )}

        {editing && (
          <PieceForm value={editing} settings={settings} onChange={setEditing}
            onCancel={() => setEditing(null)} onSave={() => save.mutate(editing)} saving={save.isPending} />
        )}

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <nav className="flex flex-wrap gap-1.5 border-b pb-3">
          {([
            ["tracker", "Media Tracker", LayoutGrid],
            ["month", "Month", CalendarDays],
            ["ideas", "Idea Bank", Lightbulb],
            ["library", "Resource Library", Library],
            ["insights", "What's working", Target],
          ] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k as Tab)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                tab === k ? "bg-[#1C1C1C] text-white" : "text-muted-foreground hover:bg-muted"}`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </nav>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}

        {!isLoading && pieces.length === 0 && tab === "tracker" && (
          <section className="rounded-xl border border-dashed p-10 text-center space-y-3">
            <h2 className="font-semibold text-lg">Start with something in it, not nothing</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              An empty template is the thing this replaces. Queue eight ideas across the five pillars —
              you can rename every one of them.
            </p>
            <Button onClick={() => seed.mutate()} disabled={seed.isPending}
              className="bg-[#1C1C1C] hover:bg-[#333]">
              {seed.isPending ? "Seeding…" : "Queue eight starter ideas"}
            </Button>
          </section>
        )}

        {tab === "tracker" && pieces.length > 0 && (
          <Kanban pieces={pieces} settings={settings} onEdit={setEditing}
            onMove={(p, to) => move.mutate({ ...p, _to: to })} onDelete={(id) => remove.mutate(id)} />
        )}

        {tab === "month" && <MonthView pieces={pieces} onEdit={setEditing} />}

        {tab === "ideas" && (
          <IdeaBank ideas={ideas}
            onSave={(i) => fns.upIdea({ data: i }).then(() => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["content-ideas"] }); })}
            onDelete={(id) => fns.delIdea({ data: { id } }).then(() => qc.invalidateQueries({ queryKey: ["content-ideas"] }))}
            onPromote={(id) => fns.promote({ data: { id } }).then(() => { toast.success("Moved into the tracker"); qc.invalidateQueries({ queryKey: ["content-ideas"] }); qc.invalidateQueries({ queryKey: ["content-os"] }); setTab("tracker"); })} />
        )}

        {tab === "library" && (
          <ResourceLibrary resources={resources}
            onSave={(r) => fns.upRes({ data: r }).then(() => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["content-res"] }); })} />
        )}

        {tab === "insights" && <Insights pieces={pieces} />}
      </div>
    </Shell>
  );
}

// ── Kanban ────────────────────────────────────────────────────────────────────

function Kanban({ pieces, settings, onEdit, onMove, onDelete }: {
  pieces: Piece[]; settings: Settings;
  onEdit: (p: Piece) => void; onMove: (p: Piece, to: string) => void; onDelete: (id: string) => void;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-500", blue: "bg-blue-500", amber: "bg-amber-500",
    violet: "bg-violet-500", emerald: "bg-emerald-500", gold: "bg-[#D4A82F]",
  };
  return (
    <div className="-mx-4 px-4 overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        {KANBAN_COLUMNS.map((col) => {
          const items = pieces.filter((p) => p.status === col.key);
          return (
            <div key={col.key} className="w-[248px] shrink-0 rounded-xl bg-muted/40 p-2.5">
              <div className="flex items-center gap-2 px-1.5 pb-2.5">
                <span className={`h-2 w-2 rounded-full ${tones[col.tone]}`} />
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((p) => {
                  const stops = pieceBlockers(p, settings).filter((b) => b.severity === "stop").length;
                  const back = prevStatus(p.status), fwd = nextStatus(p.status);
                  return (
                    <div key={p.id} className="group rounded-lg border bg-background p-2.5 shadow-sm">
                      <button onClick={() => onEdit(p)} className="w-full text-left">
                        <div className="flex items-start gap-1.5">
                          <span className="text-sm font-medium leading-snug">{p.title}</span>
                          {stops > 0 && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.pillar && <Chip>{p.pillar}</Chip>}
                          <Chip muted>{p.format}</Chip>
                          {p.reach !== null && <Chip gold>{p.reach.toLocaleString("en-GB")}</Chip>}
                        </div>
                      </button>
                      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button disabled={!back} onClick={() => back && onMove(p, back)}
                          className="rounded p-1 hover:bg-muted disabled:opacity-25" aria-label="Back">
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button disabled={!fwd} onClick={() => fwd && onMove(p, fwd)}
                          className="rounded p-1 hover:bg-muted disabled:opacity-25" aria-label="Forward">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => onDelete(p.id)} className="ml-auto rounded p-1 hover:bg-muted" aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="px-1.5 py-3 text-xs text-muted-foreground">Nothing here.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Month ─────────────────────────────────────────────────────────────────────

function MonthView({ pieces, onEdit }: { pieces: Piece[]; onEdit: (p: Piece) => void }) {
  const [offset, setOffset] = useState(0);
  const base = new Date();
  const cur = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const year = cur.getFullYear(), month = cur.getMonth();
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(year, month + 1, 0).getDate();

  const byDay = useMemo(() => {
    const m: Record<string, Piece[]> = {};
    for (const p of pieces) {
      const d = p.scheduled_for ?? (p.posted_at ? p.posted_at.slice(0, 10) : null);
      if (!d) continue;
      (m[d] ??= []).push(p);
    }
    return m;
  }, [pieces]);

  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const key = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOffset(offset - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <h2 className="font-semibold min-w-44 text-center">
          {cur.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setOffset(offset + 1)}><ChevronRight className="h-4 w-4" /></Button>
        {offset !== 0 && <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>Today</Button>}
        <span className="ml-auto text-xs text-muted-foreground">Never Friday — index 0.76. Saturday indexes highest at 1.08.</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className={`text-[11px] font-semibold uppercase tracking-wide px-1 pb-1 ${d === "Fri" ? "text-destructive/70" : "text-muted-foreground"}`}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const k = key(d);
          const items = byDay[k] ?? [];
          const isFri = (startDow + d - 1) % 7 === 4;
          return (
            <div key={k} className={`min-h-24 rounded-lg border p-1.5 ${k === todayKey ? "border-[#D4A82F] bg-[#D4A82F]/5" : isFri ? "bg-destructive/[0.03]" : ""}`}>
              <div className="text-[11px] text-muted-foreground tabular-nums">{d}</div>
              <div className="space-y-1 mt-0.5">
                {items.map((p) => (
                  <button key={p.id} onClick={() => onEdit(p)}
                    className={`block w-full truncate rounded px-1.5 py-1 text-[11px] text-left ${
                      p.status === "posted" ? "bg-[#D4A82F]/20 text-[#7a5f10] dark:text-[#D9BC45]" : "bg-muted hover:bg-muted/70"}`}>
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Idea Bank ─────────────────────────────────────────────────────────────────

function IdeaBank({ ideas, onSave, onDelete, onPromote }: {
  ideas: any[]; onSave: (i: any) => void; onDelete: (id: string) => void; onPromote: (id: string) => void;
}) {
  const [draft, setDraft] = useState({ idea: "", topic: "", pillar: "", inspiration_url: "", source_handle: "", angle: "", favourite: false });
  return (
    <section className="space-y-5">
      <div className="rounded-xl border p-5 space-y-3">
        <div>
          <h2 className="font-semibold">Capture an idea</h2>
          <p className="text-sm text-muted-foreground">
            Where it came from is the part that makes it reusable in six months. An idea without a source
            is a note you will not trust later.
          </p>
        </div>
        <Input value={draft.idea} onChange={(e) => setDraft({ ...draft, idea: e.target.value })} placeholder="The idea, in one line" />
        <div className="grid gap-3 sm:grid-cols-4">
          <F label="Pillar">
            <Sel value={draft.pillar} onChange={(v) => setDraft({ ...draft, pillar: v })}
              options={[["", "—"], ...PILLARS.map((p) => [p.key, p.key] as [string, string])]} />
          </F>
          <F label="Topic"><Input value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} /></F>
          <F label="Link to inspiration"><Input value={draft.inspiration_url} onChange={(e) => setDraft({ ...draft, inspiration_url: e.target.value })} placeholder="https://" /></F>
          <F label="Whose"><Input value={draft.source_handle} onChange={(e) => setDraft({ ...draft, source_handle: e.target.value })} placeholder="@handle" /></F>
        </div>
        <F label="Your angle — what makes it yours rather than theirs">
          <Input value={draft.angle} onChange={(e) => setDraft({ ...draft, angle: e.target.value })} />
        </F>
        <Button disabled={!draft.idea.trim()} className="bg-[#1C1C1C] hover:bg-[#333]"
          onClick={() => { onSave(draft); setDraft({ idea: "", topic: "", pillar: "", inspiration_url: "", source_handle: "", angle: "", favourite: false }); }}>
          <Plus className="mr-1 h-4 w-4" />Add to bank
        </Button>
      </div>

      {ideas.length > 0 && (
        <div className="rounded-xl border divide-y overflow-hidden">
          {ideas.map((i) => (
            <div key={i.id} className="flex items-start gap-3 p-3">
              <button onClick={() => onSave({ ...i, favourite: !i.favourite })} className="mt-0.5 shrink-0">
                <Star className={`h-4 w-4 ${i.favourite ? "fill-[#D4A82F] text-[#D4A82F]" : "text-muted-foreground"}`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{i.idea}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {i.pillar && <Chip>{i.pillar}</Chip>}
                  {i.topic && <Chip muted>{i.topic}</Chip>}
                  {i.source_handle && <Chip muted>{i.source_handle}</Chip>}
                  {i.used_piece_id && <Chip gold>in tracker</Chip>}
                  {i.inspiration_url && (
                    <a href={i.inspiration_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:underline">
                      source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {i.angle && <p className="text-xs text-muted-foreground mt-1">{i.angle}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!i.used_piece_id && (
                  <Button size="sm" variant="outline" onClick={() => onPromote(i.id)}>
                    Use <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onDelete(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Resource Library ──────────────────────────────────────────────────────────

function ResourceLibrary({ resources, onSave }: { resources: any[]; onSave: (r: any) => void }) {
  const [kind, setKind] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ kind: "hook", title: "", body: "", evidence: "", pillar: "" });

  if (!kind) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Every row carries the measurement behind it. That is the difference between a library and a
          swipe file — you can see why a line is here, and retire it the moment your own numbers disagree.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LIBRARY_KINDS.map((k) => {
            const n = resources.filter((r) => r.kind === k.key).length;
            return (
              <button key={k.key} onClick={() => setKind(k.key)}
                className="group text-left rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-28 flex items-center justify-center px-4"
                  style={{ background: `linear-gradient(135deg, ${INK} 0%, #332b16 100%)` }}>
                  <span className="font-extrabold uppercase tracking-tight text-white text-xl text-center leading-tight">
                    {k.label}
                  </span>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{k.label}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{n}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{k.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  const meta = LIBRARY_KINDS.find((k) => k.key === kind)!;
  const rows = resources.filter((r) => r.kind === kind);
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setKind(null)}><ChevronLeft className="h-4 w-4 mr-1" />Library</Button>
        <h2 className="font-semibold">{meta.label}</h2>
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setDraft({ ...draft, kind }); setAdding((v) => !v); }}>
          <Plus className="h-3.5 w-3.5 mr-1" />Add your own
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{meta.blurb}</p>

      {adding && (
        <div className="rounded-xl border p-4 space-y-3">
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="The line itself" />
          <Input value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="How to use it" />
          <Input value={draft.evidence} onChange={(e) => setDraft({ ...draft, evidence: e.target.value })} placeholder="The number behind it — leave blank if you have none yet" />
          <Button disabled={!draft.title.trim()} className="bg-[#1C1C1C] hover:bg-[#333]"
            onClick={() => { onSave({ ...draft, kind }); setDraft({ kind, title: "", body: "", evidence: "", pillar: "" }); setAdding(false); }}>
            Save
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-sm leading-snug">{r.title}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                {r.pillar && <Chip>{r.pillar}</Chip>}
                {!r.is_seed && <Chip muted>yours</Chip>}
              </div>
            </div>
            {r.body && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{r.body}</p>}
            {r.evidence && (
              <p className="mt-2 text-xs rounded-md bg-muted/60 px-2.5 py-1.5 border-l-2" style={{ borderColor: GOLD }}>
                {r.evidence}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Insights ──────────────────────────────────────────────────────────────────

function Insights({ pieces }: { pieces: Piece[] }) {
  const shapes = useMemo(() => shapeVerdicts(pieces), [pieces]);
  const balance = useMemo(() => pillarBalance(pieces), [pieces]);
  const measured = pieces.filter((p) => p.status === "posted" && p.reach !== null).length;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border p-5 space-y-4">
        <div>
          <h2 className="font-semibold flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />What is working for you</h2>
          <p className="text-sm text-muted-foreground">
            The faint number is the published default, measured on one account. Once you have three posted
            pieces in a shape, <strong>your number replaces it</strong> — and if yours disagrees, yours is right.
            {measured < 3 && <span className="block mt-1">You have {measured} measured {measured === 1 ? "piece" : "pieces"}. Log a few more and this page becomes yours.</span>}
          </p>
        </div>
        <div className="space-y-2">
          {shapes.map((s) => (
            <div key={s.shape} className="flex items-baseline justify-between gap-4 border-b pb-2 last:border-0">
              <span className="min-w-0">
                <span className="font-medium text-sm">{s.label}</span>
                {s.ownsIt && <span className="ml-2 text-[10px] uppercase tracking-wide font-semibold" style={{ color: GOLD }}>yours · n={s.n}</span>}
                <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.note}</span>
              </span>
              <span className="shrink-0 tabular-nums text-right text-sm">
                {s.medianReach !== null
                  ? <><strong>{s.medianReach.toLocaleString("en-GB")}</strong><span className="text-muted-foreground text-xs"> / {s.baseline?.toLocaleString("en-GB") ?? "—"}</span></>
                  : <span className="text-muted-foreground">{s.baseline?.toLocaleString("en-GB") ?? "untested"}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border p-5">
        <h3 className="font-semibold text-sm mb-3">Pillar balance, posted</h3>
        <div className="space-y-2">
          {balance.map((b) => (
            <div key={b.pillar} className="flex items-center gap-3 text-xs">
              <span className="w-36 shrink-0 font-medium">{b.pillar}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, b.actual)}%`, background: GOLD }} />
              </div>
              <span className="w-20 text-right tabular-nums text-muted-foreground">{b.actual}% / {b.target}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

function Chip({ children, muted, gold }: { children: React.ReactNode; muted?: boolean; gold?: boolean }) {
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
      gold ? "bg-[#D4A82F]/20 text-[#7a5f10] dark:text-[#D9BC45]" : muted ? "bg-muted text-muted-foreground" : "bg-[#1C1C1C] text-white dark:bg-white dark:text-[#1C1C1C]"}`}>
      {children}
    </span>
  );
}

function PieceForm({ value, settings, onChange, onCancel, onSave, saving }: {
  value: typeof BLANK; settings: Settings;
  onChange: (v: typeof BLANK) => void; onCancel: () => void; onSave: () => void; saving: boolean;
}) {
  const set = <K extends keyof typeof BLANK>(k: K, v: (typeof BLANK)[K]) => onChange({ ...value, [k]: v });
  const blockers = pieceBlockers(value as Piece, settings);
  const stops = blockers.filter((b) => b.severity === "stop");

  return (
    <section className="rounded-xl border p-5 space-y-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{value.id ? "Edit piece" : "New piece"}</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>

      <F label="Title"><Input value={value.title} onChange={(e) => set("title", e.target.value)} /></F>

      <div className="grid gap-3 sm:grid-cols-3">
        <F label="Pillar"><Sel value={value.pillar ?? ""} onChange={(v) => set("pillar", v || null)}
          options={[["", "—"], ...PILLARS.map((p) => [p.key, p.key] as [string, string])]} /></F>
        <F label="Format"><Sel value={value.format} onChange={(v) => set("format", v)} options={FORMATS.map((f) => [f, f])} /></F>
        <F label="Status"><Sel value={value.status} onChange={(v) => set("status", v)} options={STATUSES.map((s) => [s, s])} /></F>
      </div>

      <F label="Hook — the spoken line"><Input value={value.hook ?? ""} onChange={(e) => set("hook", e.target.value)} /></F>
      <div className="grid gap-3 sm:grid-cols-2">
        <F label="Screen text — different words from the hook">
          <Input value={value.screen_text ?? ""} onChange={(e) => set("screen_text", e.target.value)} /></F>
        <F label="Hook shape"><Sel value={value.hook_shape ?? ""} onChange={(v) => set("hook_shape", v || null)}
          options={[["", "—"], ...HOOK_SHAPES.map((h) => [h.key, h.label] as [string, string])]} /></F>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <F label="Story it spends"><Input value={value.story_ref ?? ""} onChange={(e) => set("story_ref", e.target.value)} placeholder="ST-103" /></F>
        <F label="Receipt it spends"><Input value={value.receipt_ref ?? ""} onChange={(e) => set("receipt_ref", e.target.value)} placeholder="R15,000 → R45,000" /></F>
        <F label="CTA keyword"><Input value={value.cta_keyword ?? ""} onChange={(e) => set("cta_keyword", e.target.value.toUpperCase())} placeholder="TAX" /></F>
        <F label="Runtime (s)"><Input type="number" value={value.runtime_seconds ?? ""} onChange={(e) => set("runtime_seconds", e.target.value ? Number(e.target.value) : null)} /></F>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <F label="Scheduled for"><Input type="date" value={value.scheduled_for ?? ""} onChange={(e) => set("scheduled_for", e.target.value || null)} /></F>
        <F label="Permalink"><Input value={value.permalink ?? ""} onChange={(e) => set("permalink", e.target.value || null)} /></F>
      </div>

      {value.status === "posted" && (
        <div className="rounded-lg border bg-background p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What it did</p>
          <div className="grid gap-3 sm:grid-cols-5">
            {([["reach", "Reach"], ["saves", "Saves"], ["comments", "Comments"], ["shares", "Shares"], ["completion_pct", "Completion %"]] as const).map(([k, label]) => (
              <F key={k} label={label}>
                <Input type="number" value={(value[k] as number | null) ?? ""} onChange={(e) => set(k, e.target.value ? Number(e.target.value) : null)} />
              </F>
            ))}
          </div>
        </div>
      )}

      {blockers.length > 0 && (
        <div className="space-y-2">
          {blockers.map((b, i) => (
            <div key={i} className={`rounded-lg border p-3 text-sm leading-relaxed ${b.severity === "stop" ? "border-destructive/50 bg-destructive/5" : "border-amber-500/40 bg-amber-500/5"}`}>
              {b.message}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={onSave} className="bg-[#1C1C1C] hover:bg-[#333]"
          disabled={saving || !value.title.trim() || (value.status === "scheduled" && stops.length > 0)}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {value.status === "scheduled" && stops.length > 0 && (
          <span className="text-xs text-destructive">Fix {stops.length} blocker{stops.length > 1 ? "s" : ""} before scheduling</span>
        )}
      </div>
    </section>
  );
}

function SettingsPanel({ settings, onSave }: { settings: Settings; onSave: (s: Settings) => void }) {
  const [s, setS] = useState<Settings>(settings);
  const [kw, setKw] = useState("");
  return (
    <section className="rounded-xl border p-5 space-y-4 bg-muted/20">
      <div>
        <h2 className="font-semibold">Setup</h2>
        <p className="text-sm text-muted-foreground">
          A CTA keyword counts here only once it actually resolves somewhere. The system blocks scheduling
          on any keyword not in this list — 320 comments have already landed nowhere.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {s.wired_keywords.map((k) => (
          <span key={k} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium">
            {k}
            <button onClick={() => setS({ ...s, wired_keywords: s.wired_keywords.filter((x) => x !== k) })}><X className="h-3 w-3" /></button>
          </span>
        ))}
        {s.wired_keywords.length === 0 && <span className="text-xs text-muted-foreground">None wired yet.</span>}
      </div>
      <div className="flex gap-2">
        <Input value={kw} onChange={(e) => setKw(e.target.value.toUpperCase())} placeholder="TAX" className="max-w-40" />
        <Button variant="outline" size="sm" onClick={() => { if (kw.trim()) { setS({ ...s, wired_keywords: [...new Set([...s.wired_keywords, kw.trim()])] }); setKw(""); } }}>
          Add wired keyword
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <F label="Pieces per week"><Input type="number" value={s.weekly_target} onChange={(e) => setS({ ...s, weekly_target: Number(e.target.value) || 4 })} /></F>
        <F label="Runtime low (s)"><Input type="number" value={s.runtime_low} onChange={(e) => setS({ ...s, runtime_low: Number(e.target.value) || 90 })} /></F>
        <F label="Runtime high (s)"><Input type="number" value={s.runtime_high} onChange={(e) => setS({ ...s, runtime_high: Number(e.target.value) || 105 })} /></F>
      </div>
      <Button onClick={() => onSave(s)} className="bg-[#1C1C1C] hover:bg-[#333]">Save setup</Button>
    </section>
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
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
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
        <h1 className="text-2xl font-bold">Content OS</h1>
        <p className="text-muted-foreground">Part of the Foundation Kit. Every piece from idea to what it actually did.</p>
        <Button asChild><a href="/foundation">Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
