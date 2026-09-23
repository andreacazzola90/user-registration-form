alter table public.forms
  add column if not exists table_display_settings jsonb;
