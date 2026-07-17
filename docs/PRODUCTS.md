# CHKPLT — Product Reference

> 153 fish. Every product is one fish in the net. The net did not break. — John 21:11

---

## Audience mapping (Contentpreneur umbrella)

> The buyer identity is **Contentpreneur** — someone who turns what they know into income they own. The `ICP` tags in the tables below map to it: **ICP 1 = Buyer Lane A (Called Expert — professional/specialist still employed)**; **ICP 2 = the aspiring-creator traffic tier that grows into a buyer lane**. Buyer **Lane B (Knowledge Creator — coach/podcaster/consultant with expertise + income)** is served by the same paid ladder as Lane A with lane-specific copy. See `CLAUDE.md` → "Target Audience — the Contentpreneur Umbrella" for the full definition.

## Product Architecture — The 153 Framework

153 products across the Contentpreneur sub-segments. Built in 3 phases:
- **Genesis (now):** 5 free lead magnets + 5 paid products (MVP)
- **Exodus (Month 4–6):** 30+ products across all 6 sub-segment tracks
- **Leviticus (Month 7–12):** Full 153 product ecosystem complete

### Product Gardens (Categories in DB)
| Garden | Enum | Level | Products |
|--------|------|-------|---------|
| Deshe (דשׁא) | `deshe` | Foundation | Free + entry (R0–R999) |
| Esev (עשׂב) | `esev` | Intermediate | Growth (R1,000–R4,999) |
| Etz Pri (עץ פרי) | `etz_pri` | Premium | Gated, requires application (R5,000+) |
| Devarim (דבר) | `devarim` | Advanced | Specialised tracks |

---

## Currently Published (5 Live + 2 Premium Blocked)

### Free / Entry Level (Deshe)

| Product | Slug | Price ZAR | Price USD | Garden | Delivery | ICP | Status |
|---------|------|-----------|-----------|--------|----------|-----|--------|
| Niche Clarity Workbook | `niche-clarity-workbook` | R199 | TBD | deshe | PDF download | ICP 2 | ✅ Published |
| Tax Guide for Content Creators | `tax-guide-content-creators` | R299 | TBD | deshe | PDF download | Both | ✅ Published |
| PAIDS Framework | `paids-framework` | R899 | TBD | deshe | PDF download | Both | ✅ Published |
| The Influencer's Code (eBook) | `influencers-code-ebook` | R299 | TBD | deshe | PDF download | ICP 2 | ✅ Published |

### Premium (Etz Pri — Requires Application)

| Product | Slug | Price ZAR | Price USD | Garden | Delivery | ICP | Status |
|---------|------|-----------|-----------|--------|----------|-----|--------|
| Called Expert Accelerator PRO (90-day) | `contentpreneur-90day-cohort` | R18,000 PIF / R6,500×3 | TBD | etz_pri | LMS + coaching | ICP 1 | ✅ Published (32 lessons / 7 modules seeded) |
| VIP Tier | `contentpreneur-vip-tier` | R45,000 | TBD | etz_pri | LMS + 1:1 | ICP 1 | ⚠️ Published (0 curriculum) |

---

## The First 5 Free Products (Lead Magnets — Genesis Phase)

These need to be created in the DB and designed in Canva. Use `/admin/products` to add them.

### FREE-001: The Called Expert Blueprint
- **Description:** POSSESS Framework PDF — 7-step system for monetising expertise without quitting your job
- **Pages:** 12 pages. Heritage Gold design.
- **ICP:** ICP 1 (Called Expert)
- **Garden:** `deshe`
- **is_free:** true
- **Lead capture:** Name + email + "What profession are you currently in?"
- **MailerLite tag:** `called-expert-blueprint`
- **Trigger:** ICP 1 Feeler #1 — Salary Trap ("Your employer earns R400K from what you know")
- **Framework taught:** POSSESS (Deut 1:6 spine)
- **DB slug:** `called-expert-blueprint`

### FREE-002: The 11th Hour Playbook
- **Description:** 8-page guide for the Called Expert at 40–50. "You're not too late. You're the 11th hour worker. Here's what you do in the next 30 days." Matthew 20 decoded.
- **ICP:** ICP 1
- **Garden:** `deshe`
- **is_free:** true
- **Lead capture:** Name + email + "How long have you had your expertise?" (5–10 yrs / 10–20 yrs / 20+ yrs)
- **MailerLite tag:** `11th-hour-playbook`
- **Trigger:** ICP 1 Feeler #2 — The Quit-First Lie ("You don't have to quit first")
- **DB slug:** `11th-hour-playbook`

