-- Add XP reward setting to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS xp_reward integer DEFAULT 50;

-- Add comment for clarity
COMMENT ON COLUMN public.events.xp_reward IS 'XP awarded to users when their submission is approved';

-- Track XP awarded for submissions so we can revoke it if declined
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS xp_awarded integer DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.event_participations.xp_awarded IS 'Amount of XP awarded for this submission (0 if declined or not yet approved)';