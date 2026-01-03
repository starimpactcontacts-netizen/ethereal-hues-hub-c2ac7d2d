-- Add verification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_code text,
ADD COLUMN IF NOT EXISTS verification_requested_at timestamp with time zone;

-- Add index for verification lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_code ON public.profiles(verification_code) WHERE verification_code IS NOT NULL;

-- Ensure verification codes are unique when set
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_verification_code_unique ON public.profiles(verification_code) WHERE verification_code IS NOT NULL;