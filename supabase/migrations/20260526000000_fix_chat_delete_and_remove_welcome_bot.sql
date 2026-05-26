-- 1. Kill the welcome bot trigger entirely
DROP TRIGGER IF EXISTS on_crew_member_welcome ON public.crew_members;
DROP FUNCTION IF EXISTS public.unit_bot_welcome_member();

-- 2. Soft-delete support for crew chat messages
--    (hard deletes don't reliably broadcast to other realtime clients)
alter table crew_channel_messages
  add column if not exists is_deleted boolean not null default false;

-- Index so filtering is fast
create index if not exists crew_channel_messages_is_deleted_idx
  on crew_channel_messages (channel_id, is_deleted);
