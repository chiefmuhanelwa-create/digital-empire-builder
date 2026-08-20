// Canonical tool → MailerLite group routing.
//
// WHY THIS IS IN CODE AND NOT IN SECRETS
// ======================================
// These were per-tool env vars (MAILERLITE_GROUP_ID_RATE_CARD,
// MAILERLITE_GROUP_ID_TAX, …) set individually with `wrangler secret put`.
// On 2026-08-13 every API-captured lead landed in RATE CARD LEADS regardless of
// which tool produced it — 21 in one day — while TAX LEADS received nothing but
// webform signups. The code was correct; the secret's VALUE was wrong, and
// because Worker secrets are write-only, nothing could read it back to catch it.
//
// A MailerLite group id is an identifier, not a credential. Keeping it in code:
//   • makes routing reviewable in a diff instead of invisible in a secret store
//   • makes a wrong id impossible to paste in silently
//   • lets assertGroupRouting() fail loudly instead of mis-filing a lead
//
// If a group is ever recreated in MailerLite, change it HERE, in one place.

export const TOOL_GROUPS = {
  "rate-card": { id: "195639769718327259", name: "RATE CARD LEADS" },
  "provisional-tax": { id: "195704432781952522", name: "TAX LEADS" },
  // These three used to write to MAILERLITE_GROUP_ID_BUYERS, which pointed at a
  // group someone had literally named "MAILERLITE_GROUP_ID_BUYERS" — the env var
  // name pasted into the name field. Five people who had only used a free tool
  // sat in it, labelled as customers. They are now in TOOL LEADS.
  "hook-generator": { id: "195733205035255288", name: "TOOL LEADS" },
  "media-kit": { id: "195733205035255288", name: "TOOL LEADS" },
  "offer-builder": { id: "195733205035255288", name: "TOOL LEADS" },
  // Claiming a FREE product also wrote to the buyers group. Someone who took
  // something free is a lead, not a customer.
  "free-product": { id: "195733205035255288", name: "TOOL LEADS" },
  // The public Positioning Brief. Shares TOOL LEADS rather than getting its own
  // group: a new group is only worth creating when it will be segmented on, and
  // nothing is segmented on tool-of-origin today. `source` on `subscribers`
  // already records which tool produced the lead, in our own database, where it
  // can be read back — unlike a MailerLite group id, which cannot.
  positioning: { id: "195733205035255288", name: "TOOL LEADS" },
} as const;

// Paying customers only, written by order fulfilment after money has moved.
// Deliberately NOT in TOOL_GROUPS: nothing that captures a free lead should be
// able to resolve to it, which is exactly how five non-buyers got labelled as
// buyers in the first place.
export const BUYERS_GROUP = { id: "190855383448815273", name: "CHKPLT BUYERS" } as const;

export type ToolGroupKey = keyof typeof TOOL_GROUPS;

/**
 * Resolve the group for a tool. Throws rather than guessing — a lead filed
 * into the wrong list is worse than a loud failure, because it is invisible
 * and it pollutes someone else's audience.
 */
export function groupForTool(tool: ToolGroupKey): { id: string; name: string } {
  const group = TOOL_GROUPS[tool];
  if (!group?.id) {
    throw new Error(`No MailerLite group configured for tool "${tool}"`);
  }
  return group;
}

/**
 * Guard against the exact failure that caused this file to exist: two tools
 * resolving to the same group id. Cheap enough to run per request.
 */
export function assertGroupRouting(tool: ToolGroupKey, resolvedId: string): void {
  // A tool must never resolve to the buyers list — that is the mistake this
  // module exists to prevent.
  if (resolvedId === BUYERS_GROUP.id) {
    throw new Error(
      `Tool "${tool}" resolved to ${BUYERS_GROUP.name}. Free-tool leads must never be filed as buyers.`,
    );
  }
  // Tools that are meant to be separate must not collide. Several tools
  // intentionally share TOOL LEADS, so only flag a mismatch against the tool's
  // own declared group.
  const own = TOOL_GROUPS[tool];
  if (own.id !== resolvedId) {
    throw new Error(
      `Routing mismatch: "${tool}" should file to ${own.name} (${own.id}) but resolved to ${resolvedId}.`,
    );
  }
}
