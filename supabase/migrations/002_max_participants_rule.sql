alter table public.event_settings
  add column if not exists max_participants integer not null default 200;

alter table public.event_settings
  drop constraint if exists event_settings_max_participants_check;

alter table public.event_settings
  add constraint event_settings_max_participants_check check (max_participants > 0);
