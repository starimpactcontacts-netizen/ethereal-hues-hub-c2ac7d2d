
CREATE OR REPLACE FUNCTION public.auto_link_submission_to_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  SELECT ac.id INTO v_campaign_id
  FROM artist_campaigns ac
  JOIN featured_drops fd ON fd.artist_id = ac.featured_artist_id
  WHERE fd.id = NEW.drop_id
    AND ac.status = 'active'
  LIMIT 1;

  IF v_campaign_id IS NOT NULL THEN
    INSERT INTO public.artist_campaign_edits (
      campaign_id, editor_id, editor_username, title, video_url, platform, status, published_at
    ) VALUES (
      v_campaign_id, NEW.user_id, NEW.username, 'Featured Drop Edit',
      NEW.submission_url, NEW.platform, 'live', NEW.created_at
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
