## CHKPLT Hardening — 4 Modules

### Module 1 — Immutable Audit Ledger

**Migration** (`audit_ledgers`):
- Columns: `id`, `order_id` (unique, FK-by-id only), `provider_reference`, `gross_cents`, `vat_allocation_cents` (15%), `tax_reserve_cents` (25%), `net_cents`, `currency`, `customer_email_hash` (sha256, not raw email — keeps tax row even after GDPR wipe per Module 4), `paid_at`, `created_at default now()`.
- `GRANT SELECT ON public.audit_ledgers TO authenticated` (admin-read via has_role check in policy), `GRANT ALL TO service_role`.
- RLS: admin-only SELECT. **No** INSERT/UPDATE/DELETE policies for any role except service_role INSERT.
- **Guardrail trigger** `audit_ledgers_immutable()` (BEFORE UPDATE OR DELETE): `RAISE EXCEPTION 'audit_ledgers rows are immutable'`. (Postgres RULEs don't fire for service_role bypass paths reliably — triggers do.)
- Revoke UPDATE/DELETE from PUBLIC + service_role explicitly.

**Webhook wiring** (`src/routes/api/public/paystack-webhook.ts`):
- Inside the existing atomic "claim" block (after `orders.status='paid'` succeeds, before receipt enqueue), compute VAT/tax splits and `INSERT INTO audit_ledgers ... ON CONFLICT (order_id) DO NOTHING`. Hash email with `crypto.createHash('sha256')`.
- Wrap in `reportError(...)` (Module 2) — never block the receipt path on ledger failure.

**Admin view**: new `/_authenticated/admin.ledger.tsx` read-only table (paginated, CSV export). Server fn `getAuditLedger` with `requireSupabaseAuth` + admin role check.

---

### Module 2 — Real-Time Watchman (error reporter)

**New file** `src/lib/error-logger.ts` — exactly the abstraction you provided:
- `reportError(err, { userId?, orderId?, endpoint?, meta? })`
- Step 1 (active): structured `console.error` tagged `[CHKPLT ERROR]` — captured by TanStack `server-function-logs`.
- Step 2 (active): insert into new `public.incidents` table (admin-read only) for in-dashboard triage.
- Step 3 (commented expansion slot): Sentry/Logtail one-liner placeholder.

**Migration** `incidents`: `id, message, endpoint, severity, user_id, meta jsonb, created_at`. RLS: admin SELECT, service_role INSERT. GRANTs included.

**Deploy across**:
- `src/routes/api/public/paystack-webhook.ts` (every catch + signature failure)
- `src/lib/contacts-import.functions.ts` (batch failures already classified — also `reportError`)
- `src/lib/products.functions.ts` (signed URL failures)
- `src/lib/downloads.functions.ts` if present
- `src/lib/email-templates/*` send paths via the email worker cron
- New checkout-init / Turnstile-verify server fns from Module 3

**Admin incidents page**: `/_authenticated/admin.incidents.tsx` — filter by endpoint/severity, mark resolved.

---

### Module 3 — Turnstile Bot Shield (login + checkout)

**Secrets request** (will request via `add_secret` after approval):
- `TURNSTILE_SITE_KEY` (public — also exposed as `VITE_TURNSTILE_SITE_KEY`)
- `TURNSTILE_SECRET_KEY` (server only)

**Frontend**:
- Install `@marsidev/react-turnstile`.
- New `<TurnstileGate onToken={...} />` component reading `VITE_TURNSTILE_SITE_KEY`.
- Wire into `/login` (Google button OK to skip; gate the email/password sign-in + sign-up submits) and `/checkout` (gate the "Pay now" button — token attached to the existing checkout-init server fn payload).

**Backend verification helper** `src/lib/turnstile.server.ts`:
- `verifyTurnstile(token, ip?)` POSTs to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `TURNSTILE_SECRET_KEY`. Returns `{ success, errorCodes }`.
- Called inside:
  - email/password sign-in + sign-up server fns
  - checkout-init server fn (before Paystack call)
- On failure: throw `Error('Verification failed — please refresh and retry')`. Logged via `reportError`.

**Cloudflare proxy checklist** (docs only, no code) — appended to `.lovable/plan.md`:
- Enable orange-cloud DNS proxy on production domain
- Add Rate-Limiting rule: `/login` + checkout endpoints, 50 req/min per IP
- Enable Bot Fight Mode

---

### Module 4 — Data Cleansing Sanctuary (GDPR-style)

**Server fn** `requestAccountDeletion` in `src/lib/account.functions.ts` (`requireSupabaseAuth`):
1. Verify caller identity (`getUser()` re-check).
2. Re-hash user's email to `sha256` and **backfill** `audit_ledgers.customer_email_hash` for their `order_id`s if any are still raw — guarantees the historical record survives.
3. **Wipe marketing PII**: `DELETE FROM subscribers WHERE email = ?`, `DELETE FROM subscriber_tags ...`, `DELETE FROM profiles WHERE id = auth.uid()`, anonymize `orders.email = 'deleted-<hash>@anonymized.local'`, null `customer_name`, `customer_phone`.
4. **Retain financials**: `audit_ledgers` rows untouched (immutable trigger blocks it anyway — by design).
5. Call `supabaseAdmin.auth.admin.deleteUser(userId)` last.
6. Log via `reportError` on partial failure (each step independently try/caught).

**Frontend** new `/_authenticated/account.tsx` settings page:
- "Download my data" button (server fn returning JSON of profile + orders + subscriber rows).
- "Delete my account" — double confirm modal explaining what's wiped vs retained for tax compliance, then calls `requestAccountDeletion` and signs out.

**Public policy snippet** added to the existing footer/privacy area (1 short paragraph explaining the retention split).

---

### Files

**Migrations (2)**: `audit_ledgers` + immutable trigger; `incidents` table.

**New**: `src/lib/error-logger.ts`, `src/lib/turnstile.server.ts`, `src/lib/account.functions.ts`, `src/components/TurnstileGate.tsx`, `src/routes/_authenticated/admin.ledger.tsx`, `src/routes/_authenticated/admin.incidents.tsx`, `src/routes/_authenticated/account.tsx`.

**Edited**: `paystack-webhook.ts` (ledger insert + reportError), `contacts-import.functions.ts` + `products.functions.ts` (reportError), `/login` route (Turnstile + verify), `/checkout` route (Turnstile + verify in init fn), admin dashboard nav (+ Ledger, + Incidents links), footer privacy note.

**Deps**: `@marsidev/react-turnstile`.

**Secrets requested after approval**: `TURNSTILE_SITE_KEY`, `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

### Explicitly NOT included
- Sentry/Logtail transport (slot left commented per your choice).
- Cloudflare DNS/rate-limit rules (dashboard config — checklist provided).
- Backend app-level rate limiting (Lovable platform gap; Cloudflare layer handles it).
- Magic-link auth (not present today; Turnstile applied to existing email/password + Google flows).