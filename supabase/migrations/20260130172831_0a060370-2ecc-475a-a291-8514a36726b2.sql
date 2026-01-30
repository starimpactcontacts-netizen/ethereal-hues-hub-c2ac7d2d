-- Add storage policy to allow authenticated users to upload hosted comp avatars
CREATE POLICY "Allow authenticated users to upload hosted comp avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = 'hosted-comps'
);

-- Allow anyone to read avatars (already public bucket but explicit policy helps)
CREATE POLICY "Allow public read access to all avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to update hosted comp avatars
CREATE POLICY "Allow authenticated users to update hosted comp avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = 'hosted-comps'
);

-- Allow authenticated users to delete hosted comp avatars
CREATE POLICY "Allow authenticated users to delete hosted comp avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = 'hosted-comps'
);