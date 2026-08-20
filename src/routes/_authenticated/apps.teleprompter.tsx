import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { Lock, Play, Pause, RotateCcw, FlipHorizontal, Maximize2, Minus, Plus, Wind } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/teleprompter")({
  head: () => ({ meta: [{ title: "Teleprompter — Contentpreneur Africa" }] }),
  component: Teleprompter,
});

// TOOL · THE TELEPROMPTER
//
// Ported from the content system. It removes the last excuse for not recording:
// they read instead of remembering. No AI, no founder coupling, nothing to
// configure before it works — which is why this was the first thing worth
// bringing across.
//
// Scroll speed is derived from words per minute rather than exposed as an
// abstract "speed 1-10". A buyer knows they talk at about 130 wpm; nobody knows
// what "speed 4" means, and getting it wrong is what makes people abandon a
// prompter and go back to memorising.

const KEY = "nochill-teleprompter-v1";

interface Saved {
  script: string;
  wpm: number;
  fontSize: number;
  mirrored: boolean;
  lineHeight: number;
  breaths: boolean;
  focusLine: boolean;
}

const DEFAULTS: Saved = {
  script: "",
  wpm: 130,
  fontSize: 44,
  mirrored: false,
  lineHeight: 1.7,
  breaths: false,
  focusLine: true,
};

const PRESETS = [
  { label: "Measured", wpm: 110, note: "Teaching a framework" },
  { label: "Natural", wpm: 130, note: "How most people speak" },
  { label: "Urgent", wpm: 155, note: "Hooks and short-form" },
];

