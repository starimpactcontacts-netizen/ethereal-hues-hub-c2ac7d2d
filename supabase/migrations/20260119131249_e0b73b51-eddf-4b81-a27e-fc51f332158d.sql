-- Create crew challenges table
CREATE TABLE public.crew_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL DEFAULT 'weekly', -- weekly, daily, special
  xp_reward integer NOT NULL DEFAULT 100,
  target_value integer NOT NULL DEFAULT 1, -- e.g., submit 5 edits, get 200 XP
  target_metric text NOT NULL DEFAULT 'crew_xp', -- crew_xp, submissions, members, arena_wins, gqt_scores
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create crew challenge progress table
CREATE TABLE public.crew_challenge_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id uuid NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.crew_challenges(id) ON DELETE CASCADE,
  current_value integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone,
  xp_claimed boolean NOT NULL DEFAULT false,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(crew_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.crew_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_challenge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Anyone can view challenges" 
ON public.crew_challenges 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage challenges" 
ON public.crew_challenges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for progress
CREATE POLICY "Anyone can view challenge progress" 
ON public.crew_challenge_progress 
FOR SELECT 
USING (true);

CREATE POLICY "Crew members can update their crew progress" 
ON public.crew_challenge_progress 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_challenge_progress.crew_id 
    AND crew_members.user_id = auth.uid()
  )
);

CREATE POLICY "Crew members can update progress" 
ON public.crew_challenge_progress 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_challenge_progress.crew_id 
    AND crew_members.user_id = auth.uid()
  )
);

-- Enable realtime for progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_challenge_progress;

-- Insert some initial weekly challenges
INSERT INTO public.crew_challenges (title, description, challenge_type, xp_reward, target_value, target_metric, ends_at) VALUES
('Crew Grind', 'Earn 500 XP as a crew', 'weekly', 200, 500, 'crew_xp', now() + interval '7 days'),
('Arena Warriors', 'Submit 5 edits to Open Arena', 'weekly', 150, 5, 'submissions', now() + interval '7 days'),
('Recruitment Drive', 'Get 3 new members to join', 'weekly', 250, 3, 'members', now() + interval '7 days'),
('Quality Check', 'Have 3 members take the GQT', 'weekly', 175, 3, 'gqt_scores', now() + interval '7 days');