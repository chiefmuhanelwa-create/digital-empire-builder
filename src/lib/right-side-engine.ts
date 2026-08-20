// THE RIGHT SIDE DIAGNOSTIC — scoring.
//
// WHAT WAS WRONG WITH IT
// ======================
// The whole algorithm was `raw = sum(answers)`. Eight questions, added up, one
// number out. That is the wrong shape twice over:
//
//   1. It treats every exposure as equally serious. Having no email list and
//      having no back-catalogue backup are not the same risk — one of them ends
//      the business and the other is an inconvenience. A sum says they cost the
//      same.
//   2. A total hides the only thing the buyer can act on: WHICH area is rented.
//      "You scored 9/16" tells them a mood. It does not tell them what to do on
//      Monday.
//
// This version weights each area by what a zero there actually costs, and its
// primary output is not a score at all — it is the single most exposed area and
// the consequence of losing it.

export interface Area {
  id: string;
  area: string;
  /** How catastrophic a zero here is, 1-5. Used for both the score and the ranking. */
  weight: number;
  /** What it costs to lose this, said plainly. Shown when it is their weakest. */
  consequence: string;
  /** The one move that closes it. */
  move: string;
}

export const AREAS: Area[] = [
  {
    id: "list", area: "Email list", weight: 5,
    consequence: "Without a list you cannot reach the same person twice. Every relationship you have built is held by a company that owes you nothing, and the day they change their mind you start again from zero with no way to tell anyone where you went.",
    move: "One page, one honest offer, one opt-in line. Ten real subscribers this month beats a plan for a thousand.",
  },
  {
    id: "survive", area: "Platform-loss survival", weight: 5,
    consequence: "If the answer to \"what survives\" is \"almost nothing\", you do not own a business yet — you have a position on somebody else's platform, and positions get removed without appeal or export.",
    move: "Pick the one asset that would survive and build it first. Usually that is the list.",
  },
  {
    id: "reach", area: "Off-platform reach", weight: 4,
    consequence: "You can only speak to your audience when an algorithm decides to let you. That is not reach — it is permission, and it is withdrawn quietly rather than announced.",
    move: "Get one channel you control: email, or a WhatsApp broadcast list. Anything where sending does not require approval.",
  },
  {
    id: "income", area: "Income concentration", weight: 4,
    consequence: "One source means one decision by one company can take your income to zero. It is not a question of whether that happens, only when — and it never comes with notice.",
    move: "Add one stream that does not depend on the first. Not the most impressive one — the closest one.",
  },
  {
    id: "store", area: "Sales channel", weight: 3,
    consequence: "Selling in DMs means your revenue depends on you being awake, and there is no record of what was agreed. It also caps you at the number of conversations you can personally hold.",
    move: "One checkout link that works while you sleep. It does not need a website.",
  },
  {
    id: "streams", area: "PAIDS spread", weight: 3,
    consequence: "A single active stream is a job with extra steps — all of the risk of self-employment, none of the resilience.",
    move: "Look at what you already have and find the second stream hiding in it, rather than inventing one.",
  },
  {
    id: "home", area: "Owned home base", weight: 3,
    consequence: "Without somewhere you control, every link you share sends people to a place that can change its rules, its layout, or its mind about you.",
    move: "One page on a domain you own. One headline, one thing to do.",
  },
  {
    id: "content", area: "Owned catalogue", weight: 2,
    consequence: "Years of work living only where it can be deleted. This one is the least likely to end you and the most likely to hurt — it is unrecoverable in a way income is not.",
    move: "Back it up this week. A folder is enough.",
  },
];

export type Answers = Record<string, number>; // 0, 1 or 2 per area

export interface AreaResult {
  area: Area;
  score: number;     // 0, 1 or 2
  gap: number;       // weight x (2 - score) — how much exposure this represents
  status: "rented" | "exposed" | "owned";
}

export interface Diagnosis {
  answered: number;
  /** 0-100, weighted by consequence rather than a flat sum. */
  ownership: number;
  /** Roughly what proportion of the business survives losing the biggest platform. */
  survival: number;
  band: "rented" | "exposed" | "building" | "owned";
  headline: string;
  body: string;
  results: AreaResult[];
  /** The single thing to fix. This is the real output. */
  weakest: AreaResult | null;
}

const MAX_WEIGHT = AREAS.reduce((a, x) => a + x.weight * 2, 0);

export function diagnose(answers: Answers): Diagnosis {
  const results: AreaResult[] = AREAS.map((area) => {
    const score = answers[area.id] ?? 0;
    const status: AreaResult["status"] = score === 0 ? "rented" : score === 1 ? "exposed" : "owned";
    return { area, score, gap: area.weight * (2 - score), status };
  }).sort((a, b) => b.gap - a.gap);

  const answered = AREAS.filter((a) => answers[a.id] !== undefined).length;
  const earned = AREAS.reduce((sum, a) => sum + a.weight * (answers[a.id] ?? 0), 0);
  const ownership = Math.round((earned / MAX_WEIGHT) * 100);

  // Survival is not the same question as ownership. It leans on the four areas
  // that actually determine whether anything is left the morning after an
  // account disappears — the others matter for growth, not for survival.
  const SURVIVAL_IDS = ["list", "survive", "reach", "income"];
  const sMax = AREAS.filter((a) => SURVIVAL_IDS.includes(a.id)).reduce((s, a) => s + a.weight * 2, 0);
  const sEarned = AREAS.filter((a) => SURVIVAL_IDS.includes(a.id))
    .reduce((s, a) => s + a.weight * (answers[a.id] ?? 0), 0);
  const survival = Math.round((sEarned / sMax) * 100);

  const weakest = results.find((r) => r.gap > 0) ?? null;

  let band: Diagnosis["band"], headline: string, body: string;
  if (ownership < 25) {
    band = "rented";
    headline = "Almost all of this is rented.";
    body = "Not one of the things holding your business up belongs to you. That is not a character flaw — it is what happens when you build where the audience already is. But it means somebody else decides how long this lasts.";
  } else if (ownership < 50) {
    band = "exposed";
    headline = "You have started, and you are still exposed.";
    body = "There is something here worth protecting now, which makes the gaps more expensive rather than less. The weakest area below is where the whole thing would fail first.";
  } else if (ownership < 75) {
    band = "building";
    headline = "The foundation is real.";
    body = "Enough of this is yours that a bad month on one platform is survivable. Close the remaining gap and a bad year becomes survivable too.";
  } else {
    band = "owned";
    headline = "You own this.";
    body = "Losing your biggest platform would be painful and it would not be fatal. That is a genuinely uncommon position — most people never get here, and the ones who do got here on purpose.";
  }

  return { answered, ownership, survival, band, headline, body, results, weakest };
}

/** Plain-language reading of the survival number. */
export function survivalLine(survival: number): string {
  if (survival <= 20) return "If your biggest platform removed your account tonight, there would be almost nothing left to rebuild from.";
  if (survival <= 45) return "Losing your biggest platform would take most of this with it. You would keep the knowledge and lose the audience.";
  if (survival <= 70) return "You would survive losing your biggest platform, and it would cost you months.";
  return "You could lose your biggest platform and still reach the people who matter the same week.";
}
