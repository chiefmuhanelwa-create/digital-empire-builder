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
