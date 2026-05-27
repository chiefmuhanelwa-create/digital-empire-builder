-- 1. Seed legacy import tag
INSERT INTO public.tags (slug, name, description)
VALUES ('legacy_prelaunch_may_2026', 'Legacy List – Pre-Launch May 2026', 'Contacts imported from CSV before the May 2026 launch')
ON CONFLICT (slug) DO NOTHING;

-- 2. Fast case-insensitive email lookup on subscribers
CREATE INDEX IF NOT EXISTS idx_subscribers_email_lower ON public.subscribers (lower(email));

-- 3. Storage RLS — only authenticated users with an active product_grant can SELECT objects in product-files
DROP POLICY IF EXISTS "Download only with active product grant" ON storage.objects;
CREATE POLICY "Download only with active product grant"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'product-files'
  AND EXISTS (
    SELECT 1
    FROM public.product_grants pg
    JOIN public.products p ON p.id = pg.product_id
    WHERE pg.user_id = auth.uid()
      AND pg.revoked_at IS NULL
      AND p.download_path = storage.objects.name
  )
);