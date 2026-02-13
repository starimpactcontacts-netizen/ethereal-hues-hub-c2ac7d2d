
-- Trigger: when a quick fight goes from 'waiting' to 'active' (opponent matched), 
-- notify both players + post to activity feed
CREATE OR REPLACE FUNCTION public.on_quick_fight_matched()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p1_email TEXT;
  p2_email TEXT;
BEGIN
  -- Only trigger when status changes to 'active' (match found)
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status = 'waiting') THEN
    -- Notify player 1
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.player_1_id,
      'quick_fight_matched',
      '⚔️ Opponent Found!',
      'You''ve been matched against ' || COALESCE(NEW.player_2_username, 'an editor') || ' for a Quick Edit Battle!',
      jsonb_build_object('fight_id', NEW.id, 'opponent', NEW.player_2_username)
    );
    
    -- Notify player 2
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.player_2_id,
      'quick_fight_matched',
      '⚔️ Opponent Found!',
      'You''ve been matched against ' || NEW.player_1_username || ' for a Quick Edit Battle!',
      jsonb_build_object('fight_id', NEW.id, 'opponent', NEW.player_1_username)
    );
    
    -- Post to activity feed
    INSERT INTO public.activity_feed (user_id, username, avatar_url, activity_type, title, description, data)
    VALUES (
      NEW.player_1_id,
      NEW.player_1_username,
      NEW.player_1_avatar_url,
      'battle',
      NEW.player_1_username || ' vs ' || COALESCE(NEW.player_2_username, '???'),
      '⚔️ Quick Edit Battle started!',
      jsonb_build_object('fight_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quick_fight_matched_trigger
AFTER UPDATE ON public.quick_fights
FOR EACH ROW
EXECUTE FUNCTION public.on_quick_fight_matched();

-- Trigger: when a quick fight is completed, post results to activity feed + award XP via DB
CREATE OR REPLACE FUNCTION public.on_quick_fight_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  winner_username TEXT;
  loser_id UUID;
  loser_username TEXT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') AND NEW.winner_id IS NOT NULL THEN
    -- Determine winner/loser
    IF NEW.winner_id = NEW.player_1_id THEN
      winner_username := NEW.player_1_username;
      loser_id := NEW.player_2_id;
      loser_username := NEW.player_2_username;
    ELSE
      winner_username := NEW.player_2_username;
      loser_id := NEW.player_1_id;
      loser_username := NEW.player_1_username;
    END IF;

    -- Award XP to winner (+20)
    PERFORM public.award_xp(NEW.winner_id, 20, 'quick_fight_win', 'Won Quick Edit Battle vs ' || COALESCE(loser_username, 'opponent'));
    
    -- Award XP to loser (+5)
    IF loser_id IS NOT NULL THEN
      PERFORM public.award_xp(loser_id, 5, 'quick_fight_loss', 'Participated in Quick Edit Battle vs ' || COALESCE(winner_username, 'opponent'));
    END IF;

    -- Post winner to activity feed
    INSERT INTO public.activity_feed (user_id, username, avatar_url, activity_type, title, description, data)
    VALUES (
      NEW.winner_id,
      winner_username,
      CASE WHEN NEW.winner_id = NEW.player_1_id THEN NEW.player_1_avatar_url ELSE NEW.player_2_avatar_url END,
      'battle',
      '🏆 ' || winner_username || ' defeated ' || COALESCE(loser_username, '???'),
      'Quick Edit Battle — Score: ' || COALESCE(NEW.winner_score::TEXT, '?') || ' vs ' || COALESCE(NEW.loser_score::TEXT, '?'),
      jsonb_build_object('fight_id', NEW.id, 'winner_score', NEW.winner_score, 'loser_score', NEW.loser_score)
    );

    -- Notify winner
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.winner_id,
      'quick_fight_result',
      '🏆 You Won!',
      'You defeated ' || COALESCE(loser_username, 'your opponent') || '! +20 XP',
      jsonb_build_object('fight_id', NEW.id, 'xp', 20)
    );

    -- Notify loser
    IF loser_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        loser_id,
        'quick_fight_result',
        '❌ Battle Over',
        winner_username || ' won this time. +5 XP for competing.',
        jsonb_build_object('fight_id', NEW.id, 'xp', 5)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quick_fight_completed_trigger
AFTER UPDATE ON public.quick_fights
FOR EACH ROW
EXECUTE FUNCTION public.on_quick_fight_completed();

-- Add queued_at to quick_fight_queue for timer tracking
ALTER TABLE public.quick_fight_queue ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ DEFAULT now();
