-- Gift all 3 auras to @quinx
INSERT INTO public.shop_purchases (user_id, item_id, is_equipped)
SELECT
  p.id,
  si.id,
  false
FROM public.profiles p
CROSS JOIN public.shop_items si
WHERE LOWER(p.username) = 'quinx'
  AND si.name IN ('SPECTER', 'HELLFIRE', 'SOVEREIGN')
  AND si.category = 'aura'
ON CONFLICT DO NOTHING;
