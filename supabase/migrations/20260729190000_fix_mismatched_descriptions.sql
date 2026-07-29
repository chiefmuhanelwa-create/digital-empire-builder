-- =============================================================================
-- Two products' descriptions didn't match their real delivered content —
-- found via a full PDF-vs-description audit, confirmed with the founder:
--
-- 1) african-creator-growth: the real file is "The 90-Day Creator Blueprint"
--    (a generic quarterly-planning system) — not the SA-specific "African
--    Creator Growth System" with a Google Sheets dashboard the old
--    description promised. Founder confirmed the file is correct; renamed
--    the product and rewrote the description to match what's really inside.
--
-- 2) niche-clarity-workbook: the real file is a 7-step Passion → Skills →
--    Niche-Statement framework — not the 3-Axis/ICP-Profiling/POSSESS
--    framework the old description promised. Founder confirmed: rewrite to
--    match the real content (the file itself has a separate page-numbering
--    bug — duplicate/out-of-order page numbers — flagged for the founder to
--    fix at the source, not something fixable from this side).
-- =============================================================================

update public.products set
  title = 'The 90-Day Creator Blueprint',
  tagline = 'A 90-day skeleton for your next quarter — what to do, in what order, and how to know it''s working.',
  description = 'Thirty days proves you can show up. Ninety days proves you can build. This blueprint gives your next quarter a skeleton — phases to work one at a time, a weekly review ritual, and Day 30/60/90 checkpoints — so a planned quarter finally beats a year of posting on vibes.',
  long_description = 'Most creators run on vibes — post when they feel like it, chase whatever''s trending, and wonder three months later why nothing moved. This blueprint replaces vibes with a skeleton: one phase at a time, a 15-minute weekly review every Sunday, and three checkpoints (Day 30, 60, 90) where you measure against a target you wrote down on Day 1 — not a vague hope.',
  benefits = '["Write your Day 1 and your one measurable 90-day target before you start","Work ONE phase at a time — each one builds on the last, finishing beats sampling all three","A 15-minute weekly review ritual (every Sunday) that keeps 90 days from quietly becoming 9","Day 30 / 60 / 90 checkpoints — real checkpoints, not finish lines","Pairs with the 30-Day Consistency Blueprint if daily follow-through is still the weak link"]'::jsonb,
  format = 'PDF access guide + linked Google Drive workbook, instant delivery',
  target_audience = 'Creators who post inconsistently and want one real quarter of planned, measured momentum instead of another month of vibes.',
  updated_at = now()
where slug = 'african-creator-growth';

update public.products set
  long_description = 'A niche isn''t a topic you pick — it''s the lane where what energises you, what you''re actually good at, and what frustrates you when done wrong all point to the same place. This workbook walks that exact path: passion discovery, the skills that actually pay, a specificity challenge that forces a real answer (not "everyone"), and a one-sentence niche statement you validate for real over the next 30 days — not guessed at from a personality quiz.',
  benefits = '["Passion Discovery — what gives you energy, what you''d do for free, what frustrates you when done wrong","Skills That Pay — the results you''ve actually gotten, not what you wish you were good at","A Specificity Challenge (WHO / WHAT / HOW) that kills vague answers like \"everyone\" or \"people\"","A one-sentence niche statement you write and can repeat back in one breath","A real 30-day validation plan — test the niche before you commit years to it"]'::jsonb,
  format = 'Workbook PDF (32 pages), instant download',
  updated_at = now()
where slug = 'niche-clarity-workbook';
