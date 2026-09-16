-- THE CORPUS — the estate, as a queryable database.
-- Applied to production 2026-09-16 as `knowledge_corpus`.
--
-- The AI does not generate from its own general knowledge. Every request
-- retrieves from THIS corpus and the model is instructed to use nothing else.
-- Nothing here trains or fine-tunes a model — it is retrieval, which is
-- stronger for this job because training would blur the figures and this
-- product exists to keep them exact.
--
-- Full-text search rather than embeddings, deliberately: embeddings mean a
-- per-query bill to an external API forever, and the spec already flags a
-- recurring keyword-API cost as a launch risk. FTS costs nothing per query.

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  title text not null,
  collection text not null,
  kind text not null default 'doc',
  evidence_tier text,
  bytes integer,
  ingested_at timestamptz not null default now(),
  unique (user_id, path)
);
create index if not exists knowledge_sources_user_idx on public.knowledge_sources (user_id, collection);
alter table public.knowledge_sources enable row level security;
drop policy if exists "knowledge_sources_own" on public.knowledge_sources;
create policy "knowledge_sources_own" on public.knowledge_sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  heading text,
  body text not null,
  ordinal integer not null default 0,
  tags text[] not null default '{}',
  fts tsvector generated always as (
    to_tsvector('english', coalesce(heading, '') || ' ' || body)
  ) stored
);
comment on column public.knowledge_chunks.fts is
  'Generated, not maintained by the app — a search index the code can forget to update is a search index that lies.';
create index if not exists knowledge_chunks_fts_idx on public.knowledge_chunks using gin (fts);
create index if not exists knowledge_chunks_user_idx on public.knowledge_chunks (user_id, source_id);
create index if not exists knowledge_chunks_tags_idx on public.knowledge_chunks using gin (tags);
alter table public.knowledge_chunks enable row level security;
drop policy if exists "knowledge_chunks_own" on public.knowledge_chunks;
create policy "knowledge_chunks_own" on public.knowledge_chunks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.search_knowledge(
  _user_id uuid, _query text, _collections text[] default null, _limit integer default 12
)
returns table (
  chunk_id uuid, source_path text, source_title text, collection text,
  evidence_tier text, heading text, body text, rank real
)
language sql stable security invoker as $$
  select c.id, s.path, s.title, s.collection, s.evidence_tier, c.heading, c.body,
         ts_rank(c.fts, websearch_to_tsquery('english', _query)) as rank
  from public.knowledge_chunks c
  join public.knowledge_sources s on s.id = c.source_id
  where c.user_id = _user_id
    and (_collections is null or s.collection = any(_collections))
    and c.fts @@ websearch_to_tsquery('english', _query)
  order by rank desc
  limit least(coalesce(_limit, 12), 40);
$$;

comment on function public.search_knowledge is
  'Retrieval for grounded generation. Returns the source path with every row so any generated line is traceable to a file.';
