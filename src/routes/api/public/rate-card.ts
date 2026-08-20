// Rate-card PDF delivery + lead capture, on CHKPLT's own infrastructure.
//
// Replaces https://nochill-rate-card.vercel.app/api/send-rate-card, which the
// iframed tool at /tools/rate-card/index.html used to POST to. That endpoint
// generated and mailed the PDF fine (pdfkit + Zoho SMTP), but its lead capture
// was dead: it pushed every subscriber into MailerLite group
// 189168267230709259, a group that no longer exists, inside a
// `.catch(() => {})`. Every lead since then was silently discarded — the
// creator got their PDF and the list got nothing.
//
// Here the PDF is generated with pdf-lib (Workers-safe), mailed through the
// same Resend queue as every other CHKPLT email, and the lead is written to
// `subscribers` FIRST — so even if MailerLite or Resend has a bad day, the
// lead is already ours in our own database.
import { createFileRoute } from "@tanstack/react-router";
import { render } from "@react-email/components";
import { randomUUID } from "crypto";
import * as React from "react";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { reportError } from "@/lib/error-logger";
import { groupForTool, assertGroupRouting } from "@/lib/mailerlite-groups";
import { generateRateCardPDF } from "@/lib/rate-card-pdf";
import { RateCardResultEmail } from "@/lib/email-templates/rate-card-result";

// Shape the tool already sends — kept identical so the static tool file needs
// only its URL changed, not its payload.
const bodySchema = z.object({
  name: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(255),
  brand: z.string().trim().max(200).optional(),
  rateData: z.object({
    creatorName: z.string().max(200).optional(),
    handle: z.string().max(120).optional(),
    platform: z.string().max(300).optional(),
    tier: z.string().max(120).optional(),
    er: z.string().max(20).optional(),
    erLabel: z.string().max(80).optional(),
    floor: z.string().max(40).optional(),
    standard: z.string().max(40).optional(),
    ceiling: z.string().max(40).optional(),
    followers: z.string().max(40).optional(),
    date: z.string().max(60).optional(),
  }),
});

// Origins we EXPECT. Anything else is logged, not blocked — see below.
const KNOWN_ORIGINS = new Set([
  "https://chkplt.com",
  "https://www.chkplt.com",
  // The site currently answers on plain http too, so these are real traffic,
  // not anomalies worth flagging.
  "http://chkplt.com",
  "http://www.chkplt.com",
  "https://contentpreneur.africa",
  "http://localhost:3000",
  "http://localhost:5173",
]);

export const Route = createFileRoute("/api/public/rate-card")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 2026-08-13: this used to 403 any origin outside a 4-item allowlist.
        // A real creator hit "Forbidden" — he opened the link from an Instagram
        // DM, and Meta's in-app browser posts with `Origin: null`. Confirmed
        // against production: `Origin: null` → 403, no origin at all → 200.
        // So the check was blocking the single most important traffic source
        // this business has (DM links) while stopping no actual attacker: an
        // Origin header is trivially forged by any script, so it only ever
        // filtered real browsers. Log the unexpected origin and carry on; the
        // real control for abuse here is rate limiting, not this.
        const origin = request.headers.get("Origin");
        if (origin && !KNOWN_ORIGINS.has(origin)) {
          console.warn("[rate-card] unexpected origin (allowed):", origin);
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: "Email and rate data required" },
            { status: 400 },
          );
        }

        const { rateData, brand } = parsed.data;
        const email = parsed.data.email.toLowerCase();
        const displayName = (parsed.data.name || rateData.creatorName || "").trim() || "Creator";
        const firstName = displayName.split(/\s+/)[0];

        try {
          // Lead first — this is the whole point of the rewrite.
          const { data: existing } = await supabaseAdmin
            .from("subscribers")
            .select("source")
            .eq("email", email)
            .maybeSingle();

          const { error: upsertErr } = await supabaseAdmin.from("subscribers").upsert(
            {
              email,
              first_name: firstName,
              // First-touch wins, same convention as manychat-lead.ts.
              source: existing?.source ?? "tool:rate-card",
            },
            { onConflict: "email" },
          );
          if (upsertErr) throw upsertErr;

          // Group comes from the code map, not a secret — see
          // src/lib/mailerlite-groups.ts for why.
          const group = groupForTool("rate-card");
          assertGroupRouting("rate-card", group.id);
          // Awaited, not fire-and-forget: on Workers an unawaited promise can be
          // cancelled the moment the Response returns.
          await addToMailerLiteGroup(email, group.id, { first_name: firstName });
          console.log(`[rate-card] lead -> ${group.name} (${group.id})`);

          const pdf = await generateRateCardPDF({ ...rateData, brand });
          const pdfBase64 = Buffer.from(pdf).toString("base64");
          const filename = `rate-card-${displayName
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")}.pdf`;

          const emailProps = {
            firstName,
            brand: brand ?? null,
            tier: rateData.tier ?? null,
            platform: (rateData.platform ?? "").split(" · ")[0] || null,
            floor: rateData.floor ?? "R 0",
            standard: rateData.standard ?? "R 0",
            ceiling: rateData.ceiling ?? "R 0",
          };
          const html = await render(React.createElement(RateCardResultEmail, emailProps));
          const text = await render(React.createElement(RateCardResultEmail, emailProps), {
            plainText: true,
          });

          const { error: queueErr } = await supabaseAdmin.rpc("enqueue_email", {
            queue_name: "transactional_emails",
            payload: {
              run_id: randomUUID(),
              message_id: `rate-card:${email}:${Date.now()}`,
              to: email,
              from: "CHKPLT <noreply@notify.chkplt.com>",
              sender_domain: "notify.chkplt.com",
              subject: `${displayName} — your creator rate card is ready`,
              html,
              text,
              attachments: [{ filename, content: pdfBase64 }],
              purpose: "marketing",
              label: "rate_card_result",
              queued_at: new Date().toISOString(),
            },
          });
          if (queueErr) throw new Error(queueErr.message);

          return Response.json({ ok: true });
        } catch (err) {
          await reportError(err, { endpoint: "rate-card", severity: "error", meta: { email } });
          return Response.json(
            { ok: false, error: "Could not send your rate card. Try again." },
            { status: 500 },
          );
        }
      },
      GET: async () => new Response("Rate card delivery endpoint. POST only.", { status: 200 }),
    },
  },
});
