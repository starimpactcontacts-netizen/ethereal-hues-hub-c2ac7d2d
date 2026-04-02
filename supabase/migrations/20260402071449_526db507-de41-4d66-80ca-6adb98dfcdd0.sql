
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-logos', 'campaign-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view campaign logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-logos');

CREATE POLICY "Authenticated users can upload campaign logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-logos');
