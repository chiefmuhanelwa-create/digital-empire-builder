
-- 1. New fields on products
alter table public.products
  add column if not exists long_description text,
  add column if not exists benefits jsonb default '[]'::jsonb,
  add column if not exists download_path text;

-- 2. Private storage bucket for product files (PDFs etc.)
insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

-- No RLS policies needed — uploads and signed-URL downloads are issued by the
-- server-side admin client (service role), which bypasses RLS.

-- 3. Insert Influencer's Code (ebook + print)
insert into public.products
  (slug, title, tagline, description, garden, price_cents, currency, status, format, target_audience, sort_order, is_free)
values
  (
    'influencers-code-ebook',
    'The Influencer''s Code (eBook)',
    'CRACK THE CODE OF PERSONAL BRANDING',
    'The unfiltered playbook from the creator who turned a dropout story into a R600K+/year content business — Netflix, Samsung, DSTV, Red Bull, and 3M+ followers across platforms.

Inside, NoChill God hands you the exact mental shifts, content frameworks, and platform-by-platform tactics he wishes someone had handed him when he started. 14 chapters. Zero fluff. Everything that actually worked.',
    'devarim', 14900, 'ZAR', 'published',
    'eBook (PDF, instant download — read on phone, tablet, or laptop)',
    'Aspiring and growing creators who want to stop guessing and start building a personal brand that pays.',
    10, false
  ),
  (
    'influencers-code-print',
    'The Influencer''s Code (Print)',
    'THE BOOK ON YOUR SHELF, NOT JUST YOUR PHONE',
    'The hardback edition of NoChill God''s first book — the one that started it all. 200+ pages, designed to live on your desk and get marked up, dog-eared, and re-read every time you forget who you are.

Same 14 chapters as the eBook, but in a format you can hand to your mentee, gift to a friend, or sign for the kid who asks "how did you do it?"',
    'devarim', 32000, 'ZAR', 'published',
    'Physical print book (delivered in South Africa) + eBook copy included free',
    'Creators who learn better off-screen and want a signed-shelf reminder of what they''re building.',
    11, false
  )
on conflict (slug) do nothing;
