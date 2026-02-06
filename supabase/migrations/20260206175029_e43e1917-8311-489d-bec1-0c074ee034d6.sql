
-- Function to seed default channels for a crew
CREATE OR REPLACE FUNCTION public.ensure_default_channels(p_crew_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only seed if no channels exist for this crew
  IF NOT EXISTS (SELECT 1 FROM crew_channels WHERE crew_id = p_crew_id) THEN
    INSERT INTO crew_channels (crew_id, name, description, channel_type, category, category_order, channel_order, is_editor_only, is_locked)
    VALUES
      (p_crew_id, 'general', 'General discussion for the unit', 'text', 'General', 0, 0, false, false),
      (p_crew_id, 'announcements', 'Important updates from leadership', 'announcement', 'General', 0, 1, false, true);
  END IF;
END;
$$;

-- Trigger function to auto-create default channels on crew creation
CREATE OR REPLACE FUNCTION public.trigger_seed_default_channels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM ensure_default_channels(NEW.id);
  RETURN NEW;
END;
$$;

-- Attach trigger to crews table
DROP TRIGGER IF EXISTS on_crew_created_seed_channels ON public.crews;
CREATE TRIGGER on_crew_created_seed_channels
  AFTER INSERT ON public.crews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_seed_default_channels();
