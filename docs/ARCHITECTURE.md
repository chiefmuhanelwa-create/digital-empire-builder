# CHKPLT — Architecture & Replication Blueprint

> **Purpose of this file:** if chkplt.com had to be rebuilt from zero — same stack, same
> integrations, same data model — this document plus `.env.example` plus
> `supabase/migrations/*.sql` should be enough to do it. **Every session that changes a
> route, a table, an integration, a cron job, or the deploy process updates this file in
> the same session it makes the change.** It is not a one-time snapshot — treat drift
> here the same as an untested code path: not done until it's written down.
>
> Last verified against the live repo: 2026-07-29 (63 migrations, cart/quick-view/header
> rebuild + Tools Hub Phase 1/2 + real ops alerting on critical failures — just shipped).

---

## 1. Stack Overview

```
┌───────────────────────────────────────────────────────────────┐
│                      CHKPLT Platform                           │
│  TanStack Start v1 (SSR) + React 19 + Vite 7 — NOT Next.js     │
├───────────────────────────────────────────────────────────────┤
│ Hosting: Cloudflare Workers (wrangler.jsonc, entry src/server.ts)│
│ Language: TypeScript 5.8 (strict)                               │
├───────────────────────┬───────────────────────────────────────┤
│ Database              │ Auth                                   │
│ Supabase PostgreSQL    │ Supabase magic-link + password          │
│ 40+ tables/functions,  │ First registered user → auto admin      │
│ RLS on every table     │ (DB trigger)                            │
│ 62 migrations          │                                         │
├───────────────────────┼───────────────────────────────────────┤
│ Payments (ZAR)         │ Payments (Global)                       │
│ Paystack               │ Stripe                                  │
│ SA/Africa rail         │ USD Checkout Sessions, all other regions│
├───────────────────────┼───────────────────────────────────────┤
│ Email (Transactional)  │ Email (Marketing)                       │
│ Resend + pgmq queue    │ MailerLite                              │
│ (magic-link, receipts, │ (welcome sequences, free-lead-magnet    │
│ password reset)        │ nurture, buyer segments)                │
├───────────────────────┼───────────────────────────────────────┤
│ CAPTCHA                │ UI                                      │
│ Cloudflare Turnstile   │ Radix UI + shadcn/ui + Tailwind 4        │
│ (all public forms +    │ lucide-react icons                      │
│ checkout)              │                                         │
└───────────────────────┴───────────────────────────────────────┘
```

Two live domains share this ONE Cloudflare Worker via path-specific routes (see §3).
The split is by JOB, not by codebase — see `src/lib/domains.ts`, which is the single
source of truth in code:
- **chkplt.com** — the storefront and back office: `/products`, `/cart`, `/search`,
  `/tools`, `/admin` content, marketing pages.
- **contentpreneur.africa** — the customer journey end to end. A SEPARATE Next.js
  marketing site still owns the homepage and `/about`, but the funnels
  (`/starterkit`, `/foundation`, `/accelerator`, `/apply`, `/creator-bundle`),
  the transaction (`/checkout*`, `/_serverFn/*`) and — since **Phase 3, 2026-08-18**
  — the whole signed-in **member workspace** (`/dashboard*`, `/apps/*`, `/learn*`,
  `/account*`, `/login*`, `/signup*`, `/reset-password*`, `/admin*`) are routed to
  THIS Worker.

**Phase 3 (2026-08-18) — the member workspace moved to contentpreneur.africa.**
Founder ruling: the Foundation Kit workspace lives under contentpreneur.africa, not
chkplt.com. Before this, `/foundation` sold on that domain while
`/dashboard/foundation-kit` existed only on chkplt.com — verified live,
`contentpreneur.africa/dashboard/foundation-kit` HUNG and
`contentpreneur.africa/login` 404'd, so every kit buyer met a second brand the
moment they opened what they bought. `src/server.ts` now **301s** every member path
arriving on chkplt.com to contentpreneur.africa, so the workspace has exactly one
home. Sessions are per-domain cookies, so that redirect signs existing members out
once — a known, accepted one-time cost of the ruling.

---

## 2. Environment Variables

Full authoritative template: **`.env.example`** (keep that file current — it is the
actual source of truth for what must be configured, this section just explains the
categories). Categories:

| Category | Vars | Notes |
|---|---|---|
| Supabase | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | Service role key is server-only, used by all admin server functions + webhooks + cron |
| Paystack | `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `VITE_PAYSTACK_PUBLIC_KEY` | ZAR rail. Webhook URL: `https://chkplt.com/api/public/paystack-webhook` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` | USD rail. Webhook URL: `https://chkplt.com/api/public/stripe-webhook` |
| Turnstile | `TURNSTILE_SITE_KEY` (no VITE_ prefix — read server-side), `TURNSTILE_SECRET_KEY` | Gates `/apply`, `/signup`, `/login`, `/contact`, all checkout-initiating server functions |
| Resend | `RESEND_API_KEY`, `SUPABASE_AUTH_HOOK_SECRET` | Domain `notify.chkplt.com` must be DNS-verified in Resend. Auth hook secret must match in 3 places: `.env`, `wrangler secret put`, Supabase Dashboard → Auth → Hooks → Send Email |
| Ops alerting | `OPS_ALERT_EMAIL` | Where "critical" `reportError()` calls get emailed (`src/lib/alerts.ts`) — no separate service, reuses the Resend key above. Optional; alerting no-ops if unset. |
| MailerLite | `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID_*` (one per lead magnet + a buyers group) | Marketing automation only — never used for transactional. Custom fields (`segment`, `pain_point`, `source_platform`, `source_keyword`, `icp`, `focus_phase`) must be created in MailerLite → Subscribers → Fields — the v3 API won't auto-create unknown ones |
| ManyChat | `MANYCHAT_WEBHOOK_SECRET` | Shared-secret auth for `/api/public/manychat-lead` — see §4 route table |
| App | `VITE_APP_URL`, `NODE_ENV`, `VITE_WHATSAPP_SUPPORT_NUMBER` (optional — hides the chat panel if blank) | |

