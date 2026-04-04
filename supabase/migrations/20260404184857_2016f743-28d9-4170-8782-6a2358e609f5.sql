
-- Migrate the live competition
INSERT INTO public.competitions (id, name, description, theme, creator_id, creator_username, creator_avatar_url, league, scoring_mode, max_players, current_players, cover_image_url, status, started_at, deadline, index_reward_pool, slug, created_at, updated_at)
VALUES (
  'ca794d22-aa79-4dd0-a074-64acb9cb543c',
  'Best football edit',
  NULL,
  'Make your best football edit',
  'a432262c-5781-49a8-b4e1-5600549426a2',
  'Gladiator',
  NULL,
  'open',
  'judged',
  100,
  1,
  'https://tmfnqnmyxxydrxwjkaiq.supabase.co/storage/v1/object/public/loop-media/competitions/a432262c-5781-49a8-b4e1-5600549426a2/1775327113177.jpeg',
  'live',
  '2026-04-04 18:25:20.229243+00',
  '2026-04-05 06:25:19.766+00',
  0,
  'best-football-edit',
  '2026-04-04 18:25:20.229243+00',
  '2026-04-04 18:25:20.229243+00'
)
ON CONFLICT (id) DO NOTHING;

-- Migrate participant
INSERT INTO public.competition_participants (competition_id, user_id, username, avatar_url, joined_at)
VALUES (
  'ca794d22-aa79-4dd0-a074-64acb9cb543c',
  'a432262c-5781-49a8-b4e1-5600549426a2',
  'Gladiator',
  NULL,
  '2026-04-04 18:25:20.580226+00'
)
ON CONFLICT DO NOTHING;
