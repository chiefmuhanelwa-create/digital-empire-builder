
CREATE TABLE public.client_stewardship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  follower_count integer NOT NULL,
  engagement_rate integer,
  posts_consistently_4x boolean NOT NULL,
  owns_email_list boolean NOT NULL,
  email_subscribers_count integer NOT NULL DEFAULT 0,
  has_products_for_sale boolean NOT NULL,
  monthly_income_value integer NOT NULL DEFAULT 0,
  income_streams_count integer NOT NULL DEFAULT 1,
  largest_stream_percentage integer NOT NULL DEFAULT 0,
  determined_routing_status text NOT NULL,
  assigned_package_recommendation text NOT NULL,
  vulnerability_phase_tag text NOT NULL,
  raw_answers jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.client_stewardship_applications TO anon;
GRANT INSERT, SELECT ON public.client_stewardship_applications TO authenticated;
GRANT ALL ON public.client_stewardship_applications TO service_role;

ALTER TABLE public.client_stewardship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit applications"
ON public.client_stewardship_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view applications"
ON public.client_stewardship_applications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
