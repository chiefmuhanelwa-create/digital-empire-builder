-- Rebrand ALL product records from "Called Expert" to "Contentpreneur" across
-- every text field. This is what makes admin, the /products catalog, the
-- checkout line item, and the order-receipt email match the site's core promise.
-- Slugs are intentionally NOT touched — URLs, product_grants, LMS access, and the
-- webhook KIT_SLUGS all key off the slug and must stay stable.

UPDATE public.products
SET
  title            = REPLACE(title, 'Called Expert', 'Contentpreneur'),
  tagline          = REPLACE(COALESCE(tagline, ''), 'Called Expert', 'Contentpreneur'),
  description      = REPLACE(COALESCE(description, ''), 'Called Expert', 'Contentpreneur'),
  long_description = REPLACE(COALESCE(long_description, ''), 'Called Expert', 'Contentpreneur'),
  target_audience  = REPLACE(COALESCE(target_audience, ''), 'Called Expert', 'Contentpreneur'),
  benefits         = REPLACE(COALESCE(benefits::text, '[]'), 'Called Expert', 'Contentpreneur')::jsonb
WHERE
  title ILIKE '%Called Expert%'
  OR tagline ILIKE '%Called Expert%'
  OR description ILIKE '%Called Expert%'
  OR long_description ILIKE '%Called Expert%'
  OR target_audience ILIKE '%Called Expert%'
  OR benefits::text ILIKE '%Called Expert%';

-- Broaden the entry kit's audience to the full Contentpreneur promise (both lanes,
-- income-neutral) rather than the salaried-only phrasing the blanket replace leaves.
UPDATE public.products
SET target_audience =
  'Contentpreneurs — professionals still employed and self-employed coaches, consultants, podcasters, and creators who already have real expertise and want to turn it into income they own.'
WHERE slug IN ('called-expert-foundation-kit', 'called-expert-starter-bundle');

-- Also normalise any leftover "Called Expert" inside module / lesson titles that
-- surface in the LMS and admin curriculum builder. (Tables are modules/lessons.)
UPDATE public.modules
SET title = REPLACE(title, 'Called Expert', 'Contentpreneur')
WHERE title ILIKE '%Called Expert%';

UPDATE public.lessons
SET title = REPLACE(title, 'Called Expert', 'Contentpreneur')
WHERE title ILIKE '%Called Expert%';
