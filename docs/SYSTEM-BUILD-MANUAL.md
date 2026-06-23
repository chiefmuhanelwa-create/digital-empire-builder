# THE FUNNEL SYSTEM — BUILD MANUAL & RESALE BLUEPRINT

> The complete, duplicable blueprint for the CHKPLT digital-product funnel — so it can be **rebuilt from zero** and **sold as a service** ("Funnel-Building as a Service"). Everything here is what's actually running in production at chkplt.com.

Owner: NOCHILL PTY LTD · Stack owner-operable, generational by design (Proverbs 13:22).

---

## 1. WHAT THIS SYSTEM IS

A self-hosted, enterprise-grade digital-product funnel that runs end-to-end without manual work:

```
TRAFFIC (ads / bio / organic + UTM)
   ↓
LANDING PAGE  ─ geo-aware pricing ($ intl / R for SA) · proof · video
   ↓
CHECKOUT  ─ Paystack · + order bump (AOV lift) · lead captured BEFORE payment
   ↓
PAYMENT  ─ webhook (HMAC-verified) → grant access + tag buyer + capture card
   ↓
DELIVERY  ─ instant: receipt email + signed download(s) + LMS access
   ↓
POST-PURCHASE  ─ 1-click upsell (charge card-on-file) · success-page chains
   ↓
RETENTION  ─ welcome drip (D1/3/7) · abandoned-cart recovery · re-engagement
   ↓
ASCENSION LADDER  ─ $97 Kit → $29/mo Inner Circle → R18k Accelerator → R75k/yr Facilitator
```

It is **not** a no-code platform (GoHighLevel/Kajabi). It's a custom app you **own** — no per-seat fees, full control, resellable as an asset.

---

## 2. FEATURE INVENTORY (everything built)

| Area | What it does | Key files |
|---|---|---|
| **Landing / sales page** | Long-form VSL-style page, geo-priced, proof gallery, Meta-stage credibility, sticky mobile CTA | `src/routes/index.tsx` |
| **Product catalog + pages** | Per-product sales pages, collections by "garden" | `src/routes/products.*.tsx` |
| **Checkout** | Paystack init, lead capture pre-payment, **order bump** | `src/lib/checkout.functions.ts` |
| **Payments webhook** | HMAC-verified, idempotent, grants + receipt + tags + **card-auth capture** | `src/routes/api/public/paystack-webhook.ts` |
| **Delivery** | Signed download URLs (private bucket), multi-item, 24h links | `src/lib/products.functions.ts` (`getDownloadUrl`) |
| **Success page** | Verify + download(s) + **1-click upsell** + upsell chains | `src/routes/checkout.success.tsx` |
| **Subscriptions** | $29/mo Inner Circle via Paystack Plans; recurring grant | `checkout.functions.ts`, `paystack-webhook.ts`, `subscriptions` table |
| **LMS** | Courses → modules → lessons (video + notes), progress %, mark-complete | `src/routes/_authenticated/learn.*.tsx`, `lms.functions.ts` |
| **Admin** | Product CRUD, curriculum builder, contacts, ledger, incidents | `src/routes/_authenticated/admin.*.tsx` |
| **Transactional email** | Resend, queued via pgmq, drained by pg_cron, Standard-Webhooks auth hook | `src/routes/api/email/*`, `subscriptions`/email migrations |
| **Marketing email** | MailerLite groups (buyers, leads, nurture) synced on events | `src/lib/mailerlite.ts` |
| **Automation agents** (in-DB, pg_cron) | Abandoned-cart recovery, welcome drip, re-engagement, dept briefings | `supabase/migrations/*_department_agents.sql`, `*_funnel_parity_agents.sql` |
| **Attribution** | UTM capture → subscriber + order; FB Pixel + GA scaffold | `src/lib/utm.ts`, `src/lib/track.ts`, `__root.tsx` |
| **Geo-IP currency** | SA → ZAR, world → USD display; charge always ZAR | `src/lib/geo.functions.ts`, `currency.tsx`, `gardens.ts` |
| **Application gate** | High-ticket products gated by `/apply` qualification | `src/routes/apply.tsx`, `qualification.functions.ts` |
| **Auth** | Supabase magic-link + password; first admin via bootstrap script | `scripts/bootstrap-admin.ts` |
| **Bot protection** | Cloudflare Turnstile on all forms | `@marsidev/react-turnstile` |

---

## 3. TOOLS & STACK (the full inventory)

