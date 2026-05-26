# Next up: Niche Clarity funnel + nav fix

Two things, in this order. Both are small and ship together.

---

## 1. Fix the broken Shop nav on mobile

**The problem you spotted:** "the products link are not opening to anything."

On mobile (you're on a 390px viewport right now), the header nav is hidden — it's set to `hidden md:flex`, meaning desktop only. There's no mobile menu button, so there's literally no way to reach Shop, About, or Contact from a phone. Desktop works fine.

**Fix:**
- Add a hamburger menu button (visible only on mobile) to `src/components/site-header.tsx`
- On tap, open a Sheet (slide-in drawer from shadcn/ui — already installed) with:
  - Everything (→ /products)
  - The 4 Gardens (→ /products/garden/$garden)
  - About, Contact
  - Dashboard / Sign out (if logged in) or Sign in (if not)
- Auto-close the drawer on link tap.

No backend work, no schema change.

---

## 2. Niche Clarity sales page + upsell funnel

Right now Niche Clarity (R299) is just another product card. You wanted a dedicated direct-paid sales page with a post-purchase upsell flow. Here's the shape:

### a) Sales page — `/niche-clarity`

A new route file, separate from `/products/$slug`, fully focused on converting cold traffic:

- Hero: bold promise, sub-promise, R299 price anchor, single "Buy Now — R299" CTA
- "What you'll walk away with" — 4–6 outcomes (not features)
- "Who this is for / not for" — qualifier block
- What's inside — module/chapter breakdown
- About the creator block (short)
- Testimonials placeholder (we'll wire when you have them)
- FAQ accordion (using existing shadcn Accordion)
- Final CTA — sticky on mobile
- Money-back / guarantee line (you tell me what to write — placeholder for now)

Wired to the existing Paystack Inline checkout (already built in Phase 2c) — clicking "Buy Now" opens the inline modal, no redirect.

Own SEO metadata via `head()` so this page ranks/shares on its own.

### b) Upsell flow — runs after successful Niche Clarity purchase

On the existing `/checkout/success?reference=...` page, when the purchased product is `niche-clarity-workbook`, we replace the generic "thank you" with a one-time-offer upsell stack:

```text
Step 1 — Thanks + access     (always shown)
Step 2 — UPSELL 1            PAIDS Framework Workbook  R999
                             "Yes, add this for R999"  |  "No thanks, continue"
Step 3 — UPSELL 2            9 Modules Personal Branding  R499
                             "Yes, add this for R499"  |  "No thanks, continue"
Step 4 — UPSELL 3            Tax Guide for Content Creators  R699
                             "Yes, add this"            |  "No thanks, continue"
Step 5 — Final dashboard link
```

Each "Yes" → opens Paystack Inline for that single product, charges separately, grants access on webhook (same machinery as today), then advances to the next step. Each "No" just advances. No skip-ahead — sequential.

If the user arrives at /checkout/success for any other product, they see the current generic success page — only the Niche Clarity reference triggers the funnel.

### Order of upsells

I went with PAIDS → Module → Tax Guide (highest price first, descending). Tell me if you want a different order, or want to skip one.

---

## What's NOT in this plan (still on the roadmap, just not now)

- LMS course delivery (video player, lessons, progress) — Phase 3
- Email engine + welcome sequences — Phase 4
- Admin CSV importer for your 13K legacy list — Phase 2b
- Affiliate program, community — Phase 6/7

---

## Technical notes (for me, ignore if you want)

- Mobile nav: `Sheet` + `SheetTrigger` from `@/components/ui/sheet`, hamburger from `lucide-react` Menu icon. Trigger has `md:hidden`, existing nav stays `hidden md:flex`.
- `/niche-clarity` route: `src/routes/niche-clarity.tsx`, loader fetches the product row by slug `niche-clarity-workbook` via existing public products query, reuses the Paystack `createPaystackTransaction` server fn.
- Upsell state: local React state on the success page, driven by an array `[paids-framework, 9-modules-personal-branding, tax-guide-content-creators]`. Each step calls `createPaystackTransaction` for that one product. No new DB tables — each upsell is a normal order, grants flow through the existing webhook.
- No new secrets needed (Paystack keys already set).

Click **Implement plan** and I'll ship both in one pass.
