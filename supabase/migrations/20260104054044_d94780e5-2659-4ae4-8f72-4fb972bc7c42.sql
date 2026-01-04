-- Add region column to profiles table for geographic identification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Create index for region filtering
CREATE INDEX IF NOT EXISTS idx_profiles_region ON public.profiles(region);