-- ============================================================
-- Multi-form support
-- ============================================================

-- 1. Create forms table
create table if not exists public.forms (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        unique not null,
  title       text        not null,
  description text        not null default '',
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Seed existing form
insert into public.forms (slug, title, description)
values (
  'passeggiata-monte-di-malo',
  'Passeggiata Monte di Malo',
  'Iscrizione pubblica alla passeggiata itinerante con laboratori per bambini.'
)
on conflict (slug) do nothing;

-- 3. registration_fields → add form_id
alter table public.registration_fields
  add column if not exists form_id uuid references public.forms(id) on delete cascade;

update public.registration_fields
  set form_id = (select id from public.forms where slug = 'passeggiata-monte-di-malo')
  where form_id is null;

alter table public.registration_fields
  alter column form_id set not null;

-- Drop old global unique constraint on key, replace with (key, form_id)
alter table public.registration_fields
  drop constraint if exists registration_fields_key_key;

create unique index if not exists registration_fields_key_form_idx
  on public.registration_fields (key, form_id);

-- 4. registrations → add form_id
alter table public.registrations
  add column if not exists form_id uuid references public.forms(id) on delete cascade;

update public.registrations
  set form_id = (select id from public.forms where slug = 'passeggiata-monte-di-malo')
  where form_id is null;

alter table public.registrations
  alter column form_id set not null;

-- Drop old email+day unique index; replace with email+form+day
drop index if exists registrations_email_day_idx;

create unique index if not exists registrations_email_form_day_idx
  on public.registrations (lower(email), form_id, ((created_at at time zone 'UTC')::date));

-- 5. event_settings → add form_id
alter table public.event_settings
  add column if not exists form_id uuid references public.forms(id) on delete cascade;

update public.event_settings
  set form_id = (select id from public.forms where slug = 'passeggiata-monte-di-malo')
  where form_id is null;

alter table public.event_settings
  alter column form_id set not null;

-- 6. RLS for forms
alter table public.forms enable row level security;

drop policy if exists "Public can read active forms" on public.forms;
create policy "Public can read active forms"
  on public.forms for select to anon, authenticated
  using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated can manage forms" on public.forms;
create policy "Authenticated can manage forms"
  on public.forms for all to authenticated
  using (true) with check (true);

-- 7. Updated RPC: create_registration_with_capacity (now accepts p_form_id)
create or replace function public.create_registration_with_capacity(
  p_first_name          text,
  p_last_name           text,
  p_phone               text,
  p_email               text,
  p_country             text,
  p_children_under_3    integer,
  p_children_over_3_labs integer,
  p_adults              integer,
  p_form_id             uuid,
  p_additional_data     jsonb default '{}'::jsonb
)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity          integer;
  v_current_confirmed integer;
  v_status            text;
  v_result            public.registrations;
begin
  if p_children_under_3 < 0 or p_children_over_3_labs < 0 or p_adults < 0 then
    raise exception 'Participant counts cannot be negative';
  end if;

  select lab_capacity into v_capacity
  from public.event_settings
  where form_id = p_form_id
  order by id
  limit 1
  for update;

  select coalesce(sum(children_over_3_labs), 0) into v_current_confirmed
  from public.registrations
  where status = 'confirmed' and form_id = p_form_id;

  if v_current_confirmed + p_children_over_3_labs <= v_capacity then
    v_status := 'confirmed';
  else
    v_status := 'waitlist';
  end if;

  insert into public.registrations (
    first_name, last_name, phone, email, country,
    children_under_3, children_over_3_labs, adults,
    additional_data, form_id, status
  ) values (
    p_first_name, p_last_name, p_phone, p_email, p_country,
    p_children_under_3, p_children_over_3_labs, p_adults,
    p_additional_data, p_form_id, v_status
  )
  returning * into v_result;

  return v_result;
end;
$$;

-- Revoke old signature grant and re-grant with new signature
revoke execute on function public.create_registration_with_capacity(
  text, text, text, text, text, integer, integer, integer, jsonb
) from anon, authenticated;

grant execute on function public.create_registration_with_capacity(
  text, text, text, text, text, integer, integer, integer, uuid, jsonb
) to anon, authenticated;