### FREE-003: The Right Side Assessment
- **Description:** 5-minute quiz/PDF. "Which of your income streams are left side (rented) vs right side (owned)?" John 21 decoded into PAIDS framework. Outputs: PAIDS score + "your right side" recommendation.
- **ICP:** Both
- **Garden:** `deshe`
- **is_free:** true
- **Lead capture:** Email to receive results
- **MailerLite tag:** `right-side-assessment`
- **Trigger:** John 21 content hooks
- **DB slug:** `right-side-assessment`

### FREE-004: The 4-Hour Window Starter System
- **Description:** Framework for building a second income in 4-hour blocks while employed. Based on ATNS shift worker proof — "I built R600K in these windows." 10 pages. Includes time audit template, 4-hour content window schedule, platform pick guide.
- **ICP:** ICP 1 (Shift Worker sub-segment primary)
- **Garden:** `deshe`
- **is_free:** true
- **Lead capture:** Name + email
- **MailerLite tag:** `4-hour-window`
- **Trigger:** Shift Worker angle content
- **DB slug:** `4-hour-window-system`

### FREE-005: Your Knowledge Audit ("What Fish Do You Have?")
- **Description:** 2-page fillable PDF. 12 questions to map expertise into monetisable categories. Outputs: Top 3 knowledge assets + which PAIDS stream each belongs to.
- **ICP:** ICP 1
- **Garden:** `deshe`
- **is_free:** true
- **Lead capture:** Email to receive completed analysis
- **MailerLite tag:** `knowledge-audit`
- **Trigger:** "153 fish — your knowledge is already in the water"
- **DB slug:** `knowledge-audit`

---

## The First 5 Paid Products (Upsells — Genesis Phase)

### PAID-001: The Called Expert Starter Kit — R997
- **Description:** Everything needed to launch as a monetised expert in 30 days.
- **Includes:** Expertise packaging workbook + Content strategy guide (5 posts/week) + POSSESS framework deep-dive + LinkedIn profile optimisation guide
- **Who it's for:** Just downloaded Called Expert Blueprint. Ready to start. Needs the full map.
- **ICP:** ICP 1
- **Garden:** `esev`
- **MailerLite trigger:** `called-expert-blueprint` tag → Day 7 upsell email
- **DB slug:** `called-expert-starter-kit`

### PAID-002: The 90-Day Expertise Launch System — R1,997
- **Description:** Full 90-day system — from employed professional to known expert in your field.
- **Includes:**
  - Week 1–4: Knowledge packaging (POSSESS P + O steps)
  - Week 5–8: Content building (4-hour window system, first 30 posts scripted)
  - Week 9–12: First income (first digital product launched, first clients booked)
- **ICP:** ICP 1
- **Garden:** `esev`
- **DB slug:** `90-day-expertise-launch`

### PAID-003: The Knowledge Packaging Workshop (Pre-recorded) — R2,497
- **Description:** 6 recorded sessions: extract expertise → package → sell.
- **Sessions:**
  1. What do you actually know? (Knowledge Audit walkthrough)
  2. Who is your 11th hour worker (your specific Called Expert sub-segment)
  3. POSSESS framework full application
  4. Your first digital product (expertise → PDF in 90 minutes)
  5. Your first cohort (product → programme)
  6. CHKPLT setup (own your platform, own your price)
- **Delivery:** LMS (needs curriculum build in `/admin/curriculum`)
- **ICP:** ICP 1
- **Garden:** `esev`
- **DB slug:** `knowledge-packaging-workshop`

### PAID-004: The POSSESS Masterclass — R4,997 (Live Cohort, 15 max)
- **Description:** 7-week live programme, 2 hours/week. One POSSESS step per week. Max 15 students.
- **Weeks:**
  1. P — Perceive stagnation (Deut 1:6 — what mountain have you been at too long?)
  2. O — Outline territory (what land is assigned to you?)
  3. S₁ — Step in and launch (first piece of content as Called Expert)
  4. S₂ — Systematise (4-hour window system for your schedule)
  5. E — Escalate (when to outsource, when to hire)
  6. S₃ — Scale (from one cohort to recurring revenue)
  7. S₄ — Secure (legal, SARS structure, product ecosystem)
