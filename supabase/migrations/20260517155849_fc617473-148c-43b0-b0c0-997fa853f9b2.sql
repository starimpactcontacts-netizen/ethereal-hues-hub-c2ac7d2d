INSERT INTO storage.buckets (id, name, public)
VALUES ('competition-covers', 'competition-covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Competition covers public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'competition-covers');

CREATE POLICY "Authenticated upload competition covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'competition-covers');

CREATE POLICY "Authenticated update competition covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'competition-covers');

CREATE POLICY "Authenticated delete competition covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'competition-covers');