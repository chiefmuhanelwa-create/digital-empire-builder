// Which domain owns which half of this app.
//
// One Worker answers on BOTH hostnames. The split is by job, not by codebase:
//
//   contentpreneur.africa → the customer journey. Sales pages (/starterkit,
//     /foundation, /accelerator) AND, since 2026-08-18, the signed-in member
//     workspace they lead to (/dashboard, /apps, /learn, /account + auth).
//     A Foundation Kit buyer never sees another brand from ad to workspace.
//
//   chkplt.com → the storefront and back office. The product catalogue
//     (/products, /cart, /search, /tools) and admin stay here.
//
// server.ts 301s MEMBER_PATH_PREFIXES off chkplt.com onto MEMBER_DOMAIN so the
// workspace has exactly one home (founder ruling 2026-08-18, chosen over
// dual-domain). Sessions are per-domain cookies, so that redirect signs people
// out once — expected, and the reason the choice was made explicitly.

export const MEMBER_DOMAIN = "contentpreneur.africa";
export const STORE_DOMAIN = "chkplt.com";

/**
 * Paths that belong to the member workspace. Kept in sync BY HAND with the
 * "contentpreneur.africa/<path>*" entries in wrangler.jsonc — Cloudflare route
 * patterns are config, not code, and cannot read this array. Adding a member
 * route means editing both.
 */
export const MEMBER_PATH_PREFIXES = [
  "/dashboard",
  "/apps",
  "/learn",
  "/account",
  "/login",
  "/signup",
  "/reset-password",
  "/admin",
] as const;

export function isMemberPath(pathname: string): boolean {
  return MEMBER_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * A product page on the storefront. The member area links out to these (e.g.
 * "browse more products", "get access") but the catalogue itself is NOT routed
 * on contentpreneur.africa — a relative /products/... link would 404 there.
 *
 * Dev keeps it relative so localhost never bounces to production.
 *
 * The ONE exception is the Foundation Kit: its sales page is /foundation, a
 * plain route in this app that resolves on both hostnames, so kit CTAs use
 * that relative path instead of coming through here.
 */
export function storeProductUrl(slug: string): string {
  return import.meta.env.DEV ? `/products/${slug}` : `https://${STORE_DOMAIN}/products/${slug}`;
}

/**
 * Products that have a real sales page ON contentpreneur.africa.
 *
 * These pages resolve on both hostnames, so linking to them keeps a member
 * inside one brand for the whole journey.
 */
const NATIVE_SALES_PAGE: Record<string, string> = {
  "called-expert-foundation-kit": "/foundation",
  "called-expert-starter-bundle": "/foundation",
  "contentpreneur-90day-cohort": "/accelerator",
};

/**
 * Where a product's sales page lives, FROM INSIDE THE MEMBER WORKSPACE.
 *
 * Founder instruction 2026-08-22: "kill these chkplt.com/products/... links in
 * the contentpreneur.africa dashboard". A Foundation Kit buyer being thrown to
 * a second brand's storefront mid-journey is the exact thing the domain split
 * was supposed to end, and /foundation had existed for weeks while the
 * dashboard still pointed at chkplt.com/products/called-expert-foundation-kit.
 *
 * Returns null when a product has NO native page. Callers must then hide the
 * link rather than falling back to the storefront — a null here means "this
 * product is not part of the contentpreneur journey", and advertising it inside
 * the workspace is precisely the clutter being removed.
 */
export function memberProductUrl(slug: string): string | null {
  return NATIVE_SALES_PAGE[slug] ?? null;
}
