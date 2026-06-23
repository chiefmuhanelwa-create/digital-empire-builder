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
