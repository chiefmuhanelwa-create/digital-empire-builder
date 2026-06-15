# CHKPLT — Payments Reference

> Dual-rail payment system: Paystack (ZAR, SA/Africa) + Stripe (USD/GBP/EUR, international)

---

## Architecture Overview

```
User at checkout
       │
       ▼
Is user in ZA/NG/GH/KE/UG/TZ/ZW/ZM/BW/MW?
(Cloudflare CF-IPCountry header)
       │
   YES │                   NO
       │                    │
       ▼                    ▼
  PAYSTACK              STRIPE
  ZAR pricing           USD pricing
  SA bank settlement    Global cards
  Local payment methods Stripe-hosted checkout
       │                    │
       └──────────┬─────────┘
                  │
                  ▼
         Order created in DB
         (orders table, provider = 'paystack' | 'stripe')
                  │
                  ▼
         Webhook fires on success
         (/api/public/paystack-webhook OR /api/public/stripe-webhook)
                  │
                  ▼
         HMAC signature verified
                  │
                  ▼
         orders.status = 'paid'
         payments row inserted
         product_grants row inserted (LMS access unlocked)
                  │
                  ▼
         /checkout/success
         (PDF download link + LMS access)
```

---

## Paystack (ZAR — Currently Active)

### Environment Variables
```
PAYSTACK_SECRET_KEY=sk_live_...       # Server-only (never expose to client)
PAYSTACK_WEBHOOK_SECRET=...           # For HMAC signature verification
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...  # Safe for client-side
```

### Checkout Flow (Existing — `src/lib/checkout.functions.ts`)

1. Client calls `initializeCheckout({ productSlug, turnstileToken })`
2. Server validates Cloudflare Turnstile token
3. Server fetches product from DB (must be status: published, price > 0)
4. Server creates `orders` row: `{ status: 'pending', provider: 'paystack', currency: 'ZAR' }`
5. Server creates `order_items` row linking product to order
6. Server POSTs to Paystack `/transaction/initialize`:
   ```json
   {
     "email": "user@example.com",
     "amount": 189700,    // in kobo (ZAR cents: R1,897 = 189700)
     "reference": "order_id",
     "callback_url": "https://chkplt.com/checkout/success"
   }
   ```
7. Paystack returns `authorization_url` — client redirects to Paystack hosted page
8. User completes payment on Paystack

### Webhook Handler (`/api/public/paystack-webhook`)

```typescript
// MUST verify HMAC before processing ANY event
const hash = createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
  .update(JSON.stringify(body))
  .digest('hex')

if (hash !== request.headers.get('x-paystack-signature')) {
  return new Response('Unauthorized', { status: 401 })
}

// Only process charge.success events
if (event.event !== 'charge.success') return Response.ok()

// Update order
await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)

// Record payment
await supabase.from('payments').insert({ status: 'success', ... })

// Grant product access
await supabase.from('product_grants').insert({ user_id, product_id })
```

### Key Paystack Notes
- Amount in KOBO (ZAR cents × 10). R1,000 = 100,000 kobo.
- Webhook URL must be set in Paystack Dashboard → Settings → Webhooks
- Webhook URL: `https://chkplt.com/api/public/paystack-webhook`
- Test keys: `sk_test_...` / `pk_test_...` (use for development)
- Live keys: `sk_live_...` / `pk_live_...` (production only)

---

## Stripe (International — NOT YET BUILT)

### Environment Variables
```
STRIPE_SECRET_KEY=sk_live_...               # Server-only
STRIPE_WEBHOOK_SECRET=whsec_...             # For webhook signature verification
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...     # Safe for client-side
```

### What Needs to Be Built

**Step 1 — Database Migrations**
```sql
-- Migration 1: Add 'stripe' to orders provider (currently only 'paystack')
ALTER TABLE orders 
  ALTER COLUMN provider TYPE TEXT;
-- Or add a proper CHECK constraint: CHECK (provider IN ('paystack', 'stripe'))

-- Migration 2: Add USD pricing to products
ALTER TABLE products 
  ADD COLUMN price_usd_cents INT DEFAULT NULL;

-- Migration 3: Add SARS reserve tracking to orders
ALTER TABLE orders
  ADD COLUMN tax_reserve_cents INT GENERATED ALWAYS AS (ROUND(total_cents * 0.25)) STORED;
```

