-- Add tax_reserve_cents as a computed column on orders.
-- SARS compliance: 25% of every payment is reserved.
-- Stored generated column so it is always consistent with total_cents
-- and queryable without joining audit_ledgers.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tax_reserve_cents INTEGER
    GENERATED ALWAYS AS (ROUND(total_cents * 0.25::numeric)::integer) STORED;
