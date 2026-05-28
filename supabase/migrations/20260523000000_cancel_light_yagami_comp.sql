-- Award 1,000,000 rings to every user who submitted to the Light Yagami competition
UPDATE public.profiles
SET rings = rings + 1000000
WHERE id IN (
  SELECT ep.user_id
  FROM public.event_participations ep
  JOIN public.events e ON ep.event_id = e.id::text
  WHERE e.slug = 'light-yagami-edit-competition'
);

-- Insert one-time cancellation notification for each affected user
INSERT INTO public.notifications (user_id, type, title, message, data)
SELECT
  ep.user_id,
  'comp_cancelled'                                                         AS type,
  'Competition Cancelled'                                                  AS title,
  'The Light Yagami Edit Comp has been cancelled due to low submissions. As compensation, 1,000,000 rings have been added to your account.'
                                                                           AS message,
  jsonb_build_object(
    'slug',          'light-yagami-edit-competition',
    'rings_awarded', 1000000,
    'event_title',   'Light Yagami Edit Comp'
  )                                                                        AS data
FROM public.event_participations ep
JOIN public.events e ON ep.event_id = e.id::text
WHERE e.slug = 'light-yagami-edit-competition';

-- Mark the event as closed
UPDATE public.events
SET    status     = 'closed',
       updated_at = now()
WHERE  slug = 'light-yagami-edit-competition';
