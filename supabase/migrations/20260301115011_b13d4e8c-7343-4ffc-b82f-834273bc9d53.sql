
-- Add cover_url to user_radio_tracks for user playlist cover art
ALTER TABLE public.user_radio_tracks ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Create storage bucket for track cover art
INSERT INTO storage.buckets (id, name, public) VALUES ('track-covers', 'track-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload cover art
CREATE POLICY "Users can upload track covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'track-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to covers
CREATE POLICY "Track covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'track-covers');

-- Allow users to update their own covers
CREATE POLICY "Users can update their own covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'track-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own covers
CREATE POLICY "Users can delete their own covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'track-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
