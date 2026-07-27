import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { addToMailerLiteGroup } from "@/lib/mailerlite";

// The free Starter Kit's only job: capture the email, never fail the signup
// experience even if MailerLite is down/misconfigured (same "fire and forget,
// non-blocking" discipline as every other lead-capture flow in this codebase —
// order-fulfillment.ts, offer-builder.functions.ts, apply.functions.ts).
export const claimStarterKit = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email().max(255),
        name: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const nameParts = (data.name ?? "").trim().split(/\s+/).filter(Boolean);
    void addToMailerLiteGroup(
      data.email,
      process.env.MAILERLITE_GROUP_ID_STARTER_KIT,
      { first_name: nameParts[0], last_name: nameParts.slice(1).join(" ") || null },
    );
    return { ok: true as const, downloadUrl: "/downloads/knowledge-entrepreneur-starter-kit.html" };
  });
