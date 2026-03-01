-- Allow users to update their own purchases (equip/unequip)
CREATE POLICY "Users can update their own purchases"
ON public.shop_purchases
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);