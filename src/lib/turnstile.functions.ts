import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { turnstileSiteKeyForHost } from "./turnstile.server";

/**
 * Exposes the Turnstile **site key** (a publicly-distributed value, safe to
 * ship to browsers) so the widget can mount client-side without needing a
 * VITE_ build-time variable.
 *
 * HOST-AWARE since 2026-08-19. This Worker answers on two hostnames and each has
 * its OWN Turnstile widget, because a widget only issues tokens on hostnames
 * listed in its own allow-list. With a single key pair, whichever domain was not
 * on that widget's list returned error 110200 and every fail-closed form there
 * died — which is exactly what happened twice in one night, first to
 * contentpreneur.africa and then, after the key was swapped, to chkplt.com.
 *
 * Serving the right site key per host means neither domain can break the other.
 */
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(
  async () => {
    return { siteKey: turnstileSiteKeyForHost(getRequestHost()) };
  },
);
