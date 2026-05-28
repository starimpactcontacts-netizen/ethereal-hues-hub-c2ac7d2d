-- Add reply-to fields to quick_fight_messages so users can quote/reply in battle chat
ALTER TABLE public.quick_fight_messages
  ADD COLUMN IF NOT EXISTS reply_to_id       uuid,
  ADD COLUMN IF NOT EXISTS reply_to_username text,
  ADD COLUMN IF NOT EXISTS reply_to_text     text;
