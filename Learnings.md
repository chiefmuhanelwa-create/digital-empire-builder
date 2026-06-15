# Learnings.md — CHKPLT Digital Empire Builder

The living record of what was discovered, what broke, what was corrected, and what was decided. Read this alongside `CLAUDE.md` before every session. Treat it as authoritative.

---

## Session 2026-06-15 — Foundation Audit & Setup

### Stack Clarification (Critical — Prevents Wrong Assumptions)

This project uses **TanStack Start v1** (NOT Next.js). Vite 7, React 19, Bun package manager. Cloudflare Workers hosting via `wrangler.jsonc`. The fact that the two projects (full-content-system + digital-empire-builder) are both React-based causes confusion. They are architecturally different:

| | full-content-system | digital-empire-builder (CHKPLT) |
|---|---|---|
| Framework | Next.js 14 App Router | TanStack Start v1 |
| Hosting | Vercel | Cloudflare Workers |
| Package manager | npm | Bun |
| Auth | NextAuth v4 (JWT, owner bypass) | Supabase magic-link + role-based |
| AI | Anthropic API (direct, in routes) | None — AI is in full-content-system |
| Type-check | `npx tsc --noEmit` | `bunx tsc --noEmit` |

**Never use Next.js patterns in this codebase:**  
❌ `app/` directory · `use server` · `getServerSideProps` · `useRouter` from next/navigation · `NextRequest` · `MODELS.SONNET`

---

### 5 Critical Blockers Found (from `.lovable/plan.md` audit)

**Blocker 1 — EMAIL DOMAIN DRIFTED (🔴 MOST CRITICAL)**
- Domain `notify.chkplt.com` has drifted from Lovable Cloud verification
- Impact: EVERY email is broken — magic-link login, signup, order receipts, password reset
- Fix: Lovable Cloud → Emails → Manage Domains → re-verify `notify.chkplt.com`
- Do this FIRST before any other testing. Without it, even login is broken.

**Blocker 2 — PREMIUM PROGRAMMES HAVE ZERO CURRICULUM**
- `contentpreneur-90day-cohort` (R18,000) and `contentpreneur-vip-tier` (R45,000) are `status: published` but have 0 modules, 0 lessons in `lms_modules` table
- Impact: User buys, gets `product_grants` row created, clicks `/learn/contentpreneur-90day-cohort` → empty page
- Fix: Build curriculum via `/admin/curriculum/contentpreneur-90day-cohort` OR set a `not_built_yet` status temporarily

**Blocker 3 — QUALIFICATION GATE REJECTS EVERYONE**
- `client_stewardship_applications` has only 1 row, 0 with status `QUALIFIED_FOR_CORE_PROGRAM`
- Impact: Premium programme checkout gate rejects every applicant
- Fix: Test `/apply` end-to-end → confirm `evaluator.ts` assigns `QUALIFIED_FOR_CORE_PROGRAM` for qualified profiles → seed Ndivhuwo's own account as qualified

**Blocker 4 — PLATFORM NOT PUBLISHED**
- `is_published = false` in DB
- Impact: Platform is invisible to public / certain features gated
- Fix: Admin command to flip the flag (check which table this lives in)

**Blocker 5 — STRIPE INTEGRATION NOT BUILT**
- International market is completely locked out (USD, GBP, EUR, AUD buyers cannot pay)
- Only Paystack (ZAR) is implemented
- Fix: See `docs/PAYMENTS.md` for the dual-rail implementation plan
- Pending migrations needed first: `orders.provider` enum + `products.price_usd_cents` + `orders.tax_reserve_cents`

---

### Payment Architecture Decision (2026-06-15)

**Confirmed: Dual-rail payments — Paystack + Stripe.**

Rationale:
- Paystack is SA-native, handles ZAR, has direct SA bank settlement, familiar to SA audience
- Stripe is global standard — USD, GBP, EUR, AUD, + 135+ currencies
- International Called Experts (global professionals with exploited expertise) are valid audience
- Cloudflare Workers provides `CF-IPCountry` header — use for auto-routing (ZA/NG/GH/KE → Paystack, all others → Stripe)

