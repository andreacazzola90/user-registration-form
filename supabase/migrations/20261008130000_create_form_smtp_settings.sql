create table if not exists public.form_smtp_settings (
  form_id uuid primary key references public.forms(id) on delete cascade,
  host text not null,
  port integer not null check (port between 1 and 65535),
  secure boolean not null default false,
  username text not null,
  password_ciphertext text not null,
  password_iv text not null,
  password_auth_tag text not null,
  from_email text not null,
  from_name text not null,
  updated_at timestamptz not null default now()
);

alter table public.form_smtp_settings enable row level security;
revoke all on public.form_smtp_settings from anon, authenticated;
grant all on public.form_smtp_settings to service_role;

insert into public.form_smtp_settings (
  form_id,
  host,
  port,
  secure,
  username,
  password_ciphertext,
  password_iv,
  password_auth_tag,
  from_email,
  from_name
)
select
  forms.id,
  settings.host,
  settings.port,
  settings.secure,
  settings.username,
  settings.password_ciphertext,
  settings.password_iv,
  settings.password_auth_tag,
  settings.from_email,
  settings.from_name
from public.forms as forms
cross join public.smtp_settings as settings
where settings.id = 1
on conflict (form_id) do nothing;