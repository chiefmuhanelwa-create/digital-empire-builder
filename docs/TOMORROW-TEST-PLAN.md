# CHKPLT Funnel — 100% Functionality Test Plan

> Goal: a fully functioning funnel with NOTHING untouched. Tested as a **user** and an **admin**, front-end and back-end.
> Status as of 2026-06-23: code is **wired end-to-end** (audit found no broken routes, no stub buttons, payment/webhook/grant/delivery/bump/upsell/subscription all coded). Remaining work is **DATA + LIVE TESTING**, not code.
> Live version: `39e05cec`. Both migrations (subscriptions + payment_authorizations) APPLIED.

---

## A. DATA INTEGRITY (do first — these silently break purchases)

- [ ] **Every purchasable slug is `published`** — query `products` where status='published'; confirm these exist: called-expert-foundation-kit, called-expert-starter-bundle, called-expert-inner-circle, called-expert-foundations, called-expert-facilitator, contentpreneur-90day-cohort, creator-swipe-vault, asset-accelerator, + the 8 ICP2 products. (Unpublished slug → `initializeCheckout` fails.)
- [ ] **Every paid product has a real `download_path`** — null/empty → buyer sees "No download available" after paying. List products where download_path IS NULL and status='published' AND is_free=false → fix each.
- [ ] **Stand-in deliverables flagged** — bump `creator-swipe-vault` and upsell `asset-accelerator` currently point to STAND-IN PDFs (what-to-post.pdf / monetise-your-expertise.pdf). Swap for the real Swipe Vault + Asset Accelerator assets, OR accept stand-ins for launch and note it.
- [ ] **Upsell-chain products exist + published** — FOUNDATION_KIT_UPSELLS (called-expert-foundation-kit-bonus, called-expert-foundations) and NICHE_CLARITY_UPSELLS (paids-framework, 9-modules-personal-branding, tax-guide-content-creators). Any missing slug = the UpsellFlow silently shows nothing.
- [ ] **Subscription plan live** — Paystack plan `PLN_4oafnq18t7e36gl` (Inner Circle R540/mo) is active.

## B. USER FLOW — front-end click-through (every page, mobile + tablet + desktop)

- [ ] **Landing (`/`)** — hero, video (Meta), testimonials, pricing tiers, ascension ladder, FAQ accordion, sticky mobile buy bar. All CTAs open the checkout modal.
- [ ] **Every nav link + footer link** — header (logo, sign in, Get Started), footer (Terms, Privacy, Refunds, Contact, About). All resolve (audit: no broken routes).
- [ ] **Product pages (`/products/$slug`)** for all live products — price shows USD, "billed in ZAR" note, cover image, description, BuyBlock, bump checkbox.
- [ ] **Garden pages (`/products/garden/$garden`)** — all 4 gardens list correct products.
- [ ] **`/products` index, `/niche-clarity`, `/about`, `/contact`, `/apply`** — render, forms submit (Turnstile), apply 4-step wizard scores + routes.
- [ ] **Legal pages** (terms, privacy, refund-policy) render.
- [ ] **Colour/contrast** — confirm every text legible on the new white canvas at 375 / 768 / 1280px (gold text deep on white, light text on dark bands).

## C. PAYMENT (back-end + live test with a real/test Paystack transaction)

- [ ] **Base checkout** — buy the Foundation Kit → Paystack redirect → pay → land on `/checkout/success` → order shows `paid`.
- [ ] **Order bump** — tick the Swipe Vault bump → Paystack `amount` = kit+bump → BOTH granted → BOTH downloadable on success page.
- [ ] **Receipt email** — buyer gets the Resend receipt (check delivered).
- [ ] **Webhook idempotency** — already coded (`.neq("status","paid")`); confirm a Paystack retry doesn't double-grant.
- [ ] **Card-auth capture** — after a purchase, confirm a row landed in `payment_authorizations` with `reusable=true` (required for 1-click upsell).
- [ ] **1-click upsell (`chargeUpsell`)** — on success page, "Yes — add Asset Accelerator" charges the card-on-file (no re-entry) → instant grant + DownloadCard. Test the `no_authorization` fallback (→ /products/asset-accelerator) for buyers without a saved card.
- [ ] **Subscription** — subscribe to Inner Circle → Paystack subscription created → `subscriptions` row → `has_active_subscription(email)` returns true. Test renewal/cancel webhooks (Paystack test mode over time).
- [ ] **Declined card** — error surfaces gracefully (no hang / no grant).

