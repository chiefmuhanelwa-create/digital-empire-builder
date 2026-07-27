# CHKPLT — How to Change a Product's Price (Runbook)

> **Why this file exists:** pricing lives in two places at once (a marketing-price constant in code, and a real charge amount in the database), and they only stay in sync because a daily automated job rewrites one from the other. If you don't know that, a price change can look successful (the number on the page updated) while the actual amount a customer is charged silently doesn't — or vice versa. This has already happened once (see Change Log below). This runbook exists so anyone — not just the person who built this — can change a price correctly, verify it actually took effect, and know what to check if it didn't. No prior knowledge of the codebase required beyond following the steps below.

## The two-layer system, in plain terms

1. **`src/lib/gardens.ts`, the `USD_DISPLAY` object** — this is the "what we advertise" number. It's a plain list of `"product-slug": price-in-cents` pairs. This is the ONE file a human edits to change a price.
2. **The `products` table in the database** — this is the "what actually gets charged" number (`price_cents`, in South African Rand). Customers in South Africa pay this amount directly; everyone else pays the USD number converted from it.
3. **The daily automatic job (`sync-fx`)** — every day, a scheduled task reads step 1's list, checks the real USD→ZAR exchange rate, and rewrites step 2's numbers so the Rand charge always matches the fixed USD price you set. You do not need to calculate the Rand amount yourself — the system does it, once a day.

**The one thing that can go wrong:** if you only update the marketing copy on a page (a sentence like "$499") without also updating `USD_DISPLAY`, the page will *say* $499 but the checkout will still *charge* the old amount. Always change the number in `gardens.ts` first — everything else follows from that.

## Step-by-step: changing a price

1. **Open `src/lib/gardens.ts`.** Find the product's slug inside `USD_DISPLAY`. Change the number (it's in cents — $499 is `49900`, $97 is `9700`). Leave yourself a comment noting the old price and today's date, the same way every other line in that file is commented — this is what lets the next person (or you, in a year) understand the history without needing to ask anyone.

2. **Find every place the OLD price is written as plain text/copy** (sales pages, application forms, email sequences, internal docs) — search the whole project for the old dollar amount and the old Rand amount. These do not update automatically; each one is a sentence a human wrote, and each one needs to be a human edit. This step is the one most likely to get missed, and it's the one customers actually see.

3. **If the product's row doesn't already exist in a migration file** (check `supabase/migrations/` for an `INSERT ... slug = 'your-slug'` or `UPDATE ... WHERE slug = 'your-slug'`) — write a new migration file (never edit an old one; add a new timestamped file) that sets the correct price/title. This step exists so the price lives in git, not only in the live database dashboard — if it's only in the dashboard, nobody reviewing the code can see what the real price is, and it can be changed by anyone with dashboard access without leaving a trace.

4. **Deploy the code change** (however this project normally deploys — Cloudflare Worker push) **and run the new migration** against the live database (`supabase db push`, per `docs/GO-LIVE.md` step 2's pattern).

5. **Trigger the price sync immediately**, rather than waiting for the next scheduled run:
   ```bash
   curl -X POST https://chkplt.com/api/cron/sync-fx
   ```
   This makes the real charge amount match the new price right away instead of waiting up to 24 hours.

## Verify (do not skip this — a silent mismatch is exactly the failure mode this runbook prevents)

- [ ] Load the product's page on the live site — does the displayed price match what you set?
- [ ] In the Supabase dashboard, open the `products` table, find the row by slug — does `price_cents` match the new price (converted to Rand)?
- [ ] Run an actual test purchase (a real card in test mode, or a real small purchase if no test mode exists) and confirm the amount charged matches what's displayed. **Do not consider a price change complete until this step passes** — a matching display price and a matching database price can still both be wrong if the checkout code reads from somewhere else entirely.
- [ ] Search the whole codebase and `docs/` folder one more time for the old price — anything still showing it needs fixing before you announce the new price publicly.

## If something looks wrong

- **Page shows new price, but checkout charges old price:** the sync-fx job hasn't run yet — trigger it manually (step 5 above) rather than waiting.
- **Everything shows the new price, but a customer says they were charged the old amount:** check if they started checkout *before* you made this change — in-progress checkout sessions may have already locked in the old price.
- **You don't know if a product's row is seeded in git or only in the live database:** check `supabase/migrations/` for the slug. If it's not there, treat the live database as the only copy of that product's full details (description, benefits, etc.) — don't guess at rebuilding it from scratch; only update the fields you're certain about (see the Change Log entry below for how this was handled the first time).

---

## Change Log

### 2026-07-27 — Contentpreneur Accelerator PRO: $970 → $499 (flat, no installments)
- **Changed by:** Claude Code, per founder decision (Ndivhuwo Muhanelwa).
- **What changed:** `gardens.ts` USD_DISPLAY for `contentpreneur-90day-cohort` (97000 → 49900); marketing copy in `PremiumProgramBreakdown.tsx`, `apply.tsx` (×2), `apply.functions.ts`'s downsell email; 8 internal docs annotated (not all inline mentions rewritten — see each file's dated note); new migration `20260727150000_accelerator_flat_499_reprice.sql` (this product's row had never been seeded in a migration before this — its price previously lived only in the live dashboard, which is the exact gap this runbook is designed to close going forward).
- **What was deliberately NOT changed:** the live sales-call script in `docs/SALES-PIPELINE.md` Step 12 still reads "R18,000" verbatim — flagged with a warning banner, not rewritten, because a script meant to be read aloud on a real call needs a deliberate rewrite pass, not a mechanical find-replace.
- **Still needs manual verification** (not yet done as of this log entry — whoever deploys this should tick these before considering it live):
  - [ ] Run the new migration against the live database.
  - [ ] Trigger `POST /api/cron/sync-fx` and confirm `price_cents` updated.
  - [ ] Load the live Accelerator product page and confirm $499 displays.
  - [ ] Run one real test purchase and confirm $499 (or its Rand equivalent) is what's actually charged.

### (Add new entries above this line each time a price changes — oldest at the bottom, so this file itself becomes the audit trail.)
