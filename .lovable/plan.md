# Sales pages: ad-ready upgrade

## Current state (verified)

All 4 published products are fully wired with cover mockups, download files, and benefits — clicking a product card on `/products/garden/$garden` opens `/products/$slug` which already renders cover image, price, description, BuyBlock CTA, long-form copy, and benefits.

| Product | Cover | File | Long copy | Benefits |
|---|---|---|---|---|
| Niche Clarity Workbook | ✓ | niche-clarity-workbook.pdf | ✓ | 4 |
| The Influencer's Code (eBook) | ✓ | influencers-code.pdf | ✓ | 5 |
| PAIDS Framework | ✓ | paids-workbook.pdf | ✓ | 5 |
| Tax Guide for Content Creators | ✓ | tax-for-contentpreneurs.pdf | ✓ | 5 |

So the structure works. What's missing is **ad-grade copy** that converts cold FB/IG traffic.

## What I'll change

### 1. Rewrite copy for all 4 products (DB migration — `UPDATE products`)

For each product I'll rewrite four fields to make the page work as a standalone paid-ad landing page:

- **tagline** — one-line hook above the H1 (the "scroll-stopper" that mirrors the ad creative)
- **description** — short subhead under the price (3–4 lines, names the pain in their words)
- **long_description** — the body sales letter (problem → agitate → solution → proof → offer), no internal jargon
- **benefits** — 5 outcome-led bullets ("You'll walk away with…")

Copy direction per product, mapped to the audience journey (Clarity → Attention → Monetisation → Compliance):

1. **Niche Clarity Workbook** — for the creator shouting into a crowded feed. Angle: stop guessing, get your exact lane in one sitting.
2. **The Influencer's Code** — for the creator with talent but no traction. Angle: the 3Es framework (Educate, Entertain, Encourage) used by creators who actually grow.
3. **PAIDS Framework** — for the creator tired of chasing brand deals that underpay. Angle: 5 revenue streams so you stop trading hours for unstable invoices.
4. **Tax Guide for Content Creators** — for the SA creator scared of SARS. Angle: turn your hustle into a compliant, audit-proof business without an accountant.

**Voice rules I'll follow** (per your brief):
- Speak to 18–34 SA creators / digital pros / Christian entrepreneurs
- Name real pains: algorithm fatigue, brand-deal exploitation, SARS anxiety, "looks successful but backend is a mess"
- **Zero internal jargon** in the UI — no "Blurry Camera Syndrome", no "House of Israel/Aaron", no "11th-hour rescue mission"
- Plain, confident, conversion-focused English. No churchy language on Marketplace products; Kingdom framing only where the product is explicitly Kingdom.

### 2. Tighten the sales page layout (`src/routes/products.$slug.tsx`)

Small, ad-landing-page-focused tweaks only:

- Move the primary CTA (BuyBlock) **above the fold on mobile** by placing a compact "Buy now" button right under the price, and keep the full BuyBlock form where it is.
- Add a **3rd CTA** at the very bottom (after benefits / next-product) so scrollers always have a buy button in view.
- Add an **"As seen by creators like you" trust strip** (small line: "Built by Lebo M. — multi-award-winning SA media founder") under the H1. Single line, no fake logos.
- Ensure cover mockup is shown prominently and isn't cropped on mobile (it already is — just verifying).
- Add proper per-product `head()` meta (title, description, og:title, og:description, og:image = cover) so the page previews correctly when pasted into Facebook/Instagram ad managers.

### 3. No schema / no new routes / no new products

- Not adding products (per your last instruction — only the 4 with files stay live).
- Not touching checkout, fulfillment, or LMS.

## Out of scope

- Generating new mockup images (existing covers are used).
- Rewriting `/products` shop index or garden pages.
- Email copy / post-purchase flows.

## Technical notes

- Copy update goes in one `supabase--migration` (`UPDATE products SET tagline=…, description=…, long_description=…, benefits=… WHERE slug IN (...)`).
- Sales page edits are presentation-only in `src/routes/products.$slug.tsx`; `head()` becomes dynamic by switching to a `loader` that fetches the product so meta can include real title + cover.
