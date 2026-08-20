// Mirrors the Foundation Kit's localStorage into the signed-in user's row and
// back again, so a buyer's work survives a new device, a cleared cache, or a
// switch from laptop to phone.
//
// WHY IT WORKS THIS WAY
// =====================
// The seventeen kit tools each write their own `nochill-*` key directly. This
// module deliberately does NOT ask them to change: it snapshots the namespace,
// diffs it, and pushes. That keeps the blast radius at one file instead of
// seventeen, and any tool added later is covered without touching this.
//
// It also does not monkey-patch localStorage.setItem. That would catch writes
// instantly but silently alters a global for every other script on the page —
// too high a price for a few seconds of latency on a form nobody is racing.
// A dirty-check on a timer plus a flush when the tab goes away covers the real
// usage pattern: work in a tool, leave.

const PREFIX = "nochill-";
const POLL_MS = 8000;

type Snapshot = Record<string, unknown>;

function readLocal(): Snapshot {
  const out: Snapshot = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(k);
      if (raw == null || raw === "null" || raw === "{}" || raw === "") continue;
      try {
        out[k] = JSON.parse(raw);
      } catch {
        out[k] = raw; // a plain string value is still the buyer's work
      }
    }
  } catch {
    /* storage unavailable (private mode, quota) — sync simply no-ops */
  }
  return out;
}

/**
 * Merge the server's copy into this device WITHOUT overwriting work that is
 * already here. A key present locally always wins: this device is where the
 * person is typing right now, and clobbering that mid-session is the one
 * failure mode worse than having no sync at all.
 */
export function mergeIntoLocal(remote: Snapshot): number {
  let added = 0;
  try {
    for (const [k, v] of Object.entries(remote ?? {})) {
      if (!k.startsWith(PREFIX)) continue;
      const existing = localStorage.getItem(k);
      if (existing != null && existing !== "null" && existing !== "{}" && existing !== "") continue;
      localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
      added++;
    }
  } catch {
    /* ignore */
  }
  return added;
}

/**
 * Start mirroring. Returns a cleanup function.
 *
 * `push` is whatever server call actually persists — passed in rather than
 * imported so this module stays free of server-function wiring and can be
 * tested on its own.
 */
export function startKitSync(push: (state: Snapshot) => Promise<unknown>): () => void {
  let lastSent = "";
  let inFlight = false;

  const flush = async () => {
    if (inFlight) return;
    const snap = readLocal();
    if (Object.keys(snap).length === 0) return;
    const serialised = JSON.stringify(snap);
    if (serialised === lastSent) return; // nothing changed since the last push
    inFlight = true;
    try {
      await push(snap);
      lastSent = serialised;
    } catch {
      // Never surface this. Losing a sync is invisible and recoverable; a toast
      // saying "save failed" on a tool the buyer thought was working is not.
    } finally {
      inFlight = false;
    }
  };

  const timer = window.setInterval(flush, POLL_MS);

  // The important one: people finish a tool and close the tab. `visibilitychange`
  // fires reliably on mobile where `beforeunload` often does not.
  const onHide = () => { if (document.visibilityState === "hidden") void flush(); };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", flush);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", flush);
    void flush(); // one last attempt on unmount
  };
}
