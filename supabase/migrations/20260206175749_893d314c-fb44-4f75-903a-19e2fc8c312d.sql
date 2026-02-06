
-- Bot commands table for polls, events, reminders
CREATE TABLE public.unit_bot_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.crew_channels(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.crew_channel_messages(id) ON DELETE SET NULL,
  command_type text NOT NULL, -- 'poll', 'event', 'reminder', 'welcome', 'rules'
  title text NOT NULL,
  description text,
  data jsonb DEFAULT '{}'::jsonb, -- poll options, event time, etc.
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unit_bot_commands ENABLE ROW LEVEL SECURITY;

-- Anyone in the crew can view bot commands
CREATE POLICY "Crew members can view bot commands"
  ON public.unit_bot_commands FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.crew_members
    WHERE crew_members.crew_id = unit_bot_commands.crew_id
      AND crew_members.user_id = auth.uid()
  ));

-- Only officers/owners can create bot commands
CREATE POLICY "Officers can create bot commands"
  ON public.unit_bot_commands FOR INSERT
  WITH CHECK (public.is_crew_staff(crew_id, auth.uid()));

-- Officers can update/delete
CREATE POLICY "Officers can update bot commands"
  ON public.unit_bot_commands FOR UPDATE
  USING (public.is_crew_staff(crew_id, auth.uid()));

CREATE POLICY "Officers can delete bot commands"
  ON public.unit_bot_commands FOR DELETE
  USING (public.is_crew_staff(crew_id, auth.uid()));

-- Poll votes table
CREATE TABLE public.unit_bot_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id uuid NOT NULL REFERENCES public.unit_bot_commands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_index int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (command_id, user_id)
);

ALTER TABLE public.unit_bot_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew members can vote"
  ON public.unit_bot_poll_votes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.unit_bot_commands ubc
    JOIN public.crew_members cm ON cm.crew_id = ubc.crew_id
    WHERE ubc.id = unit_bot_poll_votes.command_id
      AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Users can view votes"
  ON public.unit_bot_poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can change their vote"
  ON public.unit_bot_poll_votes FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for bot commands (for live poll updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_bot_poll_votes;

-- Auto-welcome trigger: post a welcome message when a new member joins
CREATE OR REPLACE FUNCTION public.unit_bot_welcome_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_general_channel_id uuid;
  v_username text;
  v_crew_name text;
BEGIN
  -- Find the general channel for this crew
  SELECT id INTO v_general_channel_id
  FROM crew_channels
  WHERE crew_id = NEW.crew_id AND name = 'general'
  LIMIT 1;

  IF v_general_channel_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get username and crew name
  SELECT username INTO v_username FROM profiles WHERE id = NEW.user_id;
  SELECT name INTO v_crew_name FROM crews WHERE id = NEW.crew_id;

  -- Post welcome bot message
  INSERT INTO crew_channel_messages (
    channel_id, crew_id, user_id, username, display_name, avatar_url, message_text, is_bot
  ) VALUES (
    v_general_channel_id,
    NEW.crew_id,
    NEW.user_id,
    'Unit Bot',
    'Unit Bot',
    NULL,
    '👋 Welcome **@' || COALESCE(v_username, 'new member') || '** to **' || v_crew_name || '**! Check out the channels and introduce yourself.',
    true
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_crew_member_welcome ON public.crew_members;
CREATE TRIGGER on_crew_member_welcome
  AFTER INSERT ON public.crew_members
  FOR EACH ROW
  EXECUTE FUNCTION public.unit_bot_welcome_member();
