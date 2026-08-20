-- =============================================================================
-- FOUNDER RULING 2026-08-19 — the ladder is $97 → $997 → $2,997.
-- Everything else becomes an order bump or a downsell, not a rung of its own.
--
--   Foundation Kit          $97     R1,565.03   (UNCHANGED — not touched here)
--   Contentpreneur PRO      $997    R16,081.61  (was $499 / R8,051.02)
--   VIP Enterprise Tier     $2,997  R48,341.61  (NEW)
--
-- WHY THE ZAR COLUMN STILL EXISTS WHEN THE PRICE IS QUOTED IN USD
-- ===============================================================
-- Because Paystack cannot bill USD on this account. Verified live 2026-08-19:
--
--   POST /transaction/initialize  currency=USD  → "Currency not supported by merchant"
--   POST /transaction/initialize  currency=ZAR  → "Authorization URL created"
--
-- and Paystack does not auto-convert. So USD is the number on the PAGE
-- (formatPrice now renders USD for everyone, local included) and ZAR is the
-- number on the CARD. Setting currency='USD' on these rows would make every
-- South African checkout fail at the payment step.
--
-- ZAR is derived at 16.13 — the rate the live Foundation Kit already implies
-- (R1,565.03 ÷ $97) — so repricing these two moves nothing else on the store.
--
-- The USD side lives in src/lib/gardens.ts USD_DISPLAY, which must stay in step:
--   contentpreneur-90day-cohort  99700
--   contentpreneur-vip-tier     299700
-- =============================================================================

-- ─── 1. Contentpreneur Accelerator PRO → $997 ────────────────────────────────
UPDATE public.products
SET price_cents = 1608161,          -- R16,081.61  ($997 × 16.13)
    currency    = 'ZAR',
    updated_at  = now()
WHERE slug = 'contentpreneur-90day-cohort';


-- ─── 2. VIP Enterprise Tier → $2,997 (NEW) ───────────────────────────────────
-- Slug is deliberate: products.$slug.tsx already renders <VipTierBreakdown />
-- for exactly `contentpreneur-vip-tier`, so the phase/investment breakdown
-- appears with no further wiring. That component was previously unreachable —
-- no product carried this slug.
--
-- requires_application = true: this sits ABOVE the flagship. It must not be
-- self-serve checkout-able by someone who has never spoken to anyone.
INSERT INTO public.products (
  slug, title, tagline, description, long_description,
  benefits, garden, price_cents, currency, status,
  format, target_audience, sort_order, is_free, requires_application
)
VALUES (
  'contentpreneur-vip-tier',
  'Contentpreneur VIP Enterprise Tier',
  'DONE-WITH-YOU, NOT DO-IT-YOURSELF',
  'Everything in the 90-Day Accelerator PRO, plus private strategy and a funnel '
  'built with you rather than explained to you. Five Contentpreneurs per cohort quarter.',
  'The Accelerator teaches you to build the system. This one builds it with you.

Same 90-day architecture, same frameworks, same cohort — but with private
strategy calls and done-with-you implementation on top, capped at five people a
quarter so the calendar is real.

For the Contentpreneur who already has the expertise and the audience, and whose
constraint is time, not knowledge.',
  '[
    "Everything in the 90-Day Accelerator PRO — all four phases, the full cohort",
    "Private 1:1 strategy calls — your business, your numbers, not a group Q&A",
    "Done-with-you funnel build — the asset gets built, not just taught",
    "Five Contentpreneurs per cohort quarter, so the access is real and not sold past capacity"
  ]'::jsonb,
  'etz_pri',
  4834161,                          -- R48,341.61  ($2,997 × 16.13)
  'ZAR',
  'draft',                          -- DRAFT until the founder confirms delivery capacity
  'Cohort programme — 90 days, private calls and done-with-you build. Not a download.',
  'Contentpreneurs with real expertise and an audience, whose constraint is time rather than knowledge.',
  0, false, true
)
ON CONFLICT (slug) DO UPDATE SET
  price_cents          = EXCLUDED.price_cents,
  currency             = EXCLUDED.currency,
  requires_application = EXCLUDED.requires_application,
  updated_at           = now();
