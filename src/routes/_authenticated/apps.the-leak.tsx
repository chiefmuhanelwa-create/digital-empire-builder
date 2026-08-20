import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { getLeakAudit, saveLeakAudit } from "@/lib/leak.functions";
import {
  KINDS, EMPTY_BASIS, calculate, hourlyRate, costRate, rands, readOut,
  PRODUCTIVE_HOURS, CHARGE_OUT_MULTIPLIER,
  type Basis, type LeakItem, type LeakKind,
} from "@/lib/leak-engine";
import { Lock, ArrowRight, Plus, Trash2, Copy, Printer, Check, Cloud } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/the-leak")({
  head: () => ({ meta: [{ title: "The Leak — Contentpreneur Africa" }] }),
  component: TheLeak,
});

const newItem = (kind: LeakKind): LeakItem => ({
  id: Math.random().toString(36).slice(2, 9),
  kind, label: "", timesPerYear: 0, minutesEach: 0,
});

function TheLeak() {
  const { access } = useKitAccess();
  const getFn = useServerFn(getLeakAudit);
  const saveFn = useServerFn(saveLeakAudit);

  const [basis, setBasis] = useState<Basis>(EMPTY_BASIS);
  const [items, setItems] = useState<LeakItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const dirty = useRef(false);

  // The Knowledge Audit already asked "what do people ask your advice on for
  // free?" — which is this tool's entire subject. Reading it means the buyer
  // does not answer the same question twice, and it makes the connection
  // between the two tools visible: the thing they are asked for constantly IS
  // the leak, and it is also their first product.
  const [asked, setAsked] = useState<string>("");
  useEffect(() => {
    try {
      const ka = JSON.parse(localStorage.getItem("nochill-knowledge-v1") || "null");
      const v = (ka?.fields?.ask ?? "").toString().trim();
      if (v) setAsked(v);
    } catch { /* ignore */ }
  }, []);

  // Load from the server, not from this browser.
  useEffect(() => {
    getFn()
      .then((r) => {
        const res = r as { basis?: Basis | null; items?: LeakItem[] | null };
        if (res?.basis && typeof res.basis === "object") setBasis({ ...EMPTY_BASIS, ...res.basis });
        if (Array.isArray(res?.items)) setItems(res.items);
      })
      .catch(() => { /* first run, or the migration has not been applied yet */ })
      .finally(() => setLoaded(true));
  }, [getFn]);

  const persist = useCallback(async (b: Basis, it: LeakItem[]) => {
    setSaving("saving");
    try {
      await saveFn({ data: { basis: b, items: it } });
      setSaving("saved");
    } catch {
      setSaving("idle"); // silent: a failed autosave must not interrupt the work
    }
  }, [saveFn]);

  // Debounced autosave. Nobody presses save on a worksheet.
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    const t = setTimeout(() => void persist(basis, items), 900);
    return () => clearTimeout(t);
  }, [basis, items, loaded, persist]);

  const mutate = (fn: () => void) => { dirty.current = true; setSaving("idle"); fn(); };

  const result = useMemo(() => calculate(basis, items), [basis, items]);
  const rate = hourlyRate(basis);
  const cost = costRate(basis);
  const out = useMemo(() => readOut(result, basis), [result, basis]);

  const copyScript = (t: string) =>
    navigator.clipboard.writeText(t).then(() => toast.success("Copied"), () => toast.error("Could not copy"));

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The Leak is part of the Foundation Kit.</h2>
            <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* ── hero: state the problem before asking for anything */}
      <section className="border-b border-border bg-[var(--obsidian)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-12 pb-11">
          <Link to="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-bright)] hover:underline">
            ← Your Clarity System
          </Link>
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--nx-gold-bright)] mt-5">
            Stage 2 · The audit nobody runs
          </p>
          <h1 className="mt-3 text-white text-[2rem] sm:text-[2.9rem] font-black leading-[1.04] tracking-tight">
            You are not underpaid.<br />You are unbilled.
          </h1>
          <p className="text-[#C8C2B4] text-[1.02rem] mt-4 max-w-2xl leading-relaxed">
            Every week you give away work that has a price — the brain-pick coffee, the document you
            reviewed as a favour, the talk nobody paid for, the answer that took twenty years to be
            able to give. Each one is small. That is exactly why nobody counts them.
          </p>
          <p className="text-[#C8C2B4] text-[1.02rem] mt-3 max-w-2xl leading-relaxed">
            This counts them, using the same method your own industry uses to price you.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-9 space-y-5">
        {/* ── 1. the rate */}
        <section className="nx-card !p-6">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="nx-label">One · What an hour of you is worth</p>
            <SaveState state={saving} />
          </div>

          <div className="flex gap-2 mt-4">
            <Tab on={basis.mode === "package"} onClick={() => mutate(() => setBasis({ ...basis, mode: "package" }))}>
              Work it out for me
            </Tab>
            <Tab on={basis.mode === "known"} onClick={() => mutate(() => setBasis({ ...basis, mode: "known" }))}>
              I already know my rate
            </Tab>
          </div>

          {basis.mode === "package" ? (
            <>
              <label className="block mt-4">
                <span className="text-sm font-bold text-[var(--text-body)]">Your total annual package (R)</span>
                <span className="block text-xs text-[var(--text-subtle)]">
                  Salary, bonus, benefits — everything. This never leaves your account.
                </span>
                <input
                  type="number" min={0} inputMode="numeric"
                  value={basis.annualPackage ?? ""}
                  onChange={(e) => mutate(() => setBasis({ ...basis, annualPackage: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) }))}
                  className="mt-2 w-full sm:w-64 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-lg font-bold tabular-nums outline-none focus:border-[var(--nx-gold)]"
                />
              </label>

              {rate && cost && (
                <div className="mt-5 rounded-xl bg-[var(--bg-surface)] p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Fig n={rands(cost)} l="what you cost per hour" />
                    <Fig n={`${CHARGE_OUT_MULTIPLIER}×`} l="the standard multiplier" />
                    <Fig n={rands(rate)} l="what you are worth per hour" gold />
                  </div>
                  <p className="text-xs text-[var(--text-dim)] mt-4 leading-relaxed">
                    Your package divided by {PRODUCTIVE_HOURS.toLocaleString("en-ZA")} working hours
                    gives what you cost. Professional firms bill people out at roughly{" "}
                    {CHARGE_OUT_MULTIPLIER} times that — it covers overhead, non-billable time and
                    margin. It is why a salaried consultant is billed to clients far above their
                    salary. This is a benchmark, not a law; if you know your real number, use the
                    other tab.
                  </p>
                </div>
              )}
            </>
          ) : (
            <label className="block mt-4">
              <span className="text-sm font-bold text-[var(--text-body)]">Your hourly rate (R)</span>
              <span className="block text-xs text-[var(--text-subtle)]">What you charge, or would charge, for an hour of advisory work.</span>
              <input
                type="number" min={0} inputMode="numeric"
                value={basis.knownHourly ?? ""}
                onChange={(e) => mutate(() => setBasis({ ...basis, knownHourly: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) }))}
                className="mt-2 w-full sm:w-64 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-lg font-bold tabular-nums outline-none focus:border-[var(--nx-gold)]"
              />
            </label>
          )}
        </section>

        {/* ── 2. the log */}
        <section className="nx-card !p-6">
          <p className="nx-label">Two · What you gave away last year</p>
          <p className="nx-body mt-1">
            Rough numbers. Under-counting is the norm here — if you are unsure between two figures,
            take the higher one, because you are almost certainly still low.
          </p>

          {asked && !items.some((i) => i.label === asked) && (
            <div className="mt-4 rounded-xl border border-[var(--nx-gold)]/40 bg-[var(--bg-surface)] p-4">
              <p className="nx-label">From your Knowledge Audit</p>
              <p className="text-sm text-[var(--text-body)] mt-1">
                You said people already ask you about <strong>{asked}</strong>. That is almost
                certainly your biggest line here — and it is also your first product, because the
                demand is already proven.
              </p>
              <button
                onClick={() => mutate(() => setItems([...items, { ...newItem("brain-pick"), label: asked }]))}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--obsidian)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="size-3.5" /> Add it as a leak
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {KINDS.map((k) => (
              <button
                key={k.key}
                onClick={() => mutate(() => setItems([...items, newItem(k.key)]))}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-2 text-xs font-bold text-[var(--text-dim)] hover:border-[var(--nx-gold)] hover:text-foreground transition-colors"
              >
                <Plus className="size-3.5" /> {k.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {items.map((it, i) => {
              const spec = KINDS.find((k) => k.key === it.kind)!;
              return (
                <div key={it.id} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-body)]">{spec.label}</p>
                      <p className="text-xs text-[var(--text-subtle)]">{spec.hint}</p>
                    </div>
                    <button
                      onClick={() => mutate(() => setItems(items.filter((_, n) => n !== i)))}
                      className="text-[var(--text-subtle)] hover:text-[#B3352B] shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    <Num
                      label="Times a year"
                      value={it.timesPerYear}
                      onChange={(v) => mutate(() => setItems(items.map((x, n) => (n === i ? { ...x, timesPerYear: v } : x))))}
                    />
                    <Num
                      label="Minutes each"
                      value={it.minutesEach}
                      onChange={(v) => mutate(() => setItems(items.map((x, n) => (n === i ? { ...x, minutesEach: v } : x))))}
                    />
                    <label className="block col-span-2 sm:col-span-1">
                      <span className="block text-[11px] uppercase tracking-wider text-[var(--text-subtle)]">Note (optional)</span>
                      <input
                        value={it.label}
                        onChange={(e) => mutate(() => setItems(items.map((x, n) => (n === i ? { ...x, label: e.target.value } : x))))}
                        placeholder="who, or what kind"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--nx-gold)]"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length === 0 && (
            <p className="nx-body mt-5">
              Start with the one you do most often. For most people that is the messages — and it is
              also the one they forget entirely.
            </p>
          )}
        </section>

        {/* ── 3. the number */}
        {out && (
          <section className="rounded-2xl bg-[var(--obsidian)] p-7 sm:p-9">
            <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--nx-gold-bright)]">
              Three · What it cost you
            </p>
            <p className="text-white font-black text-[2.6rem] sm:text-[4rem] leading-none tracking-tight mt-3 tabular-nums">
              {out.headline}
            </p>
            <p className="text-[#C8C2B4] text-[1.02rem] mt-4 max-w-2xl leading-relaxed">{out.body}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-7 pt-6 border-t border-white/10">
              <Fig n={`${Math.round(result.totalHours)}`} l="hours a year" dark />
              <Fig n={`${result.weeks.toFixed(1)}`} l="working weeks" dark />
              <Fig n={rands(rate ?? 0)} l="per hour" dark gold />
            </div>

            <p className="text-[#8F887A] text-xs mt-6 leading-relaxed max-w-2xl">
              Hours include the preparation and follow-up each kind of work actually carries — the
              travel to the talk, the thinking before the call, the email after. That is time you
              spent whether or not anyone counted it.
            </p>
          </section>
        )}

        {/* ── 4. the fix */}
        {result.items.length > 0 && rate && (
          <section className="nx-card !p-6">
            <p className="nx-label">Four · What to say instead</p>
            <h2 className="text-2xl mt-1">Your biggest leaks, in order.</h2>
            <p className="nx-body mt-2">
              You are not going to stop being generous, and you should not. The change is that
              generosity gets a shape — a number, or a boundary, or a paid version.
            </p>

            <div className="mt-5 space-y-4">
              {result.items.slice(0, 5).map((r, i) => (
                <div key={r.item.id} className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap bg-[var(--bg-surface)] px-4 py-3">
                    <span className="text-sm font-bold text-[var(--text-body)]">
                      <span className="font-mono text-[var(--nx-gold-text)] mr-2">{String(i + 1).padStart(2, "0")}</span>
                      {r.spec.label}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-[var(--text-body)]">
                      {rands(r.value)}<span className="text-[var(--text-subtle)]"> / year</span>
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[var(--text-subtle)]">
                      {Math.round(r.trueHours)} hours · a firm would bill this as {r.spec.billedAs.toLowerCase()}
                    </p>
                    <div className="mt-3 rounded-lg border-l-[3px] border-[var(--nx-gold)] bg-[var(--bg-surface)] px-4 py-3">
                      <span className="nx-label">Say this</span>
                      <p className="text-[15px] text-[var(--text-body)] mt-1 leading-relaxed">{r.spec.script}</p>
                      <button
                        onClick={() => copyScript(r.spec.script)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--nx-gold-text)] hover:underline"
                      >
                        <Copy className="size-3.5" /> Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)] hover:text-foreground"
              >
                <Printer className="size-4" /> Print this
              </button>
            </div>
          </section>
        )}

        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 sm:p-8 text-center">
          <h2 className="text-2xl">Now put a price on the thing you keep giving away.</h2>
          <p className="nx-body mt-2 max-w-lg mx-auto">
            The biggest leak above is not a problem. It is your first product — you already know
            there is demand, because people keep asking for it.
          </p>
          <Link
            to="/apps/offer-blueprint"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--obsidian)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            Build the offer <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </Shell>
  );
}

function SaveState({ state }: { state: "idle" | "saving" | "saved" }) {
  if (state === "saving") return <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-subtle)]"><Cloud className="size-3.5" /> Saving</span>;
  if (state === "saved") return <span className="inline-flex items-center gap-1.5 text-xs text-[#2A6B4C]"><Check className="size-3.5" /> Saved to your account</span>;
  return null;
}

function Tab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
        on ? "bg-[var(--obsidian)] text-white border-transparent" : "border-[var(--border)] text-[var(--text-dim)] hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Fig({ n, l, gold, dark }: { n: string; l: string; gold?: boolean; dark?: boolean }) {
  return (
    <div>
      <span className={`block font-display text-2xl tabular-nums ${gold ? "text-[var(--nx-gold-text)]" : dark ? "text-white" : "text-[var(--text-body)]"}`}>
        {n}
      </span>
      <span className={`block text-xs leading-tight mt-0.5 ${dark ? "text-[#8F887A]" : "text-[var(--text-subtle)]"}`}>{l}</span>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-[var(--text-subtle)]">{label}</span>
      <input
        type="number" min={0} inputMode="numeric"
        value={value || ""}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm tabular-nums outline-none focus:border-[var(--nx-gold)]"
      />
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
