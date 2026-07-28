-- =============================================================================
-- Found while verifying the "only what's live on Shopify" filter: 2 products
-- were slipping into the marketplace grid that don't belong there.
--
-- influencers-code-print: the real Shopify store lists exactly ONE
-- "Influencer's Code" product (R150/R299) — there is no separate print
-- listing there. It also has no download_path (it's a physical hardback,
-- shipped, not instantly delivered), which is fundamentally incompatible
-- with this marketplace's "instant digital delivery" promise. Hide it here;
-- leave it purchasable via direct link if a manual/shipped-order flow is
-- ever wired up for it later.
--
-- 90-day-creator-blueprint: an older CHKPLT-native product covering the same
-- "90-day plan to grow + monetise" concept as the real Shopify listing
-- (which is african-creator-growth, R397, exact title/price match already
-- verified). Shopify has only ONE such listing — showing both would be a
-- duplicate on the shelf. Keeping african-creator-growth (the confirmed
-- match) and hiding this one, not deleting it.
-- =============================================================================

update public.products set show_in_marketplace = false, updated_at = now()
where slug in ('influencers-code-print', '90-day-creator-blueprint');
