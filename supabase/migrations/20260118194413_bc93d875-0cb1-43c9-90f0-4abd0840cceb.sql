-- Create judge_applications table for prestige-gated judge onboarding
CREATE TABLE public.judge_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  video_url TEXT NOT NULL,
  video_platform TEXT NOT NULL,
  
  -- Skill test scores (3 edits they score, compared to baseline)
  test_edit_1_score INTEGER,
  test_edit_1_baseline INTEGER,
  test_edit_2_score INTEGER,
  test_edit_2_baseline INTEGER,
  test_edit_3_score INTEGER,
  test_edit_3_baseline INTEGER,
  test_accuracy NUMERIC,
  
  -- Optional applicant info
  experience_years TEXT,
  specialty TEXT,
  motivation TEXT,
  
  -- Admin review
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.judge_applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own applications"
ON public.judge_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own applications"
ON public.judge_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
ON public.judge_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can update applications"
ON public.judge_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can delete applications"
ON public.judge_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

-- Create index for faster lookups
CREATE INDEX idx_judge_applications_user_id ON public.judge_applications(user_id);
CREATE INDEX idx_judge_applications_status ON public.judge_applications(status);