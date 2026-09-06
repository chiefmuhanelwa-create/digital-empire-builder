-- =============================================================================
-- Deal Tracker + Receivables Chase — pipeline Stage 9.
--
-- No deal or CRM tracker exists anywhere in this estate: not in CHKPLT, not in
-- full-content-system, not in the product-lab web-tools. The rate card tells a
-- creator what to charge and the invoice generator bills it, but nothing has
-- ever tracked the gap between those two — which is exactly where the money
-- leaks. `seeds_pipeline` is a lead/offer pipeline, not this.
--
-- Two jobs, deliberately in one table:
--
--   1. RECEIVABLES CHASE (The-Receivables-Chase-Cadence, FW-034). C-0412 is E1:
--      five documented payment chases across two networks and an agency in 18
--      months, and ONE of them uncovered a failed payment batch that would not
--      otherwise have surfaced. The invoice is the start of the collection,
--      not the end (ST-050).
--
--   2. PROOF VAULT FEED. Every `paid` row is a receipted rate for a named
--      deliverable. In aggregate, anonymised and banded, those rows become the
--      SA rate benchmarks — contributed by users rather than extracted from
--      NDA'd contracts. That is the moat and the compliance fix in one table.
--
-- The due_date is the point. It is a calendar the creator does not control,
-- which is what makes this recurring (gate question 6) instead of another
-- one-shot tool.
-- =============================================================================

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- who and what
  counterparty text not null,
  counterparty_type text not null default 'brand'
    check (counterparty_type in ('brand', 'agency', 'client', 'platform', 'affiliate-network', 'individual')),
  deliverable text not null,
  platform text,

  -- the money
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'ZAR' check (currency in ('ZAR', 'USD')),

  -- where it is
  status text not null default 'lead'
    check (status in ('lead', 'quoted', 'accepted', 'delivered', 'invoiced', 'paid', 'written_off')),

  -- the dates that drive the chase
  quoted_at date,
  accepted_at date,
  delivered_at date,
  invoiced_at date,
  due_date date,
  paid_at date,

  invoice_number text,

  -- the chase record. chase_count is the teachable number: C-0412 shows five
  -- chases in 18 months, one of which found a failed payment batch.
  chase_count integer not null default 0 check (chase_count >= 0),
  last_chased_at date,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.deals is
  'Brand-deal pipeline with receivables chase. Every paid row is a receipted rate that feeds the rate benchmarks.';
comment on column public.deals.due_date is
  'The whole point of the table. A deadline the creator does not set, which is what makes the tool recurring.';
comment on column public.deals.chase_count is
  'How many times payment was chased. C-0412: five chases in 18 months, one uncovered a failed payment batch.';

alter table public.deals enable row level security;

create policy "Users manage own deals"
  on public.deals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_deals_user_id on public.deals(user_id);
create index if not exists idx_deals_status on public.deals(status);
create index if not exists idx_deals_due_date on public.deals(due_date);
create index if not exists idx_deals_paid_at on public.deals(paid_at desc);

-- Keep updated_at honest. Every other table here relies on the app to set it;
-- this one is queried by "what has gone stale", so it cannot be optional.
create or replace function public.deals_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists deals_touch_updated_at on public.deals;
create trigger deals_touch_updated_at
  before update on public.deals
  for each row execute function public.deals_touch_updated_at();
