-- Add profile background customization columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_bg_color TEXT DEFAULT 'gold',
ADD COLUMN IF NOT EXISTS profile_bg_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.profile_bg_color IS 'User-selected background color for public profile: gold, purple, cyan, red, emerald, zinc';
COMMENT ON COLUMN public.profiles.profile_bg_image_url IS 'Background image URL for public profile (Level 3+ only)';