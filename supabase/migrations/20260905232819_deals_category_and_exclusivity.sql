-- Conflict checking on the deal record.
--
-- The agency archive shows the same creator working with competing brands in
-- the same category, and exclusivity clauses that are agreed in a brief and
-- then forgotten months later. Neither is visible unless the deal itself
-- carries the category and the exclusivity window.
--
-- Applied to production 2026-09-05 as `deals_category_and_exclusivity`.

alter table public.deals add column if not exists category text;
alter table public.deals add column if not exists exclusive_until date;
alter table public.deals add column if not exists exclusivity_scope text;

comment on column public.deals.category is
  'Product category, used to detect a conflicting deal with a competitor.';
comment on column public.deals.exclusive_until is
  'Date the exclusivity clause in this deal expires. Null means no exclusivity.';
comment on column public.deals.exclusivity_scope is
  'What the exclusivity actually covers — free text, taken from the brief.';

create index if not exists deals_exclusive_until_idx
  on public.deals (user_id, exclusive_until)
  where exclusive_until is not null;
