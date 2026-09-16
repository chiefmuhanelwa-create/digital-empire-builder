// THE RESOURCE LIBRARY — seeded per user, then owned by them.
//
// Every row carries the measurement behind it. That `evidence` column is the
// whole difference between a library and a swipe file: a user can see why a
// line is here, and retire it the moment their own numbers disagree.
//
// The defaults are measured on ONE account. Shipping one creator's numbers to
// every creator as law is the failure this product exists to correct — so the
// evidence line is not decoration, it is the caveat travelling with the claim.

export type SeedResource = {
  kind: "hook" | "visual_hook" | "cta" | "prompt" | "rehook";
  title: string;
  body?: string;
  evidence?: string;
  pillar?: string;
};

export const LIBRARY_KINDS = [
  { key: "hook", label: "Hooks", blurb: "The spoken first line. Second person, presupposes income." },
  { key: "visual_hook", label: "Visual Hooks", blurb: "The card on screen at 0:00. Different words from the voice. Must land on mute." },
  { key: "rehook", label: "Rehooks", blurb: "Beat 5 and beat 9. The exit point and the battery." },
  { key: "cta", label: "CTAs", blurb: "Comment WORD → the thing. Only keywords that resolve." },
  { key: "prompt", label: "Prompts", blurb: "Angles by pillar, each one a leak the viewer already has." },
] as const;

