
-- Ensure loop-media bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('loop-media', 'loop-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Authenticated users can upload to loop-media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view loop-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own loop-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own loop-media" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to loop-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'loop-media');

-- Allow public read access
CREATE POLICY "Anyone can view loop-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'loop-media');

-- Allow users to update their own files
CREATE POLICY "Users can update their own loop-media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'loop-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own loop-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'loop-media' AND auth.uid()::text = (storage.foldername(name))[1]);
