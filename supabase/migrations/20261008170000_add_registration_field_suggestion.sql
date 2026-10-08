alter table public.registration_fields
  add column if not exists suggestion text not null default '';