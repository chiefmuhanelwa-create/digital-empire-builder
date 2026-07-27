-- Reprice the Contentpreneur Accelerator PRO from R18,000 PIF / R6,500x3 to a
-- flat $499, per founder decision 2026-07-27 (see the daily USD_DISPLAY value in
-- src/lib/gardens.ts, already updated: 97000 -> 49900).
--
-- WHY THIS MIGRATION EXISTS: `contentpreneur-90day-cohort` was never seeded via a
-- migration in the first place -- its price_cents/title lived only in the live
-- Supabase dashboard, which is exactly why the app code (gardens.ts's USD_DISPLAY
-- comment, PremiumProgramBreakdown.tsx, apply.tsx) and the live DB were free to
-- drift out of sync with each other and with the doc set. This migration puts the
-- price and title in git so a future audit doesn't have to trust the dashboard.
--
-- Only price_cents/currency/title are touched -- description/long_description/
-- benefits/target_audience are left untouched since their current live content is
-- not visible from this migration file and a wrong guess here would silently
-- overwrite real production copy (the opposite of what this migration is for).
-- If the row does not exist yet in a given environment, this UPDATE is a no-op --
-- that is intentional; this migration repricing an existing row, not seeding a
-- new one (the row's full seed content lives only in production, per the note
-- above, and should not be reconstructed here from a guess).

UPDATE public.products
SET
  title       = 'Contentpreneur Accelerator PRO',
  price_cents = 827000,  -- R8,270 @ ~16.58 ZAR/USD -- the daily sync-fx cron (src/lib/fx-sync.ts)
                          -- will immediately correct this to track the live rate once it next runs;
                          -- this value only matters for the gap between this migration and that run.
  currency    = 'ZAR'
WHERE slug = 'contentpreneur-90day-cohort';
