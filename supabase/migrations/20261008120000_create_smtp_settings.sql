create table if not exists public.smtp_settings (
  id smallint primary key default 1 check (id = 1),
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

alter table public.smtp_settings enable row level security;
revoke all on public.smtp_settings from anon, authenticated;
grant all on public.smtp_settings to service_role;