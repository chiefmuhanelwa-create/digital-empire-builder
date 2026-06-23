import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

// Cloudflare sets `cf-ipcountry` on every request (ISO-3166 alpha-2, or "XX"/"T1").
// SA visitors see ZAR (what they're charged); everyone else sees the USD display.
export const getViewerCountry = createServerFn({ method: "GET" }).handler(async () => {
  const c = (getRequestHeader("cf-ipcountry") || "").toUpperCase();
  return { country: c && c !== "XX" && c !== "T1" ? c : null };
});
