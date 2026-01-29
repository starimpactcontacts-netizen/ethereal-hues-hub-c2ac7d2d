-- Create hosted_competitions table
CREATE TABLE public.hosted_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  host_user_id uuid NOT NULL,
  host_crew_id uuid REFERENCES public.crews(id) ON DELETE SET NULL,
  host_name text NOT NULL, -- Discord server name or creator name
  host_avatar_url text,
  poster_url text,
  
  -- Competition settings
  format text NOT NULL DEFAULT 'battle_royale', -- battle_royale, bracket, round_robin
  max_submissions integer,
  submission_deadline timestamp with time zone NOT NULL,
  
  -- Status flow: pending -> approved -> live -> judging -> completed / rejected
  status text NOT NULL DEFAULT 'pending',
  approved_at timestamp with time zone,
  approved_by uuid,
  rejection_reason text,
  
  -- Rewards (optional - host decides)
  prize_description text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create hosted_competition_submissions table
CREATE TABLE public.hosted_competition_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.hosted_competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  
  -- Submission details
  platform text NOT NULL, -- tiktok, instagram, youtube
  submission_url text NOT NULL,
  
  -- Scoring (by host or invited judges)
  score integer,
  scored_by uuid,
  scored_at timestamp with time zone,
  judge_notes text,
  
  -- Ranking
  final_rank integer,
  
  -- Timestamps
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(competition_id, user_id)
);

-- Create hosted_competition_judges table (invited judges)
CREATE TABLE public.hosted_competition_judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.hosted_competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  invited_by uuid NOT NULL,
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  
  UNIQUE(competition_id, user_id)
);

-- Enable RLS
ALTER TABLE public.hosted_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosted_competition_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosted_competition_judges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hosted_competitions
CREATE POLICY "Anyone can view approved competitions"
ON public.hosted_competitions FOR SELECT
USING (status IN ('approved', 'live', 'judging', 'completed') OR host_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Authenticated users can create competitions"
ON public.hosted_competitions FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their competitions"
ON public.hosted_competitions FOR UPDATE
USING (host_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Admins can delete competitions"
ON public.hosted_competitions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

-- RLS Policies for hosted_competition_submissions
CREATE POLICY "Anyone can view submissions for live competitions"
ON public.hosted_competition_submissions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id 
  AND (hc.status IN ('live', 'judging', 'completed') OR hc.host_user_id = auth.uid())
) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can submit to live competitions"
ON public.hosted_competition_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id AND hc.status = 'live'
));

CREATE POLICY "Hosts and judges can score submissions"
ON public.hosted_competition_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.hosted_competitions hc 
    WHERE hc.id = competition_id AND hc.host_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.hosted_competition_judges hcj 
    WHERE hcj.competition_id = hosted_competition_submissions.competition_id 
    AND hcj.user_id = auth.uid() AND hcj.status = 'accepted'
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for hosted_competition_judges
CREATE POLICY "Anyone can view judges"
ON public.hosted_competition_judges FOR SELECT
USING (true);

CREATE POLICY "Hosts can invite judges"
ON public.hosted_competition_judges FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id AND hc.host_user_id = auth.uid()
));

CREATE POLICY "Invited users can respond to invites"
ON public.hosted_competition_judges FOR UPDATE
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id AND hc.host_user_id = auth.uid()
));

CREATE POLICY "Hosts can remove judges"
ON public.hosted_competition_judges FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id AND hc.host_user_id = auth.uid()
) OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.hosted_competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hosted_competition_submissions;