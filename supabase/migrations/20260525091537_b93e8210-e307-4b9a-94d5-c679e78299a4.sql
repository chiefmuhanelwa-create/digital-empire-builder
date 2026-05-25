
-- Garden enum
do $$ begin
  create type public.product_garden as enum ('deshe', 'esev', 'etz_pri', 'devarim');
exception when duplicate_object then null; end $$;

-- Extend products
alter table public.products
  add column if not exists garden public.product_garden,
  add column if not exists seed_to_product_id uuid references public.products(id) on delete set null,
  add column if not exists scripture_root text,
  add column if not exists format text,
  add column if not exists target_audience text,
  add column if not exists is_free boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists cohort_capacity integer,
  add column if not exists requires_application boolean not null default false;

-- Constraint: free => zero price
alter table public.products drop constraint if exists products_free_price_check;
alter table public.products
  add constraint products_free_price_check
  check ((is_free = false) or (is_free = true and price_cents = 0));

-- Indexes
create index if not exists products_garden_sort_idx on public.products (garden, sort_order, price_cents);
create index if not exists products_seed_idx on public.products (seed_to_product_id);
