// THE FIVE TESTS — the analysis behind the public Positioning Brief.
//
// Accelerator Phase 1 gates on "a positioning sentence that passes the five
// tests" and, until now, nothing tested it. This is that gate, made real and
// put in front of the public.
//
// Runs on both the client (live feedback as they type) and the server (the PDF
// and the email), so it is deliberately dependency-free: no React, no Supabase,
// no offer-spine import. Pure functions in, verdicts out.
//
// It contains no founder material of any kind. Every example below is invented
// for illustration and belongs to nobody.

export interface Positioning {
  who: string;        // the person they help
  from: string;       // where that person is now
  to: string;         // where that person ends up
  timeframe: string;  // how long it takes
  output: string;     // what changes hands
  price: number | null; // rands
}

export const EMPTY_POSITIONING: Positioning = {
  who: "", from: "", to: "", timeframe: "", output: "", price: null,
};

export interface TestResult {
  id: string;
  name: string;
  question: string;
  passed: boolean;
  note: string;
  fix: string | null;
}

// ─── Vocabulary the tests react to ──────────────────────────────────────────

// A category cannot be phoned. If the "who" is one of these on its own, the
// sentence describes a market, not a client.
const CATEGORIES = [
  "people", "everyone", "anyone", "clients", "customers", "businesses",
  "companies", "organisations", "organizations", "teams", "leaders",
  "professionals", "entrepreneurs", "founders", "creators", "individuals",
  "students", "women", "men", "brands", "startups", "smes", "corporates",
];

// Feelings are states, not outcomes. "They feel confident" is not something a
// buyer can check, so it is not something they will pay to reach.
const FEELINGS = [
  "confident", "clarity", "clear", "empowered", "motivated", "inspired",
  "unstuck", "aligned", "fulfilled", "happier", "calm", "in control",
  "less overwhelmed", "more focused", "ready", "confidence",
];

// An artifact changes hands. A subject does not.
const SUBJECTS = [
  "strategy", "marketing", "mindset", "leadership", "growth", "business",
  "branding", "productivity", "wellness", "coaching", "consulting",
  "transformation", "success", "development",
];

const ARTIFACTS = [
  "plan", "report", "template", "script", "checklist", "audit", "roadmap",
  "framework", "calendar", "dashboard", "policy", "register", "model",
  "workbook", "brief", "document", "system", "file", "spreadsheet",
  "contract", "deck", "guide", "recording", "assessment", "map",
];

const JARGON = [
  "synergy", "holistic", "bespoke", "leverage", "paradigm", "ecosystem",
  "end-to-end", "best-in-class", "value-add", "stakeholder engagement",
  "thought leadership", "solutioning", "operationalise", "operationalize",
];

const norm = (s: string) => s.trim().toLowerCase();
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

// ─── The tests ──────────────────────────────────────────────────────────────

export function testPerson(p: Positioning): TestResult {
  const v = norm(p.who);
  const base = {
    id: "person",
    name: "The Person Test",
    question: "Could you phone them?",
  };
  if (!v) return { ...base, passed: false, note: "Nothing here yet.", fix: "Name the person you help." };

  const isBareCategory = CATEGORIES.includes(v) || (words(v).length <= 2 && CATEGORIES.some((c) => v === c || v === `${c}`));
  const hasQualifier = words(v).length >= 3;

  if (isBareCategory && !hasQualifier) {
    return {
      ...base,
      passed: false,
      note: `"${p.who.trim()}" is a category, not a person. A category cannot be phoned, and it cannot be referred.`,
      fix: "Add the two or three details that narrow it to somebody real — their job, their situation, the moment they need you.",
    };
  }
  if (words(v).length < 2) {
    return {
      ...base,
      passed: false,
      note: "One word is a label, not a person.",
      fix: "Say who they are and what situation they are in.",
    };
  }
  return {
    ...base,
    passed: true,
    note: "Specific enough that someone could picture an actual person — and recognise themselves.",
    fix: null,
  };
}

export function testMovement(p: Positioning): TestResult {
  const from = norm(p.from);
  const to = norm(p.to);
  const base = {
    id: "movement",
    name: "The Movement Test",
    question: "Is this a move, or two moods?",
  };
  if (!from || !to) return { ...base, passed: false, note: "Both ends are needed.", fix: "Say where they start and where they end up." };

  const feelingFrom = FEELINGS.some((f) => from.includes(f));
  const feelingTo = FEELINGS.some((f) => to.includes(f));

  if (feelingTo) {
    return {
      ...base,
      passed: false,
      note: `"${p.to.trim()}" is a state, not a destination. Nobody can check whether they have arrived.`,
      fix: "Say what they can DO afterwards that they could not do before. The feeling follows the capability — it is never the thing sold.",
    };
  }
  if (feelingFrom && !feelingTo) {
    return {
      ...base,
      passed: true,
      note: "Starts with how it feels and ends with something real. That is the right way round.",
      fix: null,
    };
  }
  if (from === to) {
    return { ...base, passed: false, note: "Both ends say the same thing.", fix: "There is no movement described. What actually changes?" };
  }
  return {
    ...base,
    passed: true,
    note: "There is a real distance between the start and the end.",
    fix: null,
  };
}

