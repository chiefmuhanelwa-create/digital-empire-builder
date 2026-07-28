-- Sets cover_image_url for the products imported in this session's Phase 2D
-- work — images generated from each PDF's real page 1 (via PyMuPDF), uploaded
-- to the product-covers Storage bucket. Uses the bucket's public URL pattern,
-- matching how the existing (pre-import) products already reference their
-- covers (see creator-starter-system.cover_image_url for the exact pattern).
update public.products set cover_image_url = 'https://usxjlylquvrmlwxykgyt.supabase.co/storage/v1/object/public/product-covers/' || slug || '.png'
where slug in (
  'niche-formula','creator-reboot','post-scared','caption-formula','first-r1000-sprint',
  'five-income-streams','freebies-to-paid','whatsapp-selling','find-your-product',
  'content-to-cash','african-creator-growth','phone-to-profit','contract-red-flags',
  'deal-decision-framework','agency-intelligence-guide','agency-lens','brand-deal-sprint',
  'cold-pitch-email','concept-survival-guide','creator-readiness-kit',
  'post-campaign-upsell-kit','whatsapp-scripts','creator-loa',
  'niche-clarity-workbook','paids-framework-workbook'
)
and cover_image_url is null;
