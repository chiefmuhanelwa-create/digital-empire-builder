-- Recurring "Inner Circle" subscriptions (Paystack Plans). The webhook writes
-- here on each charge / cancel; access is gated on status='active' AND
-- current_period_end > now(). Apply in SQL Editor or via `supabase db push`.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  plan_code text not null,
  subscription_code text,
  customer_code text,
  status text not null default 'active',          -- active | cancelled | past_due
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, plan_code)
);

alter table public.subscriptions enable row level security;
grant all on public.subscriptions to service_role;
create index if not exists idx_subscriptions_email on public.subscriptions(email);

do $$ begin
  create policy "users read own subscriptions"
    on public.subscriptions for select
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Is this email currently entitled to an active subscription? (used to gate access)
create or replace function public.has_active_subscription(_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where lower(email) = lower(_email)
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  );
$$;
