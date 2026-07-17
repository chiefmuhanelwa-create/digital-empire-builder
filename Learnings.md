# Learnings.md — CHKPLT Digital Empire Builder

The living record of what was discovered, what broke, what was corrected, and what was decided. Read this alongside `CLAUDE.md` before every session. Treat it as authoritative.

---

## 2026-07-17 — Positioning pivot: "Contentpreneur" umbrella + 2 buyer lanes (full-funnel copy + gate wording + docs)

- **Why:** Owner's discovery — aspiring content creators don't have money; the buyer with money is anyone with real expertise (salaried OR self-employed) who wants owned income. Decision: own the word "Contentpreneur" as an umbrella, put **Lane A (Called Expert, salaried)** + **Lane B (Knowledge Creator, self-employed coach/podcaster/consultant)** under it, keep the broke-aspiring creator as a traffic tier (not a buyer), never insulted.
- **4 locked decisions (via AskUserQuestion):** (1) Contentpreneur umbrella, 2 lanes; (2) reframe hero income-neutral; (3) keep the money filter, only reword; (4) full-funnel scope.
- **Code changed (all type-clean, `TYPECHECK_PASSED`):** hero + meta + FAQ + before/after in `src/routes/index.tsx`; `about.tsx` "Who is a Contentpreneur?" definition (both lanes); `apply.tsx` income question ("what you currently earn — salary, clients, deals, sales") + time-commitment ("if your current income continued") + H1/title → Contentpreneur; `apply.functions.ts` qualified-email copy; AI prompts `offer-builder.functions.ts` (ICP 2 retuned from "aspiring/broke" → Knowledge Creator) + `tool-ai.functions.ts` VOICE; `offer-builder.tsx` lane selector labels; `PremiumProgramBreakdown.tsx` (Salary Trap → "Paid-Less-Than-You're-Worth Trap", removed the anti-"creator ratio" jab, "Built for" names both lanes); `products.index.tsx`, `tools.tsx`, `signup.tsx`, `learn.index.tsx`, `dashboard.inner-circle.tsx`, `apps.knowledge-audit.tsx`, `apps.niche-clarity-builder.tsx`; softened the Align quiz a3 that ranked "content creator" as the lesser identity.
- **Docs changed:** project `CLAUDE.md` ICP section rewritten (the "lock onto ONE ICP / default ICP 1" rule was the thing that kept re-narrowing future sessions → now "umbrella; one lane per piece, never re-narrow to salaried-only"); `COVENANT-ENGINE.md` mission + avatar split (3 tiers); `SALES-PIPELINE.md` STEP 1 (2 buyer lanes); `EMAIL.md` trigger-word dictionary (added Lane-B signals) + upgrade sequence (per-lane subject angles); `PRODUCTS.md` audience-mapping note; `CURRICULUM.md` lesson-2 title.
- **Deliberately NOT changed (owner chose "keep filter, reframe wording"):** `src/utils/evaluator.ts` thresholds. The R5,000/mo money floor stays (money = qualifier), but so do the **1,000-follower / 100-email-subs / 3-income-stream hard auto-rejects** (L31/L42/L64). **Consequence to revisit:** the new copy invites money-having Knowledge Creators with a small list, but the gate can still downsell them — this widens the existing contradiction (already flagged: gate vs. the "works from zero followers" homepage promise). One-line fix when owner wants it: soften L31/L42 from auto-reject to scored. Left as a data-driven follow-up after /apply conversions are observed.
- **Kept intentionally:** product **slugs / DB / grants untouched** (`called-expert-foundation-kit`, `contentpreneur-90day-cohort`, `mindset-salary-trap`) — display copy says "Contentpreneur," URLs and LMS access unchanged. Flagship cohort curriculum framework names (Called Expert SWOT/Content Ratio/Covenant) kept as Lane-A curriculum names. NoChill's own proof stories that mention "salary" (first phone, "one retainer is a salary") kept — they're receipts, not audience targeting.

---

## Session 2026-07-11 (later) — Front-End Copy & Product Ladder Audit + Fixes

A full read-only audit of the live front-end (routes, `clarity-system.ts`, `gardens.ts`, email templates, migrations) against the Called Expert positioning and house voice/brand rules found real, live production issues — not just doc drift. Full findings and reasoning: `nochill-knowledge-base/W/processes/ndivhuwo-twin/03-business/product-ladder-reconciliation.md`.

**Fixed directly (safe, reversible, no business-policy judgment required):**
- `src/lib/gardens.ts` — `GARDEN_ORDER` was missing `"deshe"` (Free Tools), so the documented front door of the funnel never rendered as a shop category on `/products`. Added.
- `src/routes/_authenticated/dashboard.index.tsx` — Inner Circle price mismatch ($39/mo shown vs. $29/mo actually coded in `gardens.ts USD_DISPLAY`) — display copy corrected to match the real charged price.
- `src/lib/apply.functions.ts` — the qualified-applicant email (both HTML and plain-text) referenced a stale "20-Week Called Expert Accelerator" and a "20-minute strategy call" booking flow that doesn't exist anywhere in the app (no booking route found). Corrected to "90-Day Called Expert Accelerator PRO" and pointed the CTA at `/signup` (the real next step, matching `apply.tsx`'s own on-page "Create Your Account" flow) instead of looping back to `/apply`.
- `src/routes/about.tsx` — the origin-story section was written in third person about an unnamed "someone"/"they," breaking voice consistency with the rest of the site (which uses first/second person throughout, per house rules). Rewritten to first person, present-tense where the claim is ongoing ("I still work my day job while I do it").
- `src/routes/index.tsx` — 6 instances of "30-day, no-questions-asked money-back guarantee" language directly contradicted the real, live `refund-policy.tsx` (7 days, conditional on a technical access issue, repair-or-refund not blanket refund). Rewrote all 6 to accurately reflect the real 7-day policy rather than unilaterally extending the actual legal policy to match the marketing copy — a real guarantee extension is a business decision for the owner, not something to assume.
- `src/components/PremiumProgramBreakdown.tsx` — the Accelerator PRO's actual sales page described a completely different, generic-influencer-agency curriculum ("The Launchpad Foundation," "Viral Content Engine," "Authority Studio Setup") that does not match the real, seeded, live curriculum (`docs/CURRICULUM.md` — the 7-stage Genesis→Deuteronomy structure, 32 lessons). A paying customer would see one program on the sales page and a different one after logging in. Rewritten to describe the actual seeded lesson content, correct stage names, and Called Expert language throughout (also fixed 2 instances of third-person "Creators"/"elite creators" copy on this page).
- `docs/EMAIL.md`, `docs/PRODUCTS.md` — both still instructed anyone doing design work to use the old Heritage Gold `#C9A84C`/Charcoal `#1C1C1C`/Cream `#FAF7F0`/Lato spec. The site shipped a different "Modern Professional" slate+amber theme (confirmed deliberate — the old theme is backed up whole in `src/styles.heritage.bak.css`, not deleted). Updated both docs to describe the theme that's actually live, with a note pointing to the backup file if anyone ever wants to revert.
- New migration `20260711120000_fix_owner_qualification_income_figure.sql` — corrects the owner's own seeded qualification record from R300,000/month (unverified, sourced only from the published book, and inconsistent with the original migration's own "R600K+ annual" comment) to R50,000/month (the verified monthly-equivalent of the real R600,000/12-month Meta payout figure). **Not yet applied — needs `supabase db push` against the live project.**

**Flagged, NOT auto-fixed — these need your decision, not mine:**
- **`src/utils/evaluator.ts`'s qualification thresholds actively reject the stated ideal customer.** Hard gates require 1,000+ followers, a 100+-subscriber email list, R5,000+/month existing income, and 3+ income streams before someone can even apply for the Accelerator PRO — but the Called Expert is, by this business's own definition, someone with *unexploited* expertise who likely has none of that yet. The homepage FAQ directly promises "works from a standing start of zero followers." I did not change the thresholds — how strict qualification should be is a real business call, not a copy bug.
- **Several live, checkout-reachable product slugs have no database seed anywhere in `supabase/migrations/`** — `creator-swipe-vault`, `asset-accelerator`, `called-expert-starter-bundle`, `called-expert-facilitator`, `called-expert-inner-circle`, `personal-brand-30-days`, `contentpreneur-vip-tier`, plus 3 general-audience products `docs/PRODUCTS.md` lists as "Currently Published" (`niche-clarity-workbook`, `tax-guide-content-creators`, standalone `paids-framework`). These only work if matching rows were created manually via `/admin/products` outside source control — unverifiable from code, and fragile. Writing real seed migrations for these requires deciding real prices and content first, not something to guess at.
- **VIP Tier (`contentpreneur-vip-tier`) has no curriculum and no DB seed at all**, yet its marketing page is live and quotes a price ($2,430) that doesn't match `docs/PRODUCTS.md`'s documented R45,000. Recommend not selling it until it has both a real database row and real content — flagged, not fixed, since removing/disabling a product page is itself a decision worth confirming.
- **Two different support emails** live in different parts of the site (`info@nochill.co.za` in `contact.tsx` vs. `support@chkplt.com` in `refund-policy.tsx`) — did not standardize on one, since I don't know which inbox is actually monitored and guessing wrong risks real customer emails going nowhere.

## Session 2026-07-11 — Cross-Project Fact Sweep (no live errors found here)

Part of a broader fact-correction sweep triggered by the "Ndivhuwo Twin" identity/purpose build in `nochill-knowledge-base`. Checked this project's `CLAUDE.md`, `Learnings.md`, `docs/SALES-PIPELINE.md`, `docs/CALLED-EXPERT-CURRICULUM.md`, `docs/COVENANT-ENGINE.md`, `docs/STORY-BANK.md` for the R285,000 SARS figure and the P20 Pro phone story — **all instances found here were already correct warning/instruction lines** ("Never use R285,000", "SCRIPT WARNING: any script referencing R285,000 is WRONG"), not live errors. No edits needed in this project. Also confirmed: `docs/PRODUCTS.md`'s "153 Product Roadmap" is a third, independent pricing/product structure (distinct from the Called Expert Strategy Playbook's old 6-tier ladder and the Unathi Blueprint's 2-tier ladder, both in `nochill-knowledge-base`) — only 4 free/entry products and the Accelerator PRO (32 lessons seeded) are confirmed live; everything else across all three ladders is planning-stage. See `nochill-knowledge-base/W/processes/ndivhuwo-twin/03-business/demand-validation.md` for the full cross-reference.

