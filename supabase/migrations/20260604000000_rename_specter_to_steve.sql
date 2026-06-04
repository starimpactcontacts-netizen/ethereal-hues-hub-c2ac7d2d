-- Rename SPECTER aura → STEVE with updated description
UPDATE public.shop_items
SET
  name        = 'STEVE',
  description = 'Minecraft drip. Your name jumps across the screen in pixel-block grass green like you just hit a creeper.'
WHERE name = 'SPECTER'
  AND category = 'aura';

-- Update any profiles that had equipped_aura = 'specter' → 'steve'
UPDATE public.profiles
SET equipped_aura = 'steve'
WHERE equipped_aura = 'specter';
