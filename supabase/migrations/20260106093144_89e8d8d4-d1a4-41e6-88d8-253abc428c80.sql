-- Add avatar_url column to crews table for crew profile pictures
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage policies for crew avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('crew-avatars', 'crew-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view crew avatars
CREATE POLICY "Anyone can view crew avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'crew-avatars');

-- Allow crew owners to upload avatars
CREATE POLICY "Crew owners can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crew-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Allow crew owners to update avatars
CREATE POLICY "Crew owners can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'crew-avatars' AND auth.uid() IS NOT NULL);

-- Allow crew owners to delete avatars
CREATE POLICY "Crew owners can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'crew-avatars' AND auth.uid() IS NOT NULL);