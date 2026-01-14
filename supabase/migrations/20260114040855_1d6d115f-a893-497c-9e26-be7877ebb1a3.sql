-- Create shop item categories enum
CREATE TYPE public.shop_item_type AS ENUM ('cosmetic', 'digital', 'physical');

-- Create redemption status enum  
CREATE TYPE public.redemption_status AS ENUM ('pending', 'approved', 'fulfilled', 'rejected');

-- Shop items table (what's available to buy)
CREATE TABLE public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  item_type shop_item_type NOT NULL DEFAULT 'cosmetic',
  price INTEGER NOT NULL DEFAULT 100,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER, -- NULL means unlimited
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view active shop items
CREATE POLICY "Anyone can view active shop items"
ON public.shop_items
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage shop items
CREATE POLICY "Admins can manage shop items"
ON public.shop_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Redemptions table (purchase requests)
CREATE TABLE public.redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  status redemption_status NOT NULL DEFAULT 'pending',
  points_spent INTEGER NOT NULL,
  admin_notes TEXT,
  shipping_info JSONB, -- For physical items: {name, address, etc}
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfilled_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view their redemptions"
ON public.redemptions
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Users can create redemptions
CREATE POLICY "Users can create redemptions"
ON public.redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all redemptions
CREATE POLICY "Admins can manage redemptions"
ON public.redemptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add spendable_index to profiles (earned from QOI scores, can be spent)
ALTER TABLE public.profiles
ADD COLUMN spendable_index INTEGER NOT NULL DEFAULT 0;

-- Function to award spendable index when submission is scored
CREATE OR REPLACE FUNCTION public.award_spendable_index_on_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a submission is scored, award the QOI score as spendable index
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    UPDATE public.profiles
    SET spendable_index = spendable_index + FLOOR(NEW.qoi_score)::INTEGER
    WHERE id = NEW.user_id;
  END IF;
  
  -- If a scored submission is deleted or re-scored, adjust accordingly
  IF OLD.status = 'scored' AND OLD.qoi_score IS NOT NULL AND (NEW.status != 'scored' OR NEW.qoi_score IS NULL) THEN
    UPDATE public.profiles
    SET spendable_index = GREATEST(0, spendable_index - FLOOR(OLD.qoi_score)::INTEGER)
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for awarding spendable index
CREATE TRIGGER on_submission_scored_award_index
AFTER UPDATE ON public.event_participations
FOR EACH ROW
EXECUTE FUNCTION public.award_spendable_index_on_score();

-- Function to spend index points
CREATE OR REPLACE FUNCTION public.spend_index(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT spendable_index INTO current_balance FROM public.profiles WHERE id = p_user_id;
  
  IF current_balance >= p_amount THEN
    UPDATE public.profiles
    SET spendable_index = spendable_index - p_amount
    WHERE id = p_user_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Update timestamp trigger for new tables
CREATE TRIGGER update_shop_items_updated_at
BEFORE UPDATE ON public.shop_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_redemptions_updated_at
BEFORE UPDATE ON public.redemptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();