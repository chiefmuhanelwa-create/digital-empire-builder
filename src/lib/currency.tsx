import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getViewerCountry } from "@/lib/geo.functions";

// Country is null until detected; null/non-ZA → show USD display, "ZA" → show ZAR.
const CountryContext = createContext<string | null>(null);

// A shopper can manually pick a display currency (like the real Shopify
// store's "ZAR ▼" header switcher) — this OVERRIDES geo-detection for both
// price display (formatPrice) and payment-rail routing (shouldUseStripe),
// since picking a currency implies "bill me in it," not just "show me it."
const OVERRIDE_KEY = "chkplt_currency_override";
type CurrencyOverride = "ZAR" | "USD" | null;
const OverrideContext = createContext<{
  override: CurrencyOverride;
  setOverride: (v: CurrencyOverride) => void;
}>({ override: null, setOverride: () => {} });

function readOverride(): CurrencyOverride {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(OVERRIDE_KEY);
  return v === "ZAR" || v === "USD" ? v : null;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const fn = useServerFn(getViewerCountry);
  const { data } = useQuery({
    queryKey: ["viewer-country"],
    queryFn: () => fn(),
    staleTime: 1000 * 60 * 60,
  });
  const [override, setOverrideState] = useState<CurrencyOverride>(null);
  useEffect(() => setOverrideState(readOverride()), []);

  const setOverride = (v: CurrencyOverride) => {
    setOverrideState(v);
    if (typeof window !== "undefined") {
      if (v) window.localStorage.setItem(OVERRIDE_KEY, v);
      else window.localStorage.removeItem(OVERRIDE_KEY);
    }
  };

  // "ZAR" override → force the "ZA" country code formatPrice/shouldUseStripe
  // already treat as "native ZAR, Paystack rail." "USD" override → any
  // non-Paystack code works; "US" is the clearest choice.
  const effective = override === "ZAR" ? "ZA" : override === "USD" ? "US" : (data?.country ?? null);

  return (
    <CountryContext.Provider value={effective}>
      <OverrideContext.Provider value={{ override, setOverride }}>{children}</OverrideContext.Provider>
    </CountryContext.Provider>
  );
}

export function useCountry(): string | null {
  return useContext(CountryContext);
}

// For the header currency-switcher UI: knows whether the shopper has manually
// picked a currency (vs. still riding geo-detection) so it can show the right
// label without re-deriving from the raw country code.
export function useCurrencyOverride() {
  return useContext(OverrideContext);
}

// Countries Paystack can bill (ZAR/African rail). Everyone else → Stripe (USD).
export const PAYSTACK_COUNTRIES = new Set(["ZA", "NG", "GH", "KE", "CI", "EG", "RW"]);

// Route the buyer to the right rail. Unknown country → Paystack (home market),
// which still shows USD and bills ZAR. Only send to Stripe when we KNOW the
// buyer is outside the Paystack region.
export function shouldUseStripe(country: string | null): boolean {
  return !!country && !PAYSTACK_COUNTRIES.has(country);
}
