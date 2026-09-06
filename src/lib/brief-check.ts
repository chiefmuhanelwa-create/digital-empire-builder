// THE BRIEF CHECK — pure, client-safe, no AI.
//
// An agency brief arrives with a 24-48 hour deadline. The creator reads it,
// gets excited about the fee, and replies yes. Then the gaps surface: usage
// rights nobody defined, an exclusivity window nobody stated, three rounds of
// revisions nobody budgeted for, and payment terms that turn out to be
// end-of-month after a campaign that ran six weeks.
//
// Built from 23 agencies of observed briefs. A complete brief contains twelve
// things. Most contain seven. The five that go missing are always the five that
// cost money later, and every one of them is easier to ask about BEFORE you say
// yes than to renegotiate after you have signed.
//
// This is a completeness check, not legal advice. It tells you what was not
// stated and gives you the question to ask.

export type BriefField = {
  id: string;
  label: string;
  /** Why its absence costs money. Specific, from the archive. */
  risk: string;
  /** The question to send back. Written to be pasted as-is. */
  ask: string;
  weight: "critical" | "important" | "worth asking";
};

export const BRIEF_FIELDS: BriefField[] = [
  {
    id: "fee",
    label: "The fee, stated as a number",
    risk: "A brief without a number is a brief where the number gets decided after you have shown enthusiasm. The good agencies state it upfront — one wrote “we have R10,500.00 in fees available for this campaign's scope” in the first email.",
    ask: "What is the fee available for this scope?",
    weight: "critical",
  },
  {
    id: "deliverables",
    label: "Exact deliverables, counted",
    risk: "“Some content for the launch” becomes four assets and three rounds of revisions. Real briefs count them: X1 IG Reel, X2 stories.",
    ask: "Can you confirm the exact deliverables and counts — posts, reels, stories, and whether stories are included?",
    weight: "critical",
  },
  {
    id: "usage",
    label: "Usage rights — where, how long, paid media",
    risk: "The single most expensive omission. If the brand can run your face as a paid ad for twelve months, that is worth multiples of a post fee — and if it is not written down, the default assumption will not be yours.",
    ask: "What usage rights are included — organic only, or paid media too? On which platforms, and for how long?",
    weight: "critical",
  },
  {
    id: "exclusivity",
    label: "Exclusivity — duration and scope",
    risk: "Observed clauses run category-wide, not brand-wide. One read “all banking brands” for four months. That locks out every competing brief in the window, and it is priced into nothing unless you raise it.",
    ask: "Is there category exclusivity? If so, what is the exact scope and the end date?",
    weight: "critical",
  },
  {
    id: "timeline",
    label: "Go-live date and concept deadline",
    risk: "Concept deadlines are commonly Friday 9am with the brief landing Wednesday. Drafts are due 24-48 hours before go-live. Both are easy to miss when they are not written down.",
    ask: "What is the go-live date, and when do you need the concept and the draft?",
    weight: "important",
  },
  {
    id: "approvals",
    label: "How many approval rounds",
    risk: "Two to three rounds is the norm. Each one is unpaid work. A brief that does not cap rounds is a brief that can absorb a week you did not quote for.",
    ask: "How many rounds of revision are included, and who signs off?",
    weight: "important",
  },
  {
    id: "payment",
    label: "Payment terms and who to invoice",
    risk: "The norm is invoice at campaign end, paid end of month — so a campaign finishing on the 2nd can mean waiting nearly two months. Invoices go to the agency, not the brand.",
    ask: "What are the payment terms, and who should the invoice be addressed to?",
    weight: "important",
  },
  {
    id: "competitor",
    label: "The competitor check window",
    risk: "You will be asked this before a contract is drafted. Knowing the window up front lets you answer accurately instead of guessing.",
    ask: "What lookback period should the competitor check cover?",
    weight: "worth asking",
  },
  {
    id: "reporting",
    label: "What the post-campaign report needs",
    risk: "Reporting is a required step before invoicing — screen grabs, reach, impressions, sometimes a compiled PDF. It is unpaid work that arrives after you thought the job was done.",
    ask: "What does the post-campaign report need to include, and by when?",
    weight: "worth asking",
  },
  {
    id: "product",
    label: "Whether you must use the product",
    risk: "Banking and fintech briefs often gate on real usage — one shortlist asked which bank you use and whether you would open an account. Wrong answers mean you never hear back, and nobody tells you why.",
    ask: "Does this require me to use or hold the product myself?",
    weight: "worth asking",
  },
  {
    id: "whitelisting",
    label: "Whitelisting or ad-account access",
    risk: "Running ads through your handle is a separate service from making a post, and it is routinely bundled in without a separate fee.",
    ask: "Does this include whitelisting or running paid media through my handle?",
    weight: "worth asking",
  },
  {
    id: "embargo",
    label: "Confidentiality or embargo terms",
    risk: "Briefs commonly arrive under embargo — “please keep the contents of this email confidential”. Worth knowing before you mention it publicly.",
    ask: "Is this brief under embargo, and until when?",
    weight: "worth asking",
  },
];

export type BriefResult = {
  score: number;
  total: number;
  verdict: "complete" | "workable" | "incomplete";
  headline: string;
  missing: BriefField[];
  /** One message containing every question worth asking. */
  reply: string;
};

export function checkBrief(present: Record<string, boolean>): BriefResult {
  const missing = BRIEF_FIELDS.filter((f) => !present[f.id]);
  const score = BRIEF_FIELDS.length - missing.length;
  const criticalMissing = missing.filter((f) => f.weight === "critical").length;

  const verdict: BriefResult["verdict"] =
    criticalMissing > 0 ? "incomplete" : missing.length > 3 ? "workable" : "complete";

  const headline =
    criticalMissing > 0
      ? `${criticalMissing} critical thing${criticalMissing > 1 ? "s are" : " is"} not in this brief`
      : missing.length === 0
        ? "This is a complete brief. Rare — say so."
        : `Nothing critical missing. ${missing.length} worth asking about.`;

  const questions = missing.map((f) => `• ${f.ask}`).join("\n");
  const reply = missing.length
    ? `Thanks for this — the campaign sounds like a fit. Before I confirm, a few things I want to get straight so there are no surprises on either side:\n\n${questions}\n\nHappy to turn the concept around quickly once those are clear.`
    : "";

  return { score, total: BRIEF_FIELDS.length, verdict, headline, missing, reply };
}
