-- =============================================================================
-- Income Tracker — ported from the unfinished "contentpreneurs-hub" GitHub repo
-- (real, working Supabase-backed implementation found there, never deployed).
-- Directly replaces the localStorage-only income-log module inside the
-- external Creator Dashboard tool (nochill-creator-dashboard.vercel.app),
-- which had zero server-side persistence — a real data-loss risk on a paying
-- R99/mo subscription product. This is one of the "best 4" tools migrated
-- natively into CHKPLT, gated behind Foundation Kit / Accelerator ownership
-- (useKitAccess) since it's part of the core-offer curriculum, not a public
-- freebie.
-- =============================================================================

create table if not exists public.income_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount >= 0),
  description text not null,
  category text not null,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.income_transactions enable row level security;

create policy "Users manage own income transactions"
  on public.income_transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_income_transactions_user_id on public.income_transactions(user_id);
create index if not exists idx_income_transactions_date on public.income_transactions(date desc);
create index if not exists idx_income_transactions_type on public.income_transactions(type);
