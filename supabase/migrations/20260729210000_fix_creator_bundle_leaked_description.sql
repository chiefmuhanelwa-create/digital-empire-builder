-- =============================================================================
-- creator-starter-bundle's tagline/description were never touched by the later
-- "make it free" (20260729130000) or download-fix (20260729160000) migrations
-- — both only edited long_description/benefits/format. The ORIGINAL row insert
-- (20260728180000) left an internal sourcing note as the live, customer-facing
-- description: "(Source files not found anywhere accessible to this migration
-- -- needs sourcing before publish. Live on Shopify at R499.)" — a real leak,
-- caught by the founder reading the live product page. Replaced with real
-- copy describing what's actually inside (Niche Clarity Workbook + PAIDS
-- Framework Workbook, per the same content already used in long_description).
-- =============================================================================

update public.products set
  tagline = 'Two free workbooks: find your niche, then build your income system.',
  description = 'Free starter bundle for creators who are posting consistently but still not converting. Two guided PDFs — the Niche Clarity Workbook and the PAIDS Framework Workbook — walk you from "what do I even post about" to a documented niche and a real 5-stream income plan. No card, no catch.',
  updated_at = now()
where slug = 'creator-starter-bundle';
