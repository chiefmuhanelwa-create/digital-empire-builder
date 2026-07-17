import { Check, Shield } from "lucide-react";

type Phase = {
  label: string;
  title: string;
  weeks: string;
  items: { title: string; body: string }[];
};

const PRO_COHORT_PHASES: Phase[] = [
  {
    label: "Genesis",
    title: "Foundation — Identity Before Output",
    weeks: "Weeks 1–2",
    items: [
      {
        title: "The 3Cs Mindset Assessment",
        body: "Score your Create/Collaborate/Contribute orientation before you touch a single piece of content.",
      },
      {
        title: "Breaking the Paid-Less-Than-You're-Worth Trap",
        body: "Name the belief that's actually keeping your expertise stuck earning a fraction of what it's worth.",
      },
      {
        title: "The 7 Core Contentpreneur Skills",
        body: "Self-assess where you're already strong and where the real gaps are — MS×TS×SS: any zero multiplies to zero.",
      },
      {
        title: "Essential Tools Setup",
        body: "Your platform, your payment link, your email capture — live before Week 3, not someday.",
      },
    ],
  },
  {
    label: "Exodus → Leviticus",
    title: "Self-Awareness & Content Strategy",
    weeks: "Weeks 3–6",
    items: [
      {
        title: "The Contentpreneur SWOT + 4Ps Framework",
        body: "Passion, Pain, Purpose, Profit — mapped and compressed into one niche statement, tested on 2 real people in your audience.",
      },
      {
        title: "The Contentpreneur Content Ratio (4E, Adjusted)",
        body: "Educate 50 / Entertain 25 / Encourage 15 / Earn 10 — a mix tuned for buyers, not just an audience, because your buyer is deciding whether to trust you with money.",
      },
      {
        title: "The 30-Day Content Calendar",
        body: "Built with your real ratios, not a generic template — filled in during the session, not left for later.",
      },
    ],
  },
  {
    label: "Numbers",
    title: "Platform Strategy & Systems",
    weeks: "Weeks 7–9",
    items: [
      {
        title: "Choosing Your Canaan — The One-Platform Rule",
        body: "One primary platform, fully optimised, before any content-mechanics lessons apply. Mediocre on five platforms loses to excellent on one.",
      },
      {
        title: "The Hook–Story–Lesson–Framework–CTA Formula",
        body: "Plus the R×A×C×U^B hook formula and the 4 Scripting Principles — the same system used to write every piece of copy on this site.",
      },
      {
        title: "DARES Self-Audit + Your First Digital Product",
        body: "Score your product idea, then build it inside a 72-hour protocol — not a someday project.",
      },
    ],
  },
  {
    label: "Deuteronomy",
    title: "Owned Tribes & Monetisation",
    weeks: "Weeks 10–12",
    items: [
      {
        title: "The River–Fish–Tank Model",
        body: "Move an audience from rented platforms into a tank you own — then convert the tank into a 3Cs tribe of 100+ members.",
      },
      {
        title: "The SEEDS Conversion Sequence",
        body: "Signal → Engagement → Education → Decision → Success — the exact pipeline that moves a stranger to a buyer, ethically.",
      },
      {
        title: "The PAIDS Monetisation Engine",
        body: "5 income streams, the product ladder, the affiliate stack, and the 25% SARS reserve rule — so no single stream exceeds half your revenue.",
      },
      {
        title: "Graduation — The Contentpreneur Covenant",
        body: "R10K/month demonstrable, 3+ PAIDS streams active, SARS reserve operational. This is the checkpoint, not a certificate for showing up.",
      },
    ],
  },
];

const VIP_INCLUSIONS = [
  {
    title: "The Entire 90-Day Pro Cohort Architecture",
    body: "Full access to all group sessions, templates, asset frameworks and community spaces.",
  },
  {
    title: "4× Private 1:1 Strategy Calls",
    body: "Direct, isolated consulting sessions with Ndivhuwo Muhanelwa to break down and scale your specific brand metrics.",
  },
  {
    title: "Done-With-You Funnel Build",
    body: "Our internal team directly handles the construction and deployment of your automated DM lead-capture funnels.",
  },
];

function PhaseGrid({ phases }: { phases: Phase[] }) {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {phases.map((phase) => (
        <div
          key={phase.label}
          className="border border-border bg-muted/10 p-6 flex flex-col"
        >
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">
            {phase.label} · {phase.weeks}
          </div>
          <h3 className="mt-2 font-display text-2xl leading-tight">
            {phase.title}
          </h3>
          <ul className="mt-5 space-y-4">
            {phase.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="mt-1 size-4 shrink-0 text-banana" />
                <div>
                  <div className="font-medium text-sm leading-snug">{item.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
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
            The Absolute Implementation Guarantee
          </div>
          <h3 className="mt-2 font-display text-2xl md:text-3xl leading-tight">
            Complete the 90 days. If it doesn't work — we refund you and build your funnel for free.
          </h3>
          <p className="mt-3 text-sm md:text-base text-foreground/85 leading-relaxed">
            Complete all 90 days, post consistently and deploy every system. If you don't generate
            your first real lead from content, we will issue a 100% refund and personally build
            out your funnel for you, at no extra cost.
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
        Tier 1 · The Core Flagship Offer
      </div>
      <h2 className="mt-3 font-display text-4xl md:text-5xl leading-tight">
        What's inside the 90-Day Transformation Cohort
      </h2>

      <dl className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Investment</dt>
          <dd className="mt-2 text-sm">$970 once-off <span className="text-banana">(save $80)</span> · or $350 × 3 months · billed in ZAR</dd>
        </div>
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Capacity</dt>
          <dd className="mt-2 text-sm">15–20 members per cohort. Real accountability, not a course dump.</dd>
        </div>
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Built for</dt>
          <dd className="mt-2 text-sm">You — a Contentpreneur (a professional still employed, or a self-employed creator with expertise but no system) ready to build the system your expertise deserves.</dd>
        </div>
      </dl>

      <PhaseGrid phases={PRO_COHORT_PHASES} />
      <GuaranteeCallout />
    </div>
  );
}

export function VipTierBreakdown() {
  return (
    <div className="mt-16 border-t border-border pt-12">
      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
        Tier 2 · High-Ticket VIP Escalation
      </div>
      <h2 className="mt-3 font-display text-4xl md:text-5xl leading-tight">
        Contentpreneur VIP Enterprise Tier
      </h2>

      <dl className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Investment</dt>
          <dd className="mt-2 text-sm">$2,430 once-off · billed in ZAR.</dd>
        </div>
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Capacity</dt>
          <dd className="mt-2 text-sm">5 Contentpreneurs per cohort quarter.</dd>
        </div>
      </dl>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border bg-muted/10 p-6">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">
            Everything in PRO
          </div>
          <h3 className="mt-2 font-display text-2xl leading-tight">
            All 4 phases of the Core Cohort
          </h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Full access to every group session, template, asset framework and community space
            inside the 90-Day Transformation Cohort.
          </p>
        </div>
        <div className="border border-border bg-muted/10 p-6">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">
            VIP-only escalation
          </div>
          <ul className="mt-3 space-y-4">
            {VIP_INCLUSIONS.slice(1).map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="mt-1 size-4 shrink-0 text-banana" />
                <div>
                  <div className="font-medium text-sm leading-snug">{item.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <GuaranteeCallout />
    </div>
  );
}
