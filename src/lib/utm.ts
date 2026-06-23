// UTM attribution: capture on first landing, persist across navigation, attach at checkout.
const KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

export function captureUtm() {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  for (const k of KEYS) {
    const v = p.get(k);
    if (v) {
      try {
        sessionStorage.setItem(k, v.slice(0, 120));
      } catch {
        /* storage blocked — ignore */
      }
    }
  }
}

export function getUtm(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  if (typeof window === "undefined") return {};
  const get = (k: string) => {
    try {
      return sessionStorage.getItem(k) ?? undefined;
    } catch {
      return undefined;
    }
  };
  return {
    utmSource: get("utm_source"),
    utmMedium: get("utm_medium"),
    utmCampaign: get("utm_campaign"),
  };
}