**Also discovered during this pass (important, not a fix — a finding):** the "$97 Called Expert Foundation Kit" already exists in this codebase as a real, live product (`src/lib/clarity-system.ts` — 7-step guided journey, 9 real interactive tools under `/apps/*`, real Cloudflare Stream video content, Paystack checkout with order bump + 1-click upsell). A separate, static-markdown "Foundation Kit" was independently built in `product-lab/products/called-expert-foundation-kit/` without knowledge of this — it duplicates something already built here, and the real version here is more advanced. The 9 tools' PDF-companion slots (`pdf: "knowledge-audit"` etc. in `clarity-system.ts`) may not have real content behind them yet — that's the one place the product-lab markdown might still be useful, as draft PDF content, not as a competing product.

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

---

## Session 2026-06-16 — Deep Copy Overhaul (Unathi Mabunda Archetype)

### Context

User uploaded NOCHILL Master Intelligence Report (630+ survey responses, Unathi Mabunda brief, JTBD analysis). Directive: write copy that talks DIRECTLY to the ICP 1 person — not information, transformation. Focus person: Unathi Mabunda prototype (established professional, credentials + frameworks, but no digital architecture or monetization system).

### Copy Direction That Was Approved (Verbatim)

"I don't want you to just write the copy, I want you to go through all the data, insights, knowledge base, findings, the essence of the dreams, the scriptures, the shadow fears of ICP 1, faith also should be part of who we serve, not every expert is our target audience... write a copy that will talk to that person I am sent to serve — directly to them, show the problem, the pain points, the shadow fear, deep unseen 3AM burdens, pull it out let the copy mirror them — make them see that I can help — remember the aim isn't to give them information but that offer them transformation."

### Landing Page (index.tsx) — What Changed

**Hero rewritten:**
- Old: "You've spent years building expertise. You're still paid like an employee."
- New: "You've spent years building wealth for your employer. You haven't started building yours."
- Rationale: "building wealth for your employer" is more specific to the Unathi archetype (corporate professional with 15+ years of institutional expertise). Names the exact gap.

**Two new sections added:**

