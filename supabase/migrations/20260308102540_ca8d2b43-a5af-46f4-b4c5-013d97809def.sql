
CREATE TABLE IF NOT EXISTS public.radio_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  song_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  link TEXT NOT NULL,
  genre TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.radio_pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own pitches"
  ON public.radio_pitches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own pitches"
  ON public.radio_pitches FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pitches"
  ON public.radio_pitches FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pitches"
  ON public.radio_pitches FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
