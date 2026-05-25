
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Roles
create type public.app_role as enum ('admin','student');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);
create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- Profile auto-create trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated-at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Products (catalog scaffold)
create type public.product_status as enum ('draft','published','archived');
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text,
  description text,
  price_cents integer not null default 0,
  currency text not null default 'NGN',
  cover_image_url text,
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

create policy "Published products are public"
  on public.products for select
  using (status = 'published' or public.has_role(auth.uid(),'admin'));
create policy "Admins can manage products"
  on public.products for all
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Placeholder seed products
insert into public.products (slug, title, tagline, description, price_cents, currency, status) values
('digital-empire-blueprint','Digital Empire Blueprint','The CHKPLT operating system','Placeholder description for the flagship offer.',5000000,'NGN','published'),
('founders-circle','Founders Circle','Inner-circle coaching cohort','Placeholder description for the high-ticket coaching tier.',25000000,'NGN','published'),
('starter-toolkit','Starter Toolkit','Templates, scripts, swipe files','Placeholder description for the entry product.',1500000,'NGN','published');