Cloudflare Worker secrets (`bunx wrangler secret put <NAME>`) must mirror every
server-only var above — `.env` alone only covers local dev.

---

## 3. Cloudflare Routing & Cron (`wrangler.jsonc`)

```jsonc
routes: [
  "chkplt.com/*"                              → this Worker (full app)
  "contentpreneur.africa/starterkit*"          → this Worker
  "contentpreneur.africa/foundation*"          → this Worker
  "contentpreneur.africa/accelerator*"         → this Worker
  "contentpreneur.africa/apply*"               → this Worker
  "contentpreneur.africa/creator-bundle*"      → this Worker
  // Phase 3, 2026-08-18 — the member workspace. Keep in sync BY HAND with
  // MEMBER_PATH_PREFIXES in src/lib/domains.ts (Cloudflare route patterns are
  // config and cannot read that array).
  "contentpreneur.africa/dashboard*"           → this Worker (the Foundation Kit workspace)
  "contentpreneur.africa/apps/*"               → this Worker (the 11 kit-gated tools)
  "contentpreneur.africa/learn*"               → this Worker (LMS)
  "contentpreneur.africa/account*"             → this Worker
  "contentpreneur.africa/login*"               → this Worker
  "contentpreneur.africa/signup*"              → this Worker
  "contentpreneur.africa/reset-password*"      → this Worker
  "contentpreneur.africa/admin*"               → this Worker (shares the same login)
  "contentpreneur.africa/assets/*"             → this Worker (Vite static assets for the above)
  "contentpreneur.africa/downloads/*"          → this Worker
  "contentpreneur.africa/product-covers/*"     → this Worker
  "contentpreneur.africa/_serverFn/*"          → this Worker (every form submit)
  "contentpreneur.africa/checkout*"            → this Worker (post-payment redirect target)
  "contentpreneur.africa/contact*"             → this Worker
  "contentpreneur.africa/terms*"               → this Worker
  "contentpreneur.africa/privacy*"             → this Worker
  "contentpreneur.africa/refund-policy*"       → this Worker
]
// Everything else on contentpreneur.africa (/, /about) → the SEPARATE Next.js
// Worker for that zone. Cloudflare resolves by route specificity, so the two
// coexist without conflict.

triggers.crons: [
  "10 4 * * *"   // daily — sync-fx: reconcile ZAR price_cents to the live USD rate
  "* * * * *"    // every minute — drain the transactional/auth email queue (Resend)
]
```

`src/server.ts` is the Worker entry: **301s member paths off chkplt.com onto
contentpreneur.africa** (`memberDomainRedirect`, GET/HEAD only — a 301 on a POST may
be replayed as a GET and silently drop a form submit), wraps the TanStack Start SSR
handler, adds a branded 500 page for h3-swallowed SSR errors, sets `Cache-Control:
no-cache, must-revalidate` on all HTML responses (fixed 2026-07-29 — without this, browsers
heuristically cached pages and made real deploys look like they "didn't take"), and
exports `scheduled()` to route the two cron triggers above to `fx-sync.ts` /
`email-queue.ts`.

---

## 4. Routing Map (TanStack file-based, `src/routes/`)

