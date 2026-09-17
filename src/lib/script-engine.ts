// THE SCRIPT ENGINE — two houses, written side by side. Pure, no AI.
//
// NOCHILL and JATHO are not two settings on one system. They optimise for
// different things and the evidence does not settle which is better for this
// account, so the tool builds both and refuses to pick.
//
//   NOCHILL   90–105s · confession-led · FW-147 eleven beats · saves + comments
//             Measured on his own completion data. 69.4s produced 15.7%.
//   JATHO     23–45s · prohibition-led · tap-path steps · seamless loop · shares
//             Measured on a different account, different niche, different offer.
//             Top three there: 0:23, 0:23, 0:45. That is about THEIR audience.
//
// Everything below is a template with slots, not generated prose. A generator
// that writes the sentences would need the ledger in its head; a generator that
// writes the STRUCTURE and hands over the slots cannot invent a figure.

export type Style = "nochill" | "jatho";

export const STYLES = [
  {
    key: "nochill" as Style,
    name: "NoChill",
    tag: "Confession-led",
    runtime: [90, 105] as [number, number],
    optimises: "Saves and comments",
    basis: "His own completion data. Above ~160s completion collapses under 12%; 69.4s produced 15.7%.",
    formats: [
      { key: "epiphany", label: "Epiphany", when: "A method he runs himself, with an embarrassing before-state" },
      { key: "case_study", label: "Case Study", when: "A receipt with a mechanism behind it" },
      { key: "explainer", label: "Explainer", when: "A correction someone gave him · a rule that costs money · a repeat DM question" },
    ],
  },
  {
    key: "jatho" as Style,
    name: "Jatho",
    tag: "Mechanic-led",
    runtime: [23, 45] as [number, number],
    optimises: "Shares and reach",
    basis: "⚠️ Measured on someone else's account, niche and audience. Borrowed, not proven here — run it as a test, not a switch.",
    formats: [
      { key: "prohibition", label: "Prohibition", when: "A thing they already do that quietly costs them" },
      { key: "tap_path", label: "Tap path", when: "A checkable mechanic — a setting, a number already in their phone" },
    ],
  },
] as const;

// ── The hook gate ────────────────────────────────────────────────────────────

/** The fourteen shapes that survived 69 templates. Every one accuses somebody
 *  who is ALREADY EARNING — the one thing the source library never did. */
export const HOOK_SHAPES = [
  { key: "sole_agent", label: "Sole-agent accusation", template: "You're the only person who has ever agreed to {thing}.", note: "Best line in 69 rows. Pure second person, no promise, no number." },
  { key: "conditional", label: "Conditional accusation", template: "If {money event happened this year}, you might be in trouble.", note: "Presupposes money in seven words." },
  { key: "borrowed_authority", label: "Borrowed authority", template: "This isn't even my opinion. It's the line in {their own document}.", note: "Matches the 5.3× institution finding. The authority is a DOCUMENT, never a named person." },
  { key: "event_callout", label: "Event callout", template: "So you just {did the thing} and {the gap}. Here's what you do now.", note: "Presupposes the event already happened, then attaches a rescue." },
  { key: "volume_credential", label: "Volume credential", template: "I've invoiced {N} brands and {N} agencies. One line changed what all of them paid.", note: "Quantity of experience, not a result claim. Costs no credibility." },
  { key: "false_binary", label: "False binary, broken", template: "{Thing} isn't about you versus {them}. You were never in the room where {the decision} was made.", note: "" },
  { key: "substitution", label: "The substitution", template: "Don't send {the popular thing}. Send {this} instead.", note: "" },
  { key: "time_credential", label: "Time credential", template: "There's no reason it should take you {N} years to find out {the thing}.", note: "" },
  { key: "prohibition", label: "The prohibition", template: "Never {the thing they already do} without {the thing they've never heard of}.", note: "⚠️ The object must be MONEY. Posting measured 11,400; money measured 25,300." },
  { key: "confession_open", label: "The confession", template: "I just found out I've been doing {X} wrong.", note: "⚠️ Never 'my whole life' — overreach, and untrue." },
  { key: "named_outcome", label: "Named-outcome mistake", template: "People who {do X} always make one mistake that ends up {specific bad outcome}.", note: "Usable ONLY because the outcome is named. Without it, a curiosity gap." },
  { key: "red_flags", label: "Red flags", template: "{N} red flags to look for in {a brief · a contract · a payment term}.", note: "Concrete and listable." },
  { key: "superlative", label: "Volume superlative", template: "Out of {N} brands and {N} agencies, the hardest one to {do the thing} was {the one}.", note: "" },
  { key: "handover", label: "Pre-built handover", template: "So, just like you, I struggled with {X} until {Y}.", note: "⚠️ Only with a ledger figure attached." },
] as const;

