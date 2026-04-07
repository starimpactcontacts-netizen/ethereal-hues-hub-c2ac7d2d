
INSERT INTO storage.buckets (id, name, public) VALUES ('battle-thumbnails', 'battle-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view battle thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'battle-thumbnails');

CREATE POLICY "Authenticated users can upload battle thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'battle-thumbnails');

CREATE POLICY "Users can update their own battle thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'battle-thumbnails');
