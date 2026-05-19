create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_format_check check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

create or replace function public.set_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_users_updated_at();

alter table public.users enable row level security;

-- Nessuna policy pubblica: la gestione utenti deve avvenire con service role
-- oppure direttamente dal SQL editor/dashboard Supabase.

create or replace function public.verify_user_password(
  p_email text,
  p_password text
)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.users u
    where lower(u.email) = lower(p_email)
      and u.is_active = true
      and u.password_hash = extensions.crypt(p_password, u.password_hash)
  );
$$;

create or replace function public.create_user_with_password(
  p_email text,
  p_password text,
  p_full_name text default null
)
returns public.users
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.users;
begin
  insert into public.users (email, password_hash, full_name)
  values (
    lower(trim(p_email)),
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    p_full_name
  )
  returning * into v_user;

  return v_user;
end;
$$;

create or replace function public.update_user_password(
  p_email text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count integer;
begin
  update public.users
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10))
  where lower(email) = lower(p_email)
    and is_active = true;

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

insert into public.users (email, password_hash, full_name, is_active)
values (
  'andracazzola90@gmail.com',
  extensions.crypt('farfalla24', extensions.gen_salt('bf', 10)),
  'Admin',
  true
)
on conflict (email)
do update
set
  password_hash = excluded.password_hash,
  full_name = excluded.full_name,
  is_active = excluded.is_active,
  updated_at = now();
