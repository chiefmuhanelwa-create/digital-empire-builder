import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { MEMBER_DOMAIN, STORE_DOMAIN, isMemberPath } from "./lib/domains";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
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

// SSR page responses have no explicit Cache-Control, so browsers fall back
// to heuristic caching on repeat visits — a real product/content edit can
// look "not deployed" when it's actually just a stale local copy. Static
// assets (JS/CSS/images) are served by Cloudflare's assets binding before
// this handler runs, so this only touches actual page HTML.
function withNoCacheForHtml(response: Response): Response {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-cache, must-revalidate");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// The member workspace has ONE home: contentpreneur.africa (founder ruling
// 2026-08-18). chkplt.com still serves the storefront and answers on the same
// Worker, so a member path arriving there is sent on rather than rendered —
// otherwise the same workspace would exist twice under two brands.
//
// 301, not 302: this is permanent, and browsers/bookmarks should learn it.
// GET/HEAD only — a 301 on a POST is allowed to be replayed as a GET by the
// client, which would silently drop a form submission. Server-function POSTs go
// to /_serverFn/* (not a member path) so they are untouched either way.
function memberDomainRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  if (url.hostname !== STORE_DOMAIN) return null;
  if (!isMemberPath(url.pathname)) return null;

  url.hostname = MEMBER_DOMAIN;
  return Response.redirect(url.toString(), 301);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const redirect = memberDomainRedirect(request);
      if (redirect) return redirect;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return withNoCacheForHtml(normalized);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },

  // Cloudflare cron (see wrangler.jsonc "triggers").
  //  • "* * * * *"   (every minute) → drain the transactional/auth email queue (Resend).
  //
  // The daily "10 4 * * *" FX branch below is retained but its trigger has been
  // removed from wrangler.jsonc, and syncFxRates() now self-disables. Prices do
  // not change on their own. Left in place so re-enabling is a config change
  // rather than a rewrite.
  async scheduled(
    event: { cron?: string },
    _env: unknown,
    ctx: { waitUntil: (p: Promise<unknown>) => void },
  ) {
    const cron = event?.cron ?? "";

    if (cron === "10 4 * * *") {
      ctx.waitUntil(
        (async () => {
          const { reportError } = await import("./lib/error-logger");
          try {
            const { syncFxRates } = await import("./lib/fx-sync");
            const result = await syncFxRates();
            console.log("[fx-sync]", JSON.stringify(result));
            if (!result.ok) {
              await reportError(new Error(result.error), {
                endpoint: "cron:fx-sync",
                severity: "critical",
              });
            }
          } catch (error) {
            console.error("[fx-sync] failed", error);
            await reportError(error, { endpoint: "cron:fx-sync", severity: "critical" });
          }
        })(),
      );
      return;
    }

    // Every-minute email drain — runs IN-PROCESS. (A Worker cannot reliably fetch
    // its own public hostname; that self-request returns Cloudflare 522.)
    ctx.waitUntil(
      (async () => {
        const { reportError } = await import("./lib/error-logger");
        try {
          const { drainEmailQueues } = await import("./lib/email-queue");
          const result = await drainEmailQueues();
          console.log("[email-drain]", JSON.stringify(result));
          if (!result.ok) {
            await reportError(new Error(result.error), {
              endpoint: "cron:email-drain",
              severity: "critical",
            });
          }
        } catch (error) {
          console.error("[email-drain] failed", error);
          await reportError(error, { endpoint: "cron:email-drain", severity: "critical" });
        }
      })(),
    );
  },
};
