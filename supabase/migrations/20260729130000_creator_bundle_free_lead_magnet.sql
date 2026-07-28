-- =============================================================================
-- Creator Starter Bundle: founder decision (2026-07-29) — drop it from a paid
-- 3-product bundle (Niche Clarity + Influencer's Code + PAIDS, R499) down to
-- just 2 (Niche Clarity + PAIDS), and make it a FREE lead magnet instead of a
-- sale item. The Influencer's Code stays available on its own
-- (influencers-code-ebook, R149) rather than inside this bundle.
-- =============================================================================

update public.products set
  price_cents = 0,
  is_free = true,
  compare_at_price_cents = null,
  download_path = 'creator-starter-bundle-v2.zip',
  long_description = 'You''ve been posting. You''ve been consistent. But nothing is converting — because you''re missing two things: clarity on your niche, and a real monetisation system. This free bundle gives you both, built specifically for South African creators.',
  benefits = '["The Niche Clarity Workbook — a 7-step, 90-minute guided workbook to a documented niche and content pillars","PAIDS Framework Workbook — the complete 5-income-stream implementation guide","Both PDFs, instant access, mobile-friendly","Free — no card required"]'::jsonb,
  format = 'Bundle: 2 PDFs, instant download (single .zip)',
  updated_at = now()
where slug = 'creator-starter-bundle';