### Public marketplace & content
| Route | File | Purpose |
|---|---|---|
| `/` , `/products` | `index.tsx`, `products.index.tsx` | Marketplace grid (`MarketplaceHome.tsx`) — profile hero, garden filter pills, search-free grid (search lives at `/search` now), Quick View on click |
| `/products/$slug` | `products.$slug.tsx` | Full product page — cover image, price + compare-at strikethrough, Buy Now (instant checkout modal) + Add to Cart, benefits, related products |
| `/cart` | `cart.tsx` | Real cart (localStorage-backed) — line items, remove, subtotal, inline checkout, empty state, upsell grid |
| `/search` | `search.tsx` | Dedicated search page (matches the real store's own `/search`) |
| `/apply` | `apply.tsx` | 23-point Contentpreneur qualification diagnostic (gates application-only products) |
| `/login`, `/signup`, `/reset-password` | | Auth |
| `/checkout/success` | `checkout.success.tsx` | Post-payment landing — download link + "check your email" notice |
| `/about`, `/contact`, `/terms`, `/privacy`, `/refund-policy` | | Static/legal |
| `/tools` | `tools.tsx` | Free tools index |
| `/rate-card`, `/media-kit`, `/sars-calculator`, `/hook-generator`, `/offer-builder`, `/niche-clarity`, `/align-accelerate-excel` | | Standalone free lead-magnet tools, each with its own `*.functions.ts` |
| `/starterkit`, `/foundation`, `/accelerator` | | contentpreneur.africa flagship funnels (routed here per §3), own `ContentpreneurHeader`/`Footer` |

### Authenticated (`_authenticated/` prefix — Supabase session required)

**Served on contentpreneur.africa** since Phase 3 (2026-08-18); chkplt.com 301s these
paths there. In-page links out to the storefront must therefore be ABSOLUTE — use
`storeProductUrl()` from `src/lib/domains.ts`, because a relative `/products/...` link
404s on this domain. The one exception is the Foundation Kit, whose sales page
`/foundation` is a route in this app and resolves on both hosts.

| Route | Purpose |
|---|---|
| `/dashboard`, `/account` | Member home, profile/password |
| `/dashboard/products/free`, `/dashboard/products/paid` | Owned-products views |
| `/dashboard/foundation-kit`, `/dashboard/inner-circle`, `/dashboard/community` | Program-specific member views |
| `/learn`, `/learn/$slug`, `/learn/$slug/$lessonSlug` | LMS — course list, modules, lessons |
| `/apps/*` (**11** routes) | Interactive member tools, all gated on `useKitAccess` — 4E calendar, DARES model, income tracker, niche-clarity builder, knowledge audit, MS×TS×SS, PAIDS auditor, consistency blueprint, first-income planner, right-side diagnostic, seeds-pipeline. This count is what the Foundation Kit sales copy claims; if a tool is added or gated differently, the copy in `/foundation` and the product's `benefits` must move with it. |

### Admin (admin role via `has_role()` RPC)
| Route | Purpose |
|---|---|
| `/admin` | Overview |
| `/admin/products` | Catalog CRUD + Live/All visibility toggle + per-product sales/revenue + MailerLite connection status |
| `/admin/curriculum/$productSlug` | Build course modules/lessons |
| `/admin/contacts`, `/admin/import-contacts` | Contact management + CSV import |
| `/admin/ledger` | Transaction audit log |
| `/admin/incidents` | Error/incident log |

### API / Webhooks / Cron (no auth — signature/HMAC-validated where applicable)
| Route | Purpose |
|---|---|
| `/api/public/paystack-webhook` | Paystack `charge.success` → verify `x-paystack-signature` → fulfill order |
| `/api/public/stripe-webhook` | Stripe `checkout.session.completed` → verify `stripe-signature` → same fulfillment path |
| `/api/cron/sync-fx` | Manual/triggered FX sync (same logic the daily cron calls) |
| `/api/email/queue/process` | Manual/triggered email-queue drain (same logic the every-minute cron calls) |
| `/api/email/auth/webhook`, `/api/email/auth/preview` | Supabase Auth "Send Email" hook → renders + queues the right template |
| `/api/public/manychat-lead` | ManyChat DM-automation Hub flow's "External Request" action, at each segmentation stage → `Authorization: Bearer MANYCHAT_WEBHOOK_SECRET` (shared secret, timing-safe compare — ManyChat can't HMAC-sign) → upserts `subscribers` (first-touch `source`, segment/pain_point/source_keyword in `raw_data.manychat`) → syncs to MailerLite with custom fields |

---

## 5. Database (Supabase Postgres, RLS everywhere, 62 migrations)

**Never edit a migration file. Always add a new one.** `npx supabase db push` applies
pending migrations to the linked remote project.

### Core tables (selected — see `src/integrations/supabase/types.ts` for the full
generated set, which is the authoritative live schema)
```
profiles, user_roles                     — identity + roles (admin | student)
products                                 — slug, title, tagline, description,
                                            long_description, benefits[], format,
                                            target_audience, garden, price_cents,
                                            compare_at_price_cents, currency, is_free,
                                            requires_application, cover_image_url,
                                            download_path, status, show_in_marketplace,
                                            sort_order, seed_to_product_id
orders, order_items, payments            — order lifecycle, line items, gateway events
payment_authorizations                   — saved Paystack card-on-file (1-click upsell)
product_grants                           — user_id + product_id row = access unlocked
modules, lessons, lesson_progress        — LMS
client_stewardship_applications          — 23-point diagnostic answers + routing status
subscribers, subscriber_tags, tags       — marketing/lead capture (MailerLite mirror)
subscriptions                            — Paystack recurring plans (Inner Circle, Community)
income_transactions                      — member Income Tracker tool data
niche_clarity_progress                   — member Niche Clarity Builder tool data
offer_builder_leads                      — Offer Builder tool captures
tool_submissions                         — generic cross-tool input/output capture
                                            (tool_slug, email, user_id, payload jsonb) —
                                            the reusable pattern for any NEW tool's data
                                            capture, added once rather than a table per
                                            tool; admin-read-only via RLS
contact_submissions                      — /contact form
incidents                                — error/incident log (admin/incidents)
audit_ledgers                            — admin/ledger transaction audit
email_send_log, email_send_state,
email_unsubscribe_tokens, suppressed_emails — email delivery tracking + suppression
```
Plus 4 pgmq queues: `auth_emails`, `transactional_emails`, and their `_dlq` dead-letter
counterparts (RPCs: `enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`).

`garden` enum (product category): `deshe` (Free Tools) · `esev` (Products & Mini-Courses)
· `etz_pri` (Coaching & Accelerator, application-gated) · `devarim` (Books).

### RLS shape
- Anon/public role: `products` visible only where `status = 'published'` (drafts are
  invisible, not just filtered client-side — verified this session by anon-key query).
- Authenticated: own `orders`/`order_items`/`product_grants`/`lesson_progress`/tool-data rows.
- Admin (`has_role()`): full read/write everywhere.
- Webhooks + cron + server functions use `supabaseAdmin` (service role key) and bypass RLS.

---

## 6. Frontend Architecture

