-- =============================================================================
-- Phase 2D: import the Creator's Hub / product-lab catalog into CHKPLT.
-- Source: product-lab/products/pipeline.md + each product's real, finished
-- index.html (title/subtitle extracted programmatically, not invented) and
-- its already-rendered PDF (uploaded to the product-files Storage bucket in
-- this same session, filename = "<slug>.pdf" for every row below).
--
-- Excluded from this import: content-calendar-system — it's the SAME product
-- as the already-live 30-day-content-calendar (R99), just under a different
-- name/price in product-lab's docs. Reconciled below (price fix), not
-- duplicated as a new row, per the founder's confirmed decision that the
-- R149 Content Calendar is canonical.
--
-- 12 products below have a real, confirmed price (from pipeline.md). 9 more
-- (the "Agency & Advanced" set) show "TBD" pricing in pipeline.md — seeded as
-- status:'draft' so they can't be bought at an invented price; flip to
-- 'published' once a real price is set (see this migration's companion
-- runbook, product-lab/products/RUNBOOK-CHKPLT-IMPORT.md).
--
-- Idempotent: ON CONFLICT (slug) DO UPDATE, same pattern as every other
-- product seed in this project.
-- =============================================================================

-- ─── Fix the confirmed price/name drift on the existing product ─────────────
-- "The NOCHILL 30-Day Content Calendar" was live at R99; product-lab's docs
-- (and the founder, when asked directly) confirm R149 as canonical.
UPDATE public.products
SET price_cents = 14900, updated_at = now()
WHERE slug = '30-day-content-calendar';

-- ─── 12 products with confirmed real prices ──────────────────────────────────
INSERT INTO public.products (slug, title, tagline, description, price_cents, currency, status, garden, download_path, is_free, requires_application, sort_order)
VALUES
  ('niche-formula', 'Your Niche. 30 Minutes. Done.', 'Find the one niche that pays — without quitting your current content or starting over.', 'Find the one niche that pays — without quitting your current content or starting over.', 9900, 'ZAR', 'published', 'esev', 'niche-formula.pdf', false, false, 200),
  ('creator-reboot', 'Creator Reboot: Back in 7 Days', 'The 7-day plan to get back online after a burnout — without losing your audience or your confidence.', 'The 7-day plan to get back online after a burnout — without losing your audience or your confidence.', 14900, 'ZAR', 'published', 'esev', 'creator-reboot.pdf', false, false, 201),
  ('post-scared', 'Post Scared: 30 Days to Showing Up', '30 days of showing up before the fear goes away — because it doesn''t go away first.', '30 days of showing up before the fear goes away — because it doesn''t go away first.', 14900, 'ZAR', 'published', 'esev', 'post-scared.pdf', false, false, 202),
  ('caption-formula', 'The NOCHILL Caption Formula', '10 caption formulas that stop the scroll — 3 ready-to-post captions for any topic, in 30 seconds.', '10 caption formulas that stop the scroll — 3 ready-to-post captions for any topic, in 30 seconds.', 14900, 'ZAR', 'published', 'esev', 'caption-formula.pdf', false, false, 203),
  ('first-r1000-sprint', 'The First R1,000 Sprint', 'The 16-day sprint to your first R1,000 — from your phone, without going viral.', 'The 16-day sprint to your first R1,000 — from your phone, without going viral.', 19700, 'ZAR', 'published', 'esev', 'first-r1000-sprint.pdf', false, false, 204),
  ('five-income-streams', '5 Income Streams in 30 Days', 'Build 5 income taps in 30 days — so one deal falling through never breaks your month again.', 'Build 5 income taps in 30 days — so one deal falling through never breaks your month again.', 24900, 'ZAR', 'published', 'esev', 'five-income-streams.pdf', false, false, 205),
  ('freebies-to-paid', 'From Freebies to Paid in 14 Days', 'The 14-day plan to end gifted campaigns and start getting paid — without upsetting the brand.', 'The 14-day plan to end gifted campaigns and start getting paid — without upsetting the brand.', 29900, 'ZAR', 'published', 'esev', 'freebies-to-paid.pdf', false, false, 206),
  ('whatsapp-selling', 'The WhatsApp Selling System', 'The complete system for selling digital products through WhatsApp — broadcasts, scripts, payment links, all done.', 'The complete system for selling digital products through WhatsApp — broadcasts, scripts, payment links, all done.', 24900, 'ZAR', 'published', 'esev', 'whatsapp-selling.pdf', false, false, 207),
  ('find-your-product', 'Find Your Digital Product in 90 Minutes', 'Find, build, and price a digital product in 90 minutes — from what you already know.', 'Find, build, and price a digital product in 90 minutes — from what you already know.', 14900, 'ZAR', 'published', 'esev', 'find-your-product.pdf', false, false, 208),
  ('content-to-cash', 'Content to Cash', 'The 7-day launch framework — from idea to first sale, without perfectionism killing it.', 'The 7-day launch framework — from idea to first sale, without perfectionism killing it.', 39700, 'ZAR', 'published', 'esev', 'content-to-cash.pdf', false, false, 209),
  ('african-creator-growth', '90-Day African Creator Growth System', 'A 90-day growth system built on SA benchmarks — because American tactics don''t grow African audiences.', 'A 90-day growth system built on SA benchmarks — because American tactics don''t grow African audiences.', 39700, 'ZAR', 'published', 'esev', 'african-creator-growth.pdf', false, false, 210),
  ('phone-to-profit', 'From Phone to Profit', 'The 30-day business builder that turns your phone into a registered, income-generating media company.', 'The 30-day business builder that turns your phone into a registered, income-generating media company.', 69900, 'ZAR', 'published', 'esev', 'phone-to-profit.pdf', false, false, 211)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, tagline = EXCLUDED.tagline, description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents, garden = EXCLUDED.garden, download_path = EXCLUDED.download_path,
  is_free = EXCLUDED.is_free, requires_application = EXCLUDED.requires_application;

