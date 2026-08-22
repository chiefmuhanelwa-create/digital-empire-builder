import { Check, Shield } from "lucide-react";

// REWRITTEN 2026-08-22.
//
// Three things this component used to claim that were not true:
//   1. FOUR phases. The database has SEVEN modules and the sales page said seven.
//      A buyer comparing the two pages caught us contradicting ourselves.
//   2. "15–20 members per cohort", group sessions, community spaces. No cohort
//      has ever run. There is no group, no schedule and no room.
//   3. A guarantee promising that "our internal team" would build the buyer's
//      funnel for free. There is no team.
//
// What replaces them is the thing that is actually real and actually justifies
// $997: SEVEN STAGE GATES. You do not advance because a week passed. You advance
// because you produced the artifact, and a person checked it. A video library is
// worth $97 — and we already sell one at that price.

type Stage = {
  label: string;
  element: string;
  title: string;
  items: { title: string; body: string }[];
  gate: string;
};

// The founder's model: you are the driver, your knowledge is the cargo, the offer
// is the delivery. Content is the fuel, marketing the vehicle, platforms are
// roads owned by someone who can close them tomorrow. The list is the depot.
const STAGES: Stage[] = [
  {
    label: "Stage 1",
    element: "The driver",
    title: "Foundation — MS×TS×SS",
    items: [
      { title: "Mindset × Toolset × Skillset, scored", body: "Multiplicative, not additive — a zero on any axis is a zero overall, which is why one weak area quietly cancels years of expertise." },
      { title: "Positioning that survives scrutiny", body: "A sentence that holds up when an executive asks the hard follow-up question." },
    ],
    gate: "A written positioning sentence that passes all five tests.",
  },
  {
    label: "Stage 2",
    element: "The cargo",
    title: "Self-Awareness — SWOT & the 4Ps",
    items: [
      { title: "What you actually carry", body: "The expertise inventory, separated from the things you merely have opinions about." },
      { title: "And who it is for", body: "One buyer, named specifically enough that you would recognise them in a room." },
    ],
    gate: "A full SWOT, minimum three points per quadrant, and three dated priorities.",
  },
  {
    label: "Stage 3",
    element: "The fuel",
    title: "Content Strategy — the 4Es Engine",
    items: [
      { title: "Four jobs content does", body: "Educate, entertain, engage, evolve — in ratios, so you stop making only the one that feels safe." },
      { title: "Content that does not run dry in week three", body: "Built from your offer, not from trends, which is why it keeps working after the trend does not." },
    ],
    gate: "A 30-day calendar built to real 4E ratios, and a niche statement tested on two actual buyers.",
  },
  {
    label: "Stage 4",
    element: "The roads",
    title: "Platform Strategy — Choose Your Canaan",
    items: [
      { title: "One platform, done properly", body: "Instead of four done badly. Chosen from where your buyer already is, not where you are comfortable." },
      { title: "Its rules, learned deliberately", body: "Every road belongs to somebody who can close it. You learn the rules and you stop pretending it is yours." },
    ],
    gate: "Four consecutive weeks published, and an email list that is actually growing.",
  },
  {
    label: "Stage 5",
    element: "The vehicle",
    title: "Systems & DARES",
    items: [
      { title: "It moves without you pushing it", body: "The delivery, the follow-up and the invoice run as a process rather than as a memory." },
      { title: "DARES asset model", body: "What you build once and it keeps working — the difference between a business and a busy job." },
    ],
    gate: "One thing that runs without you for a full week.",
  },
  {
    label: "Stage 6",
    element: "The depot",
    title: "Owned Tribes — River, Fish, Tank",
    items: [
      { title: "A list nobody can close", body: "The river is the platform. The fish are the people. The tank is the only part you own." },
      { title: "A working opt-in, and a reason to join it", body: "Not a newsletter. A reason." },
    ],
    gate: "A live opt-in and ten real subscribers you did not already know.",
  },
  {
    label: "Stage 7",
    element: "The ledger",
    title: "PAIDS Monetization & Creator Finance",
    items: [
      { title: "Five income routes, audited", body: "Products, Affiliate, Information, Direct, Services — scored for concentration, so you can see which single stream would take you down with it." },
      { title: "Money that is real, recorded and kept", body: "The reserve rule, ten deduction categories, and records that survive being looked at." },
    ],
    gate: "One PAIDS stream earning, money separated, records kept.",
  },
];

