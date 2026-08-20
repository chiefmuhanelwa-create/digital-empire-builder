import { Turnstile } from "@marsidev/react-turnstile";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTurnstileSiteKey } from "@/lib/turnstile.functions";

/**
 * Emitted instead of `null` when the widget itself cannot run (hostname not
 * allow-listed, Cloudflare outage, blocked script) AND the form has said it would
 * rather send the request than sit there dead — `unavailablePolicy="allow"`.
 *
 * It is NOT a bypass. siteverify rejects it like any other bad token, so every
 * endpoint that fails closed still refuses. All it does is stop the CLIENT from
 * hiding the request from the server, so the server's own policy decides. That
 * policy lives in one place per endpoint: checkout fails open and logs
 * (checkout.functions.ts), everything that spends money or credits fails closed.
 */
export const TURNSTILE_WIDGET_UNAVAILABLE = "widget-unavailable";

interface TurnstileGateProps {
  onToken: (token: string | null) => void;
  className?: string;
  /**
   * What to do when the widget cannot run at all.
   *
   * "block" (default) — emit null. The submit button stays disabled. Correct for
   *   endpoints that spend AI credits or send email, where letting the request
   *   through costs something real.
   * "allow" — emit TURNSTILE_WIDGET_UNAVAILABLE so the button still works and the
   *   server decides. Correct for checkout: a certainly-lost sale is worse than a
   *   bot creating one pending-order row.
   */
  unavailablePolicy?: "block" | "allow";
}

export interface TurnstileGateHandle {
  /**
   * Throw away the current token and issue a fresh one.
   *
   * A Turnstile token is SINGLE USE. Cloudflare rejects a second siteverify of
   * the same token with `timeout-or-duplicate`, and tokens also expire after
   * ~5 minutes. Any form that can be submitted more than once — a tool you run
   * repeatedly, or any form the user retries after a failure — must call this
   * after every attempt, or attempt #2 fails no matter what the user does.
   *
   * This is not theoretical: /admin/incidents shows three `generateHooks:turnstile`
   * failures on 2026-07-29 (same topic, 45s apart) — the first generation
   * consumed the token and every retry re-sent the dead one.
   */
  reset: () => void;
}

// Cloudflare returns 110200 when the page's hostname is not on the widget's
// allowed-domains list. This is BY FAR the most likely failure after a page
// moves to a new domain, and it is invisible without this mapping — the widget
// just sits there and the submit button never enables.
function explainTurnstileError(code: string): string {
  if (code.startsWith("1102")) {
    return `This domain (${
      typeof window !== "undefined" ? window.location.hostname : "this site"
    }) is not on the Turnstile widget's allowed-hostnames list in the Cloudflare dashboard.`;
  }
  if (code.startsWith("1060") || code.startsWith("3000") || code.startsWith("6")) {
    return "Cloudflare could not complete the check from this browser or network. A retry usually clears it.";
  }
  return "The security check could not load.";
}

/**
 * Cloudflare Turnstile widget.
 *
 * Fetches the public site key from a small server fn (the value is the
 * public half of the keypair — safe to ship to the browser). If the key
 * is missing, the widget renders nothing and emits a "dev-skip" sentinel
 * so the parent form stays usable. The server-side verifier treats
 * missing-secret as a no-op too, so dev and prod gracefully align.
 *
 * On failure it now SAYS SO. Every form using this gate disables its submit
 * button until a token arrives, so a widget that quietly errors produces a
 * dead form with no explanation — which is exactly how the Accelerator
 * application on contentpreneur.africa presented (reported 2026-08-18): the
 * form filled in fine and the submit button simply never became clickable.
 * The gate still refuses to hand out a token (that would defeat the point),
 * but the person now sees why, and can retry without reloading the page.
 */
