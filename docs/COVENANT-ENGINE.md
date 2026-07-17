# THE COVENANT ENGINE: NOCHILL PTY LTD OPERATIONAL EMPIRE & BLUEPRINT

**A Comprehensive Architecture Linking Torah Principles, the Contentpreneur Methodology, and CHKPLT SaaS Infrastructure**

*"A good person leaves an inheritance for their children's children." — Proverbs 13:22*

> **Status:** Reference source document, saved 2026-07-09, updated 2026-07-09 (later same session).
> This is the blueprint that drove the curriculum restructure in `docs/CURRICULUM.md` (§2 below →
> the adopted 12-week/Torah-arc structure) and the funnel work below.
>
> **What's implemented vs. still reference-only (updated):**
> - §2 (7-Stage/5-Book curriculum) → ✅ **Adopted** — see `docs/CURRICULUM.md`, migration `20260709120000_restructure_curriculum_covenant_engine.sql`
> - §3 (two-tier pricing: $97/R1,800 kit · $997/R18,000 Accelerator) → ✅ Already built, see `src/lib/gardens.ts`
> - §8.1–8.2 (order bump + one-click upsell) → ✅ Already built, see `src/lib/checkout.functions.ts`
> - §4 (Kingdom Business Generator wizard) → ✅ Already built as `apps.ms-ts-ss.tsx` + 8 sibling diagnostic apps
> - §6 (Tally application form) → ✅ Superseded — CHKPLT has an owned native diagnostic at `/apply` instead of renting Tally
> - §5.3 (5-day email sequence copy) → ✅ **Written** — full ready-to-paste copy in `docs/EMAIL-SEQUENCE.md`. Still requires a human to paste it into MailerLite's automation UI — no code in this repo can create MailerLite campaign content (`mailerlite.ts` only adds subscribers to a group to trigger an automation you build by hand)
> - §5.2 (ManyChat DM scripts) → 📋 Reference only — configure directly in ManyChat, no code path exists or is needed here
> - §7 (Zoom SEEDS script) → ✅ **Reconciled** — merged into `docs/SALES-PIPELINE.md` Steps 9–11 (Commitment Lock, sector-specific pain amplification, explicit price-then-mute-mic instruction added)
> - §8.3 (LMS drip-delivery / week-gating) → ✅ **Built** — `modules.unlock_week` column + `lms.functions.ts` `getLessonBody` gate + course/lesson page UI + admin curriculum editor. Migration `20260709130000_lms_drip_delivery.sql`
> - §8.3 support click-to-chat panel → ✅ **Built** — floating WhatsApp button in `src/components/member-shell.tsx`, renders only when `VITE_WHATSAPP_SUPPORT_NUMBER` is set (owner still needs to set this env var — no real number was available to hardcode)

---

## SECTION 1: Strategic Vision & Niche Positioning

### 1.1 The Master Positioning Statement

You are no longer a casual content creator chasing vanity metrics for likes and views. You are a sovereign brand and an infrastructure builder operating a kingdom assignment. Your unified mission is defined by this strict positioning statement:

> **"I help faith-driven Africans who already have real expertise — whether they earn a salary or run their own thing — turn their years of knowledge into scalable digital assets and communities they own, using the *Contentpreneur* framework."**

### 1.2 The Avatar Split: Reach vs. Core Transformation

Your audience splits into three tiers under the **Contentpreneur** umbrella. To scale to a top 1% conversion model, recognise the distinct roles they play:

1. **Reach Tier: The DNA Starter (Digital Native Aspiring | Age 18–35):** Your **Top-of-Funnel REACH market**, NOT a core buyer. Passion and phones but no capital and nothing yet to package. They consume short-form content, fill your email list, and buy low-ticket books and templates — then grow INTO a buyer lane over 12 months. The volume layer. Never insulted in copy.

