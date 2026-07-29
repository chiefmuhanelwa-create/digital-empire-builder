import { Resend } from "resend";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Ops alerting — the missing piece flagged in the 2026-07-29 automation audit:
// every failure in this app was already logged (console + `incidents` table),
// but NOTHING told the founder it happened. This sends a real email the
// moment something critical breaks.
//
// Deliberately bypasses the pgmq transactional_emails queue and calls Resend
// directly — an alert about the system being broken must not depend on the
// same queue/cron infrastructure that might be part of what's broken. The
// only shared dependency is Resend itself being up, which is an acceptable,
// unavoidable floor (if Resend is down, no email of any kind is going out
// anyway).

const RATE_LIMIT_WINDOW_MINUTES = 15;

export async function sendOpsAlert(params: {
  endpoint: string;
  message: string;
  severity: "critical" | "error" | "warning";
  meta?: Record<string, unknown>;
}): Promise<void> {
  const to = process.env.OPS_ALERT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!to || !apiKey) {
    // No-op, same graceful-degradation pattern as Turnstile/other optional
    // secrets elsewhere in this codebase — alerting is a bonus layer, never
    // a thing that should crash the request that triggered it.
    return;
  }

  try {
    // Suppress a repeat alert for the SAME endpoint within the rate-limit
    // window — a retried webhook or a cron firing every minute must not spam
    // an inbox. A genuinely different endpoint failing still alerts
    // immediately; this only dedupes repeats of the identical failure.
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await supabaseAdmin
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("endpoint", params.endpoint)
      .eq("severity", params.severity)
      .gte("created_at", since);
    if ((count ?? 0) > 1) return; // the row we just inserted is #1 — anything more means we already alerted

    const resend = new Resend(apiKey);
    const icon = params.severity === "critical" ? "🚨" : params.severity === "error" ? "⚠️" : "ℹ️";
    await resend.emails.send({
      from: "CHKPLT Alerts <noreply@notify.chkplt.com>",
      to,
      subject: `${icon} CHKPLT ${params.severity}: ${params.endpoint}`,
      text: `${params.message}\n\nEndpoint: ${params.endpoint}\nTime: ${new Date().toISOString()}\n${
        params.meta ? `\nDetails: ${JSON.stringify(params.meta, null, 2)}\n` : ""
      }\nFull history: https://chkplt.com/admin/incidents`,
    });
  } catch (err) {
    // An alert failing to send must never throw back into the code path
    // that was already handling a real error.
    console.error("[alerts] sendOpsAlert failed", err);
  }
}
