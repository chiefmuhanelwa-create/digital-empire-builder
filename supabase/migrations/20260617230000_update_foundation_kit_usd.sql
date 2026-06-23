-- Switch Called Expert Foundation Kit to USD pricing ($97)
-- Run manually in Supabase SQL Editor
UPDATE public.products
SET
  price_cents = 9700,
  currency    = 'USD'
WHERE slug = 'called-expert-foundation-kit';
