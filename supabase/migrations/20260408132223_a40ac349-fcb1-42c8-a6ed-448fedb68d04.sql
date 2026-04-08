
CREATE TABLE public.cash_battle_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.cash_battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team TEXT NOT NULL CHECK (team IN ('challenger', 'opponent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (battle_id, user_id)
);

ALTER TABLE public.cash_battle_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.cash_battle_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.cash_battle_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON public.cash_battle_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON public.cash_battle_votes FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_battle_votes;
