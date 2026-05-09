INSERT INTO public.notifications (user_id, type, title, message, data)
SELECT
  u.id,
  'announcement',
  'LOOPGATE v1.1 — Lobby Refresh',
  'Cleaner competition lobbies, smarter matchmaking screen, and a live info ticker that walks you through how each battle starts. Mute remote editors in voice chat with a tap. Bolder fonts across the Arena.',
  jsonb_build_object(
    'version', '1.1',
    'kind', 'platform_update',
    'highlights', jsonb_build_array(
      'Live info ticker on every lobby header',
      'Mute or unmute any voice chat member with one tap',
      'Listen-only voice — no mic prompt until you Unmute',
      'Cleaner Competitions list — bolder, less clutter',
      'Matchmaking lobby redesigned with rotating tips'
    )
  )
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n
  WHERE n.user_id = u.id
    AND n.type = 'announcement'
    AND n.data->>'version' = '1.1'
);