const VIP_INCLUSIONS = [
  {
    title: "The entire seven-stage Accelerator",
    body: "Every stage, every gate, every tool.",
  },
  {
    title: "4× private 1:1 strategy calls",
    body: "Direct sessions with Ndivhuwo Muhanelwa on your specific positioning, offer and numbers.",
  },
];

function StageGrid({ stages }: { stages: Stage[] }) {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {stages.map((stage) => (
        <div key={stage.label} className="border border-border bg-muted/10 p-6 flex flex-col">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">
            {stage.label} · {stage.element}
          </div>
          <h3 className="mt-2 font-display text-2xl leading-tight">{stage.title}</h3>
          <ul className="mt-5 space-y-4">
            {stage.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="mt-1 size-4 shrink-0 text-banana" />
                <div>
                  <div className="font-medium text-sm leading-snug">{item.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
          {/* The gate is the product. Show it on every stage, not in a footnote. */}
          <div className="mt-5 border-t border-border pt-4">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              You cannot advance without
            </div>
            <p className="mt-1.5 text-sm font-medium leading-snug">{stage.gate}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function GuaranteeCallout() {
  return (
    <div className="mt-10 relative overflow-hidden border-2 border-banana bg-gradient-to-br from-banana/15 via-banana/5 to-transparent p-8">
      <div className="absolute -top-12 -right-12 size-40 rounded-full bg-banana/10 blur-3xl" />
      <div className="relative flex items-start gap-5">
        <div className="shrink-0 size-12 rounded-full bg-banana text-banana-foreground grid place-items-center">
          <Shield className="size-6" />
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">
            The guarantee
          </div>
          <h3 className="mt-2 font-display text-2xl md:text-3xl leading-tight">
            Clear the first three gates in thirty days. If you do not believe this will pay for
            itself, I refund you in full.
          </h3>
          <p className="mt-3 text-sm md:text-base text-foreground/85 leading-relaxed">
            Conditional, deliberately. The gates are the product — somebody who never produces an
            artifact has not used the thing they are asking to be refunded for. Tell me before day 30
            and the refund is unconditional from there.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProCohortBreakdown() {
  return (
    <div className="mt-16 border-t border-border pt-12">
      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
        The flagship
      </div>
      <h2 className="mt-3 font-display text-4xl md:text-5xl leading-tight">
        Seven stages. Seven gates you cannot skip.
      </h2>
      <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
        You do not advance because a week passed. You advance because you produced the artifact —
        a written positioning sentence, a tested niche, a list that is actually growing, one thing
        that runs without you. That is the whole difference between this and a video library, and we
        already sell a video library for a tenth of the price.
      </p>

      <dl className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Investment</dt>
          <dd className="mt-2 text-sm">$997 once-off · billed in ZAR</dd>
        </div>
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Entry requirement</dt>
          <dd className="mt-2 text-sm">You have sent an offer to a real person and they answered. If not, the Foundation Kit first — that is the honest order.</dd>
        </div>
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Built for</dt>
          <dd className="mt-2 text-sm">A credentialed professional who has made one sale by hand and wants a system instead of a second job.</dd>
        </div>
      </dl>

      <StageGrid stages={STAGES} />
      <GuaranteeCallout />
    </div>
  );
}

export function VipTierBreakdown() {
  return (
    <div className="mt-16 border-t border-border pt-12">
      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
        By arrangement
      </div>
      <h2 className="mt-3 font-display text-4xl md:text-5xl leading-tight">
        Contentpreneur VIP
      </h2>

      <dl className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Investment</dt>
          <dd className="mt-2 text-sm">$2,997 once-off · billed in ZAR.</dd>
        </div>
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Capacity</dt>
          <dd className="mt-2 text-sm">Five per quarter — the limit is founder time, and it is real.</dd>
        </div>
      </dl>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {VIP_INCLUSIONS.map((item, i) => (
          <div key={i} className="border border-border bg-muted/10 p-6">
            <div className="flex items-start gap-3">
              <Check className="mt-1 size-4 shrink-0 text-banana" />
              <div>
                <div className="font-medium text-sm leading-snug">{item.title}</div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <GuaranteeCallout />
    </div>
  );
}
