// ── THE FOUNDATION KIT WORKBOOKS ────────────────────────────────────────────
//
// WHAT WAS WRONG.
// The kit shipped ten workbook files, and they belonged to a product that no
// longer exists. Against the CURRENT five-step path the coverage was:
//
//     1 Knowledge Audit   ✓ had one
//     2 The Leak          ✗ none
//     3 Method Namer      ✗ none
//     4 The Charge Gate   ✗ none
//     5 The Send          ✗ none
//
// One workbook out of five, for the five steps the sales page actually sells.
// The other nine served library tools — niche clarity, PAIDS, DARES, SEEDS,
// 4E, MS×TS×SS, the planner, the tracker. Good material, wrong product.
//
// WHY THESE ARE GENERATED, NOT UPLOADED.
// A file in a bucket drifts from the tool the moment either changes, and nobody
// finds out until a buyer clicks. Generating from code means the workbook and
// the screen can never disagree, and "does the file exist" stops being a
// question anybody has to ask.
//
// THE GATE THEY ARE WRITTEN TO (nochill-product-kit/references/VERDICT.md):
//
//   Q1  Does it end at a plan, or a result?
//       Every one of these ends at a result. The Leak ends at a rand figure.
//       The Charge Gate ends at a number. The Send ends at a sent message.
//   Q2  Does capability change, or only understanding?
//       Each gives the first move DONE, not "now write your first step".
//   Q3  Give-to-ask ratio — one giving page for every asking page.
//       Giving = a worked example, one of his real numbers, the honest catch,
//       or the first move done for them. A workbook of blank lines is a
//       container: the reader supplies all the value and we supply the shape.
//       That never produces the "why is this free" reaction, because they did
//       the work. Every workbook below is checked by giveAskRatio().
//   Q4  Would a stranger pay for this?
//
// The six worked professions come from PROFESSIONS in offer-spine.ts, so the
// examples in print are the same ones the tool shows on screen.

export type BlockKind =
  /** Teaching. Costs the reader nothing. */
  | "teach"
  /** CREAM box — my example. Worked, specific, from a named profession. */
  | "example"
  /** POWDER BLUE box — your turn. The only kind that ASKS. */
  | "ask"
  /** PALE YELLOW box — the tip, the honest catch, the first move done for them. */
  | "tip"
  /** A receipted figure of his. Never a claim without one. */
  | "receipt";

export interface Block {
  kind: BlockKind;
  heading?: string;
  body: string;
  /** For "ask" blocks: how many ruled lines to draw. */
  lines?: number;
}

export interface Workbook {
  slug: string;
  /** Filename when downloaded. */
  file: string;
  title: string;
  /** Carries the mechanism: number + timeframe. */
  subtitle: string;
  /** Where the reader starts. */
  from: string;
  /** Where this leaves them — a RESULT, never a plan. */
  to: string;
  blocks: Block[];
}

// Shorthand so the content below reads as content, not as syntax.
const t = (heading: string, body: string): Block => ({ kind: "teach", heading, body });
const ex = (heading: string, body: string): Block => ({ kind: "example", heading, body });
const ask = (heading: string, body: string, lines = 5): Block => ({
  kind: "ask",
  heading,
  body,
  lines,
});
const tip = (heading: string, body: string): Block => ({ kind: "tip", heading, body });
const receipt = (heading: string, body: string): Block => ({ kind: "receipt", heading, body });