| Tool | Role | Why it's used |
|---|---|---|
| **Cloudflare Workers** | Hosting (edge SSR) | Fast globally, cheap, owns the domain/DNS |
| **TanStack Start v1 + React 19 + Vite** | App framework | SSR + server functions in one app |
| **Supabase** | Postgres DB + Auth + Storage | One backend: data, login, file delivery |
| **pg_cron + pg_net + pgmq** | In-DB scheduling, HTTP, queues | Email queue + automation agents run server-side, no extra infra |
| **Paystack** | Payments (ZAR) | SA-native; cards (incl. intl), Plans (subs), `charge_authorization` (1-click) |
| **Cloudflare Stream** | Course video hosting | Signed/gated streaming, native to the stack, pay-as-you-go |
| **Resend** | Transactional email | Receipts, magic links, agent emails (via `notify.chkplt.com`) |
| **MailerLite** | Marketing email | Sequences, segmentation, broadcasts |
| **Cloudflare Turnstile** | CAPTCHA | Free bot protection on forms |
| **YouTube (unlisted/public)** | Marketing video embeds | Free hosting for the VSL / credibility clips |
| **Tailwind v4 + Radix/shadcn + Lucide** | UI | Fast, consistent, accessible components |

Env vars (names only): `SUPABASE_*`, `PAYSTACK_SECRET_KEY`/`PAYSTACK_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SUPABASE_AUTH_HOOK_SECRET`, `MAILERLITE_API_KEY` + group IDs, `TURNSTILE_*`, `VITE_FB_PIXEL_ID`, `VITE_GA_ID`, (Stream) `CF_ACCOUNT_ID` + `CF_STREAM_TOKEN`.

---

## 4. BUDGET (what it costs to run)

Most of the stack is free or pay-as-you-go. ZAR ≈ R18.5/$.

| Item | Launch (0–100 buyers) | Growing (~1k subs) | Scaled (10k+ subs) |
|---|---|---|---|
| Domain | ~$12/yr (R220/yr) | same | same |
| Supabase | **Free** | Pro $25/mo | Pro+ $25–100/mo |
| Cloudflare Workers | **Free** (100k req/day) | Paid $5/mo | $5–30/mo |
| Cloudflare Stream | ~$1–5/mo (per course) | ~$5–20/mo | $20–80/mo |
| Turnstile | **Free** | Free | Free |
| Resend | **Free** (3k/mo) | $20/mo (50k) | $20–80/mo |
| MailerLite | **Free** (≤1k subs) | ~$10–30/mo | $50–150/mo |
| **Monthly total** | **~$0–5** | **~$65–100** | **~$170–340** |
| Paystack per sale | 2.9% + R1 (no monthly) | same | same |

**One-time build effort:** the system itself (this codebase) — the resale value. Replicating from this manual: a competent full-stack dev ≈ 2–4 weeks; with this repo as a template ≈ 2–4 days to re-skin per client.

---

## 5. PRE-KNOWLEDGE (what a builder/reseller must know)

To build or resell this, you need working knowledge of:
1. **React + TanStack Start** — components, routing, server functions (`createServerFn`).
2. **Supabase** — Postgres, RLS, service-role vs anon keys, Storage buckets, SQL migrations.
3. **Cloudflare** — Workers/wrangler deploy, DNS, Turnstile, Stream, Bot-Fight-Mode/WAF.
4. **Payments** — Paystack init + **webhook signature verification (HMAC)** + idempotency + Plans/charge_authorization.
5. **Email** — Resend + DNS (SPF/DKIM/domain verify), Supabase Auth **Send-Email Hook (Standard Webhooks)**, queue/cron draining.
6. **Postgres jobs** — pg_cron, pg_net, pgmq for in-DB automation.

Learning path: Supabase basics → TanStack Start server fns → one Paystack test checkout end-to-end → the webhook → the email queue → then the LMS + automation.

---

## 6. STEP-BY-STEP BUILD SOP (replicate from zero)

