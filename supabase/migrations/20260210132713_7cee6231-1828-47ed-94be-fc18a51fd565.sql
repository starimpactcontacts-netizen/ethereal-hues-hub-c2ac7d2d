-- Add judge division flag to crews table
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS is_judge_division boolean NOT NULL DEFAULT false;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_crews_judge_division ON public.crews (is_judge_division) WHERE is_judge_division = true;