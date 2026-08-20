// THE OFFER SPINE — the Foundation Kit's single source of truth.
//
// WHY THIS FILE EXISTS
// ====================
// Before it, the kit was eleven tools that each wrote their own localStorage key
// (nochill-niche-v1, nochill-paids-v1, …) and never read each other's. A buyer
// retyped "who do you help" in every single one. By the third time, most people
// stop — which is exactly the abandonment the spec predicts.
//
// The product thesis is carry-forward: one honest hour here writes the title of
// their rate card, the line item on their invoice, Day 7 of their content
// calendar and the closing line of their fifth email. That only works if there
// is ONE record every tool reads from. This is it.
//
// The kit sells at $97 and has to feel worth many times that. It cannot do that
// on volume of tools — it does it by the tools knowing what the buyer already
// said.
//
// WHY THE MONEY IN HERE IS IN RAND
// ================================
// chkplt.com prices ITS OWN products in USD. These amounts are different: they
// are what the BUYER charges THEIR client, in South Africa, in rand. A price
// mirror that answered a Johannesburg consultant in dollars would be useless.

export type ProfessionKey =
  | "auditor"
  | "nurse"
  | "pastor"
  | "lecturer"
  | "finance-leader"
  | "hr";

export interface Offer {
  /** Who exactly — a person, never a category. */
  who: string;
  /** Where they are now, in their words. */
  from: string;
  /** Where they are after, in their words. */
  to: string;
  /** How long it takes. */
  timeframe: string;
  /** The artifact that changes hands. A thing, not a feeling. */
  output: string;
  /** How it is delivered. */
  format: string;
  /** What it is called. */
  name: string;
  /** Rand. What the buyer charges their client. */
  price: number | null;
}

export const EMPTY_OFFER: Offer = {
  who: "",
  from: "",
  to: "",
  timeframe: "",
  output: "",
  format: "",
  name: "",
  price: null,
};

// ─── Worked examples ────────────────────────────────────────────────────────
//
// The spec is emphatic that these are COMPLETE offers from the buyer's own
// field, shown at every step with "use this and edit it". A blank field asks the
// reader to supply all the value; a worked example from their own profession
// shows them the shape and lets them argue with it. Arguing with a draft is far
// easier than authoring from nothing, and it is the give-before-you-ask ratio
// the VERDICT gate exists to enforce.

export interface Profession {
  key: ProfessionKey;
  label: string;
  /** Shown when they pick, so they know it is genuinely their field. */
  blurb: string;
  example: Offer;
}

export const PROFESSIONS: Profession[] = [
  {
    key: "auditor",
    label: "Auditor / Accountant",
    blurb: "You close other people's books and have never once billed for the judgement behind it.",
    example: {
      who: "A first-time finance manager at a company doing R5m–R30m a year",
      from: "dreading year-end because the auditors always find the same mess",
      to: "walking into the audit with everything already where it should be",
      timeframe: "3 weeks",
      output: "A year-end readiness pack: a reconciled trial balance, a fixed-asset register and a schedule of every supporting document the auditor will ask for",
      format: "Two working sessions plus the completed pack",
      name: "Audit-Ready in 21 Days",
      price: 18000,
    },
  },
  {
    key: "nurse",
    label: "Nurse / Healthcare",
    blurb: "You explain the same thing to families every shift, for free, forever.",
    example: {
      who: "An adult child who has just become the carer for a parent after a stroke",
      from: "guessing at medication times and terrified of getting it wrong",
      to: "running a home care routine they can hand to a sibling without a phone call",
      timeframe: "2 weeks",
      output: "A written home-care plan: medication schedule, warning signs that mean call a doctor, and a daily routine sheet",
      format: "One 90-minute consult plus the written plan",
      name: "The First Month at Home",
      price: 3500,
    },
  },
  {
    key: "pastor",
    label: "Pastor / Ministry",
    blurb: "You counsel people through the worst weeks of their lives and call it duty.",
    example: {
      who: "An engaged couple three months from their wedding with no premarital preparation",
      from: "assuming they agree about money, family and children because they have never actually asked",
      to: "having had all four hard conversations, on paper, before the day",
      timeframe: "6 weeks",
      output: "Six guided sessions and a written agreement covering money, family, conflict and children",
      format: "Six sessions, in person or online, plus the workbook",
      name: "Before You Say Yes",
      price: 4500,
    },
  },
  {
    key: "lecturer",
    label: "Lecturer / Teacher",
    blurb: "You have taught the same module for nine years and own none of it.",
    example: {
      who: "A working professional who needs a postgraduate research proposal accepted",
      from: "three rejected proposals and no idea what the panel actually wants",
      to: "an accepted proposal with a supervisor assigned",
      timeframe: "8 weeks",
      output: "A complete research proposal: problem statement, literature framing, methodology and timeline",
      format: "Four one-hour reviews plus written feedback on every draft",
      name: "Proposal Accepted",
      price: 12000,
    },
  },
  {
    key: "finance-leader",
    label: "Finance / Governance Leader",
    blurb: "You sit on boards, give the keynote, and invoice for none of it.",
    example: {
      who: "A founder-run business about to take on its first outside investor",
      from: "financials that live in the founder's head and a spreadsheet nobody else can read",
      to: "a board pack an investor can be handed without an apology",
      timeframe: "4 weeks",
      output: "A monthly board pack template, a 12-month cash-flow forecast and a one-page governance calendar",
      format: "Three working sessions plus the built templates",
      name: "Investor-Ready Finance",
      price: 35000,
    },
  },
  {
    key: "hr",
    label: "HR / People",
    blurb: "You have written forty disciplinary processes and given every one of them away.",
    example: {
      who: "An owner-managed business with 15–60 staff and no HR person",
      from: "handling dismissals on instinct and hoping the CCMA never calls",
      to: "a disciplinary process they can follow without phoning a lawyer each time",
      timeframe: "3 weeks",
      output: "A compliant disciplinary and grievance pack: policy, warning templates, hearing script and record sheets",
      format: "Two sessions plus the complete document pack",
      name: "CCMA-Proof in 21 Days",
      price: 22000,
    },
  },
];

