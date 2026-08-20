-- =============================================================================
-- FIX: Foundation Kit product copy no longer describes what actually ships.
--
-- The row still carried the original 2026-06-17 seed text — written when the kit
-- was an R699 ZIP of six PDFs:
--
--   description       "…in one download. Six proven frameworks, six workbooks,
--                      six starting points."
--   format            "Digital download — 6 PDF workbooks"
--   long_description  "It is six functional tools…"
--   benefits          the same 6 PDFs, listed one by one
--
-- None of that is true any more. 20260626013917 set download_path = NULL and
-- moved delivery into the workspace. What a buyer actually receives today,
-- verified against the code and the live database, is:
--
--   • the 7-step Clarity System   src/lib/clarity-system.ts  (CLARITY_STEPS)
--   • 11 interactive tools        src/routes/_authenticated/apps.*.tsx — every
--                                 one gated on useKitAccess, counted, not
--                                 estimated
--   • 10 PDF workbooks            AVAILABLE_PDFS in dashboard.foundation-kit.tsx
--   • a 10-video course           modules."Introduction to Personal Branding",
--                                 10 lessons, confirmed live
--   • an AI-written Clarity Plan  buildClarityPlan, synthesised from the answers
--                                 the buyer typed into the tools
--
-- No price appears in the copy. The old text hardcoded "R699 once" and went
-- stale the moment the price moved; price_cents is the only place a price lives.
--
-- Prices, title and tagline are NOT touched here (founder-locked, CLAUDE.md §9).
-- Copy only.
-- =============================================================================

-- Dollar-quoted ($$…$$), NOT E'…' string concatenation. Postgres allows adjacent
-- string literals separated by a newline to concatenate, but only the FIRST may
-- carry the E prefix — repeating E'…' on continuation lines is a syntax error
-- (42601), which is exactly how the first version of this file failed in the SQL
-- editor. Dollar quoting takes real newlines and needs no escaping at all, so
-- apostrophes and embedded double quotes are safe too.
UPDATE public.products
SET
  description = $$You have the expertise. You do not have the system. This is the system — a workspace you log into, not a folder you download. Seven steps, one focused afternoon, and you come out with your niche locked, your content plan built and your five income streams mapped.$$,

  long_description = $$You have the expertise. The system has been missing.

This is not a motivational PDF. You log in and work through seven steps in order. Each step: watch the short video, do the tool, take the one next action. The tools read your answers back to you and tell you what to fix.

By the end you have written down the thing you have been circling for years — what you know, who it is for, what they pay for it, and where the money comes from. Then you hit one button and your answers come back as a written plan you can print.

Start here. The Accelerator builds on what you do here.$$,

  format = $$Online workspace + downloads — 7-step Clarity System, 11 interactive tools, 10 PDF workbooks and a 10-video course. Instant access, works on any device. Yours for good.$$,

  benefits = $$[
    "The 7-Step Clarity System — the 7-Stage Transformation as a guided walkthrough you tick off, not a book you read: MS×TS×SS → SWOT → 4Es → Social Media → Community → DARES → PAIDS",
    "11 interactive tools that score your answers — Knowledge Audit, Niche Clarity, Readiness Scorecard, 4E Content Calendar, Owned vs Rented, SEEDS Pipeline, DARES Asset Model, PAIDS Auditor, 30-Day Consistency Blueprint, 90-Day First Income Planner, Income Tracker",
    "Your Clarity Plan — one button turns everything you typed into a written, printable plan built from your own answers, not a template",
    "Introduction to Personal Branding — a 10-video course, from what a personal brand is to building your first online asset",
    "10 PDF workbooks to keep — every framework as a workbook, plus the framework cards, the 30-day tracker and the one-page cheat sheet",
    "Knowledge Audit — find the product hiding in your expertise in 2 hours. You already have what people need."
  ]$$::jsonb,

  updated_at = now()
WHERE slug = 'called-expert-foundation-kit';


-- The attached course kept the pre-rename "Called Expert" wording in its summary
-- while its parent product was already renamed to "Contentpreneur Foundation Kit".
-- A buyer opening /learn saw both names for the same thing.
UPDATE public.modules
SET summary = $$10 short videos that take you from "what is a personal brand" to building your first online asset — the foundation every Contentpreneur needs before monetising their knowledge.$$
WHERE title = 'Introduction to Personal Branding'
  AND product_id = (SELECT id FROM public.products WHERE slug = 'called-expert-foundation-kit');
