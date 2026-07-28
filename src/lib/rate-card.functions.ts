import { createServerFn } from "@tanstack/react-start";
import { render } from "@react-email/components";
import { randomUUID } from "crypto";
import * as React from "react";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { RateCardResultEmail } from "@/lib/email-templates/rate-card-result";

// Rate Card's lead-magnet moment: the calculator itself is free and instant
// (nothing leaves the browser), but emailing the result requires an email —
// that's the actual lead-capture gate, same pattern the other migrated tools
// use, applied here instead of a paywall since this tool stays a free
// marketing asset per its own page copy ("Free. Nothing leaves your browser.").
export const emailRateCard = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      email: z.string().email().max(255),
      fullName: z.string().max(200).optional(),
      niche: z.string().max(120),
      total: z.string().max(40),
      low: z.string().max(40),
      high: z.string().max(40),
      deliverable: z.string().max(80),
      breakdown: z.array(z.object({ label: z.string().max(120), value: z.string().max(40) })).max(10),
      marketNote: z.string().max(500),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error: subErr } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email: data.email, first_name: data.fullName ?? null, source: "tool:rate-card" },
        { onConflict: "email", ignoreDuplicates: false },
      );
    if (subErr) console.error("[emailRateCard] subscriber upsert", subErr);

    void addToMailerLiteGroup(data.email, process.env.MAILERLITE_GROUP_ID_BUYERS, {
      first_name: data.fullName ?? null,
    });

    const firstName = data.fullName ? data.fullName.split(" ")[0] : null;
    const emailProps = {
      firstName,
      niche: data.niche,
      total: data.total,
      low: data.low,
      high: data.high,
      deliverable: data.deliverable,
      breakdown: data.breakdown,
      marketNote: data.marketNote,
    };
    const html = await render(React.createElement(RateCardResultEmail, emailProps));
    const text = await render(React.createElement(RateCardResultEmail, emailProps), { plainText: true });

    const { error } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        run_id: randomUUID(),
        message_id: `rate-card:${data.email}:${Date.now()}`,
        to: data.email,
        from: "CHKPLT <noreply@notify.chkplt.com>",
        sender_domain: "notify.chkplt.com",
        subject: `Your rate card: ${data.total} per ${data.deliverable}`,
        html,
        text,
        purpose: "marketing",
        label: "rate_card_result",
        queued_at: new Date().toISOString(),
      },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
