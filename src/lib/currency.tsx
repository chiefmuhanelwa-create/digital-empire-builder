import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getViewerCountry } from "@/lib/geo.functions";

// Country is null until detected; null/non-ZA → show USD display, "ZA" → show ZAR.
const CountryContext = createContext<string | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const fn = useServerFn(getViewerCountry);
  const { data } = useQuery({
    queryKey: ["viewer-country"],
    queryFn: () => fn(),
    staleTime: 1000 * 60 * 60,
  });
  return <CountryContext.Provider value={data?.country ?? null}>{children}</CountryContext.Provider>;
}

export function useCountry(): string | null {
  return useContext(CountryContext);
}

// Countries Paystack can bill (ZAR/African rail). Everyone else → Stripe (USD).
export const PAYSTACK_COUNTRIES = new Set(["ZA", "NG", "GH", "KE", "CI", "EG", "RW"]);

// Route the buyer to the right rail. Unknown country → Paystack (home market),
// which still shows USD and bills ZAR. Only send to Stripe when we KNOW the
// buyer is outside the Paystack region.
export function shouldUseStripe(country: string | null): boolean {
  return !!country && !PAYSTACK_COUNTRIES.has(country);
}
