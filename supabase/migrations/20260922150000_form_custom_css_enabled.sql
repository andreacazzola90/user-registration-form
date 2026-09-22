alter table public.forms
  add column if not exists custom_css_enabled boolean not null default false;

update public.forms
set custom_css_enabled = true
where custom_css <> '';