export function professionByKey(k: ProfessionKey | null): Profession | null {
  return PROFESSIONS.find((p) => p.key === k) ?? null;
}

// ─── Validation ─────────────────────────────────────────────────────────────
//
// Not "is this field non-empty". The spec is specific about WHAT is wrong with
// a weak answer, because the correction is the teaching. "knowledgeable people"
// is a category, not a person. "They know something" is a state, not a sentence.
// "Business strategy" is a subject, not an artifact you can hand over.
//
// Every rule returns the reason, never just a red border. A red border teaches
// nothing.

export interface Critique {
  ok: boolean;
  /** Why it fails, in his voice. Empty when ok. */
  note: string;
}

const CATEGORY_WORDS = [
  "people", "everyone", "anyone", "businesses", "companies", "clients",
  "professionals", "entrepreneurs", "creators", "women", "men", "students",
  "individuals", "organisations", "organizations", "teams", "leaders",
];

export function critiqueWho(v: string): Critique {
  const s = v.trim();
  if (s.length < 3) return { ok: false, note: "" };
  if (s.split(/\s+/).length < 4) {
    return {
      ok: false,
      note: "Too short to be a person. Who are they at work, and what has just happened to them?",
    };
  }
  const lower = s.toLowerCase();
  const bare = CATEGORY_WORDS.find(
    (w) => lower === w || lower === `${w}` || new RegExp(`^(all |most |many )?${w}$`).test(lower),
  );
  if (bare) {
    return {
      ok: false,
      note: `"${s}" is a category, not a person. A category cannot be phoned. Who is the specific one you are thinking of?`,
    };
  }
  if (/^(everyone|anybody|anyone|any)/i.test(s)) {
    return {
      ok: false,
      note: "If it is for everyone, nobody recognises themselves in it. Narrow it until one person would say 'that is me'.",
    };
  }
  return { ok: true, note: "" };
}

export function critiqueFromTo(from: string, to: string): Critique {
  const f = from.trim();
  const t = to.trim();
  if (!f || !t) return { ok: false, note: "" };
  if (f.toLowerCase() === t.toLowerCase()) {
    return { ok: false, note: "Before and after are the same sentence. Nothing has changed." };
  }
  if (t.split(/\s+/).length < 3) {
    return {
      ok: false,
      note: "The after is a state, not a sentence. What can they DO on the other side that they cannot do now?",
    };
  }
  return { ok: true, note: "" };
}