**Step 2 — New Server Function (`src/lib/checkout-stripe.functions.ts`)**
```typescript
export async function initializeStripeCheckout({ productSlug, currency, turnstileToken }) {
  // 1. Validate Turnstile
  // 2. Fetch product + price_usd_cents
  // 3. Create orders row (provider: 'stripe')
  // 4. Create Stripe Checkout Session:
  //    POST https://api.stripe.com/v1/checkout/sessions
  //    { mode: 'payment', line_items: [...], success_url, cancel_url }
  // 5. Return session.url → client redirects
}
```

**Step 3 — New Webhook Route (`src/routes/api/public/stripe-webhook.ts`)**
```typescript
// MUST verify signature before processing
import Stripe from 'stripe'
const stripe = new Stripe(STRIPE_SECRET_KEY)

const event = stripe.webhooks.constructEvent(
  rawBody,
  request.headers.get('stripe-signature'),
  STRIPE_WEBHOOK_SECRET
)

if (event.type === 'checkout.session.completed') {
  const session = event.data.object
  // Same fulfillment as Paystack:
  // update order → insert payment → insert product_grants
}
```

**Step 4 — Checkout UI Update**
- Add currency/region picker (ZAR/Paystack vs USD/Stripe)
- Use Cloudflare `CF-IPCountry` header for auto-detection:
  ```
  Africa (ZA, NG, GH, KE, UG, TZ, ZW, ZM, BW, MW) → Paystack ZAR
  All other countries → Stripe USD (or user's local currency)
  ```

**Step 5 — Product Pricing**
- For each published product, set `price_usd_cents` in DB
- Suggested USD pricing (approximate at current rates):
  - R199 → $10 USD
  - R299 → $16 USD
  - R899 → $48 USD
  - R997 → $54 USD
  - R1,997 → $108 USD
  - R4,997 → $270 USD
  - R18,000 → $975 USD

### Stripe Webhook Setup
- Dashboard: Stripe → Developers → Webhooks → Add endpoint
- Endpoint URL: `https://chkplt.com/api/public/stripe-webhook`
- Events to listen for: `checkout.session.completed`, `payment_intent.payment_failed`
- Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET` in `.env`

---

## SARS 25% Tax Reserve (Critical — Not Yet Implemented)

Every ZAR and USD payment processed must earmark 25% for SARS obligations.

**Why:** Ndivhuwo paid R207,879.20 in SARS debt from undeclared income. This is the non-negotiable lesson from that experience.

**Implementation (pending migration):**
```sql
-- Add generated column to orders table
ALTER TABLE orders
  ADD COLUMN tax_reserve_cents INT 
  GENERATED ALWAYS AS (ROUND(total_cents * 0.25)) STORED;
```

**Monthly query for SARS reserve:**
```sql
SELECT 
  SUM(total_cents) / 100.0 AS total_revenue_zar,
  SUM(tax_reserve_cents) / 100.0 AS tax_reserve_zar,
  SUM(total_cents - tax_reserve_cents) / 100.0 AS available_income_zar
FROM orders 
WHERE status = 'paid' 
  AND created_at >= date_trunc('month', now());
```

**Monthly action:** Transfer exact `tax_reserve_zar` amount to designated SARS savings account before any other business expense.

---

## Fulfillment States

After successful payment (Paystack or Stripe), `/checkout/success` renders based on what the product has:

| Product has | Fulfillment state | UI shown |
|-------------|------------------|----------|
| `download_path` set | Download-only | "Download your product" button → Supabase Storage URL |
| LMS modules built | LMS-only | "Access your course" button → `/learn/$slug` |
| Both | LMS + download | Both buttons |
| Neither (blocker!) | Empty | Shows "Your access has been granted" with no actionable link |

**Current issue:** `contentpreneur-90day-cohort` and `contentpreneur-vip-tier` have neither — no download_path and 0 modules. Users who pay get a blank success page. This is the #2 blocker.

---

## Reconciliation (Monthly)

Run at the end of each month to verify DB matches payment provider dashboards:

```sql
-- Total paid orders by provider
SELECT 
  provider,
  COUNT(*) AS order_count,
  SUM(total_cents) / 100.0 AS total_revenue,
  SUM(tax_reserve_cents) / 100.0 AS sars_reserve
FROM orders 
WHERE status = 'paid'
  AND created_at >= date_trunc('month', now())
GROUP BY provider;

-- Check for stuck orders (pending > 24 hours)
SELECT id, email, total_cents, provider, created_at
FROM orders
WHERE status = 'pending' 
  AND created_at < now() - interval '24 hours';

-- Failed payments that need follow-up
SELECT o.email, o.total_cents, p.status, p.gateway_response, p.created_at
FROM payments p
JOIN orders o ON o.id = p.order_id
WHERE p.status = 'failed'
  AND p.created_at >= date_trunc('month', now());
```
