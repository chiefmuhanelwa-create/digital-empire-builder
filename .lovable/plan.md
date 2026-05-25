# Phase 2 — The CHKPLT Spine

The spine that every later phase (LMS, email, funnels, affiliates, community) plugs into. Built in 3 sub-phases, each shipped and approved before the next.

---

## Phase 2a — Garden-Aware Catalog (the 26 products, modelled correctly)

**Goal:** Replace the thin placeholder catalog with the real Genesis 1:11–12 product taxonomy, fully seeded with all 26 products from the ecosystem doc.

### Database migration
Extend `products` table with:
- `garden` — enum `deshe | esev | etz_pri | devarim`
- `seed_to_product_id` — self-FK pointing to the next product up the ladder
- `scripture_root` — text (e.g. "Genesis 1:11 — Herb yielding seed.")
- `format` — text (e.g. "PDF workbook (40+ pages, fillable) + Notion template")
- `target_audience` — text (e.g. "Creators earning R0–R10K/month")
- `is_free` — boolean
- `sort_order` — int (display order within a garden)
- `cohort_capacity` — int nullable (for Accelerator/Mentorship/Mastermind)
- `requires_application` — boolean (high-ticket products go through application, not checkout)

Keep `currency` per-product (you chose multi-currency); seeds use `ZAR` by default but the column stays flexible. Add a check constraint that `is_free = true` ⇒ `price_cents = 0`.

Seed all 26 products with scripture roots, seed-pointers, formats, and audiences pulled from the Product Ecosystem doc.

### Storefront restructure
- `/products` becomes the **4 Gardens overview** — Deshe / Esev / Etz Pri / Devarim, each with a banner explaining its theology and product count.
- `/products/garden/$garden` — Garden-specific catalog page, sorted by `sort_order` and price ascending.
- `/products/$slug` — Product page redesigned to surface: scripture root, format, target audience, "Next seed →" link to `seed_to_product_id`, application-vs-checkout CTA.
- Free products show a "Get free" CTA (will wire to email-gate in Phase 2b/3).
- Application products (Accelerator R25K, Mentorship R50K, Mastermind R100K) show "Apply" CTA, not "Buy."

### Header nav
Replace generic "Products" with a dropdown listing the 4 Gardens by name + tagline.

**Verification:** All 26 products visible, grouped by Garden, with correct prices, scripture roots, and seed-to-next links rendering.

---

## Phase 2b — Contacts + Tag Spine (your 13,234-row list, imported)

**Goal:** Bring the NOCHILL legacy list into the platform with all multi-source tag history preserved, so every later feature (email, automation, funnels, affiliates) has a real audience to act on.

### Database migration
- `subscribers` — `email` (unique, citext), `first_name`, `last_name`, `phone`, `source_summary`, `subscribed_at`, `unsubscribed_at`, `bounced_at`, `last_engaged_at`
- `tags` — `name` (unique), `description`, `color`, `is_system` (locked tags like `paid_customer:*` that automations create)
- `subscriber_tags` — join table, `subscriber_id`, `tag_id`, `applied_at`, `applied_by` (system | import | manual)
- `import_jobs` — `id`, `filename`, `uploaded_by`, `status`, `row_count`, `inserted_count`, `updated_count`, `error_count`, `started_at`, `finished_at`, `error_log` (jsonb)
- RLS: subscribers + tags admin-only via `has_role(auth.uid(), 'admin')`. Subscribers can read/update their own row via email match in a Phase 4 self-service page; not in scope yet.

### CSV importer (server function)
- `POST /api/public/import-contacts` is NOT exposed — instead a `createServerFn` `importContactsCsv` gated by admin role middleware.
- Admin upload UI at `/_authenticated/admin/contacts/import` — drag-drop CSV, preview first 10 rows + detected columns, confirm.
- Importer logic:
  1. Stream-parse CSV (handle 13K+ rows)
  2. For each row: upsert subscriber by email (case-insensitive); split `sources` and `tags` columns on `;`; upsert each tag; create `subscriber_tags` rows skipping duplicates.
  3. Tag all imports with `legacy_list` regardless of source.
  4. Write progress to `import_jobs` row.
- Use `supabaseAdmin` inside the server fn since import bypasses RLS.

### Admin contacts list
- `/_authenticated/admin/contacts` — paginated table (50/page), filter by tag combos (AND/OR), search by email, sortable columns.
- Tag chips with counts in the sidebar (e.g. `70k_list (12,094)`, `course_student (8,213)`).
- Per-subscriber detail page showing all tags and import provenance.

