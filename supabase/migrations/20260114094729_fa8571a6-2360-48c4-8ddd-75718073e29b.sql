-- Create a public bucket for shop item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-items', 'shop-items', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public access to shop item images
CREATE POLICY "Anyone can view shop item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-items');

-- Create policy for admin uploads
CREATE POLICY "Admins can upload shop item images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shop-items' AND has_role(auth.uid(), 'admin'::app_role));