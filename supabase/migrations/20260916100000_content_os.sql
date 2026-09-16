-- CONTENT OS — the spine the content tools never had.
-- Applied to production 2026-09-16. Engine: src/lib/content-os.ts
--
-- 33 apps existed. Hook Bank held its state in useState and lost it on tab
-- close; the 4E calendar wrote to localStorage, which never reached the server
-- and was invisible to the owner. Nothing recorded what was posted or what it
-- did — the one-shot-tool failure this product exists to correct, running
-- inside the product itself.

create table if not exists public.content_pieces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  pillar text,
  format text not null default 'reel',
  status text not null default 'idea',
  hook text,
  hook_shape text,
  screen_text text,
  story_ref text,
  receipt_ref text,
  cta_keyword text,
  runtime_seconds integer,
  scheduled_for date,
  posted_at timestamptz,
  platform text,
  permalink text,
  reach integer,
  saves integer,
  comments integer,
  shares integer,
  completion_pct numeric(5,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.content_pieces.hook_shape is
  'Lets the engine compare the user OWN results against the published defaults, rather than asserting them.';
comment on column public.content_pieces.receipt_ref is
  'A piece with a confession and no receipt is a diary; with a receipt and no confession, a brag.';

create index if not exists content_pieces_user_status_idx on public.content_pieces (user_id, status);
create index if not exists content_pieces_user_posted_idx on public.content_pieces (user_id, posted_at desc nulls last);
create index if not exists content_pieces_user_scheduled_idx on public.content_pieces (user_id, scheduled_for) where scheduled_for is not null;

alter table public.content_pieces enable row level security;
drop policy if exists "content_pieces_own" on public.content_pieces;
create policy "content_pieces_own" on public.content_pieces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_content_pieces()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_pieces_touch on public.content_pieces;
create trigger content_pieces_touch before update on public.content_pieces
  for each row execute function public.touch_content_pieces();

create table if not exists public.content_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pillars jsonb not null default '[]'::jsonb,
  wired_keywords jsonb not null default '[]'::jsonb,
  weekly_target integer not null default 4,
  runtime_low integer not null default 90,
  runtime_high integer not null default 105,
  updated_at timestamptz not null default now()
);

comment on column public.content_settings.wired_keywords is
  'A CTA keyword with no destination converts nothing and loses the comment. The engine blocks on this.';

alter table public.content_settings enable row level security;
drop policy if exists "content_settings_own" on public.content_settings;
create policy "content_settings_own" on public.content_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists content_settings_touch on public.content_settings;
create trigger content_settings_touch before update on public.content_settings
  for each row execute function public.touch_content_pieces();
