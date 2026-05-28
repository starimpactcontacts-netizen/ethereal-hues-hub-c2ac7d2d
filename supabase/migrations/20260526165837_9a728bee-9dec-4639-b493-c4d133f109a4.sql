INSERT INTO storage.buckets (id, name, public) VALUES ('battle-songs-audio', 'battle-songs-audio', true) ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read battle-songs-audio" ON storage.objects FOR SELECT USING (bucket_id = 'battle-songs-audio');
CREATE POLICY "Authenticated upload battle-songs-audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'battle-songs-audio');
CREATE POLICY "Authenticated update battle-songs-audio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'battle-songs-audio');
CREATE POLICY "Authenticated delete battle-songs-audio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'battle-songs-audio');