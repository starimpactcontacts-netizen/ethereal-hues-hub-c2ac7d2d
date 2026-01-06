-- Create crew role enum
CREATE TYPE public.crew_role AS ENUM ('owner', 'officer', 'member');

-- Create crews table
CREATE TABLE public.crews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  emblem TEXT NOT NULL DEFAULT 'shield',
  min_league public.league_tier NOT NULL DEFAULT 'open',
  join_type TEXT NOT NULL DEFAULT 'open' CHECK (join_type IN ('open', 'invite_only')),
  owner_id UUID NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crew members table
CREATE TABLE public.crew_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.crew_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crew_id, user_id),
  UNIQUE(user_id) -- User can only be in one crew
);

-- Create crew join requests table
CREATE TABLE public.crew_join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crew_id, user_id)
);

-- Create crew messages table
CREATE TABLE public.crew_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add crew_id to profiles
ALTER TABLE public.profiles ADD COLUMN crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_messages ENABLE ROW LEVEL SECURITY;

-- Function to check if user is crew owner or officer
CREATE OR REPLACE FUNCTION public.is_crew_staff(check_crew_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crew_members
    WHERE crew_id = check_crew_id
      AND user_id = check_user_id
      AND role IN ('owner', 'officer')
  )
$$;

-- Function to check if user is crew owner
CREATE OR REPLACE FUNCTION public.is_crew_owner(check_crew_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crew_members
    WHERE crew_id = check_crew_id
      AND user_id = check_user_id
      AND role = 'owner'
  )
$$;

-- Crews RLS policies
CREATE POLICY "Anyone can view crews" ON public.crews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create crews" ON public.crews FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update crew" ON public.crews FOR UPDATE USING (public.is_crew_owner(id, auth.uid()));
CREATE POLICY "Owner can delete crew" ON public.crews FOR DELETE USING (public.is_crew_owner(id, auth.uid()));

-- Crew members RLS policies
CREATE POLICY "Anyone can view crew members" ON public.crew_members FOR SELECT USING (true);
CREATE POLICY "Staff can add members" ON public.crew_members FOR INSERT WITH CHECK (
  public.is_crew_staff(crew_id, auth.uid()) OR auth.uid() = user_id
);
CREATE POLICY "Owner can update member roles" ON public.crew_members FOR UPDATE USING (public.is_crew_owner(crew_id, auth.uid()));
CREATE POLICY "Staff can remove members or self-leave" ON public.crew_members FOR DELETE USING (
  public.is_crew_staff(crew_id, auth.uid()) OR auth.uid() = user_id
);

-- Crew join requests RLS policies
CREATE POLICY "Staff can view requests" ON public.crew_join_requests FOR SELECT USING (
  public.is_crew_staff(crew_id, auth.uid()) OR auth.uid() = user_id
);
CREATE POLICY "Users can create requests" ON public.crew_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can update requests" ON public.crew_join_requests FOR UPDATE USING (public.is_crew_staff(crew_id, auth.uid()));
CREATE POLICY "Staff or requester can delete" ON public.crew_join_requests FOR DELETE USING (
  public.is_crew_staff(crew_id, auth.uid()) OR auth.uid() = user_id
);

-- Crew messages RLS policies
CREATE POLICY "Members can view crew messages" ON public.crew_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_messages.crew_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.crew_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_messages.crew_id AND user_id = auth.uid())
);

-- Enable realtime for crew messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_messages;

-- Trigger to update member count
CREATE OR REPLACE FUNCTION public.update_crew_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.crews SET member_count = member_count + 1 WHERE id = NEW.crew_id;
    UPDATE public.profiles SET crew_id = NEW.crew_id WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.crews SET member_count = member_count - 1 WHERE id = OLD.crew_id;
    UPDATE public.profiles SET crew_id = NULL WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_crew_member_change
AFTER INSERT OR DELETE ON public.crew_members
FOR EACH ROW EXECUTE FUNCTION public.update_crew_member_count();

-- Trigger to update crews updated_at
CREATE TRIGGER update_crews_updated_at
BEFORE UPDATE ON public.crews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();