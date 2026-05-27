## Root cause

I navigated the site as a user (`/products` → click "Workbooks & Courses"). The URL correctly changed to `/products/garden/esev`, but the page kept showing the catalog. Same happens when clicking any product card.

In TanStack Router's file-based routing, because the catalog lives at `src/routes/products.tsx`, that file is treated as the **parent layout** for every sibling that extends it:

- `products.garden.$garden.tsx` → child of `/products`
- `products.$slug.tsx` → child of `/products`

A parent layout must render `<Outlet />` for child routes to appear. `products.tsx` doesn't — so the catalog renders, the matched child renders into nothing, and the user sees the catalog at every `/products/...` URL.

This single bug explains both symptoms the user reported:
1. **Categories not clickable** — they navigate, but the garden page never appears.
2. **Product sales pages invisible** — same reason; `/products/<slug>` matches but is hidden behind the catalog layout.

## Fix

Rename `src/routes/products.tsx` → `src/routes/products.index.tsx`. This makes the catalog the leaf route for `/products` only, and removes the unintended parent-layout role. No code changes needed inside the file; the `createFileRoute("/products")` path stays the same (index files keep the parent path).

After the rename, `routeTree.gen.ts` regenerates automatically and:
- `/products` → catalog (unchanged)
- `/products/garden/esev` → Workbooks & Courses listing
- `/products/influencers-code-ebook` → product sales page

## Other UI/UX checks performed

Walked the site as an anonymous and logged-in user:

- **Header nav** (`/`, Shop dropdown, About, Contact, Sign in/Dashboard) — all working.
- **Shop catalog cards** — clickable, hover state fine, item counts load correctly (5 / 13 / 6 / 5 = 29 published).
- **Category pages & product detail pages** — currently broken by the bug above; expected to work after the rename.
- **Admin** (`/admin/products`, `/admin/contacts`) — gated correctly by `_authenticated` + admin role.
- **Auth flows** (login/signup/reset) — routes resolve, redirect to `/dashboard` on success.

No other broken links or dead CTAs found in the navigation paths I exercised. If something else feels off after the fix, I'll do a second pass on the product detail page itself (CTA → checkout, mockup rendering, PDF availability).

## Files touched

- Rename `src/routes/products.tsx` → `src/routes/products.index.tsx` (content unchanged)
