-- ═══════════════════════════════════════════════════════
-- AURAS LAUNCH — 3 cosmetic name-tag effects
-- ═══════════════════════════════════════════════════════

-- 1. Add equipped_aura column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipped_aura TEXT DEFAULT NULL;

-- 2. Insert the 3 launch auras into shop_items
--    Prices account for the fact that top players hold millions of rings.
INSERT INTO public.shop_items (name, description, category, item_type, price, is_active, rarity)
VALUES
  (
    'SPECTER',
    'Your name haunts the scoreboard — a ghostly blue-white flicker that pulses like a signal from the other side.',
    'aura',
    'cosmetic',
    120000,
    true,
    'rare'
  ),
  (
    'HELLFIRE',
    'Your name burns. A volatile red-orange flame glow that flickers like your edits are straight up on fire.',
    'aura',
    'cosmetic',
    450000,
    true,
    'epic'
  ),
  (
    'SOVEREIGN',
    'Gold shimmer. Reserved for those who run the game. Your name gleams like it already won.',
    'aura',
    'cosmetic',
    2000000,
    true,
    'legendary'
  );
