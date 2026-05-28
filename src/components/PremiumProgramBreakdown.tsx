import { Check, Shield } from "lucide-react";

type Phase = {
  label: string;
  title: string;
  weeks: string;
  items: { title: string; body: string }[];
};

const PRO_COHORT_PHASES: Phase[] = [
  {
    label: "Phase 1",
    title: "The Launchpad Foundation",
    weeks: "Weeks 1–2",
    items: [
      {
        title: "Live Profile Optimization Blueprint",
        body: "Direct overhaul of your Instagram, TikTok and YouTube channels for high-ticket customer conversion.",
      },
      {
        title: "Authority Studio Setup",
        body: "Personalized recording kit recommendations tailored to your exact budget — from R500 setups to premium gear environments.",
      },
      {
        title: "Private 1:1 Strategy Session (30 min)",
        body: "Dedicated baseline alignment call to lock in your niche positioning, define your Ideal Customer Profile and map out custom 90-day execution goals.",
      },
      {
        title: "Offer Design Workshop",
        body: "Deep-dive group session where we build and price your first highly monetizable digital product or service framework.",
      },
    ],
  },
  {
    label: "Phase 2",
    title: "The Viral Content Engine",
    weeks: "Weeks 3–6",
    items: [
      {
        title: "The Replicable Ideation System",
        body: "Your own dashboard template with 50+ proven content matrices built for educational authority growth.",
      },
      {
        title: "Scripting Framework & AI Prompts",
        body: "10 plug-and-play script structures (hooks, story arcs, aggressive CTAs) plus optimized Claude/ChatGPT engineering prompts.",
      },
      {
        title: "Recording Camera Confidence",
        body: "Mindset and presence training to transition your screen style from entertainment to high-authority teaching.",
      },
      {
        title: "Editor Hiring & Standards SOPs",
        body: "Replicable SOPs to self-edit in CapCut or hire local video editors for R500–R2,000/month.",
      },
      {
        title: "The Sunday Batch-Shooting System",
        body: "The exact framework to map, script and shoot 10–15 premium pieces of vertical video in a single afternoon.",
      },
    ],
  },
  {
    label: "Phase 3",
    title: "The Automated Conversion Machine",
    weeks: "Weeks 7–10",
    items: [
      {
        title: "Link-In-Bio Funnel Infrastructure",
        body: "Complete build-out of a high-converting single landing page highlighting your core transformation promise.",
      },
      {
        title: "Advanced DM Automation Environment",
        body: "ManyChat / ChatDaddy comment-to-DM triggers that capture student emails on autopilot.",
      },
      {
        title: "Lead Magnet 'Creator Kit'",
        body: "Step-by-step engineering of your first high-leverage free resource, checklist or training block.",
      },
      {
        title: "Email Welcome Nurture Sequence",
        body: "A clean, automated 5-email welcome funnel to nurture new subscribers automatically.",
      },
    ],
  },
  {
    label: "Phase 4",
    title: "Scale, Sustain & Mastermind",
    weeks: "Weeks 11–12+",
    items: [
      {
        title: "Weekly Live Group Masterminds",
        body: "Hot-seat reviews of your uploaded videos, analytics and hook optimization.",
      },
      {
        title: "Monthly Content Care Packages",
        body: "Fresh trending formats, layout styles, script templates and viral growth analyses delivered monthly.",
      },
      {
        title: "Private Platform Workspace Access",
        body: "24/7 accountability network and direct comms inside our secure client community hub.",
      },
      {
        title: "The Performance Dashboard Asset",
        body: "Unified tracking sheet for profiles, link clicks, leads generated and gross sales revenue.",
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
          <dd className="mt-2 text-sm">R18,000 once-off <span className="text-banana">(save R9,000)</span> · or 2× R10,000, 30 days apart</dd>
        </div>
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Capacity</dt>
          <dd className="mt-2 text-sm">15–20 members per cohort. Elite accountability.</dd>
        </div>
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Built for</dt>
          <dd className="mt-2 text-sm">Creators moving from entertainment to education, ready to build real systems.</dd>
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
          <dd className="mt-2 text-sm">R45,000 once-off.</dd>
        </div>
        <div className="bg-background p-5">
          <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Capacity</dt>
          <dd className="mt-2 text-sm">5 elite creators per cohort quarter.</dd>
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
