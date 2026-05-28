# Kingdom Integration Layer — Homepage Rewrite

Single-file edit to `src/routes/index.tsx`. Replace the current 3-section landing with the approved 5-section narrative. Uses existing tokens/primitives only — no styles.css changes, no new components, no new routes.

## SEO head()

- `title`: "Contentpreneur — Build a Kingdom business that scales with honor"
- `description`: "Digital systems, audience acquisition funnels, and tax compliance frameworks for Kingdom Contentpreneurs. Built on faith, ethics, and generational impact."
- og:title / og:description mirroring above

## Section 1 — Hero (`nx-hero-orb`)

- Eyebrow: `.nx-status-live` pill with `.nx-live-dot` → `NOW ACCEPTING APPLICANTS — COHORT 01`
- H1 (`font-display`, responsive `text-4xl → md:text-7xl`): "Stop posting for likes. **Start owning a Kingdom business that scales with honor.**" — second sentence wrapped in `<em className="text-banana not-italic">` for gold emphasis.
- Subheadline: the full approved paragraph in `text-muted-foreground`.
- Primary CTA: `cta-glow` → `/signup` ("Apply for Cohort 01")
- Secondary outline button → `/about` ("Read our standards")

## Section 2 — Creator Transformation Matrix (two-column)

- Eyebrow `.nx-label`: "THE CONTEXT SHIFT"
- H2: "From worldly hustle to Kingdom stewardship."
- Two `nx-card`s side-by-side on `md:grid-cols-2`, stacked on mobile:
  - **The Worldly Hustle** — 3 problem bullets, each prefixed with a subtle red-tinted `×` icon (lucide `X`) using `text-destructive`.
  - **Kingdom Stewardship** — 3 solution bullets prefixed with lucide `Check` in `text-banana`.
- Exact copy from the brief.

## Section 3 — The 5-Stage System

- Eyebrow `.nx-label`: "THE STRUCTURAL CORE"
- H2: "The five stages from creator to compliant Kingdom enterprise."
- Grid of 5 `nx-card`s (`md:grid-cols-2 lg:grid-cols-3` with the 5th spanning when needed, or `md:grid-cols-2` with the last full-width — go with 2-col grid on md, 3 on lg, last card spans 2 on lg via `lg:col-span-1` natural flow).
- Each card: large `font-mono text-banana` stage number ("STAGE 01"), then `font-display text-2xl` title, then body copy in `text-muted-foreground`.
- Cards: Purpose Alignment & Authority / Automated Asset Capture / The Qualification Firewall / The Diagnostic Session / Enterprise Execution — all copy verbatim from the brief.

## Section 4 — The "NOT FOR" Gate (`nx-antisell`)

- Eyebrow `.nx-label` in orange tone via inline class: "THE DATA SANCTUARY"
- H2 inside the panel: "The CHKPLT Program is strictly closed to:"
- 4 `nx-antisell-item` rows, each starting with a `🔒` glyph + the exact copy lines from the brief.
- Closing line beneath the panel: "If that resonates, you're in the right place." with a `cta-glow` CTA → `/signup` ("Begin your application").

## Section 5 — Signature Seal (footer band, above SiteFooter)

- Centered, tight band, `border-t border-border/60`.
- Wordmark: "Contentpreneur" in `font-display text-3xl sm:text-4xl tracking-tight`.
- Tagline below in `nx-label` style: "BUILT FOR CREATORS · GROUNDED IN FAITH · ANCHORED IN AFRICA"
- Then existing `<SiteFooter />` renders underneath.

## Mobile rules (re-applied throughout)

- Section padding: `py-14 sm:py-20 md:py-28`
- Card padding inside `nx-card`: rely on default; tighten to `!p-7 sm:!p-8` where needed.
- All primary CTAs: `w-full sm:w-auto`
- H1 floor `text-4xl`, H2 floor `text-2xl sm:text-3xl`

## Out of scope

- No edits to `styles.css`, `site-header`, footer, or any other route.
- No new components or routes.
- No backend, no data fetch, no auth changes.
- Imagery: text-only render in this turn (no new image generation).

## Risk note

This replaces the current "Build your brand / Monetize your calling" hero and the Learn/Build/Earn pillars entirely. Existing nav links (`/products`, `/about`, `/signup`) all remain valid.
