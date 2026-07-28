-- =============================================================================
-- Founder uploaded new cover images via the admin panel (2026-07-28,
-- ~03:38-03:56 UTC) — a later migration this same session (the cover-image
-- compression pass) blindly overwrote cover_image_url back to its own
-- generated paths for these exact slugs, undoing that manual work without
-- knowing it had happened. The founder's uploads were never deleted, just
-- orphaned in storage. Restoring the pointer to the founder's own uploads
-- (the newest timestamped file per slug, confirmed via storage listing).
-- =============================================================================

update public.products set
  cover_image_url = 'https://usxjlylquvrmlwxykgyt.supabase.co/storage/v1/object/public/product-covers/' || v.file,
  updated_at = now()
from (values
  ('influencers-code-ebook', 'influencers-code-ebook-1785209932726.png'),
  ('what-to-post', 'what-to-post-1785210401244.png'),
  ('30-day-content-calendar', '30-day-content-calendar-1785210436467.png'),
  ('monetise-your-expertise', 'monetise-your-expertise-1785210516880.png'),
  ('african-creator-growth', 'african-creator-growth-1785210606779.png'),
  ('niche-clarity-workbook', 'niche-clarity-workbook-1785210656277.png'),
  ('paids-framework-workbook', 'paids-framework-workbook-1785210811037.png'),
  ('imposter-syndrome-fix', 'imposter-syndrome-fix-1785210836822.png'),
  ('first-brand-deal-script', 'first-brand-deal-script-1785210871679.png'),
  ('sars-creator-income', 'sars-creator-income-1785210989487.png'),
  ('content-creator-starter-system', 'content-creator-starter-system-1785211014387.png')
) as v(slug, file)
where public.products.slug = v.slug;
