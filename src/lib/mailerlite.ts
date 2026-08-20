import { reportError } from "@/lib/error-logger";

// Fire-and-forget MailerLite v3 helper.
// Silently skips if MAILERLITE_API_KEY or groupId is falsy — safe to call unconditionally.
export async function addToMailerLiteGroup(
  email: string,
  groupId: string | undefined | null,
  fields?: {
    first_name?: string | null;
    last_name?: string | null;
    // Any other MailerLite custom field (segment, pain_point, source_platform,
    // source_keyword, icp, focus_phase, ...) — the field must already exist in
    // MailerLite (Subscribers → Fields); the v3 API does not auto-create them.
    custom?: Record<string, string | null | undefined>;
  },
): Promise<void> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey || !groupId) return;

  const customFields = Object.fromEntries(
    Object.entries(fields?.custom ?? {}).filter(([, v]) => !!v),
  );

  const body: Record<string, unknown> = { email, groups: [groupId] };
  if (fields?.first_name || fields?.last_name || Object.keys(customFields).length > 0) {
    body.fields = {
      ...(fields?.first_name ? { name: fields.first_name } : {}),
      ...(fields?.last_name ? { last_name: fields.last_name } : {}),
      ...customFields,
    };
  }

  try {
    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      const message = `[mailerlite] group ${groupId} sync failed ${res.status}: ${text.slice(0, 200)}`;
      console.warn(message);

      // A 4xx here (other than a timeout/rate-limit) is CONFIGURATION, not a
      // hiccup: the group was deleted or the env var points at a stale ID, and
      // EVERY lead down this path will keep failing until a human changes it.
      // At "warning" that never alerts — it just accumulates in /admin/incidents,
      // which is how group 190855179540628547 sat dead and unnoticed (found
      // 2026-08-18). Transient failures (5xx, 429, network) stay a warning.
      const isConfigFailure = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;

      await reportError(new Error(message), {
        // Per-group endpoint so sendOpsAlert's 15-minute dedup is per broken
        // group, and so the alert subject line names the one that is broken.
        endpoint: isConfigFailure ? `addToMailerLiteGroup:invalid-group:${groupId}` : "addToMailerLiteGroup",
        severity: isConfigFailure ? "critical" : "warning",
        meta: { email, groupId, status: res.status },
      });
    }
  } catch (err) {
    console.warn("[mailerlite] fetch error:", err);
    await reportError(err, {
      endpoint: "addToMailerLiteGroup",
      severity: "warning",
      meta: { email, groupId },
    });
  }
}