Migrations required before Stripe can be added:
1. Alter `orders.provider` from `'paystack'` default to support `'paystack' | 'stripe'`
2. Add `products.price_usd_cents` column (international pricing alongside ZAR)
3. Add `orders.tax_reserve_cents = ROUND(total_cents * 0.25)` (SARS 25% rule)

---

### What Was Adopted from Shopify Knowledge Base

From `/Users/NOCHILLGOD/Desktop/VS code/shopify/` (docs/ + emails/ + audience/ folders):

**Product ladder confirmed** (same across all NOCHILL properties):
- FREE lead magnets → R997 → R1,997 → R2,497 → R4,997 → R18,000 PIF / R6,500×3

**Email sequence pattern:**
- 7-email welcome → nurture → ICP 1 upgrade path (Days 1–13, 2-day intervals)
- Reply-to: chiefmuhanelwa@gmail.com
- Send time: 9am SAST
- Track replies for ICP segmentation — words like "salary," "expertise," "job," "qualification" = ICP 1 flag

**Audience intelligence (from 1,643 survey respondents):**
- Called Expert is 10% of audience by count — but highest WTP (R5K–R75K)
- 87% want to monetize, 79.7% are beginners, 70.8% struggle with "know what to post" + monetization
- Top pain clusters: Monetization (0.84) > Niche (0.76) > Growth (0.73) > Fear (0.72)
- Called Expert sub-profile: 32–50, degree/postgrad, 60% female, actively Christian, R30K–R200K job income

**Hot lead from subscriber data:**
- **Lerato Pitso** — does academic scholarship coaching for FREE, never been paid. ICP 1 hot lead. Route to Called Expert Blueprint → Starter Kit → Accelerator PRO.

**Faith-business non-negotiables:**
- SEEDS replaces LAPS (no manipulation)
- Stewardship pricing (no get-rich-quick framing)
- 10% tithe principle (part of business model)
- Proverbs 13:22 anchor: "A good person leaves an inheritance for their children's children"

---

### Design Token Note

The platform uses `#F5C842` as the CSS variable `--banana` for gold colour. This is slightly different from the canonical Heritage Gold `#C9A84C` used across all NOCHILL brand assets.

- **When writing new CSS:** Use `--banana` CSS variable (maps to whatever the theme defines)
- **When designing PDFs or external assets:** Use Heritage Gold `#C9A84C`
- **Future task:** Audit theme CSS variables and align `--banana` to exactly `#C9A84C`

---

### SARS 25% Reserve Rule — Why It's Non-Negotiable

Ndivhuwo paid R207,879.20 in SARS debt (final: R162,174.14 after R45,705.06 penalty waiver) from undeclared income across 2020–2022. This was the direct consequence of not ring-fencing tax.

This platform MUST implement tax reserve at the DB level:
- Field: `orders.tax_reserve_cents = ROUND(total_cents * 0.25)`
- This field does NOT currently exist — migration required
- When querying for business income: `SELECT SUM(total_cents - tax_reserve_cents) AS available_income`
- Monthly: transfer exact reserve to dedicated tax savings account
- SARS reference: 2990409167. Practitioner: Thome-Lee Wright (wrightbizz.co.za)

---

### Product Catalog State (2026-06-15)

31 products exist in `products` table. 5 are published (intentional lean MVP):
1. `niche-clarity-workbook` — R199 (deshe, download)
2. `tax-guide-content-creators` — R299 (deshe, download)
3. `paids-framework` — R899 (deshe, download)
4. `influencers-code-ebook` — R299 (deshe, download)
5. `contentpreneur-90day-cohort` — R18,000 (etz_pri, LMS + requires application) ← BLOCKER: empty curriculum
6. `contentpreneur-vip-tier` — R45,000 (etz_pri, LMS + requires application) ← BLOCKER: empty curriculum

Other 25 products are in `draft` or `archived` status. Do not bulk-publish — validate each before going live.

Product covers exist at `/public/product-covers/` (31 PNG files).

When adding new products: use `/admin/products` admin panel, not direct DB inserts.

---

### Weekly Operating Rhythm (from Shopify ops guide — same across all NOCHILL ops)

