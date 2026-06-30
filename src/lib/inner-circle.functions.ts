import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SUBSCRIPTION_PLANS } from "@/lib/checkout.functions";

const INNER_CIRCLE_PLAN = SUBSCRIPTION_PLANS["called-expert-inner-circle"];

/** Is the signed-in member an active Inner Circle subscriber (or admin)? */
export const getInnerCircleStatus = createServerFn({ method: "GET" })
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
      .eq("plan_code", INNER_CIRCLE_PLAN)
      .maybeSingle();

    const row = data as { current_period_end: string | null; status: string | null } | null;
    const active = !!row && (row.status === "active" ||
      (!!row.current_period_end && new Date(row.current_period_end) > new Date()));
    return { active, currentPeriodEnd: row?.current_period_end ?? null };
  });
