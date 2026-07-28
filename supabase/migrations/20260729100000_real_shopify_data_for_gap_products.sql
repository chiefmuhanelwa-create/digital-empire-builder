-- =============================================================================
-- Real Shopify copy (pulled directly via the Shopify Admin API, "as is") for
-- every product that had a placeholder description and no file. Also:
--
-- 1) "Creator Starter Bundle" turned out to bundle 3 products CHKPLT ALREADY
--    has real files for (Niche Clarity Workbook + The Influencer's Code +
--    PAIDS Framework Workbook) — packaged into creator-starter-bundle.zip
--    (uploaded to product-files this session) and published for real.
--
-- 2) 4 products (imposter-syndrome-fix, first-brand-deal-script,
--    sars-creator-income, content-creator-starter-system) were LIVE on
--    CHKPLT with a placeholder description and NO file at all — confirmed
--    via the Shopify Admin API (product media + shop file library) that no
--    digital file exists there either, not just missing from our import.
--    Selling these with nothing to deliver is a real risk, so they're set
--    back to draft here (not deleted) with their real descriptions ready to
--    go the moment a real file is sourced and uploaded.
--
-- 3) "Personal Branding Blueprint Course" is a real 9-lesson COURSE (not a
--    single PDF) — needs actual lesson/video production via the LMS
--    modules/lessons system, not a download_path. Description updated;
--    stays draft until that's built.
-- =============================================================================

update public.products set
  long_description = 'Who am I to teach this? That question has cost more African creators more income than any algorithm change, platform ban, or market downturn — it''s the invisible wall between your expertise and your earnings. Imposter syndrome disappears when you stop asking "who am I to teach this?" and start asking "what have I done that somebody else hasn''t?" That''s the shift this workbook and 20-minute audio companion creates — not motivational content, a guided identity reset.',
  benefits = '["The Imposter Syndrome Diagnosis — what specifically triggers yours","The Credential Lie — why your degree (or lack of one) is irrelevant to your authority","Evidence Mining — document what you actually know, the Root-for-ability framework","The Authority Shift — from “who am I?” to “who have I helped?”","Your Permission Statement — written declaration to teach, post and charge","20-minute audio companion — Ndivhuwo''s own voice, the bathroom-floor story told in full"]'::jsonb,
  format = 'Workbook PDF + 20-minute audio companion, instant download',
  target_audience = 'Creators who know their craft but freeze before posting or pitching because they feel unqualified.',
  updated_at = now()
where slug = 'imposter-syndrome-fix';

update public.products set
  long_description = 'The reason you haven''t sent the pitch yet isn''t confidence. It''s clarity. SA Tourism offered R10,000 for 10 deliverables — turning it down was only possible because the real value of the work was already known. Most creators either pitch too low and get underpaid, or don''t pitch at all and earn nothing. This script removes both problems.',
  benefits = '["The 3-Level Pitch Strategy — entry, standard, premium, know which to lead with","The First Brand Deal Email Script — fill-in template, not a blank page","The WhatsApp DM Version for SA brands that prefer informal contact","What to do after they say yes — deliverables, invoicing, sign-off","The Counter-Offer Script — push back without losing the deal","SA rate benchmarks for creators with 10K–200K followers (2026)"]'::jsonb,
  format = 'PDF template, instant download',
  target_audience = 'Creators who have an audience but have never sent a real brand pitch.',
  updated_at = now()
where slug = 'first-brand-deal-script';

update public.products set
  long_description = 'Nobody told me. Not the accountant, not the brand that paid R50,000, not the platform that sent R600,000 over 12 months. Nobody said "you know this is taxable from rand one?" — until SARS sent a bill for R207,879. This guide is the conversation nobody had before that letter arrived.',
  benefits = '["Are you a business or a hobby? — SARS''s real definition, and why it matters from rand one","PAIDS income mapped to tax treatment — what''s taxable, how, and when, per stream","The R500,000 VAT threshold — what happens when you cross it","What you can legitimately deduct — home office, data, equipment, software","Provisional tax explained — creators pay every 6 months, most don''t know this","SARS eFiling guide for creators — step by step, plain language","What to do if you''re already behind — SARS payment plans explained"]'::jsonb,
  format = 'PDF guide, instant download',
  target_audience = 'Creators earning from content who haven''t sorted out their tax position yet.',
  updated_at = now()