## D. DELIVERY

- [ ] **Signed download** — `getDownloadUrl` returns a 24h signed URL; file opens; real PDF (not 0-byte).
- [ ] **Access gate** — works both ways: signed-in user via `product_grant`, and guest via paid order reference. A non-buyer cannot pull a download.
- [ ] **Dashboard** — `/dashboard` lists every owned product with a working download button.

## E. ADMIN (log in as admin — gated by `has_role('admin')` RPC)

- [ ] **`/admin/products`** — list shows USD + "charged R…" hint; create a test product; edit; toggle status; upload a file (product-files) + cover (product-covers); delete the test product.
- [ ] **`/admin/curriculum/$productSlug`** — create module + lesson, set a video_url, reorder.
- [ ] **`/admin/contacts` + `/admin/import-contacts`** — view subscribers, import a small CSV, tag.
- [ ] **`/admin/ledger`** — totals reconcile (gross, VAT, tax reserve, net) against test orders.
- [ ] **`/admin/incidents`** — lists errors; resolve one.
- [ ] **Auth guard** — a non-admin user hitting any `/admin/*` is redirected (not shown data).

## F. LMS / PORTAL

- [ ] **`/learn`** — lists granted courses with progress bars.
- [ ] **`/learn/$slug` + lesson player** — module/lesson list; lesson body renders; **video iframe** plays (needs a real `video_url`).
- [ ] **Progress** — "mark complete" updates `lesson_progress` + the progress bar.
- [ ] **personal-brand-30-days** — keep DRAFT until Cloudflare Stream videos are uploaded (empty video_url → blank lesson). OWNER: enable Stream + send Stream:Edit API token → then wire 10 video_urls + publish.

## G. AUTH

- [ ] **Signup** (email/pw + Turnstile) → profile created → `/dashboard`.
- [ ] **Login** (email/pw + Google OAuth) → `/dashboard`.
- [ ] **Reset password** — email arrives (Resend hook), link works, new password logs in.
- [ ] **`/account`** — shows/edits profile; protected route redirects when logged out.

## H. TRACKING / ENV (owner — Cloudflare Worker vars)

- [ ] **`VITE_FB_PIXEL_ID` + `VITE_GA_ID`** set → Pixel/GA load; `trackLead`/`trackPurchase` fire. Unset = silent no-op (site still works).
- [ ] **`MAILERLITE_API_KEY` + `MAILERLITE_GROUP_ID_BUYERS`** set → buyer auto-added to list on purchase (fire-and-forget; unset = silent skip).
- [ ] **`PAYSTACK_SECRET_KEY`, `TURNSTILE_SECRET_KEY`** present and correct (live vs test).

---

## TOP PRIORITIES (the must-fix for a 100% funnel)
1. **Data check** — every published, purchasable product has a real `download_path` (A).
2. **One real end-to-end test purchase** — pay → receipt → download → (C + D).
3. **Capture a card auth, then test the 1-click upsell** charging the card-on-file (C).
4. **Swap stand-in deliverables** for the real bump/upsell assets, or accept + note (A).
5. **Owner: enable Cloudflare Stream + send API token** → finish + publish the course (F).
6. **Owner: set analytics + MailerLite env vars** so leads/purchases are measured (H).

## Known owner-only actions (carried over)
- Enable Cloudflare Stream + create Stream:Edit token + confirm 6 iCloud videos downloaded.
- Set VITE_FB_PIXEL_ID / VITE_GA_ID / MailerLite group IDs in Cloudflare.
- Rotate the service-role key that was exposed in chat during debugging (update .env + Worker secret + cron together).
