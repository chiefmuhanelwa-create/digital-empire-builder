-- =============================================================================
-- LEAK AUDITS — the Foundation Kit's flagship tool, and the one whose data a
-- buyer will come back to.
--
-- Everything else in the kit is a worksheet: useful once, then finished. This
-- one is a running record. A Knowledge Entrepreneur's most expensive problem is
-- not that they undercharge — it is that they give the work away entirely, at
-- volume, without ever counting it. The number only becomes undeniable when it
-- accumulates, which means it has to persist properly rather than living in a
-- localStorage blob alongside seven quiz answers.
--
-- Two rows of state per user:
--   • `basis`  — how their charge-out rate is derived, set once
--   • `items`  — the log of what they have given away
-- Both jsonb, because the shape is a small fixed form rather than something
-- anyone will ever query across users.
-- =============================================================================

create table if not exists public.leak_audits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  basis jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  -- Denormalised so the admin ledger and any future "your leak this quarter"
  -- email can read the headline without parsing the whole log.
  annual_value_cents bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.leak_audits enable row level security;

drop policy if exists "Users manage own leak audit" on public.leak_audits;
create policy "Users manage own leak audit"
  on public.leak_audits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
