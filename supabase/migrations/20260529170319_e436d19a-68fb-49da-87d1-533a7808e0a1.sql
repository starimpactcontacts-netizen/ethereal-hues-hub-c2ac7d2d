ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_gift_modal jsonb;

UPDATE public.profiles
SET rings = COALESCE(rings, 0) + 1000000,
    pending_gift_modal = jsonb_build_object(
      'type', 'thank_you',
      'title', 'Thank you for playing Loopgate',
      'message', 'We appreciate you. Enjoy 1,000,000 Rings on the house.',
      'rings', 1000000,
      'granted_at', now()
    )
WHERE id = '13817084-0581-4f51-9d80-e996dba45631';