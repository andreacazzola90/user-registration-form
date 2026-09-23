alter table public.forms
  add column if not exists summary_cards jsonb;
