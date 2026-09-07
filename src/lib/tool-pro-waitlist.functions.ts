import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestIP, getRequestHost } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertTurnstile } from "@/lib/turnstile.server";
import { reportError } from "@/lib/error-logger";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { groupForTool, assertGroupRouting } from "@/lib/mailerlite-groups";
import { utmRawDataPatch } from "@/lib/utm";

// Shared "Pro" waitlist capture for the free lead-magnet tools (Media Kit Pro,
// Rate Card Pro). Phase-1 validation before any subscription billing is built:
// Turnstile → capture the lead tagged `tool:{tool}-pro-waitlist` → MailerLite,
// so the founder can measure demand per tool. `tool` must be a routed tool slug.
export const joinToolProWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        tool: z.enum(["media-kit", "rate-card"]),
        email: z.string().email().max(255),
        fullName: z.string().max(200).optional(),
        turnstileToken: z.string().max(2048).optional(),
        utmSource: z.string().max(120).optional(),
        utmMedium: z.string().max(120).optional(),
        utmCampaign: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    try {
      await assertTurnstile(
        data.turnstileToken,
        getRequestIP({ xForwardedFor: true }) ?? undefined,
        getRequestHost(),
      );
    } catch (err) {
      await reportError(err, { endpoint: "joinToolProWaitlist:turnstile", meta: { tool: data.tool } });
      throw err;
    }

    const email = data.email.toLowerCase();
    void supabaseAdmin.from("subscribers").upsert(
      {
        email,
        first_name: data.fullName ?? null,
        source: `tool:${data.tool}-pro-waitlist`,
        ...utmRawDataPatch(data),
      },
      { onConflict: "email", ignoreDuplicates: false },
    );
    await addToMailerLiteGroup(
      email,
      (() => {
        const g = groupForTool(data.tool);
        assertGroupRouting(data.tool, g.id);
        return g.id;
      })(),
      { first_name: data.fullName ?? null },
    );

    return { ok: true };
  });
