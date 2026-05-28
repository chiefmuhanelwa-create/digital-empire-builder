# Apply premium light palette + CTA glow + remove Lebo line

## 1. `src/styles.css`
- Replace the entire `:root { ... }` block (lines 64–114) with the provided **Premium Editorial Light Palette** tokens (warm off-white canvas, deep stone ink, Harvest Gold #C8A84B, hairline borders via `color-mix`, gold glow rgba layers, sidebar overrides, font stacks).
- Bridge so existing shadcn semantic tokens stay wired (the components read `--card`, `--popover`, `--muted`, `--muted-foreground`, `--primary-foreground`, `--ring`, `--secondary`, etc.). Add these as aliases inside the same `:root` so the new palette propagates everywhere without touching components:
  - `--card: var(--bg-card)` / `--card-foreground: var(--foreground)`
  - `--popover: var(--bg-card)` / `--popover-foreground: var(--foreground)`
  - `--muted: var(--bg-surface)` / `--muted-foreground: var(--text-dim)`
  - `--secondary: var(--bg-surface)` / `--secondary-foreground: var(--foreground)`
  - `--accent-foreground: var(--banana-foreground)`
  - `--primary-foreground: var(--banana-foreground)`
  - `--ring: var(--banana)`
  - `--destructive: oklch(0.55 0.22 27)` / `--destructive-foreground: oklch(0.985 0.001 106)`
  - `--obsidian: var(--foreground)`
  - chart-1..5 kept on the gold spectrum for light mode
  - `--sidebar: var(--bg-surface)`, `--sidebar-accent: var(--bg-card-hi)`, `--sidebar-accent-foreground: var(--foreground)`, `--sidebar-primary-foreground: var(--banana-foreground)`, `--sidebar-ring: var(--banana)`
- Replace the existing `@layer base` block with the provided version (font smoothing, `text-rendering: optimizeLegibility`, baseline letter-spacing, global transitions on `a, button, input, select, textarea`). Keep the `* { border-color: var(--color-border); }` reset and the `h1, h2, .font-display` font-family rule so existing `font-display` usages still pick up the headline font.
- Append the `.cta-glow` utility class verbatim (base + `:hover`) at the bottom of the file.
- Add the three new Google Fonts (Outfit, Sora, DM Sans) to the existing `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">` in `src/routes/__root.tsx` so `--f-head`, `--f-ui`, `--f-body` actually load. Keep Playfair Display + IBM Plex Mono in the URL (still referenced by `.font-display` / mono utilities). **Do not** otherwise touch `__root.tsx`.

## 2. Apply `cta-glow` to primary CTAs
Add the class to the existing primary amber `<Button>` / link elements (no other style changes):
- `src/components/site-header.tsx` — "Access Vault" button
- `src/routes/index.tsx` — hero "Browse resources" button + bottom "Join the community" button
- `src/routes/products.$slug.tsx` — Buy / Checkout button(s) in the BuyBlock
- `src/components/FulfillmentStates.tsx` — primary action buttons across all four fulfillment states

For each, append `cta-glow` to the existing `className` and remove the now-redundant `bg-banana hover:bg-banana/90` / `bg-amber-500 hover:bg-amber-400` color classes on that one element so the gradient + glow shows through cleanly. Leave variant, size, padding, and layout classes alone.

## 3. Remove the Lebo attribution
`src/routes/products.$slug.tsx` line ~135 — delete the line "By Lebo M. — multi-award-winning South African media founder. Built for creators 18–34." (and its wrapper `<p>` if empty). That copy was placeholder text I introduced earlier; it doesn't reference a real person tied to your project.

## Out of scope
No business-logic, schema, server-function, route, or auth changes. Purely tokens, one utility class, four CTA className tweaks, one copy deletion, and one `<link>` font URL extension.
