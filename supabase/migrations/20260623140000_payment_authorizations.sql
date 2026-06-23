-- Stores the latest reusable Paystack card authorization per buyer, so the
-- post-purchase 1-click upsell can charge the card-on-file (transaction/charge_authorization)
-- without re-entering details. Captured by the webhook on every charge.success.
-- Apply in SQL Editor or via `supabase db push`.

create table if not exists public.payment_authorizations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  authorization_code text not null,
  last4 text,
  card_type text,
  bank text,
  reusable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_authorizations enable row level security;
grant all on public.payment_authorizations to service_role;
