-- Create storage bucket for song previews
INSERT INTO storage.buckets (id, name, public) VALUES ('song-previews', 'song-previews', true);

-- Allow anyone to read song previews
CREATE POLICY "Song previews are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'song-previews');

-- Allow authenticated users to upload (admin will upload)
CREATE POLICY "Authenticated users can upload song previews"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'song-previews');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete song previews"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'song-previews');

-- Add a column to battles for featured song theme
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS theme_song_name TEXT;
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS theme_song_preview_url TEXT;
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS theme_drop_id UUID REFERENCES public.featured_drops(id);