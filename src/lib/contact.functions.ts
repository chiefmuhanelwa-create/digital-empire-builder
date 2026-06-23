import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertTurnstile } from "./turnstile.server";

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().max(255),
        subject: z.string().trim().max(200).optional(),
        message: z.string().trim().min(10).max(5000),
        turnstileToken: z.string().max(2048).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertTurnstile(
      data.turnstileToken,
      getRequestIP({ xForwardedFor: true }) ?? undefined,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any).from("contact_submissions").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      subject: data.subject ?? null,
      message: data.message,
    });
    if (error) throw new Error("Could not save your message. Please try again.");

    // Warm lead — upsert to subscribers so they appear in admin/contacts
    void supabaseAdmin.from("subscribers").upsert(
      {
        email: data.email.toLowerCase(),
        first_name: data.name.split(" ")[0],
        source: "contact",
      },
      { onConflict: "email" },
    );

    return { ok: true };
  });
