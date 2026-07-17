# CHKPLT — Launch Blockers

> Fix these in order before any public launch. 🔴 = launch-critical. 🟡 = should fix before launch. 🟢 = polish.

Last reviewed: 2026-06-15

---

## 🔴 BLOCKERS (Nothing Works Until These Are Fixed)

### BLOCKER-001: Transactional Email Wiring
**UPDATE 2026-06-21:** Provider is **Resend** (not Lovable Cloud — that was stale).
`notify.chkplt.com` is **VERIFIED** in Resend (DNS verified via Cloudflare Jun 16,
"ready to send emails"). DNS is NOT the blocker. Remaining = confirm the wiring:
(1) Cloudflare Worker `tanstack-start-app` has secrets `RESEND_API_KEY` +
`SUPABASE_AUTH_HOOK_SECRET`; (2) Supabase → Authentication → **Send Email Hook**
is ENABLED, URL `https://chkplt.com/api/email/auth/webhook`, secret matching
`SUPABASE_AUTH_HOOK_SECRET`; (3) live-test `/reset-password` → check Resend Logs
for `delivered`. Sender flow: Supabase Auth → hook → `src/routes/api/email/auth/webhook.ts` → Resend.

_Original (obsolete) framing below — kept for history:_
**What's broken:** `notify.chkplt.com` DNS no longer verified in Lovable Cloud.

**Impact:** ALL transactional email is broken:
- Magic-link login → email never sends → users cannot log in
- Signup confirmation → email never sends → new accounts unconfirmed
- Order receipt → email never sends → buyers don't know what they purchased
- Password reset → email never sends → locked-out users have no recovery

**Fix:**
1. Open Lovable Cloud dashboard
2. Navigate to: Emails → Manage Domains
3. Select `notify.chkplt.com`
4. Follow re-verification steps (update DNS TXT/CNAME records in Cloudflare DNS)
5. Wait for DNS propagation (up to 48 hours)
6. Test: trigger a magic-link login and confirm email arrives at chiefmuhanelwa@gmail.com

**Code-side workaround for FIRST-ADMIN access (no email needed):**
The DNS fix above is owner-only and manual. To get an admin account NOW without
waiting for email, use the service-role bootstrap script — it creates a
pre-confirmed admin and skips the broken confirmation email entirely:
```
bun run admin:bootstrap -- chiefmuhanelwa@gmail.com <your-password>
```
(reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from `.env`; idempotent;
see `scripts/bootstrap-admin.ts`). Then sign in at `/auth`. This does NOT fix
transactional email for end-users — the DNS re-verification above is still required.

**Status:** ✅ Resend domain VERIFIED (DNS done) · ⏳ confirm Supabase Send-Email hook + prod secrets, then live-test · ✅ first-admin access unblocked via `admin:bootstrap`

---

### BLOCKER-002: Premium Programme Curriculum
**UPDATE 2026-07-09:** RESOLVED for `contentpreneur-90day-cohort`. Migration
`20260615120000_seed_curriculum.sql` seeded 7 modules / 30 lessons, and
`20260709120000_restructure_curriculum_covenant_engine.sql` restructured it into the
adopted 12-week, 5-Book Torah-arc structure (32 lessons total — see `docs/CURRICULUM.md`
for the full map and `docs/COVENANT-ENGINE.md` for the source blueprint). Both migrations
still need to be applied against the **live** Supabase project if not already run
(`supabase db push`).

`contentpreneur-vip-tier` (R45,000) is still **0 modules, 0 lessons** — not addressed by
either migration. Decide: build a VIP-specific curriculum, or gate it to `draft` until built.

_Original (now-obsolete) framing kept for history below:_

**What was broken:** `contentpreneur-90day-cohort` (R18,000) and `contentpreneur-vip-tier` (R45,000) were `status: published` and visible in the catalog — but had 0 modules, 0 lessons in the LMS.

**Remaining fix for VIP tier (Option A — Build Curriculum):**
1. Open `/admin/curriculum/contentpreneur-vip-tier` in admin panel
2. Add modules — consider reusing the Accelerator PRO structure plus VIP-only 1:1 content
3. Add at minimum 1 lesson per module before opening applications

**Fix (Option B — Temporary Gating):**
1. Set `contentpreneur-vip-tier` status to `draft` (unpublish) in admin until curriculum exists

**Status:** ✅ Resolved for Accelerator PRO — deploy migrations to prod · ❌ Still open for VIP tier

---

### BLOCKER-003: Qualification Gate Rejects Everyone
**What's broken:** `client_stewardship_applications` table has only 1 row, 0 with `determined_routing_status = 'QUALIFIED_FOR_CORE_PROGRAM'`.

**Impact:** The checkout gate for premium programmes (R18,000 / R45,000) checks qualification before allowing payment. If no one is qualified, the premium programmes cannot be purchased by anyone — including the owner.

**Fix:** SEEDED via migration `20260615100000_seed_owner_qualification.sql`. Inserts Ndivhuwo's application with `QUALIFIED_FOR_CORE_PROGRAM` status using verified proof numbers (3M+ followers, 4,895 subscribers, 5 PAIDS income streams, R300K+/month). The `checkQualification` function reads the most recent application per email — this seed immediately unlocks premium checkout for `chiefmuhanelwa@gmail.com`.

