# Copy swap + mobile-first responsive hardening

## 1. `src/routes/index.tsx` — copy changes

- Replace secondary CTA "Read our standards" → **"About CHKPLT"** (still `<Link to="/about">`, same outline variant).
- Delete the three proof stats: `3M+ Combined Followers`, `100K+ Email Subscribers`, `6,000+ Books Sold`. Keep only `For Children's Children — Proverbs 13:22` in the `PROOF` list (single item).

## 2. `src/routes/index.tsx` — mobile responsiveness

- Hero H1 already scales; tighten to `text-3xl sm:text-5xl md:text-7xl lg:text-[5.5rem]`.
- Core Equation formula `<p>`: wrap inner spans in a `flex flex-wrap justify-center gap-x-2 gap-y-1 text-base sm:text-xl md:text-2xl` container so `MS × SS × TS = Digital Asset` wraps cleanly at 320px without horizontal clipping.
- 7-Stage grid: already `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — confirm and keep.
- All section paddings already follow `py-14 sm:py-20 md:py-28` / `px-5 sm:px-6` pattern — verified compliant.

## 3. `src/routes/__root.tsx` (or main wrapper) — global overflow guard

- Add `overflow-x-hidden` to the top-level `<div className="min-h-screen…">` in `index.tsx`, `apply.tsx`, and `about.tsx` to kill any accidental horizontal scroll from long form labels or wide grids.

## 4. `src/routes/apply.tsx` — mobile wizard hardening

- **Full-width inputs**: `Input`, `SelectTrigger` already span full width via shadcn defaults — verify with `w-full` where missing.
- **48px touch targets**:
  - `YesNo` radio labels: bump `py-3` → `py-3.5 min-h-[48px]`.
  - "I don't know my engagement rate" checkbox label: add `min-h-[48px] py-2`.
- **Sticky mobile nav bar**: Wrap the Back / Continue / Submit row (lines 488–512) in:
  ```
  fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/85 backdrop-blur-md p-4
  sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:p-0
  ```
  Order on mobile: Back (left) | Continue/Submit (right) using `flex-row` (override the current `flex-col-reverse` at `<sm`).
- **Keyboard buffer**: add `pb-28 sm:pb-0` to the form section wrapper (line 239) so the sticky bar never overlaps the last field on mobile.
- **Hero H1** (line 227): already `text-3xl sm:text-4xl md:text-5xl` — confirm.

## 5. Out of scope

- No backend/schema/evaluator changes.
- No design-token or color changes (Inter weights, banana/orange tokens, `nx-card` borders untouched).
- `about.tsx` already responsive — no edits needed unless an issue surfaces.

## QA checklist (manual)

- iPhone SE (375px) and 320px viewport: no horizontal scroll on `/` or `/apply`.
- Equation line wraps without clipping.
- Apply wizard: sticky nav visible above keyboard; all tap targets ≥ 48px.
