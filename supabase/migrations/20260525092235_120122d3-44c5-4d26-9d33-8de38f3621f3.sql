
-- Enums
CREATE TYPE public.subscriber_status AS ENUM ('active', 'unsubscribed', 'bounced', 'complained');

-- subscribers
CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  phone text,
  source text NOT NULL DEFAULT 'manual',
  status subscriber_status NOT NULL DEFAULT 'active',
  unsubscribed_at timestamptz,
  user_id uuid,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscribers_status ON public.subscribers(status);
CREATE INDEX idx_subscribers_source ON public.subscribers(source);
CREATE INDEX idx_subscribers_email_lower ON public.subscribers(lower(email));

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscribers"
ON public.subscribers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- tags
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tags"
ON public.tags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- subscriber_tags join
CREATE TABLE public.subscriber_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  applied_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscriber_id, tag_id)
);
CREATE INDEX idx_subscriber_tags_tag ON public.subscriber_tags(tag_id);
CREATE INDEX idx_subscriber_tags_sub ON public.subscriber_tags(subscriber_id);

ALTER TABLE public.subscriber_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscriber_tags"
ON public.subscriber_tags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed core tags
INSERT INTO public.tags (name, slug, description, color) VALUES
  ('Legacy List', 'legacy_list', 'Imported from NOCHILL email list (John 21:6)', '#722F37'),
  ('Buyer', 'buyer', 'Has made at least one purchase', '#FFD60A'),
  ('Deshe Garden', 'garden_deshe', 'Engaged with Deshe (tender grass) seeds', '#7BC47F'),
  ('Esev Garden', 'garden_esev', 'Engaged with Esev (herb yielding seed)', '#3FA34D'),
  ('Etz Pri Garden', 'garden_etz_pri', 'Engaged with Etz Pri (fruit tree)', '#1B5E20'),
  ('Devarim Garden', 'garden_devarim', 'Engaged with Devarim (words)', '#0D2818')
ON CONFLICT (slug) DO NOTHING;
