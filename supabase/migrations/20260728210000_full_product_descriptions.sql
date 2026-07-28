-- =============================================================================
-- Full long_description + benefits + format + target_audience for the 4
-- marketplace products that only had a short tagline. Pulled from real source
-- material (product briefs, the published book's actual text, the PAIDS
-- framework doc) — not invented. See docs/RUNBOOK-CREATORS-HUB-IMPORT.md.
-- =============================================================================

update public.products set
  long_description = 'The unfiltered playbook from the creator who turned a dropout story into a R600K+/year content business. 14 real chapters: from discovering your actual skill and killing the fear of criticism, to reading platform algorithms, building a personal brand, and the two frameworks that changed everything — PAIDS (5 income streams) and DARES (the asset model that makes income repeat without you). Not theory. Every chapter is built from what actually happened: the R6,000 phone, the FaceTime edit that hit 5.5M views, the meme page that became a business.',
  benefits = '["14 chapters: skills, confidence, fear of criticism, algorithms, content types, personal branding, PAIDS, DARES","The origin story in full — University dropout to R600K+/year, told straight","The PAIDS framework: Products, Ads & Affiliates, Information, Deals, Services","The DARES framework: how to make income Digital, Automated, Recurring, Evergreen, Scalable","Written from lived receipts, not borrowed theory"]'::jsonb,
  format = 'eBook (PDF, instant download)',
  target_audience = 'Aspiring and growing creators who want the real playbook, not a highlight reel.'
where slug = 'influencers-code-ebook';

update public.products set
  long_description = 'You post three times a week for 90 days — that''s 39 pieces of content minimum. Most creators post ten times, don''t grow, and quit. The gap isn''t talent. It''s math, and it''s a system. This workbook gives you the platform decision nobody tells you to make first (stop spreading across 5 platforms — one platform, one strategy, 90 days), a 90-day content map you don''t have to invent from a blank calendar, a 15-minute daily engagement loop, and a growth dashboard to track what''s actually working. Built on South African platform reality — not a US growth course pretending Meta Bonus and TikTok Creator Fund pay the same here as they do there.',
  benefits = '["A 90-day plan broken into 3 phases: Foundation, Momentum, System","The Niche × Platform Matrix — which platform actually grows YOUR content type fastest","A pre-built 90-day content map, not a blank calendar","A 15-minute daily engagement loop protocol","A growth dashboard to track follower count, reach and engagement weekly","Built on SA platform reality — Meta Bonus thresholds, TikTok Creator Fund payouts, load-shedding-proof planning"]'::jsonb,
  format = 'Workbook PDF (24 pages) + Google Sheets Growth Dashboard, instant download',
  target_audience = 'Creators stuck at the same follower count for months who need a system, not another tip.'
where slug = 'african-creator-growth';

update public.products set
  long_description = '"I keep changing my niche" means one of two things: you haven''t committed yet, or the one you committed to was wrong. This isn''t a quiz that tells you your "creator personality type." It''s a framework that maps your real expertise against a real audience with a real problem and a real willingness to pay — the same 3-axis check used to pivot a general South African page into a focused, R600K/year education business.',
  benefits = '["The 3-Axis Niche Check: Knowledge, Audience and Problem — a 9-question scoring worksheet","ICP Profiling deep dive: demographics, psychographics, shadow fears and pains (15-question profile)","POSSESS applied to your niche — Origin + Specialty + Stories as your 3 credibility anchors","Shadow Fear Mapping — what your audience actually lies awake worrying about","A Content Pillar Builder — 12 content pillars pulled straight from your mapped niche","A 90-Day Niche Experiment to test and validate before you commit for good"]'::jsonb,
  format = 'Workbook PDF (30 pages), instant download',
  target_audience = 'Creators who keep switching niches and going back to zero.'
where slug = 'niche-clarity-workbook';

update public.products set
  long_description = 'One income stream is a job with a different boss. When 780,000 followers were lost from a suspended page, income didn''t collapse — because by then, every one of the 5 PAIDS streams was already running. This workbook maps all five for your own business: Products (what you create and own — zero cost per extra sale), Ads & Affiliates (the SA networks that paid out over R800,000 verified — AdMarula, Meta, AdSense), Information (coaching and consulting priced properly, not R500/hour), Deals (brand partnerships and licensing — the rarest stream, the highest single payout), and Services (done-for-you work at your highest margin). One deal falling through should never break your month again.',
  benefits = '["Map all 5 PAIDS streams against your own skills and audience","Real SA affiliate network breakdown — what actually pays and what doesn''t","Pricing logic for Information products, from ebooks to 1:1 coaching","How to structure Deals so brand partnerships become repeatable, not one-off","The activation order — which stream to build first, second, and third","Built from verified real income data, not theoretical benchmarks"]'::jsonb,
  format = 'Workbook PDF, instant download',
  target_audience = 'Creators and professionals with one or two income streams who are one platform change away from zero.'
where slug = 'paids-framework-workbook';