2. **Buyer Lane A: The Contentpreneur (The Unathi-Type | Age 32–50):** Credentialed professionals (teachers, senior corporate managers, financial advisors, medical specialists) earning R30,000–R200,000+/month, still employed. Time-poor, faith-rooted, sitting on unpublished intellectual property. They buy architecture, strategy, and systems that protect their energy and dignity — not hype.

3. **Buyer Lane B: The Knowledge Creator (coach / consultant / podcaster / creator):** Self-employed or already-earning, already has the knowledge and often the audience, but no system to OWN the income. Tired of brand-deal dependency; wants an asset they own. Also a core buyer — money still qualifies (they already invest in their growth). Distinct from the Reach Tier: Lane B has expertise AND earns.

**Both buyer lanes are the revenue engine.** Speak to ONE lane per piece; the brand identity is always Contentpreneur.

## SECTION 2: The Unified 5-Book & 7-Stage Curriculum

Your intellectual property is organized sequentially. The thematic narrative follows the **5 Books of Moses**, which dictates the emotional and spiritual positioning of your marketing. The **7-Stage System** acts as the exact execution curriculum delivered within your products.

```
  [THE TORAH ARC]              [THE CURRICULUM STAGES]            [TIMELINE]
  1. GENESIS       ───────>   Stage 1: MS × SS × TS           ──>  Weeks 1–2
  2. EXODUS        ───────>   Stage 2: SWOT & 4Ps             ──>  Weeks 3–4
  3. LEVITICUS     ───────>   Stage 3: 4Es Content Strategy   ──>  Weeks 5–6
  4. NUMBERS       ───────>   Stage 4: Social Media Platform  ──>  Week 7
                   ───────>   Stage 5: Systems & DARES        ──>  Weeks 8–9
  5. DEUTERONOMY   ───────>   Stage 6: River-Fish-Tank        ──>  Week 10
                   ───────>   Stage 7: PAIDS Monetization     ──>  Weeks 11–12
```

### BOOK 1: GENESIS | Stage 1: MS × SS × TS Foundation (Weeks 1–2)

- **Torah Theme:** Identity before output; character before content. Outlining who the expert is before what they do.
- **Execution:** Overcoming imposter syndrome and deleting the "Old Code" of continuous struggle and platform dependency. You run a full audit using the equation Mindset × Toolset × Skillset = Digital Asset. If any variable is zero, the output is zero. Students write their Creator's Covenant and apply the **3C Balance Framework** (40% Create, 35% Collaborate, 25% Contribute).

### BOOK 2: EXODUS | Stage 2: SWOT & The 4Ps (Weeks 3–4)

- **Torah Theme:** Self-knowledge precedes liberation. Breaking the chains of being paid less than your expertise is worth, corporate burnout, brand-deal dependency, and time poverty.
- **Execution:** A comprehensive "Burning Bush Audit". Students complete a personal **SWOT Analysis** (uncovering hidden career strengths, identifying market opportunities in Africa, and naming structural threats like platform reliance). They map out their niche using **The 4Ps** (Passion, Pain, Purpose, Profit), transforming their historically solved professional problems into an authoritative platform.

### BOOK 3: LEVITICUS | Stage 3: The 4Es Content Engine (Weeks 5–6)

- **Torah Theme:** Establishing strict codes for presenting offerings of uncompromised excellence.
- **Execution:** Breaking down content creation into an exact structural ratio:
  - **Educate (30%):** Framework breakdowns and step-by-step corporate insight to build authority.
  - **Entertain (30%):** Cultural resonance, humor, and storytelling to spark relational connection.
  - **Encourage (25%):** Purpose-driven permission content that speaks straight to identity and destiny.
  - **Earn (15%):** Clean, zero-pressure invitations to cross the threshold into your paid programs.

### BOOK 4: NUMBERS | Stage 4 & 5: Platform Strategy & DARES Infrastructure (Weeks 7–9)

