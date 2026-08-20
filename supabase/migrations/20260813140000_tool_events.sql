-- =============================================================================
-- First-party funnel tracking for the Tools Hub.
--
-- Founder's ask: "how many people visited the page and how many calculated
-- their rates". Neither was answerable — `track.ts` only wraps FB Pixel and GA
-- (and there is no Pixel running), `tool_submissions` is only written by the
-- hook generator, and nothing anywhere recorded a page view. This table is the
-- missing half: one row per funnel step, per tool.
--
-- Deliberately NOT another bespoke table per tool — same judgment as
-- tool_submissions. `tool_slug` + `event` carries the shape.
--
-- `session_id` is an anonymous client-generated UUID kept in sessionStorage.
-- It exists only so "visits" can be de-duplicated into "visitors"; it is not
-- linked to a person and is not stable across sessions or devices. No IP, no
-- fingerprint, no third party — this data never leaves Supabase.
-- =============================================================================

create table if not exists public.tool_events (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  -- 'view'      — the tool page was opened
  -- 'start'     — the user actually engaged (first input touched)
  -- 'complete'  — the tool produced its result (rate calculated, kit built…)
  -- 'lead'      — the user handed over an email to receive the result
  event text not null check (event in ('view', 'start', 'complete', 'lead')),
  session_id text,
  email text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tool_events_slug_created_idx
  on public.tool_events (tool_slug, created_at desc);
create index if not exists tool_events_event_idx
  on public.tool_events (event, created_at desc);
-- Unique-visitor counts group by session within a tool.
create index if not exists tool_events_session_idx
  on public.tool_events (tool_slug, session_id)
  where session_id is not null;

alter table public.tool_events enable row level security;

-- Writes come from the public tool-event endpoint via the service-role client,
-- which bypasses RLS — so no anon insert policy (an anon insert policy would
-- let anyone forge arbitrary funnel numbers straight into the dashboard).
create policy "Admins can read tool events"
  on public.tool_events for select
  using (has_role(auth.uid(), 'admin'));

-- ── Dashboard aggregate ─────────────────────────────────────────────────────
-- One row per tool per event with both raw and de-duplicated counts, so the
-- admin page is a single round trip instead of a query per tool per metric.
create or replace function public.tool_funnel(since_days int default 30)
returns table (
  tool_slug text,
  event text,
  total bigint,
  unique_sessions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.tool_slug,
    e.event,
    count(*) as total,
    count(distinct e.session_id) as unique_sessions
  from public.tool_events e
  where e.created_at >= now() - make_interval(days => since_days)
    and has_role(auth.uid(), 'admin')   -- security definer: gate inside the function
  group by e.tool_slug, e.event
  order by e.tool_slug, e.event;
$$;

revoke all on function public.tool_funnel(int) from public;
grant execute on function public.tool_funnel(int) to authenticated;
