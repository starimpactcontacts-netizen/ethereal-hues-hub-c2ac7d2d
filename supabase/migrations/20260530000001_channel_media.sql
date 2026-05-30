-- Storage bucket for channel chat photo & video attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'channel-media',
  'channel-media',
  true,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read channel media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'channel-media');

CREATE POLICY "Authenticated users can upload channel media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'channel-media');
