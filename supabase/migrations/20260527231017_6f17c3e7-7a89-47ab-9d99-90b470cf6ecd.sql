-- Module 1: Immutable audit ledger
CREATE TABLE public.audit_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  provider_reference text,
  gross_cents integer NOT NULL,
  vat_allocation_cents integer NOT NULL,
  tax_reserve_cents integer NOT NULL,
  net_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  customer_email_hash text NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_ledgers TO authenticated;
GRANT SELECT, INSERT ON public.audit_ledgers TO service_role;
REVOKE UPDATE, DELETE ON public.audit_ledgers FROM PUBLIC;
REVOKE UPDATE, DELETE ON public.audit_ledgers FROM authenticated;
REVOKE UPDATE, DELETE ON public.audit_ledgers FROM service_role;

ALTER TABLE public.audit_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit ledger"
  ON public.audit_ledgers FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Immutability guardrail trigger
CREATE OR REPLACE FUNCTION public.audit_ledgers_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_ledgers rows are immutable and cannot be % ', TG_OP;
END;
$$;

CREATE TRIGGER audit_ledgers_no_update
  BEFORE UPDATE ON public.audit_ledgers
  FOR EACH ROW EXECUTE FUNCTION public.audit_ledgers_immutable();

CREATE TRIGGER audit_ledgers_no_delete
  BEFORE DELETE ON public.audit_ledgers
  FOR EACH ROW EXECUTE FUNCTION public.audit_ledgers_immutable();

CREATE INDEX idx_audit_ledgers_paid_at ON public.audit_ledgers(paid_at DESC);
CREATE INDEX idx_audit_ledgers_email_hash ON public.audit_ledgers(customer_email_hash);

-- Module 2: Incidents table for in-dashboard error triage
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  endpoint text,
  severity text NOT NULL DEFAULT 'error',
  user_id uuid,
  meta jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view incidents"
  ON public.incidents FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update incidents"
  ON public.incidents FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX idx_incidents_endpoint ON public.incidents(endpoint);