- **Torah Theme:** Taking a census, counting capacities, and running spy missions to claim a single, dominant territory.
- **Execution:**
  - **Stage 4 (Week 7):** Halting the mistake of being mediocre on five platforms simultaneously. Selecting one primary "Canaan" platform (e.g., LinkedIn for corporate professionals, Instagram for personal brands) and fully optimizing the profile.
  - **Stage 5 (Weeks 8–9):** Implementing the **DARES Business Model** (Digital, Automated, Recurring, Evergreen, Scalable). Wiring automated DM sequences, landing pages, establishing the *Sunday Batch Shooting System*, and constructing an enterprise media kit and minimum-fee rate card.

### BOOK 5: DEUTERONOMY | Stage 6 & 7: Owned Tribes & PAIDS Monetization (Weeks 10–12)

- **Torah Theme:** Claiming the permanent inheritance and transferring generational wealth to descendants.
- **Execution:**
  - **Stage 6 (Week 10):** Deploying the **River-Fish-Tank Model**. The River is social media (rented territory where you fish for views); the Fish are temporary followers controlled by algorithms; the Tank is your owned infrastructure (your email list and private CHKPLT community).
  - **Stage 7 (Weeks 11–12):** Activating the five streams of the **PAIDS Monetization Engine** (Products, Ads, Information, Deals, Services) so no single revenue source exceeds 40% to 50% of total company income. Running your launch sequence and graduating into the lifetime legacy network.

## SECTION 3: The Two-Tier Product Architecture

To maximize conversions and maintain elite direct-response standards, your offers are divided into two clear, high-converting packages.

### 3.1 Front-End Tier: The Contentpreneur Foundation Kit

- **Price Line:** $97 / R1,800.
- **Delivery Engine:** Completely self-paced, instantly delivered digital curriculum hosted inside your primary landing system.
- **Transformation Promise:** Moves the user out of overwhelm and provides the exact architectural blueprinted layouts to turn dormant corporate intelligence into a structured digital framework.
- **Core Product Deliverables:**
  - *The 4Es Content Calendar Machine:* Replicable Notion and Google Sheet workspaces mapped with your exact script frameworks (Hook → Story → Insight → CTA).
  - *The Parallel Assignment Blueprint:* A specialized, time-blocked tracking framework showing full-time professionals how to execute their platform in precisely 4 hours per week without breaking employment contracts.
  - *The Digital Counter-Code Workbooks:* Downloadable, interactive guidebooks guiding them through the MS×SS×TS audit and the personal SWOT execution matrix.
  - *The Contentpreneur Flagship Manual:* Advance digital text access to the chapters of your upcoming book, *Contentpreneur: From Memes to Millions*.

### 3.2 High-Ticket Tier: The 90-Day Accelerator PRO

- **Price Line:** $997 / R18,000 (or split into 3 monthly cash flow payments of R6,500).
- **Delivery Engine:** 12-week interactive group cohort experience capped strictly at 20 elite professionals per launch.
- **Transformation Promise:** Eradicates technical execution paralysis and strategic isolation via live proximity, direct audits, and a unified kingdom alliance.
- **Core Product Deliverables:**
  - *1:1 Onboarding Ignition Session:* A private 30-minute deep-dive session in Week 1 with you to establish their niche, profile keywords, and initial premium offer strategy.
  - *Live Hot-Seat Script & Funnel Audits:* Weekly group mastermind video calls where students present their batch-shot videos and landing copy for real-time editorial critique.
  - *The CHKPLT Master Setup Vault:* Over-the-shoulder technical wiring video modules showing them exactly how to connect custom domains, set up automated email triggers, and link local payment structures (Yoco/PayFast/Stripe).
  - *The Private Covenant Alliance Boardroom:* Integration into an exclusive community channel (WhatsApp/Skool) acting as a secure professional mastermind.
  - *The Sovereign Kingdom Guarantee:* A high-conviction promise: *"Complete all 90 days, attend the mastermind sessions, post your structured content consistently, and if you haven't generated your first qualified lead, receive a 100% immediate refund and Ndivhuwo will personally build your system for free."*

