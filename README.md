# CHKPLT — Digital Empire Builder

**Christ's Kingdom Platform** — the owned, high-ticket coaching + digital-products platform for
**NOCHILL PTY LTD**. This is the "John 21 right side": the platform NOCHILL owns outright (vs. rented
social platforms), where the Contentpreneur Accelerator, digital products, and the email list live.

- **Production:** https://chkplt.com
- **Owner:** Ndivhuwo Muhanelwa ("NoChill") · chiefmuhanelwa@gmail.com
- **Agent instructions:** see [`CLAUDE.md`](./CLAUDE.md) — read it before doing any work here.
- **Go-live ops:** see [`docs/GO-LIVE.md`](./docs/GO-LIVE.md).

> This is **not** the content generator (that's `full-content-system`). CHKPLT *delivers* products,
> runs the LMS, and takes payments.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | TanStack Start v1 (SSR) + React 19 + Vite 7 — **not Next.js** |
| Hosting | Cloudflare Workers (`wrangler.jsonc`, worker name `tanstack-start-app`) |
| Database | Supabase Postgres (RLS on all tables, ~32 migrations) |
| Auth | Supabase magic-link + password (first user auto-admin) |
| Payments | Paystack (ZAR) — Stripe rail planned, not built |
| Email | Resend via a pgmq + pg_cron drain queue; React-Email templates |
| Marketing email | MailerLite |
| Bot protection | Cloudflare Turnstile |
| Package manager | **Bun** (never npm/yarn) |

## Commands

```bash
bun install              # install deps (Bun only)
bun dev                  # local dev on :3000 (also regenerates src/routeTree.gen.ts)
bun run build            # production build → dist/
bunx tsc --noEmit        # type-check (run before AND after every change)
bunx wrangler deploy -c dist/server/wrangler.json   # deploy the built worker to prod
```

## What's inside `src/routes/`

- **Public:** `/` landing · `/apply` (Contentpreneur diagnostic) · `/products` catalog · `/products/$slug` · `/login` `/signup` `/reset-password` · legal pages
- **Free interactive tools (DARES-native, client-side):**
  `/rate-card` (SA CPM rate calculator) · `/hook-generator` (R×A×C×U^B) ·
  `/media-kit` (one-pager builder) · `/sars-calculator` (25% tax reserve) · `/offer-builder` (AI) · `/niche-clarity`
- **Authenticated (`_authenticated/`):** `/dashboard` · `/account` · `/learn` (LMS: modules → lessons → progress)
- **Admin (`has_role()` gated):** products, curriculum builder, contacts, ledger, incidents
- **Webhooks (HMAC-verified):** `/api/public/paystack-webhook` · `/api/email/*`

## Key directories

```
src/routes/         file-based routes (pages, API)
src/lib/            server functions (checkout, lms, apply, contacts, email-templates…)
src/integrations/   Supabase clients (browser + admin)
supabase/migrations/  immutable SQL migrations — never edit, always add new
docs/               BLOCKERS · GO-LIVE · CURRICULUM · PAYMENTS · STORY-BANK · SALES-PIPELINE
```

## Non-negotiables (full list in `CLAUDE.md`)

1. **Bun only.** 2. **TanStack, not Next.js.** 3. **Type-check before & after changes.**
4. **HMAC on all webhooks.** 5. **Turnstile on public forms.** 6. **Never edit migrations — add new.**
7. **SARS 25% reserve** on every order. 8. **No AI generation here** (that's `full-content-system`).
9. **No hardcoded prices** — read `price_cents` from the DB. 10. **Never fabricate proof numbers.**

---
© NOCHILL PTY LTD · Reg 2016/507839/07
