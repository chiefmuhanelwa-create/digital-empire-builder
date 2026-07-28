# Phase 2D — Creator's Hub Catalog Import Into CHKPLT

> **Who this is for:** anyone picking up where this import left off — no prior context needed.

## What happened, 2026-07-28

23 product-lab PDFs got imported into CHKPLT's `products` table, plus one price fix on an existing product. This is Phase 2D of the Shopify-retirement plan — CHKPLT is meant to become the one store, replacing contentcreatorhub.online (Shopify).

**14 published, real, buyable right now:**
Niche Formula (R99), Creator Reboot (R149), Post Scared (R149), Caption Formula (R149), First R1,000 Sprint (R197), 5 Income Streams (R249), Freebies to Paid (R299), WhatsApp Selling System (R249), Find Your Product (R149), Content to Cash (R397), African Creator Growth (R397), Phone to Profit (R699), Contract Red Flags (R149), Deal Decision Framework (R99).

**9 seeded as `status: 'draft'`, NOT buyable yet** — pipeline.md listed these with a "TBD" price, so a real price was never invented for them: Agency Intelligence Guide, Agency Lens, Brand Deal Sprint, Cold Pitch Email, Concept Survival Guide, Creator Readiness Kit, Post-Campaign Upsell Kit, WhatsApp Scripts, Creator's Letter of Award Template. Each has a real, uploaded PDF and a placeholder R199 price purely so the admin panel has something to edit — **do not assume R199 is correct, set the real price before publishing.**

**1 price fix, not a new product:** `30-day-content-calendar` was live at R99 — the exact same product as product-lab's docs describe at R149 under a different working title. Founder confirmed R149 is canonical when asked directly. Fixed via `UPDATE`, not a duplicate row.

## How to finish publishing the 9 draft products

1. Go to `/admin/products` (logged in as admin).
2. Find each draft product (search by name above).
3. Set the real price (replacing the R199 placeholder).
4. Flip status to `published`.
5. That's it — `download_path` is already set correctly, pointing at the real PDF already uploaded.

## Two things flagged, not resolved — need a founder decision, not a guess

While checking for duplicates before importing, two *existing* CHKPLT products turned up that might already cover 2 of the "6 already-live-on-Shopify" products this whole migration is meant to eventually replace:

- **`tax-creator-bundle`** ("The Tax Creator Bundle," already live) — its benefits copy ("Real lessons from a R207,879 assessment") strongly suggests this already supersedes Shopify's standalone "Tax For Content Creators" (R299) product. Before that Shopify product is considered "migrated," confirm whether this bundle is meant to replace it outright, sit alongside it, or whether the standalone R299 version still needs its own row in CHKPLT.
- **`niche-bundle`** ("The Niche Bundle," already live) — likely the same relationship to Shopify's standalone "Niche Clarity Workbook" (R199).

Also worth knowing: **`niche-clarity-workbook.pdf` already exists in the `product-files` Storage bucket, but there's no `products` row for that exact slug** — the live `/niche-clarity` sales page on CHKPLT queries for a product row that doesn't currently exist, meaning that page can't actually complete a purchase right now (it would show a fallback "$16" price and likely fail at checkout). This predates this import and isn't something this session caused — flagging it since it surfaced during this work.

**Don't decide these two silently in a future session** — they're genuine business questions (is a bundle the same product as the thing it bundles, pricing-wise and catalog-wise?), not something to resolve by guessing.

## What did NOT get imported, on purpose

- The 72 "brief"-stage folders in `product-lab/products/briefs/` — planning docs, not real deliverables.
- The 10 standalone web-tool apps (`product-lab/web-tools/*` — hooks generator, rate card calculator, etc.) — these remain separate, live Vercel apps; relinking them into CHKPLT's catalog (even just as external links) is separate follow-up work, not done in this pass.
- Personal Branding course and PAIDS Framework Workbook (2 of the "6 already live on Shopify") — no matching existing-or-new-row check was done for these specifically; check before assuming they're covered.

## Change Log

### 2026-07-28 — 23 products imported, 1 price fixed
- Uploaded 23 PDFs to the `product-files` Storage bucket via `supabase storage cp --experimental` (the CLI's own authenticated session — no service-role key needed for this, unlike the earlier fx-sync trigger).
- Migration: `supabase/migrations/20260728120000_import_creators_hub_catalog.sql`.
- Verified live via direct REST query: 14 new rows published and buyable, 9 correctly invisible to anonymous queries (still draft), the price fix confirmed on `30-day-content-calendar`.
- 2 potential overlaps flagged above, not resolved — needs the founder, not a guess.
