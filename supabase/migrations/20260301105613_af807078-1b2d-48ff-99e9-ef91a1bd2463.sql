
-- Admin-managed radio tracks for LOOPGATE Radio
CREATE TABLE public.radio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_name TEXT NOT NULL,
  artist_name TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  is_priority BOOLEAN NOT NULL DEFAULT false,
  track_order INTEGER NOT NULL DEFAULT 0,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.radio_tracks ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Radio tracks are public" ON public.radio_tracks FOR SELECT USING (true);

-- Only admins/devs can manage
CREATE POLICY "Admins can insert radio tracks" ON public.radio_tracks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role));
CREATE POLICY "Admins can update radio tracks" ON public.radio_tracks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role));
CREATE POLICY "Admins can delete radio tracks" ON public.radio_tracks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role));

-- User radio settings
CREATE TABLE public.user_radio_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  autoplay_enabled BOOLEAN NOT NULL DEFAULT true,
  default_playlist TEXT NOT NULL DEFAULT 'loopgate',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_radio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings" ON public.user_radio_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_radio_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_radio_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for radio uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('radio-tracks', 'radio-tracks', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view radio tracks" ON storage.objects FOR SELECT USING (bucket_id = 'radio-tracks');
CREATE POLICY "Admins can upload radio tracks" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'radio-tracks' AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role)));
CREATE POLICY "Admins can delete radio tracks" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'radio-tracks' AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role)));
