-- Add policy for admin updates and deletes on shop-items bucket
CREATE POLICY "Admins can update shop item images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'shop-items' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete shop item images"
ON storage.objects FOR DELETE
USING (bucket_id = 'shop-items' AND has_role(auth.uid(), 'admin'::app_role));