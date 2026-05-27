## 1. Product card → detail page audit (verified, no changes needed)

Flow is correct end-to-end:

- `/products` (`products.index.tsx`) — shows 4 garden cards; each links to `/products/garden/$garden` (collection view, by design — not directly to a product).
- `/products/garden/$garden` (`products.garden.$garden.tsx`) — lists published products in that garden; each card links to `/products/$slug` using the product's real `slug` from the DB.
- `/products/$slug` (`products.$slug.tsx`) — fetches the product by slug and renders:
  - cover (`product.cover_image_url`) in a framed block,
  - short `description` (whitespace-preserved),
  - `long_description` ("Why this exists" block),
  - `benefits[]` ("What you get" checklist),
  - format / audience / cohort metadata strip,
  - `BuyBlock` CTA: free → disabled "coming soon", application → disabled "applications open soon", paid → email/name/phone form that calls `initializeCheckout` server fn and redirects to Paystack,
  - secondary CTA, plus optional "You might also like" via `seed_to_product_id`.

Other entry points also use `/products/$slug` correctly: dashboard, checkout success, learn pages, admin products. Header nav links to `/products` and to garden pages.

No routing or content bugs found, so nothing to change here. If you'd rather have the shop index list every product directly (skipping the garden step), that's a separate scope — say the word.

## 2. Rename "Digital Empire Builder" → "Christ Kingdom Platform"

The string does not exist anywhere user-facing in the app (all page heads already say "Christ Kingdom Platform"). The only two occurrences are the `SITE_NAME` constant in the auth email scaffolding:

- `src/routes/lovable/email/auth/webhook.ts` (line 34)
- `src/routes/lovable/email/auth/preview.ts` (line 21)

These control the brand name shown in signup / password reset / magic link / invite / email-change / reauth emails. Change both to:

```ts
const SITE_NAME = "Christ Kingdom Platform"
```

No other changes required. The DB product titled "Contentpreneur: From Memes to Millions (Digital)" is unrelated and stays as-is.

## Technical notes

- Two-line edit; no schema, RLS, or server-fn changes.
- After the edit, auth emails (once `notify.chkplt.com` DNS verifies) will render with "Christ Kingdom Platform" in subject lines and body copy.
