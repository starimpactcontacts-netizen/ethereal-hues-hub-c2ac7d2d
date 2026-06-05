
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_chat_bubble text;

INSERT INTO public.shop_items (name, description, category, item_type, price, rarity, is_active)
VALUES (
  'Comic',
  'A pop-art comic starburst chat bubble — your messages explode onto the screen everywhere chat lives.',
  'chat_bubble',
  'cosmetic',
  500,
  'rare',
  true
)
ON CONFLICT DO NOTHING;
