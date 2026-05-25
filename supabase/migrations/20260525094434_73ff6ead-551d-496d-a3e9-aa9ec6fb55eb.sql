
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_modules_product ON public.modules(product_id, sort_order);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modules: admins manage"
ON public.modules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Modules: public read for published products"
ON public.modules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = modules.product_id AND p.status = 'published'
  )
);

CREATE TRIGGER set_modules_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  body_md text,
  video_url text,
  duration_minutes integer,
  is_preview boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, slug)
);
CREATE INDEX idx_lessons_module ON public.lessons(module_id, sort_order);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons: admins manage"
ON public.lessons FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Metadata is public (so curriculum is browseable). Body/video are gated server-side.
CREATE POLICY "Lessons: public read for published products"
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.products p ON p.id = m.product_id
    WHERE m.id = lessons.module_id AND p.status = 'published'
  )
);

CREATE TRIGGER set_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_position_seconds integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, user_id)
);
CREATE INDEX idx_progress_user ON public.lesson_progress(user_id);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Progress: own rows read"
ON public.lesson_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Progress: own rows insert"
ON public.lesson_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Progress: own rows update"
ON public.lesson_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Progress: admin read"
ON public.lesson_progress FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_progress_updated_at
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
