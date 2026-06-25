import { createFileRoute } from "@tanstack/react-router";
import { drainEmailQueues } from "@/lib/email-queue";

// Manual / external trigger for the email drain. The every-minute Cloudflare cron
// drains in-process via drainEmailQueues() (see server.ts) — it does NOT call this
// route (a Worker fetching its own hostname returns Cloudflare 522).
export const Route = createFileRoute("/api/email/queue/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (authHeader.slice("Bearer ".length).trim() !== supabaseServiceKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        const result = await drainEmailQueues();
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
    },
  },
});
