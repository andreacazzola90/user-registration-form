create table if not exists public.event_settings (
  id bigint primary key generated always as identity,
  event_name text not null default 'Passeggiata Monte di Malo',
  lab_capacity integer not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registration_fields (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  field_type text not null check (field_type in ('text', 'email', 'tel', 'number', 'select')),
  required boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  country text not null,
  children_under_3 integer not null default 0,
  children_over_3_labs integer not null default 0,
  adults integer not null default 0,
  additional_data jsonb not null default '{}'::jsonb,
  status text not null check (status in ('confirmed', 'waitlist')),
  created_at timestamptz not null default now()
);

create unique index if not exists registrations_email_day_idx
  on public.registrations (lower(email), ((created_at at time zone 'UTC')::date));

insert into public.event_settings (event_name, lab_capacity)
select 'Passeggiata Monte di Malo', 50
where not exists (select 1 from public.event_settings);

insert into public.registration_fields (key, label, field_type, required, active, sort_order, options)
values
  ('first_name', 'Nome', 'text', true, true, 1, '[]'::jsonb),
  ('last_name', 'Cognome', 'text', true, true, 2, '[]'::jsonb),
  ('phone', 'Telefono', 'tel', true, true, 3, '[]'::jsonb),
  ('email', 'Email', 'email', true, true, 4, '[]'::jsonb),
  ('children_under_3', 'N. Bambini <3 anni', 'number', true, true, 5, '[]'::jsonb),
  ('children_over_3_labs', 'N. Bambini >3 nei laboratori', 'number', true, true, 6, '[]'::jsonb),
  ('adults', 'N. Adulti', 'number', true, true, 7, '[]'::jsonb),
  ('country', 'Paese di provenienza', 'text', true, true, 8, '[]'::jsonb)
on conflict (key) do update
set
  label = excluded.label,
  field_type = excluded.field_type,
  required = excluded.required,
  active = excluded.active,
  sort_order = excluded.sort_order,
  options = excluded.options,
  updated_at = now();

alter table public.event_settings enable row level security;
alter table public.registration_fields enable row level security;
alter table public.registrations enable row level security;

drop policy if exists "Public can read active fields" on public.registration_fields;
create policy "Public can read active fields"
on public.registration_fields
for select
to anon, authenticated
using (active = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated can manage fields" on public.registration_fields;
create policy "Authenticated can manage fields"
on public.registration_fields
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can create registrations" on public.registrations;
create policy "Public can create registrations"
on public.registrations
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated can read registrations" on public.registrations;
create policy "Authenticated can read registrations"
on public.registrations
for select
to authenticated
using (true);

drop policy if exists "Authenticated can read settings" on public.event_settings;
create policy "Authenticated can read settings"
on public.event_settings
for select
to authenticated
using (true);

drop policy if exists "Authenticated can update settings" on public.event_settings;
create policy "Authenticated can update settings"
on public.event_settings
for all
to authenticated
using (true)
with check (true);

create or replace function public.create_registration_with_capacity(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_country text,
  p_children_under_3 integer,
  p_children_over_3_labs integer,
  p_adults integer,
  p_additional_data jsonb default '{}'::jsonb
)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_current_confirmed integer;
  v_status text;
  v_result public.registrations;
begin
  if p_children_under_3 < 0 or p_children_over_3_labs < 0 or p_adults < 0 then
    raise exception 'Participant counts cannot be negative';
  end if;

  select lab_capacity into v_capacity
  from public.event_settings
  order by id
  limit 1
  for update;

  select coalesce(sum(children_over_3_labs), 0) into v_current_confirmed
  from public.registrations
  where status = 'confirmed';

  if v_current_confirmed + p_children_over_3_labs <= v_capacity then
    v_status := 'confirmed';
  else
    v_status := 'waitlist';
  end if;

  insert into public.registrations (
    first_name,
    last_name,
    phone,
    email,
    country,
    children_under_3,
    children_over_3_labs,
    adults,
    additional_data,
    status
  ) values (
    p_first_name,
    p_last_name,
    p_phone,
    p_email,
    p_country,
    p_children_under_3,
    p_children_over_3_labs,
    p_adults,
    p_additional_data,
    v_status
  )
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.create_registration_with_capacity(
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  jsonb
) to anon, authenticated;
