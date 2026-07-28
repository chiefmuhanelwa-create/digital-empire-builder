-- =============================================================================
-- "Only show what's actually live on Shopify" (2026-07-28) — plus a real
-- constraint discovered while implementing it: several products (Foundation
-- Kit, Accelerator, Community, Inner Circle, etc.) MUST stay status:'published'
-- because contentpreneur.africa's dedicated /foundation and /accelerator pages
-- depend on them for real checkout — unpublishing would break those live
-- funnels. So this is NOT the same thing as "hide from the site" — it's "hide
-- from this specific marketplace grid, while remaining fully purchasable via
-- direct link." New column for exactly that distinction.
-- =============================================================================

alter table public.products
  add column if not exists show_in_marketplace boolean not null default true;

comment on column public.products.show_in_marketplace is
  'Whether this product appears in the general CHKPLT marketplace grid (/ and /products). false = still published/purchasable via direct link, just not listed here — used for products with their own dedicated funnel elsewhere (e.g. contentpreneur.africa).';

-- ── Exclude the ICP1 flagship products — they have dedicated funnels on
-- contentpreneur.africa (Foundation Kit, Accelerator) or are a different
-- product category entirely (Community, Inner Circle, Facilitator,
-- Foundations Course) — not "tools, workbooks, templates" in the Creator's
-- Hub sense this marketplace grid is now scoped to. Still fully published.
update public.products set show_in_marketplace = false
where slug in (
  'called-expert-foundation-kit', 'called-expert-foundation-kit-bonus',
  'called-expert-foundations', 'called-expert-facilitator',
  'called-expert-inner-circle', 'called-expert-starter-bundle',
  'contentpreneur-90day-cohort', 'creator-starter-system',
  'creator-swipe-vault', 'asset-accelerator', 'contentpreneur-community'
);

-- ── Unpublish (draft) the product-lab imports NOT confirmed present on the
-- real live Shopify site (contentcreatorhub.online, scraped directly
-- 2026-07-28) -- not deleted, just hidden, per this project's standing
-- discipline of never destroying imported work.
update public.products set status = 'draft', updated_at = now()
where slug in (
  'niche-formula','creator-reboot','post-scared','caption-formula',
  'first-r1000-sprint','five-income-streams','freebies-to-paid',
  'whatsapp-selling','find-your-product','content-to-cash','phone-to-profit',
  'contract-red-flags','deal-decision-framework','niche-bundle','tax-creator-bundle'
);

-- ── Add the 2 real Shopify products that turned out to be missing entirely
-- from CHKPLT (found while cross-checking this filter) -- no source file
-- anywhere accessible to this session, same "draft, no download_path, don't
-- invent content" pattern as the other no-file gaps found earlier.
insert into public.products (slug, title, tagline, description, price_cents, currency, status, garden, is_free, requires_application, sort_order, show_in_marketplace)
values
  ('creator-starter-bundle', 'Creator Starter Bundle', 'Everything to start, bundled.', 'Everything to start, bundled. (Source files not found anywhere accessible to this migration -- needs sourcing before publish. Live on Shopify at R499.)', 79900, 'ZAR', 'draft', 'esev', false, false, 229, true),
  ('personal-branding-blueprint-course', 'Personal Branding Blueprint Course', 'The full course, not just a workbook.', 'The full course, not just a workbook. (Source files not found anywhere accessible to this migration -- needs sourcing before publish. Live on Shopify at R599.)', 99900, 'ZAR', 'draft', 'esev', false, false, 230, true)
on conflict (slug) do update set
  title = excluded.title, tagline = excluded.tagline, description = excluded.description,
  garden = excluded.garden, is_free = excluded.is_free, requires_application = excluded.requires_application,
  show_in_marketplace = excluded.show_in_marketplace;
