-- Seed BLOCKER-003: Seed the owner's qualification record so the premium checkout
-- gate is unlocked. Ndivhuwo passes every evaluator threshold by a wide margin
-- (3M+ followers, 4,895-subscriber email list, 5 PAIDS income streams, R600K+ annual).
-- WHERE NOT EXISTS makes this idempotent — safe to run multiple times.

INSERT INTO public.client_stewardship_applications (
  email,
  full_name,
  follower_count,
  engagement_rate,
  posts_consistently_4x,
  owns_email_list,
  email_subscribers_count,
  has_products_for_sale,
  monthly_income_value,
  income_streams_count,
  largest_stream_percentage,
  determined_routing_status,
  assigned_package_recommendation,
  vulnerability_phase_tag,
  raw_answers,
  created_at
)
SELECT
  'chiefmuhanelwa@gmail.com',
  'Ndivhuwo Muhanelwa',
  3000000,   -- 3M+ cross-platform (Facebook 1M+, Instagram ~780K, TikTok/YT)
  8,         -- approx 8% engagement rate across platforms
  true,      -- posts 4+ times per week (documented, daily posting)
  true,      -- owns email list (4,895 confirmed MailerLite subscribers)
  4895,      -- verified subscriber count
  true,      -- products for sale (5 published on CHKPLT + Shopify store)
  300000,    -- R300,000+/month (2026 revenue, from published Contentpreneur book)
  5,         -- 5 income streams: Products/Ads+Affiliates/Information/Deals/Services (PAIDS)
  25,        -- largest stream ~25% (balanced across PAIDS — no single dominant stream)
  'QUALIFIED_FOR_CORE_PROGRAM',
  'Scale Package',
  'STAGE_5_COMMUNITY',
  jsonb_build_object(
    'note', 'Owner seed — verified proof numbers from CLAUDE.md and published Contentpreneur book',
    'source', 'admin_seed'
  ),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_stewardship_applications
  WHERE email = 'chiefmuhanelwa@gmail.com'
    AND determined_routing_status = 'QUALIFIED_FOR_CORE_PROGRAM'
);
