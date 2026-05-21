CREATE OR REPLACE FUNCTION public.notify_on_submission_scored()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  event_title TEXT;
  profile_username TEXT;
  profile_avatar TEXT;
BEGIN
  IF NEW.status = 'scored' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- event_participations.event_id is text while events.id is uuid.
    -- Compare as text so scoring never fails with "operator does not exist: uuid = text".
    SELECT title INTO event_title
    FROM public.events
    WHERE id::text = NEW.event_id
    LIMIT 1;
    
    SELECT username, avatar_url INTO profile_username, profile_avatar 
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'submission_judged',
      'Your submission has been judged!',
      'Your entry in ' || COALESCE(event_title, 'an event') || ' received a QOI score of ' || ROUND(NEW.qoi_score::NUMERIC, 1),
      jsonb_build_object(
        'event_id', NEW.event_id,
        'qoi_score', NEW.qoi_score,
        'quality_score', NEW.quality_score,
        'originality_score', NEW.originality_score,
        'impact_score', NEW.impact_score
      )
    );
    
    INSERT INTO public.activity_feed (user_id, username, avatar_url, activity_type, title, description, data)
    VALUES (
      NEW.user_id,
      COALESCE(profile_username, 'Unknown'),
      profile_avatar,
      'submission',
      COALESCE(profile_username, 'Unknown') || ' submitted to ' || COALESCE(event_title, 'an event'),
      'Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI',
      jsonb_build_object('event_id', NEW.event_id, 'qoi_score', NEW.qoi_score)
    );
  END IF;

  RETURN NEW;
END;
$function$;