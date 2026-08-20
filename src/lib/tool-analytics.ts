import { useEffect, useRef } from "react";

// Client side of the tools funnel. Fire-and-forget by design: analytics must
// never block a render, surface an error, or slow down a tool.
//
// sendBeacon is preferred because it survives the page being closed — a visitor
// who opens the rate card and immediately leaves still counts as a view, which
// is exactly the number we're trying to learn.

export type ToolEvent = "view" | "start" | "complete" | "lead";

const SESSION_KEY = "chkplt.tool.sid";

// `crypto.randomUUID()` is SECURE-CONTEXT ONLY. chkplt.com currently answers on
// plain http as well as https, and on http this call throws — which silently
// made every session_id null and broke unique-visitor counting completely (3
// real events recorded, dashboard would have shown 0 visitors). getRandomValues
// IS available on http, so try that next, then fall back to Math.random. An
// anonymous counter never needs cryptographic randomness anyway.
function newId(): string {
  try {
    if (typeof crypto !== "undefined") {
      if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
      if (typeof crypto.getRandomValues === "function") {
        const a = new Uint8Array(16);
        crypto.getRandomValues(a);
        return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
  } catch {
    /* fall through to the non-crypto path */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Anonymous, per-tab, not stable across sessions or devices. It exists only to
// turn "visits" into "visitors" — nothing is linked back to a person.
function sessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = newId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode, cookie-blocking in-app browsers). Still
    // return an id so the event is attributable within this page view — it
    // just won't survive navigation.
    return newId();
  }
}

export function trackToolEvent(
  tool: string,
  event: ToolEvent,
  opts?: { email?: string; meta?: Record<string, string | number | boolean> },
): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    tool,
    event,
    sessionId: sessionId(),
    email: opts?.email,
    meta: opts?.meta,
  });
  try {
    const url = "/api/public/tool-event";
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics is never load-bearing */
  }
}

// Fires exactly one `view` per mount. The ref guard matters under React strict
// mode, which mounts effects twice in development and would otherwise double
// every view count.
export function useToolView(tool: string): void {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackToolEvent(tool, "view");
  }, [tool]);
}

// `start` should fire once per session per tool, on first real engagement —
// not on every keystroke.
export function useToolStart(tool: string): () => void {
  const fired = useRef(false);
  return () => {
    if (fired.current) return;
    fired.current = true;
    trackToolEvent(tool, "start");
  };
}
