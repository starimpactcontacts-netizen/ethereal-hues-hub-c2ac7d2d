-- Add playlist name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS playlist_name TEXT DEFAULT NULL;