import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect } from "react";

interface TurnstileGateProps {
  onToken: (token: string | null) => void;
  className?: string;
}

/**
 * Cloudflare Turnstile invisible / managed challenge widget.
 *
 * - If VITE_TURNSTILE_SITE_KEY is missing, renders nothing and emits a
 *   sentinel "dev-skip" token so the parent form stays usable in dev.
 * - On the server, verifyTurnstile() treats requests as valid when the
 *   secret is missing, so dev + production gracefully diverge.
 */
export function TurnstileGate({ onToken, className }: TurnstileGateProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!siteKey) onToken("dev-skip");
    // Only fire once on mount when the key is absent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div className={className}>
      <Turnstile
        siteKey={siteKey}
        options={{ theme: "auto", size: "flexible" }}
        onSuccess={(t) => onToken(t)}
        onError={() => onToken(null)}
        onExpire={() => onToken(null)}
      />
    </div>
  );
}
