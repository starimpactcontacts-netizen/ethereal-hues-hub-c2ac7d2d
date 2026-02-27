
-- Create user radio tracks table
CREATE TABLE public.user_radio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_name TEXT NOT NULL,
  artist_name TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT false,
  track_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_radio_tracks ENABLE ROW LEVEL SECURITY;

-- Users can view their own tracks
CREATE POLICY "Users can view own radio tracks"
  ON public.user_radio_tracks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public tracks from others
CREATE POLICY "Anyone can view public radio tracks"
  ON public.user_radio_tracks FOR SELECT
  USING (is_public = true);

-- Users can insert their own tracks (max 25 enforced client-side + trigger)
CREATE POLICY "Users can add own radio tracks"
  ON public.user_radio_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tracks
CREATE POLICY "Users can update own radio tracks"
  ON public.user_radio_tracks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tracks
CREATE POLICY "Users can delete own radio tracks"
  ON public.user_radio_tracks FOR DELETE
  USING (auth.uid() = user_id);

-- Enforce 25 track limit via trigger
CREATE OR REPLACE FUNCTION public.enforce_radio_track_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  track_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO track_count
  FROM public.user_radio_tracks
  WHERE user_id = NEW.user_id;

  IF track_count >= 25 THEN
    RAISE EXCEPTION 'Maximum of 25 radio tracks allowed per user';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_radio_track_limit
  BEFORE INSERT ON public.user_radio_tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_radio_track_limit();

-- Create storage bucket for user radio uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('user-radio', 'user-radio', true);

-- Storage policies
CREATE POLICY "Users can upload radio audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-radio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can listen to radio audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-radio');

CREATE POLICY "Users can delete own radio audio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-radio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_radio_tracks;
