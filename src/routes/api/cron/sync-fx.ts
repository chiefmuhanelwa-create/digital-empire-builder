// Manual trigger for the live USD→ZAR reconciliation that also runs daily on the
// Cloudflare cron (see wrangler.jsonc + src/server.ts scheduled()). Auth matches
// the email queue route: Bearer <SUPABASE_SERVICE_ROLE_KEY>.
//   curl -X POST https://chkplt.com/api/cron/sync-fx -H "Authorization: Bearer $SERVICE_ROLE_KEY"
import { createFileRoute } from "@tanstack/react-router";
import { syncFxRates } from "@/lib/fx-sync";

export const Route = createFileRoute("/api/cron/sync-fx")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (authHeader.slice("Bearer ".length).trim() !== serviceKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        try {
          const result = await syncFxRates();
          return Response.json(result, { status: result.ok ? 200 : 502 });
        } catch (err) {
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          );
        }
      },
    },
  },
});
