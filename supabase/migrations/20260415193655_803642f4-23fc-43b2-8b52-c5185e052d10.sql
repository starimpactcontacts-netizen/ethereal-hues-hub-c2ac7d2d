
CREATE POLICY "Fighters can update their own cash battle"
  ON public.cash_battles FOR UPDATE
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