/** Screen text. Verdict on screen, evidence in the voice — never a compression
 *  of the spoken line. The reel where they matched took 11,953, the weakest of
 *  the top four. */
export const SCREEN_BANK = [
  { text: "THEY HAD MORE BUDGET", object: "The brand's last email, full frame, sender redacted" },
  { text: "THE MISSING NUMBER", object: "A real rate card with one line blank" },
  { text: "SPENT IT ALREADY", object: "A bank notification, amount visible, name gone" },
  { text: "YOU CANNOT EXPORT IT", object: "The follower count on a phone screen" },
  { text: "NOT A SALARY", object: "A platform earnings dashboard, final month" },
  { text: "TOOLS UNLOCKED NOTHING", object: "The monetisation tab, all green, zero balance" },
  { text: "ONE PLACE ONLY", object: "A single payout screen" },
  { text: "THE PHONE IS ENOUGH", object: "The phone on a desk, nothing else" },
  { text: "PRICED AS A GENERALIST", object: "Three different brand briefs, fanned" },
  { text: "THE FAST YES", object: "A timestamp: sent 14:02, accepted 14:06" },
  { text: "YOU ALREADY OWE", object: "An assessment letter, every identifier redacted" },
] as const;

export const CATEGORY_WORDS = ["creators", "creator", "audience", "entrepreneurs", "9 to 5", "people", "everyone", "content"];

export type HookCandidate = {
  text: string;
  shape: string;
  screen: string;
  r: number; a: number; c: number; u: number; b: number;
  note?: string;
};

export type HookVerdict = {
  passes: boolean;
  failures: string[];
  warnings: string[];
  score: number;
  screenWords: number;
};

/** Step 0 is pass/fail and runs before scoring. A hook failing it does not
 *  enter the table at all. */