- **ICP:** ICP 1
- **Garden:** `etz_pri`
- **requires_application:** true
- **DB slug:** `possess-masterclass`

### PAID-005: Called Expert Accelerator PRO — R18,000 PIF / R6,500×3 (Flagship)
- **Description:** Full transformation. **12 weeks** (compressed from the original 20-week draft —
  see "Structure History" in `docs/CURRICULUM.md`). 7-stage system, Torah-arc labeled
  (Genesis→Deuteronomy), already in DB as `contentpreneur-90day-cohort`.
- **Includes:**
  - 1:1 onboarding (30 min with Ndivhuwo)
  - Weekly group coaching calls
  - Accountability partners (3Cs paired groups)
  - WhatsApp accountability group
  - Lifetime CHKPLT LMS access
  - Certificate of Called Expert Completion
- **Revenue math:** 6 students × R18,000 = R108,000 per cohort
- **ICP:** ICP 1
- **Garden:** `etz_pri`
- **requires_application:** true (native `/apply` diagnostic)
- **DB slug:** `contentpreneur-90day-cohort` (already exists)
- **Curriculum status:** ✅ 32 lessons / 7 modules seeded — see `docs/CURRICULUM.md`. Remaining gap:
  LMS drip-delivery (week-gating) not yet built — see `docs/COVENANT-ENGINE.md` §8.3.

---

## 153 Product Roadmap (Full Architecture)

| Track | Products | Focus |
|-------|---------|-------|
| Foundation (Free + Entry) | 25 | Blueprints, audits, assessments, frameworks |
| Shift Worker Track | 21 | 4-hour window systems, night shift scheduling, parallel income |
| Corporate Trapped Track | 21 | Knowledge packaging, expertise monetisation, LinkedIn → leads |
| Teacher/Lecturer Track | 21 | Curriculum packaging, digital classroom, scale 30 → 30,000 students |
| Healthcare Worker Track | 21 | Consultation to product, midnight-Google-question products |
| Faith Professional Track | 21 | Kingdom business, message monetisation, ministry sustainability |
| Freelancer at Capacity Track | 21 | Productised service, knowledge cloning, time leverage |
| Flagship (Cohort/Mastermind) | 3 | Called Expert Accelerator PRO, Mastermind, 1:1 Intensive |
| **TOTAL** | **154 → 153** | |

---

## Adding a New Product (Checklist)

- [ ] Outline: title, ICP, transformation promise (A → B in X days), NOCHILL framework backbone
- [ ] Design: Canva — Amber `#F59E0B`, Slate `#0F172A`, white/slate-50 canvas, Montserrat headings (updated 2026-07-11 to match the live "Modern Professional" theme in `src/styles.css` — the old Heritage Gold spec is retired, backed up in `src/styles.heritage.bak.css`), footer `chkplt.com | @nochill_god`
- [ ] DB: `/admin/products` → upsert (slug, title, tagline, garden, price_cents, is_free, requires_application)
- [ ] Storage: Upload PDF to Supabase Storage → bucket `product-downloads` → name: `{slug}.pdf`
- [ ] DB: Update `download_path` = `/product-downloads/{slug}.pdf`
- [ ] DB: Toggle `status: published`
- [ ] MailerLite: Create automation trigger for this product's tag
- [ ] Test: Purchase as test user → confirm email, download, LMS access
- [ ] Launch: Broadcast to relevant segment with NOCHILL voice email

---

## Product Copy Rules

1. Every product title implies a transformation. Not "A Guide to X" — "The X System That Gets You to Y in Z Days."
2. Lead with the pain or the mistake. The product is the resolution.
3. Use specific proof numbers. R23,000 in ONE day. Not "significant income."
4. One ICP per product. Never write for both ICPs in the same description.
5. NOCHILL voice — big brother, not guru. Direct, not motivational speaker.
6. Spiritual layer after practical lesson — never as the opening line.
7. Always include a transformation promise: "After this product, you will [specific outcome]."
