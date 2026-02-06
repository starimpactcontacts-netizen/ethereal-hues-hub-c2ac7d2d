
-- Create storage bucket for video thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('video-thumbnails', 'video-thumbnails', true);

-- Allow authenticated users to upload
CREATE POLICY "Users can upload video thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'video-thumbnails' AND auth.uid() IS NOT NULL);

-- Allow public read
CREATE POLICY "Video thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-thumbnails');

-- Allow users to update their own thumbnails
CREATE POLICY "Users can update own video thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'video-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own thumbnails
CREATE POLICY "Users can delete own video thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'video-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
