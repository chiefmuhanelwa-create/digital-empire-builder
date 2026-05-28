## Root cause

The `:root` tokens and `@layer base` are correct — but the Tailwind `@theme inline` block at the top of `src/styles.css` still maps `--font-display` → **Outfit** and `--font-sans` → **DM Sans**. Every component uses `font-display` / `font-sans` classes (and the body inherits `font-sans`), so Tailwind is overriding our Inter stack and the page still renders in Outfit. That's the "very different" look you're seeing.

The Nexus headline kerning rule (`h1 { letter-spacing: -0.035em }`) is in fact applying, but since the font is still rounded Outfit it reads as the old aesthetic, not the editorial Inter feel from nexuscreator.com.

## Fix (scope-contained, styles.css only)

1. **Rewire `@theme inline` font tokens to Inter:**
   - `--font-display: 'Inter', -apple-system, sans-serif;`
   - `--font-sans: 'Inter', -apple-system, sans-serif;`
   - Leave `--font-mono` untouched.

   This single change cascades Inter to every `font-display` / `font-sans` className across all routes/components without touching them.

2. **Tighten `.font-display` kerning** in `@layer base` so Tailwind-classed headlines (which set their own font-size) still pick up Nexus's `-0.035em` tracking. Currently `.font-display` only has `-0.015em`; bump to `-0.035em` for parity with `h1`.

3. **No component edits.** Existing `font-display` className usages keep working; they just render in Inter now.

## Out of scope

- No edits to `src/routes/__root.tsx` (Inter is already in the Google Fonts link from the previous turn).
- No binding of `.nx-card` / `.nx-video-wrapper` / `.nx-antisell` into page layouts — per your "keep scope contained" directive.
- No color/background changes — the light palette is already rendering correctly per the preview screenshot.
