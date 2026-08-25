-- Pin the Foundation Kit to the live ZAR price.
--
-- WHY: production has charged R1,565.03 (price_cents = 156503, currency = ZAR)
-- since it was set by hand outside version control. The last migration to touch
-- this price is 20260617230000_update_foundation_kit_usd.sql, which sets
-- price_cents = 9700 with currency = 'USD'. Paystack cannot bill USD on this
-- account (verified live 2026-08-19), so replaying the migrations onto a fresh
-- database produces a Foundation Kit that South African buyers cannot pay for.
--
-- This makes the repo reproduce production. It is NOT a reprice: 156503 is the
-- value already live and already implied by the 16.13 rate the $997/$2,997
-- ladder was derived at (R1,565.03 / $97). USD display stays $97 via
-- USD_DISPLAY in src/lib/gardens.ts — that is display + the Stripe amount, and
-- is untouched here.
--
-- Founder-locked per CLAUDE.md §9: this writes the founder's own live value
-- back into version control. It does not choose a new one.

UPDATE public.products
SET price_cents = 156503,
    currency = 'ZAR'
WHERE slug = 'called-expert-foundation-kit'
  AND (price_cents IS DISTINCT FROM 156503 OR currency IS DISTINCT FROM 'ZAR');

DO $$
DECLARE
  v_price integer;
  v_currency text;
BEGIN
  SELECT price_cents, currency INTO v_price, v_currency
  FROM public.products WHERE slug = 'called-expert-foundation-kit';

  IF v_price IS NULL THEN
    RAISE NOTICE 'Foundation Kit row not present — nothing pinned.';
  ELSE
    RAISE NOTICE 'Foundation Kit pinned: % %', v_price, v_currency;
  END IF;
END $$;
