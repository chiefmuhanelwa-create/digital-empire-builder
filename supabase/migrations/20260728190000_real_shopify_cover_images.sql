-- =============================================================================
-- Replace generated PDF-page-1 covers with the REAL product images from the
-- live Shopify store (contentcreatorhub.online), per explicit founder
-- instruction: "Use the same mockups from the shopify for the live products."
-- Images downloaded directly from Shopify's CDN and re-hosted in this
-- project's own `product-covers` bucket (under a shopify-real/ prefix so
-- they're not confused with the PyMuPDF-generated ones they replace).
-- =============================================================================

update public.products set cover_image_url =
  'https://usxjlylquvrmlwxykgyt.supabase.co/storage/v1/object/public/product-covers/shopify-real/' || v.file, updated_at = now()
from (values
  ('what-to-post', 'what-to-post.png'),
  ('niche-clarity-workbook', 'niche-clarity-workbook.png'),
  ('content-creator-starter-system', 'content-creator-starter-system.png'),
  ('african-creator-growth', 'african-creator-growth.png'),
  ('30-day-content-calendar', '30-day-content-calendar.png'),
  ('imposter-syndrome-fix', 'imposter-syndrome-fix.png'),
  ('monetise-your-expertise', 'monetise-your-expertise.png'),
  ('first-brand-deal-script', 'first-brand-deal-script.png'),
  ('sars-creator-income', 'sars-creator-income.png'),
  ('paids-framework-workbook', 'paids-framework-workbook.png'),
  ('creator-starter-bundle', 'creator-starter-bundle.png'),
  ('personal-branding-blueprint-course', 'personal-branding-blueprint-course.webp'),
  ('influencers-code-ebook', 'influencers-code-ebook.png')
) as v(slug, file)
where public.products.slug = v.slug;
