import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTurnstileSiteKey } from "@/lib/turnstile.functions";

interface TurnstileGateProps {
  onToken: (token: string | null) => void;
  className?: string;
}

/**
 * Cloudflare Turnstile widget.
 *
 * Fetches the public site key from a small server fn (the value is the
 * public half of the keypair — safe to ship to the browser). If the key
 * is missing, the widget renders nothing and emits a "dev-skip" sentinel
 * so the parent form stays usable. The server-side verifier treats
 * missing-secret as a no-op too, so dev and prod gracefully align.
 */
export function TurnstileGate({ onToken, className }: TurnstileGateProps) {
  const fn = useServerFn(getTurnstileSiteKey);
  const { data, isLoading } = useQuery({
    queryKey: ["turnstile-site-key"],
    queryFn: () => fn(),
    staleTime: Infinity,
  });

  const siteKey = data?.siteKey ?? null;

  useEffect(() => {
    if (!isLoading && !siteKey) onToken("dev-skip");
  }, [isLoading, siteKey, onToken]);

  if (isLoading) return null;
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