- **Root shell**: `src/routes/__root.tsx` — wraps every route in
  `QueryClientProvider → AuthProvider → CurrencyProvider → CartProvider`, plus the
  Sonner toaster.
- **`src/lib/currency.tsx`**: geo-detects country via `getViewerCountry` server fn
  (`CF-IPCountry` header), OR a manual shopper override (`ZAR`/`USD`, persisted in
  `localStorage["chkplt_currency_override"]`) surfaced via the header's currency
  switcher — the override wins over geo-detection for BOTH price display
  (`formatPrice`) and payment-rail routing (`shouldUseStripe`).
- **`src/lib/cart.tsx`**: the cart itself. Digital products are one-off downloads (no
  quantities) — cart is just a deduped array of product slugs in
  `localStorage["chkplt_cart"]`, broadcast via a `chkplt:cart-changed` CustomEvent so
  the header badge updates same-tab. No server-side cart table — it's client-only by
  design.
- **`src/components/site-header.tsx`**: `SiteHeader`/`SiteFooter`. Header = currency
  switcher (left) · centered CHKPLT wordmark · profile/search/cart icons (right, cart
  badge shows live count) · authenticated member nav (My workspace/Products/Free
  Tools/Admin) shown only when signed in. Footer matches the real
  contentcreatorhub.online footer (payment badges, legal links).
- **`src/components/MarketplaceHome.tsx`**: the shop grid. SSR-fetched via each route's
  `loader` (`fetchMarketplaceProducts`) so the grid paints in the initial HTML, not
  after hydration. Garden filter pills + (separately, `/search` for text search). Paid
  products open `ProductQuickView` on click; free products link straight to their page.
- **`src/components/ProductQuickView.tsx`**: the quick-view popup (mockup, price +
  compare-at, tagline/description, top benefits, Add to Cart, "View full product page"
  link) — matches the real Shopify store's own product-tile click behavior.
- **`src/routes/products.$slug.tsx`**: full product page. Sienna/Inter/black theme
  matching the real store's `contentpreneur.css` exactly (not a guess — scraped
  directly). Cover image containers use `aspect-ratio: 3/4` + `object-contain` +
  cream `#f8f6f3` bg/padding (portrait book-cover mockups were cropping under the
  earlier `aspect-square`/`object-cover` treatment). `BuyBlock` branches to
  `FreeLeadMagnet` (free), `ApplicationGate`+`CheckoutForm` (application-gated), or the
  popup `CheckoutModal` + inline Add-to-Cart button (plain paid purchase).
- **`src/routes/cart.tsx`**: real cart page. Gates empty/populated state on
  `slugs.length` (sync, localStorage) rather than the product-details query's
  `isLoading` — the cart's contents are invisible to SSR either way (localStorage-only),
  so gating on the query would show a blank page until hydration; gating on `slugs`
  renders the correct empty state immediately.
- **`src/components/ProfileHero.tsx`**: the founder bio block on the marketplace home —
  photo, stat pills, gold "Best Trusted Seller" card, social icons (Instagram, TikTok,
  YouTube, Facebook) — scraped directly from the live Shopify store's own CSS/markup.
- **`src/components/contentpreneur-header.tsx`**: separate header/footer used ONLY by
  `/starterkit`, `/foundation`, `/accelerator` — NOT the shared CHKPLT header, per
  founder decision to keep chkplt.com invisible in that specific customer journey while
  post-purchase (dashboard/login/checkout-success/legal) stays CHKPLT-branded on purpose.
- **`src/components/admin-shell.tsx`, `member-shell.tsx`**: layout wrappers for
  `/admin/*` and `_authenticated/*` respectively.
- **UI kit**: `src/components/ui/` — shadcn/ui + Radix primitives, Tailwind 4.
- **`src/components/BackNav.tsx`**: the one reusable back-navigation link (icon + label)
  used across every page that would otherwise be a dead end — added store-wide 2026-07-29.
- **Free-then-paid AI tool gate pattern** (Hook Generator, Offer Builder): resolve access
  by EMAIL (not login session, since both tools work without an account) — count prior
  real generations for that email from the tool's own capture table
  (`tool_submissions`/`offer_builder_leads`), and once over a small free limit, check
  whether that email has a `paid` order whose `metadata.product_slug` is in
  `KIT_OWNER_SLUGS` (exported from `tool-ai.functions.ts`). Under the limit or Kit-owned →
  generate normally; otherwise the server fn returns `{ locked: true }` (not a thrown
  error) so the route renders a real upsell card instead of a toast.
- **`src/lib/tools.ts` / `src/routes/tools.tsx`**: the Tools Hub (`/tools`) — a single
  `TOOLS[]` array grouped into 3 founder-named categories (Brand Deals, Creator Finance,
  Content Creation), each tool tagged `tier: "free" | "premium"`. Most are native CHKPLT
  routes; a couple (`external: true`) are standalone `product-lab/web-tools` Vercel apps
  not yet ported natively — rendered as a plain `<a target="_blank">` instead of a
  router `<Link>`. A "Tools" pill sits alongside the marketplace's garden-filter pills
  (`MarketplaceHome.tsx`) as a real navigation (not a grid filter).
