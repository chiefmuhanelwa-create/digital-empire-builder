-- THE LEDGER — per-user fact-lock. Applied to production 2026-09-16.
--
-- Deliberately BOTH a whitelist and a blacklist. A ledger holding only what is
-- true cannot stop a figure already disproven — and those are the ones that
-- come back, because they are the flattering ones. status='banned' holds the
-- killed figure together with its replacement, so the engine corrects rather
-- than only refusing.

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'money',
  label text not null,
  value_number numeric,
  currency text default 'ZAR',
  value_text text,
  status text not null default 'verified',
  source text,
  occurred_on date,
  counterparty text,
  replacement text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.ledger_entries.status is
  'verified = has a source. unverified = asserted, needs a hedge. banned = disproven, never ships.';
comment on column public.ledger_entries.replacement is
  'For a banned entry: what replaces it. A ban without a replacement gets ignored under deadline.';

create index if not exists ledger_entries_user_idx on public.ledger_entries (user_id, status, kind);
create index if not exists ledger_entries_value_idx on public.ledger_entries (user_id, value_number) where value_number is not null;

alter table public.ledger_entries enable row level security;
drop policy if exists "ledger_entries_own" on public.ledger_entries;
create policy "ledger_entries_own" on public.ledger_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists ledger_entries_touch on public.ledger_entries;
create trigger ledger_entries_touch before update on public.ledger_entries
  for each row execute function public.touch_content_pieces();

-- Source trace, and the record of which figures keep being reached for.
create table if not exists public.ledger_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  script_id uuid references public.scripts(id) on delete cascade,
  claim text not null,
  verdict text not null,
  entry_id uuid references public.ledger_entries(id) on delete set null,
  checked_at timestamptz not null default now()
);
create index if not exists ledger_checks_user_idx on public.ledger_checks (user_id, checked_at desc);
alter table public.ledger_checks enable row level security;
drop policy if exists "ledger_checks_own" on public.ledger_checks;
create policy "ledger_checks_own" on public.ledger_checks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
