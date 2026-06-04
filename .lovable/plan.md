# Export the full CHKPLT UI as a downloadable bundle

You want everything that makes the site look and function the way it does — fonts, CSS, layout, components — packaged so you can hand it off, study it, or rebuild it elsewhere. Here's what I'll deliver.

## What you'll get

A single zip at `/mnt/documents/chkplt-ui-export.zip` containing:

```
chkplt-ui-export/
├── README.md                     ← how to open/use the bundle
├── DESIGN-SYSTEM.md              ← all tokens, fonts, components documented
├── pages/                        ← rendered HTML snapshot of every public route
│   ├── index.html                ← /
│   ├── about.html
│   ├── products.html
│   ├── products-90day-cohort.html
│   ├── products-vip-tier.html
│   ├── apply.html
│   ├── contact.html
│   ├── login.html
│   ├── signup.html
│   ├── terms.html
│   ├── privacy.html
│   └── refund-policy.html
├── css/
│   ├── styles.css                ← the full compiled Tailwind v4 + custom CSS
│   └── tokens.css                ← isolated color/font/shadow tokens
├── fonts/
│   └── inter/                    ← Inter font files (woff2, all weights used)
└── components/                   ← standalone HTML+CSS for each reusable block
    ├── cta-button.html           ← .cta-glow gold gradient pill
    ├── card.html                 ← .nx-card with hover lift
    ├── antisell.html             ← .nx-antisell highlight block
    ├── hero-orb.html             ← glowing radial hero
    ├── live-badge.html           ← burnt-orange live pulse
    └── premium-program.html      ← R18k/R45k phase-grid block
```

## How I'll build it

1. **Render every public route to static HTML.** Start the dev server, navigate to each route, capture the fully-rendered DOM (after React hydration) and save it as a standalone `.html` file with absolute asset paths rewritten to relative `./css/styles.css`.

2. **Extract the compiled CSS.** Pull the Vite-built CSS bundle so you get the full Tailwind v4 output plus all custom rules from `src/styles.css` (Nexus Dark tokens, `.cta-glow`, `.nx-card`, `.nx-antisell`, `.nx-hero-orb`, live-pulse keyframes, etc.) as a single file.

3. **Download the Inter font files locally.** The site loads Inter from Google Fonts via `<link>`. I'll fetch the actual `.woff2` files for weights 300/400/500/600/700/800/900 and rewrite the CSS `@font-face` so the bundle works offline.

4. **Write a DESIGN-SYSTEM.md reference.** Documents:
   - Full color palette with hex values (cream `#FAF7F0`, gold `#C9A646`, gold-deep `#8C6F1F`, burnt-orange `#D4541F`, ink `#0A0A0A`)
   - Font stack and weight usage (Inter display + body)
   - Spacing, radius, shadow tokens
   - Animation keyframes (`glow-breathe`, `card-enter`, `video-pulse`, `live-pulse`)
   - Each `.nx-*` component with HTML example + screenshot

5. **Extract standalone component snippets.** Pull each reusable visual block into its own self-contained HTML file so you can paste them directly into any project.

6. **Write the README** explaining the bundle layout, how to open the HTML files in a browser, and which CSS classes map to which components.

## Important caveats (please read)

- **Static snapshot only.** The exported HTML is visual/structural — buttons, forms, and the qualification wizard won't be wired to a backend. Interactivity that depends on React state (live form steps, auth, checkout, the `/apply` wizard) will look correct but won't function. That's inherent to any HTML/CSS export of a React app.
- **Auth-gated pages excluded** (`/dashboard`, `/learn/*`, `/admin/*`) because they require a logged-in session to render meaningful content. If you want them, I can render them logged-out (will mostly show redirects) or you'd need to provide a test session.
- **If you need the live, working version**, the right move is "Connect to GitHub" from the Lovable editor instead — that gives you the actual runnable source code (React + Tailwind + server functions). The static bundle is for design reference / handoff, not running the platform.

## Technical details

- Vite build output goes to `dist/`; I'll pull `dist/assets/*.css` for the compiled stylesheet.
- DOM capture uses the browser tool against the dev preview at each route, grabs `document.documentElement.outerHTML`, then post-processes to inline any critical styles and rewrite asset URLs.
- Font files come from `fonts.gstatic.com` via the URLs in the Google Fonts CSS response, saved into `fonts/inter/`.
- The `.asset.json` CDN-hosted assets (if any are referenced visually) get downloaded into an `assets/` folder and rewritten to relative paths.

Approve and I'll generate the bundle.
