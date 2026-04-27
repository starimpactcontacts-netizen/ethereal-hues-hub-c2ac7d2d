
-- Battles: bump defaults & backfill
ALTER TABLE public.battles ALTER COLUMN winner_index_awarded SET DEFAULT 2000;
ALTER TABLE public.battles ALTER COLUMN loser_index_penalty SET DEFAULT 500;
UPDATE public.battles SET winner_index_awarded = 2000 WHERE winner_index_awarded < 2000;
UPDATE public.battles SET loser_index_penalty = 500 WHERE loser_index_penalty < 500;

-- Featured drops: bump defaults & 100x existing rows
ALTER TABLE public.featured_drops ALTER COLUMN xp_reward SET DEFAULT 5000;
ALTER TABLE public.featured_drops ALTER COLUMN index_reward SET DEFAULT 3000;
UPDATE public.featured_drops SET xp_reward = xp_reward * 100 WHERE xp_reward < 5000;
UPDATE public.featured_drops SET index_reward = index_reward * 100 WHERE index_reward < 3000;
