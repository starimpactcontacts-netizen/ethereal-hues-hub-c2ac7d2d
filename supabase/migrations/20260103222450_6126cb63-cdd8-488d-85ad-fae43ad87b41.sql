-- Add activity_status column to profiles for online/offline/busy status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activity_status text DEFAULT 'online';

-- Add constraint for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT check_activity_status CHECK (activity_status IN ('online', 'offline', 'busy'));