- **Adapting an external static-HTML tool "as-is" into a CHKPLT page** (used for
  `/rate-card`): copy the tool's own `index.html` verbatim into
  `public/tools/<name>/index.html` with only surgical edits — its own `<header>`/
  `<footer>` get `style="display:none"` (hidden, not deleted — deleting breaks any
  `getElementById` calls its own JS makes against those elements) so CHKPLT's
  `SiteHeader`/`SiteFooter` are the only visible chrome, and any relative `/api/*`
  fetch calls are rewritten to absolute URLs pointing at the tool's own still-live
  Vercel backend (the file now serves from chkplt.com's own static bucket, a different
  origin than its original API routes). The CHKPLT route itself is just
  `SiteHeader` + a same-origin `<iframe src="/tools/<name>/index.html">` (same-origin
  because it's served from chkplt.com's own `public/`, not iframed from the external
  Vercel domain) + `SiteFooter` — being same-origin lets the wrapper read
  `iframe.contentDocument.body.scrollHeight` via a `ResizeObserver` and auto-size the
  iframe, with zero lines of the tool's own file touched for sizing.

---

## 7. Backend — Server Functions (`src/lib/*.functions.ts`)

TanStack Start `createServerFn` — each compiles to a real `POST /_serverFn/<hash>`
endpoint under the hood (Seroval-serialized payload, `x-tsr-serverFn: true` header;
not hand-craftable via plain curl/JSON — drive it through the actual client or a real
browser for testing).

| File | Purpose |
|---|---|
| `checkout.functions.ts` | `initializeCheckout` (Paystack), `initializeStripeCheckout`, `verifyCheckout`, `chargeUpsell` (1-click, saved card), `initializeSubscription` (Paystack Plans). Supports order-bump upsells (`bumpSlugs`, max 3) — the cart page's multi-item checkout reuses this exact mechanism (first cart item = `productSlug`, rest = `bumpSlugs`), capping a cart checkout at 4 paid items. |
| `products.functions.ts` | Public catalog fetch, `claimFreeProduct` (free lead-magnet: subscriber upsert + MailerLite tag + signed download URL, no auth), admin CRUD, `adminProductStats`, `adminToggleMarketplaceVisibility` |
| `lms.functions.ts` | Course/module/lesson access + progress |
| `apply.functions.ts`, `qualification.functions.ts` | 23-point diagnostic submit + qualified-status check (gates `requires_application` products) |
| `account.functions.ts` | Profile, password, delete account |
| `contacts.functions.ts`, `contacts-import.functions.ts`, `contact.functions.ts` | Contact management + CSV import + public contact form |
| `income-tracker.functions.ts`, `niche-clarity.functions.ts`, `offer-builder.functions.ts`, `rate-card.functions.ts`, `media-kit.functions.ts`, `starterkit.functions.ts`, `aligned.functions.ts`, `inner-circle.functions.ts`, `community.functions.ts` | Per-tool/per-program server logic — mostly `requireSupabaseAuth`-gated CRUD or public email-capture-then-deliver patterns |
| `hook-generator.functions.ts` | `generateHooks` — public, Turnstile-gated, calls Claude (`getAnthropic()`/`COACH_MODEL`) to write 5 real hooks per request; free-then-paid gated (3/email via `tool_submissions` count, then requires Foundation Kit ownership resolved by email against `orders`), sends a confirmation email, logs to `tool_submissions` |
| `offer-builder.functions.ts` | `buildOffer` — public, Turnstile-gated, calls Claude (`OFFER_MODEL`, Opus-tier) for a full structured offer; same free-then-paid gate as Hook Generator (2/email via `offer_builder_leads` count) — this gate was ADDED 2026-07-29 after an audit found the function had no usage limit at all despite the catalog claiming "Foundation Kit owners only"; sends a confirmation email |
| `turnstile.functions.ts` / `turnstile.server.ts` | Site-key fetch + server-side token verification |
| `geo.functions.ts` | `getViewerCountry` — reads Cloudflare's `CF-IPCountry` |
| `tool-ai.functions.ts` | AI-assisted tool logic (Anthropic SDK) for the free tools |

Shared libs (not server functions): `src/lib/gardens.ts` (garden enum + `formatPrice` +
`USD_DISPLAY` price-override map), `src/lib/fx-sync.ts` (cron job body),
`src/lib/email-queue.ts` (cron job body + Resend send logic), `src/lib/cart.tsx`,
`src/lib/currency.tsx`, `src/lib/mailerlite.ts`, `src/lib/order-fulfillment.ts` (the
shared "mark order paid → grant product → send receipt" path both webhooks call).

### Error reporting & ops alerting
`src/lib/error-logger.ts`'s `reportError(error, context)` is the single place every
server function/webhook/cron reports a failure — it always logs to console AND inserts
a row into the `incidents` table (visible at `/admin/incidents`). When
`context.severity === "critical"`, it ALSO calls `src/lib/alerts.ts`'s `sendOpsAlert()`,
which emails `OPS_ALERT_EMAIL` directly via Resend (bypassing the transactional-email
queue on purpose — an alert about the system being broken can't depend on the same
queue/cron it might be alerting about). Self-rate-limited: repeat failures on the same
`endpoint` within 15 minutes are deduped to one email, but a different endpoint failing
still alerts immediately. No-ops silently if `OPS_ALERT_EMAIL` isn't set. Currently wired
to "critical" on: both payment webhook handlers' catch blocks, both cron jobs (fx-sync,
email-queue) on failure, account deletion, order fulfillment. A "Send test alert" button
on `/admin/incidents` lets this be self-verified anytime (e.g. after rotating the Resend
key) without needing to fake a webhook signature.

---

## 8. Payment Flow

### Turnstile on checkout FAILS OPEN (2026-08-18)

