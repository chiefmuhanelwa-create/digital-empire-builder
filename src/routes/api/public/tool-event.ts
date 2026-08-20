// Funnel beacon for the Tools Hub. Public and unauthenticated by necessity —
// the whole point is measuring anonymous visitors before they ever give an
// email — so it stays narrow: a fixed allowlist of tool slugs and event names,
// and no free-form fields except a small meta object.
//
// Writes go through supabaseAdmin rather than an anon RLS insert policy: an
// anon insert policy on tool_events would let anyone POST fake funnel numbers
// straight into the admin dashboard.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TOOL_SLUGS = [
  "rate-card",
  "media-kit",
  "sars-calculator",
  "provisional-tax",
  "tax-guide",
  "hook-generator",
  "offer-builder",
  "niche-clarity",
  "align-accelerate-excel",
  "tools-hub",
] as const;

const bodySchema = z.object({
  tool: z.enum(TOOL_SLUGS),
  event: z.enum(["view", "start", "complete", "lead"]),
  sessionId: z.string().trim().max(64).optional(),
  email: z.string().trim().email().max(255).optional(),
  meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// Expected, not enforced. An origin allowlist here was silently dropping every
// event from Instagram/Facebook in-app browsers (they post `Origin: null`) —
// i.e. under-counting the exact DM traffic this business runs on, and doing it
// invisibly, which is the worst kind of analytics bug. The slug/event enums and
// service-role-only writes are what actually keep this endpoint honest.
const KNOWN_ORIGINS = new Set([
  "https://chkplt.com",
  "https://www.chkplt.com",
  // The site currently answers on plain http too, so these are real traffic,
  // not anomalies worth flagging.
  "http://chkplt.com",
  "http://www.chkplt.com",
  "https://contentpreneur.africa",
  "http://localhost:3000",
  "http://localhost:5173",
]);

export const Route = createFileRoute("/api/public/tool-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("Origin");
        const knownOrigin = !origin || KNOWN_ORIGINS.has(origin);

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return new Response(null, { status: 204 });
        }

        const parsed = bodySchema.safeParse(json);
        // Analytics must never surface an error to the visitor or block the UI,
        // so every rejection is a silent 204 rather than a 4xx.
        if (!parsed.success) return new Response(null, { status: 204 });
        const d = parsed.data;

        try {
          const { error } = await supabaseAdmin.from("tool_events").insert({
            tool_slug: d.tool,
            event: d.event,
            session_id: d.sessionId ?? null,
            email: d.email?.toLowerCase() ?? null,
            // Record where it came from, so an unusual origin shows up as data
            // rather than as a silently missing row.
            meta: { ...(d.meta ?? {}), ...(knownOrigin ? {} : { origin: origin ?? "unknown" }) },
          });
          if (error) console.error("[tool-event] insert failed", error.message);
        } catch (err) {
          // A beacon must never throw. If Supabase is unreachable or a binding
          // is missing we lose a data point — we do not fail a request on a
          // page the creator is actively using.
          console.error("[tool-event] insert threw", err);
        }

        return new Response(null, { status: 204 });
      },
      GET: async () => new Response("Tool event beacon. POST only.", { status: 200 }),
    },
  },
});
