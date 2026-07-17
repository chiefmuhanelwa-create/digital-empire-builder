-- =============================================================================
-- RESTRUCTURE CURRICULUM: Covenant Engine — 5-Book Torah Arc / 12-Week Compression
-- -----------------------------------------------------------------------------
-- Adopts the new canonical structure (see docs/COVENANT-ENGINE.md §2 and the
-- rewritten docs/CURRICULUM.md): Genesis → Exodus → Leviticus → Numbers →
-- Deuteronomy, mapped onto the existing 7 stages, compressed from 20 weeks to
-- 12 weeks. DARES (old Stage 6) now precedes the River-Fish-Tank/Community
-- stage (old Stage 5) — Numbers pt.2 → Deuteronomy pt.1 — because you wire the
-- automated systems before you deploy them to convert an owned tribe.
--
-- Requires 20260615120000_seed_curriculum.sql to have run first (7 modules,
-- 30 lessons already in place). This migration re-titles modules, reorders/
-- reassigns lessons between modules, and inserts 2 new lessons the blueprint
-- introduces (the 4Ps niche framework, and platform selection / "Canaan").
-- Idempotent: safe to re-run.
-- =============================================================================

DO $$
DECLARE
  v_product_id uuid;
  v_m1 uuid; v_m2 uuid; v_m3 uuid; v_m4 uuid; v_m5_community uuid; v_m6_dares uuid; v_m7 uuid;
