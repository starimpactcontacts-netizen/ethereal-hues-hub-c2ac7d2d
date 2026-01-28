-- Add judge_xp and judge_review_count to profiles for judge progression tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS judge_xp integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS judge_review_count integer NOT NULL DEFAULT 0;

-- Create table for judge rating videos (viral content that brings editors to loopgate)
CREATE TABLE public.judge_rating_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  video_url text NOT NULL,
  title text,
  views_at_submission integer DEFAULT 0,
  current_views integer DEFAULT 0,
  viral_bonus_awarded boolean DEFAULT false,
  bonus_xp_awarded integer DEFAULT 0,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.judge_rating_videos ENABLE ROW LEVEL SECURITY;

-- Policies for judge rating videos
CREATE POLICY "Anyone can view rating videos"
  ON public.judge_rating_videos FOR SELECT
  USING (true);

CREATE POLICY "Judges can submit their rating videos"
  ON public.judge_rating_videos FOR INSERT
  WITH CHECK (
    auth.uid() = judge_id AND (
      has_role(auth.uid(), 'judge') OR 
      has_role(auth.uid(), 'trial_judge') OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'dev')
    )
  );

CREATE POLICY "Judges can update their own videos"
  ON public.judge_rating_videos FOR UPDATE
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can delete their own videos"
  ON public.judge_rating_videos FOR DELETE
  USING (auth.uid() = judge_id);

-- Function to award Judge XP
CREATE OR REPLACE FUNCTION public.award_judge_xp(
  p_judge_id uuid,
  p_amount integer,
  p_action text,
  p_description text DEFAULT NULL
)
RETURNS TABLE(new_judge_xp integer, new_review_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp integer;
  v_review_count integer;
BEGIN
  -- Update judge XP and review count
  UPDATE profiles
  SET 
    judge_xp = judge_xp + p_amount,
    judge_review_count = CASE 
      WHEN p_action = 'review_completed' THEN judge_review_count + 1 
      ELSE judge_review_count 
    END
  WHERE id = p_judge_id
  RETURNING judge_xp, judge_review_count INTO v_new_xp, v_review_count;

  -- Also award regular XP (judge actions also give editor XP)
  PERFORM award_xp(p_judge_id, p_amount, p_action, p_description);

  RETURN QUERY SELECT v_new_xp, v_review_count;
END;
$$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_judge_xp ON public.profiles(judge_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_judge_review_count ON public.profiles(judge_review_count DESC);
CREATE INDEX IF NOT EXISTS idx_judge_rating_videos_judge_id ON public.judge_rating_videos(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_rating_videos_views ON public.judge_rating_videos(current_views DESC);