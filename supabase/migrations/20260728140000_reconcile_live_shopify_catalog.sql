-- =============================================================================
-- Phase 2D follow-up, 2026-07-28: reconciling against the ACTUAL live Shopify
-- site (contentcreatorhub.online), fetched directly and parsed for real
-- current prices/titles -- not the older product-lab planning docs used for
-- the earlier import. Founder-confirmed: the R99 price shown on Shopify for
-- 30-day-content-calendar is treated as stale; R149 (already set) stands.
-- =============================================================================

-- ─── Confirmed price fix: same product, real mismatch ───────────────────────
UPDATE public.products
SET price_cents = 39900, updated_at = now()
WHERE slug = 'monetise-your-expertise';
-- was R299, live Shopify shows R399 for the same "Monetise Your Expertise"
-- product ("The PAIDS Roadmap for Professionals").

-- ─── 2 real gaps: PDF already in Storage, no product row existed at all ─────
-- niche-clarity-workbook: this is a live BUG fix, not just a catalog add -- the
-- /niche-clarity sales page (src/routes/niche-clarity.tsx) already queries for
-- this exact slug and has never been able to complete a real purchase because
-- the row never existed.
INSERT INTO public.products (slug, title, tagline, description, price_cents, currency, status, garden, download_path, is_free, requires_application, sort_order)
VALUES
  ('niche-clarity-workbook', 'The Niche Clarity Workbook — ICP Profiling + 3-Axis Niche Check', 'Stop guessing what to post. Lock in the one niche that fits your story, your skills, and your calling.', 'Stop guessing what to post. Lock in the one niche that fits your story, your skills, and your calling — a real framework, not a "creator personality quiz."', 19900, 'ZAR', 'published', 'esev', 'niche-clarity-workbook.pdf', false, false, 223),
  ('paids-framework-workbook', 'PAIDS Framework Workbook', 'Map your 5 income streams — Products, Ads & Affiliates, Information, Deals, Services.', 'Map your 5 income streams — Products, Ads & Affiliates, Information, Deals, Services — so one deal falling through never breaks your month.', 89900, 'ZAR', 'published', 'esev', 'paids-framework-workbook.pdf', false, false, 224)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, tagline = EXCLUDED.tagline, description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents, garden = EXCLUDED.garden, download_path = EXCLUDED.download_path,
  is_free = EXCLUDED.is_free, requires_application = EXCLUDED.requires_application;

-- ─── 3 products live on Shopify with NO deliverable file anywhere accessible
-- to this session (not in Supabase Storage, not in product-lab, and the live
-- storefront can't be scraped for the actual paid PDF without buying it).
-- Seeded as draft with NO download_path -- cannot be published until the real
-- source file is found or rebuilt. Do not invent placeholder content for a
-- paid product. ────────────────────────────────────────────────────────────
INSERT INTO public.products (slug, title, tagline, description, price_cents, currency, status, garden, is_free, requires_application, sort_order)
VALUES
  ('imposter-syndrome-fix', 'The Imposter Syndrome Fix', 'Break the "Who Am I?" loop.', 'Break the "Who Am I?" loop that keeps you from showing up. (Source PDF not found anywhere accessible to this migration — needs sourcing before publish.)', 19900, 'ZAR', 'draft', 'esev', false, false, 225),
  ('first-brand-deal-script', 'Your First Brand Deal Script', 'The POSSESS Brand Pitch Template.', 'The POSSESS Brand Pitch Template — exactly what to say to land your first brand deal. (Source PDF not found anywhere accessible to this migration — needs sourcing before publish. Distinct from the already-imported "brand-deal-sprint" — different product, similar name.)', 14900, 'ZAR', 'draft', 'esev', false, false, 226),
  ('sars-creator-income', 'SARS & Creator Income — What Nobody Tells You', 'What SARS actually expects from your content income.', 'What SARS actually expects from your content income — what nobody tells you before the assessment arrives. (Source PDF not found anywhere accessible to this migration — needs sourcing before publish. Possible overlap with the already-live "tax-creator-bundle" — check before publishing both.)', 14900, 'ZAR', 'draft', 'esev', false, false, 227),
  ('content-creator-starter-system', 'The Content Creator Starter System', 'Your complete 4E + SEEDS + PAIDS operating system.', 'Your complete 4E + SEEDS + PAIDS operating system. (Source PDF not found anywhere accessible to this migration — needs sourcing before publish. NAME COLLISION FLAG: this is NOT the same product as the already-live "creator-starter-system" / "START HERE: The Creator Starter System" (R49, beginner-focused, real PDF) — Shopify''s version is framed as a comprehensive operating system, not a beginner starter. Confirm these are genuinely two different products before publishing this one.)', 29900, 'ZAR', 'draft', 'esev', false, false, 228)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, tagline = EXCLUDED.tagline, description = EXCLUDED.description,
  garden = EXCLUDED.garden, is_free = EXCLUDED.is_free, requires_application = EXCLUDED.requires_application;
