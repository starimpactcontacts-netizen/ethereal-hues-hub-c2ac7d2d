-- Create house type enum
CREATE TYPE public.house_type AS ENUM ('public', 'prestige');

-- Create house role enum  
CREATE TYPE public.house_role AS ENUM ('member', 'captain', 'judge');

-- Create houses table
CREATE TABLE public.houses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type public.house_type NOT NULL DEFAULT 'public',
  symbol TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  bonuses JSONB NOT NULL DEFAULT '{}'::jsonb,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  member_count INTEGER NOT NULL DEFAULT 0,
  avg_qoi NUMERIC DEFAULT 0,
  prestige_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create house members table
CREATE TABLE public.house_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id TEXT NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.house_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create house applications table
CREATE TABLE public.house_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id TEXT NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, status) 
);

-- Add house_id to profiles for quick access
ALTER TABLE public.profiles ADD COLUMN house_id TEXT REFERENCES public.houses(id);

-- Add last house change tracking
ALTER TABLE public.profiles ADD COLUMN house_changed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_applications ENABLE ROW LEVEL SECURITY;

-- Houses RLS policies
CREATE POLICY "Anyone can view houses" ON public.houses FOR SELECT USING (true);
CREATE POLICY "Admins can manage houses" ON public.houses FOR ALL USING (has_role(auth.uid(), 'admin'));

-- House members RLS policies
CREATE POLICY "Anyone can view house members" ON public.house_members FOR SELECT USING (true);
CREATE POLICY "Users can join houses" ON public.house_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave houses" ON public.house_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage members" ON public.house_members FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Judges can manage members" ON public.house_members FOR ALL USING (has_role(auth.uid(), 'judge'));

-- House applications RLS policies
CREATE POLICY "Users can view own applications" ON public.house_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Judges can view all applications" ON public.house_applications FOR SELECT USING (has_role(auth.uid(), 'judge') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create applications" ON public.house_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can withdraw applications" ON public.house_applications FOR DELETE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Judges can manage applications" ON public.house_applications FOR UPDATE USING (has_role(auth.uid(), 'judge') OR has_role(auth.uid(), 'admin'));

-- Function to update house member count
CREATE OR REPLACE FUNCTION public.update_house_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.houses SET member_count = member_count + 1 WHERE id = NEW.house_id;
    UPDATE public.profiles SET house_id = NEW.house_id WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.houses SET member_count = member_count - 1 WHERE id = OLD.house_id;
    UPDATE public.profiles SET house_id = NULL WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for member count
CREATE TRIGGER update_house_member_count_trigger
AFTER INSERT OR DELETE ON public.house_members
FOR EACH ROW
EXECUTE FUNCTION public.update_house_member_count();

-- Function to check house change cooldown (30 days)
CREATE OR REPLACE FUNCTION public.can_change_house(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT house_changed_at + INTERVAL '30 days' < now() 
     FROM public.profiles 
     WHERE id = user_uuid),
    true
  )
$$;

-- Insert the 10 houses
INSERT INTO public.houses (id, name, type, symbol, primary_color, secondary_color, description, lore, bonuses, requires_approval) VALUES
('cartel', 'House of Cartel', 'public', 'broken-crown', '#E3B341', '#0A0A0A', 'The misfits, grinders, chaos-born prodigies.', 'The grinders, outcasts, chaos-born prodigies. They rise from nothing and shake the arena.', '{"lateSubmissionBoost": 0.05, "chaosStyleBoost": 0.05, "moraleBoostBehind": 0.10}', true),
('vanta', 'House Vanta', 'public', 'wolf', '#8B0000', '#0A0A0A', 'For editors who thrive in darkness.', 'For editors who thrive in darkness. Cinematic, villain energy.', '{"darkGradeScoring": 0.05, "ambientMoodScore": 0.03}', true),
('solaris', 'House Solaris', 'public', 'sunburst', '#FFD700', '#FFA500', 'Trend energy. Quick-swipe motion cuts.', 'Trend energy. Quick-swipe motion cuts. Aesthetic beats.', '{"pacingScore": 0.05, "aestheticScoring": 0.05}', true),
('mythos', 'House Mythos', 'public', 'rune-book', '#8B4513', '#D4AF37', 'Editors who build stories and emotion arcs.', 'Editors who build stories, emotion arcs, trailer-level narratives.', '{"storyCohesion": 0.05, "emotionalResonance": 0.03}', true),
('chaos', 'House Chaos', 'public', 'fractured-triangle', '#FF4500', '#1A1A1A', 'Glitch gods. VFX risktakers.', 'Glitch gods. VFX risktakers. Break-the-rules editors.', '{"experimentalScore": 0.05, "innovationRating": 0.04}', true),
('spectra', 'House Spectra', 'public', 'prism', '#9400D3', '#00CED1', 'Colorists supreme. Vibrance artisans.', 'Colorists supreme. LUT creators. Vibrance artisans.', '{"colorGradingScore": 0.05, "aestheticAccuracy": 0.05}', true),
('nova', 'House Nova', 'public', 'shooting-star', '#87CEEB', '#FFFFFF', 'New talent, rising fast.', 'New talent, rising fast. The academy house.', '{"penaltyResistance": 0.20, "consistencySupport": 0.10}', false),
('requiem', 'House Requiem', 'public', 'skull-headphones', '#2F2F2F', '#C0C0C0', 'Beat-synced demons. Rhythm perfectionists.', 'Beat-synced demons. Rhythm perfectionists.', '{"audioSyncScore": 0.05, "motionTimingScore": 0.03}', true),
('apex', 'House Apex', 'public', 'crowned-eagle', '#FFD700', '#1A1A1A', 'Top-tier editors with consistent excellence.', 'Top-tier editors with consistent excellence.', '{"qoiStability": 0.05, "rankProtection": 0.02}', true),
('phantom', 'House Phantom', 'prestige', 'white-mask', '#FFFFFF', '#1A1A1A', 'Chosen few. Platform ghosts.', 'Chosen few. Platform ghosts. The elite among elites.', '{"qoiBoost": 0.07, "housePrestigeMultiplier": 0.10}', true);