## SECTION 4: Interactive Workbooks & Technical Web Apps

To transition from selling standard information to selling an interactive ecosystem, the entry point of your funnel features a proprietary, browser-based app hosted natively on chkplt.com.

### 4.1 The Kingdom Business Generator App

This is a responsive frontend interactive questionnaire web app designed to replace generic, low-converting free lead magnets.

```
  [USER ENTRY] ──> [Q1: NAME & ICP ADVISOR] ──> [Q2: MINDSET AUDIT] ──> [Q3: SKILL & TOOL CHECK] ──> [DYNAMIC CALCULATOR GENERATES CUSTOM PDF]
```

#### Application Logic & Scripting Rules:

- **The Interface:** Clean, high-contrast, minimalist design utilizing your premium color architecture (charcoal background, gold trim, mustard accents). It displays a progressive wizard bar labeled: **Foundation → SWOT → 4Es → DARES Blueprint**.
- **The Core Mechanics:**
  1. *Step 1: Input:* Captures Name, Email, and Primary Professional Niche.
  2. *Step 2: Mindset Equation:* Prompts a multiple-choice question testing their abundance orientation: *Which statement describes you?* Options map to Scarcity, Mixed, or **3Cs Abundance Mode**.
  3. *Step 3: Toolset & Skillset Scoring:* Features interactive sliders (1–10) tracking content capability and checkboxes selecting their current software exposure (CapCut, Canva, Email Automation, AI assistants).
- **The Dynamic Engine Output:** The web app runs an automated background script evaluating the input against your core formulas (MS×SS×TS = Digital Asset). It dynamically compiles a personalized **Contentpreneur Strategy Document (PDF)** featuring their exact capability score, identifying their weakest link, and pre-populating a custom 4-hour weekly scheduling template based on their industry.
- **The Hook to Purchase:** To unlock the specialized video setup walk-throughs and the actual plug-and-play Notion templates corresponding to their custom PDF score, the results screen displays a prominent, direct call-to-action button to purchase the **$97 Contentpreneur Foundation Kit**.

## SECTION 5: The CHKPLT Funnel Copywriting & Complete Pipeline

A top 1% elite funnel functions on a completely linear path. The current page structure must be stripped of its multi-option layout and restructured into this single-action pipeline.

```
[ Short-Form Reels ] ──(Keyword Trigger)──> [ ManyChat Automation DMs ] ──(Captures Email)
                                                                                  │
                                                                                  ▼
[ Zoom SEEDS Closing Call ] <──(If Qualified App)── [ 5-Day MailerLite Email Welcome Sequence ]
```

### 5.1 Step 1: Social Media Distribution & Copywriting Strategy

You publish 3 to 5 high-energy short-form video pieces per week across LinkedIn and Instagram, utilizing your non-negotiable **Sunday Batch Shooting Framework**.

- **Copywriting Framework:** Hooks are engineered from your *New Voice Bank*, focusing completely on identity and the reframing of career intellect as an asset.
- **The Direct Script Blueprint:**
  - *Hook (0–3 sec):* "You have an MBA, 12 years of corporate leadership, and your LinkedIn bio barely captures the true depth of what you know. Stop leaving your best years inside an organization's vault."
  - *Story (3–40 sec):* "I spent years working inside corporate ATNS, dreaming of more, creating in the dark. I discovered that having an audience means nothing if you are building your sandcastle entirely on someone else's rented algorithm beach."
  - *Insight (40–55 sec):* "When you shift your model from vanity views to owned digital infrastructure via the **DARES architecture**, your skills convert into an independent asset that outlasts your employment."
  - *CTA (55–60 sec):* "Do not chase followers. Comment the word **SYSTEM** below, and I will instantly DM you my complete interactive Content Architecture Blueprint."

### 5.2 Step 2: ManyChat DM Capture Automation

The comment instantly triggers the background conversation layer, running 24/7 without your active presence.

