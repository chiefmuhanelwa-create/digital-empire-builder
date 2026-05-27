## What I verified (✅ working)

**Card → detail page flow**
- `/products` → garden card → `/products/garden/$garden` → product card → `/products/$slug` — all URLs and params are correct.
- `/products/$slug` renders cover image, tagline, title, price, description, long_description, benefits, format/audience metadata, BuyBlock CTA, secondary CTA, and "you might also like" upsell.
- Same `/products/$slug` URL is used everywhere else (dashboard, checkout success upsells, learn pages, admin).

**Covers**
- All 29 published products have `cover_image_url` set. ✅

**Checkout → access grant**
- Paystack webhook verifies signature, marks order paid, creates `subscribers` row, tags buyer, inserts `product_grants` for each item. ✅
- `/checkout/success` shows a "Download now" button (signed URL, 30 min) for the just-purchased product when a `download_path` exists.

---

## What's broken or missing (🚨 needs decisions)

### 1. Most paid digital products have no downloadable file

Only **3 files** exist in the `product-files` bucket:

| File | Size |
|---|---|
| `influencers-code.pdf` | 1.3 MB |
| `paids-workbook.pdf` | 2.2 MB |
| `tax-for-contentpreneurs.pdf` | 12.8 MB |

And only **4 products** point at a `download_path`:

| Product | Garden | Price | download_path |
|---|---|---|---|
| Tax Guide for Content Creators | esev | R699 | `tax-for-contentpreneurs.pdf` |
| PAIDS Framework | esev | R999 | `paids-workbook.pdf` |
| Tax for Contentpreneurs (eBook) | esev | R999 | `tax-for-contentpreneurs.pdf` |
| The Influencer's Code (eBook) | devarim | R149 | `influencers-code.pdf` |

⚠️ Note: "Tax Guide" and "Tax for Contentpreneurs eBook" both point at the **same PDF**. Likely a data error — confirm which one is correct.

**Products that are sold as digital but have NO file attached** (buyer pays → grant is created → "No download available for this product" error on success page):
- esev (paid workbooks/courses, 9 products): Niche Clarity Workbook, Content Calendar Template Pack, 9 Modules Personal Branding, Tax Calculator for SA Creators, Creator Invoice & Contract System, Hook Science Script Pack, Media Kit Template Pack, Kingdom Dreamer's Journal Kit, PAIDS Framework Workbook, Content Operating System
- etz_pri (premium courses, 3 products): PAIDS Masterclass, Brand Partnership Mastery, Platform Independence — these probably belong in the LMS (learn pages) rather than as PDFs
- etz_pri (application-only, 3): Accelerator, Mentorship, Mastermind — by application, no file expected ✓
- devarim (books, 4): Contentpreneur Digital, Influencer's Code Print, Contentpreneur Physical, Dreams 2021-2026 — physical/digital books likely need files or a "we'll ship it" flow

### 2. Free products have no delivery at all

All 5 free `deshe` products (Starter Kit, Rate Card Calculator, 5-Day Email Course, Tax Compliance Checklist, Weekly Newsletter) render a **disabled "Get free — opt-in coming soon"** button on the detail page. There is no email-capture form, no delivery, no list signup. This was previously flagged as a stub.

### 3. No purchase-confirmation email is sent

The Paystack webhook grants access but **never sends an email**. The buyer only sees the download button if they don't close the success page. If they close the tab, they have no record of the purchase unless they sign up and check the dashboard. The email infrastructure (`notify.chkplt.com`, queue, templates) is set up but nothing enqueues a post-purchase email.

---

## Proposed plan

Pick which of these you want me to do. They're independent.

**A. Fix the data**
- A1. Set the correct `download_path` for "Tax for Contentpreneurs eBook" vs "Tax Guide for Content Creators" (or confirm they really share the same PDF).
- A2. For every paid digital product that should have a file: either you upload the PDFs through the admin UI (`/admin/products`), or tell me the file names and I'll wire `download_path` for them so the success page and dashboard "Download" buttons work.
- A3. For premium etz_pri courses (PAIDS Masterclass, Brand Partnership Mastery, Platform Independence): confirm they're delivered via the LMS (`/learn/$slug`) — if so, no `download_path` needed, but the success page should send buyers to `/learn/$slug` instead of trying to download.

**B. Wire free product delivery (deshe garden)**
- Replace the disabled "coming soon" button with an email-capture form.
- On submit: upsert into `subscribers`, tag them (`lead`, `garden_deshe`, `product_<slug>`), create a `product_grant`, then either:
  - serve an immediate download link (if the free product has a file), or
  - trigger the email-course / newsletter sequence (for 5-Day Course, Newsletter).

**C. Add post-purchase confirmation email**
- In the Paystack webhook, after grants are created, enqueue a transactional email to the buyer:
  - subject: "Your order is confirmed — {product title}"
  - body: order summary + link to dashboard + a one-tap link back to `/checkout/success?reference=…` so they can re-download
- Uses the existing `notify.chkplt.com` queue and template system.

**D. Improve success-page UX when no file exists**
- Currently: "No download available" error message.
- Fix: if product is an LMS course → "Start learning →" linking to `/learn/$slug`. If product is physical → "We'll ship to {address} — confirmation email coming". If digital with no file → fall back to dashboard message.

---

Reply with which letters (A–D) to do, plus answers to:
1. Is "Tax Guide" vs "Tax for Contentpreneurs eBook" sharing a PDF intentional? If not, which file goes with which product?
2. For the etz_pri courses (PAIDS Masterclass, Brand Partnership Mastery, Platform Independence) — are they LMS (already in `/learn`) or downloadable?
3. For the deshe free products — do you have the actual PDFs/lead magnets ready to upload, or should the buttons just go to an email-capture-only flow for now?
