-- =============================================================================
-- OPEN THE FOUNDATION KIT COURSE, AND GIVE EVERY LESSON WORDS.
--
-- Two defects, one migration.
--
-- 1. DRIP. `modules.unlock_week` gates lessons behind a cohort clock. That is an
--    ACCELERATOR mechanic — a 12-week programme where pacing is the product —
--    and it leaked into a $97 self-paced kit. A buyer who paid on Tuesday could
--    open the sales page promising "a 10-video course", buy it, and find most of
--    it locked. Everything unlocks at week 1 for this product.
--
-- 2. NO TEXT. All ten lessons are video-only: `body_md` is null on every row.
--    If the Cloudflare Stream player fails, or someone is on a train, or they
--    simply prefer reading, the lesson says nothing at all. Each now carries a
--    paragraph that stands on its own and states the one idea.
-- =============================================================================

update public.modules
set unlock_week = 1
where product_id = (select id from public.products where slug = 'called-expert-foundation-kit');

update public.lessons l
set body_md = v.body
from (values
  ('pb-introduction',
   'Start here. This course is short on purpose — about fifty minutes — because it is not the product. The tools are. Watch a lesson, then go and do the step it belongs to. Nobody has ever built a business by finishing a playlist.'),
  ('pb-what-is-a-personal-brand',
   'A personal brand is not a logo, a colour or a bio. It is the sentence other people use to describe you when you are not in the room. You cannot control whether they say something — only whether it is the right thing. That is why the sentence comes before the content.'),
  ('pb-blueprint-to-build',
   'Most people start with the platform and work backwards to a reason. That is why they stall in month two. The order that survives is: what you know, who it is for, what changes for them, then where to say it. Platforms are last because they are the easiest thing to change.'),
  ('pb-the-3cs-framework',
   'Create, Collaborate, Contribute. Creating alone is the slowest route there is — it puts the entire weight of growth on how often you post. Collaborating borrows an audience that already trusts someone else; contributing earns you a place in a room you did not build.'),
  ('pb-3es-content-idea-formula',
   'Educate, Entertain, Encourage — and then Earn. The ratio matters more than any single post: roughly 35, 30, 20, 15. Most experts over-educate and never earn, then conclude that content does not work for them. It worked. They just never asked.'),
  ('pb-swot-analysis',
   'Run it on yourself honestly, once. The useful half is not strengths — it is the list of things people already come to you for without paying. That list is where your first product is hiding, and it is usually the thing you find too obvious to charge for.'),
  ('pb-understand-social-media',
   'Every platform rewards a different behaviour, and fighting that is expensive. Pick one where your buyer already is, one where your work can be found later, and stop there. Three is the ceiling for someone with a full-time job, and two is usually smarter.'),
  ('pb-community-building',
   'An audience watches. A community talks back. The difference is worth money because a community tells you what to build next, and it survives a platform that decides it no longer likes you. Ten people who reply beat a thousand who scroll.'),
  ('pb-paids-framework',
   'Products, Ads and affiliates, Information, Deals, Services. One income stream is a job with extra steps — one decision by one company can take it to zero. The point is not five streams at once. It is knowing which second one is closest to what you already have.'),
  ('pb-formula-online-asset',
   'An asset keeps producing after you stop touching it. That is the whole test, and most of what people call passive income fails it. If you deliver it by hand every time, you have bought yourself a role, not built an asset.')
) as v(slug, body)
where l.slug = v.slug
  and l.body_md is null;
