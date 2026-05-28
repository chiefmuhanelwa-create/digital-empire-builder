# Pivot to Nexus Dark — Indigo/Violet Design System

This replaces the current light editorial gold palette with the dark Nexus system you specified. Scope is contained to `src/styles.css` plus the Google Fonts link in `src/routes/__root.tsx`. No component/route edits — every existing `bg-background`, `text-foreground`, `border-border`, `nx-card`, `nx-antisell`, `nx-video-wrapper`, `nx-hero-orb`, `cta-glow`, `font-display` className will re-skin automatically.

## 1. `src/routes/__root.tsx` — font link

Replace the current Google Fonts `<link>` with the Inter-only weights you pasted (300–900). Drop Outfit / Sora / DM Sans / Playfair / IBM Plex Mono from the fetch (they're unused now). `preconnect` lines stay.

## 2. `src/styles.css` — full rewrite of tokens + base + components

### `:root` token block (replace lines 66–138)
Map your Nexus hex values onto the existing shadcn semantic names so every shadcn component re-skins:

- `--background` → `#0a0a0a`, `--bg-surface` → `#111`, `--bg-card` → `#111`, `--bg-card-hi` → `#1a1a1a`
- `--foreground` → `#fff`, `--text-body` → `#E2E8F0`, `--text-dim` → `#94A3B8`, `--text-subtle` → `#64748B`
- Brand: `--nx-blue #4F46E5`, `--nx-blue-mid #6366F1`, `--nx-blue-bright #818CF8`, `--nx-purple #7C3AED`
- `--primary` → `--nx-blue`, `--primary-foreground` → `#fff`, `--accent` → `--nx-purple`, `--ring` → `--nx-blue-mid`
- `--border` → `rgba(255,255,255,0.08)`, `--border-hover` → `rgba(99,102,241,0.35)`, `--input` → same border
- Glow vars: `--nx-glow-tight/mid/wide` exactly as you specified
- Gradient vars: `--nx-btn-gradient`, `--nx-video-border`
- shadcn bridges (`--card`, `--popover`, `--muted`, `--secondary`, `--sidebar*`, charts) re-pointed to the dark surfaces with indigo-tinted chart colors
- Keep `--banana` as alias of `--nx-blue` so any straggler `bg-banana` / `text-banana-foreground` usage (header CTA, 404 button) renders indigo instead of breaking
- Font stacks stay Inter

### `.dark` class
Kept as no-op (dark is now default) for shadcn parity.

### `@layer base` (replace lines 144–207)
- `body` stays on `--background` / `--foreground` — now dark.
- `h1/.nx-h1`: `clamp(40px,6vw,72px)`, weight 700, `letter-spacing: -2px` (your spec), `line-height: 1.05`, color `#fff`
- `h1 strong`: weight 800, color stays white (no gold tint anymore)
- `h2/.nx-h2`: `clamp(28px,4vw,48px)`, 700, `-1.5px`, 1.1
- `h3, h4`: 600, `-0.02em`
- `.font-display`: Inter 700, `-0.035em` (kept for existing usages)
- `.nx-label`: 12px, 600, `letter-spacing: 2px`, uppercase, color `--nx-blue-bright`
- `.nx-body`, `.nx-metric` added per your spec
- Transition rule on interactive elements unchanged

### `.cta-glow` (replace lines 212–229)
Re-spec to the Nexus indigo→violet gradient button:
- `background: var(--nx-btn-gradient)`, color `#fff`, weight 600, `padding: 14px 36px`, `border-radius: 10px`
- Resting box-shadow: `0 0 20px rgba(99,102,241,0.30), 0 0 60px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.40)`
- Hover: `translateY(-3px)` + intensified glow `0 0 35px rgba(99,102,241,0.55), 0 0 90px rgba(99,102,241,0.22), 0 10px 28px rgba(0,0,0,0.50)`
- Transition `transform .25s ease, box-shadow .25s ease`

### `.nx-card` (replace lines 235–260)
Dark surface `#111`, white-08 border, radius 16px, padding 32px. Hover: border `rgba(99,102,241,0.35)`, indigo glow box-shadow per your spec, `translateY(-4px)`. Gradient top-edge line uses `#6366F1` instead of gold. Add staggered entrance keyframes (`card-enter`) + `:nth-child` delays so card grids animate in on load.

### `.nx-video-wrapper` (replace lines 262–270)
- Border `rgba(99,102,241,0.30)`, radius 16, indigo box-shadow per your spec
- `::before` gradient border trick (indigo→violet→indigo at `inset:-1px`, `border-radius:17px`, `z-index:-1`)
- Always-on `box-shadow` breathe animation (`video-pulse` 4s ease-in-out) between two glow intensities

### `.nx-antisell` + `.nx-antisell-item` (replace lines 272–304)
Per your spec: `rgba(10,10,10,0.95)` background, indigo border + box-shadow + `::before` gradient overlay. Items: `rgba(99,102,241,0.08)` bg, `0.12` border, uppercase `#C8C8E0` 13px text, 1px letter-spacing.

### `.nx-hero-orb` (replace lines 306–322)
Radial gradient swapped to indigo/violet:
```
radial-gradient(circle,
  rgba(99,102,241,0.15) 0%,
  rgba(124,58,237,0.08) 35%,
  transparent 65%)
```
600×600, top `-150px`, animation `glow-breathe 5s` scale 1→1.06, opacity 0.8→1.

### New animation utilities (appended)
1. `@keyframes glow-breathe` updated to your spec (5s, scale 1→1.06)
2. `@keyframes card-enter` + `.nx-card:nth-child` delays (0, .12s, .24s)
3. `@keyframes video-pulse` (4s box-shadow breathe) bound to `.nx-video-wrapper`
4. `.reveal` / `.reveal.visible` / `.reveal-delay-1/2/3` scroll-reveal classes (CSS only — no JS observer wired in this turn; available for future use)
5. Form-step utilities: `.seg`, `.seg.done`, `.seg.active` (indigo progress), `.opt` / `.opt.sel` (indigo selected glow), `.step` + `@keyframes step-in`
6. Governing principle preserved: only `opacity`, `transform`, `box-shadow` animate — no layout-triggering properties

## What this will visibly change immediately

- Whole site flips to near-black background with white text — every page, every component
- Header, cards, buttons, 404, checkout success, learn pages all re-skin via shadcn tokens
- Existing `cta-glow` buttons become indigo/violet gradient pills with persistent glow
- `nx-hero-orb`, `nx-card`, `nx-video-wrapper`, `nx-antisell` modules render in Nexus indigo
- Headlines render Inter 700 with tight `-2px` tracking

## Out of scope (do NOT touch this turn)

- No edits to route/page/component files — pure token/class re-skin
- No new components, no IntersectionObserver JS for `.reveal`
- No copy changes, no layout restructuring
- Brand-color audit of any hardcoded hex strings inside components (we can sweep those in a follow-up if any surface)

## Risk note

The previous turn just landed the light gold palette. This plan throws that out and replaces it with dark Nexus. Confirm that's what you want before approving — there's no automated way to "go back to gold" except reverting.
