-- =============================================================================
-- KIT WORKSPACE — cross-device state for the whole Foundation Kit.
--
-- The kit's entire promise is that a buyer's answers carry forward between
-- tools: the sentence they write in the Offer Blueprint becomes the rate-card
-- title, the invoice line item, the Day 7 calendar slot, the email subject.
-- Every one of those answers lived in browser localStorage, so switching from
-- laptop to phone — or clearing site data — silently emptied a paid product.
--
-- Rather than a table per tool (niche_clarity_progress set that precedent and
-- it does not scale to 17 tools), this is ONE row per user holding the whole
-- `nochill-*` key namespace as a blob. The tools keep writing localStorage
-- exactly as they do today; a sync layer mirrors it here. That means zero
-- changes to 17 tool files, and any tool added later is covered for free.
--
-- `state` shape: { "<localStorage key>": <parsed JSON value>, ... }
-- e.g. { "nochill-offer-spine-v1": {...}, "nochill-msts-v1": {...} }
-- =============================================================================

create table if not exists public.kit_workspace (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kit_workspace enable row level security;

-- Writes go through server functions on the service-role client, but the
-- policy is still correct-by-construction: a user may only ever touch their
-- own row. This is the table that holds a buyer's actual work.
drop policy if exists "Users manage own kit workspace" on public.kit_workspace;
create policy "Users manage own kit workspace"
  on public.kit_workspace for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
