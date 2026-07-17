# CHKPLT — LMS Curriculum Blueprint
## Kingdom Contentpreneur Transformation System™ — Covenant Engine Structure

> *"Unless the Lord builds the house, the builders labour in vain."* — Psalm 127:1

**Programme:** Contentpreneur Accelerator PRO (R18,000 PIF / R6,500×3)
**Duration:** **12 weeks** (compressed from the original 20-week draft — see "Structure History" below)
**Delivery:** `/admin/curriculum/$productSlug` → LMS at `/learn/$slug`
**Slug:** `contentpreneur-90day-cohort`
**Seed migrations:** `20260615120000_seed_curriculum.sql` (base 7 modules/30 lessons) →
`20260709120000_restructure_curriculum_covenant_engine.sql` (Torah-arc restructure, +2 lessons, 32 total)

This is the **adopted structure** as of 2026-07-09. It supersedes the flat 20-week version. Do not
plan cohort delivery against the old week numbers — use the timeline below.

---

## The Torah Arc → Curriculum Map

Your intellectual property follows the 5 Books of Moses for narrative/marketing positioning. The
7-stage system underneath is the exact execution curriculum delivered in the LMS.

```
[TORAH ARC]        [CURRICULUM STAGE]                          [WEEKS]   [MODULE SLUG]
GENESIS       ──>   Stage 1: Foundation — MS×TS×SS              1–2      stage-1-foundation
EXODUS        ──>   Stage 2: Self-Awareness — SWOT & 4Ps         3–4      stage-2-swot
LEVITICUS     ──>   Stage 3: Content Strategy — 4Es Engine       5–6      stage-3-content-strategy
NUMBERS       ──>   Stage 4: Platform Strategy — Choose Canaan   7        stage-4-audience-building
              ──>   Stage 5: Systems & DARES                     8–9      stage-6-dares *
DEUTERONOMY   ──>   Stage 6: Owned Tribes — River-Fish-Tank      10       stage-5-community *
              ──>   Stage 7: PAIDS Monetization Engine           11–12    stage-7-paids
```

\* Module *slugs* were not renamed during the restructure (only `title`/`summary`/`sort_order`
changed) — the DB row historically called "Stage 6: DARES" now sits at `sort_order = 5` and displays
as **Stage 5**, and the row historically called "Stage 5: Community" now sits at `sort_order = 6` and
displays as **Stage 6**. This is intentional: DARES (the automated systems) now precedes River-Fish-Tank
(deploying those systems to convert an owned tribe) — you wire the engine before you drive it.

**No stage can be skipped. Completion criteria must be met before advancing.**

---

## STAGE 1: FOUNDATION — MS×TS×SS (Genesis) · Weeks 1–2

**Scripture anchor:** Proverbs 4:7 — *"Wisdom is the principal thing; therefore get wisdom."*
**Torah theme:** Identity before output; character before content.

MS × TS × SS = Digital Asset — multiplication, not addition. Any zero = zero result.

| # | Lesson | Slug |
|---|--------|------|
| 1 | The 3Cs Mindset Assessment | `mindset-3cs-assessment` |
| 2 | Breaking the Paid-Less-Than-You're-Worth Trap | `mindset-salary-trap` |
| 3 | The 10 Shadow Fears | `mindset-10-shadow-fears` |
| 4 | The 7 Core Contentpreneur Skills | `skillset-7-core-skills` |
| 5 | The Upgrade Sequence | `skillset-upgrade-sequence` |
| 6 | Essential Tools Setup | `toolset-essential-setup` |

**Checkpoint:** 3Cs score 70+/100 OR improvement plan · all 7 skills self-assessed · tools + basic funnel live before Week 3.

---

## STAGE 2: SELF-AWARENESS — SWOT & The 4Ps (Exodus) · Weeks 3–4

