-- Create storage bucket for editorium article images
INSERT INTO storage.buckets (id, name, public) VALUES ('editorium-images', 'editorium-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Editorium images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'editorium-images');

-- Authenticated users can upload (admin check done in app)
CREATE POLICY "Authenticated users can upload editorium images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'editorium-images' AND auth.role() = 'authenticated');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update editorium images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'editorium-images' AND auth.role() = 'authenticated');

-- Authenticated users can delete editorium images
CREATE POLICY "Authenticated users can delete editorium images"
ON storage.objects FOR DELETE
USING (bucket_id = 'editorium-images' AND auth.role() = 'authenticated');