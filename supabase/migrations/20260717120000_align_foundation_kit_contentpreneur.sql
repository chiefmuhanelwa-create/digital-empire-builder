-- Align the entry product record with the Contentpreneur umbrella repositioning.
-- The homepage hero now displays "Contentpreneur Foundation Kit", but the DB
-- record (rendered on /products, the checkout line item, and the order-receipt
-- email) still read "Called Expert Foundation Kit" and narrowed to salaried
-- professionals. Slug is intentionally NOT changed — URLs, product_grants, and
-- LMS access all key off the slug and must stay stable.

UPDATE public.products
SET
  title = 'Contentpreneur Foundation Kit',
  target_audience = 'Contentpreneurs — professionals still employed (Called Experts) and self-employed coaches, consultants, podcasters, and creators (Knowledge Creators) who already have real expertise and want to turn it into income they own.',
  long_description = REPLACE(long_description, 'Called Expert journey', 'Contentpreneur journey')
WHERE slug = 'called-expert-foundation-kit';

-- Keep the buyer-facing audience note on the order-bump aligned too (description
-- field only references the kit by its old name).
UPDATE public.products
SET description = REPLACE(description, 'Called Expert Foundation Kit', 'Contentpreneur Foundation Kit')
WHERE slug = 'called-expert-foundation-kit-bonus'
  AND description LIKE '%Called Expert Foundation Kit%';
