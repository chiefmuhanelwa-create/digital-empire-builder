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

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes: string[];
  skipped: boolean;
}

export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
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
): Promise<void> {
  const r = await verifyTurnstile(token, remoteIp);
  if (!r.success) {
    throw new Error(
      "Verification failed — please refresh the page and try again.",
    );
  }
}
