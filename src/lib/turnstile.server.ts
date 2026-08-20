/**
 * Cloudflare Turnstile server-side verifier.
 *
 * Usage inside any server function:
 *   await assertTurnstile(token, ip);
 *
 * If TURNSTILE_SECRET_KEY is not configured, verification is treated as a
 * no-op so the app remains usable in dev / before secrets are wired. In
 * production, set the secret — the helper then enforces it strictly.
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// ─── Per-host widgets ───────────────────────────────────────────────────────
//
// This Worker answers on two hostnames and each has its OWN Turnstile widget. A
// widget only issues a token on a hostname that appears in its own allow-list,
// so a single shared key pair guarantees one of the two domains is always
// broken. That is not theoretical — it happened twice on 2026-08-19: first
// contentpreneur.africa returned 110200, then the keys were repointed and
// chkplt.com started returning it instead.
//
// Site keys are public (they ship to the browser). Secrets stay in env.
// Fallback is the single-pair TURNSTILE_* config, so an unrecognised host — a
// preview URL, localhost, a future domain — still behaves exactly as before
// rather than losing protection.
const HOST_WIDGETS: Record<string, { siteKey: string; secretEnv: string }> = {
  "chkplt.com": {
    siteKey: "0x4AAAAAADXdVNcs26zy8gmV",
    secretEnv: "TURNSTILE_SECRET_KEY_CHKPLT",
  },
  "contentpreneur.africa": {
    siteKey: "0x4AAAAAAEUreW6sAGh0iD-Y",
    secretEnv: "TURNSTILE_SECRET_KEY_CONTENTPRENEUR",
  },
};

function widgetForHost(host: string | undefined | null) {
  if (!host) return null;
  // Strip any port, and match the bare host (www. handled explicitly).
  const h = host.split(":")[0].toLowerCase().replace(/^www\./, "");
  return HOST_WIDGETS[h] ?? null;
}

/** Public site key for this request's hostname. Null disables the widget. */
export function turnstileSiteKeyForHost(host: string | undefined | null): string | null {
  return widgetForHost(host)?.siteKey ?? process.env.TURNSTILE_SITE_KEY ?? null;
}

/** The secret that PAIRS with the site key this host was served. */
function secretForHost(host: string | undefined | null): string | undefined {
  const w = widgetForHost(host);
  // Mismatching these is the whole failure mode: verifying a token minted by
  // widget A against widget B's secret returns invalid-input-response, which
  // looks identical to a forged token.
  if (w) return process.env[w.secretEnv] ?? process.env.TURNSTILE_SECRET_KEY;
  return process.env.TURNSTILE_SECRET_KEY;
}

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes: string[];
  skipped: boolean;
}

export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
  host?: string | null,
): Promise<TurnstileVerifyResult> {
  const secret = secretForHost(host);
  if (!secret) {
    return { success: true, errorCodes: [], skipped: true };
  }
  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"], skipped: false };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body });
    const json = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    return {
      success: !!json.success,
      errorCodes: json["error-codes"] ?? [],
      skipped: false,
    };
  } catch (err) {
    return {
      success: false,
      errorCodes: ["network-error"],
      skipped: false,
    };
  }
}

export async function assertTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
  host?: string | null,
): Promise<void> {
  const r = await verifyTurnstile(token, remoteIp, host);
  if (!r.success) {
    throw new Error(
      "Verification failed — please refresh the page and try again.",
    );
  }
}
