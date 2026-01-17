-- Add founding_member column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT false;

-- Set founding member status for noisefxs and grime
UPDATE public.profiles 
SET is_founding_member = true 
WHERE username IN ('noisefxs', 'grime');
