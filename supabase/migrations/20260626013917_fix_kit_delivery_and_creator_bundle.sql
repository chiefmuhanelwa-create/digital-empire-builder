-- Fix the $97 kit delivery + split out the (mis-attached) creator PDFs.
-- Idempotent. Run in the Supabase SQL editor on project usxjlylquvrmlwxykgyt.

-- 1. The Called Expert Foundation Kit now delivers via the workspace
--    (/dashboard/foundation-kit: apps + Personal Branding course + per-framework
--    workbooks). Detach the old ZIP of creator PDFs so it's never served as the kit.
UPDATE products
SET download_path = NULL, updated_at = now()
WHERE slug = 'called-expert-foundation-kit';

-- 2. Register the 5 creator PDFs (Tax / What To Post / 90-Day / Niche / Monetise)
--    as their OWN ICP-2 product. Created as DRAFT — set the real price, then publish.
--    download_path points at the existing ZIP file already in the product-files bucket.
INSERT INTO products (slug, title, tagline, description, price_cents, currency, status, garden, download_path, is_free, requires_application, sort_order)
SELECT
  'creator-launch-bundle',
  'The Creator Launch Bundle',
  '5 plug-and-play guides to start earning as a creator.',
  'Five creator playbooks in one download: Find Your Niche, What To Post (30-Day Content Calendar), The 90-Day Creator Blueprint, Monetise Your Expertise, and The Tax Creator Bundle. (ICP-2 / Content Creators Hub.)',
  49900,            -- R499.00 placeholder — set your real price before publishing
  'ZAR',
  'draft',
  'esev',
  'called-expert-foundation-kit.zip',  -- existing ZIP file (rename later if desired)
  false,
  false,
  100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'creator-launch-bundle');
