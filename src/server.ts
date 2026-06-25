import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },

  // Cloudflare cron (see wrangler.jsonc "triggers").
  //  • "10 4 * * *"  (daily)        → reconcile every product's ZAR charge to the live USD rate.
  //  • "* * * * *"   (every minute) → drain the transactional/auth email queue (Resend).
  async scheduled(
    event: { cron?: string },
    _env: unknown,
    ctx: { waitUntil: (p: Promise<unknown>) => void },
  ) {
    const cron = event?.cron ?? "";

    if (cron === "10 4 * * *") {
      ctx.waitUntil(
        (async () => {
          try {
            const { syncFxRates } = await import("./lib/fx-sync");
            console.log("[fx-sync]", JSON.stringify(await syncFxRates()));
          } catch (error) {
            console.error("[fx-sync] failed", error);
          }
        })(),
      );
      return;
    }

    // Every-minute email drain — calls the queue processor (Bearer service-role).
    ctx.waitUntil(
      (async () => {
        try {
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!key) { console.error("[email-drain] missing SUPABASE_SERVICE_ROLE_KEY"); return; }
          const res = await fetch("https://chkplt.com/api/email/queue/process", {
            method: "POST",
            headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
            body: "{}",
          });
          console.log("[email-drain]", res.status, (await res.text()).slice(0, 200));
        } catch (error) {
          console.error("[email-drain] failed", error);
        }
      })(),
    );
  },
};
