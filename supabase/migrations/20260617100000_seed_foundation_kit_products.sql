-- =============================================================================
-- SEED: Value ladder products — Foundation Kit, Bonus, Foundations Course
-- All three products that power the main funnel entry.
-- Idempotent: ON CONFLICT (slug) DO NOTHING
-- =============================================================================

-- ─── 1. CALLED EXPERT FOUNDATION KIT (R699 — entry offer) ────────────────────
INSERT INTO public.products (
  slug, title, tagline, description, long_description,
  benefits, garden, price_cents, currency, status,
  format, target_audience, sort_order, is_free, requires_application
)
VALUES (
  'called-expert-foundation-kit',
  'Called Expert Foundation Kit',
  'THE STARTING SYSTEM FOR YOUR KNOWLEDGE BUSINESS',
  'Everything you need to start building your knowledge business — in one download. Six proven frameworks, six workbooks, six starting points. Work through them in your own time, at your own pace. No live sessions. No waiting for a cohort. R699 once. Access forever.',
  'You have the expertise. The system has been missing.

This kit is not a motivational PDF. It is six functional tools — each one mapped to a specific phase of the Called Expert journey. You pick it up, you work through it, and you end with your first income stream mapped and your first content calendar built.

Start here. The Accelerator builds on what you do here.',
  '[
    "PAIDS Framework — map your 5 income streams to your specific expertise: Products, Ads & Affiliates, Information, Deals, Services",
    "DARES Asset Model — blueprint for building income that is Digital, Automated, Recurring, Evergreen, and Scalable",
    "4E Content Calendar — 30 days of content strategy pre-built: Educate, Entertain, Encourage, Earn — in the right ratio",
    "SEEDS Pipeline Template — your first sales funnel mapped out step by step: Signal → Engagement → Education → Decision → Success",
    "Niche Clarity Workbook — lock in the one niche that fits your story, your skills, and your calling in one afternoon",
    "Knowledge Audit — find the product hiding in your expertise in 2 hours. You already have what people need."
  ]'::jsonb,
  'deshe',
  69900, 'ZAR', 'published',
  'Digital download — 6 PDF workbooks (instant access, works on any device)',
  'Called Experts: professionals, teachers, healthcare workers, and specialists ready to monetise their knowledge without quitting their job first.',
  1, false, false
)
ON CONFLICT (slug) DO UPDATE SET
  title               = EXCLUDED.title,
  tagline             = EXCLUDED.tagline,
  description         = EXCLUDED.description,
  long_description    = EXCLUDED.long_description,
  benefits            = EXCLUDED.benefits,
  price_cents         = EXCLUDED.price_cents,
  status              = EXCLUDED.status,
  format              = EXCLUDED.format,
  target_audience     = EXCLUDED.target_audience,
  is_free             = EXCLUDED.is_free,
  requires_application = EXCLUDED.requires_application;


-- ─── 2. FOUNDATION KIT BONUS PACK (R299 — OTO order bump) ────────────────────
INSERT INTO public.products (
  slug, title, tagline, description,
  benefits, garden, price_cents, currency, status,
  format, target_audience, sort_order, is_free, requires_application
)
VALUES (
  'called-expert-foundation-kit-bonus',
  'Called Expert Quick-Start Bonus Pack',
  'THE SHORTCUT TO YOUR FIRST ONLINE INCOME',
  'Three tools that speed up the start — added to your order in one click. One-time offer. Not available at this price anywhere else.',
  '[
    "7-Act Content Script Template — hook-to-CTA scripts for any platform (Instagram, TikTok, YouTube, Facebook). Plug in your story, publish",
    "30-Day Social Media Challenge — one clear action per day to build your audience fast, without burning out or overthinking",
    "Brand Voice Formula — define your unique content voice in one afternoon so every post sounds like you, not a template"
  ]'::jsonb,
  'deshe',
  29900, 'ZAR', 'published',
  'Digital download — 3 PDF tools (instant access)',
  'Called Expert Foundation Kit buyers ready to accelerate their start.',
  2, false, false
)
ON CONFLICT (slug) DO UPDATE SET
  title               = EXCLUDED.title,
  tagline             = EXCLUDED.tagline,
  description         = EXCLUDED.description,
  benefits            = EXCLUDED.benefits,
  price_cents         = EXCLUDED.price_cents,
  status              = EXCLUDED.status,
  format              = EXCLUDED.format,
  target_audience     = EXCLUDED.target_audience,
  is_free             = EXCLUDED.is_free,
  requires_application = EXCLUDED.requires_application;