**Remaining step:** Run the migration against the live Supabase project (`supabase db push` or apply via Supabase dashboard SQL editor).

**Status:** ✅ Migration written — deploy to unlock checkout

---

## 🟡 SHOULD FIX BEFORE LAUNCH

### BLOCKER-004: Platform Not Published
**What's broken:** There is an `is_published` flag somewhere in the DB that is set to `false`.

**Impact:** Platform may be invisible to public or have certain features gated.

**Fix:**
1. Query DB to find which table has `is_published` field
2. Flip to `true` via admin panel or direct SQL (with caution)

**Status:** ❌ Not fixed

---

### BLOCKER-005: Stripe Integration Not Built
**What's broken:** International buyers (non-ZAR) cannot pay. Only Paystack (ZAR) is implemented.

**Impact:** Any international Called Expert who finds CHKPLT and wants to pay in USD/GBP/EUR cannot complete a purchase. Global market is locked out.

**Fix:** See `docs/PAYMENTS.md` → "Stripe (International — NOT YET BUILT)" section for full implementation plan.

Required before starting:
- 3 new DB migrations (see PAYMENTS.md)
- New server function `src/lib/checkout-stripe.functions.ts`
- New webhook route `src/routes/api/public/stripe-webhook.ts`
- Checkout UI update with currency/region picker

**Status:** ❌ Not built

---

### BLOCKER-006: SARS 25% Reserve Column Missing
**What's broken:** `orders` table does not have a `tax_reserve_cents` column. Every payment processed has no earmarked tax reserve.

**Impact:** SARS compliance risk. Without per-order tax tracking, reconciliation requires manual calculation at year-end. This is the exact pattern that led to the R207,879.20 debt.

**Fix:** ALREADY IMPLEMENTED via `audit_ledgers` table (migration `20260527231017`). The `audit_ledgers` table has an immutable `tax_reserve_cents` column calculated as `ROUND(total_cents * 0.25)` per payment. The webhook's `writeAuditLedger()` function writes this on every `charge.success` event. No column needed on `orders` — a separate immutable ledger is better.

**Status:** ✅ Resolved — `audit_ledgers.tax_reserve_cents` written per payment

---

### BLOCKER-007: Paystack Webhook HMAC Not Verified (Audit Needed)
**What's broken (potential):** The webhook handler at `/api/public/paystack-webhook` may not be verifying the `x-paystack-signature` HMAC header before processing payment events.

**Impact:** An attacker could send a fake `charge.success` event → get free product access without paying.

**Fix:** ALREADY IMPLEMENTED in `src/routes/api/public/paystack-webhook.ts`. The handler uses `createHmac('sha512', PAYSTACK_SECRET_KEY)` + `timingSafeEqual` to verify the `x-paystack-signature` header before any DB writes. Returns 401 on mismatch. Uses `PAYSTACK_SECRET_KEY` (Paystack uses the secret key, not a separate webhook secret).

**Status:** ✅ Resolved — timing-safe HMAC verified at top of POST handler

---

## 🟢 PRE-LAUNCH POLISH

### POLISH-001: 84% of Products Are Archived
**What:** 31 products in DB, only 5 published. 26 are draft/archived.

**Decision needed:** Intentional lean catalog (MVP) or should some be republished?

**Recommendation:** Keep lean catalog. Each new product that goes live should have: completed copy + designed PDF + Supabase Storage upload + MailerLite trigger configured. Don't mass-publish without these.

---

### POLISH-002: Legal Pages Need Content Audit
**What:** `/terms`, `/privacy`, `/refund-policy` routes exist and render — but content may be placeholder or boilerplate.

