alter table public.event_settings
  add column if not exists cookie_banner_enabled boolean not null default false,
  add column if not exists cookie_text text not null default '',
  add column if not exists privacy_text text not null default '';