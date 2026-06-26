import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { Lock, Flame, Check, Clock, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/consistency-blueprint")({
  head: () => ({ meta: [{ title: "The 30-Day Consistency Blueprint — CHKPLT" }] }),
  component: ConsistencyBlueprint,
});

const KEY = "cb-app-v1";

type Item = { n: number; title: string; text: string; danger?: boolean; milestone?: boolean };
const PROGRAM: Item[] = (() => {
  const base: Omit<Item, "n">[] = [
    { title: "Lock your time", text: "Set the recurring alarm. Tell one person." },
    { title: "Friction audit", text: "Write the 3 things that stop you on tired days." },
    { title: "Kill the friction", text: "Set your space up permanently." },
    { title: "Outage plan", text: "Pick your one fallback for power-cut days." },
    { title: "First minimum session", text: "30 min: one hook, one outline, one record. Post." },
    { title: "Minimum session", text: "Same slot. Same floor." },
    { title: "Week review", text: "Did you create 5+ days? Note what got in the way." },
    { title: "Choose accountability", text: "A person, a group, or a public tracker." },
    { title: "Tell them", text: "Share your Lock Time and floor. Ask for a weekly check-in." },
    { title: "Minimum session", text: "Send your partner today's piece." },
    { title: "Minimum session", text: "Stay on the slot." },
    { title: "The danger day", text: "Do the 30 minutes anyway. Even rough. Post it.", danger: true },
    { title: "Minimum session", text: "Notice: the streak survived Day 12." },
    { title: "Week review", text: "How many pieces? What performed? No judgement." },
    { title: "Start your evidence log", text: "Today: one win, however small." },
    { title: "Read yesterday's win first", text: "Then create." },
    { title: "Minimum session", text: "Log one win." },
    { title: "Minimum session", text: "Log one win." },
    { title: "Minimum session", text: "Log one win." },
    { title: "Minimum session", text: "Log one win." },
    { title: "Week review", text: "Read your whole evidence log back. See the chain." },
  ];
  const arr: Item[] = base.map((b, i) => ({ n: i + 1, ...b }));
  for (let n = 22; n <= 29; n++) arr.push({ n, title: "Run the full loop", text: "Lock → yesterday's win → 30-min minimum → log evidence." });
  arr.push({ n: 30, title: "Day 30", text: "Count your 30 days. Now set your next 30.", milestone: true });
  return arr;
})();

const phaseOf = (n: number) => (n <= 7 ? 1 : n <= 14 ? 2 : n <= 21 ? 3 : 4);
const PHASE_NAMES: Record<number, string> = {
  1: "Phase 1 · Install · L · E · G", 2: "Phase 2 · Account · +A", 3: "Phase 3 · Evidence · +C · Y", 4: "Phase 4 · Full system, autopilot",
};
const PHASE_META = [
  { p: 1, name: "Install the routine", range: "1–7", install: "L · E · G", feels: "Showing up, small and steady. Foundation only." },
  { p: 2, name: "Add accountability", range: "8–14", install: "+ A", feels: "Being seen — and walking through Day 12 instead of stopping there." },
  { p: 3, name: "Build the evidence", range: "15–21", install: "+ C · Y", feels: "Proof stacking, momentum building. Start every session from a win." },
  { p: 4, name: "Full system running", range: "22–30", install: "All six", feels: "Everything installed. Run the loop and prove it works without willpower." },
];
const REFL: Record<number, string> = {
  1: "Which day felt hardest — and which friction point caused it?",
  2: "You got past Day 12. What made the difference this time?",
  3: "Reading the log back — what surprised you about your own progress?",
};

type DayRec = { done: boolean; win: string };
type Setup = { lockTime: string; minSession: string; accountable: string; checkinDay: string; outagePlan: string; friction: string[] };
type Data = { startDate: string; setup: Setup; reflections: Record<string, string>; days: Record<number, DayRec> };

function defaults(): Data {
  const days: Record<number, DayRec> = {};
  for (let i = 1; i <= 30; i++) days[i] = { done: false, win: "" };
  return { startDate: "", setup: { lockTime: "", minSession: "", accountable: "", checkinDay: "", outagePlan: "", friction: ["", "", ""] }, reflections: { p1: "", p2: "", p3: "" }, days };
}
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

type Tab = "today" | "system" | "program" | "tracker" | "about";

