
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'battle-edits',
  'battle-edits',
  true,
  209715200, -- 200 MB
  ARRAY['video/mp4','video/quicktime','video/webm','video/x-m4v','image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
DROP POLICY IF EXISTS "battle_edits_public_read" ON storage.objects;
CREATE POLICY "battle_edits_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'battle-edits');

-- Anyone (incl. anon/guests) can upload
DROP POLICY IF EXISTS "battle_edits_any_upload" ON storage.objects;
CREATE POLICY "battle_edits_any_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'battle-edits');
