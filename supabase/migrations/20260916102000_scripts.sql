-- SCRIPTS — the generator's output, persisted. Applied to production 2026-09-16.
-- Two houses side by side: NOCHILL (FW-147, 90-105s) and JATHO (prohibition,
-- tap path, seamless loop, 23-45s). The evidence does not settle which is
-- better for this account, so the tool builds both and refuses to pretend.

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  piece_id uuid references public.content_pieces(id) on delete set null,
  title text not null,
  style text not null default 'nochill',
  format text not null default 'epiphany',
  pillar text,
  symptom text,
  money_cost text,
  raw_material text,
  hooks jsonb not null default '[]'::jsonb,
  chosen_hook integer,
  screen_text text,
  beats jsonb not null default '[]'::jsonb,
  cta_keyword text,
  closing_question text,
  runtime_target integer,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.scripts.hooks is
  'All three candidates with R/A/C/U/B scores and discard reason. Scoring one hook and listing two is not scoring three.';
comment on column public.scripts.screen_text is
  'Screen = the verdict. Voice = the evidence. Different jobs, not different words.';

create index if not exists scripts_user_idx on public.scripts (user_id, updated_at desc);
create index if not exists scripts_piece_idx on public.scripts (piece_id) where piece_id is not null;

alter table public.scripts enable row level security;
drop policy if exists "scripts_own" on public.scripts;
create policy "scripts_own" on public.scripts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists scripts_touch on public.scripts;
create trigger scripts_touch before update on public.scripts
  for each row execute function public.touch_content_pieces();
