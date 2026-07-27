# CHKPLT — Launching the Community Product ($19/mo) — Runbook

> **Who this is for:** anyone finishing the Community product's launch — could be the founder, a future hire, or a family member with no prior context on this codebase. Everything code-side is already built and committed; what's left are steps that can only happen in the Paystack dashboard, plus a couple of verification checks.

## What's already built (as of 2026-07-27, this session)

- A product row for `contentpreneur-community` — title, description, benefits, $19/mo price — seeded via migration `20260727160000_seed_community_product.sql`. **It is intentionally `status: 'draft'`, meaning it cannot be bought yet**, on purpose — see "Why draft" below.
- A member-facing dashboard page at `/dashboard/community` (`src/routes/_authenticated/dashboard.community.tsx`) showing the benefits, an active/inactive state, and a join button — copy-identical in structure to the existing (also unfinished) Inner Circle page, since that's the only proven pattern for a subscription product in this codebase.
- A status-check function (`src/lib/community.functions.ts`) that correctly checks only for a Community-specific subscription — not any subscription — so a Community member and an Inner Circle member are never confused with each other.
- The product page at `/products/contentpreneur-community` will offer a "Subscribe" button instead of a one-time "Buy" button (it's registered in `SUBSCRIPTION_SLUGS`, `src/routes/products.$slug.tsx`).

## Why the product is still in "draft" status — the one thing that CANNOT be done from code

A subscription's actual recurring charge amount is controlled by a **Paystack Plan** — a real object created in the Paystack dashboard (or via their API with live credentials), not something this codebase can generate on its own. Until that Plan exists, `SUBSCRIPTION_PLANS["contentpreneur-community"]` in `src/lib/checkout.functions.ts` is a placeholder string (`"PLN_REPLACE_ME_COMMUNITY_19_USD"`) that would fail if anyone tried to check out with it. Keeping the product in `draft` status is what prevents that — a draft product doesn't show a working purchase flow, so nobody can hit that broken placeholder by accident.

## Steps to actually launch it

1. **Create the Paystack Plan.** In the Paystack dashboard: Plans → Create Plan. Name it something like "Contentpreneur Community — Monthly." Set the amount to the ZAR equivalent of $19/mo (check `src/lib/gardens.ts`'s `ZAR_PER_USD` constant for the current rate, or just check what CHKPLT is currently charging for Inner Circle at $29 or $39/mo and scale proportionally). Set the interval to monthly. Save it — Paystack gives you back a `plan_code` starting with `PLN_`.

2. **Paste the real plan code into the code.** Open `src/lib/checkout.functions.ts`, find `SUBSCRIPTION_PLANS`, replace `"PLN_REPLACE_ME_COMMUNITY_19_USD"` with the real code from step 1. Deploy this change.

3. **Decide what the community actually is, before anyone can join it.** `COMMUNITY_URL` and `CALL_URL` in `src/routes/_authenticated/dashboard.community.tsx` are both empty strings on purpose — there is no WhatsApp group, Circle space, or Discord server wired up yet (the existing Inner Circle product has the identical gap — "invite emailed to members" is the current fallback for both). This is a product decision, not an engineering task: pick a platform, create the space, then either (a) paste its invite link into `COMMUNITY_URL` so it shows directly on the dashboard, or (b) set up an email automation that sends the invite after successful subscription, and leave `COMMUNITY_URL` blank (the page already handles both cases).

4. **Flip the product live.**
   ```sql
   update products set status = 'published' where slug = 'contentpreneur-community';
   ```

5. **Regenerate the route file.** `src/routes/_authenticated/dashboard.community.tsx` is a new file — TanStack Start's router auto-generates `src/routeTree.gen.ts` from the files in `src/routes/`. Run the dev server once (`bun run dev`) or the project's normal build command so this new route actually gets registered; do not hand-edit `routeTree.gen.ts` directly, it's a generated file.

## Verify

- [ ] `/products/contentpreneur-community` shows a "Subscribe — $19/mo" button (not "Buy").
- [ ] Complete one real (or Paystack test-mode, if configured) subscription end-to-end — confirm you land on `/checkout/success`, and that `/dashboard/community` then shows "Active member" for that account.
- [ ] Confirm a test account that has an Inner Circle subscription but NOT a Community one shows **inactive** on `/dashboard/community` (this is the specific bug this runbook's `community.functions.ts` was written to avoid — see its code comment).
- [ ] Cancel the test subscription in Paystack and confirm `/dashboard/community` correctly flips back to inactive once `current_period_end` passes.

## Change Log

### 2026-07-27 — Product built, deliberately not launched
- Built by: Claude Code, per the founder-approved implementation plan (Phase 1B of the "Building the Actual Systems" plan).
- Blocked on: real Paystack Plan creation (step 1 above) and a community-platform decision (step 3 above) — both require the founder, neither can be done from code.
