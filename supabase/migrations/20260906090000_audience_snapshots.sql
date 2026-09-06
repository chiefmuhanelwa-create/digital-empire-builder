-- Audience snapshots — where the reach actually sits, over time.
--
-- A one-shot "what if the platform ends" calculator serves the episodic
-- behaviour this product exists to correct. Storing a snapshot makes the
-- concentration comparable to last month, which is the only way anyone sees
-- a trend before it becomes an event.
--
-- Owned vs rented is the split that matters: an email list and a phone number
-- survive an account termination; a follower count does not.
--
-- Applied to production 2026-09-06 as `audience_snapshots`.

create table if not exists public.audience_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_on date not null default current_date,
  channels jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

comment on column public.audience_snapshots.channels is
  'Array of { platform, kind: owned|rented, size, monthly_income, reachable }.';

create unique index if not exists audience_snapshots_user_date_idx
  on public.audience_snapshots (user_id, taken_on);
create index if not exists audience_snapshots_user_idx
  on public.audience_snapshots (user_id, taken_on desc);

alter table public.audience_snapshots enable row level security;

drop policy if exists "audience_snapshots_own" on public.audience_snapshots;
create policy "audience_snapshots_own" on public.audience_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
