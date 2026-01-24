-- Add is_primary flag to crew_members
ALTER TABLE public.crew_members 
ADD COLUMN is_primary boolean NOT NULL DEFAULT false;

-- Add primary_crew_changed_at to profiles for cooldown tracking
ALTER TABLE public.profiles
ADD COLUMN primary_crew_changed_at timestamp with time zone;

-- Set ONLY the first (oldest) membership per user as primary
UPDATE public.crew_members cm
SET is_primary = true
FROM (
  SELECT DISTINCT ON (user_id) id
  FROM public.crew_members
  ORDER BY user_id, joined_at ASC
) first_crew
WHERE cm.id = first_crew.id;

-- Create unique partial index: only one primary crew per user
CREATE UNIQUE INDEX idx_one_primary_crew_per_user 
ON public.crew_members (user_id) 
WHERE is_primary = true;

-- Create index for faster queries on secondary crews
CREATE INDEX idx_crew_members_secondary 
ON public.crew_members (user_id) 
WHERE is_primary = false;

-- Add comments for documentation
COMMENT ON COLUMN public.crew_members.is_primary IS 'Primary crew shown on profile/rankings. Only one per user. Secondary crews (is_primary=false) are for practice/social.';
COMMENT ON COLUMN public.profiles.primary_crew_changed_at IS 'Timestamp of last primary crew change. 7-day cooldown enforced.';