**Fix:** Review each page for NOCHILL PTY LTD specifics:
- Terms: Include the CHKPLT covenant language (transformation promise, not money-back)
- Privacy: ZAR jurisdiction, POPIA compliance (SA's GDPR equivalent)
- Refund: "No refunds after Day 7 of programme access" — be specific, not generic

---

### POLISH-003: No Analytics Tracking
**What:** No web analytics script detected (no GA4, no Plausible, no Cloudflare Web Analytics).

**Fix:** Add Cloudflare Web Analytics (zero config, privacy-first, free with Cloudflare plan):
```html
<!-- In __root.tsx <head> -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
  data-cf-beacon='{"token": "your-token"}'></script>
```

---

### POLISH-004: SEO Not Validated
**What:** Product pages and landing pages may not have unique `<title>` + `<meta description>` + `og:image`.

**Fix:** Audit all public-facing routes for:
- Unique `<title>` per page (not "CHKPLT" on every page)
- `<meta name="description">` with hook (not generic)
- `<meta property="og:image">` pointing to relevant product cover from `/public/product-covers/`

---

### POLISH-005: Turnstile Not Confirmed on All Forms
**What:** Turnstile CAPTCHA should be on: `/apply`, `/signup`, `/login`, `/contact`, checkout init.

**Fix:** Open each of these routes and confirm `<TurnstileGate>` component wraps the submission button. Without `VITE_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in env, Turnstile will fail silently.

---

### POLISH-006: Happy-Path Smoke Test
**What:** No end-to-end happy path confirmed before launch.

**Fix sequence (do this in order, in test mode):**
1. ✅ DNS verified for `notify.chkplt.com`
2. ✅ env vars all set (including Paystack test keys)
3. `/signup` → create test account → confirm magic-link email arrives
4. `/products` → view catalog → click a product
5. `/checkout` → complete Paystack test payment (amount: R1)
6. Webhook fires → order status = 'paid' → product_grants row created
7. `/checkout/success` → download link visible
8. `/learn` → course listed (if LMS product)
9. `/account` → profile accessible
10. Repeat with `/apply` flow for premium product (fix BLOCKER-003 first)

---

---

### BLOCKER-008: Video Hosting Not Configured
**What's broken:** LMS lessons have no video delivery mechanism. Supabase Storage handles PDFs but is not designed for video streaming (large files, no adaptive bitrate, no resumable playback).

**Impact:** Called Expert Accelerator PRO (R18,000) is a 20-week LMS programme — the curriculum requires video lessons. Without video hosting, LMS content is text-only, breaking the transformation promise.

**Fix — Use Cloudflare Stream (recommended, already on Cloudflare Workers):**
1. Enable Cloudflare Stream on your Cloudflare account (dash.cloudflare.com → Stream)
2. Upload lesson videos via Cloudflare Stream API or dashboard
3. Add `video_url` column to `lms_lessons` table:
   ```sql
   -- New migration: supabase/migrations/YYYYMMDD_add_lesson_video.sql
   ALTER TABLE lms_lessons ADD COLUMN video_url TEXT;
   ALTER TABLE lms_lessons ADD COLUMN video_duration_seconds INT;
   ```
4. Update lesson components to render Cloudflare Stream player:
   ```tsx
   <iframe
     src={`https://iframe.cloudflarestream.com/${lesson.video_url}`}
     allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
     allowFullScreen
   />
   ```
5. Set signed URL tokens for private video access (protect paid content)

**Cloudflare Stream pricing:** $5/1,000 minutes stored + $1/1,000 minutes delivered. A 20-week programme with ~30 videos at 15 min each = ~450 min stored = ~$2.25/month storage.

**Status:** ❌ Not configured

---

### ARCHITECTURE NOTE: Do Not Move to Shopify or Third-Party Platforms

**Decision (2026-06-15):** CHKPLT stays on TanStack + Cloudflare Workers + Supabase. This is the 90-95% owned asset.

**Why Shopify is wrong for this use case:**
- Cannot run the 23-point qualification diagnostic
- Cannot build role-based LMS with progress tracking
- Cannot do magic link auth + qualification gating before checkout
- Cannot build the student dashboard (/dashboard)
- No Paystack native integration (SA payments broken)
- You'd be renting, not owning

**What's actually missing (add these, don't rebuild):**
| Gap | Solution | When |
|-----|----------|------|
| Video hosting | Cloudflare Stream | Before soft launch |
| Order bumps | Build into checkout route | Phase 2 |
| Post-purchase upsell | New route: /checkout/upsell | Phase 2 |
| International buyers | Stripe (BLOCKER-005) | Phase 2 |

**The owned funnel (fully working):**
```
Landing (chkplt.com)
  → /apply (23-point diagnostic — CHKPLT)
  → Checkout (Paystack ZAR / Stripe USD — CHKPLT)
     → Order bump (R899 PAIDS workbook — build into checkout)
  → Post-purchase upsell (/checkout/upsell — to build)
  → Email (Lovable Cloud transactional + MailerLite sequences)
  → LMS (/learn — CHKPLT + Cloudflare Stream for video)
  → Dashboard (/dashboard — CHKPLT)
```

95% owned. Rented parts: Supabase (replaceable) + Cloudflare (exit cost near zero).

---

## Fix Priority Order

```
BLOCKER-001 (email domain)     ← FIX FIRST (login broken — manual DNS, not code)
    ↓
BLOCKER-003 (qualification)    ← FIX SECOND (premium checkout gate broken)
    ↓
BLOCKER-002 (no curriculum)    ← FIX THIRD (LMS empty — build in admin panel using docs/CURRICULUM.md)
    ↓
BLOCKER-008 (video hosting)    ← ADD (Cloudflare Stream — before soft launch if video content ready)
    ↓
BLOCKER-007 (HMAC audit)       ← AUDIT (security — check paystack-webhook.ts)
    ↓
BLOCKER-006 (SARS reserve)     ← ADD MIGRATION (compliance — 2-line SQL)
    ↓
BLOCKER-005 (Stripe)           ← BUILD (international market — Phase 2)
    ↓
BLOCKER-004 (published flag)   ← FLIP (visibility)
    ↓
POLISH-001 through POLISH-006  ← POLISH (launch quality)
    ↓
🚀 SOFT LAUNCH (email list of 4,895 subscribers)
    ↓
📣 PUBLIC LAUNCH
```
