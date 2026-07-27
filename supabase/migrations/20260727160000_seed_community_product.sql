-- =============================================================================
-- SEED: Contentpreneur Community ($19/mo subscription) — new product per the
-- founder's locked 4-tier offer ladder (Starter Kit free -> Foundation Kit $97
-- -> Accelerator $499 -> Community $19/mo), 2026-07-27.
--
-- STATUS: 'draft', not 'published'. This product is NOT checkout-reachable until
-- a real Paystack recurring Plan has been created for it and its plan_code is
-- pasted into SUBSCRIPTION_PLANS in src/lib/checkout.functions.ts (a placeholder
-- is there now — see docs/RUNBOOK-COMMUNITY-LAUNCH.md for the exact steps). This
-- follows the same pattern already used for 'hook-science' in
-- 20260717140000_funnel_transformation_ladder.sql: seed real content now, flip
-- status to 'published' only once the product can actually be bought and
-- delivered — never let an unbuyable/undeliverable product go live by accident.
--
-- Idempotent: ON CONFLICT (slug) DO UPDATE, matching every other product seed
-- in this project (20260617100000_seed_foundation_kit_products.sql).
-- =============================================================================

INSERT INTO public.products (
  slug, title, tagline, description, long_description,
  benefits, garden, price_cents, currency, status,
  format, target_audience, sort_order, is_free, requires_application
)
VALUES (
  'contentpreneur-community',
  'Contentpreneur Community',
  'THE ROOM THAT KEEPS YOU BUILDING AFTER THE KIT OR THE ACCELERATOR ENDS',
  'Monthly group coaching, a private community of other Contentpreneurs, and a fresh template or teardown every month. Cancel anytime. $19/mo.',
  'A workbook or a cohort gives you a plan. This is what keeps you executing it once the plan ends.

Foundation Kit and Accelerator graduates land here — a lower-friction way to stay inside the ecosystem, stay accountable, and keep getting new material instead of going quiet the moment the course is over.

This is not a second curriculum. It is the room, not the classroom.',
  '[
    "Private community — ask questions, share wins, get unstuck alongside other Contentpreneurs",
    "Monthly group coaching call — live, first [day] of each month",
    "The monthly drop — a new template, teardown, or playbook every month",
    "Cancel anytime — no lock-in contract"
  ]'::jsonb,
  'etz_pri',
  31500, 'ZAR', 'draft',
  'Recurring membership — private community + monthly live call + monthly resource drop',
  'Contentpreneurs who''ve finished the Foundation Kit or Accelerator and want ongoing accountability and fresh material, not another course.',
  30, false, false
)
ON CONFLICT (slug) DO UPDATE SET
  title               = EXCLUDED.title,
  tagline             = EXCLUDED.tagline,
  description         = EXCLUDED.description,
  long_description    = EXCLUDED.long_description,
  benefits            = EXCLUDED.benefits,
  garden              = EXCLUDED.garden,
  price_cents         = EXCLUDED.price_cents,
  format              = EXCLUDED.format,
  target_audience     = EXCLUDED.target_audience,
  is_free             = EXCLUDED.is_free,
  requires_application = EXCLUDED.requires_application;
  -- NOTE: `status` is deliberately NOT in this DO UPDATE SET list — once someone
  -- (a human, via the admin panel or a dedicated go-live migration) flips this to
  -- 'published', re-running this migration must not silently flip it back to
  -- 'draft'. Same reasoning as the price_cents guard in
  -- 20260727150000_accelerator_flat_499_reprice.sql: don't let an idempotent seed
  -- undo a deliberate operational decision made after the seed ran.