`CHECKOUT_FAILS_OPEN = true` in `checkout.functions.ts`. All three entry points
(`initializeCheckout`, `initializeStripeCheckout`, `initializeSubscription`) treat
Turnstile as a **signal**: a failed or missing token logs a **critical** incident,
stamps `orders.metadata.turnstile = "unverified:<reason>"`, and lets the buyer through.

Why: a blocked checkout is a certain lost sale (two real named buyers were refused
before this changed — see `Learnings.md` 2026-08-18). What a hard gate prevents is a bot
creating one pending-order row and one provider init call — no credits spent, no email,
no file served, and no money moves without a real card on the provider's hosted page.
Cloudflare's WAF is already in front of the Worker.

Endpoints that spend something on an attacker's behalf still fail CLOSED:
`generateHooks` (Anthropic credits), `buildOffer`, `/contact`, `/apply`.

The client half matters too: with the submit button gated on a token, a widget that
cannot run means the request never reaches the server and this policy never applies. So
`TurnstileGate` takes `unavailablePolicy` — `"allow"` (the 5 checkout gates) emits a
`TURNSTILE_WIDGET_UNAVAILABLE` sentinel so the button works; `"block"` (default) keeps
the button disabled. **The sentinel is not a bypass** — siteverify rejects it like any
bad token, so fail-closed endpoints still refuse it. An 8s watchdog covers the case with
no callback at all (script blocked by an ad blocker/proxy).

Flip `CHECKOUT_FAILS_OPEN` to false to restore hard-failing. It is one line, and a
deliberate decision.

### Paystack (ZAR)
```
Buy now / Cart checkout → initializeCheckout(productSlug, bumpSlugs?, email, turnstileToken)
  → verify Turnstile → load product(s) → check requires_application gate if set
  → insert orders + order_items (pending) → upsert subscribers (abandoned-cart capture)
  → POST Paystack /transaction/initialize → redirect to hosted Paystack page
Paystack → POST /api/public/paystack-webhook (charge.success)
  → verify x-paystack-signature HMAC → order-fulfillment.ts: mark order paid,
    insert payments row, insert product_grants, send receipt email
Client → /checkout/success → verifyCheckout(reference) polls for the signed download URL
```

### Stripe (USD/international)
Same shape via `initializeStripeCheckout` → Stripe Checkout Session → 
`/api/public/stripe-webhook` (`checkout.session.completed`, `stripe-signature` verified)
→ same `order-fulfillment.ts` path.

### Free products
`claimFreeProduct` — NOT part of the checkout/order pipeline at all. No Turnstile, no
order row — straight to subscriber upsert + MailerLite tag + a 7-day signed Supabase
Storage URL, shown in-page and emailed. Free products never appear in the cart (no
"Add to Cart" button renders for `is_free` products in the grid, quick view, or full
product page) — there's nothing for a cart line to represent.

### Recurring (Paystack Plans)
`SUBSCRIPTION_PLANS` in `checkout.functions.ts` maps specific slugs
(`called-expert-inner-circle`, `contentpreneur-community`) to real Paystack plan
codes — `initializeSubscription` charges the plan; the same `charge.success` webhook
grants access on the first charge.

### 1-click upsell
`chargeUpsell` — charges a Paystack `authorization_code` on file (saved during a prior
checkout, if `reusable`), no redirect needed.

---

## 9. Pricing & Currency

- Every ZAR product's `price_cents` IS what Paystack actually charges.
- `USD_DISPLAY` (`src/lib/gardens.ts`) is a marketing-price override map: for listed
  slugs, the international/USD price shown is fixed, and the daily `sync-fx` cron
  rewrites that slug's `price_cents` every day so the ZAR charge tracks the fixed USD
  price at the live rate. Any ZAR product NOT in this map is shown converted at the
  static `ZAR_PER_USD` fallback constant instead.
- **Price-lock convention**: removing a slug from `USD_DISPLAY` permanently excludes it
  from the daily FX rewrite — this is how a founder-set manual price gets "locked."
  7 slugs are currently locked this way (see the dated comment in `gardens.ts`) per an
  explicit founder instruction that manually-set prices/mockups are not to be touched by
  automation going forward.
- The header's manual currency switcher (§6) lets a shopper override geo-detection for
  both display and payment rail — separate mechanism from the marketing-price system
  above, and does not affect what a locked product's ZAR charge actually is.
- **`formatPrice()` needs BOTH `slug` and `country`, and fails quietly without them.**
  Dropping `slug` skips the `USD_DISPLAY` marketing price; dropping `country` never
  takes the ZA branch. `/foundation` was calling it with neither and rendered **"$94"**
  — R1,565.03 mechanically divided by `ZAR_PER_USD` — to every visitor, South Africans
  included, who were then charged in rand. Fixed 2026-08-18. Any new call site passes
  all five arguments.

---

## 10. Email Infrastructure

