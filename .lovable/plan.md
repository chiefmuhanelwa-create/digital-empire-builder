## Goal

Overwrite `src/routes/index.tsx` with the finalized 5-section Kingdom Integration Layer, binding exclusively to existing CSS primitives (`.nx-hero-orb`, `.nx-card`, `.nx-antisell`, `.nx-antisell-item`, `.cta-glow`) and the cream / black / Harvest Gold / Burnt Orange palette already in `src/styles.css`.

The pasted source had its JSX tags stripped by markdown rendering, so I will reconstruct valid TSX from the intended structure and verbatim copy.

## Sections

1. **Hero — Sovereign Promise**
   - `.nx-hero-orb` background accent
   - Eyebrow: `.nx-status-live` pill with `.nx-live-dot` → "Now Accepting Applicants — Cohort 01"
   - H1 (`font-display`, tight tracking, responsive `text-4xl → md:text-7xl`): "Stop posting for likes. Start *owning a Kingdom business* that scales with honor." — gold emphasis via `<em className="text-banana not-italic">`
   - Subheadline in `text-muted-foreground`
   - CTAs: primary `.cta-glow` → `/signup` ("Apply for Cohort 01"), secondary outline → `/about` ("Read our standards"); `w-full sm:w-auto`

2. **Transformation Matrix**
   - `nx-label` section header + display subheading
   - Two `nx-card`s side-by-side on `md:grid-cols-2`
   - Column A "✕ The Worldly Hustle" — 3 bullets with `X` icon in `text-destructive`
   - Column B "✦ Kingdom Stewardship" — 3 bullets with `Check` icon in `text-banana`

3. **5-Stage System**
   - `nx-card` grid `md:grid-cols-2 lg:grid-cols-3`
   - Each card: `font-mono text-xs tracking-[0.3em] text-banana` stage number, `font-display text-2xl` title, body in `text-muted-foreground`
   - Verbatim copy for stages 01–05 (Purpose Alignment, Automated Asset Capture, Qualification Firewall, Diagnostic Session, Enterprise Execution)

4. **NOT FOR Gate — Data Sanctuary**
   - `.nx-antisell` panel, 4 `.nx-antisell-item` rows with `Lock` icon
   - Closing line + `.cta-glow` CTA → `/signup` ("Begin your application")

5. **Signature Seal**
   - Centered "Contentpreneur" wordmark in `font-display text-3xl sm:text-4xl`
   - Tagline "Built for creators · Grounded in faith · Anchored in Africa" in `nx-label` style
   - Followed by `<SiteFooter />`

## Technical notes

- Add missing `import { createFileRoute } from "@tanstack/react-router";` (omitted in the pasted snippet).
- Use `head` inside `createFileRoute({ head: () => ({...}) })` per TanStack pattern, not a separate exported function — keeps metadata working through the router.
- Mobile spacing: `py-14 sm:py-20 md:py-28`, `px-5 sm:px-8`, `!p-7 sm:!p-8` on cards, `gap-6 sm:gap-8`.
- Containers: `max-w-6xl` hero/matrix/stages, `max-w-4xl` antisell, `max-w-3xl` seal.
- All colors via semantic tokens — no hardcoded hex.

## Out of scope

- No edits to `src/styles.css`, `__root.tsx`, `site-header`, `site-footer`, or any other route.
- No new components, routes, backend, data, or auth changes.
