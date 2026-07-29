-- Title/tagline still named the wrong framework ("ICP Profiling + 3-Axis
-- Niche Check") after the long_description/benefits fix in the previous
-- migration — completing the correction so every field matches the real
-- Passion Discovery -> Skills That Pay -> Niche Statement content.
update public.products set
  title = 'The Niche Clarity Workbook — Discover Your Profitable Niche',
  tagline = 'Stop guessing what to post. Find the one niche where your energy, your skills, and a real problem all meet.',
  description = 'Discover your profitable niche in 90 minutes, not 9 months — a real workbook, not a "creator personality quiz."',
  updated_at = now()
where slug = 'niche-clarity-workbook';
