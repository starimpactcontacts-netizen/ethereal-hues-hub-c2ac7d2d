-- Create storage bucket for crew assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crew-assets', 'crew-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for crew assets bucket
CREATE POLICY "Anyone can view crew assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'crew-assets');

CREATE POLICY "Crew officers can upload assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'crew-assets' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Crew officers can delete assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'crew-assets' AND 
  auth.uid() IS NOT NULL
);