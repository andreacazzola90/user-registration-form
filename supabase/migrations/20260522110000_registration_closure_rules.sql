alter table public.event_settings
  add column if not exists max_participants integer not null default 200,
  add column if not exists registrations_close_at timestamptz;

alter table public.event_settings
  drop constraint if exists event_settings_max_participants_check;

alter table public.event_settings
  add constraint event_settings_max_participants_check check (max_participants > 0);

create or replace function public.create_registration_with_capacity(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_country text,
  p_children_under_3 integer,
  p_children_over_3_labs integer,
  p_adults integer,
  p_form_id uuid,
  p_additional_data jsonb default '{}'::jsonb
)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_max_participants integer;
  v_close_at timestamptz;
  v_current_confirmed integer;
  v_total_registrations integer;
  v_status text;
  v_result public.registrations;
begin
  if p_children_under_3 < 0 or p_children_over_3_labs < 0 or p_adults < 0 then
    raise exception 'Participant counts cannot be negative';
  end if;

  select
    lab_capacity,
    max_participants,
    registrations_close_at
  into
    v_capacity,
    v_max_participants,
    v_close_at
  from public.event_settings
  where form_id = p_form_id
  order by id
  limit 1
  for update;

  v_capacity := coalesce(v_capacity, 50);
  v_max_participants := coalesce(v_max_participants, 200);

  select count(*) into v_total_registrations
  from public.registrations
  where form_id = p_form_id;

  if v_total_registrations >= v_max_participants then
    raise exception 'REGISTRATIONS_CLOSED';
  end if;

  if v_close_at is not null and now() >= v_close_at then
    raise exception 'REGISTRATIONS_CLOSED';
  end if;

  select coalesce(sum(children_over_3_labs), 0) into v_current_confirmed
  from public.registrations
  where status = 'confirmed' and form_id = p_form_id;

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
    form_id,
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
    p_form_id,
    v_status
  )
  returning * into v_result;

  return v_result;
end;
$$;
