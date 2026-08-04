import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { render } from "@react-email/components";
import { randomUUID } from "crypto";
import * as React from "react";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { utmRawDataPatch } from "@/lib/utm";
import { reportError } from "@/lib/error-logger";
import { StarterKitResultEmail } from "@/lib/email-templates/starterkit-result";

// The free Starter Kit's only job: capture the email, never fail the signup
// experience even if MailerLite is down/misconfigured (same "fire and forget,
// non-blocking" discipline as every other lead-capture flow in this codebase —
// order-fulfillment.ts, offer-builder.functions.ts, apply.functions.ts).
export const claimStarterKit = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email().max(255),
        name: z.string().max(120).optional(),
        utmSource: z.string().max(120).optional(),
        utmMedium: z.string().max(120).optional(),
        utmCampaign: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    const nameParts = (data.name ?? "").trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0];

    const { error: subErr } = await supabaseAdmin.from("subscribers").upsert(
      {
        email,
        first_name: firstName || null,
        last_name: nameParts.slice(1).join(" ") || null,
        source: "starterkit",
        ...utmRawDataPatch(data),
      },
      { onConflict: "email" },
    );
    if (subErr) {
      await reportError(subErr, { endpoint: "claimStarterKit", meta: { email } });
    }

    void addToMailerLiteGroup(email, process.env.MAILERLITE_GROUP_ID_STARTER_KIT, {
      first_name: firstName,
      last_name: nameParts.slice(1).join(" ") || null,
    });

    // Real transactional confirmation — don't depend on a MailerLite
    // automation existing/being wired correctly (found 2026-08-02: it wasn't).
    // Same enqueue_email pattern as hook-generator/offer-builder/media-kit.
    const host = getRequestHost();
    const protocol = host.includes("localhost") ? "http" : "https";
    const downloadUrl = `${protocol}://${host}/downloads/knowledge-entrepreneur-starter-kit.html`;
    try {
      const html = await render(
        React.createElement(StarterKitResultEmail, { firstName, downloadUrl }),
      );
      const text = await render(
        React.createElement(StarterKitResultEmail, { firstName, downloadUrl }),
        { plainText: true },
      );
      // Stable per email (not per-request) so a double-click or retry can't
      // send a second copy — same idempotency discipline as every other
      // enqueue_email call in this codebase (e.g. order-fulfillment.ts's
      // `order:${order.id}:receipt`), enforced by email_send_log's unique
      // index on message_id.
      const { error: enqueueErr } = await supabaseAdmin.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          run_id: randomUUID(),
          message_id: `starterkit:${email}`,
          to: email,
          from: "CHKPLT <noreply@notify.chkplt.com>",
          sender_domain: "notify.chkplt.com",
          subject: "Your Knowledge Entrepreneur Starter Kit is here",
          html,
          text,
          purpose: "marketing",
          label: "starterkit_result",
          queued_at: new Date().toISOString(),
        },
      });
      if (enqueueErr) throw enqueueErr;
    } catch (err) {
      // Never fail the signup on an email hiccup — but never swallow it
      // silently either (this exact silent-failure shape is what caused the
      // "no email is coming" bug in the first place, 2026-08-02).
      await reportError(err, { endpoint: "claimStarterKit:enqueue_email", meta: { email } });
    }

    return { ok: true as const, downloadUrl };
  });
