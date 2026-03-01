-- Add equipped status to shop purchases
ALTER TABLE public.shop_purchases ADD COLUMN is_equipped BOOLEAN NOT NULL DEFAULT false;