- **Message 1 (Sent instantly upon comment):**
  *"Hey [First_Name]! I saw you commented on my post. I am putting together the free Content Architecture Template—including my exact scripting blueprints and the execution formulas I use to turn corporate expertise into owned assets. What is your best email address so I can drop the access link straight into your inbox?"*

- **Message 2 (Fired immediately post-email input):**
  *"Perfect! Your system link has been sent to [Email]. Quick question while I have you: Are you currently making income from your specialized knowledge outside your job, or is that something you are actively trying to establish?"*

- **Message 3 (Fired based on interaction or 24 hours later):**
  *"I hear you. I was in that exact position—sitting on major expertise but missing the structural engine under the hood. I am launching applications for our next closed group cohort called The Contentpreneur Accelerator. We help you launch your live digital asset in 90 days. Would it be okay if I dropped the application link here to see if you fit our core profile?"*

### 5.3 Step 3: The 5-Day Automated Email Nurture Sequence

The email address captured by ManyChat is pushed into MailerLite/ConvertKit, triggering a high-value automated sequence.

#### Email 1 (Day 0) — "Your Content Architecture Tool is Inside 🌱"

- **Copywriting Structure:** Delivers the direct access link to the interactive web app generator or template. Introduces your overarching corporate mission in 3 sharp sentences, establishing that you do not teach viral metrics—you construct sovereign digital assets.
- **CTA:** *"Reply to this email and tell me: What is the single biggest skill you want to monetize this year?"*

#### Email 2 (Day 2) — "The Three-Part Equation Killing Your Reach"

- **Copywriting Structure:** A dry, authoritative, education-heavy text breakdown explaining the MS×SS×TS formula. Walks them through a case study showing that deep clinical or financial expertise (Skillset) backed by a premium phone (Toolset) results in absolute invisibility if their Mindset is blocked by corporate imposter syndrome or a scarcity framework.
- **CTA:** *"Read the breakdown and calculate your score."*

#### Email 3 (Day 4) — "100,000 Subscribers and R0 in My Account"

- **Copywriting Structure:** Extreme vulnerability pattern interrupt. You detail the exact moment you sat as a famous but broke creator, your SARS debt reality, and the catastrophic notification of losing 780,000 followers overnight on rented land.
- **The Lesson:** It explains that platform risk is real, and why building an independent email list and owned beach is the only way to protect your divine assignment.
- **CTA:** No links, no sale. Pure relationship and trust validation.

  > **Verified-figures note:** use the CLAUDE.md proof table, not this section's placeholder framing —
  > SARS original assessment R207,879.20, final debt paid R162,174.14. Never use R285,000.

#### Email 4 (Day 6) — "What 90 Days of Structured Building Looks Like"

- **Copywriting Structure:** The proof offering. You showcase screenshots and case study data of an African corporate manager (an elite Unathi-type profile) who successfully mapped her industry curriculum, deployed an automated lead funnel, and secured her first R25,000 paid advisory engagement using her digital asset base.
- **CTA:** *"Review what is possible when you stop guessing and install a system."*

#### Email 5 (Day 8) — "The Contentpreneur Cohort — Is This Your Season?"

- **Copywriting Structure:** The direct application invitation. You outline your anti-sell parameters: *"This is not for beginners, this is not for people looking for viral tricks, and this is not for anyone wanting to separate their faith from their business strategy. This is an elite implementation room for seasoned professionals ready to install an architecture."*
- **CTA:** Direct hyperlink to the CHKPLT `/apply` diagnostic (superseding the Tally form referenced below).

## SECTION 6: The Application & Pre-Call Qualification

> **Implementation note:** CHKPLT does not use a rented Tally form for this step — `/apply` is a
> native 4-step diagnostic (`src/routes/apply.tsx` + `src/lib/qualification.functions.ts`) that
> gates premium checkout directly. The fields below describe the *intent*; the owned diagnostic
> already captures equivalent qualification data.