-- ─── 2 "Agency & Advanced" products with confirmed real prices ───────────────
INSERT INTO public.products (slug, title, tagline, description, price_cents, currency, status, garden, download_path, is_free, requires_application, sort_order)
VALUES
  ('contract-red-flags', 'Stop Signing Contracts That Cost You', '8 Warning Signs to Look For — and What to Say — Before You Sign Anything', '8 Warning Signs to Look For — and What to Say — Before You Sign Anything', 14900, 'ZAR', 'published', 'esev', 'contract-red-flags.pdf', false, false, 212),
  ('deal-decision-framework', 'Stop Saying Yes to Low Offers', '5 Quick Checks and Ready-Made Replies to Take It, Ask for More, or Say No — Without Upsetting the Brand', '5 Quick Checks and Ready-Made Replies to Take It, Ask for More, or Say No — Without Upsetting the Brand', 9900, 'ZAR', 'published', 'esev', 'deal-decision-framework.pdf', false, false, 213)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, tagline = EXCLUDED.tagline, description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents, garden = EXCLUDED.garden, download_path = EXCLUDED.download_path,
  is_free = EXCLUDED.is_free, requires_application = EXCLUDED.requires_application;

-- ─── 9 "Agency & Advanced" products with NO confirmed price ("TBD" in
-- pipeline.md) — seeded as draft. Do not invent a price; set a real one via
-- the admin panel, then flip status to 'published'. R199 below is a visible,
-- obviously-placeholder value, not a guess at the real price. ────────────────
INSERT INTO public.products (slug, title, tagline, description, price_cents, currency, status, garden, download_path, is_free, requires_application, sort_order)
VALUES
  ('agency-intelligence-guide', 'Stop Emailing Brands — Contact These People Instead', 'The complete SA agency map — 14+ agencies, their brands, and what gets you booked first.', 'The complete SA agency map — 14+ agencies, their brands, and what gets you booked first.', 19900, 'ZAR', 'draft', 'esev', 'agency-intelligence-guide.pdf', false, false, 214),
  ('agency-lens', 'Stop Guessing What Agencies Want', 'How SA agencies evaluate, shortlist, and book creators — and how to always make the shortlist.', 'How SA agencies evaluate, shortlist, and book creators — and how to always make the shortlist.', 19900, 'ZAR', 'draft', 'esev', 'agency-lens.pdf', false, false, 215),
  ('brand-deal-sprint', 'Brand Deal Sprint', 'The 7-day outbound sprint that lands your first proactive brand deal — in Rands, from your phone.', 'The 7-day outbound sprint that lands your first proactive brand deal — in Rands, from your phone.', 19900, 'ZAR', 'draft', 'esev', 'brand-deal-sprint.pdf', false, false, 216),
  ('cold-pitch-email', 'Stop Waiting for Brands to Find You', '5 email frameworks that get agency and brand responses — sent before they''ve found someone else.', '5 email frameworks that get agency and brand responses — sent before they''ve found someone else.', 19900, 'ZAR', 'draft', 'esev', 'cold-pitch-email.pdf', false, false, 217),
  ('concept-survival-guide', 'Concept Survival Guide', 'Why agencies reject creator concepts — and the pre-submission checklist that prevents 3 revision rounds.', 'Why agencies reject creator concepts — and the pre-submission checklist that prevents 3 revision rounds.', 19900, 'ZAR', 'draft', 'esev', 'concept-survival-guide.pdf', false, false, 218),
  ('creator-readiness-kit', 'Stop Losing Deals Because You''re Not Ready', 'The 9 Things Brands Ask For — Ready to Send in 24 Hours', 'The 9 Things Brands Ask For — Ready to Send in 24 Hours', 19900, 'ZAR', 'draft', 'esev', 'creator-readiness-kit.pdf', false, false, 219),
  ('post-campaign-upsell-kit', 'Post-Campaign Upsell Kit', 'Turn one brand deal into monthly income — starting within 48 hours of your last post.', 'Turn one brand deal into monthly income — starting within 48 hours of your last post.', 19900, 'ZAR', 'draft', 'esev', 'post-campaign-upsell-kit.pdf', false, false, 220),
  ('whatsapp-scripts', 'WhatsApp Scripts: Brand Deals', 'Know exactly what to say to any brand DM — and stop underselling yourself in the message that sets the tone for the entire negotiation.', 'Know exactly what to say to any brand DM — and stop underselling yourself in the message that sets the tone for the entire negotiation.', 19900, 'ZAR', 'draft', 'esev', 'whatsapp-scripts.pdf', false, false, 221),
  ('creator-loa', 'The Creator''s Letter of Award Template', 'One document that secures your work before the contract arrives.', 'One document that secures your work before the contract arrives.', 19900, 'ZAR', 'draft', 'esev', 'creator-loa.pdf', false, false, 222)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, tagline = EXCLUDED.tagline, description = EXCLUDED.description,
  garden = EXCLUDED.garden, download_path = EXCLUDED.download_path,
  is_free = EXCLUDED.is_free, requires_application = EXCLUDED.requires_application;
  -- NOTE: price_cents and status are deliberately NOT in this third DO UPDATE
  -- SET list — same reasoning as the Community migration: once a human sets a
  -- real price and publishes one of these, re-running this migration must not
  -- silently reset it back to the R199 placeholder / draft status.
