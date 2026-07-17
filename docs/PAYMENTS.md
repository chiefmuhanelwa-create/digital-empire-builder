# CHKPLT — Payments & Go-Live Runbook

> Dual-rail, LIVE as of 2026-07-17: **Paystack** (ZAR, SA/Africa) + **Stripe** (USD, international).
> Both rails share ONE fulfillment path so access + receipts are identical.

---

## 1. Architecture

```
Buyer at checkout (homepage modal or /products/$slug)
        │  useCountry()  →  shouldUseStripe(country)   [src/lib/currency.tsx]
        │  African country → Paystack (ZAR) ; else → Stripe (USD) ; unknown → Paystack
        ▼
  initializeCheckout            initializeStripeCheckout        [src/lib/checkout.functions.ts]
  (Paystack, ZAR cents)         (Stripe Checkout Session, USD cents)
        │  creates pending order (orders.provider = 'paystack' | 'stripe') + order_items
        ▼                                   ▼
  Paystack hosted page          Stripe hosted Checkout
        │                                   │
        ▼                                   ▼
  /api/public/paystack-webhook   /api/public/stripe-webhook
   verify x-paystack-signature    verify stripe-signature (constructEventAsync + SubtleCrypto)
   (HMAC sha512)                  event: checkout.session.completed
        │                                   │
        │  atomic order claim (status→paid, .neq('paid'))  ← idempotency guard
        ▼                                   ▼
        └──────────────►  fulfillPaidOrder(order)  ◄──────────  [src/lib/order-fulfillment.ts]
                          • upsert subscriber + tags (buyer, garden)
                          • provision login account (ensureBuyerUserId)
                          • create product_grants (access)
                          • audit_ledgers row (VAT 15% + SARS reserve 25%)
                          • enqueue order-receipt email
                          • MailerLite buyers sync
        │
        ▼
  Stripe/Paystack redirect → /checkout/success?reference=…  → verifyCheckout() polls order
```

**Why it's safe:** `orders.provider` is a plain `text` column, so `'stripe'` needs no migration. The atomic claim (`.neq('status','paid')`) means retries/duplicate webhook deliveries can't double-grant or double-email. Receipts are additionally deduped by a unique `email_send_log.message_id`.

---

## 2. Pricing model

- **Display is USD everywhere** (`USD_DISPLAY` map + `formatPrice` in `src/lib/gardens.ts`).
- **Paystack charges ZAR.** `price_cents` is ZAR; the daily `sync-fx` cron (`10 4 * * *`) rewrites it so the ZAR charge tracks the fixed USD price.
- **Stripe charges USD.** `resolveUsdCents()` in `checkout.functions.ts` returns the clean USD price (matches the displayed `$` amount): `USD_DISPLAY[slug]` → native USD → ZAR÷rate.

---

## 3. Required secrets (Cloudflare Worker)

Set with `bunx wrangler secret put <NAME>`. **`.env` is local-dev only — it does NOT deploy.**

| Secret | Purpose | Status |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | Paystack charges + webhook HMAC | ✅ live (`sk_live_…`) |
| `STRIPE_SECRET_KEY` | Stripe Checkout Sessions | ✅ live (`sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook (`whsec_…`) | ✅ set |
| `SUPABASE_SERVICE_ROLE_KEY` | Fulfillment writes (grants, accounts) | ✅ set |
| `RESEND_API_KEY` | Send receipt + auth emails | ✅ set |
| `TURNSTILE_SECRET_KEY` / `TURNSTILE_SITE_KEY` | CAPTCHA on checkout/forms | ✅ set |
| `MAILERLITE_API_KEY` | List sync (buyers/leads) | ✅ set |
| `MAILERLITE_GROUP_ID_BUYERS` / `_ALIGNED` / `_CALLED_EXPERT` / `_FREE_KNOWLEDGE_AUDIT` | Target groups | ✅ set |

> Webhook health check: `curl -X POST https://chkplt.com/api/public/{paystack,stripe}-webhook` → **401** (signature required) means the secret is loaded. **503** means the secret is missing.

---

## 4. Dashboard setup (must be done in the provider dashboards)

### Paystack (LIVE mode)
1. Settings → API Keys & Webhooks → **Webhook URL**: `https://chkplt.com/api/public/paystack-webhook`
2. Ensure you're on **live** keys (test/live webhooks are configured separately).

### Stripe
1. Complete **account activation** (business profile + bank account) — live charges are rejected otherwise.
2. Developers → **Webhooks → Add endpoint**: `https://chkplt.com/api/public/stripe-webhook`
3. Events: **`checkout.session.completed`** and **`charge.refunded`**
4. Copy the **Signing secret** (`whsec_…`) → `bunx wrangler secret put STRIPE_WEBHOOK_SECRET`

---

## 5. Email delivery (receipts)

- Sender: `noreply@notify.chkplt.com` — **Resend-verified** (DKIM `resend._domainkey.notify.chkplt.com` + SPF on `send.notify.chkplt.com`).
- Receipt is **enqueued** by `fulfillPaidOrder`, then the **every-minute cron** (`* * * * *`, `src/server.ts` → `drainEmailQueues`) sends it via Resend.
- Idempotent (unique `message_id`), DLQ + retry + rate-limit backoff (`src/lib/email-queue.ts`).
- Receipt line items come from `order_items.product_title` (copied from `products.title` at checkout) — so product titles must be correct in the DB.

---

## 6. Go-live checklist

- [ ] `PAYSTACK_SECRET_KEY` is the **live** key → webhook returns 401
- [ ] Paystack **live** webhook URL registered
- [ ] Stripe account **activated** for live charges
- [ ] `STRIPE_SECRET_KEY` live + `STRIPE_WEBHOOK_SECRET` from the real endpoint → webhook returns 401
- [ ] Product titles in DB say **Contentpreneur** (migration `20260717120000`)
- [ ] MailerLite group IDs point to the **intended** groups (not placeholders)
- [ ] **One real low-value test purchase per rail** — confirm: access granted, receipt received, buyer in MailerLite, ledger row written
- [ ] Stripe test done from a **non-African IP** (routing sends only non-African buyers to Stripe)

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Webhook POST → 503 | secret missing/empty at runtime | `wrangler secret put` the missing one |
| Webhook POST → 401 (unsigned) | healthy — signature required | none |
| Paid but no access | webhook not firing | check provider dashboard webhook logs; confirm URL + signing secret |
| No receipt | queue not draining | check `email_send_log` status; cron runs every minute |
| Receipt says wrong product name | `products.title` stale | apply the title migration / update via admin |
| International buyer sees ZAR | country undetected → Paystack default | expected; buyer can complete in ZAR or retry with detected country |

---

## 8. Key files

```
src/lib/checkout.functions.ts        initializeCheckout (Paystack) · initializeStripeCheckout · verifyCheckout · chargeUpsell · initializeSubscription
src/lib/order-fulfillment.ts         fulfillPaidOrder — shared post-payment path (both rails)
src/routes/api/public/paystack-webhook.ts   HMAC verify → claim → fulfill (+ Paystack subscriptions, card-auth capture)
src/routes/api/public/stripe-webhook.ts     Stripe sig verify → claim → fulfill (+ refunds)
src/lib/currency.tsx                 useCountry · shouldUseStripe · PAYSTACK_COUNTRIES
src/lib/gardens.ts                   USD_DISPLAY · formatPrice · ZAR_PER_USD
src/lib/email-queue.ts               drainEmailQueues (Resend sender)
```
