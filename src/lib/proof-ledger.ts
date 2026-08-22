// THE PROOF LEDGER — recover the results you already produced and gave away.
//
// The Charge Gate asks for "one result you can quote". Most people in this
// audience have produced dozens and recorded none, because nobody records a
// favour. Two students won scholarships; nobody wrote it down. A department
// stopped failing an audit; nobody asked whether it could be mentioned.
//
// So this runs before the Charge Gate: list the people you helped, what changed,
// and whether you are allowed to say so. Then it writes the permission message —
// which is the actual blocker, because asking feels like begging, and it is not.
// Most people are glad to be asked.
//
// ⚠️ PRIVACY. Entries stay in the member's own synced storage and are never
// sent anywhere. The tool asks for a ROLE, not a name, and says why — a
// half-written client list is exactly the kind of thing that should not exist
// in somebody's browser under a real person's name.

export interface ProofEntry {
  id: string;
  /** A role, deliberately — "a masters student", "a finance team". Never a name. */
  role: string;
  /** Where they were before. */
  before: string;
  /** What changed. The more countable, the stronger. */
  after: string;
  /** Have you asked whether you may refer to it? */
  permission: "not-asked" | "asked" | "granted" | "declined";
}

export const EMPTY_ENTRY: Omit<ProofEntry, "id"> = {
  role: "",
  before: "",
  after: "",
  permission: "not-asked",
};

export type Strength = "quotable" | "usable" | "thin";

export interface ScoredEntry extends ProofEntry {
  strength: Strength;
  note: string;
  /** The sentence they can actually put in front of a buyer. */
  quote: string | null;
}

const NUMBERY =
  /\d|\b(doubled|halved|tripled|first|passed|won|cleared|reduced|cut|raised|saved)\b/i;

export function score(e: ProofEntry): ScoredEntry {
  const hasBefore = e.before.trim().length > 4;
  const hasAfter = e.after.trim().length > 4;
  const countable = NUMBERY.test(e.after);
  const cleared = e.permission === "granted";

  let strength: Strength = "thin";
  let note = "Add what changed, in a way somebody could check.";

  if (hasBefore && hasAfter && countable && cleared) {
    strength = "quotable";
    note = "Use this one. It has a before, a countable after, and permission.";
  } else if (hasBefore && hasAfter && countable) {
    strength = "usable";
    note = "Strong result. Ask permission and it becomes your best sentence.";
  } else if (hasBefore && hasAfter) {
    strength = "usable";
    note = "Real, but soft. Can you put a number or a milestone on the after?";
  }

  const quote =
    hasBefore && hasAfter
      ? `${e.role.trim() || "Someone I worked with"} came to me ${e.before.trim()}. ${e.after.trim()}.`
      : null;

  return { ...e, strength, note, quote };
}

export interface LedgerSummary {
  total: number;
  quotable: number;
  usable: number;
  /** Does the Charge Gate's "one result you can quote" condition now pass? */
  meetsChargeGate: boolean;
  headline: string;
}

export function summarise(entries: ProofEntry[]): LedgerSummary {
  const scored = entries.map(score);
  const quotable = scored.filter((s) => s.strength === "quotable").length;
  const usable = scored.filter((s) => s.strength === "usable").length;
  const meets = quotable >= 1;

  let headline: string;
  if (meets) {
    headline = "You have a result you are allowed to quote. That was the missing condition.";
  } else if (usable > 0) {
    headline =
      "You have the results. What you do not have yet is permission — and that is one message away.";
  } else if (entries.length > 0) {
    headline =
      "Keep going. Think about the last five people who came to you, not the impressive ones.";
  } else {
    headline = "Start with the last person you helped for nothing.";
  }

  return { total: entries.length, quotable, usable, meetsChargeGate: meets, headline };
}

/**
 * The permission message. This is the whole tool, really — people do not lack
 * results, they lack the nerve to ask about them. So it is written to be easy
 * to send: no flattery, an explicit opt-out, and nothing that reads like a
 * favour being asked twice.
 */
export function permissionMessage(e: ProofEntry, methodName?: string): string {
  const thing = methodName?.trim() ? `“${methodName.trim()}”` : "the work we did";
  return `Hi — a small ask, and a genuine no is completely fine.

I'm putting a proper structure around ${thing}, and I'd like to be able to mention what came out of it: ${e.after.trim() || "the result"}.

Could I refer to that? I'm happy to keep it anonymous — "a ${e.role.trim() || "client"} I worked with" — or to use your name, whichever you'd prefer. And if you'd rather I didn't, that's genuinely not a problem and it changes nothing.`;
}

/** Rough ids without Math.random, which is unavailable in some contexts here. */
export function nextId(entries: ProofEntry[]): string {
  const max = entries.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0);
  return String(max + 1);
}