**Verification:** Upload `CHKPLT_Master_Contact_List_FINAL.csv` → see 13,234 subscribers with preserved tag distribution matching the CSV's `sources`/`tags` columns.

---

## Phase 2c — Paystack-Native ZAR Checkout

**Goal:** Real money flows. Embedded Paystack Inline (no redirect). Buyer becomes a tagged customer automatically.

### Database migration
- `orders` — `id`, `subscriber_id` nullable, `user_id` nullable, `email`, `currency`, `subtotal_cents`, `total_cents`, `status` (pending | paid | failed | refunded), `paystack_reference`, `created_at`
- `order_items` — `order_id`, `product_id`, `unit_price_cents`, `quantity`, snapshot of `title`/`slug` at purchase time
- `payments` — `id`, `order_id`, `provider` (paystack), `provider_event_id`, `amount_cents`, `currency`, `status`, `raw_event` (jsonb), `received_at` — webhook idempotency key on `provider_event_id`
- `product_grants` — `subscriber_id`/`user_id`, `product_id`, `granted_at`, `expires_at` nullable (for cohort access windows) — this is what the LMS (Phase 3) reads to gate course access

### Server functions + server route
- `createPaystackTransaction` server fn — takes `product_id` + `email`, creates a pending `orders` row, calls Paystack `/transaction/initialize` with metadata `{ order_id, product_slug }`, returns `access_code` for Inline.
- `/api/public/paystack-webhook` server route — verifies signature with `PAYSTACK_SECRET_KEY` + HMAC-SHA512, dedupes on `provider_event_id`, updates `orders.status`, creates `payments` + `product_grants`, upserts `subscribers` row by email, applies tags `paid_customer` + `paid_customer:{product_slug}` + `garden:{garden}`.

### Checkout UX
- Product page "Buy" button opens an inline Paystack modal (loaded via `https://js.paystack.co/v2/inline.js`) — buyer never leaves CHKPLT.
- Pre-checkout: collect email if not signed in; auto-fill if signed in.
- Post-success page: `/orders/$reference/success` polls `orders.status` until `paid`, then shows download links / "Go to dashboard" / next-seed upsell card.

### Dashboard updates
- Student `/dashboard` shows `product_grants` as "Your purchases" with download links for digital products.
- Admin `/_authenticated/admin/orders` lists orders with filters by status, product, date range.

### Secrets required (will request once 2a + 2b are approved)
- `PAYSTACK_SECRET_KEY` — server, used in server fn + webhook
- `PAYSTACK_PUBLIC_KEY` — client, embedded in Inline init

**Verification:** Test purchase of a R49 product end-to-end in Paystack test mode — order created, webhook fires, payment row stored once (verify dedup by replaying), grant created, buyer auto-tagged, receipt visible in dashboard.

---

## Out of scope for Phase 2 (named so we don't drift)

- LMS (modules/lessons/progress/drip) → Phase 3
- Email engine + automations + sequences → Phase 4
- Funnel builder (opt-in/upsell/order-bump pages) → Phase 5
- Affiliate program → Phase 6
- Community → Phase 7
- Domain swap from preview to `chkplt.com` → done at publish time

---

## Technical notes

- All server-side DB writes go through `createServerFn` with `requireSupabaseAuth` (admin-gated for admin actions). Webhook is the only `/api/public/*` route and must verify Paystack's HMAC signature before any DB write.
- `subscribers` table is the email identity; `profiles` remains the auth identity. When a subscriber later signs up, we link by email.
- Multi-currency stays: `products.currency` per row, but seed scripts default to ZAR. Storefront formatter handles ZAR (R prefix) and NGN (₦ prefix) — existing helper already does both.
- Brand stays two-color (Obsidian + Banana). Premium tiers (Etz Pri) differentiated by typography scale + serif weight, not a third color.
- Tag naming convention: lowercase, colon-namespaced for system tags (`paid_customer:paids-workbook`, `garden:etz_pri`, `cohort:accelerator-2026-q1`). User-defined tags are free-form snake_case.

---

## Sequencing

I'll deliver and stop for approval at the end of each sub-phase:

1. **Phase 2a** — migration + seed + storefront restructure → you verify all 26 products render correctly
2. **Phase 2b** — schema + importer + admin contacts UI → you upload the CSV, verify counts
3. **Phase 2c** — schema + Paystack server fn + webhook + checkout UX → you run a test purchase

When you click **Implement plan**, I'll start with 2a.
