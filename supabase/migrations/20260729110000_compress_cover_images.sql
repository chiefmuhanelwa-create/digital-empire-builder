-- =============================================================================
-- The real Shopify cover images (re-hosted 2026-07-28) were uploaded at full
-- Shopify-CDN resolution (300-480KB PNGs each) — a real contributor to the
-- "site is lagging, takes seconds to show products" report. Resized to a
-- sane grid-thumbnail size (max edge 900px) and converted PNG/WEBP -> JPEG
-- (quality 72) via sips, cutting every file to 50-95KB. Same storage path,
-- just a .jpg extension now.
-- =============================================================================

update public.products set
  cover_image_url = 'https://usxjlylquvrmlwxykgyt.supabase.co/storage/v1/object/public/product-covers/shopify-real/' || v.file,
  updated_at = now()
from (values
  ('what-to-post', 'what-to-post.jpg'),
  ('niche-clarity-workbook', 'niche-clarity-workbook.jpg'),
  ('content-creator-starter-system', 'content-creator-starter-system.jpg'),
  ('african-creator-growth', 'african-creator-growth.jpg'),
  ('30-day-content-calendar', '30-day-content-calendar.jpg'),
  ('imposter-syndrome-fix', 'imposter-syndrome-fix.jpg'),
  ('monetise-your-expertise', 'monetise-your-expertise.jpg'),
  ('first-brand-deal-script', 'first-brand-deal-script.jpg'),
  ('sars-creator-income', 'sars-creator-income.jpg'),
  ('paids-framework-workbook', 'paids-framework-workbook.jpg'),
  ('creator-starter-bundle', 'creator-starter-bundle.jpg'),
  ('personal-branding-blueprint-course', 'personal-branding-blueprint-course.jpg'),
  ('influencers-code-ebook', 'influencers-code-ebook.jpg')
) as v(slug, file)
where public.products.slug = v.slug;
