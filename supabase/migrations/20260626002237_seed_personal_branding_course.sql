-- Seed: "Introduction to Personal Branding" video course (10 Cloudflare Stream lessons)
-- Attached to the $97 Foundation Kit product so kit buyers (product_grant) unlock it in /learn.
-- Idempotent: skips if the module already exists. Data-only seed (no schema change).
-- Stream embeds are public (requireSignedURLs:false) → no token needed at runtime.

DO $$
DECLARE
  v_product uuid;
  v_module  uuid;
  v_base    text := 'https://customer-esnxfwirm3atddsc.cloudflarestream.com/';
BEGIN
  SELECT id INTO v_product FROM products WHERE slug = 'called-expert-foundation-kit';
  IF v_product IS NULL THEN
    RAISE NOTICE 'Foundation Kit product not found — skipping course seed.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM lms_modules
    WHERE product_id = v_product AND title = 'Introduction to Personal Branding'
  ) THEN
    RAISE NOTICE 'Personal Branding module already exists — skipping.';
    RETURN;
  END IF;

  INSERT INTO lms_modules (product_id, title, summary, sort_order)
  VALUES (
    v_product,
    'Introduction to Personal Branding',
    '10 short videos that take you from "what is a personal brand" to building your first online asset — the foundation every Called Expert needs before monetising their knowledge.',
    0
  )
  RETURNING id INTO v_module;

  INSERT INTO lms_lessons (module_id, slug, title, video_url, duration_minutes, is_preview, sort_order) VALUES
    (v_module, 'introduction',             'Introduction',                              v_base || '3b8fc0dd8c371b6288d63774ab5c1cda/iframe', 2,  true,  0),
    (v_module, 'what-is-a-personal-brand', '1. What Is a Personal Brand',               v_base || 'ca330ea012d14097fc9cb8ab1697d9de/iframe', 2,  false, 1),
    (v_module, 'blueprint-to-build',       '2. A Blueprint to Build a Personal Brand',  v_base || '4d90f9660f247ed6ed3cc599ef3d4734/iframe', 3,  false, 2),
    (v_module, 'the-3cs-framework',        '3. The 3Cs Framework',                      v_base || '3950690229221fa11723fb58f1b17323/iframe', 5,  false, 3),
    (v_module, '3es-content-idea-formula', 'The 3Es Content Idea Formula',              v_base || 'be7c0cacf69a45f3ce0f009d8727d9db/iframe', 8,  false, 4),
    (v_module, 'swot-analysis',            '4. SWOT Analysis',                          v_base || 'a3bac11978760d450455c11ff87b0f4c/iframe', 10, false, 5),
    (v_module, 'understand-social-media',  '5. Understand Social Media Platforms',      v_base || '52defacab8f34d65dda448db03184065/iframe', 7,  false, 6),
    (v_module, 'community-building',       '6. Community Building',                      v_base || '564d616cc63e8b0c830e1cb80fd4d4b3/iframe', 5,  false, 7),
    (v_module, 'paids-framework',          '7. PAIDS Framework',                        v_base || '5f33ab865a811446ca8a5368fdd4449c/iframe', 5,  false, 8),
    (v_module, 'formula-online-asset',     '9. Formula to Create an Online Asset',      v_base || 'bbe9a96b6c9d5169321e1612df7c6489/iframe', 4,  false, 9);

  RAISE NOTICE 'Seeded Personal Branding course (module % with 10 lessons).', v_module;
END $$;
