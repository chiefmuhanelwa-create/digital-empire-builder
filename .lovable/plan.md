# CHKPLT Homepage Rewrite + /apply Assessment Engine

## Part A — Homepage Copy Refresh (`src/routes/index.tsx`)

Replace the existing 5-section narrative with the new Master Promise script while keeping the same design primitives (`.nx-hero-orb`, `.nx-status-live`, `.cta-glow`, `nx-card`, `.nx-antisell`, `nx-label`, Harvest Gold + Burnt Orange tokens, Inter type scale, `<SiteFooter />`).

1. **Hero** — Orange live pill "CHKPLT Engine Activated — Cohort 01 Application Window Open"; H1 "Stop posting for likes. Start owning a Kingdom business that scales with honor."; vision statement subhead ("I lead African creators…"); primary `.cta-glow` → `/apply` ("Audit Your Creative Equation →"), secondary outline → `/about` ("Read Our Standards"); credibility ribbon row: "3M+ Combined Followers · 100K+ Email Subscribers · 6,000+ Books Sold · For Children's Children — Proverbs 13:22".
2. **Foundational Business Law** — Eyebrow "The Core Equation"; formula header rendered as styled inline expression `Mindset (MS) × Skillset (SS) × Toolset (TS) = Digital Asset`; "The Zero Rule" callout in `nx-card` (banana accent on key phrase).
3. **7-Stage Curriculum** — Eyebrow "The Flagship Transformation"; subheading + Exodus/Leviticus note in muted body; 7 `nx-card`s in `md:grid-cols-2 lg:grid-cols-3` with mono week badges (Weeks 1-2 … Weeks 17-20) in `text-banana`, stage titles in `font-display`, body copy verbatim from script; closing `.cta-glow` → `/apply`.
4. **Anti-Sell Sanctuary** — Orange-styled `nx-label` eyebrow; `.nx-antisell` panel with 4 `Lock`-iconed rows (Dishonest Tactics, Short-Term Thinking, Lack of Execution, Unstructured Foundations); transition line "If that resonates, you are in the right place."; `.cta-glow` → `/apply` ("Begin Your Stewardship Assessment →").
5. **Corporate Signature Band** — "Contentpreneur" wordmark in `font-display`; triple-anchor tagline "BUILT FOR CREATORS · GROUNDED IN FAITH · ANCHORED IN AFRICA" in `nx-label` style; then `<SiteFooter />`.

No `styles.css`, header, or footer edits.

## Part B — `/apply` Assessment Engine

### B1. Database migration
New isolated table (does not touch existing schema):

```
client_stewardship_applications (
  id uuid pk, email text, full_name text,
  follower_count int, engagement_rate int null,
  posts_consistently_4x bool, owns_email_list bool,
  email_subscribers_count int default 0,
  has_products_for_sale bool,
  monthly_income_value int default 0,
  income_streams_count int default 1,
  largest_stream_percentage int default 0,
  determined_routing_status text,
  assigned_package_recommendation text,
  vulnerability_phase_tag text,
  raw_answers jsonb,          -- store all 23 answers for analysis
  created_at timestamptz default now()
)
```
- `GRANT INSERT ON ... TO anon, authenticated` (public unauth submissions); `GRANT ALL TO service_role`; `GRANT SELECT TO authenticated` gated by `has_role(auth.uid(), 'admin')` policy.
- RLS: anon/authenticated can INSERT (with check `true`); only admins can SELECT.

### B2. Evaluator utility — `src/utils/evaluator.ts`
Exact cascade from the spec (Stage 1 Discovery → Stage 2 Awareness → Stage 3 Consideration → Stage 4 Conversion → Stage 5 Community). Returns `{ status, recommendedPackage, focusPillars, targetModules, vulnerabilityTag }`.

### B3. Server function — `src/lib/apply.functions.ts`
`submitApplication` (`createServerFn POST`, no auth middleware = public). Zod-validates the 23-field payload, runs `evaluateRecommendationTree`, inserts via `supabaseAdmin` into `client_stewardship_applications`, returns the recommendation object. (Brevo dispatch deferred — see Out-of-Scope.)

### B4. Route — `src/routes/apply.tsx`
Public route, file path `/apply`, with `head()` metadata.

Multi-step wizard (5 modules matching the spec) using existing shadcn `Input`, `RadioGroup`, `Switch`, `Select`, `Button`, `Progress`. Mobile-first (`max-w-2xl`, full-width inputs, sticky bottom Next/Back bar on mobile). State held in a single `useState` object; `react-hook-form` + zod resolver for validation per step.

- Q2 engagement rate: numeric input + `Checkbox` "I don't know my engagement rate" → sets value to `null`.
- Q8/Q10/Q12 only visible when their parent toggle is YES.
- Progress bar shows module 1/5 … 5/5.

On submit → call `submitApplication` → render one of two result panels in place (no navigation):

- **QUALIFIED_FOR_CORE_PROGRAM** — Success card: "Your metrics validate entry into the 20-Week Core Curriculum." + scheduler CTA placeholder button → `/signup` (real scheduler embed out of scope).
- **REDIRECT_TO_DOWNSELL** — Diagnostic panel breaking down `vulnerabilityTag` + `focusPillars`, then a downsell `nx-card` whose contents map by tag:
  - `STAGE_1_DISCOVERY` / `STAGE_2_AWARENESS` → "Content Calendar Template Bundle & Foundation Worksheets"
  - `STAGE_3_CONSIDERATION` (from Stage 4 spec note) → "Contentpreneur: From Memes to Millions"
  - `STAGE_4_CONVERSION` → "Tax For Contentpreneurs / PAIDS Tracker"
  Each card uses `.cta-glow` button → `/products` (cannot deep-link without confirmed slugs).
- If `engagement_rate === null`, render the "Optimization Notice" line inside the summary.

### B5. Wire navigation
- Homepage CTAs now point to `/apply` (replacing previous `/signup` targets in hero + anti-sell + curriculum CTAs).

## Out of scope (will flag, not build)
- **Brevo trigger**: requires confirmation that the Brevo connector should be linked and the list/template IDs. Will leave a TODO + commented dispatch stub in the server function; no Brevo call until secrets confirmed.
- **Scheduler embed** (Calendly / similar) on the qualified path — placeholder CTA only.
- **Deep-linking downsell products to exact slugs** — links to `/products` index until exact slugs are confirmed.
- No edits to existing routes other than the homepage.

## Technical notes
- Migration tool: single call with CREATE TABLE + GRANTs + ENABLE RLS + INSERT policy for anon/authenticated + admin SELECT policy.
- Validation: zod schema mirrors the 23 fields; `engagement_rate: z.number().int().min(0).max(100).nullable()`.
- File creation order: migration first (await user approval) → then evaluator, server fn, route, homepage edits in parallel.

Confirm to proceed, or tell me to change the Brevo handling / scheduler / downsell slugs before I build.