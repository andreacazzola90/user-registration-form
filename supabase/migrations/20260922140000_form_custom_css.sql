alter table public.forms
  add column if not exists custom_css text not null default '';