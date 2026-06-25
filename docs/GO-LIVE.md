# CHKPLT — Go-Live Runbook (Owner-Only Ops)

> These steps need your live dashboards (Cloudflare, Supabase, Resend) — they cannot be
> done from code. Work top to bottom. Each step has a **verify** check; don't move on
> until it passes. Last updated: 2026-06-25.

Everything code-side that these steps depend on is already built and type-checks clean.
The platform is blocked on **config + data**, not engineering.

---

## 0. Prerequisites (one-time)

- [ ] Supabase CLI installed and logged in: `supabase login`
- [ ] Project linked: `supabase link --project-ref <VITE_SUPABASE_PROJECT_ID from .env>`
- [ ] Wrangler logged in: `bunx wrangler login`
- [ ] Your local `.env` has every secret filled (it does — confirmed 2026-06-25).

---

## 1. ✅ Push secrets to the Cloudflare Worker (prod env)

**Status (verified 2026-06-25):** the launch-critical secrets are ALREADY pushed —
`PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `SUPABASE_AUTH_HOOK_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` (+ Stripe keys, unused for now).
Payments, the Paystack webhook (it verifies with the **secret key** — there is no
separate webhook secret), email, and the AI Offer Builder are all covered.

**Still recommended before you announce:**

```bash
# Bot protection — code no-ops when absent, so forms work but Turnstile is OFF.
# Set it to honour the "Turnstile everywhere public" rule:
bunx wrangler secret put TURNSTILE_SECRET_KEY

# Optional — marketing automation no-ops while blank:
bunx wrangler secret put MAILERLITE_API_KEY
bunx wrangler secret put MAILERLITE_GROUP_ID_BUYERS
```

**Verify:** `bunx wrangler secret list`.

---

## 2. 🔴 Run migrations + seeds against the live DB

This applies all 32 migrations, including the three that unblock launch:
`seed_owner_qualification` (unlocks your premium checkout), `seed_curriculum`,
`seed_foundation_kit_products`.

```bash
supabase db push
```

**Verify (Supabase SQL editor):**
```sql
-- Owner is qualified (unlocks premium checkout for you):
select email, determined_routing_status
from client_stewardship_applications
order by created_at desc limit 3;
-- Expect chiefmuhanelwa@gmail.com → QUALIFIED_FOR_CORE_PROGRAM
```

---

## 3. 🔴 Enable the Supabase Send-Email hook

Routes all auth email (magic link, signup, recovery) through your Resend domain.

1. Supabase → **Authentication → Hooks → Send Email Hook** → Enable.
2. URL: `https://chkplt.com/api/email/auth/webhook`
3. Secret: paste the **same** value as `SUPABASE_AUTH_HOOK_SECRET` in `.env` / the Worker.

**Verify:** open `/reset-password` on the live site, submit your email, then check
**Resend → Logs** for a `delivered` event and confirm the email lands in your inbox.
If this passes, magic-link login, signup, and receipts all work.

---

## 4. 🔴 Gate the empty premium SKUs (closes the covenant-breach risk)

The server now refuses checkout for `requires_application` products unless the email has a
`QUALIFIED_FOR_CORE_PROGRAM` application (see `checkout.functions.ts`). Turn that gate ON
for the two empty premium programs so no one can pay into an empty LMS:

```sql
update products
set requires_application = true
where slug in ('contentpreneur-90day-cohort', 'contentpreneur-vip-tier');
```

**Verify:** open `/products/contentpreneur-90day-cohort` while logged OUT →
you should see the "complete the diagnostic at /apply" gate, not a Buy button.
Logged in as your (qualified) owner email → Buy is available.

---

## 5. 🟡 Publish

Flip the platform live once 1–4 pass. Find and set the publish flag:

```sql
-- locate it first:
-- select column_name, table_name from information_schema.columns where column_name = 'is_published';
update <table_with_flag> set is_published = true;  -- caution: confirm the table first
```

**Verify:** load `chkplt.com` in an incognito window — the public catalog renders the
5 live foundation products; the two premium SKUs show as application-gated.

---

## 6. ✅ Smoke test (do this before announcing)

- [ ] `/reset-password` → email delivered (Step 3).
- [ ] Buy a **free** product → instant access, no checkout.
- [ ] Buy a **paid foundation** product (e.g. R199 Niche Clarity) with a real card →
      redirected to Paystack → back to `/checkout/success` → receipt email arrives →
      `/learn` shows the grant.
- [ ] Paystack → Webhooks points at `https://chkplt.com/api/public/paystack-webhook`
      and shows `200` on the test purchase.
- [ ] Premium SKU is NOT purchasable while logged out / unqualified (Step 4).

When all six boxes are ticked, you are live and honest — nothing self-serve can take
money for an empty box.

---

## Deferred (do NOT block launch on these)
- Stripe / international rail (USD/GBP/EUR) — not built.
- Full 30-lesson curriculum — soft-launch with the application-gated cohort + live delivery.
- R45K VIP tier — keep gated/application-only until the asset library justifies it.