export const SEED_LIBRARY: SeedResource[] = [
  // ── HOOKS ──────────────────────────────────────────────────────────────────
  { kind: "hook", pillar: "PRICE IT",
    title: "You are accepting R750 for brand deals worth R15,000.",
    body: "The measured shape: their words on the left, the harm on the right, both before 0:05.",
    evidence: "25,300 reach — the account's best-performing spoken hook." },
  { kind: "hook", pillar: "KEEP IT",
    title: "If you're making money on your phone, you already owe SARS — and nothing has arrived to tell you.",
    body: "Presupposes income. The viewer who earns nothing has nothing for this to land on.",
    evidence: "23,100 reach. TAX converts at 8.68% on a third of the traffic." },
  { kind: "hook", pillar: "PRICE IT",
    title: "You've got a rate you never actually worked out — and the person reading your quote can tell.",
    evidence: "Money-presupposing hooks measured ~2× against follower-presupposing ones (25,300 vs 11,400)." },
  { kind: "hook", pillar: "OWN IT",
    title: "Your account can end tonight. Not suspended — ended. And there's nobody to phone.",
    evidence: "Platform-risk framing. The appeal cluster runs 90,000+ searches/month." },
  { kind: "hook", pillar: "PROVE IT",
    title: "You finished the campaign, you posted, you got paid — and the brand has no idea whether it worked.",
    evidence: "Second-person accusation shape: 22,800 vs 1,676 for the category version." },
  { kind: "hook", pillar: "BUILD IT ANYWAY",
    title: "You're waiting until you can go full time. That's why it's been three years and there's nothing built.",
    evidence: "`9 to 5` is 2,434/mo in ZA and unclaimed." },

  // ── VISUAL HOOKS ───────────────────────────────────────────────────────────
  { kind: "visual_hook", title: "YOU ALREADY OWE SARS",
    body: "4–6 words, capitals, static for 3 seconds, no cut.",
    evidence: "Lowest skip rate measured at 42.1%. A number is not specificity — a number they can locate themselves in is." },
  { kind: "visual_hook", title: "THE LETTER ITSELF",
    body: "Their notice, assessment or refusal on screen, in its own words. Redact hard — no employer, agency, practitioner or reference numbers.",
    evidence: "29,000 — the account's best post. 5.3× the same event narrated in his own words." },
  { kind: "visual_hook", title: "YOU GUESSED YOUR RATE",
    body: "Command or accusation + a concrete noun.",
    evidence: "Command + concrete noun: 25,000. The same command with a category noun: 2,388." },
  { kind: "visual_hook", title: "780 000 GONE",
    body: "⚠️ Never dated. No cause attributed.",
    evidence: "48.8% skip. Above 54% skip, no post has exceeded 3,000 views — 6 of 6." },
  { kind: "visual_hook", title: "⛔ AVOID — the calculation card",
    body: "An exact sum on the opening card.",
    evidence: "Math proof demoted: 5,461 and 2,956." },

  // ── REHOOKS ────────────────────────────────────────────────────────────────
  { kind: "rehook", title: "Beat 5 · THE LOOP — optimises comments",
    body: "\"Then one conversation changed everything.\" Opens a question, pays off at ~35%. They leave holding it.",
    evidence: "613 comments, 3.38% on the rate reel." },
  { kind: "rehook", title: "Beat 5 · THE LAW — optimises shares",
    body: "\"Every rand that came in, a chunk of it belonged to SARS.\" Completes the lesson here. They leave having got the point.",
    evidence: "225 shares, 1.41% on the SARS reel. You cannot have both — pick the product before you write the line." },
  { kind: "rehook", title: "Beat 9 · THE BATTERY",
    body: "3–5 questions they will FAIL, escalating, with the pre-emption: \"Not roughly. Not 'I think I'm fine.'\"",
    evidence: "The strongest single device measured on the account." },
  { kind: "rehook", title: "Mid-list escalation",
    body: "Put a rehook at item two of five, not only between beats.",
    evidence: "Observed on two unrelated outside accounts." },
  { kind: "rehook", title: "⛔ REJECTED — hype-up",
    body: "\"This is the best thing in the world.\"",
    evidence: "Exactly the tell this audience reads as hype. Fails the filter." },

  // ── CTAs ───────────────────────────────────────────────────────────────────
  { kind: "cta", title: "Comment TAX",
    body: "\"Comment TAX and I'll send you the reserve calculator — you put in what landed this month, it tells you what to move before you touch it.\"",
    evidence: "8.68% conversion. Best-converting keyword on the account." },
  { kind: "cta", title: "Comment RATE",
    body: "\"Comment RATE and I'll send you the calculator — you put in your reach, your engagement and your niche, and it builds the rate card for you.\"",
    evidence: "5.75% conversion, on 3× the traffic of TAX." },
  { kind: "cta", title: "The closing question",
    body: "Answerable in four words. Comes after the ask, never instead of it.",
    evidence: "Beat 11. Convert, then reopen." },
  { kind: "cta", title: "⛔ Free tool beats purchase",
    body: "Send them to a diagnostic, not a checkout, on a cold piece.",
    evidence: "Free-tool CTAs: 25,300 and 23,100. Purchase CTAs: 11,900 and 11,400." },
  { kind: "cta", title: "⛔ Never \"DM me\"",
    body: "Comment a keyword. A DM ask cannot be automated and cannot be counted.",
    evidence: "320 orphaned comments already sit on keywords with no destination." },

  // ── PROMPTS ────────────────────────────────────────────────────────────────
  { kind: "prompt", pillar: "KEEP IT", title: "The bill nobody warns you about",
    body: "Tax starts at the first paid post, not at registration.", evidence: "`sars` ~13,089/mo ZA." },
  { kind: "prompt", pillar: "KEEP IT", title: "What you're allowed to deduct",
    body: "Phone, data, ring light — tax paid on money already spent.", evidence: "3,462/mo, competition 8.5." },
  { kind: "prompt", pillar: "PRICE IT", title: "What they're actually buying",
    body: "Not the post — usage, duration, whether ad spend goes behind your face.", evidence: "`usage rights` — highest opportunity score in the pricing pull." },
  { kind: "prompt", pillar: "PRICE IT", title: "The invoice that can't be paid",
    body: "No banking details, no due date, no clock.", evidence: "Late-payment content: 1,710× outlier, 1.6M views." },
  { kind: "prompt", pillar: "PROVE IT", title: "The report nobody asked for",
    body: "One page after every campaign. It's why you get called back — not the post.", evidence: "Behavioural proof, E1, does not decay." },
  { kind: "prompt", pillar: "OWN IT", title: "Owning a list isn't reaching it",
    body: "1,246 → 148 in 25 days, only 28 unsubscribes.", evidence: "The quieter half of platform risk." },
  { kind: "prompt", pillar: "BUILD IT ANYWAY", title: "An hour a day is nine working weeks",
    body: "365 hours a year you think you don't have.", evidence: "One hour a day for two years produced the first book." },
];

export const KANBAN_COLUMNS = [
  { key: "idea", label: "Idea", tone: "slate" },
  { key: "scripted", label: "Scripted", tone: "blue" },
  { key: "recorded", label: "Ready to edit", tone: "amber" },
  { key: "edited", label: "Ready to post", tone: "violet" },
  { key: "scheduled", label: "Scheduled", tone: "emerald" },
  { key: "posted", label: "Posted", tone: "gold" },
] as const;

export function nextStatus(s: string): string | null {
  const i = KANBAN_COLUMNS.findIndex((c) => c.key === s);
  return i >= 0 && i < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[i + 1].key : null;
}
export function prevStatus(s: string): string | null {
  const i = KANBAN_COLUMNS.findIndex((c) => c.key === s);
  return i > 0 ? KANBAN_COLUMNS[i - 1].key : null;
}