Your sales calendar is a high-value asset. The application form acts as a strict filter to protect your time and ensure only qualified, high-intent prospects secure a discovery call.

### 6.1 Form Layout & Data Fields

1. *Full Name and Live Professional LinkedIn/Instagram URL:* Allows for pre-call background investigation.
2. *Current Corporate Role & Years of Field Experience:* Immediately filters out entry-level aspirants who do not possess a deep knowledge base.
3. *What is your current content output and content revenue?* Multiple-choice parameters tracking their exact phase from Discovery to Conversion.
4. *What is your single largest structural blockage with tech or positioning?* Open text field that forces them to state their exact pain points in their own words.
5. *Are you ready to allocate capital to install a 90-day execution system?* Hard drop-down qualifier: **[Yes, I am ready to invest now / I need more financial information / I do not have resources at this stage]**.

### 6.2 Pre-Call Verification Workflow

- **Automated Redirection:** If a user selects "I do not have resources at this stage," the logic bypasses the Calendly link entirely and redirects them to a value-stacked checkout page to purchase the **$97 self-paced Foundation Kit**.
- **The Authority Filter Video:** If they select "Yes, I am ready" and complete the booking on Calendly, they land on a mandatory confirmation screen. It features an embedded 5-minute video covering your corporate background (from ATNS to enterprise brand partnerships) and explicitly states: *"We run a high-integrity, peer-to-peer boardroom conversation. If you show up to our call without having reviewed our core frameworks, your slot will be automatically canceled to protect the stewardship of our schedules."*

## SECTION 7: The Zoom Boardroom Sales Framework

*(The 7-Step SEEDS Discovery Protocol — cross-reference `docs/SALES-PIPELINE.md` for the existing 12-step script; reconcile before using both.)*

When a qualified corporate executive arrives on your Zoom calendar, run this reverse-engineered closing structure:

- **Step 1: The Integrity Alignment (0–10 min):** Establish absolute safety. State clearly: *"I do not run an aggressive sales pitch. My only assignment today is to run a deep diagnostic on your career assets and show you the exact gap between your calling and your current system. If there is alignment, I will invite you into our cohort room; if not, we part as kingdom peers. Is that a fair boundary?"* Share your brief 60-second origin narrative (Tshikwarani village to building 3M+ followers and surviving platform wiped land).

- **Step 2: Current Reality Diagnostic (10–25 min):** Ask open-ended questions and take detailed notes. Use their exact vocabulary. *"Walk me through your career skills. What do you know better than 90% of the people in your organization?"* Track their output and current unmonetized metrics.

- **Step 3: The Opportunity Cost Calculation (Pain Amplification | 25–30 min):** Put their inaction into raw numbers. *"You have 15 years of senior banking and wealth expertise. If we organize that knowledge into just one R1,500 masterclass delivered monthly to a small community of 20 professionals, that is R30,000 a month. Over a year, that is R360,000 in unleveraged asset value you are actively leaving on the table. How much longer are you going to leave that vault closed?"*

- **Step 4: The Commitment Lock (30–32 min):** *"Before I show you how the engine works under the hood, let me ask you: If I can map out a system that safely constructs this parallel assignment behind a private corporate structure in 4 hours a week, are you ready to invest the resources to build it?"* They must give an unprompted "Yes" before you present the offer.

- **Step 5: Core System Reveal (Offer Presentation | 32–45 min):** Screen-share your structured 7-Phase curriculum document. Focus completely on the *outcomes* of your phases: Phase 1 (Identity Optimization), Phase 3 (The 4Es Architecture), Phase 5 (The Live DM Automation Machine), and Phase 7 (The PAIDS Revenue Activation).

- **Step 6: Price Anchorage & Hold (45–50 min):** Drop your pricing parameters with absolute conviction. *"The investment for our complete 90-Day Accelerator PRO implementation room is R18,000. You can also choose our flexible installment option of R6,500 across 3 months. To put this in perspective, your newly engineered media kit will allow you to break even with a single paid speaking engagement at R15,000—or one workshop launch with 20 people."* **State the price, and immediately mute your microphone. Hold the silence. Do not speak first.**

