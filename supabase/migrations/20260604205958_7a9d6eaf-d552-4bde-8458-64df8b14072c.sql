UPDATE public.profiles p
SET equipped_aura = lower(si.name)
FROM public.shop_purchases sp
JOIN public.shop_items si ON si.id = sp.item_id
WHERE sp.user_id = p.id
  AND sp.is_equipped = true
  AND si.category = 'aura'
  AND p.equipped_aura IS DISTINCT FROM lower(si.name);