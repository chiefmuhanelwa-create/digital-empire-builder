// CONTENT OS — pure, client-safe, no AI.
//
// The difference between this and a template: a template ships empty and stays
// static. This ships with the measured defaults, then checks them against the
// user's own posted results and tells them when their data disagrees.
//
// That matters because the defaults below are measured on ONE account. Shipping
// one creator's numbers to every creator as law is the exact failure this
// product exists to correct. So every default carries its own evidence line,
// and the moment a user has enough of their own rows, theirs wins.

export const PILLARS = [
  { key: "KEEP IT", share: 30, leak: "After you earn it — no reserve, SARS" },
  { key: "PRICE IT", share: 25, leak: "Before you earn it — you undercharged" },
  { key: "OWN IT", share: 20, leak: "With the channel — the account ends" },
  { key: "BUILD IT ANYWAY", share: 15, leak: "The condition it all happens under" },
  { key: "PROVE IT", share: 10, leak: "Because you can't show it — no receipts" },
] as const;

/** On-screen hook shapes, with the reach each produced on the source account.
 *  These are STARTING values. `shapeVerdicts()` replaces them per user. */
export const HOOK_SHAPES = [
  { key: "institution_quote", label: "Institution quote", baseline: 29000,
    note: "Their letter or notice, in its own words. 5.3× the same event narrated." },
  { key: "command_noun", label: "Command + concrete noun", baseline: 25000,
    note: "STOP/QUIT + a thing you can hold. With a category noun instead: 2,388." },
  { key: "second_person", label: "Second-person accusation", baseline: 22800,
    note: "YOU OWE / YOU'RE PAYING. Category version: 1,676." },
  { key: "lie_exposure", label: "Lie exposure", baseline: null,
    note: "THAT'S A LIE · X DOESN'T PAY. Untested on the source account." },
  { key: "math_proof", label: "Math proof", baseline: 5461,
    note: "An exact checkable calculation. Demoted — 5,461 and 2,956." },
] as const;

export const FORMATS = ["reel", "carousel", "static", "email"] as const;
export const STATUSES = ["idea", "scripted", "recorded", "edited", "scheduled", "posted", "retired"] as const;

export type Piece = {
  id: string;
  title: string;
  pillar: string | null;
  format: string;
  status: string;
  hook: string | null;
  hook_shape: string | null;
  screen_text: string | null;
  story_ref: string | null;
  receipt_ref: string | null;
  cta_keyword: string | null;
  runtime_seconds: number | null;
  scheduled_for: string | null;
  posted_at: string | null;
  platform: string | null;
  permalink: string | null;
  reach: number | null;
  saves: number | null;
  comments: number | null;
  shares: number | null;
  completion_pct: number | null;
  notes: string | null;
  updated_at: string;
};

export type Settings = {
  pillars: string[];
  wired_keywords: string[];
  weekly_target: number;
  runtime_low: number;
  runtime_high: number;
};

export const DEFAULT_SETTINGS: Settings = {
  pillars: PILLARS.map((p) => p.key),
  wired_keywords: [],
  weekly_target: 4,
  runtime_low: 90,
  runtime_high: 105,
};

// ── Blockers — refuse to let a piece go out broken ───────────────────────────

export type Blocker = { severity: "stop" | "warn"; message: string };

/** Checked before a piece can move to `scheduled`. These are the failures that
 *  are cheap to fix now and expensive to fix after posting. */
export function pieceBlockers(p: Piece, s: Settings): Blocker[] {
  const out: Blocker[] = [];

  if (p.cta_keyword?.trim()) {
    const wired = s.wired_keywords.map((k) => k.trim().toUpperCase());
    if (!wired.includes(p.cta_keyword.trim().toUpperCase())) {
      out.push({
        severity: "stop",
        message: `"${p.cta_keyword.trim().toUpperCase()}" has no destination. A keyword that resolves to nothing converts nothing and loses the comment — 320 people have already landed nowhere. Wire it or reuse one that works.`,
      });
    }
  }

  if (p.hook?.trim() && p.screen_text?.trim()) {
    const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (norm(p.hook) === norm(p.screen_text)) {
      out.push({
        severity: "stop",
        message: "The screen and the voice say the same words. The screen states, the voice explains — the reel where they matched is the weakest of the top four.",
      });
    }
  }

  if (p.format === "reel" && p.runtime_seconds) {
    if (p.runtime_seconds < s.runtime_low)
      out.push({ severity: "warn", message: `${p.runtime_seconds}s is under the ${s.runtime_low}–${s.runtime_high}s band. Short runtimes measured lower completion, not higher.` });
    if (p.runtime_seconds > 160)
      out.push({ severity: "warn", message: `Above ~160s completion collapses under 12%.` });
  }

  if (!p.story_ref?.trim() && !p.receipt_ref?.trim())
    out.push({ severity: "warn", message: "No story and no receipt. A piece with neither is an opinion." });
  else if (p.story_ref?.trim() && !p.receipt_ref?.trim())
    out.push({ severity: "warn", message: "A confession without a receipt is a diary. Add the receipt." });
  else if (!p.story_ref?.trim() && p.receipt_ref?.trim())
    out.push({ severity: "warn", message: "A receipt without a confession is a brag. Add the story." });

  if (!p.pillar) out.push({ severity: "warn", message: "No pillar. Unassigned pieces are how a week becomes one-of-each." });

  return out;
}