BEGIN
  SELECT id INTO v_product_id FROM public.products
  WHERE slug = 'contentpreneur-90day-cohort' LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Product contentpreneur-90day-cohort not found — run product seed first.';
  END IF;

  SELECT id INTO v_m1 FROM public.modules WHERE product_id = v_product_id AND sort_order = 1;
  SELECT id INTO v_m2 FROM public.modules WHERE product_id = v_product_id AND sort_order = 2;
  SELECT id INTO v_m3 FROM public.modules WHERE product_id = v_product_id AND sort_order = 3;
  SELECT id INTO v_m4 FROM public.modules WHERE product_id = v_product_id AND sort_order = 4;
  SELECT id INTO v_m5_community FROM public.modules WHERE product_id = v_product_id AND sort_order = 5;
  SELECT id INTO v_m6_dares FROM public.modules WHERE product_id = v_product_id AND sort_order = 6;
  SELECT id INTO v_m7 FROM public.modules WHERE product_id = v_product_id AND sort_order = 7;

  IF v_m1 IS NULL OR v_m2 IS NULL OR v_m3 IS NULL OR v_m4 IS NULL
     OR v_m5_community IS NULL OR v_m6_dares IS NULL OR v_m7 IS NULL THEN
    RAISE EXCEPTION 'Expected 7 modules from base curriculum seed — run 20260615120000_seed_curriculum.sql first.';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 1. Retitle all 7 modules with Torah-arc labels + the new 12-week timeline.
  --    Sort order 1–3 and 7 stay put; DARES (was 6) and Community (was 5) swap
  --    to sort_order 5 and 6 respectively, per the new sequencing.
  -- ---------------------------------------------------------------------------
  UPDATE public.modules SET
    title = 'Stage 1: Foundation — MS×TS×SS (Genesis)',
    summary = 'Identity before output; character before content. Right Mindset + Core Skills + Essential Tools installed. Weeks 1–2.'
  WHERE id = v_m1;

  UPDATE public.modules SET
    title = 'Stage 2: Self-Awareness — SWOT & The 4Ps (Exodus)',
    summary = 'Self-knowledge precedes liberation. SWOT audit + the 4Ps (Passion/Pain/Purpose/Profit) niche mapping. Weeks 3–4.'
  WHERE id = v_m2;

  UPDATE public.modules SET
    title = 'Stage 3: Content Strategy — The 4Es Engine (Leviticus)',
    summary = 'Codes for offerings of uncompromised excellence. Educate/Entertain/Encourage/Earn ratios + the 30-day content calendar. Weeks 5–6.'
  WHERE id = v_m3;

  UPDATE public.modules SET
    title = 'Stage 4: Platform Strategy — Choose Your Canaan (Numbers)',
    summary = 'Taking a census, claiming a single dominant territory. One primary platform, fully optimised — plus the content mechanics (hooks, scripting, HSLFCTA) to work it. Week 7.',
    sort_order = 4
  WHERE id = v_m4;

  UPDATE public.modules SET
    title = 'Stage 5: Systems & DARES (Numbers)',
    summary = 'Spy-mission infrastructure. Automated DM sequences + the DARES asset model (Digital/Automated/Recurring/Evergreen/Scalable). Weeks 8–9.',
    sort_order = 5
  WHERE id = v_m6_dares;

  UPDATE public.modules SET
    title = 'Stage 6: Owned Tribes — The River-Fish-Tank Model (Deuteronomy)',
    summary = 'Claiming the permanent inheritance. Deploying River-Fish-Tank + 3Cs community conversion — now that the DARES systems exist to run it. Week 10.',
    sort_order = 6
  WHERE id = v_m5_community;

  UPDATE public.modules SET
    title = 'Stage 7: PAIDS Monetization Engine (Deuteronomy)',
    summary = 'Transferring generational wealth. 5 income streams active so no single stream exceeds 40–50% of total revenue. Weeks 11–12.'
  WHERE id = v_m7;

  -- ---------------------------------------------------------------------------
  -- 2. Module 3 (4Es): renumber after niche-statement moves out to Module 2.
  -- ---------------------------------------------------------------------------
  UPDATE public.lessons SET sort_order = 1 WHERE module_id = v_m3 AND slug = 'content-4e-ratios';
  UPDATE public.lessons SET sort_order = 2 WHERE module_id = v_m3 AND slug = 'content-called-expert-ratio';
  UPDATE public.lessons SET sort_order = 3 WHERE module_id = v_m3 AND slug = 'content-30day-calendar';

  -- ---------------------------------------------------------------------------
  -- 3. Module 2 (SWOT & 4Ps): keep the 2 SWOT lessons, insert the new 4Ps
  --    lesson, then pull the niche-statement lesson in from Module 3 — the
  --    4Ps and the niche statement are the same exercise (map value → name it).
  -- ---------------------------------------------------------------------------
  UPDATE public.lessons SET sort_order = 1 WHERE module_id = v_m2 AND slug = 'swot-called-expert';
  UPDATE public.lessons SET sort_order = 2 WHERE module_id = v_m2 AND slug = 'swot-3-strategic-priorities';

  INSERT INTO public.lessons (module_id, slug, title, summary, body_md, sort_order) VALUES
  (v_m2, 'swot-4ps-framework', 'The 4Ps Framework: Passion, Pain, Purpose, Profit',
    'Map your niche across four axes before you write a single niche statement.',
    E'## The 4Ps Framework\n\n**Exodus 3:10** — *"So now, go. I am sending you..."*\n\nSelf-knowledge precedes liberation. Before you can outline your territory, name it across four axes:\n\n| P | The Question | Called Expert Example |\n|---|--------------|------------------------|\n| **Passion** | What do you do that doesn\'t feel like work? | The finance manager who genuinely loves explaining tax structures to junior colleagues |\n| **Pain** | What problem have you personally solved that others are still stuck in? | Escaping the salary trap while still employed — the parallel assignment |\n| **Purpose** | Who are you assigned to serve — not everyone, someone specific? | Corporate professionals in your exact sector, your exact seniority band |\n| **Profit** | Which of these can someone pay for today, not eventually? | A framework you already use at work that has never been packaged |\n\n**The rule:** A niche sits at the intersection of all four. Passion without Profit is a hobby. Profit without Purpose is a hustle with no loyalty. Pain without Passion burns out fast.\n\n### Your Assignment\nWrite one sentence for each P. Circle where they overlap — that overlap is your niche. Carry it into the next lesson and turn it into your niche statement.',
    3)
  ON CONFLICT (module_id, slug) DO NOTHING;

  UPDATE public.lessons SET sort_order = sort_order - 1 WHERE module_id = v_m3 AND sort_order > 3;
  UPDATE public.lessons SET module_id = v_m2, sort_order = 4 WHERE slug = 'content-niche-statement';

  -- ---------------------------------------------------------------------------
  -- 4. Module 4 (Platform / Numbers pt.1): renumber the 3 content-mechanics
  --    lessons that stay, pull River-Fish-Tank and ManyChat OUT (they move to
  --    Stage 5 and Stage 6 below), then insert the new "Choosing Your Canaan"
  --    lesson as the opening lesson of the stage.
  -- ---------------------------------------------------------------------------
  UPDATE public.lessons SET sort_order = 2 WHERE module_id = v_m4 AND slug = 'audience-hslfcta-formula';
  UPDATE public.lessons SET sort_order = 3 WHERE module_id = v_m4 AND slug = 'audience-racub-hook-formula';
  UPDATE public.lessons SET sort_order = 4 WHERE module_id = v_m4 AND slug = 'audience-4-scripting-principles';

  INSERT INTO public.lessons (module_id, slug, title, summary, body_md, sort_order) VALUES
  (v_m4, 'platform-choosing-your-canaan', 'Choosing Your Canaan: The One-Platform Rule',
    'Halt the mistake of being mediocre on five platforms. Claim one territory and fully optimise it.',
    E'## Choosing Your Canaan\n\n**Numbers 13:2** — *"Send some men to explore the land of Canaan, which I am giving to the Israelites."*\n\nA census counts capacity before a campaign. Before you post anywhere, count your actual capacity — realistically, how many hours a week do you have? Then send your spies: where is your specific audience already gathered?\n\n### The Mistake\nMost Called Experts try to be everywhere — Instagram, TikTok, LinkedIn, YouTube, Facebook — and end up mediocre on all five. Attention split five ways is attention that converts nowhere.\n\n### The Rule\nPick ONE primary platform. Corporate/professional audiences (ICP 1) — usually LinkedIn or Instagram. Fully optimise before you post:\n- Bio formula: who you help + specific outcome + proof line\n- Pinned/featured content: your strongest proof asset first (award, press, before/after)\n- Link in bio: one destination, not a link tree of five choices\n\n### Your Assignment\nName your one platform. Rewrite your bio using the formula above. Commit to a minimum 90-day window before judging results or switching platforms — the algorithm needs consistency to learn your audience, not novelty.\n\n**Stage 4 Checkpoint:**\n- ✅ One primary platform chosen and stated publicly (to yourself, at minimum)\n- ✅ Bio + pinned content optimised using the formula above',
    1)
  ON CONFLICT (module_id, slug) DO NOTHING;

  -- Move River-Fish-Tank into Stage 6 (Deuteronomy pt.1 / Owned Tribes) as its opening lesson
  UPDATE public.lessons SET sort_order = sort_order + 1 WHERE module_id = v_m5_community;
  UPDATE public.lessons SET module_id = v_m5_community, sort_order = 1 WHERE slug = 'audience-river-fish-tank';

  -- Move ManyChat keyword system into Stage 5 (Numbers pt.2 / Systems & DARES) as its opening lesson
  UPDATE public.lessons SET sort_order = sort_order + 1 WHERE module_id = v_m6_dares;
  UPDATE public.lessons SET module_id = v_m6_dares, sort_order = 1 WHERE slug = 'audience-manychat-keywords';

  -- ---------------------------------------------------------------------------
  -- 5. Graduation lesson: correct the timeline reference from Week 20 to
  --    Week 12 now that the programme is compressed.
  -- ---------------------------------------------------------------------------
  UPDATE public.lessons SET
    summary = 'Week 12. The checklist that confirms transformation, not just completion.',
    body_md = replace(body_md, 'By Week 20', 'By Week 12')
  WHERE slug = 'paids-graduation-covenant';

END;
$$;