const NON_ARTIFACTS = [
  "strategy", "clarity", "confidence", "mindset", "knowledge", "understanding",
  "insight", "guidance", "support", "advice", "coaching", "training",
  "awareness", "growth", "transformation",
];

export function critiqueOutput(v: string): Critique {
  const s = v.trim();
  if (s.length < 3) return { ok: false, note: "" };
  const lower = s.toLowerCase();
  const abstract = NON_ARTIFACTS.find((w) => lower === w || lower === `${w} plan` || lower.startsWith(`${w} `) && lower.split(/\s+/).length <= 2);
  if (abstract) {
    return {
      ok: false,
      note: `"${s}" is a subject, not an artifact. What do they physically have at the end — a document, a pack, a schedule, a template?`,
    };
  }
  if (s.split(/\s+/).length < 4) {
    return {
      ok: false,
      note: "Name the thing that changes hands. If you cannot email it or hand it over, it is not the output yet.",
    };
  }
  return { ok: true, note: "" };
}

// ─── The price mirror ───────────────────────────────────────────────────────
//
// Four bands. The spec gives the two that matter most verbatim; the other two
// follow the same logic — answer back, do not just accept the number.

export interface PriceVerdict {
  band: "thank-you" | "low" | "real" | "serious";
  headline: string;
  body: string;
}

export function priceMirror(rand: number | null): PriceVerdict | null {
  if (rand == null || Number.isNaN(rand) || rand <= 0) return null;

  if (rand < 250) {
    return {
      band: "thank-you",
      headline: "That is a thank-you, not a price.",
      body: "At this number you are not running a business, you are accepting a gesture. Nobody values what costs them nothing to lose. Put a real number on it.",
    };
  }
  if (rand < 1000) {
    return {
      band: "low",
      headline: "This is priced like a product, but you are selling judgement.",
      body: "Under a thousand rand, a buyer files this next to an ebook. Your expertise took years. Price it where it gets treated seriously, or package it as the way in to something bigger.",
    };
  }
  if (rand <= 5000) {
    return {
      band: "real",
      headline: "That is a real price. Now say it out loud.",
      body: "Say the number to yourself, at full volume, as if a client just asked. If it came out easily, add forty percent — easy means you are still pricing for your own comfort, not for the work.",
    };
  }
  return {
    band: "serious",
    headline: "That is a serious number, and it needs a serious output.",
    body: "At this level nobody argues about price, they argue about proof. Make sure the output above is specific enough that they can see exactly what lands on their desk.",
  };
}

/** Suggested bump when the price came out too easily. */
export function nudgeUp(rand: number): number {
  return Math.round((rand * 1.4) / 50) * 50;
}

// ─── The assembled sentence ─────────────────────────────────────────────────
//
// Shown live at the top of Tool 01, clauses turning gold as they fill. The whole
// point of assembling it as they type is that a half-finished sentence is
// visibly half-finished — far more motivating than a progress bar.

export function assembleSentence(o: Offer): string {
  const who = o.who.trim() || "…";
  const from = o.from.trim() || "…";
  const to = o.to.trim() || "…";
  const time = o.timeframe.trim() || "…";
  const output = o.output.trim() || "…";
  return `I help ${who} go from ${from} to ${to} in ${time}, and they walk away with ${output}.`;
}

export function offerCompleteness(o: Offer): number {
  const fields = [o.who, o.from, o.to, o.timeframe, o.output, o.format, o.name];
  const filled = fields.filter((f) => f.trim().length > 1).length + (o.price ? 1 : 0);
  return Math.round((filled / 8) * 100);
}

export function isOfferComplete(o: Offer): boolean {
  return offerCompleteness(o) === 100;
}

// ─── Persistence ────────────────────────────────────────────────────────────
//
// localStorage, like every other tool in the kit. Device-local, which the spec
// flags as a real limitation — the hub says so plainly rather than letting
// someone lose an hour of work moving from phone to laptop.

export const OFFER_SPINE_KEY = "nochill-offer-spine-v1";

export function readOffer(): Offer {
  if (typeof window === "undefined") return EMPTY_OFFER;
  try {
    const raw = JSON.parse(localStorage.getItem(OFFER_SPINE_KEY) || "null");
    if (!raw || typeof raw !== "object") return EMPTY_OFFER;
    return { ...EMPTY_OFFER, ...raw };
  } catch {
    return EMPTY_OFFER;
  }
}