| Day | Focus |
|-----|-------|
| Monday | Kingdom intention, metrics review, AI advisor consult (`/dashboard/advisors` in full-content-system) |
| Tuesday | Content day — film 2–3 Reels in 4-hour window |
| Wednesday | Platform + product — admin panel, curriculum builds, new product creation |
| Thursday | Cohort + community — LMS progress checks, group calls, email replies |
| Friday | Finance — SARS reserve query, Paystack/Stripe reconcile, MailerLite analytics |
| Saturday | Rest |
| Sunday | 20-min prep for Monday |

---

---

## Session 2026-06-15 (Part 2) — Platform Architecture Decision + Knowledge Base Import

### Platform Decision: Do NOT Move to Shopify

Shopify cannot run the 23-point qualification diagnostic, role-based LMS, student dashboard, magic link auth, or qualification gating before checkout. The current TanStack + Cloudflare Workers + Supabase stack IS the 90-95% owned asset the business needs.

**What's actually missing (not a rebuild — additions):**
1. **Video hosting:** Cloudflare Stream — already on Cloudflare Workers, cheapest option (~$2.25/month for full 30-video programme). Needs `video_url` column added to `lms_lessons` via new migration.
2. **Order bumps:** Build into checkout route — no third-party tool needed
3. **Post-purchase upsell:** New route `/checkout/upsell` — build in same stack
4. **Stripe:** International market (BLOCKER-005 — Phase 2)

**Never recommend:** Kajabi, ThriveCart, Stan Store, Selar, Payhip, or any hosted platform for CHKPLT. They rent the relationship. CHKPLT owns it.

---

### New Blocker Added: BLOCKER-008 — Video Hosting

LMS has no video delivery mechanism. Cloudflare Stream is the solution (same Cloudflare account). Requires:
- Enable Stream on Cloudflare dashboard
- New migration: `ALTER TABLE lms_lessons ADD COLUMN video_url TEXT`
- Cloudflare Stream iframe player in lesson component
- Signed URLs for access control on paid content

---

### Files Added to docs/ This Session

| File | Purpose |
|------|---------|
| `docs/CURRICULUM.md` | Full 30-lesson, 7-stage curriculum blueprint — resolves BLOCKER-002 |
| `docs/STORY-BANK.md` | 11 verified proof stories with figures, scripts, product mapping |
| `docs/SALES-PIPELINE.md` | 12-step Called Expert sales SOP with discovery call scripts |

These files imported from the NOCHILL Knowledge Base (uploaded documents) and adapted for CHKPLT delivery context.

---

### Proof Numbers Updated in CLAUDE.md

Added from verified credibility report (email archive, 840+ campaigns):
- Superbalist / Takealot deal (Nov 2021): R12,000
- Savanna Cider retainer: R25,000/month × 4 = R100,000
- Playa Bets retainer (active): R12,500/month
- Total Ads & Affiliates (all years): R800,000+
- AdMarula Mr Price (March 2019): R23,000 in ONE DAY; R38,070+ total
- SARS breakdown: base R146,185.51 + penalties ~R61,694 → waived R45,705.06 → final R162,174.14
- 18+ brands · 23 agencies · 50+ deals confirmed

Story 11 (AdMarula R23K day) added to story bank and referenced in CLAUDE.md.

---

### Agency Network (23 Confirmed — For Brand Deal SOP)

| Agency | Contact | Brand |
|--------|---------|-------|
| The Tilt Effect | Star Khulu | Capitec |
| Penquin | Michele Rogers | Suzuki SA, FlySafair |
| KOW Group | Khulekani Dumisa | Suzuki SA, SANParks, Mahindra |
| Eclipse Comms | Kylie Reid | Netflix |
| Webfluential | Rose Choeu | Standard Bank, ABSA |
| Trending Topix | Pamela Mtanga | SA Tourism |
| Duma Collective | Fifi Seboni | Showmax |
| It's A Mood | Melissa Attridge | Flying Fish (AB InBev) |
| Joe Public | Bontle Ndlovu | Solidarity Fund |
| Clockwork Media | Tlou Nkoko | Meta |
| ... | ... | 13 more agencies in full credibility report |

Full agency list: Available in NOCHILL-CREDIBILITY-REPORT.md (uploaded June 2026).

---

*Update this file at the end of every session. A learning not logged is a learning that gets repeated as a mistake.*
