
-- Add per-player theme song columns to practice_matches
ALTER TABLE public.practice_matches
ADD COLUMN player_1_theme_drop_id UUID REFERENCES public.featured_drops(id),
ADD COLUMN player_1_theme_song_name TEXT,
ADD COLUMN player_1_theme_song_preview_url TEXT,
ADD COLUMN player_2_theme_drop_id UUID REFERENCES public.featured_drops(id),
ADD COLUMN player_2_theme_song_name TEXT,
ADD COLUMN player_2_theme_song_preview_url TEXT;

-- Function to pick a song for a practice match
-- Sets the player's theme, and if both have picked, starts the match timer
CREATE OR REPLACE FUNCTION public.pick_practice_song(
  p_match_id UUID,
  p_user_id UUID,
  p_drop_id UUID,
  p_song_name TEXT,
  p_song_preview_url TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_is_player_1 BOOLEAN;
  v_both_picked BOOLEAN;
BEGIN
  -- Get the match
  SELECT * INTO v_match FROM practice_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Must be in matched status (song picking phase)
  IF v_match.status NOT IN ('matched') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is not in song picking phase');
  END IF;
  
  -- Determine which player
  v_is_player_1 := (v_match.player_1_id = p_user_id);
  
  IF NOT v_is_player_1 AND v_match.player_2_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not in this match');
  END IF;
  
  -- Update the player's song pick
  IF v_is_player_1 THEN
    UPDATE practice_matches
    SET player_1_theme_drop_id = p_drop_id,
        player_1_theme_song_name = p_song_name,
        player_1_theme_song_preview_url = p_song_preview_url,
        updated_at = now()
    WHERE id = p_match_id;
    
    -- Check if other player already picked
    v_both_picked := (v_match.player_2_theme_drop_id IS NOT NULL);
  ELSE
    UPDATE practice_matches
    SET player_2_theme_drop_id = p_drop_id,
        player_2_theme_song_name = p_song_name,
        player_2_theme_song_preview_url = p_song_preview_url,
        updated_at = now()
    WHERE id = p_match_id;
    
    -- Check if other player already picked
    v_both_picked := (v_match.player_1_theme_drop_id IS NOT NULL);
  END IF;
  
  -- If both players have picked, start the timer
  IF v_both_picked THEN
    UPDATE practice_matches
    SET status = 'in_progress',
        starts_at = now(),
        ends_at = now() + (v_match.duration_minutes || ' minutes')::INTERVAL,
        updated_at = now()
    WHERE id = p_match_id;
    
    RETURN jsonb_build_object('success', true, 'started', true);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'started', false);
END;
$$;

-- Update find_practice_match to NOT set starts_at/ends_at initially (song pick phase first)
CREATE OR REPLACE FUNCTION public.find_practice_match(p_user_id uuid, p_match_type text, p_duration integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  user_tier TEXT;
  matched_queue RECORD;
  new_match_id UUID;
BEGIN
  -- Get user's skill tier
  SELECT get_skill_tier(COALESCE(global_index_score, 0)) INTO user_tier
  FROM public.profiles WHERE id = p_user_id;
  
  -- Look for a match in queue (same tier, same type, not self)
  SELECT * INTO matched_queue
  FROM public.practice_queue
  WHERE user_id != p_user_id
    AND match_type = p_match_type
    AND skill_tier = user_tier
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF matched_queue IS NULL THEN
    -- No match found, add to queue
    INSERT INTO public.practice_queue (user_id, match_type, duration_minutes, skill_tier)
    VALUES (p_user_id, p_match_type, p_duration, user_tier)
    ON CONFLICT (user_id) DO UPDATE 
    SET match_type = p_match_type, 
        duration_minutes = p_duration,
        skill_tier = user_tier,
        queued_at = now(),
        expires_at = now() + INTERVAL '15 minutes';
    
    RETURN NULL;
  END IF;
  
  -- Match found! Create the practice match
  -- starts_at and ends_at are NULL — they get set when both players pick their songs
  INSERT INTO public.practice_matches (
    match_type, 
    duration_minutes, 
    player_1_id, 
    player_2_id, 
    status,
    matched_at
  )
  VALUES (
    p_match_type,
    GREATEST(matched_queue.duration_minutes, p_duration),
    matched_queue.user_id,
    p_user_id,
    'matched',
    now()
  )
  RETURNING id INTO new_match_id;
  
  -- Remove both users from queue
  DELETE FROM public.practice_queue WHERE user_id IN (p_user_id, matched_queue.user_id);
  
  -- Create notifications for both players
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES 
    (matched_queue.user_id, 'practice_matched', 'Match Found!', 'Pick your song to start the 1v1!', 
     jsonb_build_object('match_id', new_match_id, 'match_type', p_match_type)),
    (p_user_id, 'practice_matched', 'Match Found!', 'Pick your song to start the 1v1!',
     jsonb_build_object('match_id', new_match_id, 'match_type', p_match_type));
  
  RETURN new_match_id;
END;
$$;
