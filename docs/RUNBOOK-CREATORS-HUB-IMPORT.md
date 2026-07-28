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

### 2026-07-28 (later same day) — reconciled against the real live Shopify site + visual redesign
- Shopify came back up mid-session (was billing-locked, HTTP 402, earlier) — fetched `contentcreatorhub.online` directly and parsed its actual product grid, not the older planning docs.
- Fixed a real price mismatch (`monetise-your-expertise` R299→R399) and 2 real gaps where a PDF existed in Storage but no product row did at all (`niche-clarity-workbook`, `paids-framework-workbook` — the former is a live bug fix: `/niche-clarity`'s sales page has been querying a nonexistent product this whole time). Migration: `20260728140000_reconcile_live_shopify_catalog.sql`.
- Added 3 products found live with no source file anywhere accessible to this session (Imposter Syndrome Fix, Your First Brand Deal Script, SARS & Creator Income) as `draft` with no `download_path` — cannot be published until a real file is sourced, not invented.
- Flagged, not resolved: "Content Creator Starter System" (Shopify, R299) vs. the already-live "creator-starter-system" (R49) look like different products despite the similar name — added as a separate draft row.
- Founder decision: `30-day-content-calendar` stays at R149 even though live Shopify shows R99 — Shopify treated as the stale one here.
- Added `compare_at_price_cents` column (migration `20260728150000`) and populated it only for the 5 products where a real "was Rxxx" price was directly observed on the live site.
- Generated real cover images for all 25 imported/fixed products from each PDF's actual page 1 (PyMuPDF), uploaded to `product-covers`, migration `20260728160000`.
- Rebuilt `/products` as a flat image grid + a new `ProfileHero` component, replicating the real live site's actual HTML/CSS (colors, card structure, bio card, social icons) — not a guess from a 2026-05-01 planning doc.
- Found and fixed, incidentally: `modules.unlock_week` (LMS drip-delivery) never actually existed on the live DB despite its migration showing "applied" — a real gap in this session's earlier migration-history repair. Re-applied via migration `20260728170000`, backfill verified correct.
- All verified live: full build + `tsc` clean, `/products` returns 200, the real profile photo and all 25 cover images resolve with correct content-type.
