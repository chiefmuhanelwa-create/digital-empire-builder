## Goal
Remove the visible price ranges (e.g., "R299 — R999", "R4,997+", "Free") from the category/Garden displays across the site. The internal slugs (`deshe`, `esev`, `etz_pri`, `devarim`) are not shown in the UI anywhere — they're only DB keys — so no UI change is needed for those. I'll just stop displaying `priceRange` everywhere it currently appears.

## Changes

1. **`src/components/site-header.tsx`**
   - Line 59 (desktop mega-menu): change `{m.name} — {m.priceRange}` → `{m.name}`.
   - Line 129 (mobile menu): change `{m.priceRange} · {m.tagline}` → `{m.tagline}`.

2. **`src/routes/products.index.tsx`** (line 86)
   - Remove the `{meta.priceRange}` badge/pill on each Garden card.

3. **`src/routes/products.garden.$garden.tsx`** (line 82)
   - Remove the `{meta.priceRange}` shown on the Garden detail header.

4. **`src/lib/gardens.ts`**
   - Leave the `priceRange` field in place (still in the type) but unused, OR remove it from the type + objects. I'll remove it cleanly so the type stays honest.

## Out of scope
- Actual product prices on individual product cards / checkout pages stay as-is — only the category-level price *ranges* are removed.
- Garden slugs / order are unchanged.
