
-- Enums
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('initialized', 'success', 'failed', 'abandoned', 'reversed');

-- orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  customer_name text,
  customer_phone text,
  currency text NOT NULL DEFAULT 'ZAR',
  subtotal_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'paystack',
  provider_reference text UNIQUE,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_email ON public.orders(lower(email));
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage orders"
ON public.orders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Buyers view own orders"
ON public.orders FOR SELECT
USING (
  auth.uid() = user_id
  OR lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- order_items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_title text NOT NULL,
  unit_price_cents integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  line_total_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage order_items"
ON public.order_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Buyers view own order_items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.user_id = auth.uid()
        OR lower(o.email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
      )
  )
);

-- payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'paystack',
  provider_reference text NOT NULL,
  event_type text,
  status payment_status NOT NULL DEFAULT 'initialized',
  amount_cents integer,
  currency text,
  gateway_response text,
  raw_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_ref ON public.payments(provider_reference);
CREATE INDEX idx_payments_order ON public.payments(order_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payments"
ON public.payments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- product_grants
CREATE TABLE public.product_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.subscribers(id) ON DELETE SET NULL,
  user_id uuid,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (product_id, subscriber_id),
  UNIQUE (product_id, user_id)
);
CREATE INDEX idx_grants_user ON public.product_grants(user_id);
CREATE INDEX idx_grants_product ON public.product_grants(product_id);

ALTER TABLE public.product_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage grants"
ON public.product_grants FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own grants"
ON public.product_grants FOR SELECT
USING (auth.uid() = user_id);
