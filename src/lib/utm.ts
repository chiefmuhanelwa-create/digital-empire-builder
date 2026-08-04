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

// Server-side helper: builds a `subscribers.raw_data` patch carrying the UTM
// breakdown, without clobbering whatever the tool-specific `source` literal
// already says (unlike checkout.functions.ts, which overwrites `source`
// itself with `utm:${source}` — losing which tool/page captured the lead).
// Returns {} (no-op) when no UTM params were present, so a plain upsert never
// blasts away an existing raw_data on a repeat submission with no UTM.
export function utmRawDataPatch(input: {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}): { raw_data: { utm: { source: string | null; medium: string | null; campaign: string | null } } } | {} {
  if (!input.utmSource && !input.utmMedium && !input.utmCampaign) return {};
  return {
    raw_data: {
      utm: {
        source: input.utmSource ?? null,
        medium: input.utmMedium ?? null,
        campaign: input.utmCampaign ?? null,
      },
    },
  };
}
