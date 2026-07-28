-- Adds "was Rxxx" strikethrough pricing support, matching the real live
-- Shopify product cards (contentcreatorhub.online) fetched and parsed
-- 2026-07-28 -- part of replicating that catalog's actual visual design on
-- CHKPLT's own /products pages.
alter table public.products
  add column if not exists compare_at_price_cents integer;

comment on column public.products.compare_at_price_cents is
  'Optional "was" price shown struck through next to the real price. Null = no compare-at shown. Never invent a value here without a real source.';

-- Populate only where we have a REAL confirmed compare-at price, scraped
-- directly from the live Shopify product cards today. Not invented for any
-- product where this wasn't directly observed.
update public.products set compare_at_price_cents = 29900 where slug = 'niche-clarity-workbook';       -- was R299
update public.products set compare_at_price_cents = 59700 where slug = 'monetise-your-expertise';      -- was R597
update public.products set compare_at_price_cents = 149900 where slug = 'paids-framework-workbook';    -- was R1,499
update public.products set compare_at_price_cents = 59700 where slug = 'african-creator-growth';       -- was R597
update public.products set compare_at_price_cents = 24900 where slug = '30-day-content-calendar';      -- was R249