export const WORKBOOKS: Workbook[] = [
  // ── STEP 1 ────────────────────────────────────────────────────────────────
  {
    slug: "knowledge-audit",
    file: "01-what-you-already-know.pdf",
    title: "What You Already Know",
    subtitle: "One evening · the list of things people have been asking you for, written down",
    from: "It is all in your head, and you call it helping out.",
    to: "A written inventory of what people already pay somebody else for.",
    blocks: [
      t(
        "Start here",
        "You are not looking for what you are best at. You are looking for what people keep coming to you about — which is usually smaller, more specific, and more boring to you than you expect. Boring to you is the point. It is boring because you have done it a hundred times.",
      ),
      t(
        "The three-year test",
        "If somebody has asked you about it more than once, and you have been doing it for three years or more, it goes on the list. Nothing else qualifies and nothing else needs to.",
      ),
      ex(
        "An auditor's list",
        "Closing books nobody has touched in six months. Explaining to a founder why their accountant is wrong. Getting a company ready for a year-end audit without the usual panic. Reading a set of financials and saying, in one sentence, what is actually happening in the business.",
      ),
      ex(
        "A nurse's list",
        "Explaining a diagnosis to a family so they stop panicking. Working out which questions to ask a specialist. Knowing which symptoms are urgent and which can wait until Monday.",
      ),
      ask(
        "Your list",
        "Everything people come to you about. Ten lines. Do not filter — filtering is the next page.",
        10,
      ),
      receipt(
        "What not doing this cost me",
        "I lost R132,500 across my first fifty brand deals by undercharging. Not because I was bad at the work — because I had never written down what the work actually was, so I had no idea what it was worth. The list is what stops that.",
      ),
      t(
        "Now cut it",
        "Cross out anything you have done fewer than three times. Cross out anything you would not want to do again next month. What survives is short. It is supposed to be.",
      ),
      ask("What survived", "The three that are left.", 3),
      tip(
        "The honest catch",
        "The one you almost did not write down — because it felt too obvious, or because 'anyone in my field could do that' — is usually the one people pay for. Obvious to you is not obvious to them. That is the entire business.",
      ),
      tip(
        "Your first move, done",
        "Take the top item and finish this sentence out loud, right now: 'People come to me when they need ______ and cannot work it out themselves.' That sentence is step two's raw material. Do not polish it.",
      ),
    ],
  },

  // ── STEP 2 ────────────────────────────────────────────────────────────────
  {
    slug: "the-leak",
    file: "02-what-it-has-cost-you.pdf",
    title: "What It Has Cost You",
    subtitle: "One evening · a real number for the work you have given away",
    from: "You have never added it up.",
    to: "A rand figure for the last twelve months, and the sentence that stops each leak.",
    blocks: [
      t(
        "Why a number and not a feeling",
        "You already know you give too much away. Knowing has never once changed your behaviour. A number does, because a number can be compared to things — a car, a school fee, a year of your bond.",
      ),
      t(
        "What your hour actually costs",
        "Not what you take home. What somebody with your qualification is charged out at. Take the annual package your profession pays for your role, divide by 1,760 productive hours, and multiply by 2.5. That multiple is not greed — it is what every firm in your industry applies to cover the time you are not billing.",
      ),
      ex(
        "Worked, for a finance manager",
        "Package R720,000. Divided by 1,760 hours = R409 an hour. Multiplied by 2.5 = R1,022 an hour, charged out. That is the rate a firm would put on your time without hesitating.",
      ),
      ask("Your rate", "Annual package ÷ 1,760 × 2.5 = ______ per hour.", 3),
      t(
        "The hours are longer than you think",
        "A favour is never just the favour. The talk was two nights of preparation. The 'quick question' was twenty minutes plus the rest of the afternoon you spent thinking about it. So each kind of giving carries a multiplier.",
      ),
      ex(
        "The multipliers",
        "A talk or a keynote × 2.2 · Sitting on a committee × 1.8 · A brain-picking coffee × 1.6 · Reviewing somebody's document × 1.4 · A WhatsApp question × 1.2.",
      ),
      ask(
        "Your twelve months",
        "Each kind of giving, how many times, how many hours each. Multiply through.",
        8,
      ),
      ask("The total", "Hours × your rate = R______ given away in twelve months.", 2),
      tip(
        "The honest catch",
        "This is not a bill you can send anybody. Nobody owes you this money and asking for it would be strange. It is a fact you can act on, not a debt you can collect — and its only job is to make the next 'don't worry about it' cost you something consciously.",
      ),
      receipt(
        "Mine",
        "SARS assessed me R207,879.20 — not because I earned too much, but because I built income before I built any structure around it. Counting late is expensive in both directions.",
      ),
      tip(
        "Your first move, done",
        "Take your biggest single line. Write the words you will say next time that exact request arrives. Not a policy. One sentence, in your voice, that you would actually say out loud.",
      ),
    ],
  },

  // ── STEP 3 ────────────────────────────────────────────────────────────────
  {
    slug: "method-namer",
    file: "03-give-it-a-name.pdf",
    title: "Give It A Name",
    subtitle: "One evening · turning the thing you always do into a thing people can buy",
    from: "It is a favour, and favours are free by definition.",
    to: "A named method with steps, and the sentence that says what it does.",
    blocks: [
      t(
        "The whole idea, in two lines",
        "A service you cannot name is a favour. A method with a name is a product, and products have prices. Nothing else changes — not the work, not the hours, not your ability. Only the name.",
      ),
      ex(
        "Where this came from",
        "An academic support advisor never gives a student a research topic. After they cite somebody, she asks: 'so, what do YOU say?' Before a defence, she says: 'be honest.' Two of her students won scholarships. That was a method the whole time. It had no name, so it stayed free for eleven years.",
      ),
      t(
        "Find your moves",
        "Think about the last three people you helped. Not what you would ideally do — what you actually did, all three times. The repeated part is the method. The rest is improvisation.",
      ),
      ask("Your moves, in order", "Three to six steps. Plain words.", 6),
      t(
        "Find the move that is yours",
        "One of those steps, somebody else in your field would not do. That is the one worth naming after. Hers was making the student argue with their own source.",
      ),
      ask("Your move", "The thing you always say or always check that others do not.", 3),
      ex(
        "Three shapes that work",
        "Named after the move: 'The Second-Opinion Method'. Named after the result: 'The Audit-Ready Process'. Named after who it is for: 'The First-Time Manager Review'. All three are built from ordinary words. None of them is clever.",
      ),
      ask(
        "Your name",
        "Write three. Say each out loud. Keep the one you are least embarrassed by.",
        4,
      ),
      tip(
        "The honest catch",
        "You will not love the name. Almost nobody loves their own name for their own work, because you can see everything it leaves out. A name you are slightly embarrassed by still beats no name, because no name means no price. You can rename it after the third sale.",
      ),
      tip(
        "Your first move, done",
        "Finish this and say it to one person this week: '______ is how I take ______ to ______.' If they ask a follow-up question, the name is working.",
      ),
    ],
  },

  // ── STEP 4 ────────────────────────────────────────────────────────────────
  {
    slug: "price-decision",
    file: "04-the-number.pdf",
    title: "The Number",
    subtitle: "One evening · what to charge, and how to know you are allowed to",
    from: "You have never said a price out loud.",
    to: "A number you can defend, and the words for the people who have always had it free.",
    blocks: [
      t(
        "Two questions, in this order",
        "'When do I start charging' and 'what do I charge' are different questions, and answering the first with a number is why most advice fails. The first is a readiness question and it has a checkable answer.",
      ),
      t(
        "Four conditions, not feelings",
        "Someone has asked you for this twice. You have delivered it once and can quote what changed. Something real changes hands. You can say what it costs them not to have it.",
      ),
      ex(
        "How to read your score",
        "Three or four: charge now, on the next person who asks. Two: a founding price for the first three, with the sentence that ends it. Zero or one: deliver once more free on purpose, and collect the result instead of the fee.",
      ),
      ask("Your four", "Tick honestly. This page is not for anybody else.", 5),
      t(
        "Three floors — and the highest wins",
        "The time floor: your hours × 1.3 for the work around it × your charge-out rate. The outcome floor: a tenth of what the result is worth to them over a year. The seriousness floor: under R1,000 a buyer files your expertise next to an ebook.",
      ),
      ex(
        "Worked, for the auditor",
        "Twenty hours × 1.3 = 26 hours, at R1,022 = R26,572. The result is worth roughly R150,000 in avoided year-end chaos, so a tenth is R15,000. The seriousness floor is R1,000. The highest is R26,572, so the price is R26,500 — not the R14,000 average of the three.",
      ),
      ask("Your floors", "Work all three. Circle the highest.", 6),
      tip(
        "The honest catch",
        "Take the highest floor, never the average. Averaging lets your weakest input drag the price down, and your weakest input is almost always the one you guessed at fastest.",
      ),
      ex(
        "The founding-price sentence",
        "'I'm taking the first three people at R____ instead of R____. Not a sale — I want three results I can point to. After the third it goes to the full price, and I won't be reopening it.'",
      ),
      ex(
        "For somebody who has always had it free",
        "'I've started charging for ____ — R____. I'm telling you directly because you've asked me before and I don't want it to be a surprise. Nothing about how I help you changes. If the timing isn't right, say so and there are no hard feelings at all.'",
      ),
      tip(
        "Your first move, done",
        "Say your number out loud, alone, three times. It sounds absurd the first time and ordinary by the third. That is the entire preparation.",
      ),
    ],
  },

  // ── STEP 5 ────────────────────────────────────────────────────────────────
  {
    slug: "the-send",
    file: "05-send-it.pdf",
    title: "Send It",
    subtitle: "One evening · one person, one message, and their answer written down",
    from: "You have a price and you have not used it.",
    to: "An offer actually sent to a named person, and what they said.",
    blocks: [
      t(
        "One person, not a list",
        "A list lets you hide. Building the perfect one feels like work the entire time you are not sending anything, and it can absorb a year. One person can be messaged tonight.",
      ),
      t(
        "Who",
        "Somebody who has already asked you for this, at least once. Not the most impressive person you know — the most likely one. You are testing a sentence, not launching a business.",
      ),
      ask(
        "Their name and the date you will send",
        "Write both. The date is the part people leave blank.",
        3,
      ),
      ex(
        "The message, written out",
        "'Hi ____ — you asked me about ____ a while back. I've put a proper structure around it: it's called ____, it takes ____, and you end up with ____. It's R____. Want me to send you the one-pager?' That is the whole message. Do not add a paragraph explaining yourself.",
      ),
      t(
        "Why it is that short",
        "Every extra sentence is you apologising in advance. Short reads as somebody who does this regularly, which is the impression you want, and it is also true — you have done the work a hundred times.",
      ),
      ask("Your message", "Write it in your own words. Then cut a third of it.", 7),
      ex(
        "The four things they will say back",
        "'That's more than I expected' — 'It is. Here's what it replaces.' · 'Can you do it cheaper?' — 'I can do less of it for less.' · 'Let me think about it' — 'Of course. Can I check back on ____?' · 'Not right now' — 'No problem. I'll leave it with you.'",
      ),
      tip(
        "The honest catch",
        "They might say no. A no this week is worth more than a maybe you carry for a year, because a no is information and a maybe is only hope. And you will have said a number out loud, which is the thing you have never done.",
      ),
      ask(
        "What they said",
        "Their exact words. This becomes the first line of your Proof Ledger.",
        5,
      ),
      receipt(
        "Why I push this so hard",
        "I had 780,000 followers and no way to reach one of them the day the account went. Every number I had used to prove I mattered belonged to somebody else. One person who pays you is worth more than a hundred thousand who cannot.",
      ),
      tip(
        "Your first move, done",
        "Send it before you close this workbook. Not tomorrow — the version of you reading this is the one who will do it.",
      ),
    ],
  },
];

export function workbookBySlug(slug: string): Workbook | undefined {
  return WORKBOOKS.find((w) => w.slug === slug);
}

/**
 * VERDICT Q3, enforced in code rather than trusted.
 * Target: at least one GIVING block per ASKING block. Anything at or below 1.0
 * is a container the reader fills in themselves.
 */
export function giveAskRatio(w: Workbook): {
  give: number;
  ask: number;
  ratio: number;
  passes: boolean;
} {
  const ask = w.blocks.filter((b) => b.kind === "ask").length;
  const give = w.blocks.length - ask;
  const ratio = ask === 0 ? Infinity : give / ask;
  return { give, ask, ratio, passes: ratio >= 1 };
}
