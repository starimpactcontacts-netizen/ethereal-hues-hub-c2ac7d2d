ALTER TABLE public.shop_items
ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'common';

ALTER TABLE public.shop_items
ADD CONSTRAINT shop_items_rarity_check
CHECK (rarity IN ('common','uncommon','rare','epic','legendary','mythic'));

UPDATE public.shop_items SET rarity = 'epic' WHERE name = 'Obsidian Frame';
UPDATE public.shop_items SET rarity = 'mythic' WHERE name = 'OG Claim';