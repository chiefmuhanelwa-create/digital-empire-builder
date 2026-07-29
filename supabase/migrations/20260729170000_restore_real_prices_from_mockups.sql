-- =============================================================================
-- The 7 locked products got auto-synced ONE FINAL TIME by the daily FX-sync
-- cron on 2026-07-29 04:10 UTC — the code fix removing them from USD_DISPLAY
-- was committed and deployed at 04:11 UTC, one minute after that day's cron
-- had already fired using the old code. It will not happen again (confirmed:
-- these 7 slugs are gone from USD_DISPLAY in the deployed source), but the
-- DB values were left at the stale auto-synced numbers. Restored here by
-- reading the actual price printed on each product's own cover mockup image
-- (the founder's own uploaded artwork) — the real source of truth.
-- =============================================================================

update public.products set price_cents = 14900, updated_at = now() where slug = 'what-to-post';               -- R149 on mockup
update public.products set price_cents = 19900, updated_at = now() where slug = '30-day-content-calendar';    -- R199 on mockup
update public.products set price_cents = 19900, updated_at = now() where slug = 'niche-clarity-workbook';     -- R199 on mockup
update public.products set price_cents = 19900, updated_at = now() where slug = 'african-creator-growth';     -- R199 on mockup
update public.products set price_cents = 14900, updated_at = now() where slug = 'monetise-your-expertise';    -- R149 on mockup
update public.products set price_cents = 89900, updated_at = now() where slug = 'paids-framework-workbook';   -- R899 on mockup
update public.products set price_cents = 14900, updated_at = now() where slug = 'influencers-code-ebook';     -- no price on mockup — founder confirmed R149 (prior known value)