- **Step 7: Objection Resolution & Handoff (50–60 min):** Treat objections as clean requests for structural information. If they state cash flow friction, seamlessly deploy the 3-month payment structure. Once confirmed, paste the live checkout link directly into the Zoom chat window.

## SECTION 8: CHKPLT Platform Architecture & Membership Delivery

Your **CHKPLT Software Ecosystem** is the underlying technology engine that hosts your front-end funnels, your automated data capture, and your premium student membership areas.

```
  [ FRONT-END CHECKOUT ]  ──>  [ AUTOMATED API TRIGGERS ]  ──>  [ THE SACRED TANK ]
   CHKPLT checkout              Triggers MailerLite Sequence       Centralized CHKPLT Portal
   Billed in R1,800 / $97       Unlocks Module 1 Deliverables      Hosts Video & Dashboards
```

### 8.1 Front-End Checkout Configuration

- **Currency Architecture:** The frontend landing page uses automated geo-targeting via Cloudflare `CF-IPCountry`. If a user visits from South Africa or neighboring regions, all copy, value stacks, and purchase buttons dynamically show **R1,800**. If visiting internationally, the system displays **$97**. ✅ Implemented — `src/lib/currency.tsx` + `src/lib/fx-sync.ts` do this with live FX rates, not a static switch.
- **The Checkout Screen Mechanics:** Single-column input layout capturing Name, Email, and Card Details. ✅ Order-bump checkbox pattern implemented in `checkout.functions.ts` (`bumpSlugs`).

### 8.2 The Post-Purchase One-Click Upsell Page

✅ Implemented — `chargeUpsell` in `checkout.functions.ts` charges the card-on-file via Paystack `charge_authorization` for a post-purchase one-click upsell, with a downsell path expected on decline.

### 8.3 The Membership Portal Architecture (The Tank)

Once a client completes a purchase for either tier, their unique access token drops them into the **Centralized CHKPLT Portal (The Tank)** at `/learn`.

#### System Integration Rules:

- **Asynchronous Progress Dashboards:** `lms_lesson_progress` tracks completion — ✅ implemented.
- **The Drip-Delivery Engine:** ❌ **Not yet implemented.** To prevent cognitive overload, the platform should enforce strict progressive unlocking — Day 1 opens Stage 1 only, later stages unlock week-by-week as the cohort advances. Current `lms.functions.ts` has module/lesson `sort_order` but no date-gating logic; all modules are accessible as soon as `product_grants` exists. Building this is the next real gap (see `docs/CURRICULUM.md` week map for the gate schedule).
- **The Support Interface:** ❌ Not found. No embedded click-to-chat / WhatsApp panel in the `_authenticated` routes yet.

## SECTION 9: Critical Action Plan — Asset Creation Checklist

*(The 6 Core Minimum Viable Products to Build Before Going Live)*

- [x] **1. Profile Optimization Overhaul** — external, ongoing (IG/LinkedIn bios, pinned grid).
- [x] **2. The Interactive Web App Generator** — built as `apps.ms-ts-ss.tsx` + 8 sibling diagnostic tools.
- [x] **3. The $97 Front-End Checkout Infrastructure** — dynamic currency, order bump, one-click upsell all built.
- [ ] **4. The Core ManyChat Flow Activation** — external SaaS, not code in this repo; verify independently.
- [ ] **5. The 5-Email Automated Welcome Flow** — `mailerlite.ts` is a thin API wrapper; the actual 5-email copy from §5.3 above needs to be configured inside MailerLite itself.
- [ ] **6. The Detailed Cohort Application Form** — superseded by `/apply` (native, owned) — confirm Calendly/booking handoff is wired from the diagnostic's qualified-outcome screen.
