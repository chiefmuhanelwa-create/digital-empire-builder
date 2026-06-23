// Thin wrappers around FB Pixel + GA. No-op if the pixels aren't loaded (env unset).
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

export function trackLead() {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "Lead");
  window.gtag?.("event", "generate_lead");
}

export function trackPurchase(valueZar: number, currency = "ZAR") {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "Purchase", { value: valueZar, currency });
  window.gtag?.("event", "purchase", { value: valueZar, currency });
}
