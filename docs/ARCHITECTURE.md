# CHKPLT — Architecture & Replication Blueprint

> **Purpose of this file:** if chkplt.com had to be rebuilt from zero — same stack, same
> integrations, same data model — this document plus `.env.example` plus
> `supabase/migrations/*.sql` should be enough to do it. **Every session that changes a
> route, a table, an integration, a cron job, or the deploy process updates this file in
> the same session it makes the change.** It is not a one-time snapshot — treat drift
> here the same as an untested code path: not done until it's written down.
>
> Last verified against the live repo: 2026-07-29 (62 migrations, cart/quick-view/header
> rebuild just shipped).

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

Two live domains share this ONE Cloudflare Worker via path-specific routes (see §3):
- **chkplt.com** — the full platform (marketplace, dashboard, LMS, admin).
- **contentpreneur.africa** — a SEPARATE Next.js marketing site owns the homepage/`/about`,
  but `/starterkit`, `/foundation`, `/accelerator`, `/apply`, `/checkout*`, `/contact`,
  `/terms`, `/privacy`, `/refund-policy` are routed to THIS same Worker (Phase 2A/2C,
  2026-07-28) so those flagship funnels run on the proven CHKPLT backend without a
  separate checkout/auth/LMS rebuild.

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
| MailerLite | `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID_*` (one per lead magnet + a buyers group) | Marketing automation only — never used for transactional |
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
  "contentpreneur.africa/assets/*"             → this Worker (Vite static assets for the above)
  "contentpreneur.africa/downloads/*"          → this Worker
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

`src/server.ts` is the Worker entry: wraps the TanStack Start SSR handler, adds a
branded 500 page for h3-swallowed SSR errors, sets `Cache-Control: no-cache,
must-revalidate` on all HTML responses (fixed 2026-07-29 — without this, browsers
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
| Route | Purpose |
|---|---|
| `/dashboard`, `/account` | Member home, profile/password |
| `/dashboard/products/free`, `/dashboard/products/paid` | Owned-products views |
| `/dashboard/foundation-kit`, `/dashboard/inner-circle`, `/dashboard/community` | Program-specific member views |
| `/learn`, `/learn/$slug`, `/learn/$slug/$lessonSlug` | LMS — course list, modules, lessons |
| `/apps/*` (10 routes) | Interactive member tools — 4E calendar, DARES model, income tracker, niche-clarity builder, MS×TS×SS, PAIDS auditor, consistency blueprint, first-income planner, right-side diagnostic, seeds-pipeline |

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
| `turnstile.functions.ts` / `turnstile.server.ts` | Site-key fetch + server-side token verification |
| `geo.functions.ts` | `getViewerCountry` — reads Cloudflare's `CF-IPCountry` |
| `tool-ai.functions.ts` | AI-assisted tool logic (Anthropic SDK) for the free tools |

Shared libs (not server functions): `src/lib/gardens.ts` (garden enum + `formatPrice` +
`USD_DISPLAY` price-override map), `src/lib/fx-sync.ts` (cron job body),
`src/lib/email-queue.ts` (cron job body + Resend send logic), `src/lib/cart.tsx`,
`src/lib/currency.tsx`, `src/lib/mailerlite.ts`, `src/lib/order-fulfillment.ts` (the
shared "mark order paid → grant product → send receipt" path both webhooks call).

---

## 8. Payment Flow

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

- Cart checkout is capped at 4 paid items per order (1 main + 3 bumps) — it reuses the
  order-bump mechanism rather than a rebuilt multi-item checkout backend. Fine for a
  digital-info-product catalog; would need real schema work for a larger per-order
  item count.
- A live, unrotated GitHub PAT exists in `git remote -v` output for this and sibling
  repos — flagged to the founder, left as-is on explicit instruction ("not now, just
  flag it"). Never print the value in any output.
- External `product-lab/web-tools/invoice-generator` (separate Vercel project, not
  part of this repo) has a code fix committed/pushed but not deployed — that Vercel
  project isn't wired for GitHub-push-triggers-deploy; needs a manual trigger from the
  Vercel dashboard plus confirmation `ZOHO_EMAIL`/`ZOHO_APP_PASSWORD` env vars exist there.
- `dashboard.inner-circle.tsx` hardcodes "$39/mo" in its copy while
  `USD_DISPLAY["called-expert-inner-circle"]` is `2900` ($29/mo) — a real drift, not yet
  resolved because the actual intended price isn't derivable from code (needs a
  founder/ops decision on which number is correct against the live Paystack plan).
- Full Shopify catalog migration (Phase 2D of the retirement plan) and the actual
  Shopify subscription cancellation (Phase 2E) are not done — see
  `docs/RUNBOOK-CREATORS-HUB-IMPORT.md` and the plan file referenced in session history
  for the remaining scope.
