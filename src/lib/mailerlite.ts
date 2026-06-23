// Fire-and-forget MailerLite v3 helper.
// Silently skips if MAILERLITE_API_KEY or groupId is falsy — safe to call unconditionally.
export async function addToMailerLiteGroup(
  email: string,
  groupId: string | undefined | null,
  fields?: { first_name?: string | null; last_name?: string | null },
): Promise<void> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey || !groupId) return;

  const body: Record<string, unknown> = { email, groups: [groupId] };
  if (fields?.first_name || fields?.last_name) {
    body.fields = {
      ...(fields.first_name ? { name: fields.first_name } : {}),
      ...(fields.last_name ? { last_name: fields.last_name } : {}),
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
