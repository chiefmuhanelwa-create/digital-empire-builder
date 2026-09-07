import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { KIT_OWNER_SLUGS } from "@/lib/tool-ai.functions";

// Shared, EMAIL-based Foundation-Kit entitlement check for the free lead-magnet
// tools (Hook Generator's free-limit gate, Media Kit's premium unlock). Resolved
// by email rather than account because these tools are intentionally usable
// without logging in — checkout's ensureBuyerUserId() means every real buyer's
// email has a real paid order regardless of whether they ever signed in.
//
// (Distinct from tool-ai.functions.ts `assertKitAccess`, which gates the
// account-authenticated AI tools by the logged-in user.)
export async function emailOwnsFoundationKit(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("metadata")
    .ilike("email", email)
    .eq("status", "paid");
  return (data ?? []).some((o) =>
    KIT_OWNER_SLUGS.includes((o.metadata as { product_slug?: string } | null)?.product_slug ?? ""),
  );
}
