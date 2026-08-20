// Positioning Brief — PDF generation, delivery and lead capture.
//
// Same shape as api/public/rate-card.ts, and for the same reasons:
//   • the lead is written to `subscribers` FIRST, so a bad day at MailerLite or
//     Resend cannot cost us the lead
//   • the PDF is pdf-lib (pdfkit needs `fs`, which Workers do not have)
//   • the email goes on the same Resend queue as everything else, so retries
//     and the dead-letter queue are already handled
//   • no origin allowlist — a real user hit "Forbidden" once because Meta's
//     in-app browser posts `Origin: null` from a DM link, which is the single
//     most important traffic source this business has
//
// The tool answers can also be kept for the buyer: `tool_submissions` gets the
// payload so a signed-in person's work is not stranded in one browser.
import { createFileRoute } from "@tanstack/react-router";
import { render } from "@react-email/components";
import { randomUUID } from "crypto";
import * as React from "react";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { reportError } from "@/lib/error-logger";
import { groupForTool, assertGroupRouting } from "@/lib/mailerlite-groups";
import { generatePositioningPDF } from "@/lib/positioning-pdf";
import { PositioningResultEmail } from "@/lib/email-templates/positioning-result";
import {
  assembleSentence, runTests, score, verdictFor, type Positioning,
} from "@/lib/positioning-engine";

const bodySchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(255),
  who: z.string().trim().max(300),
  from: z.string().trim().max(300),
  to: z.string().trim().max(300),
  timeframe: z.string().trim().max(120),
  output: z.string().trim().max(300),
  price: z.number().int().nonnegative().max(100_000_000).nullable().optional(),
});

export const Route = createFileRoute("/api/public/positioning")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: "We need your email and your five answers." },
            { status: 400 },
          );
        }

        const d = parsed.data;
        const email = d.email.toLowerCase();
        const displayName = (d.name || "").trim();
        const firstName = displayName ? displayName.split(/\s+/)[0] : "";

        // Refuse to send a brief built on nothing. A PDF that says "___" five
        // times is worse than an error: it burns the one email they gave us.
        const filled = [d.who, d.from, d.to, d.timeframe, d.output].filter((x) => x.trim().length > 1).length;
        if (filled < 4) {
          return Response.json(
            { ok: false, error: "Fill in at least four of the five before sending — a brief built on blanks is not worth your inbox." },
            { status: 400 },
          );
        }

        const positioning: Positioning = {
          who: d.who, from: d.from, to: d.to,
          timeframe: d.timeframe, output: d.output,
          price: d.price ?? null,
        };

        try {
          // ── 1. the lead, before anything that can fail
          const { data: existing } = await supabaseAdmin
            .from("subscribers")
            .select("source")
            .eq("email", email)
            .maybeSingle();

          const { error: upsertErr } = await supabaseAdmin.from("subscribers").upsert(
            {
              email,
              first_name: firstName || null,
              // First touch wins — same convention as every other capture.
              source: existing?.source ?? "tool:positioning",
            },
            { onConflict: "email" },
          );
          if (upsertErr) throw upsertErr;

          // ── 2. their answers, so the work is not stranded in one browser
          await supabaseAdmin.from("tool_submissions").insert({
            tool_slug: "positioning",
            email,
            payload: { ...positioning, sentence: assembleSentence(positioning) },
          });

          // ── 3. list routing, from code rather than a write-only secret
          const group = groupForTool("positioning");
          assertGroupRouting("positioning", group.id);
          // Awaited: on Workers an unawaited promise dies when the Response returns.
          await addToMailerLiteGroup(email, group.id, firstName ? { first_name: firstName } : undefined);

          // ── 4. the artifact
          const results = runTests(positioning);
          const passed = score(results);
          const v = verdictFor(passed);
          const pdf = await generatePositioningPDF(positioning, displayName || null);
          const pdfBase64 = Buffer.from(pdf).toString("base64");

          const props = {
            firstName: firstName || null,
            sentence: assembleSentence(positioning),
            passed,
            headline: v.headline,
            failing: results.filter((r) => !r.passed).map((r) => r.name),
          };
          const html = await render(React.createElement(PositioningResultEmail, props));
          const text = await render(React.createElement(PositioningResultEmail, props), { plainText: true });

          const { error: queueErr } = await supabaseAdmin.rpc("enqueue_email", {
            queue_name: "transactional_emails",
            payload: {
              run_id: randomUUID(),
              message_id: `positioning:${email}:${Date.now()}`,
              to: email,
              from: "Contentpreneur Africa <noreply@notify.chkplt.com>",
              sender_domain: "notify.chkplt.com",
              // Lowercase, unpunctuated, four to five words — house rule.
              subject: "your positioning brief is ready",
              html,
              text,
              attachments: [{ filename: "positioning-brief.pdf", content: pdfBase64 }],
              purpose: "marketing",
              label: "positioning_brief",
              queued_at: new Date().toISOString(),
            },
          });
          if (queueErr) throw new Error(queueErr.message);

          return Response.json({ ok: true, passed });
        } catch (err) {
          await reportError(err, { endpoint: "positioning", severity: "error", meta: { email } });
          return Response.json(
            { ok: false, error: "Could not send your brief. Try again in a minute." },
            { status: 500 },
          );
        }
      },
    },
  },
});
