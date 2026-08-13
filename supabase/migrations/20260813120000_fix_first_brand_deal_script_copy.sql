-- =============================================================================
-- first-brand-deal-script — customer-facing copy repair.
--
-- Third instance of the same failure already fixed in 20260729210000 and
-- 20260729230000: the bulk-import migration's own authoring note was written
-- straight into the `description` column and shipped. Live shoppers on
-- https://chkplt.com/products/first-brand-deal-script were reading
-- "(Source PDF not found anywhere accessible to this migration — needs
-- sourcing before publish. Distinct from the already-imported
-- 'brand-deal-sprint' — different product, similar name.)"
-- `description` renders FIRST on the product page (products.$slug.tsx:206),
-- so this was the first sentence of the sales page.
--
-- Two further corrections in the same pass:
--   1. `tagline` said "The POSSESS Brand Pitch Template." POSSESS is the
--      ICP 1 (Contentpreneur / Called Expert) framework and is never used in
--      ICP 2 creator copy. Replaced with the product's real subtitle.
--   2. `benefits` listed a "3-Level Pitch Strategy — entry, standard,
--      premium" that does not appear in the actual 14-page PDF. Replaced
--      with the real contents, sourced from
--      shopify/docs/paystack-product-pages.md §3.
--
-- All proof figures below are from the verified table only. The source PDF's
-- internal numbers (Samsung R45K, "R100,000 deals") are NOT verified and are
-- deliberately not used — R350 first deal and the Savanna R25,000/month × 4
-- retainer are.
-- =============================================================================

update public.products set
  tagline = 'The 4 fill-in scripts that turn one clear message into your first paid brand deal — no big following required.',

  description = 'You''re posting every day. Brands engage. And still nothing pays. That''s not a follower problem — that''s a pitch problem.',

  long_description = 'For years I opened every pitch with "I''m a creator with X followers." That''s a CV nobody asked for. No wonder I got ghosted.

My first brand deal in 2017 paid R350 for one post to 500,000+ followers. The second, that same month, paid R750. Nothing about my audience changed after that — my pitch did. The same skill later turned into a R25,000-a-month Savanna retainer, four months straight. R100,000 that paid off my car debt.

Discovery is a myth. Pitching is the job. Most creators either pitch too low and get underpaid, or never pitch at all and earn nothing. This removes both problems — the exact scripts I wish I''d had in 2016, every one under 150 words, because brands reply to clear pitches, not long ones.

Fill in the brackets. Send it this week.',

  benefits = '["The 4-Part Pitch — Who I Am · Who Trusts Me · What I''ll Deliver · What It''s Worth","Script 1 — The Cold Pitch, for a brand that has never heard of you","Script 2 — The Warm Pitch, for a brand already engaging with you","Script 3 — The Upgrade Pitch, turn a one-off into a monthly retainer","The WhatsApp DM version, for SA brands that prefer informal contact","The Counter-Offer Script — exactly what to say when a brand lowballs you","SA rate benchmarks — what creators actually charge in 2026, by platform and follower tier","After They Say Yes — Brief → Deliver → Invoice, so you actually get paid","Your 24-Hour Pitch checklist and commitment page"]'::jsonb,

  format = 'PDF guide + 4 fill-in scripts · 14 pages · instant download',

  target_audience = 'The SA creator posting daily, recommending products for free, waiting to be discovered — whether you''ve never pitched or you''ve pitched and been ghosted.',

  updated_at = now()
where slug = 'first-brand-deal-script';
