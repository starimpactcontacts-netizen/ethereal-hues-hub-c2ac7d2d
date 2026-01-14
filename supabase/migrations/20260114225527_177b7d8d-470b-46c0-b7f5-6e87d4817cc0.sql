-- Create gatekeeper_submissions table for the Gatekeeper Test feature
CREATE TABLE public.gatekeeper_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  
  -- Optional user inputs for commentary tone
  editing_software TEXT,
  years_editing TEXT,
  age_range TEXT,
  editing_style TEXT,
  
  -- Scoring (set by judge)
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  originality_score INTEGER CHECK (originality_score >= 0 AND originality_score <= 100),
  impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
  qoi_score NUMERIC(5,1),
  
  -- Judge commentary
  judge_archetype TEXT CHECK (judge_archetype IN ('realist', 'hype_demon', 'coach', 'troll', 'old_pro')),
  judge_commentary TEXT,
  
  -- Rank projection & house fit
  rank_projection TEXT,
  house_fit JSONB,
  suggested_action TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scored', 'expired')),
  judged_at TIMESTAMPTZ,
  judge_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gatekeeper_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own gatekeeper submissions"
  ON public.gatekeeper_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own submissions
CREATE POLICY "Users can create own gatekeeper submissions"
  ON public.gatekeeper_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Judges/Admins can view all submissions
CREATE POLICY "Judges can view all gatekeeper submissions"
  ON public.gatekeeper_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'judge', 'dev')
    )
  );

-- Judges/Admins can update (score) submissions
CREATE POLICY "Judges can update gatekeeper submissions"
  ON public.gatekeeper_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'judge', 'dev')
    )
  );

-- Add best_gatekeeper_qoi to profiles (stores best score)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS best_gatekeeper_qoi NUMERIC(5,1);

-- Trigger to update best QOI on profile when scored
CREATE OR REPLACE FUNCTION public.update_best_gatekeeper_qoi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL THEN
    UPDATE public.profiles
    SET best_gatekeeper_qoi = GREATEST(COALESCE(best_gatekeeper_qoi, 0), NEW.qoi_score)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_gatekeeper_scored
  AFTER UPDATE ON public.gatekeeper_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'scored' AND OLD.status != 'scored')
  EXECUTE FUNCTION public.update_best_gatekeeper_qoi();

-- Index for faster queries
CREATE INDEX idx_gatekeeper_submissions_user ON public.gatekeeper_submissions(user_id);
CREATE INDEX idx_gatekeeper_submissions_status ON public.gatekeeper_submissions(status);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.gatekeeper_submissions;