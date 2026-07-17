# CHKPLT — Architecture Reference

> Stack: TanStack Start v1 + React 19 + Vite 7 | Cloudflare Workers | Supabase | Paystack + Stripe

---

## Stack Overview

```
┌─────────────────────────────────────────────────────┐
│                 CHKPLT Platform                      │
│  TanStack Start v1 (SSR) + React 19 + Vite 7        │
├─────────────────────────────────────────────────────┤
│  Hosting: Cloudflare Workers (wrangler.jsonc)        │
│  Package manager: Bun                               │
│  Language: TypeScript 5.8 (strict mode)              │
├──────────────────────┬──────────────────────────────┤
│  Database            │  Auth                         │
│  Supabase PostgreSQL │  Supabase magic-link          │
│  14 tables + RLS     │  + password login             │
│  22 migrations       │  First user = admin           │
├──────────────────────┼──────────────────────────────┤
│  Payments (ZAR)      │  Payments (Global)            │
│  Paystack            │  Stripe                       │
│  SA/Africa market    │  USD/GBP/EUR/AUD              │
│  ZAR-native          │  135+ currencies              │
├──────────────────────┼──────────────────────────────┤
│  Email (Transact.)   │  Email (Marketing)            │
│  Lovable Cloud       │  MailerLite                   │
│  pgmq queue          │  Sequences + Segments         │
│  React-Email temps   │  Broadcasts                   │
├──────────────────────┼──────────────────────────────┤
│  CAPTCHA             │  UI Components                │
│  Cloudflare          │  Radix UI + shadcn/ui         │
│  Turnstile           │  40+ pre-built components     │
│                      │  TailwindCSS 4                │
└──────────────────────┴──────────────────────────────┘
```

---

## Routing Map (TanStack File-Based)

All routes live in `src/routes/`. The file name = the URL path.

### Public Routes (no auth required)
| Route | File | Purpose |
|-------|------|---------|
| `/` | `index.tsx` | Landing page — John 21 story, mission, 7-stage transformation |
| `/apply` | `apply.tsx` | 23-point Contentpreneur qualification diagnostic |
| `/login` | `login.tsx` | Magic-link + password login |
| `/signup` | `signup.tsx` | Account creation |
| `/products` | `products.index.tsx` | Published product catalog |
| `/products/$slug` | `products.$slug.tsx` | Single product detail + checkout CTA |
| `/products/garden/$garden` | `products.garden.$garden.tsx` | Filter by category |
| `/niche-clarity` | `niche-clarity.tsx` | Free lead magnet tool |
| `/checkout/success` | `checkout.success.tsx` | Post-payment landing |
| `/about` | `about.tsx` | Ndivhuwo's story |
| `/contact` | `contact.tsx` | Contact form (Turnstile-protected) |
| `/terms` | `terms.tsx` | Terms of service |
| `/privacy` | `privacy.tsx` | Privacy policy |
| `/refund-policy` | `refund-policy.tsx` | Refund terms |

### Authenticated Routes (`_authenticated/` prefix)
| Route | File | Purpose |
|-------|------|---------|
| `/dashboard` | `_authenticated/dashboard.tsx` | Student progress + next steps |
| `/account` | `_authenticated/account.tsx` | Profile settings + password |
| `/learn` | `_authenticated/learn.tsx` | My courses list |
| `/learn/$slug` | `_authenticated/learn.$slug.tsx` | Course modules |
| `/learn/$slug/$lessonSlug` | `_authenticated/learn.$slug.$lessonSlug.tsx` | Single lesson |

### Admin Routes (admin role required)
| Route | Purpose |
|-------|---------|
| `/admin/products` | Manage product catalog (CRUD + status toggle) |
| `/admin/curriculum/$productSlug` | Build course modules + lessons |
| `/admin/contacts` | View and manage contacts + leads |
| `/admin/import-contacts` | CSV import for contacts |
| `/admin/ledger` | Transaction audit log |
| `/admin/incidents` | Error + incident log |

### Webhook Routes (no auth — HMAC-validated)
| Route | Purpose |
|-------|---------|
| `/api/public/paystack-webhook` | Paystack payment events (`charge.success`) |
| `/api/public/stripe-webhook` | Stripe payment events (`checkout.session.completed`) — **NOT YET BUILT** |