**Scripture anchor:** Proverbs 27:23 — *"Know the state of your flocks..."* / Exodus 3:10 — *"So now, go. I am sending you..."*
**Torah theme:** Self-knowledge precedes liberation. Breaking the chains of being paid less than your expertise is worth.

| # | Lesson | Slug |
|---|--------|------|
| 1 | The Contentpreneur SWOT | `swot-called-expert` |
| 2 | The 3 Strategic Priorities | `swot-3-strategic-priorities` |
| 3 | **NEW:** The 4Ps Framework (Passion/Pain/Purpose/Profit) | `swot-4ps-framework` |
| 4 | Niche Statement Formula *(moved from Stage 3)* | `content-niche-statement` |

The 4Ps and the niche statement are the same exercise: map value across four axes, then compress
the overlap into one sentence — *"I help [person] achieve [outcome] through [method] in [timeframe]."*

**Checkpoint:** Full SWOT + 3 priorities dated · 4Ps mapped · niche statement tested on 2 real ICP people.

---

## STAGE 3: CONTENT STRATEGY — The 4Es Engine (Leviticus) · Weeks 5–6

**Scripture anchor:** Ecclesiastes 3:1 — *"There is a time for everything..."*
**Torah theme:** Strict codes for offerings of uncompromised excellence.

| # | Lesson | Slug |
|---|--------|------|
| 1 | The 4E Ratios (Educate 35 / Entertain 30 / Encourage 20 / Earn 15) | `content-4e-ratios` |
| 2 | Contentpreneur Content Ratio (4E Adjusted: 50/25/15/10) | `content-called-expert-ratio` |
| 3 | The 30-Day Content Calendar | `content-30day-calendar` |

**Checkpoint:** 30-day calendar built with 4E ratios.

---

## STAGE 4: PLATFORM STRATEGY — Choose Your Canaan (Numbers) · Week 7

**Scripture anchor:** Numbers 13:2 — *"Send some men to explore the land of Canaan..."*
**Torah theme:** Taking a census, running spy missions, claiming one dominant territory.

| # | Lesson | Slug |
|---|--------|------|
| 1 | **NEW:** Choosing Your Canaan — The One-Platform Rule | `platform-choosing-your-canaan` |
| 2 | The Hook–Story–Lesson–Framework–CTA Formula | `audience-hslfcta-formula` |
| 3 | The R×A×C×U^B Hook Formula | `audience-racub-hook-formula` |
| 4 | The 4 Scripting Principles | `audience-4-scripting-principles` |

Halts the mistake of being mediocre on five platforms. One primary platform, fully optimised
profile, before any content-mechanics lessons are applied.

**Checkpoint:** One platform chosen + bio/pinned content optimised.

---

## STAGE 5: SYSTEMS & DARES (Numbers) · Weeks 8–9

**Scripture anchor:** Proverbs 13:22 — *"A good person leaves an inheritance for their children's children."*
**Torah theme:** Spy-mission infrastructure — wire the systems before deploying them.

| # | Lesson | Slug |
|---|--------|------|
| 1 | The ManyChat Keyword System *(moved from Stage 4)* | `audience-manychat-keywords` |
| 2 | What DARES Means | `dares-what-it-means` |
| 3 | OTH → LL → MFM Income Progression | `dares-oth-ll-mfm-progression` |
| 4 | DARES Self-Audit | `dares-self-audit` |
| 5 | Build Your First Digital Product: 72-Hour Protocol | `dares-72-hour-product-protocol` |

Automated DM sequences now lead the stage — they're the automation half of DARES, wired before
Stage 6 deploys them to convert an audience into an owned tribe.

**Checkpoint:** ManyChat tested end-to-end · 1 digital product live · DARES score 30+.

---

## STAGE 6: OWNED TRIBES — The River-Fish-Tank Model (Deuteronomy) · Week 10

**Scripture anchor:** Proverbs 27:17 — *"Iron sharpens iron..."* / Luke 5:4 — *"Launch out into the deep..."*
**Torah theme:** Claiming the permanent inheritance; transferring generational wealth.