1. **"Inner Voice" section** (between Recognition and Structural Problem): 4 direct quotes from the 630+ survey data, displayed as first-person thoughts. These came verbatim or near-verbatim from actual respondents:
   - "I have content, ideas, and a voice. I just don't know where to focus first." (from Unathi's actual brief)
   - "I built this framework from years of real experience. I'm giving it away for free..."
   - "I'm scared to start in public. If it fails, it damages the professional image..."
   - "Not fulfilling my purpose — living a life where I didn't do what God created me to do — that's my deepest fear. Not poverty. That." (verbatim from survey)
   
   These quotes make the reader say "how did you know that?" — this is the mirror effect.

2. **"The Calling" section** (between Proof and Anti-Sell): Theological permission section. Key copy: "The parable of the talents does not reward the one who buries the gift safely in the ground. It rewards the one who puts it to work." Addresses the faith-business guilt ("charging for what God gave you feels wrong") that is THE silent blocker for faith-driven experts.

**Structural Problem section expanded:**
- Added the key research insight: "You have spent years earning legitimacy through institutions — your employer, your credentials, your title. Going online asks you to be the expert on your own name, not on your company's behalf. That's not a skill gap. That's an identity transition. And nobody warns you it's coming."
- This insight came from research: high-achieving professionals resist personal branding because they've built their entire credibility through institutional affiliation (the "Dr. X from Hospital Y" problem) — going solo feels like identity rupture, not just a skill gap.

### Core Psychological Insight (Use in All Future Copy for ICP 1)

**The institutional-to-personal legitimacy migration is the real barrier.**

Called Experts like Unathi didn't hesitate to earn their credentials. They hesitate to OWN them publicly — because:
- Their professional identity is group-derived (attached to employer, title, institution)
- Personal branding online feels like abandoning the "respectability umbrella" of their corporate role
- In African professional culture specifically: being visible online = appearing arrogant or departing from hierarchy
- They've built "earned status" (passive, granted by institutions) and social media asks for "claimed status" (active, self-determined) — this FEELS narcissistic even when it isn't

**The antidote in copy:** Don't frame it as "become an influencer" (identity threat). Frame it as: "take what your institution benefited from and build it into something you own." Always about the expertise, not the platform.

### Faith Copywriting — What Works for ICP 1

This audience (97% Christian) needs THEOLOGICAL permission, not business permission. What blocks them:
- "Charging for what God gave me feels wrong" = the money-and-ministry tension
- They need to be shown stewardship framing: God gave the talent to be USED, not buried
- Proverbs 13:22 lands because it frames digital assets as inheritance, not income
- Matthew 20 (11th hour worker) lands because it addresses age anxiety (42-year-old Called Expert isn't too late — 20 years of expertise is the advantage)
- Parable of talents (Matthew 25) is the theological foundation for "charging for your calling is stewardship"
- **Never lead with faith.** Practical lesson first, scripture as closer. This audience sees preachiness as manipulation.

### Unathi Mabunda Archetype — Key Defining Traits

For every future piece of ICP 1 copy, the "Established Professional" archetype is:
- 10,000+ followers but LinkedIn 265 — the social proof is real but the professional network is small
- Emails at 22:22 at night — this is a passion project alongside a corporate career
- Already has published book, keynotes, frameworks, media appearances — NOT starting from zero
- Her actual gap: "where to focus first, how to structure content across platforms, how to grow this into something that can eventually generate income"
- The word "eventually" = she's postponing income because she doesn't see a clear path from her current state
- **Key reframe for her:** Stop saying "eventually" — the expertise IS the product, today

### Anti-Sell Update

Previous: "You're still waiting until you feel ready. (Ready is a lie. Apply is the move.)"
New: "People still waiting until they feel ready, qualified enough, or have the perfect setup. (That day doesn't come. Apply is the move.)"
Also added: "People who expect to quit their job before building income to replace it. (Build first. Quit after. We'll help you build.)" — addresses the quit-first lie directly.

### What NOT to Change in Future Sessions

- The Left Side / Right Side section: these verified proof numbers land hard and are already formatted correctly. Don't simplify the story — the specificity (R207,879, not "a big SARS bill") is what makes it credible.
- The 7 Stages: structure is correct. Individual stage descriptions were improved to be reader-facing and include digital skill names explicitly.
- The Seal: "Built for Called Experts · Grounded in faith · Anchored in Africa" is the brand stamp. Don't change it.

*Update this file at the end of every session. A learning not logged is a learning that gets repeated as a mistake.*

## 2026-06-21 — Scroll freeze fix (image + render perf)
- **Root cause:** `public/` was 149MB of unoptimised phone photos (single JPEGs up to 10.5MB). Decoding multi-MB JPEGs on the main thread stalled scroll despite `loading="lazy"`.
- **Fix (in place, no ref changes):** `sips -Z 1600 -s formatOptions 68` on all JPEGs >400KB; `sips -Z 800` on cover PNGs. Filenames/extensions unchanged so no `src=` paths broke. **149MB → 12MB.**
- Only **13 images** are actually referenced in `src/`. All `untitled-*.JPEG` and 24 product-cover PNGs were orphans — admin-uploaded covers resolve via Supabase `getPublicUrl` (remote URLs), NOT local `/public/product-covers/`. Deleted orphans safely (backup at `../digital-empire-builder-public-backup`).
- **Pre-existing broken ref (not mine):** `/product-covers/ms-ts-ss-assessment.png` referenced in index.tsx but the file never existed (absent in backup too). Needs the asset added or the ref removed.
- **CSS/render fixes:** removed `backdrop-blur-sm` from sticky header; `glow-breathe`/`card-enter` keyframes now opacity-only (no transform); deleted `video-pulse` animated box-shadow (static shadow kept); removed `.nx-card:nth-child` stagger delays; `.cta-glow` 4-layer shadow → 2; gallery hover `duration-500` → `duration-200`.
- All `<img>` already had `loading="lazy"` + `decoding="async"` + width/height. `bunx tsc --noEmit` clean. Dev server boots, home + images all HTTP 200.
- **sips gotcha:** PNG is lossless — `-Z` resize only helps if shrinking dimensions; graphic mockups don't compress like photos. Convert to JPEG for real wins (but that changes extensions/refs — skipped for launch).

## 2026-06-21 — Launch follow-ups (Node, MailerLite, admin bootstrap, image pipeline, missing asset)
- **Node upgrade:** system Node was 20.15.1 (root-owned `/usr/local/bin/node`), no nvm/brew. Installed nvm (v0.40.1) + Node 22 LTS (`v22.23.0`), `nvm alias default 22`, added `.nvmrc`. Vite v7 now boots with NO version warning. nvm sourcing is in `~/.zshrc` (terminal defaults to 22). Cosmetic leftover: `~/.npmrc` has `prefix=~/.npm-global` which nvm warns about — left untouched (don't break their global npm); fix per-session with `nvm use --delete-prefix` if needed.
- **MailerLite:** code was ALREADY fully wired — `src/lib/mailerlite.ts` fire-and-forget helper (no-ops while keys blank), called from `apply.functions.ts` + `paystack-webhook.ts`. Only real values were missing. Added empty placeholders to `.env` for the 3 group IDs actually used (CALLED_EXPERT, FREE_KNOWLEDGE_AUDIT, BUYERS) + API key. **Owner must paste real values from MailerLite dashboard.** (`.env.example` lists extra lead-magnet groups not referenced in code.)
- **First-admin / BLOCKER-001:** Roles = `user_roles` table + enum `app_role('admin','student')` + `has_role()`; new signups auto-get `student`; "Admins can manage roles" RLS is chicken-and-egg for the first admin. Plus signup-confirmation email is broken (BLOCKER-001 = `notify.chkplt.com` DNS, manual/owner-only). Built `scripts/bootstrap-admin.ts` (`bun run admin:bootstrap`) using SERVICE_ROLE key → creates pre-confirmed admin, sidesteps email. DNS still needed for end-user transactional email.
- **Missing `ms-ts-ss-assessment.png`:** asset never existed anywhere (incl. backup) — pre-existing broken ref in index.tsx (degrades gracefully via onError-hide). No ImageMagick/Canva on machine → created on-brand **SVG** cover (`public/product-covers/ms-ts-ss-assessment.svg`, charcoal/gold, brand fonts) and pointed the ref at it. Serves 200.
- **Build-time image pipeline:** chose dependency-free `scripts/optimize-images.sh` (sips, in-place, preserves filenames) over heavy vite-imagetools/sharp. Wired `bun run optimize:images`. Run manually when adding images (not hooked into build, to avoid in-place mutation during deploys).
- tsc clean; dev server boots; home + SVG + images all HTTP 200.

## 2026-06-21 — ROOT CAUSE: auth emails never sent (webhook signature mismatch)
- **Symptom:** password-reset (and all auth) emails never arrived even with Resend domain verified, hook enabled, and prod secrets loaded.
- **Diagnosis:** live `POST /api/email/auth/webhook` returned **401 not 500** → secrets ARE loaded; failure was signature verification. Code read header `x-supabase-signature` (format `v1=<sig>`) and HMAC'd the **body only**.
- **Reality:** Supabase Auth Send-Email hook uses the **Standard Webhooks** spec → headers `webhook-id` / `webhook-timestamp` / `webhook-signature` (`"v1,<b64> ..."`), signing `${id}.${ts}.${body}`. So every real call 401'd → zero emails.
- **Fix:** `src/routes/api/email/auth/webhook.ts` — added a correct Standard-Webhooks branch (additive; legacy `x-supabase-signature` + bearer kept as fallbacks so nothing regresses). `SUPABASE_AUTH_HOOK_SECRET` must be the full `v1,whsec_…` string (it is, 89 chars). tsc clean; crypto round-trip verified (valid accepted, tampered rejected).
- **ACTION:** redeploy the Worker for the fix to go live, then test `/reset-password` → Resend Logs `delivered`.

## 2026-06-21 — Email FULLY DIAGNOSED: pipeline works, two real gaps
- **Proven working end-to-end:** manually POSTing the service-role bearer to `/api/email/queue/process` drained a queued recovery email and Resend reported `last_event: delivered` to chiefmuhanelwa@gmail.com. So webhook→enqueue→processor→Resend all function after the signature fix.
- **Architecture:** ALL transactional email (auth hook, /apply, paystack receipts) calls `enqueue_email()` → pgmq queue. A single processor (`/api/email/queue/process`, Bearer = service-role key) drains it and sends via Resend. Emails are rendered at enqueue time (html/text live in the queue payload).
- **GAP 1 — queue never drained:** NO cron/scheduled trigger existed anywhere → every email enqueued and sat forever → zero email sent store-wide, no Resend logs. Fix: `supabase/migrations/20260621050000_email_queue_cron.sql` — pg_cron + pg_net POST the processor every minute, reading the service key from Vault (one-time `vault.create_secret(... 'email_cron_service_key')`, run manually so no secret in repo).
- **GAP 2 — no account:** auth.users = 0, so `/reset-password` silently no-ops (Supabase won't email a non-existent user). Fix: `bun run admin:bootstrap -- <email> <password>` (creates a confirmed admin, no email needed). NOTE: normal signup is circular until the cron is live (confirmation email also goes through the queue) — bootstrap sidesteps it.
- **Minor cosmetic:** on success the processor INSERTs a new email_send_log row status='sent' with the same message_id the webhook already inserted as 'pending' → likely a unique(message_id) conflict, so the 'sent' row may not persist (row stays 'pending' though the email delivered). Queue-delete handles dedup, so non-blocking. Worth tidying later.
- Verified earlier: webhook signature fix is LIVE in prod (signed probe → 400 not 401); Cloudflare `SUPABASE_AUTH_HOOK_SECRET` matches Supabase hook secret.

## 2026-06-21 — EMAIL FULLY RESOLVED (cron auto-drains, end-to-end automatic)
- Final clean test: enqueue → no manual trigger → cron drained & Resend delivered in **63s**. Whole pipeline (auth/apply/receipts → enqueue → pg_cron 1/min → processor → Resend) is hands-off.
- **The cron's 403 was NOT Cloudflare — it was a key mismatch.** The queue processor returns 403 when the Bearer token is present-but-wrong (200 correct / 403 wrong / 401 empty). Supabase's dashboard now defaults to the NEW `sb_secret_…` API key, but the Worker validates the LEGACY `service_role` JWT (`eyJ…`, 219 chars). The user kept pasting the new key → 403. Fix: feed the cron the exact legacy JWT from `.env` (generated via a terminal one-liner to avoid 219-char copy errors).
- Distinguish the two 403s we hit: (1) GoTrue auth-hook 403 = genuinely Cloudflare Bot Fight Mode (that endpoint never emits 403) → fixed by disabling Bot Fight Mode. (2) cron→processor 403 = Worker rejecting wrong key. Different endpoints, different causes — don't conflate.
- ⚠️ MIGRATION CAVEAT: committed `supabase/migrations/20260621050000_email_queue_cron.sql` uses a Vault-based key. The LIVE cron was instead created manually in the SQL Editor with the legacy JWT embedded (Vault path was an extra failure point). A future `supabase db push` would reschedule the Vault version and could break the working job unless the Vault secret `email_cron_service_key` is set to the legacy JWT. Either set that Vault secret, or convert the migration to doc-only.
- ⚠️ SECURITY: the legacy service_role JWT got printed into chat/terminal during debugging. Rotate post-launch (Supabase → Settings → API), updating .env + Cloudflare Worker secret + the cron together.
- Cloudflare cleanup: the WAF allow-rule on `/api/email/*` is harmless to keep; Browser Integrity Check (if toggled off) can be re-enabled — it was not the cause.

## 2026-06-21 — Admin panel fixes (upload, navigation, access guards)
- **Product upload "broken" was mostly the no-admin-account problem** — Storage RLS (`20260526091000`) allows `has_role(auth.uid(),'admin')` on product-covers/product-files, and the browser client carries the admin's session, so upload works once you're an admin. Real bug fixed: extension parsing in admin.products.tsx (`split(".").pop()` returned the whole filename when no dot → garbage storage path). Added `pickExt()` + whitelists (COVER: png/jpg/jpeg/webp, FILE: pdf/epub/zip) and `sanitizeName(slug)` in the path. Kept the direct client upload (supports 50MB; server-fn route would cap ~30MB via base64).
- **Navigation: the curriculum editor (`/admin/curriculum/$productSlug`) was fully orphaned** — no link anywhere. Added a BookOpen "Edit curriculum" link on each product row in admin.products.tsx. (All other admin routes are linked from dashboard admin tiles.)
- **Access guards:** admin.import-contacts / admin.incidents / admin.ledger / admin.curriculum.$productSlug had NO `beforeLoad` admin guard (only products + contacts did) — non-admins saw the shell then errors. Added the same guard to all four (verified: unauth → HTTP 307 redirect).
- Cleanup: dashboard admin "Contacts" tile used `dangerouslySetInnerHTML` for static `"View &amp; tag"` → plain `{t.sub}`.
- tsc clean; dev boots clean; `/`, `/dashboard` → 200, guarded admin routes → 307.
- REMAINING (from audit, not yet done): BUG7 curriculum inline edits have no `.catch` (silent save failures); BUG9 `/admin/import-contacts` throws on happy path if the `legacy_prelaunch_may_2026` tag row is missing (the other import path auto-creates tags — this one doesn't); BUG10 two divergent contact-import implementations with heuristic inserted/updated counts.

## 2026-06-21 — Funnel parity build (GHL blueprint → CHKPLT)
Spine already matched blueprint. Built the 4 gaps the user picked:
- **Abandoned-cart recovery + post-purchase drip (D1/D3/D7) + re-engagement fix** → `supabase/migrations/20260621060000_funnel_parity_agents.sql`. New pg_cron department agents (`dept_recover_agent` hourly, `dept_drip_agent` daily) enqueue emails IN-DB via enqueue_email (no Cloudflare hop → no key/403 issues). Fixed `dept_deliver_agent` table bug (`lms_lesson_progress`→`lesson_progress`). **USER MUST APPLY THIS MIGRATION** (SQL editor or db push) — pg_cron/pg_net already enabled from the email cron.
- **LMS progress read-back** → `getMyCourses` now returns total/completed/percent per course; `/learn` shows a progress bar + Resume/Completed label.
- **UTM capture** → `src/lib/utm.ts` (capture on load in `__root`, persist to sessionStorage, `getUtm()` spread into all 3 checkout calls). Stored in `orders.metadata.utm` + `subscribers.source` (`utm:<source>`).
- **FB Pixel + GA** → `__root.tsx` env-gated scripts (`VITE_FB_PIXEL_ID`, `VITE_GA_ID`); `src/lib/track.ts` fires Lead (checkout submit ×3) + Purchase (success page when paid). PageView auto. **Pixels are no-op until the two VITE_ env vars are set in Cloudflare prod** (added empty to .env).
- tsc clean, built, deployed (version e5ddb4c1).
- Still gaps from blueprint (not built, lower priority): order-bump at checkout, full CRM pipeline/custom-fields, analytics IDs (user-supplied).

## 2026-06-22 — Funnel-parity agents: applied & verified
- Migration applied; all 3 agents return 204 via `/rest/v1/rpc/<fn>` and log to agent_events. 0 queued (no qualifying rows yet — expected). Crons `dept-recover-hourly` + `dept-drip-daily` scheduled.
- **Gotcha 1:** function bodies are `$$`-delimited → use SINGLE quotes inside; only double `''` for literal apostrophes. I over-escaped one `split_part(...,'' '',1)` line → `42601`. Fixed to single quotes.
- **Gotcha 2:** `agent_events.department` has CHECK IN ('attract','qualify','deliver','revenue','retain'). New depts 'recover'/'drip' violated it → whole function rolled back (23514). Mapped recover→'revenue', drip→'deliver' instead of altering the constraint.
- Tip: public void functions are callable as PostgREST RPC (`POST /rest/v1/rpc/<fn>`) with the service key — great for verifying pg_cron functions execute without a live cron tick.

## 2026-06-22 — 8 digital products listed & made purchasable (from Drive)
- Source: 2 Google Drive folders (8 PDFs + mockups), publicly shared → downloadable via `https://drive.google.com/uc?export=download&id=<ID>` (no auth needed for link-shared files).
- Pipeline: bash curl-download PDFs+covers → `sips -Z 1000` covers → upload to Supabase Storage REST (`POST /storage/v1/object/<bucket>/<path>` + `x-upsert:true`). Then bun upsert product rows via PostgREST (`POST /rest/v1/products?on_conflict=slug` + `Prefer: resolution=merge-duplicates`). product-files = private (signed URLs), product-covers = public.
- 7 NEW products (what-to-post R149, 30-day-content-calendar R99, niche-bundle R199, creator-starter-system R49, 90-day-creator-blueprint R299, tax-creator-bundle R199, monetise-your-expertise R299) + updated influencers-code-ebook (attached file+cover, kept R149). All garden=esev, published.
- Tax bundle had no Drive mockup → generated on-brand SVG cover, uploaded to product-covers.
- Each product auto-gets a landing page at /products/<slug> (rich copy populated: tagline/description/long_description/benefits). Delivery verified end-to-end via signed URL (200, real PDF).
- Still NO-FILE (expected): called-expert-* (LMS courses, need curriculum not PDFs) + influencers-code-print (physical/shipped).
- Unused Drive mockups (no PDF yet): your-first-brand-deal-script, the-imposter-syndrome-fix, paids-framework.

## 2026-06-23 — Testimonials + Meta video + conversion stack (order bump + 1-click upsell)
- **Testimonials:** curated 8 real screenshots from iCloud (folders SOCIAL PROOF AND TESTIMONIAL / TESTIMONIALS 2 / COMMENTS TESTINONIAL / META) → optimized (sips -Z 1000, strip EXIF) → public/testimonials/ → masonry "Don't take my word" section in index.tsx. Owner approved as-is (public comments).
- **Meta credibility:** stage photo (Meta logo behind him) in public/meta-summit-stage.jpg + a "Invited by Meta" section. Video is a YouTube SHORT (`_JYjzFDrSgs`) — embedded in a PORTRAIT frame (max-w-[340px] aspect-[9/16]); the raw .mp4 was 292MB (7.88GB MOV) — too big to self-host, no ffmpeg → YouTube is the right host. `META_VIDEO_ID` const mirrors `INTRO_VIDEO_ID`.
- **Order bump:** product `creator-swipe-vault` (R290/$17, stand-in deliverable). `initializeCheckout` now takes `bumpSlugs[]` → extra order_items + summed Paystack amount. Webhook ALREADY grants every order_item → bump auto-delivers. Checkout checkbox in CheckoutModal; `verifyCheckout` returns `bumpSlugs` → success page renders a DownloadCard per item.
- **1-click upsell:** product `asset-accelerator` (R3,600/$197). `payment_authorizations` table captures the reusable card auth in the webhook (NON-FATAL try/catch — never breaks grants if unmigrated). `chargeUpsell` server fn uses Paystack `transaction/charge_authorization` to charge the card-on-file (only if `reusable===true`); webhook grants via the order (reuses all existing flow). Success page `OneClickUpsell` for kit buyers; no-auth → falls back to /products/asset-accelerator.
- ⚠️ **2 migrations to APPLY:** `20260623120000_subscriptions.sql` + `20260623140000_payment_authorizations.sql` (both no-secrets, SQL Editor). Code is deploy-safe before they're applied.
- ⚠️ **Stand-in deliverables:** bump=what-to-post.pdf, upsell=monetise-your-expertise.pdf — swap for real assets (Swipe Vault, Recordings Vault) when ready.
- charge_authorization can't be fully tested without a real card-on-file (a prior purchase capturing a reusable auth) — validate with a live/test purchase.
- Deploys: testimonials/Meta e75736fd → bump fe1c73b5 → upsell ed162526.

## 2026-06-23 — Resale manual + course hosting decision
- Created `docs/SYSTEM-BUILD-MANUAL.md` — the duplicable "build the whole system" blueprint for selling Funnel-Building-as-a-Service (8 sections: system, feature inventory, tools, budget at 3 scales, pre-knowledge, build SOP, the traps/lessons, how to package & sell). This manual IS the resale asset — keep it current.
- **Video hosting decision: Cloudflare Stream** (native to the CF stack, signed/gated URLs, ~$1–5/mo pay-as-you-go). LMS lesson player renders `video_url` as a raw iframe (`learn.$slug.$lessonSlug.tsx`) → accepts any embed URL. v1 = standard embed (lesson page already gated by product_grants); v2 = `requireSignedURLs` + a signed-token server fn for true link-share protection.
- Personal-brand course (`~/Documents/HOW TO START YOUR PERSONAL BRAND IN 30 DAYS`): Intro + 9 modules (What is a PB, Blueprint, 3Cs, SWOT, 3Es, Community, Platforms, PAIDS, Online Asset), ~600MB, 4 mp4s downloaded + 6 iCloud-dataless. Maps 1:1 to the Called Expert frameworks → becomes the LMS course `personal-brand-30-days`.

## 2026-06-23 — Global USD display + white-canvas accessibility pass
- **Currency: one currency everywhere = USD.** Old `formatPrice` geo-gated (ZA→R, intl→$), which is why the owner saw a R/$ mix. Rewrote it to ALWAYS render USD: explicit `USD_DISPLAY[slug]` override → native USD → else convert ZAR via `ZAR_PER_USD = 18.5` (rounded to whole $). Charge stays ZAR (Paystack can't bill USD). `country` param kept for signature compat but ignored (`_country`).
- Added "billed in ZAR at checkout · local equivalent" microcopy at every price point (CheckoutModal, products.$slug, cohort/facilitator cards, apply footer) — honest because Paystack shows ZAR at pay step.
- Converted ALL hardcoded ZAR price strings → USD: cohort R18,000→$970 (+R6,500×3→$350×3), VIP R45,000→$2,430, niche-clarity R299→$16 (meta+fallback), apply income brackets (labels only; INCOME_MAP scoring values stay ZAR), rejection email, editor-cost lines. Added `contentpreneur-90day-cohort: 97000` to USD_DISPLAY.
- **KEEP IN RAND:** proof-story figures (R600K Meta, R180K AdSense, R6K phone, R350 deals) — they're verified income receipts (brand bible), not prices. Don't convert.
- Admin product list now shows USD (passes slug) + a small "charged R…" hint so the owner still sees the actual ZAR charge.
- **Colour: cream canvas → WHITE.** Page bg was hardcoded `bg-[#FAF7F0]` inline per-section (NOT the `--background` token), so changing the token alone wasn't enough — had to sed `bg-[#FAF7F0]`→`bg-white` across index/apply/about/site-header (32 spots). Also set `--background:#FFFFFF` for token-driven routes (products/admin/learn).
- **Gold-text legibility trap:** gold `#C9A84C` as TEXT on white = ~1.9:1 (fails). But gold as FILL (buttons) must stay bright. Can't repoint one token for both. Solution: added `--nx-gold-text:#8A6D1F` (4.8:1 on white = AA), then an UNLAYERED CSS override `.text-banana{color:var(--nx-gold-text)}` (unlayered beats Tailwind's layered utility) + descendant scope `.bg-[#1C1C1C] .text-banana, .bg-[#111111] .text-banana {color:var(--nx-gold)}` so gold text auto-goes deep on white / bright on dark sections. Consolidated all `text-[#C9A84C/D4B65C/...]` → `text-banana` (sed) so they inherit the override. `bg-banana` untouched (buttons stay bright).
- **Invisible-text bugs found & fixed:** `text-[#bbb]`/`#ccc` stranded on the now-white apply page + checkout modal strikethrough (→ #555/#888); dark FOOTER used near-black `#555`/`#444` text on charcoal (→ #bbb/#999) — was barely visible even before.
- zsh gotcha: unquoted `$VAR` with spaces does NOT word-split (unlike bash) → `for f in $FILES` ran once on the whole string. Use an explicit file list or `${=VAR}`.
- Deploys: contrast/testimonials 7bb1ee26 → 080eec10 → USD+white 39e05cec.

## 2026-06-23 — Funnel audit (pre-launch, for tomorrow's full test pass)
- Ran a read-only audit (nav/links, dead buttons, payment, delivery, bump/upsell, admin, LMS, auth, analytics). Code-level result: funnel is largely WIRED end-to-end — no broken `<Link>` routes, no stub buttons, payment+webhook+grant+delivery+bump+upsell+subscription all coded and idempotent. See `docs/TOMORROW-TEST-PLAN.md` for the full checklist.
- The remaining gaps are DATA + LIVE-TEST, not code: (a) confirm every purchasable slug is published with a real `download_path` (null → "No download available"); (b) live test pur chase → receipt → download; (c) capture a reusable card auth then test 1-click upsell `chargeUpsell`; (d) bump/upsell still point to STAND-IN PDFs; (e) personal-brand-30-days video_urls empty until Cloudflare Stream; (f) analytics env IDs (VITE_FB_PIXEL_ID/VITE_GA_ID) + MailerLite group IDs unset = silent no-op.

## 2026-06-23 — Offer Builder: first interactive app (AI lead magnet, rung 04)
- Built `/offer-builder` — a free, email-gated AI tool that turns a user's skill into a complete sellable offer (name, promise, deliverables, USD price, this-week action). Decisions (owner-approved): FREE email-gated lead magnet; serves BOTH ICPs via a "who do you serve?" selector (Called Expert = premium pricing band, Content Creator = accessible band).
- **First AI in DEB.** Added `@anthropic-ai/sdk` (^0.105.0, npm). New `lib/anthropic.ts` (getAnthropic(), `OFFER_MODEL="claude-opus-4-8"` — flagship tool, quality = the value prop; swap to sonnet-4-6 for cost). Key = Cloudflare Worker secret `ANTHROPIC_API_KEY` (read via `process.env`, nodejs_compat on).
- **Self-contained** (no cross-project import from full-content-system) — distilled the NoChill voice + frameworks (PAIDS/DARES/4E/SEEDS) + the 2 ICP profiles into one `BRAND_SYSTEM` prompt string in `lib/offer-builder.functions.ts`. Better for the resale/duplicable goal. full-content-system already uses Anthropic (claude-sonnet-4-6) — I ported the PROMPT, wrote fresh SDK calls.
- **Structured output:** `client.messages.create` with `output_config.format` (JSON schema) → guaranteed JSON, no prose leak (so thinking can stay off = faster). Passed `output_config` via an untyped spread `...({output_config:{...}} as Record<string,unknown>)` so it compiles on any SDK version (the API honours it regardless of the SDK's typings). Parse the first text block; try/catch → friendly error.
- Reused DEB plumbing verbatim: `submitApplication`-style `createServerFn({method:"POST"}).inputValidator(zod).handler`, `verifyTurnstile` (TURNSTILE_SECRET_KEY, dev no-op), `addToMailerLiteGroup` (ICP1→CALLED_EXPERT group, ICP2→FREE_KNOWLEDGE_AUDIT), `TurnstileGate` ("dev-skip" sentinel), apply.tsx wizard pattern (step gating, GOLD_GLOW, nav).
- Lead capture: new table `offer_builder_leads` (migration `20260623160000`, RLS on, service-role only). Insert is NON-FATAL `as any`-cast so the tool works before the migration is applied; MailerLite is fire-and-forget too.
- **GOTCHA — route tree before tsc:** `tsc --noEmit` failed with "`/offer-builder` not assignable to FileRoutesByPath" on `createFileRoute` + every `<Link to="/offer-builder">` — because `routeTree.gen.ts` is regenerated by `bun run build` (the TanStack Vite plugin), NOT by tsc. Fix: run `bun run build` first (regenerates the tree), THEN tsc passes. New-route flow = build → tsc → deploy, not tsc → build.
- **GOTCHA — curl can't verify content:** chkplt SSR ships a ~10KB hydration shell; visible text renders client-side, so `curl | grep "heading"` finds nothing on ANY route (incl. known-good /apply). Verify routes by HTTP 200 vs 404 (bogus path) + route presence in routeTree.gen.ts, not by grepping body text.
- Wired homepage ladder rung 04 ("Interactive Apps · Coming") → live "Offer Builder · Free · NEW·LIVE" linking `/offer-builder` (new `kind:"app"` branch in the ladder map). Confirmed my prior USD-global + white-canvas work survived the c90ad28 ladder restructure (working tree = latest live; my files were purely additive).
- Deploy `09b6fc01`. ⚠️ OWNER ACTION: set `ANTHROPIC_API_KEY` as a Cloudflare Worker secret (`wrangler secret put ANTHROPIC_API_KEY`) — until then generation throws "ANTHROPIC_API_KEY is not set" (UI/lead-capture still work). Optional: apply the `offer_builder_leads` migration.

---

## 2026-06-25 — ICP-1 Refocus + "Modern Professional" global redesign (branch `redesign/icp1-modern-professional`)

- **Theme single source of truth = `src/styles.css`** (Tailwind v4 `@theme inline` + `:root`; there is NO tailwind.config). Migrated Heritage Gold → Modern Professional (slate `#0F172A` ink + amber `#F59E0B` accent + white) by changing token VALUES while keeping token NAMES (`--nx-gold*`, `--banana`, `--nx-orange`, all `--color-*`). Result: all 45 shadcn `ui/*` + every `.nx-*` class re-themed automatically. Backed up old theme to `src/styles.heritage.bak.css`.
- **Amber text-contrast gotcha:** amber-500 `#F59E0B` fails AA as text on white (~1.9:1). So gold-as-text maps to amber-700 `#B45309` (~4.7:1), gold-as-bg/border maps to `#F59E0B`, primary buttons use amber bg + DARK `#0F172A` text (~8.9:1). When bulk-replacing, do `text-[#C9A84C]`→`text-[#B45309]` FIRST, then generic `#C9A84C`→`#F59E0B`.
- **zsh word-split gotcha:** `sed ... $FILES` (unquoted var) does NOT word-split in zsh → "No such file or directory" for the whole string. Pass files literally to sed, or use `${=FILES}`.
- **Bulk retheme via sed across many files** (email-templates ×7, the 7 routes that hardcoded `#C9A84C`/`#1C1C1C`, apply.functions HTML, index.tsx kept helpers). Edit tool can't do cross-file; sed is the right tool here. Always grep-verify "remaining old literals" after.
- **Montserrat was referenced but never loaded** — only Inter was in the Google Fonts link. Added Montserrat to the `<link>` in `src/routes/__root.tsx`.
- **Persistent nav without touching 11 pages:** all `_authenticated/*` pages render their own `SiteHeader` across multiple branches. Instead of stripping/centralizing (risky), made `SiteHeader` itself render the full member nav when `useAuth().user` exists (+ a cached `has_role` query for the Admin link). One component change = consistent labelled nav on every public/member/admin page.
- **Homepage surgery on a 1851-line file:** kept lines 1–388 (CheckoutModal w/ built-in order bump, CtaButton, FaqItem, FAQS, BEFORE_AFTER) via `head -388`, appended a new clean `Landing` (single ICP-1 tripwire). 1851 → 673 lines. The $97 checkout + order bump flow was preserved untouched.
- **Verify-by-CSS, not body text:** confirmed the deploy by fetching the hashed CSS bundle and grepping it — amber `#F59E0B` ×30, slate `#0F172A` ×23, old `#C9A84C` ×0. (Body text is client-rendered; curl of `/` only shows the head — font link + title were verifiable there.)
- New routes (build → tsc → deploy order, per the prior route-tree gotcha): public `/tools`, member `/dashboard/tools`, `/dashboard/products/free` + `/paid`. Non-qualifier CTA in `apply.tsx` now → Foundation Kit checkout + `/tools` (was `/`).
- Deploy version `504fe2bb`. ⚠️ OWNER: branch NOT merged to main. `.env` is git-TRACKED (pre-existing) — untrack + rotate secrets. Deferred (Phase 6): post-purchase 1-click upsell, scarcity countdown, dynamic geo-currency, ICP-2 creator clone.

---

## 2026-06-25 (Round 2) — Mobile fixes, founder story + real proof images, housekeeping

- **Portrait video bug:** the Meta talk is a YouTube *Short* but the embed wrapper used `aspect-video` (16:9) → vertical video letterboxed with grey bars. Fix = `aspect-[9/16] max-w-[300px]`. (Constant comment already said "YouTube Short — vertical" — heed it.)
- **White gap under footer (mobile):** root `<div class="… bg-white … pb-20 sm:pb-0">` put 80px of WHITE padding below the dark `<SiteFooter>` (the pb was to clear the fixed mobile buy-bar). Fix = remove pb from the white root; wrap the footer in `<div class="bg-[#0F172A] pb-20 sm:pb-0">` so the trailing space is dark.
- **Proof images pipeline (no base64):** owner's images live in iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/…`, e.g. `SAMA31 - 2025/`, `META/`) and Google Drive (MCP). Local iCloud = plain `cp` (free). Google Drive `download_file_content` returns base64 into context (~1.3× filesize) — AVOID for binaries; prefer the local iCloud copies. Picked the best shot by Read-ing 1–2 candidates (UUID filenames are opaque). Optimized with macOS `sips -Z 1200 -s formatOptions 72` → 1.3M/925K → 122K/188K. Output to `public/proof/`; Vite copies `public/` → `dist/client/` on build. Verified live via image HTTP 200 + grepping the built route chunk (`dist/client/assets/index-*.js`) for the new strings (body is client-rendered, so curl of `/` won't show section text).
- **Proof-claim accuracy catch:** owner said "10 awards · SAMA 30/31/32 consecutive" but CLAUDE.md verified table said "9 awards · SAMA31", and SAMA32 = 2027 (future as of 2026-06-25). Asked → confirmed **10 awards · SAMA 30 & 31** (dropped 32). Updated both project + global CLAUDE.md. Lesson: when an owner-stated proof number conflicts with the documented verified table OR implies a future date, confirm before publishing (rules forbid fabrication; public + hard to reverse).
- **Brands on the strip:** owner named Disney + DStv, but chose **verified-only** (Capitec, Standard Bank, Netflix, Suzuki, SA Tourism, Showmax, ABSA) — dropped the undocumented ones.
- **Housekeeping:** merged `redesign/icp1-modern-professional` → `main` (--no-ff), pushed (`c90ad28..aefb095`). Untracked `.env` (`git rm --cached` + `.gitignore` `.env`/`​.env.*`). ⚠️ `.env` is in prior git HISTORY — owner must rotate the Supabase service-role key + other secrets. Deploy version `20178973`.

---

## 2026-06-25 (Round 3) — footer, overscroll, real proof wall, public/ hygiene

- **Footer = Company only** (owner: "footer must only have Company details"). Removed the Explore column from `SiteFooter`; tools/products live in the dashboard.
- **Persistent white "end" on scroll** = mobile Safari rubber-band showing the white `<html>`/`<body>` bg below the dark footer. Fix: `html { background-color: #0F172A }` in styles.css so bottom overscroll matches the footer. (The earlier dark footer-wrapper alone didn't cover overscroll.)
- **Cloudflare Workers asset limit = 25 MiB/file.** Deploy failed: `Ensure all assets … conform with the Workers maximum size requirement`. Cause: owner had dragged a 1GB `public/INBOX/` (`.mbox` email archives, 456MB each) + `public/Influencer's Code materials/` into the web `public/` dir → Vite copies all of `public/` to `dist/client/`. Fix: `rm -rf` those from `public/` (originals safe in iCloud). Lesson: keep `public/` to web assets only; check `find public -type f -size +20M` before deploy. Verified they never entered git history.
- **Can't pull Google Drive binaries to disk** with available tools: `curl "drive.google.com/uc?export=download&id=…"` returns Google's HTML auth/confirm page (not the file) for these shares; the MCP `download_file_content` returns base64 into context (can't write binary via Write). → For owner images, use LOCAL sources (iCloud `cp`, or files the owner drops into `public/`). Book cover still pending: wired an onError-hidden `<img src="/proof/book-contentpreneur.png">` slot that auto-appears once the file is added.
- **Real proof wired:** owner pre-curated `public/founder-award.jpg` (holding the Humanz Top 20 Creators Worth Following 2026 award — excellent), `public/meta-summit-stage.jpg`, and `public/testimonials/t*.{png,jpg}` (7 unedited comment/receipt screenshots). Story grid now uses the award + stage photos; testimonials section is a CSS-columns masonry of the real screenshots (`columns-1 sm:columns-2 lg:columns-3`, `break-inside-avoid`). Authentic > transcribed.
- ⚠️ Leftover: many stray dumped images at `public/` root (IMG_*.JPG, UUID.JPG, tmp*.webp) are tracked and bloat `.git` (~119M). Optional cleanup later (verify unreferenced first). Deploy version `1ec5cdd9`; pushed `7b558ce`.

---

## 2026-06-25 (Back end / new Supabase project / email / $97) — receipts

- **New Supabase project** `usxjlylquvrmlwxykgyt` (old `yarzvthhsvfvdsoldblz` was paused → NXDOMAIN). Switched all 4 keys in `.env` (VITE_SUPABASE_URL/PUBLISHABLE + SUPABASE_URL/PUBLISHABLE) + rebuilt so the build-inlined client points at the new DB. New project already had: 19 products, 12 modules, 40 lessons, owner=admin, RLS, has_role, pgmq + enqueue_email, email_send_log/state.
- **Worker env gotcha (the big one):** Cloudflare Worker does NOT populate `process.env.SUPABASE_*` from `.env`. Fixes:
  - `client.server.ts` (service-role) → `process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL`; key stays `process.env.SUPABASE_SERVICE_ROLE_KEY` (a wrangler secret).
  - `auth-middleware.ts` (requireSupabaseAuth) → same VITE fallback for URL **and** PUBLISHABLE_KEY. This was the "Missing SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY" on Ledger/Courses. NOTE: file is marked "auto-generated (Lovable)" but Lovable is gone → safe to edit.
  - Almost every server fn ultimately uses `supabaseAdmin` for data; `requireSupabaseAuth` is only the auth gate. So both fixes + the service-role secret were ALL required.
- **Service-role key** set via `printf %s "<jwt>" | bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`. (Owner first ran `wrangler secret put <jwt>` — wrong: that makes the JWT the secret NAME. Cleaned up 2 junk secrets the same way later for Turnstile.) Proven working by POSTing `/api/cron/sync-fx` (service-role bearer) → updated 9 products. ⚠️ key exposed in chat → rotate.
- **Checkout confirmed end-to-end** (owner reached Paystack). DB: 2 orders `pending`, payments `initialized`, **tax_reserve_cents = 25% of total** (SARS rule working). Paid→grant→receipt is webhook-driven (charge.success) and fully coded; webhook reachable + HMAC-enforced (POST w/o sig → 401).
- **Email delivery — two bugs:**
  1. No queue drain on the new project → everything `pending`. Fix: Cloudflare cron `"* * * * *"` in wrangler.jsonc + `scheduled()` branches on `event.cron` (daily=fx-sync, minute=POST `/api/email/queue/process` with service-role bearer). Avoids per-project pg_cron setup.
  2. Receipt sent from **unverified** `chkplt.com` → Resend 403 "domain is not verified", logged `dlq`. `notify.chkplt.com` IS verified (test send → `sent`). Fix: `paystack-webhook.ts` FROM_DOMAIN `chkplt.com`→`notify.chkplt.com` (auth + apply emails already used the verified subdomain). Diagnosed by enqueuing test emails via `POST /rest/v1/rpc/enqueue_email` then draining.
- **Turnstile** was OFF (no secret). Set `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` via wrangler secret (runtime, no rebuild — site key read server-side via `getTurnstileSiteKey` → `process.env.TURNSTILE_SITE_KEY`, NOT a VITE var; fixed `.env.example`). Identified which key was secret via Cloudflare siteverify (`invalid-input-response` = valid secret; `invalid-input-secret` = it's the site key).
- **$97 fulfillment:** kit = `deshe` product, `download_path=called-expert-foundation-kit.zip` (exists in `product-files` bucket). LMS modules belong to the Accelerator, not the kit. Built **Foundation Kit Workspace** `/dashboard/foundation-kit` (gate: owns kit slug OR admin): downloads fillable PDFs (getMyDownloadUrl), 7 framework cards (Niche Clarity app live, rest "coming soon"), bundles existing TOOLS. Scaffold for rolling out the remaining 6 interactive framework apps + per-framework fillable PDFs.

## 2026-06-26 — Personal Branding video course + native interactive apps

- **Cloudflare Stream course wired into LMS.** Owner uploaded 10 videos to Stream (account `e474f450b9044f6a282e44878a52323a`, customer subdomain `customer-esnxfwirm3atddsc.cloudflarestream.com`, `requireSignedURLs:false` → public embed). Embed URL pattern: `https://customer-esnxfwirm3atddsc.cloudflarestream.com/<UID>/iframe`. **LMS already supported video** — `lms_lessons.video_url` renders via `<iframe>` in `learn.$slug.$lessonSlug.tsx`; admin curriculum builder already has a "Video URL (embed)" field. NO schema change needed.
- **A product becomes a course just by having `lms_modules` rows (FK `product_id`).** Attached the course module + 10 lessons to the **existing** `called-expert-foundation-kit` product, so the existing kit `product_grant` auto-unlocks it in `/learn` — no second product, no webhook change. INTRODUCTION lesson = `is_preview true` (viewable pre-purchase). Seed lives in `supabase/migrations/20260626002237_seed_personal_branding_course.sql` (idempotent `DO $$`, looks product up by slug, skips if module exists).
- **No service-role key in local `.env`** this session (only VITE_/publishable/Turnstile) → couldn't REST-seed; the seed must be applied by the owner via Supabase **SQL editor** (paste the migration) or `supabase db push`. Anon/publishable REST can READ published products (used to confirm kit id `b5d52468-7568-4849-bfc8-a2467dfadef3`) but can't write LMS tables (RLS).
- **`useKitAccess()` hook** (`src/lib/use-kit-access.ts`) extracted from the workspace gate (owns a `KIT_SLUGS` grant OR `has_role admin`) and reused by every app route. Returns `{access, ownsKit, isAdmin, loading}`.
- **Apps rebuilt NATIVE (not iframe).** The 4 export-ready `~/Desktop/Apps/*/… - App.html` bundles use the OLD charcoal/gold brand (`#1c1c1c/#cf9f2c`), not the slate+amber funnel — owner chose native rebuild. Read each app's small `.dc.html` source (~20K) to extract exact copy + scoring, then reimplemented as gated React routes in the funnel theme: `/apps/niche-clarity-builder`, `/apps/paids-auditor`, `/apps/knowledge-audit`. Wired into the workspace `FRAMEWORKS` (app link flips "coming soon" → "Open interactive app"). Apps kept OUT of public `TOOLS` (kit-gated).
- **New gated routes need the route tree regenerated before `tsc`** — `createFileRoute("/_authenticated/apps/…")`'s type is validated against `routeTree.gen.ts`. Order: create file → `bun run build` (regenerates tree) → `bunx tsc --noEmit`. Used plain `<a href>` (not typed `<Link to>`) for cross-route app links to avoid type churn.
- **Deferred:** Consistency Blueprint (full 30-day stateful LEGACY tracker — own build) and Right Side Diagnostic (only `.dc.html` source exists; owner must export a self-contained `… - App.html` first).

## 2026-06-26 (later) — first real Paystack test purchase + the onboarding/delivery fix
- **Paystack test purchase succeeded end-to-end** (payment → webhook → grant → receipt) once the worker's `PAYSTACK_SECRET_KEY` was swapped from LIVE → TEST (owner had a live key; gateway rejected the test card until swapped via `printf %s "sk_test_…" | bunx wrangler secret put PAYSTACK_SECRET_KEY`). Remember to swap back to live before real selling.
- **🔴 Critical bug found in the buy flow:** the webhook only set `product_grants.user_id` if a `profiles` row already existed for the buyer's email. A brand-new buyer → grant saved with `subscriber_id` only, `user_id = NULL`. The dashboard + `useKitAccess` gate on `user_id` grants → **buyer pays and the kit stays locked.** No account was ever created at purchase. Fix in `paystack-webhook.ts`: `ensureBuyerUserId()` now `auth.admin.createUser({email, email_confirm:true})` (or re-resolves if already registered), upserts grants with that `user_id`, and `auth.admin.generateLink({type:'magiclink', redirectTo:'/dashboard/foundation-kit'})` → a one-click sign-in link embedded in the receipt. Belt-and-suspenders: `claimMyGrants` server fn (products.functions.ts) links email-only grants to the user on every `_authenticated` page load.
- **🔴 Delivery mismatch:** `called-expert-foundation-kit.zip` contained **5 ICP-2 creator PDFs** (Tax/What-To-Post/90-Day/Niche/Monetise, all Google-Drive links) — NOT the Called Expert kit the homepage sells. Fix: kit delivers via the workspace (apps + course + per-framework workbooks); `download_path` set NULL on the kit; the 5 PDFs split into a separate DRAFT product `creator-launch-bundle` (migration `20260626013917`). Thank-you page now shows a kit onboarding card → `/dashboard/foundation-kit` (was leading with the wrong ZIP "Download now").
- **Brand:** receipt `SITE_NAME` was "Christ Kingdom Platform" → changed to **CHKPLT** to match the site wordmark.
- **Magic-link caveat:** `generateLink` redirect needs Supabase Auth → URL Config: Site URL `https://chkplt.com` + redirect allow-list `chkplt.com/**`, else it falls back to Site URL. Link respects the OTP expiry (≈1h) — receipt also gives the `/login` + “forgot password” fallback (account is email-confirmed, so it always works).
- **The $97 kit is now "The Clarity System" — a guided 7-step journey (deploy dec17af0).** SoT `src/lib/clarity-system.ts` = 7 steps {stage, title, question, woven Stream video UIDs, tool route(s)+pdf key, nextAction} + `localStorage` progress (`clarity-progress-v1`). Kit workspace renders the journey: each step plays its matching course video inline, opens its tool, shows ONE bold next action, ticks complete → progress bar + end "Clarity Plan" + Accelerator upsell. Dashboard leads with "Continue — Step N". Stage→tool: 1 MS×TS×SS(new) · 2 Knowledge Audit+Niche · 3 4E Calendar(new) · 4 Right Side Diagnostic · 5 SEEDS(new) · 6 DARES(new) · 7 PAIDS. 4 new gated apps (`apps.{ms-ts-ss,4e-content-calendar,seeds-pipeline,dares-asset-model}`) on the existing pattern. Admin home grouped Catalog·People·Money·System. Free tools (ICP-2) removed from the ICP-1 funnel/header. **Phase 3+4 DONE (deploys 485dc52e, 2ac3d02a):** all 10 deliverables = 7 framework apps + 3 bonuses, each **app + PDF**. PDFs generated via `pdf-lib` (bun script in scratchpad `gen-pdfs.ts`; WinAnsi can't encode →/≥/≤/en-dash — sanitize before drawText) and uploaded to `product-files` via Storage REST (`POST /storage/v1/object/product-files/<name>`, service-role bearer + `x-upsert:true`). Wired in `KIT_FILES` + workspace `AVAILABLE_PDFS` + `CLARITY_BONUSES`; 90-Day Planner = new app `apps.first-income-planner`. ⚠️ **service-role key pasted in chat AGAIN → MUST rotate.** Still pending: `update products set garden='esev' where slug='called-expert-foundation-kit'` (kit shows "Free Tools" badge until then).
- **AI upgrade — tools became an advisor, not calculators (deploy cf151f8f).** `src/lib/tool-ai.functions.ts`: `getToolCoaching` (per-tool, `COACH_MODEL`=claude-sonnet-4-6 for cost, kit-gated via `assertKitAccess`) + `buildClarityPlan` (Opus, synthesises all 7 tools' saved answers → one-page personalised plan). Reusable `<AiCoach tool getPayload>` (`src/components/ai-coach.tsx`) wired into all 8 apps — sends the user's own state to Claude, renders "what's strong / one gap / next move". Kit workspace has **Build my Clarity Plan** (gathers `nochill-*-v1` localStorage keys → AI → printable plan) + a "how your kit works" orientation. `ANTHROPIC_API_KEY` already a worker secret (offer-builder uses it). Pattern copied from `offer-builder.functions.ts`. **Value-ladder verdict given (USD): free diagnostic → $97 kit (+$27 bump) → $197 OTO → $297 OTO → $39/mo continuity (the missing rung) → $997 cohort → $3,997 facilitator.** Owner chose USD-only $97 → Phase D = Stripe rail (⚠️ SA-payout risk: verify Stripe supports NOCHILL or display $ but charge Paystack) — NOT built, owner-gated. Phase E = re-shoot course as per-tool screen-walkthroughs, owner-gated.
- **🔴 Email queue 522 (root cause of "no onboarding email / can't get in"):** the every-minute cron did `fetch("https://chkplt.com/api/email/queue/process")` — a Worker fetching its OWN public hostname returns **Cloudflare 522**, so the queue never drained. Fix: extracted `drainEmailQueues()` into `src/lib/email-queue.ts` and call it **in-process** from `server.ts scheduled()`; the HTTP route now delegates to the same fn. Confirmed in tail: `[email-drain] {"ok":true,"processed":N}` (was `522` every minute). NOTE: something external also POSTs `/api/email/queue/process` every minute (a prior external cron) — harmless.
- **Member area "dead links / nothing works / shows $97" = the user was LOGGED OUT** (no email → no session). The header is auth-aware: `$97` CTA only renders when `!user`; every `_authenticated` link bounces to `/login` when not signed in. Not a routing bug (all member routes return 200).
- **🔴🔴 ROOT CAUSE of "the whole member area is disconnected / links open nothing / no course / no apps" (deploy 57bfca17):** `dashboard.tsx` and `learn.tsx` each rendered their OWN page content but had **no `<Outlet/>`**, while their dot-named children (`dashboard.foundation-kit`, `dashboard.products.*`, `learn.$slug`, `learn.$slug.$lessonSlug`) nest UNDER them in TanStack flat routing. With no Outlet, every child URL silently **re-rendered the parent** — proof: visiting `/learn/called-expert-foundation-kit` showed the `/learn` library list, and `/dashboard/foundation-kit` showed the dashboard. So the kit workspace, the 10-lesson course, and the apps were all unreachable via the UI. **Fix = the admin pattern:** split each parent into a layout (`component: () => <Outlet/>`) + an index page (`dashboard.index.tsx`, `learn.index.tsx`) holding the former content. **RULE: any TanStack flat-route file that has dot-named children MUST render `<Outlet/>` (be a layout); put its own page content in a sibling `*.index.tsx`.** The admin console already worked because it was built this way (`admin.tsx` = Outlet + `admin.index.tsx`). Verify after routing changes by actually loading a CHILD url, not just the parent. **This bug is RECURSIVE — check every level:** `learn.$slug.tsx` ALSO had children (`learn.$slug.$lessonSlug`) and no Outlet, so the lesson player showed the course outline at the lesson URL. Fixed by splitting `learn.$slug` into a layout + `learn.$slug.index` (outline) so `learn.$slug.$lessonSlug` (player) renders. Audit-all-parents one-liner: for each `routes/**/X.tsx` (non-index) that has `X.*.tsx` siblings, it MUST contain `<Outlet/>`. After fixes, the only member parents are dashboard/learn/learn.$slug/admin — all now Outlet.
- **Course "dead/locked" for the owner = no admin bypass in LMS.** `getMyCourses`/`getLessonBody`/`learn.$slug` gated on a purchase grant only; the owner never bought → empty /learn + locked lessons (apps worked because `useKitAccess` has an isAdmin bypass, LMS didn't). Fix: admin bypass in all three (admin sees every published course + can open any lesson). Real buyers unaffected (grant path).
- **Auth emails branded "Christ Kingdom Platform"** came from a SEPARATE `SITE_NAME` const in `src/routes/api/email/auth/webhook.ts` (+ `preview.ts`) — distinct from the order-receipt `SITE_NAME` fixed earlier. Both → "CHKPLT". (There are ~20 more "Christ Kingdom Platform" strings in page `<title>`/meta across public routes — cosmetic, not yet swept.)
- **reset-password** never navigated after `updateUser` → stranded on the page. The recovery link already establishes a session, so → `navigate({to:"/dashboard"})` after success.
- **Member account page** was owner/jargon ("Download my data → JSON of profile, subscriber record, orders, order items"). Replaced with real member settings (name via `supabase.auth.updateUser({data})`, password via `updateUser({password})`, close-account). Principle from owner: **don't surface things that don't exist in the member area** — also applied to the Foundation Kit (render only frameworks with a live app/PDF; hide "coming soon" cards until built).
- **Separate /admin console + member portal reorg (deploy edd5d823):** added `src/routes/_authenticated/admin.tsx` as a LAYOUT route — one `beforeLoad` admin guard (`has_role` → redirect non-admin to /dashboard) + `component: () => <Outlet/>`; `admin.index.tsx` = console home (tiles). The 6 `admin.*` pages keep their own beforeLoad (defense-in-depth) and just swap chrome import `member-shell` → `admin-shell` (`src/components/admin-shell.tsx`: slate/orange, "Member view" toggle). Verified the guard fires SERVER-side: `curl /admin` → **307** (redirect to login when not authed-admin) vs member routes 200 (client-gated). `useIsAdmin()` (`src/lib/use-is-admin.ts`) dedupes the has_role query. Member `dashboard.tsx`: removed all admin tiles; member-only quick access; "My access" grouped Courses & programmes / Downloads (classify by `download_path` presence; kit slug → /dashboard/foundation-kit); "Complete your toolkit" shows RECO_SLUGS upsells the member doesn't own. TanStack flat-routing: `admin.tsx` + `admin.index.tsx` + `admin.*.tsx` auto-nest (build regenerates routeTree).
- **Secured member portal:** member area reused the marketing `SiteHeader` (with `$97` + public nav) → felt un-separated. Built `src/components/member-shell.tsx` (exports `SiteHeader`/`SiteFooter` so only the import path changes) — own chrome, logo→/dashboard, nav Dashboard/My Courses/Account(+Admin)/Sign out, no marketing links. Repointed all 18 `_authenticated` routes from `@/components/site-header` → `@/components/member-shell` (Python bulk swap; shell-in-each-page, low blast radius). Bulk shell edits: zsh `for f in $files` re-expands `$slug` inside double-quoted filenames → use Python/glob, never a shell loop, for files with `$` in the name.

## 2026-06-27 — Aligned 2026 giveaway turned into a coded tool (/align-accelerate-excel)
- **Built a new PUBLIC interactive tool** from the static `aligned_takeaway.html`: `src/routes/align-accelerate-excel.tsx`. 12-question self-assessment (4 per phase × 1–5 = /20 each, /60 total), intro→q→result flow, per-phase bars, lowest-phase "START HERE" + NoChill-voice verdict, then the giveaway lead-capture, then product CTAs. Matches the existing tool conventions exactly (copied the `apps.right-side-diagnostic.tsx` step-machine pattern + `niche-clarity.tsx` public page pattern; nx design tokens; `SiteHeader/SiteFooter` from `@/components/site-header`).
- **Lead capture feeds the owned list (the whole point of a stage giveaway):** new server fn `subscribeAlignedToolkit` in `src/lib/aligned.functions.ts` → `assertTurnstile` (rule #5) → upsert `subscribers` (`source:'aligned-2026'`, captures `phone` for WhatsApp) → `addToMailerLiteGroup(...)`. New env `MAILERLITE_GROUP_ID_ALIGNED` with fallback to `MAILERLITE_GROUP_ID_FREE_KNOWLEDGE_AUDIT` — works today even before the env is set (MailerLite helper is fire-and-forget, silently skips if unset).
- **Registered in the tools hub:** added `/align-accelerate-excel` to the `Tool.path` union + `TOOLS[]` in `src/lib/tools.ts` (Compass icon, listed first). Shows on both public `/tools` and member `/dashboard/tools` automatically (single source of truth).
- **TanStack gotcha (re-confirmed):** new route files throw `TS2345 ... not assignable to keyof FileRoutesByPath` until `routeTree.gen.ts` regenerates. The router-plugin only regenerates on `vite dev`/`build`, NOT on `tsc`. Fix: start `vite dev` in background (~1s), poll `grep align-accelerate-excel src/routeTree.gen.ts`, kill it, THEN `bunx tsc --noEmit` → clean. macOS has no `timeout`; use `(cmd &)` + a `seq` poll loop instead.
- **Subscribers schema:** has `first_name,last_name,phone,source,status(enum active/unsubscribed/bounced/complained)`, upsert `onConflict:"email"`. `phone` column already exists — used it for WhatsApp capture (no migration needed).
- **Not yet done:** the success state PROMISES the email delivery ("toolkit is on its way") but no transactional email is wired to actually send the sprint/PDF on subscribe — currently it only lists the lead. Either (a) attach a MailerLite automation to the `aligned-2026` group/`MAILERLITE_GROUP_ID_ALIGNED`, or (b) add a queued transactional email. Wire before relying on it post-event.

## 2026-06-27 (later) — free framework PDF giveaway + public asset .html routing
- **Added a print-to-PDF framework guide** at `public/align-accelerate-excel-framework.html` (6 A4 pages: cover, the map BE→DO→HAVE table, one page per phase with verified examples + "your move", closing charge). Brand-styled (Heritage Gold #C9A84C, charcoal, Montserrat/Lato), `window.print()` button, `@media print` hides the bar. Linked from the tool's results page (`align-accelerate-excel.tsx`) as a free download card (no gate, no selling). Pure print-to-PDF — no PDF-gen dependency.
- **🟡 Cloudflare Workers static-asset gotcha:** files in `public/*.html` are NOT served at their `.html` URL — the assets layer 307-redirects `/foo.html` → `/foo` (extensionless, html_handling=drop). So `curl /align-accelerate-excel-framework.html` → 307 → `/align-accelerate-excel-framework` → 200. Link to the EXTENSIONLESS path in-app to avoid the redirect hop. Content still serves fine; just don't hardcode `.html` in hrefs.
- **Verified figures only in the giveaway doc:** R47 floor (2013), R6k phone (2014), R350 first deal (2017), R23,000 one day (Mar 2019), 30-day book at 05:00 (Sep 2025), Daniel 6 excellent spirit, SARS "just over R200,000", IG 780k lost, Ubuntu. No fabricated numbers.

## 2026-06-27 (later) — added Genesis 1:1 Time/Space/Matter layer to the framework
- Deepened the ALIGN→ACCELERATE→EXCEL framework with a third scriptural pillar (Myles Munroe creation teaching): **Genesis 1:1 — "In the beginning (TIME) God created the Heaven (SPACE) and the Earth (MATTER)"** mapped onto BE→DO→HAVE (BE=Time/invisible/first, DO=Space, HAVE=Matter). Teaching: God began with the unseen, so alignment (BE) must precede DO and HAVE.
- Content-only edit to BOTH giveaways: `public/align-accelerate-excel-framework.html` (cover verse, "pattern in creation" callout on map page, Time/Space/Matter in the posture column + per-phase tags & italic lines) and `src/routes/align-accelerate-excel.tsx` (`PHASE_META[*].be` now "Identity · BE · Time" etc. — propagates to question headers + intro cards; intro paragraph gained the Gen 1:1 creation sentence). No logic/schema/deps changed. tsc clean, deployed ee88aad9.

## 2026-06-27 (later) — talk-slide deck + responsive pass
- **Built a responsive speaker deck** `public/align-accelerate-excel-talk.html` (10 slides: Title → Floor → Question → Map → Align → Accelerate → Excel → Wall → Charge → Giveaway). Matches the framework (BE→DO→HAVE + Gen 1:1 Time/Space/Matter) and the quiz. Nav: arrow keys/space, on-screen Prev/Next, tap-left/right zones, touch swipe, N=speaker-notes toggle (per-slide `data-note` cues + `data-time` timing), F=fullscreen. Fluid type via `clamp()` → works phone/tablet/desktop. Speaker-only (not linked publicly).
- **Offline QR:** no `qrencode`/`python-qrcode`; installed `segno` (pure-python) → `public/qr-quiz.svg` (gold #C9A84C, error='h', transparent) pointing to chkplt.com/align-accelerate-excel. SVG embedded in the deck — renders crisp at any size, no internet needed at venue.
- **Framework PDF responsive fix:** it's a fixed 794px A4 print doc → added `@media screen and (max-width:840px)` block making `.page` fluid (width:100%, min-height:auto, static `.foot`, smaller headings) so it reads on phones; `@media print` still uses the 794px A4 layout (print is not `screen`, so the mobile override never affects the PDF output). Pattern: keep print fixed, override only `@media screen`.
- Quiz route already responsive (Tailwind `sm:` + `max-w-2xl`) — no change needed.
- All static giveaways live: /align-accelerate-excel (quiz), /align-accelerate-excel-talk (deck), /align-accelerate-excel-framework (PDF), /qr-quiz.svg. Deploy 4f5a902a.

## 2026-07-09 — Covenant Engine blueprint adopted: curriculum restructured to 12-week Torah-arc

- **BLOCKERS.md was stale in 3 places** — audited against actual code before trusting it: BLOCKER-002 (curriculum) said "0 modules, not fixed" but migration `20260615120000_seed_curriculum.sql` already seeds 7 modules/30 lessons; BLOCKER-007 (HMAC) and the "order bump/upsell = Phase 2, not built" architecture note were also already resolved in `checkout.functions.ts` (`chargeUpsell`, `bumpSlugs`) and `paystack-webhook.ts`. **Lesson: grep the actual code before trusting a blockers/status doc — these rot fast and this repo's docs lag the implementation by weeks.**
- **User supplied a full external blueprint ("The Covenant Engine") describing a 12-week, 5-Book Torah-arc curriculum** (Genesis→Exodus→Leviticus→Numbers→Deuteronomy mapped onto the same 7 stages) that differs from the existing 20-week `docs/CURRICULUM.md`: DARES (old Stage 6) moves to precede River-Fish-Tank/Community (old Stage 5) — "wire the systems before deploying them to convert a tribe." User said to "adopt and implement" this structure.
- **Did not rewrite the 30 existing lessons from scratch** — they're detailed, on-voice, and already seeded. Instead wrote a second migration (`20260709120000_restructure_curriculum_covenant_engine.sql`) that only re-titles modules, swaps `sort_order` for the two modules that swap position, moves 3 lessons between modules via `UPDATE ... SET module_id`, and inserts 2 net-new lessons the blueprint required (`swot-4ps-framework`, `platform-choosing-your-canaan`). Never touched the original seed migration — additive only, per the "never edit migrations" rule.
- **`modules`/`lessons` have no UNIQUE constraint on `(product_id/module_id, sort_order)`** — only `UNIQUE(module_id, slug)` and a non-unique index. This meant lesson moves and renumbers could use simple explicit `sort_order` UPDATEs without worrying about transient collisions during the migration — no need for a temporary-offset dance.
- **Both migrations still need `supabase db push` (or dashboard SQL editor) against the live project** — writing the migration file does not seed prod. Flagged in BLOCKERS.md and CURRICULUM.md; verify before selling the R18,000 programme.
- **Saved the full source blueprint verbatim to `docs/COVENANT-ENGINE.md`** with an inline status header marking each section ✅ already-built / 📋 reference-only / ❌ not-yet-built, so it doesn't silently go stale like BLOCKERS.md did. Real remaining gap surfaced by this doc: **LMS drip-delivery (week-gating) is not implemented** — `lms.functions.ts` has `sort_order` but no date-based unlock logic; all modules are visible immediately after `product_grants` exists. Next real build target if this matters before cohort launch.
- **`contentpreneur-vip-tier` (R45,000) still has 0 modules/0 lessons** — the restructure only touched `contentpreneur-90day-cohort`. Not addressed this session; flagged in BLOCKERS.md.

## 2026-07-09 (later same session) — built the remaining Covenant Engine funnel gaps: LMS drip-delivery, WhatsApp support panel, email copy, Zoom script reconciliation

- **LMS drip-delivery (real code, not just docs) — `20260709130000_lms_drip_delivery.sql`:** added `modules.unlock_week integer NOT NULL DEFAULT 1` (safe no-op for every other product) + explicit week map for `contentpreneur-90day-cohort`'s 7 modules matching the 12-week Torah-arc structure (1,3,5,7,8,10,11). Gate lives in `lms.functions.ts` `getLessonBody`: computes `currentCohortWeek()` from `product_grants.granted_at` (already existed, no new table needed), compares to the lesson's module `unlock_week`, and returns a new `dripLocked: true` + `unlocksAt` response shape distinct from the existing `locked: true` (no-purchase) shape. Admins and `is_preview` lessons always bypass. Course listing (`learn.$slug.index.tsx`) and lesson page (`learn.$slug.$lessonSlug.tsx`) both updated to show "Unlocks Week N" instead of a generic lock/paywall message. Admin curriculum builder (`admin.curriculum.$productSlug.tsx`) got a small inline `unlock_week` number input per module.
- **Supabase generated types don't auto-update from hand-written migrations** — `bunx tsc --noEmit` failed with `Type 'number' is not assignable to type 'never'` on the new `unlock_week` field because `src/integrations/supabase/types.ts` is a generated snapshot that doesn't know about columns added outside `supabase gen types`. Fixed by hand-editing the `modules` Row/Insert/Update types to add `unlock_week: number`. **Remember this pattern:** any new migration that adds a column will need a matching manual edit to `types.ts` until someone runs `supabase gen types typescript` against the live (post-migration) database — don't assume tsc passing means the DB and the types file agree; it only means the *file* is internally consistent.
- **WhatsApp click-to-chat panel** — added directly to `SiteFooter` in `src/components/member-shell.tsx` (fixed-position, so mounting inside the footer still floats correctly over the whole page). Fully env-gated on `VITE_WHATSAPP_SUPPORT_NUMBER` — renders nothing if unset, so it ships safely with zero owner action, but **the owner still needs to set a real WhatsApp Business number** in `.env`/Cloudflare before it appears. No number was fabricated.
- **MailerLite integration ceiling confirmed:** `src/lib/mailerlite.ts` only calls `POST /api/subscribers` to add someone to a group (to *trigger* an automation) — there is no code path to create campaign/automation content via API. This means the 5-email sequence could only be **written**, not **deployed live**, from this session — saved to `docs/EMAIL-SEQUENCE.md` as ready-to-paste copy with a MailerLite setup checklist. Don't attempt to "finish" this task by hitting the MailerLite API to create automations — that's a live, externally-visible action (real emails to real subscribers) that needs the owner's hands regardless.
- **Reconciled two competing sales scripts instead of picking one:** `docs/SALES-PIPELINE.md` (existing, 12-step, verified figures, already had the SARS R207,879 warning) was clearly the more mature source of truth vs. the blueprint's simpler 7-step Zoom script in `docs/COVENANT-ENGINE.md` §7 — so merged the blueprint's more specific line-level scripts (the sector-specific opportunity-cost example, the explicit "state the price then mute your microphone" instruction, a new "Commitment Lock" bridge step between Insight and Offer) INTO `SALES-PIPELINE.md` rather than replacing it, and marked COVENANT-ENGINE.md §7 as "✅ Reconciled" pointing back to the canonical doc.
- **Surfaced a real pricing conflict while touching `SALES-PIPELINE.md`:** VIP tier is R25,000 there vs. R45,000 in `docs/PRODUCTS.md`/the DB. Did not resolve it (out of scope, no way to know which is correct) — flagged inline in both docs so nobody quotes the wrong number on a discovery call.
- **Corrected `docs/SALES-PIPELINE.md`'s remaining "By Week 20" transformation statement** to "By Week 12" to match the adopted curriculum timeline (found via grep sweep after the curriculum restructure — worth re-grepping `Week 20`/`20 weeks`/`20-week` across `docs/` after any future timeline change, since these references hide in prose, not just tables).
