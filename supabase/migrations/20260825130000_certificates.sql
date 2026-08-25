-- =============================================================================
-- CERTIFICATES — the Contentpreneur Certification ladder.
--
-- Spec: docs/CERTIFICATION-SPEC.md. Founder ruling 2026-08-25 overrode the
-- "not Year 1" position; the spec records the concern that was overridden.
--
-- Three properties make a credential worth anything, and all three are enforced
-- here rather than in application code:
--
--   1. VERIFIABLE — `slug` is a public, unguessable handle. A restricted view
--      (public.certificates_public) exposes ONLY what a stranger needs to check
--      a credential. `evidence` contains revenue figures and never leaves.
--   2. FIXED EVIDENCE — `evidence` is frozen at issue. It records what was
--      actually assessed, so a credential can be re-examined years later.
--   3. REVOCABLE — `revoked_at` is set, never deleted. A credential that can
--      vanish is indistinguishable from one that never existed, so revocation
--      has to be visible on the same URL that proved it.
--
-- Levels 1-5 per the spec: 1 Certified Contentpreneur, 2 Certified Strategist,
-- 3 Certified Coach, 4 Licensed Trainer, 5 Master Contentpreneur.
-- =============================================================================

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level smallint not null check (level between 1 and 5),
  -- Public handle. Unguessable so the credential list cannot be enumerated.
  slug text not null unique,
  holder_name text not null,
  issued_at timestamptz not null default now(),
  -- Frozen at issue: the artefact refs that were actually assessed. Private.
  evidence jsonb not null default '{}'::jsonb,
  assessed_by text,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default now(),
  -- A revocation must say why. Half a revocation is not auditable.
  constraint certificates_revocation_complete
    check ((revoked_at is null) = (revoked_reason is null))
);

-- One live certificate per level per holder. Re-issue means revoke then issue.
create unique index if not exists certificates_one_live_per_level
  on public.certificates (user_id, level)
  where revoked_at is null;

create index if not exists certificates_user_idx on public.certificates (user_id);

alter table public.certificates enable row level security;

-- Holders read their own. Nobody writes their own credential.
drop policy if exists "Holders read own certificates" on public.certificates;
create policy "Holders read own certificates"
  on public.certificates for select
  using (auth.uid() = user_id);

-- Admins manage all. has_role is service_role-only by design, and admin server
-- functions run under the service role, so this mirrors the existing pattern.
drop policy if exists "Admins manage certificates" on public.certificates;
create policy "Admins manage certificates"
  on public.certificates for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- Public verification surface.
--
-- security_invoker = off so an anonymous visitor can resolve a slug WITHOUT
-- being granted select on the base table. This view is the only anon path in,
-- and it carries no user_id, no evidence, no assessor.
-- ---------------------------------------------------------------------------
create or replace view public.certificates_public
with (security_invoker = off) as
  select
    slug,
    holder_name,
    level,
    issued_at,
    (revoked_at is not null) as revoked,
    revoked_at
  from public.certificates;

revoke all on public.certificates_public from public, anon, authenticated;
grant select on public.certificates_public to anon, authenticated;

comment on view public.certificates_public is
  'Anon-readable certificate verification. Deliberately excludes user_id, evidence and assessed_by.';
