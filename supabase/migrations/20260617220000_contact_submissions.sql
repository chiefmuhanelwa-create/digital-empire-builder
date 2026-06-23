-- Contact form submissions — all public contact form entries land here.
-- Service role only; anon users cannot read rows (policy denies all anon access).
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated read — admin access via service role only.
CREATE POLICY "no_public_access" ON public.contact_submissions
  USING (false);
