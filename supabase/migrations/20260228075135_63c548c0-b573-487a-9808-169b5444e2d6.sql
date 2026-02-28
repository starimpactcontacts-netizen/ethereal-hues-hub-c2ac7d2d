
-- Add missing columns to shop_items
ALTER TABLE public.shop_items 
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'avatar_decoration',
  ADD COLUMN IF NOT EXISTS is_limited BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_claimed INTEGER NOT NULL DEFAULT 0;

-- Create shop_purchases table
CREATE TABLE public.shop_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
ON public.shop_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can purchase items"
ON public.shop_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Increment claim count trigger
CREATE OR REPLACE FUNCTION public.increment_shop_item_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.shop_items
  SET total_claimed = total_claimed + 1
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_shop_purchase
AFTER INSERT ON public.shop_purchases
FOR EACH ROW
EXECUTE FUNCTION public.increment_shop_item_claims();

-- Insert OG Claim item (free, limited until March 5th)
INSERT INTO public.shop_items (name, description, category, item_type, price, image_url, is_active, stock, is_limited, available_until)
VALUES (
  'OG Claim',
  'Exclusive badge for the earliest Loopgate members. Claim it before it''s gone forever.',
  'badge',
  'cosmetic',
  0,
  NULL,
  true,
  999999,
  true,
  '2026-03-05T23:59:59Z'
);
