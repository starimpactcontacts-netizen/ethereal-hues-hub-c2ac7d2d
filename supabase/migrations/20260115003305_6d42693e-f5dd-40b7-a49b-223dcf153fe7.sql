-- Add new scoring columns for 5-pillar system (100 total)
-- rhythm_score: 0-25 (Rhythm & Timing)
-- creativity_score: 0-25 (Creativity & Concept) 
-- technical_score: 0-25 (Technical Execution)
-- emotional_score: 0-15 (Emotional Impact)
-- style_score: 0-10 (Style Identity)

ALTER TABLE public.gatekeeper_submissions 
ADD COLUMN IF NOT EXISTS rhythm_score numeric,
ADD COLUMN IF NOT EXISTS creativity_score numeric,
ADD COLUMN IF NOT EXISTS technical_score numeric,
ADD COLUMN IF NOT EXISTS emotional_score numeric,
ADD COLUMN IF NOT EXISTS style_score numeric,
ADD COLUMN IF NOT EXISTS gqt_rank text,
ADD COLUMN IF NOT EXISTS editor_type text,
ADD COLUMN IF NOT EXISTS editing_speed text,
ADD COLUMN IF NOT EXISTS test_purpose text,
ADD COLUMN IF NOT EXISTS confidence_level integer,
ADD COLUMN IF NOT EXISTS editing_goal text;

-- Add comment explaining the new system
COMMENT ON COLUMN public.gatekeeper_submissions.rhythm_score IS 'Rhythm & Timing score (0-25)';
COMMENT ON COLUMN public.gatekeeper_submissions.creativity_score IS 'Creativity & Concept score (0-25)';
COMMENT ON COLUMN public.gatekeeper_submissions.technical_score IS 'Technical Execution score (0-25)';
COMMENT ON COLUMN public.gatekeeper_submissions.emotional_score IS 'Emotional Impact score (0-15)';
COMMENT ON COLUMN public.gatekeeper_submissions.style_score IS 'Style Identity score (0-10)';
COMMENT ON COLUMN public.gatekeeper_submissions.gqt_rank IS 'Letter rank F to S++';
COMMENT ON COLUMN public.gatekeeper_submissions.confidence_level IS 'Self-rated confidence 1-10';