// ── The learning half — the user's own results beat the defaults ─────────────

export type ShapeVerdict = {
  shape: string;
  label: string;
  n: number;
  medianReach: number | null;
  baseline: number | null;
  /** Once n >= 3, this is the user's own answer and it overrides the default. */
  ownsIt: boolean;
  note: string;
};

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

/** What is actually working FOR THIS USER. Three posts is not proof, but it is
 *  enough to stop repeating somebody else's number as if it were theirs. */
export function shapeVerdicts(pieces: Piece[]): ShapeVerdict[] {
  const posted = pieces.filter((p) => p.status === "posted" && typeof p.reach === "number");
  return HOOK_SHAPES.map((s) => {
    const mine = posted.filter((p) => p.hook_shape === s.key).map((p) => p.reach as number);
    return {
      shape: s.key,
      label: s.label,
      n: mine.length,
      medianReach: median(mine),
      baseline: s.baseline,
      ownsIt: mine.length >= 3,
      note: s.note,
    };
  }).sort((a, b) => (b.medianReach ?? b.baseline ?? 0) - (a.medianReach ?? a.baseline ?? 0));
}

export type PillarBalance = { pillar: string; target: number; actual: number; n: number };

export function pillarBalance(pieces: Piece[]): PillarBalance[] {
  const posted = pieces.filter((p) => p.status === "posted");
  const total = posted.length || 1;
  return PILLARS.map((p) => {
    const n = posted.filter((x) => x.pillar === p.key).length;
    return { pillar: p.key, target: p.share, actual: Math.round((n / total) * 100), n };
  });
}

export type Signal = { state: "ok" | "attention" | "urgent"; title: string; detail: string };

/** The return half. Every other content tool produces an artifact; this is the
 *  part that notices when nothing has been produced. */
export function contentSignals(pieces: Piece[], s: Settings, today = new Date()): Signal[] {
  const out: Signal[] = [];
  const posted = pieces.filter((p) => p.status === "posted" && p.posted_at);
  const days = (d: string) => Math.floor((today.getTime() - new Date(d).getTime()) / 86_400_000);

  const last = posted.map((p) => days(p.posted_at as string)).sort((a, b) => a - b)[0];
  if (last === undefined) {
    out.push({ state: "attention", title: "Nothing posted yet", detail: "Log one piece you have already posted. The system has nothing to compare against until you do." });
  } else if (last > 14) {
    out.push({ state: "urgent", title: `${last} days since you last posted`, detail: "Six channels in this record show one shape: a strong push, then abandonment. This is the gap where it starts." });
  } else if (last > 7) {
    out.push({ state: "attention", title: `${last} days since you last posted`, detail: `Target is ${s.weekly_target} a week.` });
  }

  const stuck = pieces.filter((p) => ["scripted", "recorded", "edited"].includes(p.status) && days(p.updated_at) > 14);
  if (stuck.length)
    out.push({ state: "attention", title: `${stuck.length} piece${stuck.length > 1 ? "s" : ""} made and never posted`, detail: "Finished work that never shipped is the most expensive thing here — 46,251 words were written and never released." });

  const unmeasured = posted.filter((p) => p.reach === null);
  if (unmeasured.length >= 3)
    out.push({ state: "attention", title: `${unmeasured.length} posted pieces have no numbers`, detail: "Without the outcome, the next piece is planned from a guess. Ten minutes of back-filling changes what this can tell you." });

  const ideas = pieces.filter((p) => p.status === "idea").length;
  if (ideas === 0)
    out.push({ state: "attention", title: "No ideas queued", detail: "The bank holds 61 failures and 55 receipts — over three thousand combinations. Running dry is a logging problem, not an ideas problem." });

  if (!s.wired_keywords.length)
    out.push({ state: "urgent", title: "No CTA keyword has a destination", detail: "Every ask you publish converts nothing until one does. This blocks scheduling." });

  if (!out.length) out.push({ state: "ok", title: "Nothing needs attention", detail: "Posted on cadence, pieces measured, ideas queued." });
  return out;
}

export function nextUp(pieces: Piece[]): Piece[] {
  const order: Record<string, number> = { scheduled: 0, edited: 1, recorded: 2, scripted: 3, idea: 4 };
  return pieces
    .filter((p) => p.status !== "posted" && p.status !== "retired")
    .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
    .slice(0, 8);
}
