alter table profiles drop constraint if exists profiles_activity_status_check;
alter table profiles add constraint profiles_activity_status_check
  check (activity_status in ('online', 'offline', 'busy', 'dev'));
