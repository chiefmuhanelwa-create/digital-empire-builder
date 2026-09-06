// THE PITCH BUILDER — pure, client-safe, no AI.
//
// Not a generator. There are a hundred tools that will write you a pitch, and
// they all invent the numbers, which is the one part that has to be true.
//
// This assembles a pitch from things you can prove: brands that have actually
// paid you, rates your own records support, and the credential fragments the
// archive shows agencies respond to. Every figure it prints came from a row you
// logged.
//
// Structure follows what the agency archive shows actually converts. Agencies
// said in their own words what they love:
//   · creators who respond fast — deadlines are 24-48 hours
//   · concepts that show you read the brief
//   · creators who come with a rate card ready
//   · creators who follow up professionally after campaigns
//
// And one agency, unprompted, said the founder was the only influencer who had
// ever sent them a performance report without being asked. That is the strongest
// credential in the whole archive and it is a behaviour, not a number — so the
// pitch closes on it rather than on reach.

export type PitchInput = {
  /** Who you are writing to. */
  brand: string;
  /** What they asked for, or what you are proposing. */
  deliverable: string;
  /** Your niche or lane, in your words. */
  lane?: string;
  /** Verified from the Deal Tracker — never typed by hand. */
  provenRate?: number | null;
  provenRateN?: number;
  /** Distinct brands that have paid, from paid deals only. */
  brandsPaid?: string[];
  /** Whether they have logged a delivered campaign report. */
  hasReported?: boolean;
  /** Their own additions. */
  angle?: string;
};

export type PitchSection = { label: string; body: string; sourced: boolean };

export type Pitch = {
  subject: string;
  sections: PitchSection[];
  full: string;
  /** Anything that would have strengthened it but is not in the records. */
  gaps: string[];
};

function rand(n: number) {
  return `R${n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function buildPitch(input: PitchInput): Pitch {
  const gaps: string[] = [];
  const sections: PitchSection[] = [];

  const brand = input.brand.trim() || "the brand";
  const deliverable = input.deliverable.trim() || "the campaign";

  // 1 · Open on them, not on you. The archive is explicit that concepts showing
  //     you read the brief are what agencies notice.
  sections.push({
    label: "Open",
    sourced: false,
    body: input.angle?.trim()
      ? `I've been thinking about ${brand} and ${deliverable}. ${input.angle.trim()}`
      : `I've been thinking about ${brand} and ${deliverable}, and I want to come at it from an angle that fits how my audience already talks about this.`,
  });
  if (!input.angle?.trim())
    gaps.push("No specific angle. Agencies say the thing they notice is a concept that shows you read the brief — a generic opener is the one they skim.");

  // 2 · Proof, and only what the records carry.
  const paid = (input.brandsPaid ?? []).filter(Boolean);
  if (paid.length > 0) {
    const named = paid.slice(0, 5).join(", ");
    sections.push({
      label: "Proof",
      sourced: true,
      body:
        paid.length > 5
          ? `I've delivered paid campaigns for ${named} and ${paid.length - 5} others.`
          : `I've delivered paid campaigns for ${named}.`,
    });
  } else {
    gaps.push("No paid brands in your records yet, so the pitch has no proof line. Log the deals you have already been paid for and this section writes itself.");
  }

  // 3 · Rate, only if a receipt supports it. This is the whole discipline: the
  //     pitch cannot quote a number the Deal Tracker cannot back.
  if (input.provenRate && input.provenRate > 0) {
    const n = input.provenRateN ?? 0;
    sections.push({
      label: "Rate",
      sourced: true,
      body: `My rate for ${deliverable.toLowerCase()} is ${rand(input.provenRate)}. That is what I have actually been paid${n > 1 ? ` across ${n} campaigns` : ""}, not an opening position.`,
    });
    if (n === 1)
      gaps.push("Your rate is based on a single paid deal. Defensible, but one data point — say the number, do not lean on it as a pattern.");
  } else {
    gaps.push("No verified rate for this deliverable. Quote from the Rate Card Calculator instead, and do not present it as what you have been paid.");
  }

  // 4 · The close. Behaviour, not reach — because it is the one thing a
  //     competitor cannot claim and an agency actually remarked on unprompted.
  sections.push({
    label: "Close",
    sourced: !!input.hasReported,
    body: input.hasReported
      ? "One thing worth knowing: I send a written performance report after every campaign, without being asked. An agency once told me I was the only influencer who ever had."
      : "I work to the deadlines in the brief, and I send a written performance report at the end whether or not it is asked for.",
  });

  const subject = `${deliverable} — ${brand}`;
  const full = sections.map((s) => s.body).join("\n\n");

  return { subject, sections, full, gaps };
}