function ConsistencyBlueprint() {
  const { access, loading } = useKitAccess();
  const [tab, setTab] = useState<Tab>("today");
  const [data, setData] = useState<Data>(defaults);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw) {
        const d = defaults();
        setData({
          startDate: raw.startDate || "",
          setup: { ...d.setup, ...(raw.setup || {}), friction: (raw.setup && raw.setup.friction) || d.setup.friction },
          reflections: { ...d.reflections, ...(raw.reflections || {}) },
          days: { ...d.days, ...(raw.days || {}) },
        });
      }
    } catch { /* ignore */ }
  }, []);

  const mutate = (fn: (d: Data) => void) => {
    setData((s) => {
      const d: Data = JSON.parse(JSON.stringify(s));
      fn(d);
      try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ }
      return d;
    });
  };

  const m = useMemo(() => {
    const started = !!data.startDate;
    let raw = 0;
    if (started) raw = Math.floor((startOfDay(new Date()) - startOfDay(new Date(data.startDate + "T00:00:00"))) / 86400000) + 1;
    const currentDay = started ? Math.min(Math.max(raw, 1), 30) : 0;

    let doneCount = 0;
    for (let i = 1; i <= 30; i++) if (data.days[i]?.done) doneCount++;

    let streak = 0, from = currentDay;
    if (from && !data.days[from]?.done) from -= 1;
    for (let n = from; n >= 1; n--) { if (data.days[n]?.done) streak++; else break; }

    let longestStreak = 0, run = 0, winsLogged = 0;
    for (let n = 1; n <= 30; n++) {
      if (data.days[n]?.done) { run++; if (run > longestStreak) longestStreak = run; } else run = 0;
      if (data.days[n]?.win?.trim()) winsLogged++;
    }
    const reportPct = Math.round((doneCount / 30) * 100);

    let vTitle: string, vText: string;
    if (!started) { vTitle = "Not started yet"; vText = "Set your lock time on The System tab, then press Start Day 1. The system does the rest."; }
    else if (doneCount >= 30) { vTitle = "You finished. You're a finisher."; vText = "Thirty days, done. You kept your word to yourself for a full month — that identity is the real prize. Now set your next 30."; }
    else if (doneCount >= 24) { vTitle = "The system is running."; vText = "You built the habit — showing up without willpower doing the heavy lifting. Close out the last few days and claim the full streak."; }
    else if (doneCount >= 15) { vTitle = "You're past the graveyard."; vText = "You cleared the two-week mark where most creators quit. Keep stacking one minimum session at a time and the chain holds."; }
    else if (doneCount >= 1) { vTitle = "The chain is alive — protect it."; vText = "Starting is the part most never do. Don't aim for perfect — aim for your worst-day floor, every day. Watch for Day 12."; }
    else { vTitle = "Set your time and begin."; vText = "You've set up, but no day is ticked yet. One 30-minute session today turns this from a plan into a streak."; }

    let yesterdayWin = "";
    for (let n = currentDay - 1; n >= 1; n--) { if (data.days[n]?.win) { yesterdayWin = data.days[n].win; break; } }

    const todayItem = currentDay ? PROGRAM[currentDay - 1] : null;
    const todayDone = !!(currentDay && data.days[currentDay]?.done);
    const evidence = PROGRAM.filter((p) => data.days[p.n]?.win).map((p) => ({ n: p.n, win: data.days[p.n].win }));

    return { started, currentDay, doneCount, streak, longestStreak, winsLogged, reportPct, vTitle, vText, yesterdayWin, todayItem, todayDone, evidence };
  }, [data]);

  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className="nx-card !p-10 text-center">
          <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
          <h2 className="mt-4 text-2xl">The Consistency Blueprint is in the Foundation Kit.</h2>
          <p className="nx-body max-w-md mx-auto mt-2">Build the habit that actually sticks — 30 days, no motivation required. Get the kit to unlock it.</p>
          <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit — $97</a>
        </div>
      </main>
    </Shell>
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: "today", label: "Today" }, { id: "system", label: "The System" },
    { id: "program", label: "30-Day Program" }, { id: "tracker", label: "Tracker" }, { id: "about", label: "About" },
  ];
  const sf = (k: keyof Setup) => (e: React.ChangeEvent<HTMLInputElement>) => { const v = e.target.value; mutate((d) => { (d.setup[k] as string) = v; }); };
  const inputCls = "w-full rounded-xl border border-[var(--input)] bg-white px-4 py-2.5 text-[15px] outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30";

  return (
    <Shell>
      <section className="border-b border-border bg-[#0F172A]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="nx-label !text-[var(--nx-gold-bright)]">30-Day Consistency Blueprint</p>
            <p className="text-slate-300 text-sm mt-0.5">{m.started ? `Day ${m.currentDay} · ${m.doneCount}/30 done` : "Not started"}</p>
          </div>
          {m.started && <div className="flex items-center gap-1.5 text-[var(--nx-gold-bright)] font-display text-lg"><Flame className="size-5" />{m.streak}</div>}
        </div>
      </section>

      <div className="border-b border-border bg-[var(--bg-surface)] sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-2 sm:px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-[var(--nx-gold)] text-[var(--nx-gold-text)]" : "border-transparent text-[var(--text-dim)] hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <a href="/dashboard/foundation-kit" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Back to Foundation Kit</a>

        {/* TODAY */}
        {tab === "today" && (
          <div className="mt-5">
            {!m.started ? (
              <div className="nx-card !p-8 text-center">
                <CalendarDays className="size-9 text-[var(--nx-gold-deep)] mx-auto" />
                <h1 className="mt-3 text-3xl">Start today, not Monday.</h1>
                <p className="nx-body max-w-md mx-auto mt-2">Set your two anchors on <strong>The System</strong> tab, then press start. The system runs the rest — no motivation required.</p>
                <button onClick={() => mutate((d) => { d.startDate = new Date().toISOString().slice(0, 10); })} className="cta-glow inline-block mt-6">Start Day 1 →</button>
              </div>
            ) : (
              <>
                <p className="nx-label">{PHASE_NAMES[phaseOf(m.currentDay)]}</p>
                <h1 className="mt-2 text-3xl">Day {m.currentDay} of 30</h1>
                <div className="grid sm:grid-cols-3 gap-3 mt-5">
                  <div className="nx-card !p-4"><div className="flex items-center gap-2 text-[var(--text-dim)] text-xs"><Flame className="size-4" /> Streak</div><div className="font-display text-2xl mt-1">{m.streak} days</div></div>
                  <div className="nx-card !p-4"><div className="flex items-center gap-2 text-[var(--text-dim)] text-xs"><Clock className="size-4" /> Lock time</div><div className="font-display text-lg mt-1">{data.setup.lockTime || "—"}</div></div>
                  <div className="nx-card !p-4"><div className="text-[var(--text-dim)] text-xs">Your minimum</div><div className="font-display text-lg mt-1">{data.setup.minSession || "—"}</div></div>
                </div>

                {m.yesterdayWin && (
                  <div className="mt-4 rounded-xl border-l-4 border-[var(--nx-gold)] bg-[var(--bg-surface)] px-4 py-3">
                    <span className="text-xs font-bold text-[var(--nx-gold-text)] uppercase tracking-wide">Yesterday's win</span>
                    <p className="text-sm text-[var(--text-body)] mt-0.5">{m.yesterdayWin}</p>
                  </div>
                )}

                <div className={`mt-4 rounded-2xl p-6 ${m.todayItem?.danger ? "bg-[#3a1d14] text-white" : "bg-[#0F172A] text-white"}`}>
                  <span className="nx-label !text-[var(--nx-gold-bright)]">Today's focus</span>
                  <h2 className="text-white text-2xl mt-1">{m.todayItem?.title}</h2>
                  <p className="text-slate-300 mt-1">{m.todayItem?.text}</p>
                  {m.todayItem?.danger && <p className="text-[var(--nx-gold-bright)] text-sm mt-3">Day 12 is the graveyard. Most streaks die here. Do the 30 minutes anyway — even rough. Posting today is the whole game.</p>}
                </div>

                <label className="block mt-4 text-sm font-semibold">Log today's evidence (one win)</label>
                <input value={data.days[m.currentDay]?.win || ""} onChange={(e) => { const v = e.target.value; mutate((d) => { d.days[m.currentDay].win = v; }); }} placeholder="What did you create / post / ship today?" className={inputCls + " mt-1"} />

                <button onClick={() => mutate((d) => { d.days[m.currentDay].done = !d.days[m.currentDay].done; })}
                  className={`w-full mt-3 rounded-xl py-3.5 font-bold transition-colors ${m.todayDone ? "bg-[var(--bg-card-hi)] text-[var(--nx-gold-text)] border border-[var(--nx-gold)]" : "cta-glow"}`}>
                  {m.todayDone ? `✓ Day ${m.currentDay} complete — tap to undo` : `Mark Day ${m.currentDay} complete`}
                </button>
              </>
            )}
          </div>
        )}

        {/* THE SYSTEM */}
        {tab === "system" && (
          <div className="mt-5 space-y-5">
            <div>
              <h1 className="text-3xl">The LEGACY Execute system</h1>
              <p className="nx-body mt-2">Six small systems. Each one removes a reason you stop. Set it up once — it saves automatically and feeds your Today dashboard.</p>
            </div>
            <Comp letter="L" title="Lock the time" desc="A fixed slot you decide once and never debate again. “When I have time” is a way of saying never.">
              <input value={data.setup.lockTime} onChange={sf("lockTime")} placeholder="e.g. 20:30 every weekday" className={inputCls} />
            </Comp>
            <Comp letter="E" title="Eliminate friction" desc="Name your top 3 friction points and kill each one in advance — including your power-cut fallback.">
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <input key={i} value={data.setup.friction[i] || ""} onChange={(e) => { const v = e.target.value; mutate((d) => { d.setup.friction[i] = v; }); }}
                    placeholder={["Friction point one (e.g. tripod in the cupboard)", "Friction point two (e.g. hooks not written)", "Friction point three"][i]} className={inputCls} />
                ))}
                <input value={data.setup.outagePlan} onChange={sf("outagePlan")} placeholder="Power-cut fallback (e.g. write captions on phone, battery pack)" className={inputCls} />
              </div>
            </Comp>
            <Comp letter="G" title="Go minimum" desc="The smallest thing you can create on your worst day. A kept chain beats a perfect post you never made.">
              <input value={data.setup.minSession} onChange={sf("minSession")} placeholder="e.g. one 30-min phone video, posted" className={inputCls} />
            </Comp>
            <Comp letter="A" title="Account to someone" desc="One weekly check, ten minutes, no judgement. People keep promises they make out loud.">
              <div className="grid sm:grid-cols-2 gap-2">
                <input value={data.setup.accountable} onChange={sf("accountable")} placeholder="Who holds you accountable?" className={inputCls} />
                <input value={data.setup.checkinDay} onChange={sf("checkinDay")} placeholder="Weekly check-in day (e.g. Sunday)" className={inputCls} />
              </div>
            </Comp>
            <Comp letter="C" title="Celebrate evidence" desc="Log one win a day in the Tracker. On the day you want to quit, you read it back.">
              <p className="text-sm text-[var(--text-dim)]">Use the <strong>Today</strong> tab to log each day's win — they stack into your evidence log.</p>
            </Comp>
            <Comp letter="Y" title="Yesterday's win" desc="Each session opens with yesterday's win — surfaced for you on the Today screen so you start from proof, not a blank page.">
              <p className="text-sm text-[var(--text-dim)]">Automatic. Log wins and they appear at the top of Today.</p>
            </Comp>
            <button onClick={() => { if (confirm("Reset all progress and entries? This cannot be undone.")) { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setData(defaults()); setTab("today"); } }}
              className="text-sm text-[var(--nx-orange-deep)] hover:underline">Reset all progress</button>
          </div>
        )}

        {/* 30-DAY PROGRAM */}
        {tab === "program" && (
          <div className="mt-5 space-y-8">
            <div><h1 className="text-3xl">The 30-day program</h1><p className="nx-body mt-2">Four phases. Tick each day as you do it; the same tick shows on your Tracker and Today.</p></div>
            {PHASE_META.map((ph) => (
              <div key={ph.p}>
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <h2 className="text-xl">Phase {ph.p} · {ph.name}</h2>
                  <span className="text-xs font-mono text-[var(--text-subtle)]">Days {ph.range} · install {ph.install}</span>
                </div>
                <p className="text-sm text-[var(--text-dim)] mt-0.5 mb-3">{ph.feels}</p>
                <div className="space-y-2">
                  {PROGRAM.filter((p) => phaseOf(p.n) === ph.p).map((p) => {
                    const done = !!data.days[p.n]?.done;
                    const cur = p.n === m.currentDay;
                    return (
                      <button key={p.n} onClick={() => mutate((d) => { d.days[p.n].done = !d.days[p.n].done; })}
                        className={`flex items-center gap-3 w-full text-left rounded-xl border px-4 py-3 ${cur ? "border-[var(--nx-gold)] bg-[var(--bg-card-hi)]" : "border-[var(--border)] bg-white"}`}>
                        <span className={`size-6 rounded-md shrink-0 inline-flex items-center justify-center ${done ? "bg-[#15803D] text-white" : "border-2 border-[var(--input)]"}`}>{done && <Check className="size-4" />}</span>
                        <span className="shrink-0 font-display text-sm w-10" style={{ color: p.danger ? "var(--nx-orange-deep)" : "var(--nx-gold-deep)" }}>Day {p.n}</span>
                        <span className="flex-1 min-w-0"><span className="font-medium text-sm">{p.title}</span> <span className="text-sm text-[var(--text-dim)]">— {p.text}</span></span>
                      </button>
                    );
                  })}
                </div>
                {ph.p <= 3 && (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-[var(--text-dim)]">{REFL[ph.p]}</label>
                    <textarea value={data.reflections["p" + ph.p] || ""} onChange={(e) => { const v = e.target.value; mutate((d) => { d.reflections["p" + ph.p] = v; }); }} rows={2} className={inputCls + " mt-1 resize-none"} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TRACKER */}
        {tab === "tracker" && (
          <div className="mt-5">
            <h1 className="text-3xl">Your 30-day tracker</h1>
            <p className="nx-body mt-2 mb-5">Tick the day, log the win. The chain is the proof — on the day you want to quit, read it back.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {PROGRAM.map((p) => {
                const done = !!data.days[p.n]?.done;
                const cur = p.n === m.currentDay;
                return (
                  <div key={p.n} className={`rounded-xl border p-3 ${cur ? "border-[var(--nx-gold)] ring-2 ring-[var(--nx-gold)]/25" : "border-[var(--border)]"} ${done ? "bg-[var(--bg-card-hi)]" : "bg-white"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm" style={{ color: p.danger ? "var(--nx-orange-deep)" : "var(--nx-gold-deep)" }}>Day {p.n}</span>
                      <button onClick={() => mutate((d) => { d.days[p.n].done = !d.days[p.n].done; })}
                        className={`size-5 rounded-md inline-flex items-center justify-center ${done ? "bg-[#15803D] text-white" : "border-[1.6px] border-[var(--nx-gold)]"}`}>{done ? <Check className="size-3.5" /> : (p.danger ? <span className="text-[var(--nx-orange-deep)] text-xs font-bold">!</span> : null)}</button>
                    </div>
                    <input value={data.days[p.n]?.win || ""} onChange={(e) => { const v = e.target.value; mutate((d) => { d.days[p.n].win = v; }); }} placeholder="win…"
                      className="w-full mt-2 bg-transparent border-b border-[var(--border)] text-xs py-1 outline-none focus:border-[var(--nx-gold)]" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABOUT / REPORT */}
        {tab === "about" && (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl bg-[#0F172A] p-6 sm:p-8 text-white text-center">
              <div className="font-display text-5xl text-[var(--nx-gold-bright)]">{m.reportPct}%</div>
              <p className="nx-label !text-[var(--nx-gold-bright)] mt-1">30 days complete</p>
              <h2 className="text-white text-2xl mt-3">{m.vTitle}</h2>
              <p className="text-slate-300 mt-2 max-w-lg mx-auto">{m.vText}</p>
              <div className="grid grid-cols-3 gap-3 mt-6 text-left">
                <div className="rounded-lg bg-white/5 p-3"><div className="text-[11px] uppercase tracking-wide text-slate-400">Done</div><div className="font-display text-xl">{m.doneCount}/30</div></div>
                <div className="rounded-lg bg-white/5 p-3"><div className="text-[11px] uppercase tracking-wide text-slate-400">Longest streak</div><div className="font-display text-xl">{m.longestStreak}</div></div>
                <div className="rounded-lg bg-white/5 p-3"><div className="text-[11px] uppercase tracking-wide text-slate-400">Wins logged</div><div className="font-display text-xl">{m.winsLogged}</div></div>
              </div>
            </div>

            {m.evidence.length > 0 && (
              <div className="nx-card !p-5">
                <h3 className="font-display text-lg">Your evidence log</h3>
                <p className="text-xs text-[var(--text-dim)] mt-0.5 mb-3">The chain, in your own words.</p>
                <ul className="space-y-2">
                  {m.evidence.map((e) => (
                    <li key={e.n} className="flex gap-3 text-sm"><span className="font-display text-[var(--nx-gold-deep)] shrink-0 w-12">Day {e.n}</span><span className="text-[var(--text-body)]">{e.win}</span></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-r-xl border-l-4 border-[var(--nx-gold)] bg-[var(--bg-surface)] px-6 py-5">
              <p className="font-display text-lg leading-snug">"Be fruitful. That means produce. You can't be shy and broke."</p>
              <p className="text-sm text-[var(--text-body)] mt-2">Consistency isn't motivation — it's a system that removes every reason you stop. Install the six, protect the chain, and let the evidence do the convincing.</p>
            </div>
          </div>
        )}
      </main>
    </Shell>
  );
}

function Comp({ letter, title, desc, children }: { letter: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="nx-card !p-5">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)] font-display text-lg">{letter}</span>
        <div className="flex-1">
          <div className="font-display text-lg">{title}</div>
          <p className="text-sm text-[var(--text-dim)] mt-0.5 mb-3">{desc}</p>
          {children}
        </div>
      </div>
    </div>
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
