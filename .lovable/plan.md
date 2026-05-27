# CHKPLT Backend Hardening — Modules 1, 2, 3

Aligns the spec to what's already in your DB (don't duplicate tables): you already have `subscribers`, `tags`, `subscriber_tags`, `product_grants`, and the private `product-files` bucket. We extend those, we don't replace them.

---

## Module 1 — 13k legacy contact import

**Approach:** CSV lives on your desktop, so a node script isn't practical. Build a one-off **admin import page** instead. You upload the CSV from the browser, the server batches it into Supabase.

**1a. Migration**
- Seed tag row: `slug=legacy_prelaunch_may_2026`, `name="Legacy List – Pre-Launch May 2026"`.
- Index `subscribers(lower(email))` for fast lookup at scale.

**1b. Admin route** `src/routes/_authenticated/admin.import-contacts.tsx`
- Admin-only (uses `has_role`).
- Drag-and-drop CSV uploader, parsed in-browser with `papaparse`.
- Expected columns: `email` (required), `first_name`, `last_name`, `phone`, `source` (all optional). Column mapper UI lets you re-map if headers differ.
- Preview first 10 rows, show duplicate count vs existing subscribers, then "Start import".
- Progress bar: batches of **100**, **2.5s pause** between batches (smooth, ~5–6 min for 13k). Live counters: queued / inserted / skipped / errored. Errors downloadable as CSV.

**1c. Server function** `src/lib/contacts-import.functions.ts`
- `importContactsBatch({ rows })` → admin-guarded.
- `upsert` into `subscribers` on `email` (lowercased), source=`legacy_import`.
- Insert into `subscriber_tags` linking each subscriber to the `legacy_prelaunch_may_2026` tag (idempotent `onConflict`).
- Returns `{inserted, updated, errors[]}`.

**No external ESP push.** You don't have ConvertKit/ActiveCampaign/Brevo connected. Contacts are staged cleanly in Supabase with the tag; when you pick an ESP later, one sync script reads `subscribers` filtered by tag and pushes them — protects your sender reputation in the meantime.

---

## Module 2 — Secure asset storage (PDFs now, video later)

**Current state:** `product-files` bucket is private ✅. `product_grants` exists with `(user_id, product_id, order_id)` ✅. `products.download_path` exists ✅. What's missing: storage RLS policy + a signed-URL server fn that's actually called by the dashboard.

**2a. Migration — storage.objects RLS**
```sql
CREATE POLICY "Download only with active product grant"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'product-files'
  AND EXISTS (
    SELECT 1 FROM public.product_grants pg
    JOIN public.products p ON p.id = pg.product_id
    WHERE pg.user_id = auth.uid()
      AND pg.revoked_at IS NULL
      AND p.download_path = storage.objects.name
  )
);
```
(Service role still bypasses for admin ops.)

**2b. Server function** `src/lib/downloads.functions.ts`
- `getDownloadUrl({ productSlug })` with `requireSupabaseAuth`.
- Verifies a non-revoked `product_grants` row for `(auth.uid(), product.id)`.
- Calls `supabaseAdmin.storage.from('product-files').createSignedUrl(product.download_path, 60*60*24)` → **24h expiry**.
- Returns `{ url, expiresAt }` or throws clean errors (`not_purchased`, `not_available`).

**2c. Wire into dashboard / checkout success**
- Replace any direct `download_path` rendering in `src/routes/_authenticated/dashboard.tsx` and `src/routes/checkout.success.tsx` with a button that calls `getDownloadUrl` on click → opens the signed URL in a new tab. Link is never embedded in HTML/email.

**Video CDN:** deferred per your call. When a video product ships we'll add a `video_provider` + `video_id` to `products` and a tokenized embed component.

---

## Module 3 — Email automation audit

**3a. Audit findings (current state)**
- ✅ Transactional path exists: Lovable Emails queue (`auth_emails`, `transactional_emails`) + `process-email-queue` cron.
- ✅ Auth magic links / signup confirmations flow through `auth-email-hook` → queue.
- ❌ **No post-purchase receipt email.** `paystack-webhook` grants access but never sends the buyer their download link.
- ❌ **No marketing ESP connected** → no nurture sequence can fire on the `legacy_prelaunch_may_2026` tag yet. This is a "pick a provider, then wire it" item, not a code bug.

**3b. Fix the gap — post-purchase receipt**
- New template `src/lib/email-templates/order-receipt.tsx` (React Email): order summary, total, and a **"Get your downloads"** button → links to `/dashboard` (NOT a raw signed URL; user clicks button there which calls `getDownloadUrl`).
- In `paystack-webhook.ts` after `product_grants` upsert: enqueue one transactional email to the buyer's email via `supabase.rpc('enqueue_email', { queue_name: 'transactional_emails', payload: {...} })`. Idempotent: skip if `email_send_log` already has a `sent` row for `order:<id>:receipt`.

**3c. ESP-trigger placeholder (no code yet)**
- Document the trigger contract in `.lovable/plan.md`: when buyer paid, also stamp `subscriber_tags` with `buyer` + `garden_<x>` (already happening) — that's the hook your future ESP sync will pick up to enroll them in nurture flows.

---

## What's explicitly NOT in this plan
- No backend rate-limiting on API routes (Lovable backend lacks primitives; throttled CSV import is a one-off client batch, not endpoint rate-limiting).
- No video CDN integration (deferred).
- No ESP connector setup (you haven't picked one — say the word and I'll wire Brevo/ConvertKit/ActiveCampaign in a follow-up).
- No schema duplication: we use existing `subscribers`/`product_grants`, not new `platform_subscribers`/text-keyed grants.

## File touch list
- Migration: tag seed, subscribers email index, storage.objects download policy.
- New: `src/routes/_authenticated/admin.import-contacts.tsx`, `src/lib/contacts-import.functions.ts`, `src/lib/downloads.functions.ts`, `src/lib/email-templates/order-receipt.tsx`.
- Edit: `src/routes/api/public/paystack-webhook.ts` (enqueue receipt), `src/routes/_authenticated/dashboard.tsx` + `src/routes/checkout.success.tsx` (use `getDownloadUrl`), admin nav link.
- Deps: `papaparse` (+ types).
