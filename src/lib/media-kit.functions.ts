import { createServerFn } from "@tanstack/react-start";
import { render } from "@react-email/components";
import { randomUUID } from "crypto";
import * as React from "react";
import { z } from "zod";
import { getRequestIP, getRequestHost } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertTurnstile } from "@/lib/turnstile.server";
import { reportError } from "@/lib/error-logger";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { groupForTool, assertGroupRouting } from "@/lib/mailerlite-groups";
import { utmRawDataPatch } from "@/lib/utm";
import { MediaKitResultEmail } from "@/lib/email-templates/media-kit-result";

// The full top-1% kit is FREE in Phase 1 — every section builds and emails openly.
// Monetisation (remove watermark, save & re-edit) is a Pro subscription that is
// currently on a waitlist (joinMediaKitProWaitlist below); the premium output is
// only watermarked on the client, not entitlement-gated here.
const premiumSchema = z
  .object({
    positioning: z.string().max(400),
    oneLineProof: z.string().max(300),
    formats: z.string().max(300),
    audiencePsychographics: z.string().max(600),
    audienceBuying: z.string().max(600),
    audienceCities: z.string().max(200),
    audienceInterests: z.string().max(300),
    authenticity: z.string().max(300),
    caseStudies: z
      .array(
        z.object({
          brand: z.string().max(120),
          objective: z.string().max(300),
          whatWeDid: z.string().max(400),
          result: z.string().max(300),
        }),
      )
      .max(6),
    testimonials: z
      .array(z.object({ quote: z.string().max(500), author: z.string().max(160) }))
      .max(6),
    packages: z
      .array(
        z.object({
          tier: z.string().max(40),
          name: z.string().max(120),
          includes: z.string().max(500),
          startingAt: z.string().max(60),
        }),
      )
      .max(6),
    addons: z.array(z.string().max(80)).max(10),
    rightsUsage: z.string().max(300),
    rightsWhitelisting: z.string().max(300),
    rightsExclusivity: z.string().max(300),
    termsTurnaround: z.string().max(160),
    termsRevisions: z.string().max(160),
    termsComms: z.string().max(160),
    paymentTerms: z.string().max(200),
    availability: z.string().max(200),
    press: z.string().max(400),
    currency: z.string().max(8),
    lastUpdated: z.string().max(40),
  })
  .partial()
  .optional();

export type MediaKitPremium = z.infer<typeof premiumSchema>;

// Pro waitlist capture (Phase 1). Validate → capture the lead → tag the source so
// the founder can measure demand before the subscription is built.
export const joinMediaKitProWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email().max(255),
        fullName: z.string().max(200).optional(),
        turnstileToken: z.string().max(2048).optional(),
        utmSource: z.string().max(120).optional(),
        utmMedium: z.string().max(120).optional(),
        utmCampaign: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    try {
      await assertTurnstile(
        data.turnstileToken,
        getRequestIP({ xForwardedFor: true }) ?? undefined,
        getRequestHost(),
      );
    } catch (err) {
      await reportError(err, { endpoint: "joinMediaKitProWaitlist:turnstile" });
      throw err;
    }

    const email = data.email.toLowerCase();
    void supabaseAdmin.from("subscribers").upsert(
      {
        email,
        first_name: data.fullName ?? null,
        source: "tool:media-kit-pro-waitlist",
        ...utmRawDataPatch(data),
      },
      { onConflict: "email", ignoreDuplicates: false },
    );
    await addToMailerLiteGroup(
      email,
      (() => {
        const g = groupForTool("media-kit");
        assertGroupRouting("media-kit", g.id);
        return g.id;
      })(),
      { first_name: data.fullName ?? null },
    );

    return { ok: true };
  });

// Same lead-magnet pattern as Rate Card: the builder itself is free and
// instant, emailing the finished kit is the one place this tool asks for
// an email. This is also the fix for what the external nochill-media-kit
// tool was missing (its email/PDF endpoint has no package.json declaring
// nodemailer/pdfkit, so it 500s in production) — CHKPLT's own builder now
// has a working delivery path instead of depending on that broken one.
export const emailMediaKit = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        recipientEmail: z.string().email().max(255),
        fullName: z.string().max(200).optional(),
        name: z.string().max(200),
        handle: z.string().max(80),
        tagline: z.string().max(300),
        bio: z.string().max(2000),
        location: z.string().max(120).optional(),
        niches: z.string().max(300).optional(),
        platforms: z
          .array(
            z.object({
              name: z.string().max(60),
              followers: z.string().max(40),
              er: z.string().max(20),
              avgViews: z.string().max(40).optional(),
              growth: z.string().max(40).optional(),
              verifiedOn: z.string().max(40).optional(),
            }),
          )
          .max(10),
        targetAudience: z.string().max(300).optional(),
        ageBracket: z.string().max(40).optional(),
        genderSplit: z.string().max(80).optional(),
        pillars: z
          .array(z.object({ name: z.string().max(120), desc: z.string().max(300) }))
          .max(10),
        rates: z.array(z.object({ name: z.string().max(120), price: z.string().max(60) })).max(10),
        statLines: z.array(z.string().max(300)).max(20),
        brands: z.string().max(400).optional(),
        contactEmail: z.string().max(255).optional(),
        booking: z.string().max(200).optional(),
        premium: premiumSchema,
        utmSource: z.string().max(120).optional(),
        utmMedium: z.string().max(120).optional(),
        utmCampaign: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { error: subErr } = await supabaseAdmin.from("subscribers").upsert(
      {
        email: data.recipientEmail,
        first_name: data.fullName ?? null,
        source: "tool:media-kit",
        ...utmRawDataPatch(data),
      },
      { onConflict: "email", ignoreDuplicates: false },
    );
    if (subErr) console.error("[emailMediaKit] subscriber upsert", subErr);

    await addToMailerLiteGroup(
      data.recipientEmail,
      (() => {
        const g = groupForTool("media-kit");
        assertGroupRouting("media-kit", g.id);
        return g.id;
      })(),
      {
        first_name: data.fullName ?? null,
      },
    );

    const emailProps = {
      name: data.name || "Your Name",
      handle: data.handle || "@handle",
      tagline: data.tagline,
      bio: data.bio,
      location: data.location ?? "",
      niches: data.niches ?? "",
      platforms: data.platforms.filter((p) => p.name.trim() && p.followers.trim()),
      targetAudience: data.targetAudience ?? "",
      ageBracket: data.ageBracket ?? "",
      genderSplit: data.genderSplit ?? "",
      pillars: data.pillars.filter((p) => p.name.trim()),
      rates: data.rates.filter((r) => r.name.trim()),
      statLines: data.statLines.filter(Boolean),
      brands: data.brands ?? "",
      email: data.contactEmail ?? "",
      booking: data.booking ?? "",
      premium: data.premium,
    };
    const html = await render(React.createElement(MediaKitResultEmail, emailProps));
    const text = await render(React.createElement(MediaKitResultEmail, emailProps), {
      plainText: true,
    });

    const { error } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        run_id: randomUUID(),
        message_id: `media-kit:${data.recipientEmail}:${Date.now()}`,
        to: data.recipientEmail,
        from: "CHKPLT <noreply@notify.chkplt.com>",
        sender_domain: "notify.chkplt.com",
        subject: `Your media kit — ${data.name || "ready to send"}`,
        html,
        text,
        purpose: "marketing",
        label: "media_kit_result",
        queued_at: new Date().toISOString(),
      },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
