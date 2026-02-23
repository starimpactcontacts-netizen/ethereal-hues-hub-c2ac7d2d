
-- Update the auto-assign trigger to respect the selected judge
-- If judge_id is set on the review_request, route ONLY to that judge
-- If judge_id is NULL, route to ALL judges (not just 2 hardcoded ones)
CREATE OR REPLACE FUNCTION public.auto_assign_qoi_judges()
RETURNS TRIGGER AS $$
DECLARE
  jid UUID;
  all_judge_ids UUID[];
BEGIN
  -- If the user selected a specific judge, route only to them
  IF NEW.judge_id IS NOT NULL THEN
    INSERT INTO public.judge_inbox (judge_id, review_request_id)
    VALUES (NEW.judge_id, NEW.id)
    ON CONFLICT (judge_id, review_request_id) DO NOTHING;
  ELSE
    -- No specific judge selected — route to ALL judges
    SELECT ARRAY_AGG(user_id) INTO all_judge_ids
    FROM public.user_roles
    WHERE role IN ('judge', 'trial_judge');

    IF all_judge_ids IS NOT NULL THEN
      FOREACH jid IN ARRAY all_judge_ids LOOP
        INSERT INTO public.judge_inbox (judge_id, review_request_id)
        VALUES (jid, NEW.id)
        ON CONFLICT (judge_id, review_request_id) DO NOTHING;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