---

## Authentication Flow

```
1. User visits /login or /signup
2. Turnstile CAPTCHA validates (bot protection)
3. Supabase sends magic-link to email (requires notify.chkplt.com DNS verified)
4. User clicks link → Supabase session created
5. Auth context (src/lib/auth-context.tsx) stores session
6. Auth middleware (src/integrations/supabase/auth-middleware.ts) injects context
7. Protected routes check session; /admin/* also checks has_role(user_id, 'admin') RPC
8. First user registered → DB trigger auto-assigns 'admin' role in user_roles table
```

---

## Database Schema (14 Tables)

### Core Identity
```sql
profiles (id PK, email, full_name, avatar_url, created_at, updated_at)
user_roles (id PK, user_id FK→auth.users, role app_role, created_at)
```
- `app_role` enum: `admin | student`
- First registered user gets admin role via `handle_new_user()` DB trigger

### Product Catalog
```sql
products (
  id PK, slug UNIQUE, title, tagline, description, long_description,
  benefits TEXT[], format, target_audience,
  garden garden_enum,           -- deshe | esev | etz_pri | devarim
  price_cents INT,              -- ZAR price in cents (e.g., 1800000 = R18,000)
  -- price_usd_cents INT,       -- TODO: add for Stripe/international (migration needed)
  currency TEXT DEFAULT 'ZAR',
  is_free BOOL DEFAULT false,
  requires_application BOOL DEFAULT false,
  cover_image_url TEXT,
  download_path TEXT,           -- Supabase Storage path for PDF
  status product_status,        -- draft | published | archived
  sort_order INT,
  created_at, updated_at
)
```

### Orders & Payments
```sql
orders (
  id PK, user_id FK→auth.users, email, customer_name, customer_phone,
  currency, subtotal_cents, total_cents,
  -- tax_reserve_cents INT,     -- TODO: ROUND(total_cents * 0.25) for SARS (migration needed)
  status order_status,          -- pending | paid | failed | refunded | cancelled
  provider TEXT,                -- 'paystack' | 'stripe' (migration needed for 'stripe')
  provider_reference TEXT,      -- Paystack reference or Stripe session ID
  metadata JSONB,
  created_at, updated_at
)

order_items (
  id PK, order_id FK→orders, product_id FK→products,
  product_title, unit_price_cents, quantity, line_total_cents, created_at
)

payments (
  id PK, order_id FK→orders, provider, provider_reference,
  event_type, status payment_status,  -- initialized | success | failed | abandoned | reversed
  amount_cents, currency,
  gateway_response TEXT, raw_payload JSONB,
  paid_at, created_at
)
```

### LMS (Learning Management)
```sql
product_grants (id PK, user_id FK, product_id FK, granted_at, created_at)
-- If row exists: user has access to the course/download

lms_modules (id PK, product_id FK, slug, title, description, content, sort_order, created_at, updated_at)
lms_lessons (id PK, module_id FK, slug, title, content TEXT, sort_order, created_at, updated_at)
lms_lesson_progress (id PK, user_id FK, lesson_id FK, completed_at, created_at)
```

### Lead Qualification
```sql
client_stewardship_applications (
  id PK, email, full_name,
  [23 numeric/enum fields for diagnostic answers],
  determined_routing_status TEXT,  -- 'QUALIFIED_FOR_CORE_PROGRAM' | other statuses
  created_at
)
```

### Email Infrastructure
```sql
email_send_log (
  id PK, message_id, template_name, recipient_email,
  status email_log_status,  -- pending | sent | suppressed | failed | bounced | complained | dlq
  error_message, metadata JSONB, created_at
)

email_send_state (id PK, retry_after_until, batch_size, send_delay_ms, updated_at)
-- Singleton row — rate limit config for email queue
```

### pgmq Queues (4)
- `auth_emails` — High priority (magic links, 15-min TTL)
- `transactional_emails` — Normal priority (order receipts, 60-min TTL)
- `auth_emails_dlq` — Dead letter queue
- `transactional_emails_dlq` — Dead letter queue

