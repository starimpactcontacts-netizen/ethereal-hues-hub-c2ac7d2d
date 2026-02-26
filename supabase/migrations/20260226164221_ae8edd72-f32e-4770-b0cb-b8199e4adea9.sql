-- Add solo cancel tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS solo_cancel_count integer NOT NULL DEFAULT 0;