1. **Provision Supabase** project → run all `supabase/migrations/*` (products/orders/lessons/grants/subscribers/email infra/agents/subscriptions/payment_authorizations).
2. **Cloudflare**: create Worker (`wrangler.jsonc`), add domain, enable Turnstile, set Worker **secrets** (all env vars).
3. **Paystack**: get live keys → set `PAYSTACK_SECRET_KEY` secret → set the dashboard **webhook URL** to `/api/public/paystack-webhook`.
4. **Resend**: verify the sending domain (DNS records in Cloudflare) → set `RESEND_API_KEY`.
5. **Supabase Auth → Send Email Hook**: enable, point to `/api/email/auth/webhook`, secret = `SUPABASE_AUTH_HOOK_SECRET` (full `v1,whsec_…`).
6. **Email queue cron**: enable pg_cron + pg_net → schedule the drain job hitting `/api/email/queue/process` with the **legacy service-role JWT** bearer.
7. **First admin**: `bun run admin:bootstrap -- you@email pass`.
8. **Products + LMS**: create products (PostgREST or admin), upload files to Storage, build curriculum.
9. **Automation agents**: apply `department_agents` + `funnel_parity_agents` migrations (abandoned-cart, drip, re-engagement crons).
10. **Geo-IP + attribution + Pixel**: deploy; set `VITE_FB_PIXEL_ID`/`VITE_GA_ID`.
11. **Subscriptions + conversion stack**: create Paystack Plan, apply `subscriptions` + `payment_authorizations` migrations, deploy.
12. **Go-live checks**: real test checkout (R1,800), receipt delivered (Resend Logs), download works, drip/abandoned agents return 204.

---

## 7. THE LESSONS (hard-won traps + fixes — saves a rebuilder days)

- **Email never sent? It's almost never one thing.** Order of root causes hit on this build: (a) webhook signature mismatch — Supabase uses **Standard Webhooks** (`webhook-signature` header, signs `id.timestamp.body`), NOT a custom header; (b) **Cloudflare Bot-Fight-Mode** 403'd Supabase's hook callback (datacenter IP) — disable it or WAF-skip the path; (c) **no account** → `/reset-password` silently no-ops; (d) the email **queue had no cron draining it**.
- **Paystack can't charge USD** on a ZA account ("Currency not supported by merchant") → charge ZAR, **display** USD via a slug→USD map + geo-IP.
- **Service-role key format:** the cron/processor must use the **legacy JWT** (`eyJ…`), not the new `sb_secret_…` key — the Worker validates the legacy one (403 otherwise).
- **pg_net 403 ≠ Cloudflare** when the endpoint itself returns 403: the processor returns 403 on a **wrong bearer** — check the key before blaming the edge.
- **`agent_events.department` has a CHECK constraint** — new pg_cron agents must log under an allowed department or the whole function rolls back (23514).
- **Postgres `$$`-quoted function bodies** use SINGLE quotes; only double `''` for literal apostrophes (over-escaping → 42601).
- **Never let a webhook side-effect break the core flow:** wrap optional captures (e.g. card-auth) in try/catch so an unmigrated table can't block grants/receipts.
- **New Supabase tables aren't in generated TS types** → `from("table" as any)` (or regen types) to compile.
- **The webhook grant loop iterates ALL `order_items`** → order bumps auto-deliver for free; reuse it for upsells too.
- **Underpricing bug:** a product marketed "$97" but stored as `price_cents` in ZAR charges R97 (~$5). Price in ZAR equivalent, display USD.

(Full running log: `Learnings.md`.)

---

## 8. SELLING IT AS A SERVICE ("Funnel-Building as a Service")

**The offer:** "I build you a complete, owned digital-product funnel — checkout, delivery, LMS, email automation, upsells — on infrastructure you own, for a fraction of GoHighLevel's lifetime cost."

**Deliverables per client:**
1. Re-skinned landing + product pages (their brand).
2. Paystack/Stripe wired + webhook + delivery.
3. LMS with their course loaded (Cloudflare Stream).
4. Email: transactional (Resend) + marketing (MailerLite) sequences.
5. Automation agents (abandoned-cart, drip, re-engagement).
6. Admin handoff + this manual + a Loom walkthrough.

**Pricing guidance (SA market):** setup R15k–R45k once-off (depending on scope) + R1,500–R5,000/mo care plan (hosting passthrough + maintenance + monthly optimisation). The codebase is the template — each new client is a re-skin + config, not a rebuild.

**SOW checklist:** scope (pages/products/courses) · brand assets · payment account · domain/DNS access · email domain · content (videos/PDFs) · go-live date · care-plan terms.

**Handoff:** give them admin login (`admin:bootstrap`), the env-var list, this manual, and the SOPs (Section 6). Hold trademarks/IP in a **family trust** for generational continuity.

---

*This manual is the asset. Keep it current as the system evolves — every new build = a new line in `Learnings.md` and (if teachable) a tagged entry in the Called Expert Curriculum KB.*
