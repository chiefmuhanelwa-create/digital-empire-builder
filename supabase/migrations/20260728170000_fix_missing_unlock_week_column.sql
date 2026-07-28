-- =============================================================================
-- Fix: modules.unlock_week never actually existed on the live database,
-- despite migration 20260709130000_lms_drip_delivery.sql being marked
-- "applied" in the migration history table.
--
-- Root cause: during Phase 1A of this session (2026-07-27), the CLI's
-- migration history was found completely out of sync with the live database
-- (every migration showed "not applied" even though the app was clearly
-- live and functioning — they'd been applied via the Supabase dashboard SQL
-- editor directly, which doesn't update the CLI's tracking table). That was
-- fixed with `supabase migration repair --status applied` for all 37
-- pre-existing migrations, verified safe by spot-checking that `profiles`
-- (an early migration's table) already existed. That spot-check did not
-- (and could not, practically) verify every single migration's actual
-- effects individually -- this one slipped through: it was marked applied,
-- but its ALTER TABLE never actually ran. Found 2026-07-28 when regenerating
-- TypeScript types for an unrelated change (`compare_at_price_cents`) and
-- discovering `unlock_week` was completely absent from the generated types,
-- breaking `adminUpdateModule` in lms.functions.ts.
--
-- This re-applies the exact same statements as the original migration.
-- Idempotent either way (IF NOT EXISTS / safe re-run), so running it again
-- is harmless even in an environment where it actually did already run.
-- =============================================================================

ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS unlock_week integer NOT NULL DEFAULT 1;

DO $$
DECLARE
  v_product_id uuid;
BEGIN
  SELECT id INTO v_product_id FROM public.products
  WHERE slug = 'contentpreneur-90day-cohort' LIMIT 1;

  IF v_product_id IS NOT NULL THEN
    UPDATE public.modules SET unlock_week = 1  WHERE product_id = v_product_id AND sort_order = 1;
    UPDATE public.modules SET unlock_week = 3  WHERE product_id = v_product_id AND sort_order = 2;
    UPDATE public.modules SET unlock_week = 5  WHERE product_id = v_product_id AND sort_order = 3;
    UPDATE public.modules SET unlock_week = 7  WHERE product_id = v_product_id AND sort_order = 4;
    UPDATE public.modules SET unlock_week = 8  WHERE product_id = v_product_id AND sort_order = 5;
    UPDATE public.modules SET unlock_week = 10 WHERE product_id = v_product_id AND sort_order = 6;
    UPDATE public.modules SET unlock_week = 11 WHERE product_id = v_product_id AND sort_order = 7;
  END IF;
END;
$$;

-- ── Given this migration-repair blind spot is now proven real, worth
-- checking whether OTHER "repaired" migrations also silently never ran.
-- Not exhaustively re-verified here (out of scope for this fix) -- flagged
-- in docs/RUNBOOK-PRICE-CHANGES.md's Change Log for a future audit pass.
