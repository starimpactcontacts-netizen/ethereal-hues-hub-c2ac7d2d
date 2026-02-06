
-- Add recovery code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS recovery_code TEXT;

-- Add device tracking to active_sessions
ALTER TABLE public.active_sessions ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE public.active_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.active_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Add has_password flag to profiles (so we don't rely on unreliable metadata detection)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT false;
