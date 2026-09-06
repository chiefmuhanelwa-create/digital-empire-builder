// THE EDIT BRIEF — pipeline Stage 4. Pure, client-safe, no AI.
//
// Stage 4 was the last named gap in the pipeline that is not blocked on
// platform API review. It is also the one where it would be easiest to ship
// something dishonest, so read this before changing the numbers.
//
// WHERE THESE THRESHOLDS COME FROM, AND WHAT THEY ARE NOT
//
// Eight reels from ONE South African account, three torn down frame by frame
// with ffmpeg. That is the whole sample. It is not a study, it is not a general
// law of short-form video, and it is not calibrated to anybody else's audience:
//
//   RATE   90.3s runtime, first cut 4.8s, 14.0 cuts/min  → 27.8% completion
//   SARS  104.8s runtime, first cut 5.8s, 11.5 cuts/min  → 29.7% completion
//   RENT   74.0s                                          → 22.6%
//   9TO5   69.4s                                          → 15.7%
//   ×3    164.2s                                          →  8.7-11.9%
//
// Two more limits worth stating out loud. Instagram does not expose a retention
// curve through the API, so "completion" here is average watch time over
// runtime — a blunter instrument than a real curve. And a 27.8% completion on
// 18,119 reach and an 8.7% on 199 reach are not measuring the same thing;
// reach differences that large confound the comparison.
//
// So this tool checks a plan against ONE account's measured pattern and says
// so on the page. It is a starting hypothesis to test against your own numbers,
// not a rule. The moment a user has their own measured set, theirs wins.

export const EVIDENCE_NOTE =
  "Measured from 8 reels on one South African account, 3 torn down in full. A starting point to test against your own numbers — not a general law.";

export type EditPlan = {
  runtimeSeconds: number;
  firstCutSeconds: number;
  cutsPerMinute: number;
  musicFromFrameOne: boolean;
  longestSilence: number;
  cardsPercent: number;
  faceInFrameForCta: boolean;
  opensTight: boolean;
  /** Whether the spoken opening is about the viewer rather than the creator. */
  opensSecondPerson: boolean;
};

export const DEFAULT_PLAN: EditPlan = {
  runtimeSeconds: 95,
  firstCutSeconds: 5,
  cutsPerMinute: 12,
  musicFromFrameOne: true,
  longestSilence: 0.8,
  cardsPercent: 12,
  faceInFrameForCta: true,
  opensTight: true,
  opensSecondPerson: true,
};

export type CheckState = "pass" | "warn" | "fail";

export type EditCheck = {
  id: string;
  label: string;
  state: CheckState;
  detail: string;
  /** The measured basis, so nothing here reads as an assertion. */
  evidence: string;
};

