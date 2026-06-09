
CREATE OR REPLACE FUNCTION public.close_due_versus_inspo_battles()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  w public.versus_inspo_winner;
  rings_add int;
  index_add int;
  xp_add int;
  closed_count int := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.versus_inspo_battles
    WHERE status = 'voting' AND voting_ends_at IS NOT NULL AND voting_ends_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    IF r.creator_votes > r.inspo_votes THEN
      w := 'creator'; rings_add := 30; index_add := 10; xp_add := 50;
    ELSIF r.inspo_votes > r.creator_votes THEN
      w := 'inspo'; rings_add := 0; index_add := 0; xp_add := 5;
    ELSE
      w := 'tie'; rings_add := 0; index_add := 0; xp_add := 10;
    END IF;

    UPDATE public.versus_inspo_battles
      SET status = 'decided',
          winner = w,
          rings_awarded = rings_add,
          index_awarded = index_add,
          xp_awarded = xp_add,
          updated_at = now()
      WHERE id = r.id;

    UPDATE public.profiles
      SET rings = COALESCE(rings,0) + rings_add,
          global_index_score = COALESCE(global_index_score,0) + index_add,
          spendable_index = COALESCE(spendable_index,0) + index_add
      WHERE id = r.creator_id;

    IF xp_add > 0 THEN
      INSERT INTO public.xp_history (user_id, amount, source, description)
      VALUES (r.creator_id, xp_add, 'versus_inspo_' || w::text,
              CASE w WHEN 'creator' THEN 'Won Versus Inspo battle'
                     WHEN 'inspo' THEN 'Versus Inspo consolation'
                     ELSE 'Versus Inspo tie' END);
    END IF;

    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      r.creator_id,
      'versus_inspo_decided',
      CASE w WHEN 'creator' THEN 'You beat the inspo!'
             WHEN 'inspo' THEN 'Inspo won this round'
             ELSE 'Versus Inspo tied' END,
      CASE w WHEN 'creator' THEN 'Your edit won the public vote. +30 Rings, +10 Index, +50 XP.'
             WHEN 'inspo' THEN 'Inspo edged you out. +5 XP — try again.'
             ELSE 'Dead heat. +10 XP.' END,
      jsonb_build_object('link', '/versus/' || r.id::text, 'battle_id', r.id)
    );

    closed_count := closed_count + 1;
  END LOOP;
  RETURN closed_count;
END $$;