### Row-Level Security (RLS)
- All tables have RLS enabled
- Admins (via `has_role()` RPC) can manage all data
- Students can view own orders, order_items, product_grants, lms_lesson_progress
- Published products are public; drafts/archived are admin-only
- Webhooks use service role key (bypasses RLS)

---

## Email Infrastructure

### Transactional (Lovable Cloud)
```
User action → DB event → pgmq queue → Lovable Cloud API → notify.chkplt.com → inbox
```
7 templates in `src/lib/email-templates/`:
- `magic-link.tsx` — Auth login link
- `signup.tsx` — Welcome + account confirmation
- `email-change.tsx` — Email update confirmation
- `recovery.tsx` — Password reset
- `reauthentication.tsx` — Re-auth challenge
- `invite.tsx` — Invite a user
- `order-receipt.tsx` — Post-purchase confirmation

**CRITICAL:** `notify.chkplt.com` must be DNS-verified in Lovable Cloud. Currently drifted — all transactional email is broken until re-verified.

### Marketing (MailerLite)
- Trigger: Supabase webhook or API call on key events (purchase, opt-in, tag assignment)
- Segments: Per free product tag + buyers group + called-expert-potential
- 7-email welcome sequence: Days 1–13 (2-day intervals)
- See `docs/EMAIL.md` for full sequence outline

---

## Payment Flow

### Paystack (ZAR)
```
1. Client → initializeCheckout(productSlug, turnstileToken)
2. Server: validate Turnstile → fetch product → create orders row → POST Paystack /transaction/initialize
3. Client redirected to Paystack hosted page
4. Paystack → POST /api/public/paystack-webhook (charge.success)
5. Server: verify x-paystack-signature HMAC → update orders.status = 'paid'
          → insert payments row → insert product_grants row
6. Client → /checkout/success → PDF download + LMS access
```

### Stripe (USD/GBP/EUR — NOT YET BUILT)
```
1. Client → initializeStripeCheckout(productSlug, currency, turnstileToken)
2. Server: validate Turnstile → fetch product → create orders row → POST Stripe /checkout/sessions
3. Client redirected to Stripe hosted checkout
4. Stripe → POST /api/public/stripe-webhook (checkout.session.completed)
5. Server: verify stripe-signature (STRIPE_WEBHOOK_SECRET) → same fulfillment as Paystack
```

---

## Key Files Reference

```
Project root
├── ACTIVATE.md           → Setup + deployment guide (existing, do not modify)
├── CLAUDE.md             → Claude's operating instructions
├── WAT.md                → Workflows / Agent / Tools operating manual
├── Learnings.md          → Living record of discoveries + decisions
├── .env.example          → Environment variable template (including Stripe)
│
src/
├── routes/               → All routes (TanStack file-based)
│   ├── __root.tsx        → Root layout + error boundaries
│   ├── index.tsx         → Landing page
│   ├── apply.tsx         → 23-point qualification wizard
│   ├── _authenticated/   → Auth-protected routes
│   └── api/public/       → Webhook routes
├── lib/
│   ├── products.functions.ts
│   ├── checkout.functions.ts     → Paystack only currently
│   ├── lms.functions.ts
│   ├── apply.functions.ts
│   ├── qualification.functions.ts
│   ├── contacts.functions.ts
│   ├── account.functions.ts
│   ├── email-templates/          → 7 React-Email templates
│   └── gardens.ts                → Product category enum
├── integrations/supabase/
│   ├── client.ts                 → Browser Supabase client
│   ├── client.server.ts          → Admin Supabase client (service role)
│   ├── auth-middleware.ts        → Server auth check
│   └── types.ts                  → Auto-generated Supabase types
├── utils/
│   └── evaluator.ts              → 23-point qualification algorithm
└── components/
    ├── site-header.tsx
    ├── FulfillmentStates.tsx     → Post-purchase download + LMS access
    ├── TurnstileGate.tsx         → CAPTCHA wrapper
    └── ui/                       → 40+ shadcn/ui components

supabase/
├── migrations/           → 22 SQL files (NEVER edit — always new file)
└── config.toml

wrangler.jsonc            → Cloudflare Workers config (entry: src/server.ts)
vite.config.ts            → Vite + TanStack + Cloudflare plugin
tsconfig.json             → TypeScript strict config
```