export function testArtifact(p: Positioning): TestResult {
  const v = norm(p.output);
  const base = {
    id: "artifact",
    name: "The Artifact Test",
    question: "What changes hands?",
  };
  if (!v) return { ...base, passed: false, note: "Nothing here yet.", fix: "Name the thing they walk away holding." };

  const hasArtifact = ARTIFACTS.some((a) => v.includes(a));
  const bareSubject = SUBJECTS.some((s) => v === s) || (words(v).length <= 2 && SUBJECTS.some((s) => v.includes(s)));

  if (bareSubject && !hasArtifact) {
    return {
      ...base,
      passed: false,
      note: `"${p.output.trim()}" is a subject, not an artifact. A subject is what you know about; an artifact is what they keep.`,
      fix: "Name the object. A document, a plan, a register, a script — something that exists after you have gone.",
    };
  }
  if (FEELINGS.some((f) => v.includes(f))) {
    return {
      ...base,
      passed: false,
      note: "This describes how they will feel, not what they receive.",
      fix: "What is the file, the document or the decision they end up with?",
    };
  }
  if (!hasArtifact && words(v).length < 3) {
    return {
      ...base,
      passed: false,
      note: "Too vague to picture.",
      fix: "Be concrete enough that they could describe it to a colleague without you in the room.",
    };
  }
  return { ...base, passed: true, note: "Something real changes hands. That is what makes it a product rather than a conversation.", fix: null };
}

export function testRepeat(p: Positioning): TestResult {
  const s = assembleSentence(p);
  const n = words(s).length;
  const base = {
    id: "repeat",
    name: "The Repeat Test",
    question: "Can a stranger say it back?",
  };
  const foundJargon = JARGON.filter((j) => norm(s).includes(j));

  if (foundJargon.length) {
    return {
      ...base,
      passed: false,
      note: `Contains ${foundJargon.map((j) => `"${j}"`).join(", ")}. Nobody repeats a sentence they would feel silly saying out loud.`,
      fix: "Swap it for the word you would use talking to a friend about their actual problem.",
    };
  }
  if (n > 45) {
    return {
      ...base,
      passed: false,
      note: `${n} words. Referrals happen from memory, and nobody remembers this much.`,
      fix: "Cut it to one breath. If you cannot say it without pausing, they cannot repeat it.",
    };
  }
  if (n < 12) {
    return { ...base, passed: false, note: "Too thin to mean anything specific yet.", fix: "Fill in the missing parts above." };
  }
  return { ...base, passed: true, note: `${n} words — short enough to be repeated by someone who heard it once.`, fix: null };
}

export function testPrice(p: Positioning): TestResult {
  const base = {
    id: "price",
    name: "The Price Test",
    question: "Is there a defensible number?",
  };
  if (!p.price || p.price <= 0) {
    return { ...base, passed: false, note: "No price set.", fix: "A position without a price is a hobby. Put a number on it, even a wrong one." };
  }
  if (p.price < 250) {
    return {
      ...base,
      passed: false,
      note: `R${p.price.toLocaleString("en-ZA")} is a thank-you, not a price.`,
      fix: "Nobody values what costs them nothing to lose. Below this, the price itself tells them not to take it seriously.",
    };
  }
  if (p.price < 1000) {
    return {
      ...base,
      passed: true,
      note: `R${p.price.toLocaleString("en-ZA")} works as a way in, but it is priced like a product when you are selling judgement.`,
      fix: null,
    };
  }
  return {
    ...base,
    passed: true,
    note: `R${p.price.toLocaleString("en-ZA")} is a real number. At this level buyers argue about proof, not price — so the artifact above has to be specific.`,
    fix: null,
  };
}

export function runTests(p: Positioning): TestResult[] {
  return [testPerson(p), testMovement(p), testArtifact(p), testRepeat(p), testPrice(p)];
}

// ─── Outputs ────────────────────────────────────────────────────────────────

export function assembleSentence(p: Positioning): string {
  const who = p.who.trim() || "___";
  const from = p.from.trim() || "___";
  const to = p.to.trim() || "___";
  const time = p.timeframe.trim() || "___";
  const output = p.output.trim() || "___";
  return `I help ${who} go from ${from} to ${to} in ${time}, and they walk away with ${output}.`;
}

/** The line that answers "why does it cost that" before anyone asks. */
export function defendingLine(p: Positioning): string | null {
  if (!p.output.trim() || !p.timeframe.trim()) return null;
  return `You are not paying for ${p.timeframe.trim()} of my time. You are paying for ${p.output.trim().toLowerCase()} — and for not having to work it out yourself.`;
}

export function score(results: TestResult[]): number {
  return results.filter((r) => r.passed).length;
}

export function verdictFor(passed: number): { headline: string; body: string } {
  if (passed <= 1) {
    return {
      headline: "This is still a description, not a position.",
      body: "Right now it says what field you are in. That is true of everyone in your field. The work below is turning it into something only you could have written.",
    };
  }
  if (passed === 2 || passed === 3) {
    return {
      headline: "Half of this is doing real work.",
      body: "The parts that pass are worth keeping exactly as they are. Fix the failures one at a time — they are usually one honest sentence away from passing.",
    };
  }
  if (passed === 4) {
    return {
      headline: "One thing between you and a sentence you can use everywhere.",
      body: "Close the last gap and this goes in your bio, your email signature, and the first thirty seconds of every call you take.",
    };
  }
  return {
    headline: "This passes. Now put it where people can see it.",
    body: "A sentence that passes all five is rarer than it sounds. Do not keep refining it — publish it, say it out loud to somebody this week, and let it start earning.",
  };
}

/** Where the sentence goes once it works. Practical, not motivational. */
export const PLACEMENTS = [
  { where: "Your profile bio", how: "Word for word. This is the first change anyone else can see." },
  { where: "Your email signature", how: "One line under your name. It works on every email you already send." },
  { where: "The first 30 seconds of a call", how: "Before they ask what you do — not after." },
  { where: "The top of your invoice", how: "It reminds them what they bought while they are approving the payment." },
  { where: "Your answer at events", how: "When someone asks what you do, this is the answer. Practise it until it is boring." },
];
