CREATE POLICY "Users can delete own pending cash battle application"
ON public.cash_battle_applications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');