### Transactional (Resend)
```
Trigger (signup, magic-link, order paid, tool result requested, etc.)
  → enqueue_email() RPC → pgmq queue (auth_emails, high priority, 15-min TTL,
     OR transactional_emails, 60-min TTL)
  → drained every minute by the Cloudflare cron (in-process — a Worker can't
     reliably fetch its own public hostname) → Resend API → notify.chkplt.com
```
Templates in `src/lib/email-templates/`: `magic-link`, `signup`, `email-change`,
`recovery`, `reauthentication`, `invite`, `order-receipt`, `rate-card-result`,
`media-kit-result` — the latter two share the Amber/Slate `theme.ts` token set (distinct
from `order-receipt`'s Heritage Gold look).

### Marketing (MailerLite)
Separate system — subscriber upserts (checkout intent, free-lead-magnet claims, tool
captures) tag/group the contact via `src/lib/mailerlite.ts`; sequences and broadcasts
are configured in MailerLite itself, not in this codebase. See `docs/EMAIL.md`.

---

## 11. Deployment

```bash
# Local dev
npm install               # (bun is the documented package manager; both lockfiles
npm run dev                # currently exist in the repo — confirm which before assuming)

# Before every deploy
npx tsc --noEmit -p tsconfig.json     # type-check clean
npx vite build                        # also regenerates src/routeTree.gen.ts —
                                       # commit this file, TanStack Router codegen output

# Database changes
npx supabase db push       # applies any new files in supabase/migrations/

# Ship it
npx wrangler deploy        # deploys the Worker AND uploads static assets;
                            # completely independent of `git push` — a deploy can go
                            # live while GitHub is stale, so always push separately
git push origin main
```

Cloudflare Worker secrets (one-time / on rotation): `bunx wrangler secret put <NAME>`
for every server-only value in `.env.example`.

---

## 12. How to Duplicate This From Scratch

1. **Supabase**: create a project. Run every file in `supabase/migrations/` in order
   (`npx supabase db push` against the new project, or `supabase link` first). This
   recreates the full schema, RLS policies, pgmq queues, and RPCs.
2. **Cloudflare**: create the Worker (`wrangler.jsonc` already defines its name,
   compatibility date, cron triggers). Add the domain(s) as Cloudflare zones, wire the
   `routes` array in `wrangler.jsonc` to match your domain(s) (or delete the
   `contentpreneur.africa/*` entries entirely if you only need one domain).
3. **Payment providers**: create live Paystack + Stripe accounts, set their secret/public
   keys as Worker secrets, and point each provider's webhook config at
   `https://<your-domain>/api/public/paystack-webhook` and `.../stripe-webhook`.
4. **Turnstile**: add a site in the Cloudflare dashboard, set the site/secret keys.
5. **Resend**: add and DNS-verify a sending subdomain (e.g. `notify.yourdomain.com`),
   set `RESEND_API_KEY`, and register the same `SUPABASE_AUTH_HOOK_SECRET` in both the
   Worker secrets AND Supabase Dashboard → Auth → Hooks → Send Email.
6. **MailerLite**: create groups matching each `MAILERLITE_GROUP_ID_*` var, set the API key.
7. **Env vars**: copy `.env.example` → `.env`, fill every value, and mirror every
   server-only one into Worker secrets.
8. **Build & deploy**: `npm install` → `npx vite build` → `npx wrangler deploy`.
9. **Seed products**: either use `/admin/products` to add real products, or write a
   migration (see any file in `supabase/migrations/` for the `insert into products (...)
   on conflict (slug) do update ...` pattern already used throughout this repo).
10. **DNS**: point the domain's `CNAME`/`A` records at Cloudflare per the zone's
    standard onboarding, and add MX/DKIM/SPF records Resend provides for the email
    subdomain.

---

## 13. Known Gaps / Flagged Items (keep current — remove once resolved)

- **Two manual dashboard steps are REQUIRED before the Phase 3 domain move works**
  (code is deployed, these are config outside the repo):
  1. **Supabase → Authentication → URL Configuration.** Add
     `https://contentpreneur.africa/**` to Redirect URLs. Post-purchase magic links
     and `/login` now target that host; until it is allowlisted, Supabase refuses the
     redirect and a paying buyer cannot sign in. (Magic-link tokens arrive in the URL
     *fragment*, which a 301 strips — that is why the link is generated on the
     destination domain rather than relying on the chkplt.com redirect.)
  *(As of 2026-08-18 step 2 no longer blocks CHECKOUT — those three endpoints fail open,
  see §8. It still blocks `/apply`, `/login`, `/signup` and the AI tools, which fail
  closed by design.)*
  2. **Cloudflare → Turnstile → the widget used by `TURNSTILE_SITE_KEY`.** Add
     `contentpreneur.africa` to its allowed hostnames. This is not optional and it
     is not only about the new routes: the founder reported 2026-08-18 that the
     Turnstile widget on the **Accelerator application** (`/apply`, served on
     contentpreneur.africa since Phase 2A) does not work. A widget on a hostname
     that is not on its allow-list returns error **110200** and never issues a
     token, and every form in this app disables its submit button until a token
     arrives — so `/apply`, `/foundation`, `/login` and `/signup` are all
     unsubmittable on that domain until this field is set. `TurnstileGate` now
     renders the error code and a retry instead of failing silently, so the
     diagnosis is visible on the page itself.
- **~45% of Creator Bundle leads never receive the bundle.** `CREATOR BUNDLE LEADS` has
  23 active and **19 unconfirmed**. `/creator-bundle` is a MailerLite embedded form
  (slug `BPvaab`) and delivery is entirely MailerLite's — so double opt-in is a hard
  gate: no confirmation click means the "Creator Bundle Welcome" automation never fires
  and the lead gets nothing, ever. `StarterKit Leads` is 7 active / 4 unconfirmed.
  Not fixable in this repo, and NOT to be flipped unilaterally — double opt-in is a
  consent/deliverability decision. Needs a founder call: turn it off for the magnet
  forms, or fix why the confirmation email isn't being clicked.
- **A MailerLite group ID in the Cloudflare env is dead.** `addToMailerLiteGroup` 422s on
  group `190855179540628547` ("The selected groups.0 is invalid") — confirmed
  non-existent via the MailerLite API. It is `MAILERLITE_GROUP_ID_CALLED_EXPERT` or
  `MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT`; almost certainly the former, since no
  group of that name exists in the account. Used by BOTH `offer-builder.functions.ts`
  and `apply.functions.ts`, so qualified Accelerator applicants are not being synced.
  Leads are still safe — they are written to `subscribers` before the ESP call — but
  they never enter a nurture sequence. **Founder must re-point the env var.** Live group
  IDs: CHKPLT BUYERS `190855383448815273` · Knowledge Audit `190855293404448728` ·
  StarterKit Leads `194182161960535616` · CREATOR BUNDLE LEADS `190074355106973432`.
- `MAILERLITE_GROUP_ID_BUYERS` points at a group literally *named*
  `"MAILERLITE_GROUP_ID_BUYERS"` (`193225326306788715`, 7 subs) while the real
  `CHKPLT BUYERS` group has 1. Flagged 2026-08-13, still open — needs a founder decision
  on merging before re-pointing.
- **Turnstile is still UI-only on `/login` and `/signup`.** Both render the widget and
  gate their submit button on a token, but authentication goes straight to Supabase —
  nothing ever calls `verifyTurnstile`. Closing this means enabling Supabase's own
  CAPTCHA protection (dashboard setting + the same secret), not app code.
- **`starterkit.functions.ts` and `media-kit.functions.ts` have no Turnstile at all** —
  public email-capture endpoints with no bot protection and no widget on the page. A
  free lead magnet is a list-poisoning target; adding a challenge to it is a conversion
  trade-off, so it is flagged rather than changed.
- `sendOpsAlert` only emails on `severity: "critical"` — 7 of ~30 `reportError` call
  sites. Everything else lands in `incidents` silently and is only ever seen if someone
  opens `/admin/incidents`. Deliberate (see the comment in `error-logger.ts`), but it
  means a high-volume "error" like a failing checkout guard can run for weeks unnoticed.
- The `/apply` diagnostic emails (`src/lib/apply.functions.ts`) still render as CHKPLT
  — brand bar, sign-off, footer — even though `/apply` is served on
  contentpreneur.africa and both their CTAs now point there. Links are correct;
  the branding is a founder copy decision, not a code one.
- The Foundation Kit's order bump (`called-expert-foundation-kit-bonus`, R290.42, live
  and published) is not offered anywhere in the funnel — `/foundation`'s `BuyForm`
  never passes `bumpSlugs`. A published product with no surface to buy it from.
