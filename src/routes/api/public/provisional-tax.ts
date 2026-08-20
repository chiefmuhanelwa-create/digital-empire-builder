// Provisional tax estimate delivery + lead capture.
//
// Same shape as /api/public/rate-card, and deliberately so: the lead is written
// to our OWN database FIRST, then synced to MailerLite (awaited — an unawaited
// promise can be cancelled the instant a Worker returns its Response), then the
// email is queued. If anything downstream fails, the lead is already ours.
//
// No origin allowlist. A creator opening this from an Instagram DM posts with
// `Origin: null`, and blocking that cost real leads on the rate card.
import { createFileRoute } from "@tanstack/react-router";
import { render } from "@react-email/components";
import { randomUUID } from "crypto";
import * as React from "react";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { reportError } from "@/lib/error-logger";
import { groupForTool, assertGroupRouting } from "@/lib/mailerlite-groups";
import { computeProvisionalTax, TAX_YEAR } from "@/lib/provisional-tax-engine";
import { generateTaxPDF } from "@/lib/provisional-tax-pdf";
import { TaxResultEmail } from "@/lib/email-templates/provisional-tax-result";

const amounts = z.record(z.string().max(40), z.number().min(0).max(1_000_000_000)).default({});

const bodySchema = z.object({
  name: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(255),
  income: amounts,
  expenses: amounts,
});

const zar = (n: number) => "R " + Math.round(n).toLocaleString("en-ZA");

export const Route = createFileRoute("/api/public/provisional-tax")({
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
          return Response.json({ ok: false, error: "Email and figures required" }, { status: 400 });
        }

        const { income, expenses } = parsed.data;
        const email = parsed.data.email.toLowerCase();
        const displayName = (parsed.data.name || "").trim() || "Creator";
        const firstName = displayName.split(/\s+/)[0];

        try {
          // 1. The lead, into our own database, before anything can fail.
          const { data: existing } = await supabaseAdmin
            .from("subscribers")
            .select("source")
            .eq("email", email)
            .maybeSingle();

          const { error: upsertErr } = await supabaseAdmin.from("subscribers").upsert(
            {
              email,
              first_name: firstName,
              source: existing?.source ?? "tool:provisional-tax",
            },
            { onConflict: "email" },
          );
          if (upsertErr) throw upsertErr;

          // 2. MailerLite — group from the code map, awaited, never
          //    fire-and-forget. This is the routing that silently sent every
          //    tax lead to RATE CARD LEADS when it lived in a secret.
          const group = groupForTool("provisional-tax");
          assertGroupRouting("provisional-tax", group.id);
          await addToMailerLiteGroup(email, group.id, { first_name: firstName });
          console.log(`[provisional-tax] lead -> ${group.name} (${group.id})`);

          // 3. The document.
          const result = computeProvisionalTax({ income, expenses });
          const pdf = await generateTaxPDF({
            creatorName: displayName,
            result,
            income,
            expenses,
            date: new Date().toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          });
          const pdfBase64 = Buffer.from(pdf).toString("base64");
          const filename = `provisional-tax-${displayName
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")}.pdf`;

          const emailProps = {
            firstName,
            taxYear: TAX_YEAR,
            taxable: zar(result.taxable),
            annualTax: zar(result.annualTax),
            firstPayment: zar(result.firstPayment),
            secondPayment: zar(result.secondPayment),
            monthly: zar(result.monthlySetAside),
            effectiveRate: `${(result.effectiveRate * 100).toFixed(1)}%`,
            belowThreshold: result.belowThreshold,
          };
          const html = await render(React.createElement(TaxResultEmail, emailProps));
          const text = await render(React.createElement(TaxResultEmail, emailProps), {
            plainText: true,
          });

          const subject = result.belowThreshold
            ? `${displayName} — your provisional tax estimate (${TAX_YEAR})`
            : `${displayName} — set aside ${zar(result.monthlySetAside)} a month`;

          const { error: queueErr } = await supabaseAdmin.rpc("enqueue_email", {
            queue_name: "transactional_emails",
            payload: {
              run_id: randomUUID(),
              message_id: `provisional-tax:${email}:${Date.now()}`,
              to: email,
              from: "CHKPLT <noreply@notify.chkplt.com>",
              sender_domain: "notify.chkplt.com",
              subject,
              html,
              text,
              attachments: [{ filename, content: pdfBase64 }],
              purpose: "marketing",
              label: "provisional_tax_result",
              queued_at: new Date().toISOString(),
            },
          });
          if (queueErr) throw new Error(queueErr.message);

          return Response.json({ ok: true });
        } catch (err) {
          await reportError(err, {
            endpoint: "provisional-tax",
            severity: "error",
            meta: { email },
          });
          return Response.json(
            { ok: false, error: "Could not send your estimate. Try again." },
            { status: 500 },
          );
        }
      },
      GET: async () =>
        new Response("Provisional tax delivery endpoint. POST only.", { status: 200 }),
    },
  },
});