| # | Lesson | Slug |
|---|--------|------|
| 1 | The River–Fish–Tank Model *(moved from Stage 4)* | `audience-river-fish-tank` |
| 2 | The 3Cs Progression (Create/Collaborate/Contribute) | `community-3cs-progression` |
| 3 | Building the Tank | `community-building-the-tank` |
| 4 | The SEEDS Conversion Sequence | `community-seeds-conversion` |

The systems built in Stage 5 (ManyChat, automation) exist to execute this stage: move fish from the
rented river into the owned tank, then convert the tank into a 3Cs tribe.

**Checkpoint:** Owned community 100+ members · lead magnet converting · full pipeline tested.

---

## STAGE 7: PAIDS MONETIZATION ENGINE (Deuteronomy) · Weeks 11–12

**Scripture anchor:** Ecclesiastes 11:2 — *"Invest in seven ventures, yes, in eight..."*
**Torah theme:** Deuteronomy's inheritance laws — activating five income streams so no single
stream exceeds 40–50% of total revenue.

| # | Lesson | Slug |
|---|--------|------|
| 1 | The 5 Income Streams (Products/Affiliates/Information/Deals/Services) | `paids-5-streams` |
| 2 | The PAIDS Activation Sequence | `paids-activation-sequence` |
| 3 | The Affiliate Income Stack (SA-Specific) | `paids-affiliate-stack-sa` |
| 4 | The Product Ladder: Price Ascension | `paids-product-ladder` |
| 5 | The 25% SARS Reserve Rule | `paids-sars-25-percent-rule` |
| 6 | Graduation — The Contentpreneur Covenant *(now Week 12, not Week 20)* | `paids-graduation-covenant` |

**Programme Checkpoint:** 3+ PAIDS streams active · R10K/month demonstrable · SARS reserve
operational · graduation review call booked.

---

## Structure History

| Version | Weeks | Notes |
|---|---|---|
| v1 (original, seeded 2026-06-15) | 20 | Flat 7-stage, no Torah-arc labels, DARES after Community. Still the migration `20260615120000_seed_curriculum.sql` — never edited, only restructured on top. |
| **v2 — Covenant Engine (adopted 2026-07-09)** | **12** | Torah-arc labels added, DARES moved before Community/River-Fish-Tank, 2 new lessons added (4Ps, Choosing Your Canaan), niche statement moved into Stage 2. Applied via `20260709120000_restructure_curriculum_covenant_engine.sql`. **This is the current, adopted structure — use it for all cohort planning, sales copy, and admin panel curriculum review.** |

If a future restructure is needed, add a new migration (never edit `20260709120000_...`) and append
a new row to this table — don't overwrite history.

---

## Admin Panel Build Order (unchanged priority, new week labels)

### Priority 1 (Soft Launch Minimum)
1. Stage 1 → Lesson 1 (3Cs Mindset Assessment)
2. Stage 1 → Lesson 4 (7 Core Skills)
3. Stage 7 → Lesson 1 (PAIDS 5 Streams)
4. Stage 7 → Lesson 5 (SARS 25% Rule)

### Priority 2 (First Cohort — Week 1 of Cohort)
All remaining Stage 1 and Stage 7 lessons.

### Priority 3 (Full Programme)
Stages 2–6 in order — now compressed to roughly one stage per week, not one per 2–4 weeks.

---

## Product Slugs (Admin Panel Reference)

| Product | Slug | Status |
|---------|------|--------|
| Contentpreneur Accelerator PRO | `contentpreneur-90day-cohort` | 32 lessons across 7 modules — see migrations above |
| Contentpreneur VIP | `contentpreneur-vip-tier` | published — 0 lessons, not yet curriculum-built |

Go to `/admin/curriculum/contentpreneur-90day-cohort` to review or extend.

---

*Sealed by covenant. Built on land we own. Cast on the right side. — CHKPLT*
*"153 fish. No net broken." — John 21:11*
