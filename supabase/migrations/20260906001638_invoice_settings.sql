-- Invoice settings — one row per user.
--
-- Everything on an invoice that does not change from one deal to the next:
-- who you are, how you get paid, and what number the next invoice takes.
-- Entered once so that billing a delivered deal is a two-field job.
--
-- Applied to production 2026-09-06 as `invoice_settings`.

create table if not exists public.invoice_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,

  trading_name text,
  legal_name text,
  registration_number text,
  vat_number text,
  is_vat_registered boolean not null default false,

  address text,
  contact_email text,
  contact_phone text,

  bank_name text,
  account_holder text,
  account_number text,
  branch_code text,
  account_type text,

  payment_terms_days integer not null default 30,
  invoice_prefix text not null default 'INV',
  next_invoice_number integer not null default 1,

  notes text,
  updated_at timestamptz not null default now()
);

-- Default false on purpose. SA VAT registration is compulsory above R1m
-- turnover; charging VAT while unregistered is an offence, so the safe
-- default is off and the user has to say otherwise.
comment on column public.invoice_settings.is_vat_registered is
  'Off by default. Charging VAT without a valid registration is an offence.';
comment on column public.invoice_settings.payment_terms_days is
  'Fallback terms. Agency norm observed in the archive is end-of-month, not net-N.';

alter table public.invoice_settings enable row level security;

drop policy if exists "invoice_settings_own" on public.invoice_settings;
create policy "invoice_settings_own" on public.invoice_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_invoice_settings()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invoice_settings_touch on public.invoice_settings;
create trigger invoice_settings_touch
  before update on public.invoice_settings
  for each row execute function public.touch_invoice_settings();
