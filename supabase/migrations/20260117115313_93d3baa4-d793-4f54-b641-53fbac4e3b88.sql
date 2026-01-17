-- Add xp_awarded column to round_participations to track if XP was awarded
ALTER TABLE public.round_participations 
ADD COLUMN IF NOT EXISTS xp_awarded integer DEFAULT 0;