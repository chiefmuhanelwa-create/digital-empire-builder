import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAnthropic, OFFER_MODEL, COACH_MODEL } from "@/lib/anthropic";

const KIT_OWNER_SLUGS = ["called-expert-foundation-kit", "called-expert-starter-bundle"];

// Gate: only kit owners (or admins) get AI coaching — it costs money per call.
async function assertKitAccess(userId: string) {
  const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return;
  const { data: kits } = await supabaseAdmin.from("products").select("id").in("slug", KIT_OWNER_SLUGS);
  const ids = (kits ?? []).map((k) => k.id);
  if (ids.length) {
    const { data: grant } = await supabaseAdmin
      .from("product_grants").select("id").eq("user_id", userId).in("product_id", ids).is("revoked_at", null).maybeSingle();
    if (grant) return;
  }
  throw new Error("AI coaching is part of the Foundation Kit.");
}

const VOICE = `You are NoChill (Ndivhuwo Muhanelwa) coaching a Called Expert (32–50, real expertise, wants to monetise their knowledge without quitting their job). Voice: direct, raw, SA real-talk, big-brother-with-a-system — never a guru. Short declarative sentences. Confrontation is care. No AI slop, no hype adjectives, no "In this..." preambles. SA English. Faith only if natural, never the lead. HARD RULE: coach from THEIR words; never invent numbers, results or testimonials for them. Prices in USD.`;

// Per-tool context so the coaching is specific to the step.
const TOOL_CONTEXT: Record<string, string> = {
  "ms-ts-ss": "Tool: MS×TS×SS Readiness — Mindset×Toolset×Skillset (they multiply; a zero anywhere = zero).",
  "knowledge-audit": "Tool: Knowledge Audit — finding the product hiding in their expertise (inventory + MS×TS×SS).",
  "niche-clarity": "Tool: Niche Clarity — WHO × FROM (pain) × TO (outcome) × USING (edge), one-line niche.",
  "4e-content-calendar": "Tool: 4E Content Calendar — 30-day 9/9/9/3 (Educate/Entertain/Encourage/Earn).",
  "seeds-pipeline": "Tool: SEEDS Pipeline — Signal→Engagement→Education→Decision→Success.",
  "dares-asset-model": "Tool: DARES Asset Model — Digital/Automated/Recurring/Evergreen/Scalable asset score.",
  "paids": "Tool: PAIDS Auditor — Products/Ads&Affiliates/Information/Deals/Services income spread.",
  "right-side": "Tool: Right Side Diagnostic — owned vs rented platforms (build on land you own).",
};

export const getToolCoaching = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ tool: z.string().min(1).max(40), payload: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ coaching: string }> => {
    await assertKitAccess((context as any).userId);
    const ctx = TOOL_CONTEXT[data.tool] ?? `Tool: ${data.tool}.`;
    const client = getAnthropic();
    const msg = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 700,
      system: VOICE,
      messages: [{
        role: "user",
        content: `${ctx}\n\nHere are the user's own answers/results from this tool:\n${data.payload}\n\nCoach them in 2–3 short paragraphs: name what's strong, name the ONE weakness honestly, and give ONE specific next move (a command they can do this week) tied to THEIR answers. No headers, no bullet dump — talk to them.`,
      }],
    });
    const block = msg.content.find((b) => b.type === "text");
    const coaching = block && "text" in block ? block.text.trim() : "";
    if (!coaching) throw new Error("Coaching is unavailable right now. Try again in a moment.");
    return { coaching };
  });

export const buildClarityPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ answers: z.string().min(1).max(12000) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ plan: string }> => {
    await assertKitAccess((context as any).userId);
    const client = getAnthropic();
    const msg = await client.messages.create({
      model: OFFER_MODEL,
      max_tokens: 2500,
      system: VOICE,
      messages: [{
        role: "user",
        content: `This Called Expert has worked through the 7-step Clarity System. Here are their saved answers from each tool (some may be blank — work with what's there, don't fabricate):\n\n${data.answers}\n\nWrite their personalised CLARITY PLAN — the one-page plan they walk away with. Use these sections with short, specific, in-their-words content:\n1. YOUR LANE — their one-line niche.\n2. WHAT YOU SELL FIRST — the single offer to build (from their knowledge/DARES idea), with a USD price suggestion.\n3. YOUR CONTENT — the 1–2 content angles to run (from 4E).\n4. YOUR PIPELINE — the first opt-in + how a stranger becomes a buyer (from SEEDS).\n5. YOUR NEXT 7 DAYS — 3 concrete commands, in order.\nKeep it tight (under 400 words), direct, NoChill voice. Plain text with the numbered section headers in CAPS. No preamble.`,
      }],
    });
    const block = msg.content.find((b) => b.type === "text");
    const plan = block && "text" in block ? block.text.trim() : "";
    if (!plan) throw new Error("Couldn't build your plan right now. Try again in a moment.");
    return { plan };
  });
