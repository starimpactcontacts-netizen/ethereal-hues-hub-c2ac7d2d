
-- Add custom bot identity columns to crews table
ALTER TABLE public.crews ADD COLUMN bot_name TEXT DEFAULT 'Unit Bot';
ALTER TABLE public.crews ADD COLUMN bot_avatar_url TEXT DEFAULT NULL;