export const TurnstileGate = forwardRef<TurnstileGateHandle, TurnstileGateProps>(function TurnstileGate(
  { onToken, className, unavailablePolicy = "block" },
  ref,
) {
  const fn = useServerFn(getTurnstileSiteKey);
  const { data, isLoading } = useQuery({
    queryKey: ["turnstile-site-key"],
    queryFn: () => fn(),
    staleTime: Infinity,
  });

  const siteKey = data?.siteKey ?? null;
  const [errorCode, setErrorCode] = useState<string | null>(null);
  // Bumping this remounts the widget — Turnstile does not re-attempt on its own
  // once it has errored, so a retry has to be a fresh instance.
  const [attempt, setAttempt] = useState(0);
  // True once this widget instance has issued a genuine token. A ref, not state:
  // the watchdog below reads it from inside a timeout and must see the live value
  // without re-arming itself on every change.
  const solvedRef = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        setErrorCode(null);
        solvedRef.current = false;
        // No site key means the gate is in its "dev-skip" mode — re-emit the
        // sentinel rather than clearing it, or a reset would disable the form.
        if (!siteKey) {
          onToken("dev-skip");
          return;
        }
        onToken(null);
        setAttempt((a) => a + 1);
      },
    }),
    [siteKey, onToken],
  );

  useEffect(() => {
    if (!isLoading && !siteKey) onToken("dev-skip");
  }, [isLoading, siteKey, onToken]);

  // Watchdog for the failure mode that has NO callback: challenges.cloudflare.com
  // never loads at all — ad blocker, tracker-blocking DNS, corporate proxy, dead
  // mobile connection. `onError` is the widget's error callback; if the script
  // never arrives there is no widget to call it, so the form would sit disabled
  // forever with nothing on screen. On a checkout that is a lost sale caused by
  // the buyer's own browser extension.
  //
  // Only arms under "allow" — a form that must fail closed should keep waiting.
  // Self-correcting: if the real token turns up later, onSuccess overwrites the
  // sentinel, which is why 8s is safe rather than having to guess a slow-3G
  // worst case.
  useEffect(() => {
    if (unavailablePolicy !== "allow" || isLoading || !siteKey) return;
    const t = setTimeout(() => {
      // Only if the widget has produced NOTHING. A real token that already
      // arrived must never be overwritten by the sentinel.
      if (solvedRef.current) return;
      setErrorCode((current) => current ?? "no-response");
      onToken(TURNSTILE_WIDGET_UNAVAILABLE);
    }, 8000);
    return () => clearTimeout(t);
    // `attempt` re-arms the watchdog after a retry/reset.
  }, [unavailablePolicy, isLoading, siteKey, attempt, onToken]);

  if (isLoading) return null;
  if (!siteKey) return null;

  return (
    <div className={className}>
      <Turnstile
        key={attempt}
        siteKey={siteKey}
        options={{ theme: "auto", size: "flexible" }}
        onSuccess={(t) => {
          solvedRef.current = true;
          setErrorCode(null);
          onToken(t);
        }}
        onError={(code) => {
          setErrorCode(String(code ?? "unknown"));
          onToken(unavailablePolicy === "allow" ? TURNSTILE_WIDGET_UNAVAILABLE : null);
        }}
        onExpire={() => onToken(null)}
      />

      {errorCode && (
        <div
          role="alert"
          className="mt-2 rounded-md border border-[#EA580C]/40 bg-[#EA580C]/5 px-3 py-2.5 text-sm"
        >
          <p className="font-semibold text-[#9A3412]">
            {unavailablePolicy === "allow"
              ? "Security check didn't load — you can carry on regardless."
              : "Security check didn't load — you can't submit until it does."}
          </p>
          <p className="mt-1 text-[13px] text-[#7C2D12]">{explainTurnstileError(errorCode)}</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setErrorCode(null);
                setAttempt((a) => a + 1);
              }}
              className="rounded-full bg-[#0F172A] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1E293B] transition-colors"
            >
              Try again
            </button>
            <span className="font-mono text-[11px] text-[#9A3412]/70">
              Turnstile error {errorCode}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
