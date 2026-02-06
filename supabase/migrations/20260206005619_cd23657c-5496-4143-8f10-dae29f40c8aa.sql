-- Add challenge templates table for reusable quest definitions
CREATE TABLE public.crew_challenge_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'weekly',
  xp_reward INTEGER NOT NULL DEFAULT 100,
  target_value INTEGER NOT NULL DEFAULT 1,
  target_metric TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'normal', -- easy, normal, hard, legendary
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_challenge_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates
CREATE POLICY "Anyone can view challenge templates"
ON public.crew_challenge_templates FOR SELECT USING (true);

-- Seed challenge templates with diverse quest types
INSERT INTO public.crew_challenge_templates (title, description, challenge_type, xp_reward, target_value, target_metric, difficulty) VALUES
-- Judge Review Quests
('Rising Stars', 'Have a crew member receive a C tier or higher from a judge review', 'weekly', 150, 1, 'judge_review_c_plus', 'normal'),
('Excellence Pursuit', 'Have a crew member receive a B tier or higher from a judge review', 'weekly', 250, 1, 'judge_review_b_plus', 'hard'),
('S-Tier Hunters', 'Have a crew member receive an S tier from a judge review', 'weekly', 500, 1, 'judge_review_s', 'legendary'),
('Review Rush', 'Crew members receive 3 judge reviews total', 'weekly', 200, 3, 'judge_reviews_received', 'normal'),

-- Submission Quests
('Content Creators', 'Submit 5 videos across the crew', 'weekly', 150, 5, 'submissions', 'normal'),
('Prolific Crew', 'Submit 10 videos across the crew', 'weekly', 300, 10, 'submissions', 'hard'),

-- Activity Quests
('Growing Community', 'Gain 2 new crew members', 'weekly', 200, 2, 'members', 'normal'),
('Arena Warriors', 'Win 3 arena battles as a crew', 'weekly', 250, 3, 'arena_wins', 'hard'),

-- GQT Quests
('Self-Assessment', 'Have 3 members complete their GQT', 'weekly', 150, 3, 'gqt_scores', 'normal'),
('High Standards', 'Have a member score 70+ on their GQT', 'weekly', 200, 1, 'gqt_score_70_plus', 'normal'),

-- Daily Quests
('Daily Grind', 'Crew earns 100 XP today', 'daily', 50, 100, 'crew_xp', 'easy'),
('Quick Submit', 'Submit 1 video today', 'daily', 30, 1, 'submissions', 'easy'),

-- Special/Rare Quests  
('Unit Pride', 'Have 5 members display crew badge on profile', 'special', 300, 5, 'badge_displays', 'normal'),
('Viral Moment', 'A crew member gets 10k+ views on a submission', 'special', 400, 1, 'viral_submission', 'legendary');

-- Function to generate new challenges for a crew
CREATE OR REPLACE FUNCTION public.generate_crew_challenges(p_crew_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_count INTEGER;
  v_new_count INTEGER := 0;
  v_template RECORD;
  v_existing_ids UUID[];
  v_new_challenge_id UUID;
BEGIN
  -- Get count of active challenges for this crew
  SELECT COUNT(*) INTO v_active_count
  FROM crew_challenges c
  JOIN crew_challenge_progress p ON p.challenge_id = c.id
  WHERE p.crew_id = p_crew_id
    AND c.is_active = true
    AND c.ends_at > now()
    AND p.xp_claimed = false;

  -- If crew has less than 3 active quests, generate more
  IF v_active_count < 3 THEN
    -- Get IDs of challenges this crew already has (active or recently completed)
    SELECT ARRAY_AGG(c.id) INTO v_existing_ids
    FROM crew_challenges c
    JOIN crew_challenge_progress p ON p.challenge_id = c.id
    WHERE p.crew_id = p_crew_id
      AND c.ends_at > (now() - interval '7 days');

    -- Pick random templates and create new challenges
    FOR v_template IN
      SELECT * FROM crew_challenge_templates
      WHERE is_active = true
      ORDER BY random()
      LIMIT (3 - v_active_count)
    LOOP
      -- Create the challenge
      INSERT INTO crew_challenges (
        title, description, challenge_type, xp_reward, 
        target_value, target_metric, is_active,
        starts_at, ends_at
      ) VALUES (
        v_template.title,
        v_template.description,
        v_template.challenge_type,
        v_template.xp_reward,
        v_template.target_value,
        v_template.target_metric,
        true,
        now(),
        CASE 
          WHEN v_template.challenge_type = 'daily' THEN now() + interval '1 day'
          WHEN v_template.challenge_type = 'special' THEN now() + interval '14 days'
          ELSE now() + interval '7 days'
        END
      )
      RETURNING id INTO v_new_challenge_id;

      -- Auto-init progress for requesting crew
      INSERT INTO crew_challenge_progress (crew_id, challenge_id, current_value)
      VALUES (p_crew_id, v_new_challenge_id, 0)
      ON CONFLICT (crew_id, challenge_id) DO NOTHING;

      v_new_count := v_new_count + 1;
    END LOOP;
  END IF;

  RETURN v_new_count;
END;
$$;

-- Trigger function to auto-generate quests when one is claimed
CREATE OR REPLACE FUNCTION public.on_challenge_claimed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When XP is claimed, try to generate new challenges for this crew
  IF NEW.xp_claimed = true AND (OLD.xp_claimed = false OR OLD.xp_claimed IS NULL) THEN
    PERFORM generate_crew_challenges(NEW.crew_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_generate_challenges_on_claim ON crew_challenge_progress;
CREATE TRIGGER trigger_generate_challenges_on_claim
  AFTER UPDATE ON crew_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION on_challenge_claimed();