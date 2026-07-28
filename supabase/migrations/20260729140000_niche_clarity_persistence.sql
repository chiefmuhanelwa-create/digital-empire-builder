-- =============================================================================
-- Niche Clarity Builder was localStorage-only — cleared browser data, lost
-- your niche statement. One row per user, upserted on every save (this tool
-- is a single 4-field form, not a transaction log, so a JSON blob per user
-- is the right shape — unlike income_transactions, which needed real rows).
-- =============================================================================

create table if not exists public.niche_clarity_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fields jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.niche_clarity_progress enable row level security;

create policy "Users manage own niche clarity progress"
  on public.niche_clarity_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
