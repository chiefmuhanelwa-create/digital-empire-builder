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
