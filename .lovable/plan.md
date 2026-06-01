# Launch Readiness Audit

Honest scan of code, database, and infrastructure. Grouped by severity.

---

## 🔴 Blockers (must fix before launch)

### 1. Email domain is **drifted**
`notify.chkplt.com` was verified previously but DNS no longer matches. **No email will send** — that breaks magic-link login, signup confirmation, order receipts, application notifications, password reset, and the queued email pipeline.
- **Fix:** re-verify in Cloud → Emails → Manage Domains, or restore the NS records (`ns3.lovable.cloud`, `ns4.lovable.cloud`) and the TXT record at the domain registrar.

### 2. Premium Programs have zero curriculum
`contentpreneur-90day-cohort` (R18k) and `contentpreneur-vip-tier` (R45k) are `published` and gated, but have **0 modules / 0 lessons**. The moment someone qualifies + pays, `/learn/$slug` will be empty.
- **Fix:** either build the curriculum in admin, OR switch them to a `not_built_yet`-style placeholder until cohort 01 opens.

### 3. No-one is qualified — gate will reject everyone
`client_stewardship_applications` has 1 row, 0 qualified. The 23-point assessment wizard either isn't routing applicants to `QUALIFIED_FOR_CORE_PROGRAM`, or no real applications have been completed. Premium checkout is effectively closed.
- **Fix:** test the `/apply` flow end-to-end, confirm the evaluator assigns `QUALIFIED_FOR_CORE_PROGRAM` correctly, and seed/qualify at least the founder account.

### 4. Project is not published
`is_published: false`. Nothing is live yet.

---

## 🟡 Should fix before launch

### 5. Catalog is mostly archived
Only **5 of 31 products are published**: `niche-clarity-workbook`, `tax-guide-content-creators`, `paids-framework`, `influencers-code-ebook`, plus the two premium programs. Everything in the original CHKPLT roadmap (PAIDS masterclass, Brand Partnership Mastery, free starter kit, rate-card calculator, newsletter signup, books) is archived. Confirm this is intentional — if launch is "lean catalog", fine; if not, republish.

### 6. `delivery_type` field doesn't exist
Spec calls for `lms_only | lms_plus_pdf | download_only | not_built_yet` routing on `/checkout/success`. The DB has `download_path` + LMS modules but no enum to drive the 4-way conditional. Currently fulfillment is implicit (file → download, modules → learn). Either:
   - Add the enum + update `checkout.success.tsx` to branch on it, OR
   - Accept the implicit logic and remove that section from the project knowledge.

### 7. VAT / tax reserve columns
Spec calls for `vat_allocation_cents` (15%) and `tax_reserve_cents` (25%) on every transaction. Worth confirming `orders` / `audit_ledgers` actually compute and store these — if not, the "Compliance Shield" promise is marketing copy without backing logic.

### 8. Paystack webhook signature
`/api/public/paystack-webhook.ts` exists — verify it validates the `x-paystack-signature` HMAC before granting `product_grants`. A missing check = free product unlocks.

---

## 🟢 Pre-launch polish (nice-to-have)

- **Legal pages:** no `/terms`, `/privacy`, `/refund-policy` routes — Paystack and POPIA both expect these.
- **404 + error boundaries:** confirm `__root.tsx` has `notFoundComponent` and routes with loaders have `errorComponent`.
- **SEO:** confirm each route has unique `head()` meta + og:image (home looks good, spot-check `/products/*`).
- **Analytics:** no tracking script detected — add before paid traffic.
- **Turnstile:** confirm site key is wired on `/apply`, `/signup`, `/login`, `/contact`, checkout.
- **Test the full happy path once on live:** signup → magic link → apply → qualify → checkout → Paystack → webhook → grant → `/learn`.

---

## Recommended order

1. Re-verify email domain (everything else depends on it).
2. Decide premium program curriculum: build it or switch to placeholder.
3. Fix the qualification routing so `/apply` actually qualifies people.
4. Audit Paystack webhook signature verification.
5. Add legal pages.
6. Smoke-test the full purchase flow on a preview deploy.
7. Publish.

Want me to tackle these in order, or pick a subset?