where slug = 'sars-creator-income';

update public.products set
  long_description = '"I''ve been posting for 2 years and have nothing to show for it." If that''s you, the problem isn''t effort — it''s running three separate broken systems instead of one working one: no focus in your content, no strategy in your growth, no product to sell. This workbook solves all three, in one place, in 30 days. Not a course. Not a video series. A working system completed on paper and then executed.',
  benefits = '["Part 1: What to Post — 4E Engine, 30-day content plan + 40 prompts","Part 2: Who to Build — SEEDS sequence, email list + WhatsApp broadcast setup","Part 3: How to Earn — PAIDS, first product identified, priced and ready to sell in 14 days","System Review Checklist — confirms you''re running all three correctly"]'::jsonb,
  format = 'Workbook PDF, instant download',
  target_audience = 'Creators who''ve been posting for months or years with nothing to show for it.',
  updated_at = now()
where slug = 'content-creator-starter-system';

-- Creator Starter Bundle: real bundle of 3 existing products, now genuinely
-- deliverable as one packaged download.
update public.products set
  long_description = 'You''ve been posting. You''ve been consistent. But nothing is converting — because you''re missing three things: clarity on your niche, a monetisation system, and the insider knowledge of how brand deals actually work. This bundle gives you all three, built specifically for South African creators. Total value R1,397 — bundled at R499.',
  benefits = '["The Niche Clarity Workbook (R199 value) — a 7-step, 90-minute guided workbook to a documented niche and content pillars","The Influencer''s Code (R299 value) — Ndivhuwo''s full book: inner work, the content game, and the PAIDS + DARES money system","PAIDS Framework Workbook (R899 value) — the complete 5-income-stream implementation guide","All 3 PDFs, instant access after purchase, mobile-friendly"]'::jsonb,
  format = 'Bundle: 3 PDFs, instant download (single .zip)',
  target_audience = 'Creators who want the foundation — niche, book, and monetisation framework — in one purchase.',
  download_path = 'creator-starter-bundle.zip',
  status = 'published',
  show_in_marketplace = true,
  updated_at = now()
where slug = 'creator-starter-bundle';

-- Personal Branding Blueprint Course: a real 9-lesson course, not a single
-- PDF. Description updated; stays draft until the actual lessons are built.
update public.products set
  long_description = 'Built by someone who went from sleeping in university bathrooms in Pretoria to earning R600,000+ from Meta alone, with receipts to prove it. A 9-lesson course teaching the complete "Making Money Flow" system: how your Personal Brand feeds your Community, your Community feeds your Social Media, and your Social Media feeds your PAIDS income streams.',
  benefits = '["What a personal brand actually is — and why revealing yourself pays more than staying anonymous","The 3Cs — Create, Collaborate, Contribute","SWOT Analysis for Creators — build from self-awareness, not assumption","The 3Es Content Formula — Entertain, Educate, Encourage","Community Building — move people from platforms you don''t own into audiences you do","The PAIDS Framework — the 5 revenue streams that build a business, not just a page","DARES — Digital, Automated, Recurring, Evergreen, Scalable online assets"]'::jsonb,
  format = '9-lesson video course (in production)',
  target_audience = 'African creators building attention but not income yet.',
  updated_at = now()
where slug = 'personal-branding-blueprint-course';

-- Real, live products with real Shopify copy but ZERO deliverable anywhere
-- (confirmed via Shopify Admin API — no file in product media or the shop's
-- file library either) — unpublish until a real file is sourced. Not
-- deleted; description above is ready the moment a file lands.
update public.products set status = 'draft', updated_at = now()
where slug in ('imposter-syndrome-fix', 'first-brand-deal-script', 'sars-creator-income', 'content-creator-starter-system');