export function judgeHook(h: HookCandidate): HookVerdict {
  const fail: string[] = [];
  const warn: string[] = [];
  const t = (h.text || "").trim();
  const lower = t.toLowerCase();

  if (!/\b(you|you're|your|youve|you've)\b/i.test(t))
    fail.push("Not second person. The hook is about the viewer, never about him.");

  if (/\b(i|my|me)\b/i.test(t.split(/[.!?]/)[0] ?? "") && !/\byou\b/i.test(t.split(/[.!?]/)[0] ?? ""))
    fail.push("His story is in beat 1's chair. Measured 22.6% completion against 27.8% and 29.7% — it belongs at beat 3.");

  if (/this (video|one) is (only )?for\b|if this is you|this is for you/i.test(t))
    fail.push("The qualifier hook. Measured 1,683 views — the weakest reel in the set. An accusation does not ask permission.");

  if (/\b(instantly|guaranteed|once and for all|say goodbye|you won'?t believe|10k a month|get rich)\b/i.test(lower))
    fail.push("Hype tell. Fails Sustainable — an implied income guarantee passes the maths and fails the filter.");

  if (/\b(beginner|beginners|relatively new|starting out|no experience)\b/i.test(lower))
    fail.push("Beginner-targeted. That is the segment that caps at R350 and cannot buy.");

  if (/\byou guys|you all|y'?all\b/i.test(lower))
    fail.push("Plural breaks the one-YOU rule.");

  // Does it presuppose money already earned?
  const money = /\b(paid|pay|price|priced|quote|quoted|charge|charging|rate|invoice|brand|client|deal|owe|earn|earned|budget|fee|r\d|rand)\b/i;
  if (!money.test(lower))
    warn.push("Does not obviously presuppose money already earned. Money-presupposing hooks measured ~2× (25,300 vs 11,400).");

  const screen = (h.screen || "").trim();
  const screenWords = screen ? screen.split(/\s+/).length : 0;
  if (screenWords > 5) fail.push(`Screen text is ${screenWords} words. Hard limit is five, two lines, 130px, reads on mute.`);
  if (/[.,;:!?]/.test(screen)) warn.push("Punctuation on screen. It is a graphic, not a sentence.");

  const hitCategory = CATEGORY_WORDS.find((w) => screen.toLowerCase().includes(w));
  if (hitCategory)
    fail.push(`"${hitCategory}" is a category word. STOP CHARGING PEANUTS did 25,000; the same command with a category noun did 2,388.`);

  // MAX ALIGNMENT — R3, ruled 2026-09-17.
  //
  // The card IS a compression of the spoken line: different WORDS, the SAME
  // MEANING, never a second idea. An earlier version of this check said
  // "screen states the VERDICT, voice gives the EVIDENCE" and warned on
  // compression — that is overturned. Reading the rule as "make them say
  // different things" cost a 350x view gap on alignment alone.
  //
  // Two failures at opposite ends; only the middle is right:
  //   too much word overlap → verbatim reuse, the card adds nothing
  //   none at all           → a second idea, the 350x failure
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  const sw = new Set(norm(screen));
  const contentWords = norm(t).filter((w) => w.length > 3);
  const overlap = contentWords.filter((w) => sw.has(w)).length;
  const screenContent = [...sw].filter((w) => w.length > 3).length;

  if (screen && screenContent > 0 && contentWords.length > 0) {
    if (overlap >= Math.max(2, screenContent))
      warn.push("The card reuses the spoken words verbatim. Same MEANING is required; the same WORDS are not — compress it differently.");
    else if (overlap === 0)
      warn.push("The card shares no content word with the spoken line. Different words, SAME meaning — a card carrying a second idea is the 350x alignment failure (R3).");
  }

  return { passes: fail.length === 0, failures: fail, warnings: warn, score: hookScore(h), screenWords };
}

/** R × A × C × U^B. Unique is raised to the power of Broadened by design: a
 *  merely-unique story that doesn't generalise isn't worth leading with. */
export function hookScore(h: HookCandidate): number {
  const { r = 0, a = 0, c = 0, u = 0, b = 0 } = h;
  if (!r || !a || !c || !u || !b) return 0;
  return Math.round(r * a * c * Math.pow(u, b / 5) * 10) / 10;
}

export const HORSEMEN = [
  { key: "delay", label: "Delay", failure: "Payoff too far from the first frame", fix: "Put the number in the first three words" },
  { key: "confusion", label: "Confusion", failure: "They can't tell what's being claimed", fix: "Keep the opening timeline linear" },
  { key: "irrelevance", label: "Irrelevance", failure: "Shocking, but not about them", fix: "Anchor to their anxiety, not a generic trope" },
  { key: "disinterest", label: "Disinterest", failure: "Real, but expected", fix: "Needs a specific number, not 'a lot more'" },
] as const;

// ── The beat maps ────────────────────────────────────────────────────────────

export type Beat = { t: string; name: string; job: string; slot: string; guard?: string };

export function buildBeats(style: Style, format: string, v: {
  hook: string; screen: string; symptom: string; moneyCost: string;
  story: string; receipt: string; outsideVoice: string; mechanism: string;
  cta: string; closing: string;
}): Beat[] {
  if (style === "jatho") {
    if (format === "tap_path") {
      return [
        { t: "0:00–0:03", name: "PROHIBITION", job: "Stop the scroll on a thing they already do", slot: v.hook, guard: "No cut. Screen carries the verdict, not these words." },
        { t: "0:03–0:06", name: "THE PAYOFF PROMISE", job: "What this does for them, stated flat", slot: v.moneyCost },
        { t: "0:06–0:26", name: "THE TAP PATH", job: "Every step is a sequence of taps AND every step ends in its own payoff", slot: v.mechanism, guard: "STEP = the tap path + what it does for you. 'Open the post, tap view insights, add the four numbers.' Never 'work out your engagement rate'." },
        { t: "0:26–0:32", name: "THE REASON STACK", job: "Numbered aloud, the number announced BEFORE the reason", slot: v.receipt, guard: "Put a rehook at item two of the list, not only between beats." },
        { t: "0:32–0:38", name: "THE SEAMLESS LOOP", job: "A clause that grammatically completes the opening line", slot: v.closing, guard: "Tail grammar: '<this line> <the hook>' must parse as ONE sentence, or the replay reads as a cut." },
      ];
    }
    return [
      { t: "0:00–0:03", name: "PROHIBITION", job: "Never / Stop + the thing they already do", slot: v.hook, guard: "⚠️ The object must be MONEY. Posting measured 11,400; money measured 25,300." },
      { t: "0:03–0:08", name: "THE COST", job: "What doing it costs, in rands or in a named consequence", slot: v.moneyCost },
      { t: "0:08–0:18", name: "THE MECHANIC", job: "The checkable thing. Verifiable in ten seconds, free to try", slot: v.mechanism },
      { t: "0:18–0:24", name: "THE RECEIPT", job: "One figure the ledger carries", slot: v.receipt, guard: "If the ledger doesn't carry it, the beat is wrong — not the receipt." },
      { t: "0:24–0:30", name: "THE SEAMLESS LOOP", job: "Completes the opening line grammatically", slot: v.closing, guard: "No CTA in this house. The loop replaces the outro." },
    ];
  }

  // NOCHILL — FW-147, eleven beats, 95s reference
  const base: Beat[] = [
    { t: "0:00–0:05", name: "1 · ACCUSATION", job: "Second person. Both clauses — symptom then harm — land before 0:05", slot: v.hook, guard: "⛔ NO CUT until ~5s. The scroll is stopped by the framing and the sentence, not by an edit." },
    { t: "0:05–0:11", name: "2 · ADMISSION", job: "Converts the accusation from an attack into a confession-in-advance", slot: "I know, because I did exactly this.", guard: "Without this beat, beat 1 is a stranger telling them off." },
    { t: "0:11–0:21", name: "3 · NAIVE ME", job: "First-person PAST-TENSE story. The belief as it felt at the time", slot: v.story, guard: "25–35 words. ⛔ NEVER second-person teaching here — the two reels that did are bottom two on saves AND comments." },
    { t: "0:21–0:26", name: "4 · CONFESSION", job: "The self-indictment. Flat, no defence, makes him look foolish not unlucky", slot: v.symptom, guard: "10–15 words. Hold the frame. No text over it — the one moment graphics get out of the way." },
    { t: "0:26–0:30", name: "5 · LOOP or LAW", job: "🔑 THE EXIT POINT. Loop → comments · Law → shares", slot: v.moneyCost, guard: "You cannot have both. Pick the product before you write the line." },
    { t: "0:30–0:44", name: "6 · OUTSIDE VOICE", job: "Someone tells him. He does not work it out", slot: v.outsideVoice, guard: "Reported speech, in quotes. ⛔ Never named — no employer, agency, practitioner or third party." },
    { t: "0:44–0:49", name: "7 · IMPACT", job: "What that sentence DID to him. Not what he learned", slot: "That sentence rewired how I quote.", guard: "Physical, immediate, personal." },
    { t: "0:49–1:07", name: "8 · MECHANISM", job: "The teaching. What he changed · the receipt · the law generalised to YOU", slot: v.mechanism, guard: "PLAIN SPEECH: every part is NAME IT → SAY WHAT IT MEANS → SAY WHAT TO DO. Never three labels in a row. Replace the metric name with what the number does. Name the framework HERE, never at beat 1, and say what it means in the same breath. Must contain the absolution: 'They're not trying to rob you. They're just never going to correct you.' Without it, everything before reads as grievance." },
    { t: "1:07–1:16", name: "9 · BATTERY", job: "🔑 Three to five questions they will FAIL, escalating", slot: "So let me ask you. …? Not roughly. Not 'I think I'm fine.' The exact number.", guard: "Include the pre-emption. It closes the escape hatch of a vague answer." },
    { t: "1:16–1:22", name: "10 · VERDICT + SERVICE", job: "Absolve, then serve", slot: "If that's a no, you're not careless. You were never taught this. I went through it so you don't have to.", guard: "" },
    { t: "1:22–1:35", name: "11 · CTA + QUESTION", job: "Convert, then reopen", slot: v.cta, guard: "Comment [WORD] → what they put in → the closing question, answerable in four words. ⛔ Never 'DM me'." },
  ];

  if (format === "case_study")
    base[2] = { ...base[2], name: "3 · THE RECEIPT", job: "The figure and the mechanism behind it, first person, past tense", slot: v.receipt };
  if (format === "explainer")
    base[2] = { ...base[2], name: "3 · THE CORRECTION", job: "The correction someone gave him, as it arrived", slot: v.outsideVoice };

  return base;
}

/** The five parts of every ask. Three independent accounts, same rule:
 *  never a like, never a follow. */
export function buildCta(keyword: string, artifact: string, purpose: string): string {
  const k = (keyword || "WORD").trim().toUpperCase();
  return `Comment ${k} and I'll send you ${artifact || "[the artifact, named by what they put into it]"} — ${purpose || "[so you can …]"}`;
}

export const REHOOKS = [
  { key: "negative_assumption", label: "Negative assumption", template: "And no — I didn't {hype 1}, I didn't {hype 2}, and I didn't {hype 3}. I did {the thing}.", note: "The sleeper, and the best fit here. Names an enemy without attacking a person." },
  { key: "document_authority", label: "Authority = a DOCUMENT", template: "That's not me saying it. That's the line in {their own email · the assessment · the brief}.", note: "⚠️ Never a named person. What measured 5.3× was quoting an institution." },
  { key: "correction", label: "The correction", template: "First, don't {the common mistake}. Instead, {the thing to do}.", note: "Cleanest shape in the set." },
  { key: "concession", label: "Concession then redirect", template: "Don't get me wrong, {what they do} is fine — but {the other thing} is what gets paid.", note: "Corrects without humiliating." },
  { key: "permission", label: "The permission reframe", template: "I'm not saying {drastic action}. But {the belief they hold} has never once {got them the outcome}.", note: "" },
  { key: "risk_reversal", label: "Risk reversal, stripped", template: "It takes {N} minutes and it costs you nothing. That's the whole thing.", note: "Cost and time, both true. No promise about results." },
  { key: "physical", label: "The physical instruction", template: "Stop. Open {the thing} and find {the number}. I'll wait.", note: "A physical action mid-video raises commitment. A tap path in disguise." },
  { key: "one_line_story", label: "Personal story, one line", template: "This is the exact thing that took me from {ledger figure} to {ledger figure}.", note: "⚠️ Only with two ledger figures." },
] as const;

/** Two rehooks per script. Never three. */
export const REHOOK_RULE = "One at the 30% seam, one before the last step. Credibility, never drama.";

export type ScriptWarning = { severity: "stop" | "warn"; message: string };

/** PLAIN SPEECH — ruled 2026-09-17. No term stands alone.
 *  A word the listener has to already know is a word that loses them, and they
 *  do not rewind. Each of these must be followed by its meaning, replaced with
 *  the plain phrase, or deleted. */
const JARGON: { term: RegExp; plain: string }[] = [
  { term: /\bengagement rate\b/i, plain: "the bigger that number, the higher your price" },
  { term: /\breach\b/i, plain: "how many people saw them" },
  { term: /\busage rights?\b/i, plain: "when the brand puts your video in their own adverts" },
  { term: /\bwhitelisting\b/i, plain: "when they run ads through your account, using your face" },
  { term: /\bexclusivity\b/i, plain: "when you agree not to work with anyone like them for a while" },
  { term: /\bretainer\b/i, plain: "the same work every month, paid every month" },
  { term: /\bprovisional tax\b/i, plain: "you pay SARS twice a year, before they ask" },
  { term: /\bpaid media\b/i, plain: "their own adverts" },
  { term: /\bdeliverables?\b/i, plain: "what you're actually making for them" },
  { term: /\bconversion\b/i, plain: "whether anybody buys" },
  { term: /\bassets?\b/i, plain: "the things you own" },
  { term: /\bscope\b/i, plain: "what's included, and what isn't" },
];

/** A term counts as explained if a plain gloss follows it in the same or the
 *  next sentence — "that's…", "it just means…", "which is…". */
export function plainSpeechWarnings(text: string): ScriptWarning[] {
  if (!text?.trim()) return [];
  const out: ScriptWarning[] = [];
  for (const { term, plain } of JARGON) {
    const m = term.exec(text);
    if (!m) continue;
    const after = text.slice(m.index, m.index + 260).toLowerCase();
    const glossed = /(that'?s|it just means|which is|meaning|in other words|i mean|that is)\b/.test(after);
    if (!glossed)
      out.push({
        severity: "warn",
        message: `"${m[0]}" stands alone. Say what it means in the next sentence, or use the plain phrase: "${plain}".`,
      });
  }
  return out;
}

export function scriptWarnings(args: {
  style: Style; runtime: number | null; ctaKeyword: string; wired: string[];
  receipt: string; story: string; closing: string; hook: string;
}): ScriptWarning[] {
  const out: ScriptWarning[] = [];
  const [lo, hi] = STYLES.find((s) => s.key === args.style)!.runtime;

  if (args.runtime && (args.runtime < lo || args.runtime > hi))
    out.push({ severity: "warn", message: `${args.runtime}s sits outside the ${lo}–${hi}s band for this house.` });

  if (args.ctaKeyword?.trim()) {
    const wired = args.wired.map((w) => w.trim().toUpperCase());
    if (!wired.includes(args.ctaKeyword.trim().toUpperCase()))
      out.push({ severity: "stop", message: `"${args.ctaKeyword.trim().toUpperCase()}" has no destination. No new keyword ships before its asset exists — a keyword with nothing behind it is a broken promise.` });
  }

  out.push(...plainSpeechWarnings([args.hook, args.receipt, args.story, args.closing].join(" ")));

  if (args.style === "nochill" && !args.story.trim())
    out.push({ severity: "stop", message: "No beat-3 story. Every reel with one outperformed every reel without: 17.3 saves per 1,000 against 5.7." });

  if (!args.receipt.trim())
    out.push({ severity: "warn", message: "No receipt. A confession without a receipt is a diary." });

  if (args.style === "jatho" && args.closing.trim() && args.hook.trim()) {
    const joined = `${args.closing.trim()} ${args.hook.trim()}`;
    if (!/[a-z,]\s+[A-Za-z]/.test(joined))
      out.push({ severity: "warn", message: "Tail grammar: read '<closing> <hook>' aloud as one sentence. If it doesn't parse, the replay reads as a cut rather than a loop." });
  }

  return out;
}