export function checkEdit(p: EditPlan): EditCheck[] {
  const out: EditCheck[] = [];

  // 1 · Runtime
  out.push({
    id: "runtime",
    label: "Runtime",
    state: p.runtimeSeconds >= 85 && p.runtimeSeconds <= 110 ? "pass" : p.runtimeSeconds > 160 || p.runtimeSeconds < 60 ? "fail" : "warn",
    detail:
      p.runtimeSeconds > 160
        ? `${p.runtimeSeconds}s. The three longest in the sample ran 164s and completed at 8.7-11.9% — the worst of the set by a distance.`
        : p.runtimeSeconds < 60
          ? `${p.runtimeSeconds}s. Short does not mean watched: 25s is what the best performer's average watch time came to, not a runtime to aim at.`
          : p.runtimeSeconds >= 85 && p.runtimeSeconds <= 110
            ? `${p.runtimeSeconds}s sits in the band both top performers landed in.`
            : `${p.runtimeSeconds}s is outside the 90-105s band, though not by much.`,
    evidence: "90.3s → 27.8%; 104.8s → 29.7%; 164.2s → 8.7-11.9%",
  });

  // 2 · The first cut
  out.push({
    id: "first-cut",
    label: "First cut",
    state: p.firstCutSeconds >= 4.5 ? "pass" : p.firstCutSeconds < 3 ? "fail" : "warn",
    detail:
      p.firstCutSeconds < 3
        ? `A cut at ${p.firstCutSeconds}s. The video that cut at 0.1s — seven more inside ten seconds — completed lowest of the three torn down.`
        : `First cut at ${p.firstCutSeconds}s. Both top performers held the opening frame past 4.8s with zero cuts in the first three seconds.`,
    evidence: "4.8s → 27.8%; 5.8s → 29.7%; 0.1s → 24.0%",
  });

  // 3 · Cut rate
  out.push({
    id: "cut-rate",
    label: "Cut rate",
    state: p.cutsPerMinute >= 10 && p.cutsPerMinute <= 15 ? "pass" : p.cutsPerMinute > 20 ? "fail" : "warn",
    detail:
      p.cutsPerMinute > 20
        ? `${p.cutsPerMinute} cuts a minute. Inside the watched window the weakest of the three ran at 25.6/min — cutting harder did not hold anyone.`
        : `${p.cutsPerMinute} cuts a minute, against 11.5 and 14.0 in the two that held attention longest.`,
    evidence: "11.5/min → 29.7%; 14.0/min → 27.8%; 25.6/min in-window → weakest",
  });

  // 4 · Sound
  out.push({
    id: "sound",
    label: "Sound",
    state: p.musicFromFrameOne && p.longestSilence <= 0.9 ? "pass" : !p.musicFromFrameOne ? "fail" : "warn",
    detail: !p.musicFromFrameOne
      ? "No music from frame one. All three torn down carried music throughout; none had a gap of silence anywhere."
      : p.longestSilence > 0.9
        ? `A ${p.longestSilence}s pause. The longest pause in any of the three was 0.9s — silence is where a scroll starts.`
        : `Music throughout, longest pause ${p.longestSilence}s.`,
    evidence: "Longest pause across all three torn down: 0.9s",
  });

  // 5 · Graphic cards
  out.push({
    id: "cards",
    label: "Full-screen cards",
    state: p.cardsPercent <= 15 ? "pass" : p.cardsPercent >= 30 ? "fail" : "warn",
    detail:
      p.cardsPercent >= 30
        ? `${p.cardsPercent}% of runtime as cards. The lowest performer of the three was 37% cards against the best at 11%.`
        : `${p.cardsPercent}% cards. Where the audience left in the best of the set was a full-screen text card at 27-31s — the face leaving the frame is the exit.`,
    evidence: "11% cards → best; 37% cards → lowest of the three",
  });

  // 6 · The opening person — the finding that contradicts the caption rule
  out.push({
    id: "opening-person",
    label: "Who the opening is about",
    state: p.opensSecondPerson ? "pass" : "fail",
    detail: p.opensSecondPerson
      ? "Opens on the viewer. Both winners accused the viewer in the second person and let the creator's own loss arrive around ten seconds in."
      : "Opens on you rather than the viewer. First-person spoken openings measured 22.6% against 27.8% and 29.7%. Note this is the opposite of the caption rule — the caption opens on your loss, the video opens on theirs. Write both; never reuse one as the other.",
    evidence: "Second person → 27.8% / 29.7%; first person → 22.6%",
  });

  // 7 · Framing
  out.push({
    id: "framing",
    label: "Opening frame",
    state: p.opensTight ? "pass" : "warn",
    detail: p.opensTight
      ? "Opens tight, face filling the frame."
      : "A wide opening. The mid-performer had pulled wide — small in frame, room visible — while the best of the set stayed tight.",
    evidence: "Tight open → 29.7%; pulled wide → 27.8%",
  });

  // 8 · The CTA
  out.push({
    id: "cta",
    label: "Face in frame for the CTA",
    state: p.faceInFrameForCta ? "pass" : "warn",
    detail: p.faceInFrameForCta
      ? "Face in frame when you ask."
      : "Asking over a card or a cutaway. The audience leaves when the face leaves — and the ask is the worst moment for that to happen.",
    evidence: "Exit points in all three coincided with the face leaving frame",
  });

  return out;
}

export type EditVerdict = {
  passes: number;
  total: number;
  state: CheckState;
  headline: string;
};

export function editVerdict(checks: EditCheck[]): EditVerdict {
  const passes = checks.filter((c) => c.state === "pass").length;
  const fails = checks.filter((c) => c.state === "fail").length;
  const state: CheckState = fails > 0 ? "fail" : passes === checks.length ? "pass" : "warn";

  return {
    passes,
    total: checks.length,
    state,
    headline:
      fails > 0
        ? `${fails} thing${fails > 1 ? "s go" : " goes"} against everything the measured set shows`
        : passes === checks.length
          ? "This matches the shape of the two that held attention longest"
          : `${passes} of ${checks.length}. Nothing disqualifying.`,
  };
}
