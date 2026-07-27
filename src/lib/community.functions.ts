import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SUBSCRIPTION_PLANS } from "@/lib/checkout.functions";

// Mirrors inner-circle.functions.ts exactly — a second subscription product needs
// its own status check filtered by ITS OWN plan_code specifically. The generic
// has_active_subscription(email) SQL function checks for ANY active subscription
// regardless of which product it's for, so it must not be used here — a Community
// member with no Inner Circle subscription (or vice versa) would otherwise be
// shown as "active" on both dashboards.
const COMMUNITY_PLAN = SUBSCRIPTION_PLANS["contentpreneur-community"];

/** Is the signed-in member an active Community subscriber (or admin)? */
export const getCommunityStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ active: boolean; admin?: boolean; currentPeriodEnd: string | null }> => {
    const userId = (context as any).userId as string;
    const email = ((context as any).claims?.email as string | undefined)?.toLowerCase();

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (isAdmin) return { active: true, admin: true, currentPeriodEnd: null };
    if (!email) return { active: false, currentPeriodEnd: null };

    const { data } = await supabaseAdmin
      .from("subscriptions" as any)
      .select("current_period_end,status")
      .eq("email", email)
      .eq("plan_code", COMMUNITY_PLAN)
      .maybeSingle();

    const row = data as { current_period_end: string | null; status: string | null } | null;
    const active = !!row && (row.status === "active" ||
      (!!row.current_period_end && new Date(row.current_period_end) > new Date()));
    return { active, currentPeriodEnd: row?.current_period_end ?? null };
  });
