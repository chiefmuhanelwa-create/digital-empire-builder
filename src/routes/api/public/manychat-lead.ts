// Public webhook ManyChat's "External Request" action calls at each stage of
// the DM-automation Hub flow (collect → AI-segment → AI-segment again) — see
// ~/.claude/plans/stop-building-you-are-whimsical-shannon.md for the flow this
// feeds. ManyChat can't HMAC-sign a request, so auth is a shared Bearer secret
// (same pattern as /api/cron/sync-fx), compared with timingSafeEqual (borrowed
// from paystack-webhook.ts) rather than a plain !== .
//
// No new table: every call upserts the SAME `subscribers` table every other
// lead-magnet tool in this codebase uses (onConflict: "email"), so a DM lead
// and a website lead for the same person converge into one record instead of
// two competing silos. `source` is first-touch (never overwritten by a later
// call); segmentation data lands in the previously-unused `raw_data.manychat`
// namespace.
import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addToMailerLiteGroup } from "@/lib/mailerlite";
import { reportError } from "@/lib/error-logger";
import type { Json } from "@/integrations/supabase/types";

const bodySchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  platform: z.enum(["instagram", "facebook", "tiktok"]),
  source_keyword: z.string().trim().max(80).optional(),
  segment: z.enum(["knowledge_entrepreneur", "content_creator", "cant_determine"]).optional(),
  pain_point: z.enum(["ideas", "niche", "rate", "tax", "starting"]).optional(),
  blocker_detail: z.string().trim().max(1000).optional(),
});

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function groupForSegment(segment: string | undefined): string | undefined {
  if (segment === "knowledge_entrepreneur") return process.env.MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT;
  if (segment === "content_creator") return process.env.MAILERLITE_GROUP_ID_CONTENT_CREATOR;
  // No segment yet, or "cant_determine" — same neutral bucket; `segment`
  // custom field still records which one it was, so it's filterable later.
  return process.env.MAILERLITE_GROUP_ID_DM_LEADS;
}

export const Route = createFileRoute("/api/public/manychat-lead")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.MANYCHAT_WEBHOOK_SECRET;
        if (!secret) {
          return Response.json({ error: "Not configured" }, { status: 503 });
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ") || !safeEqual(authHeader.slice(7).trim(), secret)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;
        const email = data.email.toLowerCase();
        const firstName = (data.name ?? "").trim().split(/\s+/)[0] || undefined;

        try {
          const { data: existing } = await supabaseAdmin
            .from("subscribers")
            .select("source, raw_data")
            .eq("email", email)
            .maybeSingle();

          const existingRawData = (existing?.raw_data as Record<string, Json> | null) ?? {};
          const prevManychat = existingRawData.manychat as
            | {
                source_keyword?: string | null;
                segment?: string | null;
                pain_point?: string | null;
                blocker_detail?: string | null;
              }
            | undefined;

          const manychatPatch: Record<string, string | null> = {
            platform: data.platform,
            source_keyword: data.source_keyword ?? prevManychat?.source_keyword ?? null,
            segment: data.segment ?? prevManychat?.segment ?? null,
            pain_point: data.pain_point ?? prevManychat?.pain_point ?? null,
            blocker_detail: data.blocker_detail ?? prevManychat?.blocker_detail ?? null,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertErr } = await supabaseAdmin.from("subscribers").upsert(
            {
              email,
              first_name: firstName ?? undefined,
              phone: data.phone ?? undefined,
              // First-touch: keep whatever source was already recorded.
              source: existing?.source ?? `manychat:${data.platform}`,
              raw_data: { ...existingRawData, manychat: manychatPatch } as Json,
            },
            { onConflict: "email" },
          );
          if (upsertErr) throw upsertErr;

          await addToMailerLiteGroup(email, groupForSegment(data.segment), {
            first_name: firstName,
            custom: {
              segment: data.segment,
              pain_point: data.pain_point,
              source_platform: data.platform,
              source_keyword: data.source_keyword,
            },
          });

          return Response.json({ ok: true });
        } catch (err) {
          await reportError(err, {
            endpoint: "manychat-lead",
            severity: "error",
            meta: { email, platform: data.platform },
          });
          return Response.json({ error: "Could not save lead" }, { status: 500 });
        }
      },
      GET: async () => new Response("ManyChat lead webhook. POST only.", { status: 200 }),
    },
  },
});
