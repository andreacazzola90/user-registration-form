create table if not exists public.form_email_templates (
  form_id uuid primary key references public.forms(id) on delete cascade,
  confirmation_subject text not null,
  confirmation_body text not null,
  waitlist_subject text not null,
  waitlist_body text not null,
  updated_at timestamptz not null default now()
);

alter table public.form_email_templates enable row level security;
revoke all on public.form_email_templates from anon, authenticated;
grant all on public.form_email_templates to service_role;