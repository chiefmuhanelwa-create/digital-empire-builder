-- Restructure the funnel to follow the 7-stage transformation.
-- PROBLEM: the funnel leapt from the $97 Kit straight to the R18,000 Accelerator —
-- a crater with nothing in between, so warm buyers had nowhere to ascend.
-- FIX: (1) create the missing flagship middle rung (Hook Science), and (2) rewire
-- the seed_to_product_id ascension so each purchase points to the next rung, letting
-- buyers climb the transformation continuously ($16 → $97 → $197 → $297 → continuity).

-- ── 1. Hook Science — the flagship standalone (curriculum Stage 4b) ──────────
-- DRAFT until the video content is produced; publishing it activates the rung.
-- This is the highest-intent product in the whole ladder (NoChill's signature skill).
INSERT INTO public.products (
  slug, title, tagline, description, long_description, benefits,
  garden, price_cents, currency, status, format, target_audience,
  sort_order, is_free, requires_application
)
VALUES (
  'hook-science',
  'Hook Science',
  'STOP THE SCROLL — THE SIGNATURE SKILL',
  'The exact hook, story, and CTA science that turns expertise into attention — packaged into a repeatable script you run every time you post. Not theory. The formulas.',
  'Most experts are ignored not because their knowledge is weak, but because their first line is. Hook Science is the one skill that decides whether anyone reads the rest — and it is the thing the market already knows NoChill for. You will learn the R×A×C×U^B hook formula to engineer a scroll-stopping opener on demand, the HSLFCTA script (Hook → Story → Lesson → Framework → CTA) that sells without selling, and the 4 Scripting Principles that carry a viewer all the way to the call to action. Then you apply it in seconds with the Hook Generator. This is Stage 4 of the Contentpreneur system, pulled out and taught properly.',
  '["The R×A×C×U^B Hook Formula — engineer a scroll-stopping first line on demand","HSLFCTA — the Hook → Story → Lesson → Framework → CTA script that sells without selling","The 4 Scripting Principles that hold attention all the way to the CTA","Swipe templates + the Hook Generator app to apply it in seconds"]'::jsonb,
  'esev',
  -- ZAR charge ≈ $147 @ ~16.58; the daily sync-fx cron rewrites this to track the
  -- fixed USD price once 'hook-science' is added to USD_DISPLAY (gardens.ts).
  243700, 'ZAR', 'draft',
  'Video course + Hook Generator app',
  'Contentpreneurs who can package their expertise but get scrolled past on the first line.',
  25, false, false
)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Rewire the ascension chain (each published rung → the next) ───────────
-- The success page reads the purchased product's seed_to_product_id and offers it
-- as the one-click next step. Only PUBLISHED seeds display, so this chain uses live
-- products today; Hook Science slots in once it has content (see note at bottom).
UPDATE public.products SET seed_to_product_id = (SELECT id FROM public.products WHERE slug = 'called-expert-foundation-kit')
  WHERE slug = 'niche-clarity-workbook';
UPDATE public.products SET seed_to_product_id = (SELECT id FROM public.products WHERE slug = 'called-expert-foundation-kit')
  WHERE slug = 'personal-brand-30-days';
UPDATE public.products SET seed_to_product_id = (SELECT id FROM public.products WHERE slug = 'asset-accelerator')
  WHERE slug = 'called-expert-foundation-kit';
UPDATE public.products SET seed_to_product_id = (SELECT id FROM public.products WHERE slug = 'called-expert-foundations')
  WHERE slug = 'asset-accelerator';
UPDATE public.products SET seed_to_product_id = (SELECT id FROM public.products WHERE slug = 'called-expert-inner-circle')
  WHERE slug = 'called-expert-foundations';

-- WHEN HOOK SCIENCE IS PUBLISHED, run this to insert it into the ladder (not now —
-- a draft seed would show nothing on the success page):
--   UPDATE products SET seed_to_product_id = (SELECT id FROM products WHERE slug='hook-science') WHERE slug='called-expert-foundation-kit';
--   UPDATE products SET seed_to_product_id = (SELECT id FROM products WHERE slug='asset-accelerator') WHERE slug='hook-science';
