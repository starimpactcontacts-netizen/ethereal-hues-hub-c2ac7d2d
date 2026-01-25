-- Drop the admin-only upload policy
DROP POLICY IF EXISTS "Admins can upload event posters" ON storage.objects;

-- Create new policy allowing authenticated users to upload to event-posters bucket
CREATE POLICY "Authenticated users can upload event posters"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-posters' 
  AND auth.uid() IS NOT NULL
);

-- Also allow users to update their own uploads (for replacing)
DROP POLICY IF EXISTS "Admins can update event posters" ON storage.objects;
CREATE POLICY "Users can update event posters"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-posters' 
  AND auth.uid() IS NOT NULL
);