- Cart checkout is capped at 4 paid items per order (1 main + 3 bumps) — it reuses the
  order-bump mechanism rather than a rebuilt multi-item checkout backend. Fine for a
  digital-info-product catalog; would need real schema work for a larger per-order
  item count.
- A live, unrotated GitHub PAT exists in `git remote -v` output for this and sibling
  repos — flagged to the founder, left as-is on explicit instruction ("not now, just
  flag it"). Never print the value in any output.
- External `product-lab/web-tools/invoice-generator` (separate Vercel project, not
  part of this repo) — the email-fix code IS now deployed (confirmed via `vercel --prod`
  and a live curl test 2026-07-29), but that Vercel project's `ZOHO_EMAIL`/
  `ZOHO_APP_PASSWORD` env vars are genuinely not set (confirmed: the endpoint returns a
  clear "Email service not configured" error). The sibling `rate-card-calculator`
  project already has working Zoho credentials set — reusing them requires handling a
  decrypted secret value, which is correctly outside what an AI session should do
  unsupervised; needs the founder to copy those 2 values across in the Vercel dashboard.
- `product-lab/web-tools/hooks-generator`'s `ANTHROPIC_API_KEY` (a different Vercel
  project/Anthropic account than CHKPLT's own) has zero credit balance — confirmed via a
  live API error, not a guess. The code itself is fine (and was improved to surface this
  error instead of swallowing it) — needs the founder to add billing on that Anthropic
  account. CHKPLT's OWN AI hook generator (`/hook-generator`, native) is unaffected —
  it uses CHKPLT's own separately-funded `ANTHROPIC_API_KEY` Cloudflare secret.
- `script-henna-tau.vercel.app` (a 5-platform viral script generator, Vercel project
  name "script") has no source repo anywhere in `~/Desktop/VS code/` — confirmed via a
  full-tree search. Its reported "credit issues" can't be fixed until the founder
  provides the repo/access, same as was needed for the CreatorKit tools below.
- CreatorKit (`github.com/chiefmuhanelwa-create/Sales-Copy`, contentprenuership.com) is
  a real, separate Next.js/Prisma/Neon/Paystack/SendGrid SaaS the founder also owns —
  its tax/finance tools (provisional/business tax calculators, expense tracker,
  checklist, email generator) are candidates to re-implement natively in CHKPLT, but
  that's a different stack with no direct code-share — not yet started (sequenced
  as a later phase in the Tools Hub build).
- `dashboard.inner-circle.tsx` hardcodes "$39/mo" in its copy while
  `USD_DISPLAY["called-expert-inner-circle"]` is `2900` ($29/mo) — a real drift, not yet
  resolved because the actual intended price isn't derivable from code (needs a
  founder/ops decision on which number is correct against the live Paystack plan).
- Full Shopify catalog migration (Phase 2D of the retirement plan) and the actual
  Shopify subscription cancellation (Phase 2E) are not done — see
  `docs/RUNBOOK-CREATORS-HUB-IMPORT.md` and the plan file referenced in session history
  for the remaining scope.
