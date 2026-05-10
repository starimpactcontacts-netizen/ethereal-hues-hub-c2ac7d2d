-- Duo Edit Battles: pair two live collab slots into a head-to-head battle
CREATE TABLE IF NOT EXISTS public.collab_battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_a_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  slot_b_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'live', -- live | judged | settled
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  reactions_a INTEGER NOT NULL DEFAULT 0,
  reactions_b INTEGER NOT NULL DEFAULT 0,
  judge_score_a NUMERIC NOT NULL DEFAULT 0,
  judge_score_b NUMERIC NOT NULL DEFAULT 0,
  winner_slot_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT collab_battles_distinct_slots CHECK (slot_a_id <> slot_b_id),
  CONSTRAINT collab_battles_unique_a UNIQUE (slot_a_id),
  CONSTRAINT collab_battles_unique_b UNIQUE (slot_b_id)
);

CREATE INDEX IF NOT EXISTS idx_collab_battles_status ON public.collab_battles(status);
CREATE INDEX IF NOT EXISTS idx_collab_battles_ends_at ON public.collab_battles(ends_at);

ALTER TABLE public.collab_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battles viewable by everyone"
ON public.collab_battles FOR SELECT
USING (true);

-- Judge votes on battles (one row per judge per battle)
CREATE TABLE IF NOT EXISTS public.collab_battle_judges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.collab_battles(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL,
  pick_slot_id UUID NOT NULL,
  qoi_score NUMERIC NOT NULL DEFAULT 50,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (battle_id, judge_id)
);

ALTER TABLE public.collab_battle_judges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battle judge votes viewable by everyone"
ON public.collab_battle_judges FOR SELECT USING (true);

CREATE POLICY "Authenticated can cast judge vote"
ON public.collab_battle_judges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update own vote"
ON public.collab_battle_judges FOR UPDATE
TO authenticated
USING (auth.uid() = judge_id);

-- Auto-matchmake: when a slot becomes live, pair it with another orphan live slot
CREATE OR REPLACE FUNCTION public.trg_auto_matchmake_collab_battle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opponent_id UUID;
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS DISTINCT FROM 'live') THEN
    -- Already in a battle? skip
    IF EXISTS (
      SELECT 1 FROM public.collab_battles
      WHERE slot_a_id = NEW.id OR slot_b_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;

    -- Find an orphan live slot (not already in a battle, not the same duo)
    SELECT s.id INTO v_opponent_id
    FROM public.collab_slots s
    WHERE s.status = 'live'
      AND s.id <> NEW.id
      AND s.creator_id <> NEW.creator_id
      AND (NEW.partner_id IS NULL OR s.creator_id <> NEW.partner_id)
      AND (s.partner_id IS NULL OR s.partner_id <> NEW.creator_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.collab_battles b
        WHERE b.slot_a_id = s.id OR b.slot_b_id = s.id
      )
    ORDER BY s.live_at ASC NULLS LAST
    LIMIT 1;

    IF v_opponent_id IS NOT NULL THEN
      INSERT INTO public.collab_battles (slot_a_id, slot_b_id)
      VALUES (v_opponent_id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_matchmake_collab_battle ON public.collab_slots;
CREATE TRIGGER auto_matchmake_collab_battle
AFTER UPDATE OF status ON public.collab_slots
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_matchmake_collab_battle();

-- Recompute battle scores from reactions + judge votes
CREATE OR REPLACE FUNCTION public.collab_battle_recompute(_battle_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b RECORD;
  ra INTEGER := 0; rb INTEGER := 0;
  ja NUMERIC := 0; jb NUMERIC := 0;
  na INTEGER := 0; nb INTEGER := 0;
  sa NUMERIC; sb NUMERIC;
BEGIN
  SELECT * INTO b FROM public.collab_battles WHERE id = _battle_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COALESCE(reaction_score,0) INTO ra FROM public.collab_slots WHERE id = b.slot_a_id;
  SELECT COALESCE(reaction_score,0) INTO rb FROM public.collab_slots WHERE id = b.slot_b_id;

  SELECT COALESCE(AVG(qoi_score),0), COUNT(*) INTO ja, na
    FROM public.collab_battle_judges
    WHERE battle_id = _battle_id AND pick_slot_id = b.slot_a_id;
  SELECT COALESCE(AVG(qoi_score),0), COUNT(*) INTO jb, nb
    FROM public.collab_battle_judges
    WHERE battle_id = _battle_id AND pick_slot_id = b.slot_b_id;

  -- 70% reactions / 30% judge avg, normalized to a 0-1000 range loosely
  sa := (ra::NUMERIC * 0.7) + (ja * (na+1) * 0.3);
  sb := (rb::NUMERIC * 0.7) + (jb * (nb+1) * 0.3);

  UPDATE public.collab_battles
  SET reactions_a = ra,
      reactions_b = rb,
      judge_score_a = ja,
      judge_score_b = jb,
      score_a = ROUND(sa)::INT,
      score_b = ROUND(sb)::INT
  WHERE id = _battle_id;
END;
$$;

-- Recompute trigger when judges vote
CREATE OR REPLACE FUNCTION public.trg_collab_battle_judge_recompute()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.collab_battle_recompute(COALESCE(NEW.battle_id, OLD.battle_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS collab_battle_judge_recompute ON public.collab_battle_judges;
CREATE TRIGGER collab_battle_judge_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.collab_battle_judges
FOR EACH ROW EXECUTE FUNCTION public.trg_collab_battle_judge_recompute();

-- Recompute when reactions change on either slot
CREATE OR REPLACE FUNCTION public.trg_collab_reaction_battle_recompute()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_slot UUID;
  v_battle UUID;
BEGIN
  v_slot := COALESCE(NEW.slot_id, OLD.slot_id);
  SELECT id INTO v_battle FROM public.collab_battles
   WHERE slot_a_id = v_slot OR slot_b_id = v_slot LIMIT 1;
  IF v_battle IS NOT NULL THEN
    PERFORM public.collab_battle_recompute(v_battle);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS collab_reaction_battle_recompute ON public.collab_reactions;
CREATE TRIGGER collab_reaction_battle_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.collab_reactions
FOR EACH ROW EXECUTE FUNCTION public.trg_collab_reaction_battle_recompute();

ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_battle_judges;