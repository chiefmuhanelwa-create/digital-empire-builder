# CHKPLT — WAT Framework
**What · Why · How for every workflow on the platform**

> *"Unless the Lord builds the house, the builders labour in vain."* — Psalm 127:1

This document is the operating manual for CHKPLT (Christ's Kingdom Platform). Every workflow is written as What/Why/How so any person or agent entering this project knows exactly what to do and why it matters.

Read this alongside `CLAUDE.md` and `Learnings.md` before starting any session.

---

## W — WORKFLOWS

### WF-001: Product Creation & Launch

**What:** Convert a knowledge asset (framework, workbook, course) into a published, purchasable product on CHKPLT.

**Why:** 153 products is the destination (John 21 — 153 fish). Each product is one fish in the net. A product unpublished is a fish still in the water with no net around it.

**How:**
1. **Outline** — Define: title, tagline, ICP (ICP 1 or ICP 2), transformation promise (A → B in X days), NOCHILL framework backbone (POSSESS, PAIDS, SEEDS, etc.)
2. **Design** — Canva. Heritage Gold `#C9A84C` + Charcoal `#1C1C1C` + Cream `#FAF7F0`. Montserrat headings, Lato body. Footer: `chkplt.com | @nochill_god`
3. **Populate DB** — Admin panel at `/admin/products` → upsert product (slug, title, tagline, description, garden, price_cents, is_free, requires_application)
4. **Upload PDF** — Supabase Storage bucket `product-downloads`. Naming: `{product-slug}.pdf`
5. **Set download_path** — Update product record with `/product-downloads/{product-slug}.pdf`
6. **Publish** — Toggle `status: published` in admin panel
7. **Configure MailerLite** — Create automation trigger for the product's tag (e.g., `called-expert-blueprint` → welcome sequence Day 1)
8. **Test** — Purchase product as test user → confirm email fires, PDF downloads, LMS access granted if applicable
9. **Launch email** — Broadcast to relevant MailerLite group with NOCHILL voice (big brother, proof-first, no LinkedIn polish)

**Product naming rule:** Every product title must imply a transformation. Not "A Guide to X" — "The X System That Gets You to Y in Z Days."

---

### WF-002: Cohort Intake & Transformation Delivery

**What:** Move a Called Expert from application → qualification → onboarding → 20-week transformation → graduation.

**Why:** The Called Expert Accelerator PRO (R18,000 PIF / R6,500×3) is the primary revenue engine. 6 students × R18,000 = R108,000 per cohort. This workflow is the covenant between CHKPLT and the student.

**How:**
1. **Application** — Student submits 23-point diagnostic at `/apply`
2. **Qualification** — `evaluator.ts` scores the application → `determined_routing_status` returned
3. **Manual review** — Admin checks `client_stewardship_applications` table → confirm QUALIFIED_FOR_CORE_PROGRAM
4. **Checkout** — Student proceeds to checkout → Paystack (ZAR) or Stripe (international)
5. **Webhook fires** — Payment confirmed → `product_grants` row created → LMS access unlocked
6. **Onboarding email** — Lovable Cloud sends order receipt → MailerLite fires cohort welcome sequence
7. **Week 1–20 delivery** — 7-stage transformation system via LMS:
   - Week 1-3: MS×TS×SS (Mindset × Toolset × Skillset)
   - Week 4-6: SWOT (called expert audit)
   - Week 7-10: 4Es Content Engine (Educate/Entertain/Encourage/Earn)
   - Week 11-14: Social Media + Community (3Cs: Create/Collaborate/Contribute)
   - Week 15-17: DARES (Digital/Automated/Recurring/Evergreen/Scalable)
   - Week 18-20: PAIDS (Products/Ads+Affiliates/Information/Deals/Services)
8. **Progress tracking** — `lms_lesson_progress` table. Student dashboard at `/dashboard`
9. **Graduation** — Certificate + Called Expert Completion status in DB + CHKPLT community access

**Non-negotiable:** No cohort launches without a transformation promise backed by receipts (proof stories S001–S020).

---

### WF-003: Platform Maintenance & Health

**What:** Keep CHKPLT live, performant, and correctly wired every week.

**Why:** CHKPLT is the owned platform — the John 21 right side. If it breaks, the net breaks. "The net did not break" (John 21:11) is not just scripture — it's a platform SLA.

**How (weekly checks):**
- **Supabase health** — Check DB connection, RLS policies active, no long-running queries
- **Email queue** — Check `email_send_log` for `failed` or `dlq` status entries
- **Paystack webhook** — Confirm last 5 webhooks received + processed (check `payments` table)
- **Stripe webhook** — Same check in Stripe Dashboard → Developers → Webhooks
- **Cloudflare Workers** — Check wrangler tail logs for errors; confirm Turnstile is validating
- **Product catalog** — Confirm all published products have `download_path` set and PDFs accessible
- **LMS** — Confirm premium programs have at least 1 module (blockers list in `docs/BLOCKERS.md`)

**Monthly:**
- Reconcile `orders` table against Paystack + Stripe dashboards (every ZAR in = in both)
- Calculate SARS 25% reserve: `SELECT SUM(total_cents * 0.25) FROM orders WHERE status = 'paid'`
- Transfer SARS reserve to designated tax account

---

### WF-004: Email Sequence & Subscriber Nurture

**What:** Move a subscriber from first opt-in → warm lead → ICP 1 upgrade path.

**Why:** The email list is the only platform Ndivhuwo owns 100%. Instagram can be suspended (780K gone overnight). AdSense disabled (R180K/year gone). The email list cannot be suspended.

**How — 7-email welcome sequence (Days 1–13):**
| Email | Day | Subject angle | CTA |
|-------|-----|--------------|-----|
| 1 | 1 | Who I am + what's coming (780K story) | None — establish trust |
| 2 | 3 | "You're not lazy. You're unstructured." | Reply with your biggest challenge |
| 3 | 5 | PAIDS — 5 income streams (most use only 1) | Download PAIDS PDF |
| 4 | 7 | Niche clarity 3-step formula | Reply with your niche draft |
| 5 | 9 | River vs Fish Tank (own your platform) | MailerLite free to 1K |
| 6 | 11 | What brands actually want | Media kit template |
| 7 | 13 | Product offer (soft sell — proof first) | Free product or R997 offer |

**ICP 1 upgrade trigger:** Any reply mentioning "job," "salary," "expertise," "qualification," "teaching," "knowledge," or "professional" → tag `called-expert-potential` → route to Called Expert Blueprint sequence.

**MailerLite rules:**
- Reply-to: chiefmuhanelwa@gmail.com
- Send time: 9am SAST
- 2-day minimum gap between emails
- Never send more than 3 emails in a week

---

### WF-005: Content Engine (Batch → Film → Post)

**What:** Generate, film, and publish weekly content batches using the full-content-system as the AI brain and CHKPLT as the destination.

**Why:** Content drives traffic. Traffic drives leads. Leads enter the SEEDS pipeline. SEEDS converts to cohort sales. The 4-hour window (from ATNS shift work days) is the non-negotiable production window.

**How:**
1. **Generate** — Use `full-content-system` (`/dashboard/batch-planner`) to generate weekly content series
2. **Script** — Pull scripts from `/dashboard/scripts` to teleprompter
3. **Runsheet** — Generate shoot runsheet at `/dashboard/runsheet` (one session, 4-hour window)
4. **Film** — Tuesday: film all 7 pieces in one block. Teleprompter on phone. One setup.
5. **Edit** — Caption with hook text overlay. No long intros. Hook in first 1.5 seconds.
6. **Post schedule:** Instagram Reels (ICP 2 primary) · LinkedIn (ICP 1 primary) · Facebook (traffic) · TikTok (reach)
7. **Lead magnet pin** — Every post links to a free product. Every free product = MailerLite opt-in.
8. **Monitor** — Check which posts drove opt-ins → double down on that angle next batch

**Content series naming:** Always name the series (e.g., "Series 1: I Fished All Night"). Episodic logic — each post builds on the previous. Day 1 is always a reintroduction.

---

### WF-006: Financial Stewardship (25% SARS Rule)

**What:** Designate and protect 25% of every ZAR received for SARS obligations.

**Why:** Ndivhuwo paid R207,879.20 in SARS debt (R162,174.14 final after penalty waiver) from undeclared income. This will never happen again. 25% is set aside before any business expense. This is not optional.

**How:**
1. **Every payment processed** — DB stores `tax_reserve_cents = total_cents × 0.25` (migration required — not yet implemented)
2. **Monthly reconciliation** — Query: `SELECT SUM(tax_reserve_cents) FROM orders WHERE status = 'paid' AND created_at >= date_trunc('month', now())`
3. **Transfer** — Transfer exact SARS reserve amount to designated tax savings account by month-end
4. **SARS filing** — Annual return via eFiling (reference: 2990409167). Provisional tax due Feb + Aug.
5. **Never use tax reserve** — Not for cash flow, not for emergencies, not for expenses. It is not yours.

**SARS data (verified, do not change):**
- Original 2020–2022 assessment: R207,879.20
- Penalty waived via eFiling amended returns: R45,705.06
- Final paid: R162,174.14 over ~11 months at ~R17,000/month
- Practitioner: Thome-Lee Wright (wrightbizz.co.za)

---

### WF-007: Qualification Diagnostic (/apply flow)

**What:** Score a prospect's business readiness via the 23-point diagnostic and route them to the right programme.

**Why:** The Called Expert Accelerator PRO is not for everyone. The `/apply` flow protects the cohort quality (which protects the transformation promise) and filters out people who are not ready for R18,000 investment.

**How:**
1. Prospect lands on `/apply` (usually from ICP 1 content or direct link)
2. Turnstile CAPTCHA validates (no bots)
3. 23-question form: followers, engagement, income, income streams, product status, email list, community, email open rate, automations, niche clarity, SWOT history, 4E primary pillar, abundance mindset, building horizon
4. `evaluator.ts` scores and returns `determined_routing_status`
5. `QUALIFIED_FOR_CORE_PROGRAM` → unlock checkout for Called Expert Accelerator PRO
6. Other statuses → route to starter products (R997 or R1,997)
7. All applications stored in `client_stewardship_applications` for admin review
8. Admin reviews at `/admin/contacts` — can manually override routing status

**Current blocker:** Evaluator not yet end-to-end tested. 0 qualified users in DB. See `docs/BLOCKERS.md`.

---

### WF-008: Checkout & Payment Fulfillment (Dual Rail)

**What:** Handle purchases for both SA/Africa (ZAR via Paystack) and international (USD/GBP/EUR via Stripe).

**Why:** Ndivhuwo's audience is no longer only SA. The Called Expert framework applies globally. Any expert with knowledge and a phone is a potential student — wherever they are.

**How — Paystack (ZAR, Africa):**
1. Client calls `initializeCheckout()` with product slug + Turnstile token
2. Server validates Turnstile → fetches product → creates `orders` row (status: pending, provider: paystack)
3. POST to Paystack `/transaction/initialize` → returns authorization_url
4. Client redirects to Paystack payment page
5. Paystack webhook fires `charge.success` → `/api/public/paystack-webhook`
6. Server verifies HMAC (`x-paystack-signature` header) → updates order (status: paid) → inserts `product_grants` row
7. Client redirects to `/checkout/success` → PDF download + LMS access

**How — Stripe (USD/GBP/EUR/AUD, international):**
1. Client calls `initializeStripeCheckout()` (not yet built — see `docs/BLOCKERS.md`)
2. Server creates Stripe Checkout Session → returns session URL
3. Client redirects to Stripe-hosted checkout
4. Stripe webhook fires `checkout.session.completed` → `/api/public/stripe-webhook`
5. Server verifies signature (`stripe-signature` header, `STRIPE_WEBHOOK_SECRET`) → updates order → inserts `product_grants`
6. Same fulfillment as Paystack

**Currency detection (for auto-routing):**
- Cloudflare Workers provides `CF-IPCountry` header
- ZA, NG, GH, KE, UG, TZ, ZW, ZM, BW, MW → Paystack (ZAR)
- All other countries → Stripe (USD)
- User can override with manual currency switcher on checkout page

**SARS rule:** Every order must store `tax_reserve_cents = ROUND(total_cents * 0.25)` (migration not yet added).

---

## A — AGENT

### What Claude is doing in this project

Claude Code operates as the primary development and documentation agent for CHKPLT. Claude's role covers:

- **Documentation** — Maintaining WAT.md, CLAUDE.md, Learnings.md, and docs/ as the single source of truth
- **Product copy** — Writing product descriptions, email sequences, and landing page copy in NOCHILL voice
- **LMS curriculum** — Drafting module/lesson content for courses in the admin panel
- **Code assistance** — TanStack Start routes, Supabase server functions, Cloudflare Workers, migration files
- **Email templates** — Writing and updating React-Email templates in `src/lib/email-templates/`
- **Qualification tuning** — Adjusting the `evaluator.ts` scoring algorithm as cohort data comes in
- **Blocker resolution** — Working through `docs/BLOCKERS.md` in priority order

### What Claude must never do

- Never use `npm` or `yarn` — this project uses **Bun only**
- Never assume Next.js patterns (`use server`, `getServerSideProps`, `app/` router, `useRouter` from next/navigation)
- Never edit `supabase/migrations/` — always create a **new** migration file
- Never hardcode product prices — always read from DB
- Never call the Anthropic/Claude API in this project — AI generation lives in `full-content-system`
- Never commit `.env` — only `.env.example`
- Never skip HMAC validation on webhook routes (Paystack or Stripe)
- Never fabricate proof numbers — only use verified figures from the table in CLAUDE.md

### How to brief Claude for each workflow

**Starting a session:**
> "Read CLAUDE.md and Learnings.md first. We are working on [WF-00X: workflow name]. The current state is [X]. The goal of this session is [Y]."

**For code tasks:**
> "Run `bunx tsc --noEmit` before starting. Here is the relevant file: [path]. The task is [X]. Non-negotiable: HMAC validation / Turnstile / SARS reserve rule."

**For copy tasks:**
> "ICP is [ICP 1 / ICP 2]. Product is [name]. Transformation promise: A → B in X days. Lead with the pain. Proof story: [S00X]. NOCHILL voice — not LinkedIn, not motivational speaker. Direct, raw, SA energy."

**For email sequences:**
> "Sequence purpose: [welcome / nurture / ICP 1 upgrade]. Audience: [segment]. Day X. Subject must contain a specific amount or story hook. No 'I hope this helps'. End with one action."

---

## T — TOOLS

### Development

| Tool | Purpose | Command |
|------|---------|---------|
| **Bun** | Package manager + runtime | `bun install`, `bun dev`, `bun run build`, `bunx` |
| **TanStack Start v1** | SSR framework (NOT Next.js) | File-based routing in `src/routes/` |
| **React 19** | UI framework | Concurrent features, server components via TanStack |
| **Vite 7** | Build tool + dev server | Configured in `vite.config.ts` |
| **TypeScript 5.8** | Type safety | `bunx tsc --noEmit` — run before and after every change |
| **ESLint + Prettier** | Code quality | `eslint.config.js`, `.prettierrc` |
| **shadcn/ui + Radix UI** | Component library | 40+ pre-built components |
| **TailwindCSS 4** | Styling | CSS variables with `--banana` for gold etc. |

### Infrastructure

| Tool | Purpose | Config file |
|------|---------|------------|
| **Cloudflare Workers** | Hosting + edge compute | `wrangler.jsonc` |
| **Supabase** | PostgreSQL + auth + storage + RLS | `supabase/config.toml` + `src/integrations/supabase/` |
| **pgmq** | Email queue system (in Supabase) | Auto-managed via migrations |
| **pg_cron** | Scheduled jobs (email batches) | Auto-managed via migrations |

### Payments

| Tool | Purpose | Keys |
|------|---------|------|
| **Paystack** | SA/Africa ZAR payments | `PAYSTACK_SECRET_KEY`, `VITE_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET` |
| **Stripe** | International USD/GBP/EUR | `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Cloudflare Turnstile** | Bot protection on all forms | `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |

### Email

| Tool | Purpose | Keys |
|------|---------|------|
| **Lovable Cloud** | Transactional email (magic links, order receipts, auth) | `LOVABLE_EMAIL_API_KEY` |
| **MailerLite** | Marketing email (sequences, segments, broadcasts) | `MAILERLITE_API_KEY` + group IDs |
| **React-Email** | Transactional email templates | `src/lib/email-templates/` (7 templates) |

### Design

| Tool | Purpose | Brand tokens |
|------|---------|-------------|
| **Canva** | Product PDFs, social content, covers | Heritage Gold `#C9A84C` · Charcoal `#1C1C1C` · Tool Black `#111111` · Cream `#FAF7F0` |
| | | Fonts: Montserrat (headings 700–900) · Lato (body 400/700) |
| | | Footer on all PDFs: `chkplt.com \| @nochill_god` |
| | | Proof statement: "Sleeping in university bathrooms → R600,000+ annual income · 50+ brand deals · 23 agencies · 9 awards · SAMA31 judge · Meta speaker" |

### Analytics & Monitoring

| Tool | Purpose | Where |
|------|---------|-------|
| **Supabase Dashboard** | DB queries, table inspection, RLS audit | supabase.com |
| **Paystack Dashboard** | ZAR transaction log, webhook events, settlements | paystack.com |
| **Stripe Dashboard** | International transactions, webhook events | dashboard.stripe.com |
| **Cloudflare Analytics** | Worker invocations, errors, latency | dash.cloudflare.com |
| **MailerLite Analytics** | Open rates, click rates, subscriber growth | mailerlite.com |

---

## Weekly Operating Rhythm

| Day | Focus | Tools used |
|-----|-------|-----------|
| **Monday** | Kingdom intention — review metrics, set week goals, AI advisor consult | Supabase, Paystack/Stripe dashboards, full-content-system `/dashboard/advisors` |
| **Tuesday** | Content day — film 2–3 Reels in 4-hour window | Teleprompter + Runsheet (full-content-system), phone |
| **Wednesday** | Platform + product day — admin, new product creation, curriculum builds | `/admin/products`, `/admin/curriculum`, Canva |
| **Thursday** | Cohort + community day — LMS, group calls, email replies | `/learn`, MailerLite, WhatsApp group |
| **Friday** | Finance + planning day — SARS reserve check, Paystack/Stripe reconcile, next week plan | DB queries, Paystack, Stripe |
| **Saturday** | Rest. Psalm 115:12 — "He has been mindful of us." | — |
| **Sunday** | 20-min prep for Monday | — |

---

*This document is living. Update it when workflows change, tools are added, or a process is learned from real operations. Log the learning in `Learnings.md` first, then update this file.*

*Sealed by covenant. Built on land we own. Cast on the right side. — CHKPLT*
