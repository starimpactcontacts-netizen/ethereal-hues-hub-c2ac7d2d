
-- Create trigger function to auto-link featured submissions to campaigns
CREATE OR REPLACE FUNCTION public.auto_link_submission_to_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign_id UUID;
  v_campaign_name TEXT;
BEGIN
  -- Find campaign linked to this drop's artist
  SELECT ac.id INTO v_campaign_id
  FROM artist_campaigns ac
  JOIN featured_drops fd ON fd.artist_id = ac.featured_artist_id
  WHERE fd.id = NEW.drop_id
    AND ac.status = 'active'
  LIMIT 1;

  -- If a campaign exists, create a campaign edit
  IF v_campaign_id IS NOT NULL THEN
    INSERT INTO public.artist_campaign_edits (
      campaign_id,
      editor_id,
      editor_username,
      title,
      video_url,
      platform,
      status,
      published_at
    ) VALUES (
      v_campaign_id,
      NEW.user_id,
      NEW.username,
      'Featured Drop Edit',
      NEW.submission_url,
      NEW.platform,
      'published',
      NEW.created_at
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to featured_submissions
CREATE TRIGGER trg_auto_link_submission_to_campaign
AFTER INSERT ON public.featured_submissions
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_submission_to_campaign();

-- Also link queue entries when they get promoted
CREATE TRIGGER trg_auto_link_queue_to_campaign
AFTER INSERT ON public.featured_drop_queue
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_submission_to_campaign();
