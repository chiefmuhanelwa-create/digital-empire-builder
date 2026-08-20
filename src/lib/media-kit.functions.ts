import { createServerFn } from "@tanstack/react-start";
import { render } from "@react-email/components";
import { randomUUID } from "crypto";
import * as React from "react";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { groupForTool, assertGroupRouting } from "@/lib/mailerlite-groups";
import { utmRawDataPatch } from "@/lib/utm";
import { MediaKitResultEmail } from "@/lib/email-templates/media-kit-result";

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
        platforms: z
          .array(
            z.object({
              name: z.string().max(60),
              followers: z.string().max(40),
              er: z.string().max(20),
            }),
          )
          .max(10),
        pillars: z
          .array(z.object({ name: z.string().max(120), desc: z.string().max(300) }))
          .max(10),
        rates: z.array(z.object({ name: z.string().max(120), price: z.string().max(60) })).max(10),
        statLines: z.array(z.string().max(300)).max(20),
        contactEmail: z.string().max(255).optional(),
        booking: z.string().max(200).optional(),
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
      platforms: data.platforms.filter((p) => p.name.trim() && p.followers.trim()),
      pillars: data.pillars.filter((p) => p.name.trim()),
      rates: data.rates.filter((r) => r.name.trim()),
      statLines: data.statLines.filter(Boolean),
      email: data.contactEmail ?? "",
      booking: data.booking ?? "",
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
