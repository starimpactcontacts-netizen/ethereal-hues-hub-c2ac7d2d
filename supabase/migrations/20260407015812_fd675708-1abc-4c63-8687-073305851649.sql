
-- Add thumbnail_url to commission_submissions
ALTER TABLE public.commission_submissions
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Create storage bucket for submission thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('submission-thumbnails', 'submission-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Submission thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'submission-thumbnails');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload submission thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submission-thumbnails' AND auth.role() = 'authenticated');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update submission thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'submission-thumbnails' AND auth.role() = 'authenticated');
