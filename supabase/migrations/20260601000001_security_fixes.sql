-- ─────────────────────────────────────────────────────────────────────────────
-- Security fixes for rank/voting integrity
-- 1. Judges cannot score their own gatekeeper submissions
-- 2. Battle participants cannot vote in their own battle
-- 3. Quick fight players cannot vote in their own fight
-- 4. Cash battle participants cannot vote in their own battle
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Gatekeeper: prevent self-judging ──────────────────────────────────────
DROP POLICY IF EXISTS "Judges can update gatekeeper submissions" ON public.gatekeeper_submissions;

CREATE POLICY "Judges can update gatekeeper submissions"
  ON public.gatekeeper_submissions
  FOR UPDATE
  USING (
    -- Cannot score your own submission
    user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'judge', 'dev')
    )
  );

-- ── 2. Battle votes: prevent participants from voting ────────────────────────
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.battle_votes;

CREATE POLICY "Authenticated users can vote" ON public.battle_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    -- Challengers and opponents cannot vote in their own battle
    AND NOT EXISTS (
      SELECT 1 FROM public.battles
      WHERE battles.id = battle_id
      AND (battles.challenger_id = auth.uid() OR battles.opponent_id = auth.uid())
    )
  );

-- ── 3. Quick fight votes: prevent players from voting ────────────────────────
DROP POLICY IF EXISTS "Authenticated can vote" ON public.quick_fight_votes;

CREATE POLICY "Authenticated can vote" ON public.quick_fight_votes
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    -- Players cannot vote in their own fight
    AND NOT EXISTS (
      SELECT 1 FROM public.quick_fights
      WHERE quick_fights.id = fight_id
      AND (quick_fights.player_1_id = auth.uid() OR quick_fights.player_2_id = auth.uid())
    )
  );

-- ── 4. Cash battle votes: prevent participants from voting ───────────────────
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.cash_battle_votes;

CREATE POLICY "Authenticated users can vote" ON public.cash_battle_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.cash_battles
      WHERE cash_battles.id = battle_id
      AND (cash_battles.challenger_id = auth.uid() OR cash_battles.opponent_id = auth.uid())
    )
  );
