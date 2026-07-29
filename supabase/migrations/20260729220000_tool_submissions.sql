-- =============================================================================
-- Generic cross-tool data-capture table — the founder's explicit ask when
-- building out the Tools Hub: "collect enough data based on the inputs from
-- the users" across every tool, without inventing a bespoke table per tool
-- (same judgment call already made for niche_clarity_progress). One row per
-- real tool submission/generation; tool_slug identifies which tool, payload
-- holds whatever that tool's own input/output shape is.
-- =============================================================================

create table if not exists public.tool_submissions (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  email text,
  user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tool_submissions_tool_slug_idx on public.tool_submissions (tool_slug, created_at desc);
create index if not exists tool_submissions_email_idx on public.tool_submissions (email) where email is not null;

alter table public.tool_submissions enable row level security;

-- Inserts happen from server functions via the service-role client — no
-- public/anon insert policy needed (server functions bypass RLS via
-- supabaseAdmin). Only admins can read the captured data.
create policy "Admins can read tool submissions"
  on public.tool_submissions for select
  using (has_role(auth.uid(), 'admin'));
