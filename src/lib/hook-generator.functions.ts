import { createServerFn } from "@tanstack/react-start";
import { render } from "@react-email/components";
import { randomUUID } from "crypto";
import * as React from "react";
import { z } from "zod";
import { getRequestIP } from "@tanstack/react-start/server";
import { getAnthropic, COACH_MODEL } from "@/lib/anthropic";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertTurnstile } from "@/lib/turnstile.server";
import { reportError } from "@/lib/error-logger";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { KIT_OWNER_SLUGS } from "@/lib/tool-ai.functions";
import { HookGeneratorResultEmail } from "@/lib/email-templates/hook-generator-result";

const VOICE = `You are NoChill (Ndivhuwo Muhanelwa) writing hooks for a Contentpreneur — someone turning their expertise into content that sells. Voice: direct, raw, SA real-talk, big-brother-with-a-system — never a guru, never generic marketing-speak. Short declarative sentences. No hashtags, no emoji spam, no "In today's world..." preambles. Every hook must be immediately usable — something a real person would actually post, not a template with blanks left in it.`;

const AWARENESS_INSTRUCTION: Record<string, string> = {
  symptom: "They feel the pain but don't know the cause — hook must surface the invisible root cause.",
  problem: "They know the problem exists but haven't found the right fix — hook must name why past fixes failed.",
  solution: "They know solutions exist — hook must show why THIS approach is different.",
  product: "They know the person/offer already — hook must create urgency to act now.",
};

const HookSchema = z.object({
  type: z.string(),
  text: z.string(),
  why: z.string(),
});

// AI generation costs real money per call — this tool is a genuine freemium
// lead-magnet, not an unlimited free API. FREE_LIMIT real generations per
// email, then it requires owning the Foundation Kit (same payment gate
// pattern as Offer Builder's assertKitAccess in tool-ai.functions.ts, but
// resolved by EMAIL here since this tool is intentionally usable without an
// account — checkout's ensureBuyerUserId() means every real buyer's email
// has a real paid order regardless of whether they ever logged in).
const FREE_LIMIT = 3;

async function emailOwnsFoundationKit(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("metadata")
    .ilike("email", email)
    .eq("status", "paid");
  return (data ?? []).some((o) => KIT_OWNER_SLUGS.includes((o.metadata as { product_slug?: string } | null)?.product_slug ?? ""));
}

export const generateHooks = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        topic: z.string().min(1).max(200),
        audience: z.string().min(1).max(200),
        angle: z.string().max(200).optional(),
        awareness: z.enum(["symptom", "problem", "solution", "product"]),
        turnstileToken: z.string().max(2048).optional(),
        email: z.string().email().max(255),
        fullName: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<
    { locked: true; freeUsed: number } | { locked: false; hooks: z.infer<typeof HookSchema>[] }
  > => {
    try {
      await assertTurnstile(data.turnstileToken, getRequestIP({ xForwardedFor: true }) ?? undefined);
    } catch (err) {
      await reportError(err, { endpoint: "generateHooks:turnstile", meta: { topic: data.topic } });
      throw err;
    }

    const email = data.email.toLowerCase();
    const { count } = await supabaseAdmin
      .from("tool_submissions")
      .select("id", { count: "exact", head: true })
      .eq("tool_slug", "hook-generator")
      .eq("email", email);
    const used = count ?? 0;

    if (used >= FREE_LIMIT && !(await emailOwnsFoundationKit(email))) {
      return { locked: true, freeUsed: used };
    }

    const client = getAnthropic();
    const awarenessNote = AWARENESS_INSTRUCTION[data.awareness];
    const msg = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 1200,
      system: VOICE,
      messages: [
        {
          role: "user",
          content: `Write 5 scroll-stopping hooks for a post about: "${data.topic}"
Audience: ${data.audience}
${data.angle ? `Unique angle to weave in: ${data.angle}\n` : ""}Audience awareness stage: ${data.awareness} — ${awarenessNote}

Use 5 DIFFERENT hook types (e.g. contrarian claim, story promise, numbered list, question hook, bold statement) — vary them, don't repeat a pattern. Each hook must be a complete, postable first line — not a fill-in-the-blank template.

Respond with ONLY a JSON array, no markdown fences, no commentary, in this exact shape:
[{"type": "Contrarian", "text": "the actual hook line", "why": "one sentence on why this works for THIS topic/audience"}, ...]`,
        },
      ],
    });

    const block = msg.content.find((b) => b.type === "text");
    const raw = block && "text" in block ? block.text.trim() : "";
    let hooks: z.infer<typeof HookSchema>[];
    try {
      const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "");
      hooks = z.array(HookSchema).min(1).parse(JSON.parse(cleaned));
    } catch (err) {
      await reportError(err, { endpoint: "generateHooks:parse", meta: { raw: raw.slice(0, 500) } });
      throw new Error("Couldn't generate hooks right now — try again in a moment.");
    }

    // Founder's explicit ask: capture real tool-input data across every tool
    // (also what the free-limit count above is read from), and a real email
    // confirmation of the result — same subscriber/MailerLite/queue pattern
    // every other migrated tool uses.
    void supabaseAdmin.from("tool_submissions").insert({
      tool_slug: "hook-generator",
      email,
      payload: { topic: data.topic, audience: data.audience, angle: data.angle ?? null, awareness: data.awareness, hooks },
    });

    void supabaseAdmin.from("subscribers").upsert(
      { email, first_name: data.fullName ?? null, source: "tool:hook-generator" },
      { onConflict: "email", ignoreDuplicates: false },
    );
    void addToMailerLiteGroup(email, process.env.MAILERLITE_GROUP_ID_BUYERS, {
      first_name: data.fullName ?? null,
    });

    const firstName = data.fullName ? data.fullName.split(" ")[0] : null;
    const html = await render(React.createElement(HookGeneratorResultEmail, { firstName, topic: data.topic, hooks }));
    const text = await render(React.createElement(HookGeneratorResultEmail, { firstName, topic: data.topic, hooks }), { plainText: true });
    void supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        run_id: randomUUID(),
        message_id: `hook-generator:${email}:${Date.now()}`,
        to: email,
        from: "CHKPLT <noreply@notify.chkplt.com>",
        sender_domain: "notify.chkplt.com",
        subject: `Your ${hooks.length} hooks for "${data.topic}"`,
        html,
        text,
        purpose: "marketing",
        label: "hook_generator_result",
        queued_at: new Date().toISOString(),
      },
    });

    return { locked: false, hooks };
  });
