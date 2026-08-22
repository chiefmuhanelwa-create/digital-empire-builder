// THE METHOD NAMER — turn a favour into a product by giving it a name.
//
// This is the single best idea in the founder's sales draft, and it came from a
// real person. An academic support advisor never gives a student a research
// topic. After they cite somebody she asks "so, what do YOU say?" Before a
// defence she says "be honest." Two students won scholarships on that.
//
// That is a method. It had no name.
//
//   A service you cannot name is a favour, and favours are free by definition.
//   A method with a name is a product, and products have prices.
//
// So this tool does one thing: extract the repeatable process somebody already
// runs — the moves they make every single time without noticing — and hand it
// back with a name on it.
//
// Pure functions, no dependencies. Runs on the client for live feedback.

import type { Offer } from "./offer-spine";

export interface MethodInput {
  /** Their field, in their words. Drives naming, never a dropdown of ours. */
  profession: string;
  /** Who they do this for. */
  who: string;
  /** The moves they make every time, in order. 3–6 is the useful range. */
  moves: string[];
  /**
   * The one move nobody else makes — the "so, what do YOU say?" of their
   * practice. This is what the method gets named after.
   */
  signature: string;
  /** What the person is holding, or able to do, at the end. */
  endsWith: string;
}

export const EMPTY_METHOD: MethodInput = {
  profession: "",
  who: "",
  moves: ["", "", ""],
  signature: "",
  endsWith: "",
};

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "of",
  "to",
  "for",
  "in",
  "on",
  "at",
  "with",
  "from",
  "i",
  "you",
  "they",
  "them",
  "their",
  "my",
  "your",
  "is",
  "are",
  "be",
  "do",
  "does",
  "did",
  "so",
  "what",
  "that",
  "this",
  "it",
  "them",
  "then",
  "when",
  "before",
  "after",
  "always",
  "never",
  "every",
  "time",
  "just",
  "really",
  "very",
  "ask",
  "asks",
  "asked",
  "say",
  "says",
]);

/** The words worth building a name out of — longest and rarest first. */
function keyWords(s: string, n = 3): string[] {
  const seen = new Set<string>();
  return s
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w) && !seen.has(w) && seen.add(w))
    .sort((a, b) => b.length - a.length)
    .slice(0, n);
}

function titleCase(w: string): string {
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export interface NameCandidate {
  name: string;
  why: string;
}

/**
 * Three name shapes, because naming is a choice and a single suggestion gets
 * accepted lazily. Each is built from THEIR words — nothing generic, nothing
 * from a list of ours.
 */
export function nameCandidates(i: MethodInput): NameCandidate[] {
  const sig = keyWords(i.signature, 2);
  const end = keyWords(i.endsWith, 2);
  const who = keyWords(i.who, 1);
  const out: NameCandidate[] = [];

  if (sig.length) {
    out.push({
      name: `The ${sig.map(titleCase).join(" ")} Method`,
      why: "Named after the move only you make. Strongest when somebody has already noticed you do it.",
    });
  }
  if (end.length) {
    out.push({
      name: `The ${end.map(titleCase).join(" ")} Process`,
      why: "Named after what they walk away with. Easiest to sell, because it says the result out loud.",
    });
  }
  if (who.length && (end.length || sig.length)) {
    out.push({
      name: `The ${titleCase(who[0])} ${titleCase(end[0] ?? sig[0])} Review`,
      why: "Named after who it is for. Best when your buyer needs to recognise themselves immediately.",
    });
  }
  return out;
}

export interface MethodCheck {
  id: string;
  label: string;
  ok: boolean;
  fix: string;
}

/** What separates a method from a description of being helpful. */
export function checks(i: MethodInput): MethodCheck[] {
  const filled = i.moves.filter((m) => m.trim().length > 2);
  return [
    {
      id: "repeatable",
      label: "It has at least three steps, in an order",
      ok: filled.length >= 3,
      fix: "If you cannot list three, it is instinct rather than a method. Think about the last three people and write down what you did each time.",
    },
    {
      id: "signature",
      label: "There is one move that is yours",
      ok: i.signature.trim().length > 8,
      fix: "The thing you always say or always check, that other people in your field do not. This is what the method gets named after.",
    },
    {
      id: "ends",
      label: "It ends with something, not just a feeling",
      ok: i.endsWith.trim().length > 5,
      fix: "A document, a decision, a plan, a corrected draft. If they only leave feeling better, you cannot price it.",
    },
    {
      id: "who",
      label: "It is for somebody specific",
      ok: i.who.trim().length > 3,
      fix: "“Anyone who needs help” is not a buyer. Name the person you have actually done this for.",
    },
  ];
}

export function isMethod(i: MethodInput): boolean {
  return checks(i).every((c) => c.ok);
}

/** The sentence they can say out loud, built from their own answers. */
export function methodSentence(i: MethodInput, name: string): string {
  const n = name.trim() || "my method";
  const who = i.who.trim() || "the people I work with";
  const ends = i.endsWith.trim() || "a clear next step";
  return `${n} is how I take ${who} to ${ends}.`;
}

/** What this writes into the shared offer, so later steps inherit it. */
export function toOffer(i: MethodInput, name: string): Partial<Offer> {
  return {
    name: name.trim(),
    who: i.who.trim(),
    output: i.endsWith.trim(),
  };
}

/**
 * The line that does the persuading, and it is not ours — it is the argument
 * the founder makes, restated with their own words in it.
 */
export function favourVsProduct(name: string): string {
  const n = name.trim();
  return n
    ? `Until today this was a favour, and favours are free by definition. “${n}” is a thing. Things have prices.`
    : "A service you cannot name is a favour, and favours are free by definition. A method with a name is a product.";
}
