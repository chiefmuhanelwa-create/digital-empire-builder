
# Go-Live Readiness Plan

Below is what I found end-to-end and what we need to fix before you can take real money. I've grouped it by area, in roughly the order I'd ship.

---

## 1. What happens today after someone pays

**The wiring works, but there is no email anywhere in the flow.**

Flow today:
1. Buyer clicks "Buy" → `initializeCheckout` server fn creates a `pending` order + `order_items` row, calls Paystack, redirects to Paystack's hosted checkout.
2. After payment, Paystack redirects to `/checkout/success?reference=...`. The page polls `verifyCheckout` every 2s up to 10 times.
3. **In parallel, Paystack POSTs to `/api/public/paystack-webhook`** (HMAC SHA-512 verified ✅). The webhook:
   - Marks order `paid`
   - Upserts a `subscribers` row (source=`checkout`)
   - Tags as `buyer` + the relevant garden tag
   - Creates `product_grants` (links to `user_id` if a profile with that email exists, otherwise just `subscriber_id`)
   - Logs a `payments` row
4. Success page then shows a "Download now" button (signed URL, 30 min TTL) and the Niche-Clarity upsell sequence.

**Gaps that block go-live:**
- ❌ **No receipt email** to the buyer. They only get the file if they don't close the tab.
- ❌ **If buyer paid as a guest** (no account), `product_grants.user_id` is null. When they later sign up with the same email, nothing back-fills the grant → `/dashboard` shows nothing. The `handle_new_user` trigger needs to also claim any orphan grants by email.
- ❌ **No admin notification** when a sale happens.
- ⚠️ **Webhook URL must be registered in the Paystack dashboard** (Settings → API Keys & Webhooks → `https://<your-domain>/api/public/paystack-webhook`). Without it, orders stay `pending` until the success-page polling verifies — and grants never happen if the buyer never lands on the success page.
- ⚠️ Currently using `PAYSTACK_SECRET_KEY` (test or live — we should confirm which is set, and add the live key for production).

## 2. Email delivery (currently: none)

Nothing sends emails right now. For go-live we need:

**Auth emails (Lovable Emails, branded):**
- Email verification on signup
- Password reset (the `/reset-password` route exists but no email triggers it)
- Magic links (optional)

**Transactional emails (Lovable Emails):**
- Order receipt to buyer (with download link + dashboard link) — triggered from webhook
- Admin "new sale" notification to your support inbox
- Contact-form submission notification (see §3)

Prerequisite: set up a sender domain (e.g. `notify.christkingdom.co.za`). I'll launch the email domain setup dialog first, then scaffold the auth + transactional templates branded to match the site.

## 3. Contact page (currently: just mailto links)

`/contact` is two `mailto:` links — no form, no DB capture, no admin view. Fix:
- Add a contact form (name, email, subject, message) on `/contact`.
- New `contact_messages` table (RLS: admins read/manage, anon insert).
- Server fn `submitContactMessage` → inserts row + sends a transactional email to `support@christkingdom.co.za` + auto-reply to the sender.
- New admin tab at `/admin/contacts` (or a section in the existing admin contacts page) to read/triage inquiries.

## 4. Admin: products & contacts

I tested the existing admin:

**`/admin/products`** ✅ works
- Cover image upload → `product-covers` (public bucket)
- File upload → `product-files` (private bucket) for digital downloads
- Create / edit / publish / archive / delete
- One small polish: surface clearer success toast + show uploaded file name in the form after upload

**`/admin/contacts`** ✅ works
- CSV import with column auto-detection, tag creation, status changes
- Adds: contact-message inbox section (from §3), and an "Export current view to CSV" button

**Admin access** ✅
- `has_role(uid, 'admin')` RPC + `_authenticated` layout guard + per-route admin redirect to `/dashboard`
- The first signup becomes admin automatically via `handle_new_user`

## 5. Sales pages & CTAs

`/products/$slug` already renders mockups and sales copy. Audit + tighten:
- Every product detail page must have: hero with cover image, tagline, price, **single primary "Buy now"** CTA above the fold (currently fine), trust micro-copy (instant download, secure Paystack, refund policy line), benefit list, FAQ.
- Sticky mobile checkout bar (price + Buy button) on `/products/$slug` so the CTA is always reachable on phones.
- Category pages (`/products/garden/$garden`) need clear card CTAs ("See details →") and a section intro.
- `/` (home) hero CTA → audit copy to ensure it sends people to highest-converting product, not just `/products`.

## 6. Mobile responsiveness audit

Spot-check on 390px viewport (your current one):
- Header nav, sticky CTAs, product cards, sales page mockups, admin tables.
- Admin tables in particular tend to overflow — add horizontal scroll wrappers + condensed mobile views.
- Checkout form modal (`initializeCheckout` trigger) needs to be full-screen on mobile.

## 7. Pre-launch checklist

- [ ] Switch Paystack to live secret key
- [ ] Register webhook URL in Paystack dashboard
- [ ] Configure email sender domain + DNS
- [ ] Verify currency on every published product is `ZAR` (some seeds default to `NGN`)
- [ ] Confirm first admin user is correct (`select * from user_roles`)
- [ ] Test one full live purchase end-to-end (small amount), then refund
- [ ] Publish, then re-test on `project--…lovable.app`

---

## Suggested order of execution

1. **Email infra** — set up sender domain (one click via the setup dialog), scaffold auth + transactional templates.
2. **Order-receipt email + grant-claim-on-signup** — wire the webhook to enqueue a receipt email; add trigger so signups claim existing grants by email.
3. **Contact form + `contact_messages` table + admin inbox + notification emails.**
4. **Sales page polish + sticky mobile Buy bar + CTA audit.**
5. **Mobile responsiveness pass** on admin tables & checkout modal.
6. **Pre-launch checklist** + a live test purchase.

---

## Technical notes (for me, when building)

- New table `contact_messages` (id, name, email, subject, message, status, created_at) with RLS: anon insert, admin select/update/delete; `GRANT INSERT TO anon`, `GRANT ALL TO authenticated, service_role`.
- Update `handle_new_user` to also `UPDATE product_grants SET user_id = new.id WHERE user_id IS NULL AND subscriber_id IN (SELECT id FROM subscribers WHERE lower(email)=lower(new.email))`.
- Use Lovable Emails (queue-based) for both auth + transactional. Receipt email fired from `handleChargeSuccess` in `paystack-webhook.ts` after grants are written.
- Use `supabase--configure_auth` to require email confirmation before sign-in (currently unknown — will check status during build).
- Sticky mobile CTA: a fixed bottom bar visible only on `<sm` breakpoints on `products.$slug.tsx`.

Approve and I'll start with email infra (step 1) — that unblocks everything else.