function Teleprompter() {
  const { access } = useKitAccess();
  const [s, setS] = useState<Saved>(DEFAULTS);
  const [playing, setPlaying] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number>(0);
  const offset = useRef<number>(0);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r) setS({ ...DEFAULTS, ...r });
    } catch { /* ignore */ }
  }, []);

  const save = useCallback((next: Saved) => {
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const words = useMemo(
    () => s.script.trim().split(/\s+/).filter(Boolean).length,
    [s.script],
  );
  const runtime = useMemo(() => (words ? words / s.wpm : 0), [words, s.wpm]);

  // Pixels per second, derived from the real geometry: total scrollable height
  // over the time the script should take at this speaking rate. That keeps the
  // scroll honest at any font size, which a fixed px/s value never does.
  const pxPerSec = useCallback(() => {
    const el = scrollRef.current;
    if (!el || runtime <= 0) return 0;
    const distance = el.scrollHeight - el.clientHeight;
    return distance > 0 ? distance / (runtime * 60) : 0;
  }, [runtime]);

  const tick = useCallback((ts: number) => {
    const el = scrollRef.current;
    if (!el) return;
    if (!lastTs.current) lastTs.current = ts;
    const dt = (ts - lastTs.current) / 1000;
    lastTs.current = ts;
    offset.current += pxPerSec() * dt;
    el.scrollTop = offset.current;
    setElapsed((e) => e + dt);
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
      setPlaying(false);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [pxPerSec]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTs.current = 0;
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, tick]);

  // Countdown before the scroll starts — the gap between pressing record and
  // the first word is where most takes are lost.
  useEffect(() => {
    if (count == null) return;
    if (count === 0) { setCount(null); setPlaying(true); return; }
    const t = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const reset = () => {
    setPlaying(false);
    setElapsed(0);
    offset.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const goFullscreen = () => {
    const el = document.getElementById("prompter-stage");
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  // Space to start/stop is the one shortcut that matters — the phone is
  // usually propped up and the laptop is what's in reach.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.code === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key === "r" || e.key === "R") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rendered = useMemo(() => {
    if (!s.breaths) return s.script;
    // A breath marker after every sentence. Reading without breathing is the
    // single most common reason a take sounds rushed.
    return s.script.replace(/([.!?])(\s+)/g, "$1  •  ");
  }, [s.script, s.breaths]);

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">The Teleprompter is part of the Foundation Kit.</h2>
            <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-10 pb-7">
          <Link to="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">
            ← Your Clarity System
          </Link>
          <p className="nx-label mt-4">Tool · the last excuse removed</p>
          <h1 className="mt-2">You do not have to remember it. You have to read it.</h1>
          <p className="nx-body max-w-xl mt-3">
            Paste the script, set how fast you actually talk, and press record. Nobody watching can
            tell. Everybody on television is reading.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-9 space-y-5">
        {/* the stage */}
        <div
          id="prompter-stage"
          className="relative rounded-2xl bg-[#0A0A0A] overflow-hidden border border-[var(--border)]"
        >
          {s.focusLine && (
            <div className="pointer-events-none absolute left-0 right-0 top-[38%] z-10 flex items-center gap-2 px-4">
              <span className="h-px flex-1 bg-[var(--nx-gold)]/40" />
              <span className="h-2 w-2 rotate-45 bg-[var(--nx-gold)]" />
              <span className="h-px flex-1 bg-[var(--nx-gold)]/40" />
            </div>
          )}

          {count != null && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85">
              <span className="font-display text-8xl text-[var(--nx-gold-bright)] tabular-nums">{count}</span>
            </div>
          )}

          <div
            ref={scrollRef}
            className="h-[46vh] min-h-[280px] overflow-y-auto px-6 sm:px-12 py-[19vh] scrollbar-none"
            style={{ scrollBehavior: "auto" }}
          >
            <p
              className="whitespace-pre-wrap text-white font-semibold"
              style={{
                fontSize: `${s.fontSize}px`,
                lineHeight: s.lineHeight,
                transform: s.mirrored ? "scaleX(-1)" : undefined,
              }}
            >
              {rendered || "Your script appears here. Paste it below."}
            </p>
          </div>

          {/* transport */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/60 px-4 py-3">
            <button
              onClick={() => (playing ? setPlaying(false) : setCount(3))}
              disabled={!s.script.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-5 py-2 text-sm font-bold text-[#111] disabled:opacity-40 hover:bg-[var(--nx-gold-deep)] transition-colors"
            >
              {playing ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
            </button>
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white">
              <RotateCcw className="size-4" /> Reset
            </button>
            <button
              onClick={() => save({ ...s, mirrored: !s.mirrored })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                s.mirrored ? "border-[var(--nx-gold)] text-[var(--nx-gold-bright)]" : "border-white/20 text-white/80 hover:text-white"
              }`}
              title="For a glass teleprompter rig"
            >
              <FlipHorizontal className="size-4" /> Mirror
            </button>
            <button onClick={goFullscreen} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white">
              <Maximize2 className="size-4" /> Full screen
            </button>
            <span className="ml-auto font-mono text-xs text-white/50 tabular-nums">
              {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, "0")}
              {runtime > 0 && <> / {Math.floor(runtime)}:{String(Math.round((runtime % 1) * 60)).padStart(2, "0")}</>}
            </span>
          </div>
        </div>

        <p className="text-xs text-[var(--text-subtle)] text-center">
          Space starts and stops. R resets.
        </p>

        {/* speed */}
        <div className="nx-card !p-5">
          <p className="nx-label">How fast do you actually talk?</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => save({ ...s, wpm: p.wpm })}
                className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                  s.wpm === p.wpm
                    ? "border-[var(--nx-gold)] bg-[var(--bg-surface)]"
                    : "border-[var(--border)] hover:bg-[var(--bg-surface)]"
                }`}
              >
                <span className="block text-sm font-bold">{p.label}</span>
                <span className="block text-xs text-[var(--text-subtle)]">{p.wpm} wpm · {p.note}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <input
              type="range" min={80} max={200} step={5}
              value={s.wpm}
              onChange={(e) => save({ ...s, wpm: Number(e.target.value) })}
              className="flex-1 accent-[var(--nx-gold)]"
            />
            <span className="font-mono text-sm tabular-nums w-20 text-right">{s.wpm} wpm</span>
          </div>
          {words > 0 && (
            <p className="nx-body mt-3">
              <strong>{words} words</strong> — about{" "}
              <strong>{Math.floor(runtime)}m {String(Math.round((runtime % 1) * 60)).padStart(2, "0")}s</strong> at this pace.
              {runtime > 1.5 && (
                <span className="text-[var(--text-dim)]"> That is long for short-form. Cut to the one idea.</span>
              )}
            </p>
          )}
        </div>

        {/* readability */}
        <div className="nx-card !p-5">
          <p className="nx-label">Readability</p>
          <div className="grid gap-4 sm:grid-cols-2 mt-3">
            <Stepper
              label="Text size"
              value={`${s.fontSize}px`}
              onDown={() => save({ ...s, fontSize: Math.max(24, s.fontSize - 4) })}
              onUp={() => save({ ...s, fontSize: Math.min(96, s.fontSize + 4) })}
            />
            <Stepper
              label="Line spacing"
              value={s.lineHeight.toFixed(1)}
              onDown={() => save({ ...s, lineHeight: Math.max(1.2, +(s.lineHeight - 0.1).toFixed(1) ) })}
              onUp={() => save({ ...s, lineHeight: Math.min(2.6, +(s.lineHeight + 0.1).toFixed(1) ) })}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Toggle on={s.focusLine} onClick={() => save({ ...s, focusLine: !s.focusLine })} label="Focus line" />
            <Toggle on={s.breaths} onClick={() => save({ ...s, breaths: !s.breaths })} label="Breath markers" icon={<Wind className="size-3.5" />} />
          </div>
          {s.breaths && (
            <p className="text-xs text-[var(--text-subtle)] mt-3">
              A dot after every sentence. Take the breath — reading without breathing is why most
              first takes sound rushed.
            </p>
          )}
        </div>

        {/* script */}
        <div className="nx-card !p-5">
          <p className="nx-label">The script</p>
          <textarea
            value={s.script}
            onChange={(e) => save({ ...s, script: e.target.value })}
            rows={8}
            placeholder="Paste your script here. One idea per line reads better than a paragraph."
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm outline-none focus:border-[var(--nx-gold)]"
          />
          <p className="text-xs text-[var(--text-subtle)] mt-2">
            Saved to your workspace — it will be here on your phone too.
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
          <h2 className="text-white text-2xl">Record it badly, once.</h2>
          <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg mx-auto">
            The first one is not content. It is proof the button works. Delete it afterwards if you
            want — the point was pressing record.
          </p>
        </div>
      </main>
    </Shell>
  );
}

function Stepper({ label, value, onDown, onUp }: { label: string; value: string; onDown: () => void; onUp: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
      <span className="text-sm text-[var(--text-dim)]">{label}</span>
      <span className="flex items-center gap-2">
        <button onClick={onDown} className="rounded-md border border-[var(--border)] p-1 hover:bg-[var(--bg-surface)]"><Minus className="size-3.5" /></button>
        <span className="font-mono text-sm tabular-nums w-12 text-center">{value}</span>
        <button onClick={onUp} className="rounded-md border border-[var(--border)] p-1 hover:bg-[var(--bg-surface)]"><Plus className="size-3.5" /></button>
      </span>
    </div>
  );
}

function Toggle({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        on ? "border-[var(--nx-gold)] bg-[var(--bg-surface)] text-foreground" : "border-[var(--border)] text-[var(--text-dim)] hover:text-foreground"
      }`}
    >
      {icon}{label}
    </button>
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