-- ─── 3. CALLED EXPERT FOUNDATIONS COURSE (R2,997 — mid-tier) ─────────────────
INSERT INTO public.products (
  slug, title, tagline, description, long_description,
  benefits, garden, price_cents, currency, status,
  format, target_audience, sort_order, is_free, requires_application
)
VALUES (
  'called-expert-foundations',
  'Called Expert Foundations Course',
  'THE 4-STAGE SELF-PACED KNOWLEDGE BUSINESS COURSE',
  'The first 4 stages of the full Called Expert system — in a self-paced LMS course you can work through on your schedule. No live sessions. No cohort dates. No waiting. Buy once, access forever.',
  'This course covers the foundation half of the 7-stage Called Expert transformation:

Stage 1: MS×TS×SS — Install the right Mindset, build the core Skillset, wire up your essential Toolset. All three must multiply — any zero gives you zero.

Stage 2: SWOT Analysis — A deep audit of your knowledge business. What you have that the market needs, what is blocking you, and what you are ignoring.

Stage 3: 4E Content Strategy — Build a content system that Educates, Entertains, Encourages, and Earns. The right ratio. The right platforms. The right frequency.

Stage 4: Social Media & Audience Building — The River–Fish–Tank model for owning your audience. How to use social media as distribution, not destination.

The full 7-stage transformation (Stages 5–7: Community, DARES, PAIDS) is unlocked inside the Accelerator PRO cohort.',
  '[
    "Stage 1: Foundation — MS×TS×SS. Mindset × Skillset × Toolset. One zero kills the whole equation.",
    "Stage 2: SWOT Analysis — A full audit of your knowledge business advantage and the gaps blocking your first R10K month.",
    "Stage 3: 4E Content Strategy — Educate 50% · Encourage 25% · Earn 15% · Entertain 10%. The ratio that actually converts.",
    "Stage 4: Social Media & Audience Building — River–Fish–Tank model, Hook Formula (R×A×C×U^B), ManyChat keyword setup.",
    "LMS access — work through recorded modules at your own pace, on any device, any time."
  ]'::jsonb,
  'esev',
  299700, 'ZAR', 'published',
  'LMS course — 4 recorded modules, self-paced (lifetime access)',
  'Called Expert Foundation Kit alumni ready to go deeper before applying for the live cohort.',
  3, false, false
)
ON CONFLICT (slug) DO UPDATE SET
  title               = EXCLUDED.title,
  tagline             = EXCLUDED.tagline,
  description         = EXCLUDED.description,
  long_description    = EXCLUDED.long_description,
  benefits            = EXCLUDED.benefits,
  price_cents         = EXCLUDED.price_cents,
  status              = EXCLUDED.status,
  format              = EXCLUDED.format,
  target_audience     = EXCLUDED.target_audience,
  is_free             = EXCLUDED.is_free,
  requires_application = EXCLUDED.requires_application;


-- ─── 4. Wire Foundation Kit → seeds to Foundations Course ────────────────────
DO $$
DECLARE
  v_kit_id   uuid;
  v_course_id uuid;
BEGIN
  SELECT id INTO v_kit_id    FROM public.products WHERE slug = 'called-expert-foundation-kit'  LIMIT 1;
  SELECT id INTO v_course_id FROM public.products WHERE slug = 'called-expert-foundations'      LIMIT 1;

  IF v_kit_id IS NOT NULL AND v_course_id IS NOT NULL THEN
    UPDATE public.products
    SET seed_to_product_id = v_course_id
    WHERE id = v_kit_id;
  END IF;
END $$;
