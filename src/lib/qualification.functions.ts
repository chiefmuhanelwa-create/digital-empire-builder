import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Look up the most recent stewardship application for an email
 * and return whether the applicant is qualified for the gated
 * Premium Programs (etz_pri) tier.
 */
export const checkQualification = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ email: z.string().trim().email().max(255) }).parse,
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("client_stewardship_applications")
      .select("determined_routing_status, created_at")
      .ilike("email", data.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("checkQualification error:", error);
      return { qualified: false, hasApplication: false };
    }

    return {
      qualified: row?.determined_routing_status === "QUALIFIED_FOR_CORE_PROGRAM",
      hasApplication: !!row,
    };
  });
