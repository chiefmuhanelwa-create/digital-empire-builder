-- Idea Bank + Resource Library. Applied to production 2026-09-16.

create table if not exists public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea text not null,
  topic text,
  pillar text,
  inspiration_url text,
  source_handle text,
  angle text,
  favourite boolean not null default false,
  used_piece_id uuid references public.content_pieces(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists content_ideas_user_idx on public.content_ideas (user_id, favourite desc, created_at desc);
alter table public.content_ideas enable row level security;
drop policy if exists "content_ideas_own" on public.content_ideas;
create policy "content_ideas_own" on public.content_ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.content_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  evidence text,
  pillar text,
  is_seed boolean not null default false,
  archived boolean not null default false,
  times_used integer not null default 0,
  created_at timestamptz not null default now()
);
comment on column public.content_resources.evidence is
  'The measurement behind the row. A library entry without one is a swipe file.';
create index if not exists content_resources_user_kind_idx on public.content_resources (user_id, kind, archived);
alter table public.content_resources enable row level security;
drop policy if exists "content_resources_own" on public.content_resources;
create policy "content_resources_own" on public.content_resources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
