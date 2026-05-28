Tighten vertical spacing across the platform per the exact padding specification.

### 1. Homepage section padding refactor (`src/routes/index.tsx`)
Locate the four main section containers and replace their vertical padding:

- **Hero** (line 90): `pt-14 pb-16 sm:pt-20 sm:pb-24 md:pt-32 md:pb-32` → `py-8 sm:py-12 md:py-16`
- **Core Equation** (line 126): `py-14 sm:py-20 md:py-28` → `py-8 sm:py-12 md:py-16`
- **7-Stage Curriculum** (line 161): `py-14 sm:py-20 md:py-28` → `py-8 sm:py-12 md:py-16`
- **Anti-Sell Sanctuary** (line 218): `py-14 sm:py-20 md:py-28` → `py-8 sm:py-12 md:py-16`

Also reduce the gap between the Core Equation container and the Zero Rule `nx-card`:
- **Core Equation card top margin** (line 133): `mt-8` → `mt-4`

### 2. Apply form padding refactor (`src/routes/apply.tsx`)
Compact the multi-step wizard:

- **Form card padding** (line 251): add `p-5 sm:p-6` to the `nx-card` wrapper.
- **Module field spacing** (line 545): change `space-y-6` → `space-y-4` so questionnaire fields inside Modules 1–5 sit closer together.

### Verification
Confirm no horizontal scroll, no clipped text, and the layout remains crisp at 320px, 375px, and desktop viewports.