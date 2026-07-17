-- =============================================================================
-- LMS DRIP-DELIVERY: week-gated module unlocking
-- -----------------------------------------------------------------------------
-- Implements docs/COVENANT-ENGINE.md §8.3 ("The Drip-Delivery Engine") — Day 1
-- opens Stage 1 only, later stages unlock week-by-week as the cohort advances,
-- computed from `product_grants.granted_at` (already exists, no new table).
--
-- Adds `unlock_week` to modules (default 1 = no gating for any product not
-- explicitly configured below — safe no-op for every other course). Then sets
-- the week map for contentpreneur-90day-cohort to match the adopted 12-week
-- Torah-arc structure from `20260709120000_restructure_curriculum_covenant_engine.sql`.
-- Idempotent: safe to re-run.
-- =============================================================================

ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS unlock_week integer NOT NULL DEFAULT 1;

DO $$
DECLARE
  v_product_id uuid;
BEGIN
  SELECT id INTO v_product_id FROM public.products
  WHERE slug = 'contentpreneur-90day-cohort' LIMIT 1;

  IF v_product_id IS NOT NULL THEN
    UPDATE public.modules SET unlock_week = 1  WHERE product_id = v_product_id AND sort_order = 1; -- Genesis: Foundation
    UPDATE public.modules SET unlock_week = 3  WHERE product_id = v_product_id AND sort_order = 2; -- Exodus: SWOT & 4Ps
    UPDATE public.modules SET unlock_week = 5  WHERE product_id = v_product_id AND sort_order = 3; -- Leviticus: 4Es
    UPDATE public.modules SET unlock_week = 7  WHERE product_id = v_product_id AND sort_order = 4; -- Numbers pt.1: Platform
    UPDATE public.modules SET unlock_week = 8  WHERE product_id = v_product_id AND sort_order = 5; -- Numbers pt.2: DARES
    UPDATE public.modules SET unlock_week = 10 WHERE product_id = v_product_id AND sort_order = 6; -- Deuteronomy pt.1: Owned Tribes
    UPDATE public.modules SET unlock_week = 11 WHERE product_id = v_product_id AND sort_order = 7; -- Deuteronomy pt.2: PAIDS
  END IF;
END;
$$;
