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
      console.warn(`[mailerlite] group ${groupId} sync failed ${res.status}: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn("[mailerlite] fetch error:", err);
  }
}
