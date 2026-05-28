-- Storage bucket for battle chat photo attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'battle-chat-images',
  'battle-chat-images',
  true,
  8388608, -- 8 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read battle chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'battle-chat-images');

CREATE POLICY "Authenticated users can upload battle chat images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'battle-chat-images');