export function writeOffer(o: Offer) {
  try {
    localStorage.setItem(OFFER_SPINE_KEY, JSON.stringify(o));
  } catch {
    /* quota or private mode — the tool still works for this session */
  }
}

// ─── Carry-forward ──────────────────────────────────────────────────────────
//
// The functions every OTHER tool calls. This is the actual product: the rate
// card is titled with their buyer, Day 7 of the calendar names their offer, the
// invoice line item is their output, the fifth email closes with their price.
//
// Each returns null when the spine is empty, so a tool opened first still works
// standalone — it just cannot pre-fill.

export function rateCardTitle(o: Offer): string | null {
  if (!o.who.trim() || !o.name.trim()) return null;
  return `${o.name.trim()} — rates for ${o.who.trim()}`;
}

export function invoiceLineItem(o: Offer): string | null {
  if (!o.output.trim()) return null;
  const name = o.name.trim();
  return name ? `${name}: ${o.output.trim()}` : o.output.trim();
}

/** Day 7 of the 30-day calendar is always the first Earn day. */
export function earnDayPrompt(o: Offer): string | null {
  if (!o.name.trim()) return null;
  const price = o.price ? `R${o.price.toLocaleString("en-ZA")}` : "what it costs";
  return `What ${o.name.trim()} is, who it is for, and ${price === "what it costs" ? price : `that it is ${price}`}.`;
}

export function closingLine(o: Offer): string | null {
  if (!o.name.trim() || !o.price) return null;
  return `${o.name.trim()} is R${o.price.toLocaleString("en-ZA")}. If that is a yes, reply and I will send the invoice today.`;
}

/** The one-person ask used by Tool 10 · The Send. */
export function theAsk(o: Offer, name: string): string | null {
  if (!o.who.trim() || !o.to.trim() || !o.name.trim()) return null;
  const price = o.price ? ` It is R${o.price.toLocaleString("en-ZA")}.` : "";
  const to = name.trim() || "there";
  return `Hi ${to} — I have put together something called ${o.name.trim()}. It is for ${o.who.trim()}, and it gets them to ${o.to.trim()}${o.timeframe.trim() ? ` in ${o.timeframe.trim()}` : ""}. You would walk away with ${o.output.trim()}.${price}\n\nWould you like me to send you the details?`;
}

/** The sentence that defends the price when they push back. */
export function defendingSentence(o: Offer): string | null {
  if (!o.output.trim() || !o.to.trim()) return null;
  return `You are not paying for my time. You are paying to get to ${o.to.trim()} without spending the next year working it out yourself — and you keep ${o.output.trim()}.`;
}

// ─── The magnet (Tool 04) ───────────────────────────────────────────────────
//
// This is River → Fish → Tank made operational. The framework is sold on the
// Starter Kit page and in Accelerator Phase 4, and until now was taught in no
// tool anywhere — a framework mentioned twice and demonstrated never.
//
// The magnet IS the thing that moves a fish out of the river and into the tank.
// So the tool is not "make a freebie", it is "build the net", and it says so.

export type MagnetShape = "checklist" | "template" | "script" | "audit";

export interface Magnet {
  shape: MagnetShape | null;
  title: string;
  /** The five points of the actual page. */
  points: string[];
}

export const EMPTY_MAGNET: Magnet = { shape: null, title: "", points: [] };

export interface ShapeSpec {
  key: MagnetShape;
  label: string;
  /** When this shape is the RIGHT choice — the spec is explicit that each needs one. */
  whenRight: string;
  /** Why it converts, in one line. */
  why: string;
  /** Builds the five-point outline from their own offer. */
  outline: (o: Offer) => string[];
  titleFor: (o: Offer) => string;
}

