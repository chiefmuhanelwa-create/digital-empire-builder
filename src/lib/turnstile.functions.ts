import { createServerFn } from "@tanstack/react-start";

/**
 * Exposes the Turnstile **site key** (a publicly-distributed value, safe to
 * ship to browsers) so the widget can mount client-side without needing a
 * VITE_ build-time variable.
 */
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(
  async () => {
    return { siteKey: process.env.TURNSTILE_SITE_KEY ?? null };
  },
);
