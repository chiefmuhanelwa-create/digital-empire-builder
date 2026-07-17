import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { verifyTurnstile } from "@/lib/turnstile.server";
import { getAnthropic, OFFER_MODEL } from "@/lib/anthropic";

// ── The generated offer (what the model returns + what the UI renders) ──────
export interface GeneratedOffer {
  offerName: string;
  headline: string;
  whoItsFor: string;
  problemsSolved: string[];
  transformation: { before: string; after: string };
  deliverables: string[];
  pricing: { suggestion: string; rationale: string };
  positioning: string;
  firstCTA: string;
  thisWeekAction: string;
  frameworkUsed: string;
}

// JSON-schema mirror of GeneratedOffer for structured output (additionalProperties:false + required at every level).
const OFFER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "offerName", "headline", "whoItsFor", "problemsSolved", "transformation",
    "deliverables", "pricing", "positioning", "firstCTA", "thisWeekAction", "frameworkUsed",
  ],
  properties: {
    offerName: { type: "string" },
    headline: { type: "string" },
    whoItsFor: { type: "string" },
    problemsSolved: { type: "array", items: { type: "string" } },
    transformation: {
      type: "object",
      additionalProperties: false,
      required: ["before", "after"],
      properties: { before: { type: "string" }, after: { type: "string" } },
    },
    deliverables: { type: "array", items: { type: "string" } },
    pricing: {
      type: "object",
      additionalProperties: false,
      required: ["suggestion", "rationale"],
      properties: { suggestion: { type: "string" }, rationale: { type: "string" } },
    },
    positioning: { type: "string" },
    firstCTA: { type: "string" },
    thisWeekAction: { type: "string" },
    frameworkUsed: { type: "string" },
  },
} as const;

// ── NoChill voice + framework knowledge, distilled from the brand bible ──────
const BRAND_SYSTEM = `You are the offer-building engine for NOCHILL (Ndivhuwo Muhanelwa) — a South African contentpreneur who went from sleeping in university bathrooms to R600,000+ in annual income off a R6,000 phone. You help people turn knowledge and skills into a real, sellable offer.

VOICE — copy this exactly:
- Direct, raw, real-talk SA energy. Big-brother-who-went-through-it-and-came-back-with-a-system. Never a guru, never a professor.
- Short declarative sentences. Confrontation is care ("You're not camera shy. You're clarity shy.").
- No AI slop. If a line sounds like a LinkedIn post, rewrite it. No "In this offer you will…", no hype adjectives ("revolutionary", "game-changing").
- Faith is the operating system, not a performance — weave it in lightly only where natural, never as the lead.
- SA English (colour, not color). Plain, vivid language.

NOCHILL FRAMEWORKS to anchor the offer (name the one you used in "frameworkUsed"):
- PAIDS — 5 income streams: Products, Ads & Affiliates, Information, Deals, Services. Most offers are a Product, Information (course/workbook), or Service (coaching/consulting).
- DARES — a strong asset is Digital, Automated, Recurring, Evergreen, Scalable. Push the offer toward DARES.
- 4E — content that sells: Educate, Entertain, Encourage, Earn.
- SEEDS — the buyer journey: Signal → Engagement → Education → Decision → Success.

HARD RULES:
- Build the USER's offer from the USER's inputs. NEVER invent numbers, results, or testimonials for them. If their proof is thin, coach them on positioning instead of fabricating credibility.
- Do not insert NoChill's personal figures as if they were the user's.
- Prices are suggested in USD (the store displays USD). Add "price in your local-currency equivalent" where relevant.
- "thisWeekAction" must be ONE concrete thing they can do in the next 7 days. A command, not a question.
- Output ONLY the structured offer. No preamble.`;

function icpProfile(icp: "called_expert" | "content_creator"): string {
  if (icp === "called_expert") {
    return `AUDIENCE — the employed professional (a Contentpreneur): a 32–50 professional, specialist, or academic with unexploited expertise who wants to monetise their knowledge. Language that lands: "your knowledge is worth more than you're being paid for it." They buy transformation and authority, not entertainment.
PRICING BAND: premium. Suggest a high-ticket range — typically $97 entry up to $300–$4,000 for cohorts/services. Justify with outcome value, not effort.
ANGLE: position the offer as a system/programme that converts their expertise into income and authority.`;
  }
  return `AUDIENCE — the Knowledge Creator (a Contentpreneur lane): a coach, consultant, podcaster, or creator who already has real expertise and often an audience, and already earns something, but has no system to package and own the income. Language that lands: "you have the knowledge and the audience — you just don't own the income yet." They want to turn what they know into an asset they own.
PRICING BAND: accessible-to-mid. Suggest a range — typically $17–$97 for a first asset, up to ~$297 for a bundle or mini-programme. Make the first purchase a no-brainer while respecting that they already invest in their growth.
ANGLE: position the offer as the do-this-first asset that packages their expertise into owned income — not just more content.`;
}

const offerInputSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(120),
  icp: z.enum(["called_expert", "content_creator"]),
  expertise: z.string().trim().min(2).max(600),
  audience: z.string().trim().min(2).max(600),
  transformation: z.string().trim().min(2).max(600),
  proof: z.string().trim().max(800).optional().default(""),
  experienceLevel: z.enum(["starting", "traction", "established"]),
  turnstileToken: z.string().min(1).max(4096),
});

export type OfferInput = z.infer<typeof offerInputSchema>;

export const buildOffer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => offerInputSchema.parse(input))
  .handler(async ({ data }): Promise<GeneratedOffer> => {
    // 1. Bot gate (no-op in dev when TURNSTILE_SECRET_KEY is unset).
    const ts = await verifyTurnstile(data.turnstileToken);
    if (!ts.success && !ts.skipped) {
      throw new Error("Verification failed. Please refresh and try again.");
    }

    // 2. Generate the offer with Claude (structured output → guaranteed JSON).
    const expLabel =
      data.experienceLevel === "starting" ? "just starting (no offer yet)"
      : data.experienceLevel === "traction" ? "some traction (early sales/clients)"
      : "established (selling already, wants to package better)";

    const userPrompt = `Build a complete, sellable offer from this. Stay in NoChill's voice the whole way.

WHO THEY SERVE: ${data.icp === "called_expert" ? "Employed professional (Contentpreneur)" : "Knowledge Creator (Contentpreneur)"}
${icpProfile(data.icp)}

THEIR INPUTS:
- Skill / knowledge / topic: ${data.expertise}
- Who exactly they serve: ${data.audience}
- Result/transformation they deliver: ${data.transformation}
- Proof / credibility they have: ${data.proof || "(none given — coach positioning, do not fabricate)"}
- Where they are now: ${expLabel}

Build the offer: name it, write the one-line promise (headline), the exact who-it's-for, 3 problems it kills, the before→after transformation, 4–6 concrete deliverables, a USD price suggestion with a one-line rationale, the positioning/authority angle, a first CTA line, the single thing they must do this week, and which NOCHILL framework anchors it.`;

    const client = getAnthropic();
    const msg = await client.messages.create({
      model: OFFER_MODEL,
      max_tokens: 4000,
      system: BRAND_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
      // output_config typing varies across SDK versions; the API (Opus 4.8) honours it.
      // Spread an untyped extra so this compiles on any installed @anthropic-ai/sdk.
      ...({ output_config: { format: { type: "json_schema", schema: OFFER_SCHEMA } } } as Record<string, unknown>),
    });

    const block = msg.content.find((b) => b.type === "text");
    const raw = block && "text" in block ? block.text : "";
    let offer: GeneratedOffer;
    try {
      offer = JSON.parse(raw) as GeneratedOffer;
    } catch {
      console.error("[offer-builder] JSON parse failed:", raw.slice(0, 400));
      throw new Error("The builder hit a snag. Please try again.");
    }

    // 3. Capture the lead — non-fatal: never block the offer on a DB/marketing hiccup.
    //    (Table cast as any so this compiles before the migration is applied.)
    void (supabaseAdmin.from("offer_builder_leads" as any) as any)
      .insert({
        email: data.email,
        name: data.name,
        icp: data.icp,
        expertise: data.expertise,
        audience: data.audience,
        transformation: data.transformation,
        proof: data.proof || null,
        experience_level: data.experienceLevel,
        generated_offer: offer,
      })
      .then(({ error }: { error: unknown }) => {
        if (error) console.error("[offer-builder] lead insert failed", error);
      });

    // 4. MailerLite — ICP 1 → professional/buyer nurture, ICP 2 → free-knowledge nurture.
    const nameParts = data.name.trim().split(/\s+/);
    void addToMailerLiteGroup(
      data.email,
      data.icp === "called_expert"
        ? process.env.MAILERLITE_GROUP_ID_CALLED_EXPERT
        : process.env.MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT,
      { first_name: nameParts[0], last_name: nameParts.slice(1).join(" ") || null },
    );

    return offer;
  });