// Every shape steers small. A one-page checklist out-converts a forty-page
// ebook because people believe they will finish it — and a magnet nobody
// finishes never earns the trust that makes the next email get opened.
export const MAGNET_SHAPES: ShapeSpec[] = [
  {
    key: "checklist",
    label: "A one-page checklist",
    whenRight: "Your buyer keeps forgetting steps, or does them in the wrong order.",
    why: "Highest completion rate of any format. They can finish it before their coffee goes cold.",
    titleFor: (o) => `The ${o.to.trim() ? capFirst(stripLead(o.to)) : "Ready"} Checklist`,
    outline: (o) => [
      `The one line that says who this is for: ${o.who.trim() || "your buyer"}.`,
      `Between 7 and 12 checkboxes — the exact steps to get from ${stripLead(o.from) || "where they are"} to ${stripLead(o.to) || "where they want to be"}.`,
      "Mark the two or three that people most often skip. That is the part they will screenshot.",
      "One line under the list: what to do if they cannot tick a specific box.",
      `A closing line naming ${o.name.trim() || "your offer"} as what happens when they want it done properly.`,
    ],
  },
  {
    key: "template",
    label: "A fill-in template",
    whenRight: "Your buyer knows what to produce but stares at a blank page.",
    why: "Removes the blank page, which is the actual blocker — not the knowledge.",
    titleFor: (o) => `The ${o.output.trim() ? firstNoun(o.output) : "One-Page"} Template`,
    outline: (o) => [
      `A worked example, filled in, from a real ${o.who.trim() || "client"} situation. Show it complete before you show it empty.`,
      "The same template, blank, with bracketed prompts in every gap.",
      "A short note under each section on what a weak answer looks like.",
      "One rule for using it — the thing you would say if you were sitting next to them.",
      `A line at the end: this is one part of ${o.name.trim() || "the full thing"}.`,
    ],
  },
  {
    key: "script",
    label: "A word-for-word script",
    whenRight: "Your buyer knows what to do but freezes on what to actually say.",
    why: "Scripts get used the same day. Nothing else you give away gets used the same day.",
    titleFor: (o) => `What To Say When ${o.from.trim() ? capFirst(stripLead(o.from)) : "It Gets Hard"}`,
    outline: (o) => [
      "The exact opening line, in quotes, ready to copy.",
      "Three things they will hear back — and the reply to each, also in quotes.",
      "The one sentence never to say, and why it costs them.",
      `A short before-and-after: what ${o.who.trim() || "someone"} said before, and what happened after.`,
      `The line that points at ${o.name.trim() || "your offer"} when they want the whole conversation handled.`,
    ],
  },
  {
    key: "audit",
    label: "A five-minute self-audit",
    whenRight: "Your buyer does not yet believe they have the problem you solve.",
    why: "Scores it for them. A number they generated themselves argues better than you can.",
    titleFor: (o) => `Are You ${o.to.trim() ? capFirst(stripLead(o.to)) : "Ready"}? A 5-Minute Audit`,
    outline: (o) => [
      "Eight to ten questions, each asking whether a specific thing EXISTS. Never how they feel about it.",
      "A simple score — every yes is a point, so they can add it up without a calculator.",
      "Three bands, each with what it means and the single next action for that band.",
      `Name the one gap that shows up most often in ${o.who.trim() || "people like them"}.`,
      `The bottom band leads to ${o.name.trim() || "your offer"}. The top band gets told to go do the next thing themselves — that honesty is what makes the rest believable.`,
    ],
  },
];

function stripLead(s: string): string {
  return s.trim().replace(/^(being|feeling|having|getting|to be|to have)\s+/i, "");
}
function capFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function firstNoun(s: string): string {
  const w = s.trim().split(/\s+/).filter((x) => x.length > 3);
  return capFirst(w[0] ?? "One-Page");
}

export function shapeByKey(k: MagnetShape | null): ShapeSpec | null {
  return MAGNET_SHAPES.find((s) => s.key === k) ?? null;
}

/** The sentence that actually asks for the email. The whole tank depends on it. */
export function optInLine(o: Offer, m: Magnet): string | null {
  if (!m.title.trim()) return null;
  const who = o.who.trim() || "you";
  return `${m.title.trim()} — free. If you are ${who.toLowerCase().startsWith("a ") || who.toLowerCase().startsWith("an ") ? who.toLowerCase() : `a ${who.toLowerCase()}`}, put your email in and I will send it now.`;
}

export const MAGNET_KEY = "nochill-magnet-v1";

export function readMagnet(): Magnet {
  if (typeof window === "undefined") return EMPTY_MAGNET;
  try {
    const raw = JSON.parse(localStorage.getItem(MAGNET_KEY) || "null");
    return raw && typeof raw === "object" ? { ...EMPTY_MAGNET, ...raw } : EMPTY_MAGNET;
  } catch {
    return EMPTY_MAGNET;
  }
}

export function writeMagnet(m: Magnet) {
  try {
    localStorage.setItem(MAGNET_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}
