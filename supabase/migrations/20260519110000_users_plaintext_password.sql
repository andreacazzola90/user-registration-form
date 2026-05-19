-- Replace password_hash with plaintext password column
alter table public.users add column if not exists password text;

-- Set password for existing admin user (will be required to be not null)
update public.users set password = 'farfalla24' where email = 'andracazzola90@gmail.com' and password is null;

-- Drop the hashed column
alter table public.users drop column if exists password_hash;

-- Make password not null
alter table public.users alter column password set not null;

-- Replace functions to use plaintext password

create or replace function public.verify_user_password(p_email text, p_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where lower(u.email) = lower(p_email)
      and u.is_active = true
      and u.password = p_password
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
set search_path = public
as $$
declare
  v_user public.users;
begin
  insert into public.users (email, password, full_name)
  values (lower(trim(p_email)), p_password, p_full_name)
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
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.users
  set password = p_new_password
  where lower(email) = lower(p_email)
    and is_active = true;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;
