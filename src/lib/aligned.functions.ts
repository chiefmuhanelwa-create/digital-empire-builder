import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertTurnstile } from "./turnstile.server";
import { addToMailerLiteGroup } from "./mailerlite";

// Lead capture for the ALIGN·ACCELERATE·EXCEL toolkit (Aligned 2026 giveaway).
// Captures the warm lead into `subscribers` (source: aligned-2026) and syncs to
// MailerLite so the stage talk feeds the owned list — the John 21 "right side".
export const subscribeAlignedToolkit = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().max(255),
        phone: z.string().trim().max(40).optional(),
        // The lowest phase from their self-assessment — lets us segment the sequence.
        focusPhase: z.enum(["align", "accelerate", "excel"]).optional(),
        turnstileToken: z.string().max(2048).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertTurnstile(
      data.turnstileToken,
      getRequestIP({ xForwardedFor: true }) ?? undefined,
    );

    const email = data.email.toLowerCase();
    const firstName = data.name.split(" ")[0];

    const { error } = await supabaseAdmin.from("subscribers").upsert(
      {
        email,
        first_name: firstName,
        phone: data.phone ?? null,
        source: "aligned-2026",
      },
      { onConflict: "email" },
    );
    if (error) throw new Error("Could not save your details. Please try again.");

    // Fire-and-forget — never block the buyer/lead on MailerLite.
    void addToMailerLiteGroup(
      email,
      process.env.MAILERLITE_GROUP_ID_ALIGNED ??
        process.env.MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT,
      { first_name: firstName },
    );

    return { ok: true };
  });
