
-- Add campaign_id to commissions so they can be tied to artist campaigns
ALTER TABLE public.commissions ADD COLUMN campaign_id uuid REFERENCES public.artist_campaigns(id) ON DELETE SET NULL;

-- Add custom payout tiers per commission (overrides global defaults)
ALTER TABLE public.commissions ADD COLUMN custom_payouts jsonb DEFAULT NULL;
-- Format: {"S": 500, "A": 300, "B": 100, "C": 0, "D": 0, "F": 0} (in cents)

-- Create trigger to auto-link rated commission submissions to campaign edits
CREATE OR REPLACE FUNCTION public.link_commission_submission_to_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign_id uuid;
  v_commission RECORD;
BEGIN
  -- Only fire when submission gets rated (status changes to accepted/declined with a rating)
  IF NEW.rating IS NOT NULL AND (OLD.rating IS NULL) THEN
    -- Get the commission's campaign_id
    SELECT campaign_id, title, artist_name, song_name 
    INTO v_commission
    FROM public.commissions 
    WHERE id = NEW.commission_id;
    
    -- If commission is linked to a campaign, create a campaign edit entry
    IF v_commission.campaign_id IS NOT NULL THEN
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
        v_commission.campaign_id,
        NEW.user_id,
        NEW.username,
        COALESCE(v_commission.title, 'Commission Edit'),
        NEW.submission_url,
        COALESCE(NEW.platform, 'other'),
        'live',
        now()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_commission_submission_rated_campaign_link
AFTER UPDATE ON public.commission_submissions
FOR EACH ROW
EXECUTE FUNCTION public.link_commission_submission_to_campaign();
