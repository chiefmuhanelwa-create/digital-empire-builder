-- Offer Builder lead-magnet captures. The server fn inserts here with the
-- service role (RLS bypassed); the table is not read from the client. Insert is
-- non-fatal in app code, so the funnel works before this migration is applied —
-- but apply it so leads are durably stored alongside the generated offer.

create table if not exists public.offer_builder_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  icp text not null check (icp in ('called_expert', 'content_creator')),
  expertise text not null,
  audience text not null,
  transformation text not null,
  proof text,
  experience_level text not null check (experience_level in ('starting', 'traction', 'established')),
  generated_offer jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists offer_builder_leads_email_idx on public.offer_builder_leads (email);
create index if not exists offer_builder_leads_created_at_idx on public.offer_builder_leads (created_at desc);

-- Lock the table down: service role only (no anon/auth access).
alter table public.offer_builder_leads enable row level security;
