alter table public.registration_fields
  drop constraint if exists registration_fields_field_type_check;

alter table public.registration_fields
  add constraint registration_fields_field_type_check
  check (field_type in ('text', 'email', 'tel', 'number', 'select', 'tickets'));