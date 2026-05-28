## Reconcile `/apply` to match the pasted spec

### Scope
Bring the visible wizard, results screen, and routing copy in `src/routes/apply.tsx` into line with the paste. Keep the safer infrastructure choices already in place (typed `inputValidator`, project `supabaseAdmin` import, real email/full_name capture, GRANTed RLS) — the paste's snippets have bugs (`--` SQL comment inside a JS object, hardcoded placeholder email, deprecated `.validator()`, raw `createClient`) and the existing infra already satisfies the spec's intent.

### Changes to `src/routes/apply.tsx`

1. **Progress header** — match spec strings:
   - `"Stewardship Module {step} / 5"` (left), `"{x}% Complete"` (right).
   - Bar uses `bg-banana` fill.

2. **Module 1 header** — add `nx-label` orange eyebrow `"Module 01"` and rename heading to `"Follower Count & Engagement"`. Repeat the eyebrow + spec-exact title pattern for Modules 02–05:
   - 02 · Monetization Current State
   - 03 · Audience Ownership & Data Control
   - 04 · Business Systems
   - 05 · Mindset & Strategy

3. **Results — Qualified card** (`STAGE_5_COMMUNITY`):
   - Top 4px `bg-banana` accent strip.
   - Banana check disc, heading `"Stewardship Audited Successfully"`, spec subcopy, single CTA `"Secure Your Master Profile"` → `/signup`.

4. **Results — Downsell card**:
   - Top 4px `bg-[#EA580C]` strip + `AlertTriangle` row with `"Diagnostic Evaluation"` eyebrow.
   - Heading `"Foundational Vulnerability Detected"`, spec subcopy referencing `vulnerabilityTag`.
   - Two info rows: `Immediate Priority Focus` (`focusPillars`) and `Required Learning Framework` (`targetModules`).
   - "Optimization Notice" callout when user ticked "I don't know my engagement rate".
   - Below it, a second `nx-card` with banana strip, `"Recommended Framework Entry"` eyebrow, and tag-conditional headline/body:
     - `STAGE_1_DISCOVERY` / `STAGE_2_AWARENESS` → "Content Calendar Template Bundle & Foundation Worksheets"
     - `STAGE_3_CONSIDERATION` → "Contentpreneur: From Memes to Millions"
     - `STAGE_4_CONVERSION` → "Tax For Contentpreneurs / PAIDS Tracker"
   - CTA `"Get Standalone Package"` → `/products`.

5. **Engagement disabled state surfaces in the result** — pass `dont_know_engagement` from form state into the result render so the optimization notice can show.

### Out of scope (intentionally kept as-is)
- DB schema — already correct and GRANTed.
- `evaluator.ts` — already implements the 5-tag cascade exactly per spec §2 logic.
- `apply.functions.ts` — already uses typed `inputValidator`, project `supabaseAdmin`, real email/full_name. The paste's version would regress (SQL comment syntax error, placeholder email, deprecated API).
- Brevo dispatch / Calendly — remain TODO per spec guardrails.
- No new routes, no auth changes, no DB migration.

### Files touched
- `src/routes/apply.tsx` (single file edit)
