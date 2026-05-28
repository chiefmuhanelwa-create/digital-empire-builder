## Nexus × CHKPLT Couture Light Tokens

Single-file change to `src/styles.css`. Pure CSS tokens + utility classes — no component refactors, no business logic.

### 1. Replace `:root` block
Swap in the Nexus light tokens exactly as specified:
- Canvas: `--background` 0.985, `--bg-surface` 0.970, `--bg-card` pure white, `--bg-card-hi` 0.955
- Ink hierarchy: `--foreground` 0.14, `--text-body` 0.28, `--text-dim` 0.48, `--text-subtle` 0.62 (new)
- Gold system: `--banana` 0.74/0.13/82, plus new `--gold-bright`, `--gold-pale`, `--gold-dim`
- Borders: `--border` 7% mix + new `--border-hover` (banana 45%)
- Glow rgba layers (unchanged values)
- Font stacks unified to Inter (replaces Outfit/Sora/DM Sans)

Preserve existing shadcn bridge tokens already in `:root` (`--card`, `--popover`, `--muted`, `--secondary`, `--destructive`, `--chart-*`, `--sidebar-*`, `--radius`, `--primary-foreground`) — they still need to resolve for shadcn components.

### 2. Replace `@layer base`
- Body rules as provided (drop `letter-spacing: -0.01em` global since headlines now own kerning)
- Add Nexus headline rules: `h1, .nx-h1` with `clamp(42px,6vw,76px)`, `-0.035em`, 1.05 line-height
- `h1 strong` / `.nx-h1 strong`: 800 weight, gold-tinted ink mix
- `h2, .nx-h2`: `clamp(28px,4vw,46px)`, `-0.025em`
- `.nx-label`: 11px / 600 / 0.18em uppercase eyebrow in `--gold-dim`
- Keep `* { border-color: var(--color-border); }` and the existing `a, button, input...` transition block

### 3. Append component modules (after `.cta-glow`)
- `.nx-card` + `::before` gold top-line + `:hover` lift with 3-layer shadow matrix
- `.nx-video-wrapper` — gold-tinted frame with layered glow
- `.nx-antisell` + `::before` gradient ring + `.nx-antisell-item` uppercase chip
- `.nx-hero-orb::before` — ambient breathing radial orb
- `@keyframes glow-breathe`

### 4. Font loading
Update `src/routes/__root.tsx` Google Fonts `<link>` to include Inter (weights 400/600/700/800). Leave existing fonts in place to avoid breaking anything still referencing them.

### Out of scope
No edits to components, routes, or product pages. Applying `.nx-card` / `.nx-video-wrapper` / `.nx-antisell` to specific surfaces (resource grids, product pages, checkout) is a separate follow-up — this turn ships the design system primitives only. Confirm if you want me to wire them into specific pages in the same turn, and which ones (e.g. `products.index.tsx` cards, `checkout.success.tsx` antisell, `products.$slug.tsx` video wrapper).
