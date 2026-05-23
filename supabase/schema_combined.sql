-- ============================================================
-- Loopgate combined schema migration
-- Generated 2026-05-23T20:38:48Z from 355 migration files
-- Run this in the Supabase SQL editor on the new project.
-- ============================================================


-- ── migration: 20260103004421_5a3962b6-da43-4e8e-a3c7-a1e08e8ae872.sql ─────────────────────────────────────────
-- Create enum for leagues
CREATE TYPE public.league_tier AS ENUM ('open', 'pro', 'elite');

-- Create enum for platform types
CREATE TYPE public.platform_type AS ENUM ('tiktok', 'instagram', 'youtube');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  league league_tier NOT NULL DEFAULT 'open',
  global_index_score DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  rules_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create connected platforms table
CREATE TABLE public.connected_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform platform_type NOT NULL,
  platform_username TEXT NOT NULL,
  platform_url TEXT NOT NULL,
  follower_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- Create event participations table
CREATE TABLE public.event_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id TEXT NOT NULL,
  submission_url TEXT NOT NULL,
  platform platform_type NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  quality_score DECIMAL(5,2),
  originality_score DECIMAL(5,2),
  impact_score DECIMAL(5,2),
  qoi_score DECIMAL(5,2),
  final_rank INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  judged_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, event_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participations ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Connected platforms policies
CREATE POLICY "Users can view all connected platforms"
  ON public.connected_platforms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own platforms"
  ON public.connected_platforms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platforms"
  ON public.connected_platforms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own platforms"
  ON public.connected_platforms FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Event participations policies
CREATE POLICY "Anyone can view participations"
  ON public.event_participations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can submit to events"
  ON public.event_participations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update participations"
  ON public.event_participations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if username is available
CREATE OR REPLACE FUNCTION public.is_username_available(check_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = check_username
  )
$$;

-- ── migration: 20260103170454_307de11c-71c5-4a78-a0ae-d35ae96d7141.sql ─────────────────────────────────────────
-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  ip TEXT DEFAULT 'Film',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('live', 'pending', 'closed')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT DEFAULT 'Loopgate Arena',
  league TEXT NOT NULL DEFAULT 'open' CHECK (league IN ('open', 'elite', 'regional')),
  prize_pool TEXT,
  poster_url TEXT,
  rules TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view events
CREATE POLICY "Anyone can view events" 
ON public.events 
FOR SELECT 
USING (true);

-- Only admins can manage events
CREATE POLICY "Admins can manage events" 
ON public.events 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create active sessions table for tracking active users
CREATE TABLE public.active_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on active_sessions
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own sessions
CREATE POLICY "Users can manage their own sessions" 
ON public.active_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Anyone can count active sessions (for stats)
CREATE POLICY "Anyone can view active sessions count" 
ON public.active_sessions 
FOR SELECT 
USING (true);

-- Create unique constraint for user sessions
CREATE UNIQUE INDEX active_sessions_user_id_idx ON public.active_sessions(user_id);

-- Function to update user's active session (upsert)
CREATE OR REPLACE FUNCTION public.update_active_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.active_sessions (user_id, last_seen)
  VALUES (auth.uid(), now())
  ON CONFLICT (user_id) 
  DO UPDATE SET last_seen = now();
END;
$$;

-- Function to calculate and update league based on ranking
CREATE OR REPLACE FUNCTION public.update_user_league()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users INTEGER;
  user_rank INTEGER;
  percentile NUMERIC;
  new_league league_tier;
  has_win BOOLEAN;
BEGIN
  -- Count total users with index scores
  SELECT COUNT(*) INTO total_users 
  FROM public.profiles 
  WHERE global_index_score > 0;
  
  IF total_users = 0 THEN
    NEW.league := 'open';
    RETURN NEW;
  END IF;
  
  -- Get user's rank (1 = highest score)
  SELECT COUNT(*) + 1 INTO user_rank
  FROM public.profiles
  WHERE global_index_score > NEW.global_index_score;
  
  -- Calculate percentile (lower is better)
  percentile := (user_rank::NUMERIC / total_users) * 100;
  
  -- Check if user has any wins
  has_win := NEW.total_wins > 0;
  
  -- Determine league
  IF percentile <= 1 THEN
    new_league := 'elite';
  ELSIF percentile <= 15 AND has_win THEN
    new_league := 'pro';
  ELSE
    new_league := 'open';
  END IF;
  
  NEW.league := new_league;
  RETURN NEW;
END;
$$;

-- Trigger to auto-update league when index score changes
CREATE TRIGGER update_league_on_score_change
BEFORE UPDATE OF global_index_score, total_wins ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_league();

-- Function to recalculate index score from event participations
CREATE OR REPLACE FUNCTION public.recalculate_user_index(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_score NUMERIC;
  total_count INTEGER;
  win_count INTEGER;
  rate NUMERIC;
BEGIN
  -- Calculate average QOI score from judged participations
  SELECT AVG(qoi_score), COUNT(*)
  INTO avg_score, total_count
  FROM public.event_participations
  WHERE user_id = user_uuid 
    AND status = 'scored'
    AND qoi_score IS NOT NULL;
  
  -- Count wins (rank 1)
  SELECT COUNT(*)
  INTO win_count
  FROM public.event_participations
  WHERE user_id = user_uuid 
    AND final_rank = 1
    AND status = 'scored';
  
  -- Calculate win rate
  IF total_count > 0 THEN
    rate := (win_count::NUMERIC / total_count) * 100;
  ELSE
    rate := 0;
  END IF;
  
  -- Update profile
  UPDATE public.profiles
  SET 
    global_index_score = COALESCE(avg_score, 0),
    total_events = total_count,
    total_wins = win_count,
    win_rate = rate
  WHERE id = user_uuid;
END;
$$;

-- Trigger to update user index when participation is scored
CREATE OR REPLACE FUNCTION public.on_participation_scored()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalculate user's index when their submission is scored
  IF NEW.status = 'scored' AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    PERFORM public.recalculate_user_index(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_index_on_score
AFTER UPDATE ON public.event_participations
FOR EACH ROW
EXECUTE FUNCTION public.on_participation_scored();

-- Enable realtime for rankings updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;

-- Add trigger for events updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ── migration: 20260103181432_ad83f7cc-8f9b-4de2-93ae-f0da336f1d42.sql ─────────────────────────────────────────
-- Create storage bucket for event posters
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to event posters
CREATE POLICY "Event posters are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-posters');

-- Allow admins to upload event posters
CREATE POLICY "Admins can upload event posters"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-posters' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update event posters
CREATE POLICY "Admins can update event posters"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-posters' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete event posters
CREATE POLICY "Admins can delete event posters"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-posters' AND public.has_role(auth.uid(), 'admin'));

-- Add category and region_tags columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Film',
ADD COLUMN IF NOT EXISTS region_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description text;

-- Add judge_id to event_participations for tracking who scored
ALTER TABLE public.event_participations
ADD COLUMN IF NOT EXISTS judge_id uuid REFERENCES auth.users(id);

-- ── migration: 20260103205534_211ca7a0-e5ba-44f8-b82f-2d5d66eeb7a0.sql ─────────────────────────────────────────
-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── migration: 20260103210413_a7a9ce74-fd67-4278-92c9-196860734ee4.sql ─────────────────────────────────────────
-- Add verification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_code text,
ADD COLUMN IF NOT EXISTS verification_requested_at timestamp with time zone;

-- Add index for verification lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_code ON public.profiles(verification_code) WHERE verification_code IS NOT NULL;

-- Ensure verification codes are unique when set
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_verification_code_unique ON public.profiles(verification_code) WHERE verification_code IS NOT NULL;

-- ── migration: 20260103222450_6126cb63-cdd8-488d-85ad-fae43ad87b41.sql ─────────────────────────────────────────
-- Add activity_status column to profiles for online/offline/busy status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activity_status text DEFAULT 'online';

-- Add constraint for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT check_activity_status CHECK (activity_status IN ('online', 'offline', 'busy'));

-- ── migration: 20260104022742_9929d215-c799-4662-8de9-2de9e75e7e4f.sql ─────────────────────────────────────────
-- Add bio column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN bio text DEFAULT NULL;

-- Add a check constraint for max length
ALTER TABLE public.profiles 
ADD CONSTRAINT bio_max_length CHECK (char_length(bio) <= 200);

-- ── migration: 20260104024103_63c42200-3dfe-4151-ba65-1672c8917615.sql ─────────────────────────────────────────
-- Add contact fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN email text,
ADD COLUMN discord text,
ADD COLUMN portfolio_url text;

-- ── migration: 20260104030649_2e51dd50-bb09-4156-bc4c-199a2ff2bf14.sql ─────────────────────────────────────────
-- Add 'judge' and 'dev' roles to the existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'judge';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dev';

-- ── migration: 20260104035626_29a3babb-a9cf-4ba9-a6d6-39769aba082a.sql ─────────────────────────────────────────
-- Add 'enterprise' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'enterprise';

-- ── migration: 20260104035717_69d5c0a3-8e55-4a7a-b810-d91bf2a123a8.sql ─────────────────────────────────────────
-- Create a table for enterprise campaigns/billing
CREATE TABLE public.enterprise_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  enterprise_user_id uuid NOT NULL,
  budget numeric DEFAULT 0,
  billing_status text DEFAULT 'pending' CHECK (billing_status IN ('pending', 'paid', 'outstanding', 'processing')),
  invoice_url text,
  asset_urls text[] DEFAULT '{}',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enterprise_campaigns ENABLE ROW LEVEL SECURITY;

-- Enterprise users can only see their own campaigns
CREATE POLICY "Enterprise users can view their own campaigns"
ON public.enterprise_campaigns
FOR SELECT
USING (auth.uid() = enterprise_user_id);

-- Enterprise users can create their own campaigns
CREATE POLICY "Enterprise users can create campaigns"
ON public.enterprise_campaigns
FOR INSERT
WITH CHECK (auth.uid() = enterprise_user_id AND has_role(auth.uid(), 'enterprise'::app_role));

-- Enterprise users can update their own campaigns
CREATE POLICY "Enterprise users can update their own campaigns"
ON public.enterprise_campaigns
FOR UPDATE
USING (auth.uid() = enterprise_user_id);

-- Admins can manage all campaigns
CREATE POLICY "Admins can manage all enterprise campaigns"
ON public.enterprise_campaigns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_enterprise_campaigns_updated_at
BEFORE UPDATE ON public.enterprise_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ── migration: 20260104054044_d94780e5-2659-4ae4-8f72-4fb972bc7c42.sql ─────────────────────────────────────────
-- Add region column to profiles table for geographic identification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Create index for region filtering
CREATE INDEX IF NOT EXISTS idx_profiles_region ON public.profiles(region);

-- ── migration: 20260104060711_2e6cf652-df6f-4bbf-a72f-9406a437e94e.sql ─────────────────────────────────────────
-- Allow anyone to view user roles for public badge display
CREATE POLICY "Anyone can view user roles"
ON public.user_roles
FOR SELECT
USING (true);

-- ── migration: 20260106055131_04b8116c-754f-46d7-ba07-74ad11057959.sql ─────────────────────────────────────────
-- Add display_name column for user's public name (can be anything, changeable anytime)
ALTER TABLE public.profiles 
ADD COLUMN display_name text;

-- Add username_changed_at to track when username was last changed (14-day cooldown)
ALTER TABLE public.profiles 
ADD COLUMN username_changed_at timestamp with time zone DEFAULT now();

-- Create function to check if username can be changed (14-day cooldown)
CREATE OR REPLACE FUNCTION public.can_change_username(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT username_changed_at + INTERVAL '14 days' < now() 
     FROM public.profiles 
     WHERE id = user_uuid),
    true
  )
$$;

-- Create function to get days until username can be changed
CREATE OR REPLACE FUNCTION public.days_until_username_change(user_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, 
    EXTRACT(DAY FROM (
      (SELECT username_changed_at + INTERVAL '14 days' FROM public.profiles WHERE id = user_uuid) - now()
    ))::integer
  )
$$;

-- ── migration: 20260106063155_306ebcea-7be3-461a-86a3-5f5bf5194df5.sql ─────────────────────────────────────────
-- Backfill email for existing profiles from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- ── migration: 20260106064258_d673722b-da37-4864-8bfd-217b1ac03859.sql ─────────────────────────────────────────
-- Create arena_messages table for real-time chat
CREATE TABLE public.arena_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id INTEGER NOT NULL CHECK (arena_id BETWEEN 1 AND 4),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.arena_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view arena messages"
ON public.arena_messages
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can send messages"
ON public.arena_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries by arena
CREATE INDEX idx_arena_messages_arena_id ON public.arena_messages(arena_id);
CREATE INDEX idx_arena_messages_created_at ON public.arena_messages(created_at DESC);

-- Enable realtime for arena_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_messages;

-- ── migration: 20260106071019_224ab4a7-0000-441a-ad58-f1101138261e.sql ─────────────────────────────────────────
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

-- ── migration: 20260106092023_3d5e396e-88b6-446b-8e88-d092cf2a5a4c.sql ─────────────────────────────────────────
-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that allows everyone (including unauthenticated) to read profiles
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- ── migration: 20260106093144_89e8d8d4-d1a4-41e6-88d8-253abc428c80.sql ─────────────────────────────────────────
-- Add avatar_url column to crews table for crew profile pictures
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage policies for crew avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('crew-avatars', 'crew-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view crew avatars
CREATE POLICY "Anyone can view crew avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'crew-avatars');

-- Allow crew owners to upload avatars
CREATE POLICY "Crew owners can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crew-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Allow crew owners to update avatars
CREATE POLICY "Crew owners can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'crew-avatars' AND auth.uid() IS NOT NULL);

-- Allow crew owners to delete avatars
CREATE POLICY "Crew owners can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'crew-avatars' AND auth.uid() IS NOT NULL);

-- ── migration: 20260106143429_909e5043-cc32-4c15-8547-aed3453e8b83.sql ─────────────────────────────────────────
-- Add XP and Level columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Create XP history table
CREATE TABLE public.xp_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on xp_history
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own XP history
CREATE POLICY "Users can view their own XP history"
ON public.xp_history FOR SELECT
USING (auth.uid() = user_id);

-- System can insert XP history (via security definer functions)
CREATE POLICY "System can insert XP history"
ON public.xp_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create daily XP tracking table for caps
CREATE TABLE public.daily_xp_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, action_type, date)
);

-- Enable RLS
ALTER TABLE public.daily_xp_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their daily tracking"
ON public.daily_xp_tracking FOR ALL
USING (auth.uid() = user_id);

-- Create login streaks table
CREATE TABLE public.login_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their streak"
ON public.login_streaks FOR ALL
USING (auth.uid() = user_id);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE
    WHEN xp_amount >= 7000 THEN 10
    WHEN xp_amount >= 4500 THEN 9
    WHEN xp_amount >= 3200 THEN 8
    WHEN xp_amount >= 2200 THEN 7
    WHEN xp_amount >= 1500 THEN 6
    WHEN xp_amount >= 1000 THEN 5
    WHEN xp_amount >= 600 THEN 4
    WHEN xp_amount >= 300 THEN 3
    WHEN xp_amount >= 100 THEN 2
    ELSE 1
  END;
END;
$$;

-- Trigger to auto-update level when XP changes
CREATE OR REPLACE FUNCTION public.update_level_on_xp_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.level := public.calculate_level_from_xp(NEW.xp);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_level
BEFORE INSERT OR UPDATE OF xp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_level_on_xp_change();

-- Function to award XP with history tracking
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_action TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_level INTEGER;
  updated_xp INTEGER;
  updated_level INTEGER;
BEGIN
  -- Get current level
  SELECT level INTO old_level FROM public.profiles WHERE id = p_user_id;
  
  -- Update XP
  UPDATE public.profiles 
  SET xp = xp + p_amount
  WHERE id = p_user_id
  RETURNING xp, level INTO updated_xp, updated_level;
  
  -- Record in history
  INSERT INTO public.xp_history (user_id, xp_amount, action, description)
  VALUES (p_user_id, p_amount, p_action, p_description);
  
  RETURN QUERY SELECT updated_xp, updated_level, (updated_level > old_level);
END;
$$;

-- Function to check and award daily capped XP (for chat messages)
CREATE OR REPLACE FUNCTION public.award_daily_capped_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT,
  p_daily_cap INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(xp_awarded INTEGER, new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_daily_xp INTEGER;
  actual_award INTEGER;
  result RECORD;
BEGIN
  -- Get or create daily tracking
  INSERT INTO public.daily_xp_tracking (user_id, action_type, xp_earned, date)
  VALUES (p_user_id, p_action_type, 0, CURRENT_DATE)
  ON CONFLICT (user_id, action_type, date) DO NOTHING;
  
  -- Get current daily XP for this action
  SELECT xp_earned INTO current_daily_xp
  FROM public.daily_xp_tracking
  WHERE user_id = p_user_id AND action_type = p_action_type AND date = CURRENT_DATE;
  
  -- Calculate how much we can actually award
  actual_award := LEAST(p_amount, p_daily_cap - COALESCE(current_daily_xp, 0));
  
  IF actual_award <= 0 THEN
    -- Already at cap
    SELECT xp, level INTO result FROM public.profiles WHERE id = p_user_id;
    RETURN QUERY SELECT 0, result.xp, result.level, false;
    RETURN;
  END IF;
  
  -- Update daily tracking
  UPDATE public.daily_xp_tracking
  SET xp_earned = xp_earned + actual_award
  WHERE user_id = p_user_id AND action_type = p_action_type AND date = CURRENT_DATE;
  
  -- Award the XP
  SELECT * INTO result FROM public.award_xp(p_user_id, actual_award, p_action_type, p_description);
  
  RETURN QUERY SELECT actual_award, result.new_xp, result.new_level, result.leveled_up;
END;
$$;

-- Function to process login streak
CREATE OR REPLACE FUNCTION public.process_login_streak(p_user_id UUID)
RETURNS TABLE(streak_xp INTEGER, current_streak INTEGER, new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak_record RECORD;
  xp_to_award INTEGER := 0;
  result RECORD;
BEGIN
  -- Get or create streak record
  INSERT INTO public.login_streaks (user_id, current_streak, last_login_date)
  VALUES (p_user_id, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO streak_record FROM public.login_streaks WHERE user_id = p_user_id;
  
  -- Check if already logged in today
  IF streak_record.last_login_date = CURRENT_DATE THEN
    SELECT xp, level INTO result FROM public.profiles WHERE id = p_user_id;
    RETURN QUERY SELECT 0, streak_record.current_streak, result.xp, result.level, false;
    RETURN;
  END IF;
  
  -- Update streak
  IF streak_record.last_login_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    UPDATE public.login_streaks
    SET current_streak = current_streak + 1,
        last_login_date = CURRENT_DATE,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE public.login_streaks
    SET current_streak = 1,
        last_login_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Get updated streak
  SELECT * INTO streak_record FROM public.login_streaks WHERE user_id = p_user_id;
  
  -- Determine XP based on streak milestones
  xp_to_award := CASE
    WHEN streak_record.current_streak = 30 THEN 300
    WHEN streak_record.current_streak = 7 THEN 100
    WHEN streak_record.current_streak = 2 THEN 20
    WHEN streak_record.current_streak = 1 THEN 10
    ELSE 0
  END;
  
  IF xp_to_award > 0 THEN
    SELECT * INTO result FROM public.award_xp(p_user_id, xp_to_award, 'login_streak', 'Day ' || streak_record.current_streak || ' login streak');
    RETURN QUERY SELECT xp_to_award, streak_record.current_streak, result.new_xp, result.new_level, result.leveled_up;
  ELSE
    SELECT xp, level INTO result FROM public.profiles WHERE id = p_user_id;
    RETURN QUERY SELECT 0, streak_record.current_streak, result.xp, result.level, false;
  END IF;
END;
$$;

-- Create index for faster XP history queries
CREATE INDEX idx_xp_history_user_created ON public.xp_history(user_id, created_at DESC);

-- ── migration: 20260108095430_4511ef49-4366-4a78-b617-e2120726b596.sql ─────────────────────────────────────────
-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  random_username TEXT;
BEGIN
  -- Generate a unique username from email prefix + random suffix
  random_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
  
  -- Ensure uniqueness by checking if it exists
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = random_username) LOOP
    random_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
  END LOOP;

  INSERT INTO public.profiles (
    id,
    email,
    username,
    display_name,
    created_at,
    updated_at,
    xp,
    level,
    league,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    random_username,
    SPLIT_PART(NEW.email, '@', 1),
    NOW(),
    NOW(),
    0,
    1,
    'open',
    false
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── migration: 20260113090548_42e85492-4810-49aa-b77b-7c5173f3b9db.sql ─────────────────────────────────────────
-- 1. Add is_banned and is_hidden columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS banned_reason text;

-- 2. Drop existing crew creation policies and replace with admin-only
DROP POLICY IF EXISTS "Authenticated users can create crews" ON public.crews;
DROP POLICY IF EXISTS "Owner can delete crew" ON public.crews;

-- 3. Only admins can create crews
CREATE POLICY "Only admins can create crews" 
ON public.crews 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Only admins can delete crews
CREATE POLICY "Only admins can delete crews" 
ON public.crews 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 5. Update profile SELECT policy to exclude hidden/banned users (except for admins and self)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Anyone can view non-hidden profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Always allow admins to see all
  has_role(auth.uid(), 'admin')
  -- Allow users to see their own profile
  OR auth.uid() = id
  -- Allow viewing non-hidden, non-banned profiles
  OR (is_hidden = false AND is_banned = false)
);

-- 6. Delete demo crews
DELETE FROM public.crew_members WHERE crew_id IN (
  SELECT id FROM public.crews WHERE name IN ('LOOPGATE HUB', 'Somali Scammer Group')
);
DELETE FROM public.crews WHERE name IN ('LOOPGATE HUB', 'Somali Scammer Group');

-- ── migration: 20260113102008_93670f78-26fa-416c-b8ed-1ba1203373bf.sql ─────────────────────────────────────────
-- Create trigger to filter profanity on arena messages
DROP TRIGGER IF EXISTS filter_arena_message_profanity ON public.arena_messages;
CREATE TRIGGER filter_arena_message_profanity
BEFORE INSERT OR UPDATE ON public.arena_messages
FOR EACH ROW
EXECUTE FUNCTION public.filter_message_profanity();

-- Create trigger to filter profanity on crew messages
DROP TRIGGER IF EXISTS filter_crew_message_profanity ON public.crew_messages;
CREATE TRIGGER filter_crew_message_profanity
BEFORE INSERT OR UPDATE ON public.crew_messages
FOR EACH ROW
EXECUTE FUNCTION public.filter_message_profanity();

-- Add RLS policy for dev/admin to delete arena messages
DROP POLICY IF EXISTS "Authority can delete arena messages" ON public.arena_messages;
CREATE POLICY "Authority can delete arena messages"
ON public.arena_messages
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'judge') OR 
  public.has_role(auth.uid(), 'dev')
);

-- Add RLS policy for dev/admin to delete crew messages
DROP POLICY IF EXISTS "Authority can delete crew messages" ON public.crew_messages;
CREATE POLICY "Authority can delete crew messages"
ON public.crew_messages
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'judge') OR 
  public.has_role(auth.uid(), 'dev')
);

-- Add RLS policy for dev/admin to update profiles (for banning)
DROP POLICY IF EXISTS "Authority can update any profile" ON public.profiles;
CREATE POLICY "Authority can update any profile"
ON public.profiles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'dev')
);

-- ── migration: 20260113103945_70bc9fef-f900-4781-8265-bb63a310a583.sql ─────────────────────────────────────────
-- Update profanity filter to be more aggressive (Roblox-style full hashtag replacement)
CREATE OR REPLACE FUNCTION public.filter_message_profanity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  filtered_text TEXT;
  profanity_words TEXT[] := ARRAY[
    -- Core profanity
    'fuck', 'fucking', 'fucked', 'fucker', 'fuckin', 'fck', 'fuk', 'f*ck', 'fu*k',
    'shit', 'shitting', 'shitty', 'bullshit', 'sh1t', 'sh*t',
    'bitch', 'bitches', 'bitching', 'b1tch', 'b*tch',
    'asshole', 'asses', 'a$$hole', 'a$$', '@ss',
    'damn', 'damned', 'dammit',
    'dick', 'dicks', 'dickhead', 'd1ck',
    'cock', 'cocks', 'c0ck',
    'pussy', 'pussies', 'p*ssy',
    'cunt', 'cunts', 'c*nt',
    'whore', 'whores', 'wh0re',
    'slut', 'sluts', 'sl*t',
    'bastard', 'bastards',
    'piss', 'pissed', 'pissing',
    'retard', 'retarded', 'r3tard',
    -- Slurs (zero tolerance)
    'fag', 'faggot', 'fags', 'f@g', 'f@ggot',
    'nigger', 'nigga', 'niggas', 'n1gger', 'n1gga', 'nigg@', 'n*gga', 'n*gger',
    'kike', 'spic', 'chink', 'gook', 'wetback', 'beaner',
    'jew', 'jews', -- when used as slur (will catch false positives but safer)
    -- Additional
    'twat', 'wanker', 'tosser',
    'bollocks', 'bugger', 'arse',
    -- Scam/harassment related
    'scammer', 'scam', 'scammed'
  ];
  word TEXT;
BEGIN
  filtered_text := NEW.message_text;
  
  -- Loop through each profanity word and replace ENTIRELY with hashtags (Roblox style)
  FOREACH word IN ARRAY profanity_words
  LOOP
    -- Replace entire word with hashtags of same length
    filtered_text := regexp_replace(
      filtered_text,
      '\m' || word || '\M',
      repeat('#', length(word)),
      'gi'
    );
  END LOOP;
  
  NEW.message_text := filtered_text;
  RETURN NEW;
END;
$function$;

-- ── migration: 20260114034359_6412cedf-225f-40d5-917f-451052bbe647.sql ─────────────────────────────────────────
-- Update handle_new_user to set username_changed_at to NULL so new users can change immediately
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  random_username TEXT;
BEGIN
  -- Generate a unique username from email prefix + random suffix
  random_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
  
  -- Ensure uniqueness by checking if it exists
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = random_username) LOOP
    random_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
  END LOOP;

  INSERT INTO public.profiles (
    id,
    email,
    username,
    display_name,
    created_at,
    updated_at,
    xp,
    level,
    league,
    onboarding_completed,
    username_changed_at  -- Set to NULL so first change is allowed immediately
  )
  VALUES (
    NEW.id,
    NEW.email,
    random_username,
    SPLIT_PART(NEW.email, '@', 1),
    NOW(),
    NOW(),
    0,
    1,
    'open',
    false,
    NULL  -- NULL allows immediate username change for new users
  );
  
  RETURN NEW;
END;
$function$;

-- ── migration: 20260114035022_c3e20c33-498c-4fa7-a25c-7d07f711a21e.sql ─────────────────────────────────────────
-- Add XP reward setting to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS xp_reward integer DEFAULT 50;

-- Add comment for clarity
COMMENT ON COLUMN public.events.xp_reward IS 'XP awarded to users when their submission is approved';

-- Track XP awarded for submissions so we can revoke it if declined
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS xp_awarded integer DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.event_participations.xp_awarded IS 'Amount of XP awarded for this submission (0 if declined or not yet approved)';

-- ── migration: 20260114035851_a1fb0bff-e56f-4f94-a9e3-884fbf6b1882.sql ─────────────────────────────────────────
-- Allow admins and devs to delete event participations (for removing invalid/stolen submissions)
CREATE POLICY "Admins can delete participations" 
ON public.event_participations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

-- ── migration: 20260114040855_1d6d115f-a893-497c-9e26-be7877ebb1a3.sql ─────────────────────────────────────────
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

-- ── migration: 20260114043851_093eff9b-7f62-4bd4-aa8c-c652f3d5a340.sql ─────────────────────────────────────────
-- Add policy for users to delete their own messages within 5 minutes
CREATE POLICY "Users can delete own messages within 5 minutes"
ON public.arena_messages
FOR DELETE
USING (
  auth.uid() = user_id 
  AND created_at > (now() - INTERVAL '5 minutes')
);

-- Same for crew messages
CREATE POLICY "Users can delete own crew messages within 5 minutes"
ON public.crew_messages
FOR DELETE
USING (
  auth.uid() = user_id 
  AND created_at > (now() - INTERVAL '5 minutes')
);

-- ── migration: 20260114060034_dd68f0c1-6017-47b9-a2ba-cc2611fc9c4e.sql ─────────────────────────────────────────
-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'submission_judged', 'rank_changed', 'event_starting', 'event_ended', 'achievement'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional data like event_id, new_rank, etc.
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can insert (for triggers/edge functions)
CREATE POLICY "Service can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create activity_feed table for public activity
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  activity_type TEXT NOT NULL, -- 'submission', 'rank_up', 'rank_down', 'win', 'achievement', 'new_editor'
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Everyone can view activity feed
CREATE POLICY "Anyone can view activity feed" 
ON public.activity_feed 
FOR SELECT 
USING (true);

-- Service role can insert
CREATE POLICY "Service can insert activity" 
ON public.activity_feed 
FOR INSERT 
WITH CHECK (true);

-- Index for fast queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_activity_feed_created_at ON public.activity_feed(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;

-- Create trigger to create notification when submission is judged
CREATE OR REPLACE FUNCTION public.notify_on_submission_scored()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  profile_username TEXT;
  profile_avatar TEXT;
BEGIN
  IF NEW.status = 'scored' AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- Get event title
    SELECT title INTO event_title FROM public.events WHERE id = NEW.event_id;
    
    -- Get user profile
    SELECT username, avatar_url INTO profile_username, profile_avatar 
    FROM public.profiles WHERE id = NEW.user_id;
    
    -- Create notification for user
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'submission_judged',
      'Your submission has been judged!',
      'Your entry in ' || COALESCE(event_title, 'an event') || ' received a QOI score of ' || ROUND(NEW.qoi_score::NUMERIC, 1),
      jsonb_build_object(
        'event_id', NEW.event_id,
        'qoi_score', NEW.qoi_score,
        'quality_score', NEW.quality_score,
        'originality_score', NEW.originality_score,
        'impact_score', NEW.impact_score
      )
    );
    
    -- Add to activity feed
    INSERT INTO public.activity_feed (user_id, username, avatar_url, activity_type, title, description, data)
    VALUES (
      NEW.user_id,
      COALESCE(profile_username, 'Unknown'),
      profile_avatar,
      'submission',
      profile_username || ' submitted to ' || COALESCE(event_title, 'an event'),
      'Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI',
      jsonb_build_object('event_id', NEW.event_id, 'qoi_score', NEW.qoi_score)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_submission_scored_notify
  AFTER INSERT OR UPDATE ON public.event_participations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_submission_scored();

-- ── migration: 20260114060106_0ddc8287-43b7-4d79-8f0e-28e12230f402.sql ─────────────────────────────────────────
-- Fix overly permissive INSERT policies by restricting to service role (triggers only)
-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service can insert activity" ON public.activity_feed;

-- Notifications are inserted by triggers (SECURITY DEFINER functions), so no user INSERT policy needed
-- Activity feed is inserted by triggers (SECURITY DEFINER functions), so no user INSERT policy needed
-- The trigger functions run with SECURITY DEFINER which bypasses RLS

-- ── migration: 20260114064515_d1504746-54a0-4db2-a40b-4b4ec65b0909.sql ─────────────────────────────────────────
-- Add archetype and software fields to profiles
ALTER TABLE public.profiles
ADD COLUMN archetype text DEFAULT NULL,
ADD COLUMN software text[] DEFAULT '{}'::text[];

-- Add category field to events for event archetype/category
ALTER TABLE public.events
ADD COLUMN editor_category text DEFAULT NULL;

-- ── migration: 20260114080510_141cba4f-3de7-4382-9574-0222cfd228f1.sql ─────────────────────────────────────────
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

-- ── migration: 20260114094729_fa8571a6-2360-48c4-8ddd-75718073e29b.sql ─────────────────────────────────────────
-- Create a public bucket for shop item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-items', 'shop-items', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public access to shop item images
CREATE POLICY "Anyone can view shop item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-items');

-- Create policy for admin uploads
CREATE POLICY "Admins can upload shop item images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shop-items' AND has_role(auth.uid(), 'admin'::app_role));

-- ── migration: 20260114095425_cf49ce85-8c2a-4ed8-af37-ba31ae1eaf21.sql ─────────────────────────────────────────
-- Add policy for admin updates and deletes on shop-items bucket
CREATE POLICY "Admins can update shop item images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'shop-items' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete shop item images"
ON storage.objects FOR DELETE
USING (bucket_id = 'shop-items' AND has_role(auth.uid(), 'admin'::app_role));

-- ── migration: 20260114095947_f8b42bbd-fd72-407f-9ff5-8d683a25fb57.sql ─────────────────────────────────────────
-- Create invites table
CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code TEXT NOT NULL UNIQUE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'submitted')),
  invite_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  first_submission_at TIMESTAMP WITH TIME ZONE,
  xp_awarded_send BOOLEAN DEFAULT false,
  xp_awarded_join BOOLEAN DEFAULT false,
  xp_awarded_submit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Users can view their own sent invites
CREATE POLICY "Users can view their own invites"
ON public.invites FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Users can create invites
CREATE POLICY "Users can create invites"
ON public.invites FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

-- Users can update their own invites (for tracking)
CREATE POLICY "Users can update their own invites"
ON public.invites FOR UPDATE
USING (auth.uid() = inviter_id);

-- Create index for invite code lookups
CREATE INDEX idx_invites_code ON public.invites(invite_code);
CREATE INDEX idx_invites_inviter ON public.invites(inviter_id);
CREATE INDEX idx_invites_invitee ON public.invites(invitee_id);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to create an invite and award XP
CREATE OR REPLACE FUNCTION public.create_invite(p_user_id UUID)
RETURNS TABLE(invite_code TEXT, xp_awarded INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  result RECORD;
BEGIN
  -- Generate unique code
  LOOP
    new_code := public.generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invites WHERE invites.invite_code = new_code);
  END LOOP;
  
  -- Create invite
  INSERT INTO public.invites (invite_code, inviter_id, xp_awarded_send)
  VALUES (new_code, p_user_id, true);
  
  -- Award XP for sending invite
  PERFORM public.award_xp(p_user_id, 20, 'invite_sent', 'Sent an invite to a friend');
  
  RETURN QUERY SELECT new_code, 20;
END;
$$;

-- Function to redeem an invite code
CREATE OR REPLACE FUNCTION public.redeem_invite(p_user_id UUID, p_code TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, inviter_xp INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Find the invite
  SELECT * INTO invite_record FROM public.invites WHERE invite_code = UPPER(p_code) AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or already used invite code'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Can't use own invite
  IF invite_record.inviter_id = p_user_id THEN
    RETURN QUERY SELECT false, 'Cannot use your own invite code'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Update invite
  UPDATE public.invites
  SET invitee_id = p_user_id,
      status = 'joined',
      joined_at = now(),
      xp_awarded_join = true,
      updated_at = now()
  WHERE id = invite_record.id;
  
  -- Award XP to inviter for successful join
  PERFORM public.award_xp(invite_record.inviter_id, 50, 'invite_joined', 'A friend joined using your invite');
  
  RETURN QUERY SELECT true, 'Welcome! Your friend earned XP for inviting you.'::TEXT, 50;
END;
$$;

-- Function to check and award submission bonus (call when user submits)
CREATE OR REPLACE FUNCTION public.check_invite_submission_bonus(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  xp_awarded INTEGER := 0;
BEGIN
  -- Find invite where this user joined within 24 hours and hasn't triggered submit bonus
  SELECT * INTO invite_record 
  FROM public.invites 
  WHERE invitee_id = p_user_id 
    AND status = 'joined'
    AND xp_awarded_submit = false
    AND joined_at > now() - INTERVAL '24 hours';
  
  IF FOUND THEN
    -- Update invite
    UPDATE public.invites
    SET status = 'submitted',
        first_submission_at = now(),
        xp_awarded_submit = true,
        updated_at = now()
    WHERE id = invite_record.id;
    
    -- Award bonus XP to inviter
    PERFORM public.award_xp(invite_record.inviter_id, 100, 'invite_submitted', 'Your invited friend submitted within 24 hours!');
    xp_awarded := 100;
  END IF;
  
  RETURN xp_awarded;
END;
$$;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_invites_updated_at
BEFORE UPDATE ON public.invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ── migration: 20260114102705_1cd2139d-50e3-4854-8e66-0b2852f3df38.sql ─────────────────────────────────────────
-- Update create_invite function to support custom codes
CREATE OR REPLACE FUNCTION public.create_invite(p_user_id uuid, p_custom_code text DEFAULT NULL)
 RETURNS TABLE(invite_code text, xp_awarded integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
  result RECORD;
BEGIN
  -- Use custom code if provided, otherwise generate random
  IF p_custom_code IS NOT NULL AND LENGTH(TRIM(p_custom_code)) >= 4 THEN
    new_code := UPPER(TRIM(p_custom_code));
    
    -- Check if custom code already exists
    IF EXISTS (SELECT 1 FROM public.invites WHERE invites.invite_code = new_code) THEN
      RAISE EXCEPTION 'Code already taken';
    END IF;
  ELSE
    -- Generate unique random code
    LOOP
      new_code := public.generate_invite_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invites WHERE invites.invite_code = new_code);
    END LOOP;
  END IF;
  
  -- Create invite
  INSERT INTO public.invites (invite_code, inviter_id, xp_awarded_send)
  VALUES (new_code, p_user_id, true);
  
  -- Award XP for sending invite
  PERFORM public.award_xp(p_user_id, 20, 'invite_sent', 'Sent an invite to a friend');
  
  RETURN QUERY SELECT new_code, 20;
END;
$function$;

-- ── migration: 20260114112728_4fea4552-4f13-4619-a685-855944c2c0df.sql ─────────────────────────────────────────

-- Create enum for event modes
CREATE TYPE public.event_mode AS ENUM ('standard', 'open_arena');

-- Create enum for round types
CREATE TYPE public.round_type AS ENUM ('open', 'elimination', 'threshold');

-- Create enum for advancement types
CREATE TYPE public.advancement_type AS ENUM ('top_x', 'percentage', 'manual', 'none');

-- Create enum for winner logic
CREATE TYPE public.winner_logic AS ENUM ('final_qoi', 'cumulative_qoi', 'manual');

-- Create enum for round status
CREATE TYPE public.round_status AS ENUM ('pending', 'active', 'completed');

-- Create enum for participant round status
CREATE TYPE public.participant_status AS ENUM ('active', 'advanced', 'eliminated', 'pending');

-- Add new columns to events table for Open Arena support
ALTER TABLE public.events
ADD COLUMN event_mode public.event_mode DEFAULT 'standard',
ADD COLUMN total_rounds INTEGER DEFAULT 1,
ADD COLUMN max_editors INTEGER DEFAULT NULL,
ADD COLUMN winner_logic public.winner_logic DEFAULT 'final_qoi',
ADD COLUMN show_eliminated BOOLEAN DEFAULT true,
ADD COLUMN hide_future_rounds BOOLEAN DEFAULT false;

-- Create event_rounds table for per-round configuration
CREATE TABLE public.event_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  round_type public.round_type NOT NULL DEFAULT 'open',
  advancement_type public.advancement_type NOT NULL DEFAULT 'none',
  advancement_value INTEGER DEFAULT NULL,
  threshold_qoi NUMERIC DEFAULT NULL,
  max_submissions INTEGER DEFAULT 1,
  index_reward INTEGER DEFAULT 0,
  bonus_multiplier NUMERIC DEFAULT 1.0,
  duration_hours INTEGER DEFAULT 24,
  auto_start_next BOOLEAN DEFAULT false,
  show_leaderboard BOOLEAN DEFAULT true,
  status public.round_status DEFAULT 'pending',
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, round_number)
);

-- Create round_participations table for tracking user status per round
CREATE TABLE public.round_participations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  status public.participant_status DEFAULT 'pending',
  submission_url TEXT,
  platform public.platform_type,
  qoi_score NUMERIC DEFAULT NULL,
  quality_score NUMERIC DEFAULT NULL,
  originality_score NUMERIC DEFAULT NULL,
  impact_score NUMERIC DEFAULT NULL,
  cumulative_qoi NUMERIC DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE,
  judged_at TIMESTAMP WITH TIME ZONE,
  judge_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, event_id, round_number)
);

-- Enable RLS
ALTER TABLE public.event_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_participations ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_rounds
CREATE POLICY "Anyone can view event rounds"
ON public.event_rounds FOR SELECT
USING (true);

CREATE POLICY "Admins can manage event rounds"
ON public.event_rounds FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for round_participations
CREATE POLICY "Anyone can view round participations"
ON public.round_participations FOR SELECT
USING (true);

CREATE POLICY "Users can submit to rounds"
ON public.round_participations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage round participations"
ON public.round_participations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update round participations"
ON public.round_participations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to advance users to next round
CREATE OR REPLACE FUNCTION public.advance_round_participants(
  p_event_id UUID,
  p_round_number INTEGER,
  p_advancement_type public.advancement_type,
  p_advancement_value INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  advanced_count INTEGER := 0;
  threshold_val NUMERIC;
BEGIN
  -- Get threshold if it's a threshold round
  SELECT threshold_qoi INTO threshold_val
  FROM public.event_rounds
  WHERE event_id = p_event_id AND round_number = p_round_number;

  IF p_advancement_type = 'top_x' THEN
    -- Advance top X by QOI score
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY qoi_score DESC NULLS LAST) as rank
      FROM public.round_participations
      WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active'
    )
    UPDATE public.round_participations rp
    SET status = CASE 
      WHEN r.rank <= p_advancement_value THEN 'advanced'::participant_status 
      ELSE 'eliminated'::participant_status 
    END
    FROM ranked r
    WHERE rp.id = r.id;
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
    
  ELSIF p_advancement_type = 'percentage' THEN
    -- Advance top X%
    WITH ranked AS (
      SELECT id, 
             ROW_NUMBER() OVER (ORDER BY qoi_score DESC NULLS LAST) as rank,
             COUNT(*) OVER () as total
      FROM public.round_participations
      WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active'
    )
    UPDATE public.round_participations rp
    SET status = CASE 
      WHEN r.rank <= CEIL(r.total * p_advancement_value / 100.0) THEN 'advanced'::participant_status 
      ELSE 'eliminated'::participant_status 
    END
    FROM ranked r
    WHERE rp.id = r.id;
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
    
  ELSIF p_advancement_type = 'none' THEN
    -- Open round - everyone advances
    UPDATE public.round_participations
    SET status = 'advanced'
    WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active';
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
  END IF;

  -- Create entries for next round for advanced users
  IF p_round_number < 3 THEN
    INSERT INTO public.round_participations (user_id, event_id, round_number, status, cumulative_qoi)
    SELECT user_id, event_id, p_round_number + 1, 'pending', 
           COALESCE(cumulative_qoi, 0) + COALESCE(qoi_score, 0)
    FROM public.round_participations
    WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'advanced'
    ON CONFLICT (user_id, event_id, round_number) DO NOTHING;
  END IF;

  RETURN advanced_count;
END;
$$;

-- Function to start a round
CREATE OR REPLACE FUNCTION public.start_event_round(p_event_id UUID, p_round_number INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  round_duration INTEGER;
BEGIN
  -- Get round duration
  SELECT duration_hours INTO round_duration
  FROM public.event_rounds
  WHERE event_id = p_event_id AND round_number = p_round_number;

  -- Update round status
  UPDATE public.event_rounds
  SET status = 'active',
      starts_at = now(),
      ends_at = now() + (round_duration || ' hours')::INTERVAL
  WHERE event_id = p_event_id AND round_number = p_round_number;

  -- For round 1, create participation entries for all eligible users
  IF p_round_number = 1 THEN
    -- This will be handled by user submissions
    NULL;
  END IF;

  RETURN true;
END;
$$;

-- Function to end a round and process advancement
CREATE OR REPLACE FUNCTION public.end_event_round(p_event_id UUID, p_round_number INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  round_record RECORD;
  advanced INTEGER;
BEGIN
  -- Get round config
  SELECT * INTO round_record
  FROM public.event_rounds
  WHERE event_id = p_event_id AND round_number = p_round_number;

  -- Mark round as completed
  UPDATE public.event_rounds
  SET status = 'completed', ends_at = now()
  WHERE event_id = p_event_id AND round_number = p_round_number;

  -- Process advancement
  advanced := public.advance_round_participants(
    p_event_id,
    p_round_number,
    round_record.advancement_type,
    round_record.advancement_value
  );

  -- Auto-start next round if enabled
  IF round_record.auto_start_next AND p_round_number < 3 THEN
    PERFORM public.start_event_round(p_event_id, p_round_number + 1);
  END IF;

  RETURN advanced;
END;
$$;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.round_participations;


-- ── migration: 20260114151635_0627bed3-474d-443a-a304-88fa71c0baa7.sql ─────────────────────────────────────────
-- Add materials_url field to events table for storing links to sounds, footage, assets etc.
ALTER TABLE public.events
ADD COLUMN materials_url TEXT NULL;

-- Add a comment to describe the column
COMMENT ON COLUMN public.events.materials_url IS 'URL to materials/resources for the event (sound links, footage, assets, etc.)';

-- ── migration: 20260114225527_177b7d8d-470b-46c0-b7f5-6e87d4817cc0.sql ─────────────────────────────────────────
-- Create gatekeeper_submissions table for the Gatekeeper Test feature
CREATE TABLE public.gatekeeper_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  
  -- Optional user inputs for commentary tone
  editing_software TEXT,
  years_editing TEXT,
  age_range TEXT,
  editing_style TEXT,
  
  -- Scoring (set by judge)
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  originality_score INTEGER CHECK (originality_score >= 0 AND originality_score <= 100),
  impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
  qoi_score NUMERIC(5,1),
  
  -- Judge commentary
  judge_archetype TEXT CHECK (judge_archetype IN ('realist', 'hype_demon', 'coach', 'troll', 'old_pro')),
  judge_commentary TEXT,
  
  -- Rank projection & house fit
  rank_projection TEXT,
  house_fit JSONB,
  suggested_action TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scored', 'expired')),
  judged_at TIMESTAMPTZ,
  judge_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gatekeeper_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own gatekeeper submissions"
  ON public.gatekeeper_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own submissions
CREATE POLICY "Users can create own gatekeeper submissions"
  ON public.gatekeeper_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Judges/Admins can view all submissions
CREATE POLICY "Judges can view all gatekeeper submissions"
  ON public.gatekeeper_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'judge', 'dev')
    )
  );

-- Judges/Admins can update (score) submissions
CREATE POLICY "Judges can update gatekeeper submissions"
  ON public.gatekeeper_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'judge', 'dev')
    )
  );

-- Add best_gatekeeper_qoi to profiles (stores best score)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS best_gatekeeper_qoi NUMERIC(5,1);

-- Trigger to update best QOI on profile when scored
CREATE OR REPLACE FUNCTION public.update_best_gatekeeper_qoi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL THEN
    UPDATE public.profiles
    SET best_gatekeeper_qoi = GREATEST(COALESCE(best_gatekeeper_qoi, 0), NEW.qoi_score)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_gatekeeper_scored
  AFTER UPDATE ON public.gatekeeper_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'scored' AND OLD.status != 'scored')
  EXECUTE FUNCTION public.update_best_gatekeeper_qoi();

-- Index for faster queries
CREATE INDEX idx_gatekeeper_submissions_user ON public.gatekeeper_submissions(user_id);
CREATE INDEX idx_gatekeeper_submissions_status ON public.gatekeeper_submissions(status);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.gatekeeper_submissions;

-- ── migration: 20260115003305_6d42693e-f5dd-40b7-a49b-223dcf153fe7.sql ─────────────────────────────────────────
-- Add new scoring columns for 5-pillar system (100 total)
-- rhythm_score: 0-25 (Rhythm & Timing)
-- creativity_score: 0-25 (Creativity & Concept) 
-- technical_score: 0-25 (Technical Execution)
-- emotional_score: 0-15 (Emotional Impact)
-- style_score: 0-10 (Style Identity)

ALTER TABLE public.gatekeeper_submissions 
ADD COLUMN IF NOT EXISTS rhythm_score numeric,
ADD COLUMN IF NOT EXISTS creativity_score numeric,
ADD COLUMN IF NOT EXISTS technical_score numeric,
ADD COLUMN IF NOT EXISTS emotional_score numeric,
ADD COLUMN IF NOT EXISTS style_score numeric,
ADD COLUMN IF NOT EXISTS gqt_rank text,
ADD COLUMN IF NOT EXISTS editor_type text,
ADD COLUMN IF NOT EXISTS editing_speed text,
ADD COLUMN IF NOT EXISTS test_purpose text,
ADD COLUMN IF NOT EXISTS confidence_level integer,
ADD COLUMN IF NOT EXISTS editing_goal text;

-- Add comment explaining the new system
COMMENT ON COLUMN public.gatekeeper_submissions.rhythm_score IS 'Rhythm & Timing score (0-25)';
COMMENT ON COLUMN public.gatekeeper_submissions.creativity_score IS 'Creativity & Concept score (0-25)';
COMMENT ON COLUMN public.gatekeeper_submissions.technical_score IS 'Technical Execution score (0-25)';
COMMENT ON COLUMN public.gatekeeper_submissions.emotional_score IS 'Emotional Impact score (0-15)';
COMMENT ON COLUMN public.gatekeeper_submissions.style_score IS 'Style Identity score (0-10)';
COMMENT ON COLUMN public.gatekeeper_submissions.gqt_rank IS 'Letter rank F to S++';
COMMENT ON COLUMN public.gatekeeper_submissions.confidence_level IS 'Self-rated confidence 1-10';

-- ── migration: 20260117102620_3c5d3c8a-1f74-4e16-8020-cd6da306bd72.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.advance_round_participants(p_event_id uuid, p_round_number integer, p_advancement_type advancement_type, p_advancement_value integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  advanced_count INTEGER := 0;
  threshold_val NUMERIC;
  index_reward_val INTEGER;
  user_record RECORD;
BEGIN
  -- Get round config including index reward
  SELECT threshold_qoi, index_reward INTO threshold_val, index_reward_val
  FROM public.event_rounds
  WHERE event_id = p_event_id AND round_number = p_round_number;

  IF p_advancement_type = 'top_x' THEN
    -- Advance top X by QOI score
    WITH ranked AS (
      SELECT id, user_id, ROW_NUMBER() OVER (ORDER BY qoi_score DESC NULLS LAST) as rank
      FROM public.round_participations
      WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active'
    )
    UPDATE public.round_participations rp
    SET status = CASE 
      WHEN r.rank <= p_advancement_value THEN 'advanced'::participant_status 
      ELSE 'eliminated'::participant_status 
    END
    FROM ranked r
    WHERE rp.id = r.id;
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
    
  ELSIF p_advancement_type = 'percentage' THEN
    -- Advance top X%
    WITH ranked AS (
      SELECT id, user_id,
             ROW_NUMBER() OVER (ORDER BY qoi_score DESC NULLS LAST) as rank,
             COUNT(*) OVER () as total
      FROM public.round_participations
      WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active'
    )
    UPDATE public.round_participations rp
    SET status = CASE 
      WHEN r.rank <= CEIL(r.total * p_advancement_value / 100.0) THEN 'advanced'::participant_status 
      ELSE 'eliminated'::participant_status 
    END
    FROM ranked r
    WHERE rp.id = r.id;
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
    
  ELSIF p_advancement_type = 'none' THEN
    -- Open round - everyone advances
    UPDATE public.round_participations
    SET status = 'advanced'
    WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'active';
    
    GET DIAGNOSTICS advanced_count = ROW_COUNT;
  END IF;

  -- Award index points to advanced users if index_reward is set
  IF COALESCE(index_reward_val, 0) > 0 THEN
    UPDATE public.profiles p
    SET spendable_index = spendable_index + index_reward_val,
        global_index_score = COALESCE(global_index_score, 0) + index_reward_val
    FROM public.round_participations rp
    WHERE rp.user_id = p.id
      AND rp.event_id = p_event_id
      AND rp.round_number = p_round_number
      AND rp.status = 'advanced';
  END IF;

  -- Create entries for next round for advanced users
  IF p_round_number < 3 THEN
    INSERT INTO public.round_participations (user_id, event_id, round_number, status, cumulative_qoi)
    SELECT user_id, event_id, p_round_number + 1, 'pending', 
           COALESCE(cumulative_qoi, 0) + COALESCE(qoi_score, 0)
    FROM public.round_participations
    WHERE event_id = p_event_id AND round_number = p_round_number AND status = 'advanced'
    ON CONFLICT (user_id, event_id, round_number) DO NOTHING;
  END IF;

  RETURN advanced_count;
END;
$function$;

-- ── migration: 20260117103323_de3e3fe0-151b-43c7-bfd2-5619147f1bbb.sql ─────────────────────────────────────────
-- Add founding_member column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT false;

-- Set founding member status for noisefxs and grime
UPDATE public.profiles 
SET is_founding_member = true 
WHERE username IN ('noisefxs', 'grime');


-- ── migration: 20260117115313_93d3baa4-d793-4f54-b641-53fbac4e3b88.sql ─────────────────────────────────────────
-- Add xp_awarded column to round_participations to track if XP was awarded
ALTER TABLE public.round_participations 
ADD COLUMN IF NOT EXISTS xp_awarded integer DEFAULT 0;

-- ── migration: 20260117130223_b8521ab7-11f8-4734-9275-767a10b906ed.sql ─────────────────────────────────────────
-- Update the trigger to add class floor index points when GQT is scored
CREATE OR REPLACE FUNCTION public.update_best_gatekeeper_qoi()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  old_best NUMERIC;
  old_floor INTEGER;
  new_floor INTEGER;
  floor_diff INTEGER;
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL THEN
    -- Get current best score
    SELECT COALESCE(best_gatekeeper_qoi, 0) INTO old_best
    FROM public.profiles WHERE id = NEW.user_id;
    
    -- Only process if this is a new high score
    IF NEW.qoi_score > old_best THEN
      -- Calculate old floor based on old best score
      old_floor := CASE
        WHEN old_best >= 95 THEN 300  -- S++
        WHEN old_best >= 85 THEN 200  -- S+
        WHEN old_best >= 75 THEN 120  -- S
        WHEN old_best >= 65 THEN 75   -- A
        WHEN old_best >= 50 THEN 40   -- B
        WHEN old_best >= 40 THEN 20   -- C
        WHEN old_best >= 30 THEN 10   -- D
        ELSE 0                         -- F
      END;
      
      -- Calculate new floor based on new score
      new_floor := CASE
        WHEN NEW.qoi_score >= 95 THEN 300  -- S++
        WHEN NEW.qoi_score >= 85 THEN 200  -- S+
        WHEN NEW.qoi_score >= 75 THEN 120  -- S
        WHEN NEW.qoi_score >= 65 THEN 75   -- A
        WHEN NEW.qoi_score >= 50 THEN 40   -- B
        WHEN NEW.qoi_score >= 40 THEN 20   -- C
        WHEN NEW.qoi_score >= 30 THEN 10   -- D
        ELSE 0                              -- F
      END;
      
      -- Calculate difference to add
      floor_diff := new_floor - old_floor;
      
      -- Update profile with new best and add floor difference to index scores
      UPDATE public.profiles
      SET best_gatekeeper_qoi = NEW.qoi_score,
          global_index_score = COALESCE(global_index_score, 0) + floor_diff,
          spendable_index = spendable_index + floor_diff
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- ── migration: 20260118104752_88d1e5fc-a68c-4a5a-a79c-9f164e7815ed.sql ─────────────────────────────────────────
-- Add judge-specific profile fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS judge_bio TEXT,
ADD COLUMN IF NOT EXISTS judge_specialty TEXT,
ADD COLUMN IF NOT EXISTS judge_badge TEXT,
ADD COLUMN IF NOT EXISTS review_style TEXT DEFAULT 'full_qoi';

-- Create judge badges enum-like reference table
CREATE TABLE IF NOT EXISTS public.judge_badges (
  id TEXT PRIMARY KEY,
  emoji TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'purple'
);

-- Insert predefined badges
INSERT INTO public.judge_badges (id, emoji, label, description, color) VALUES
('story_master', '🟣', 'Story Master', 'Expert at narrative flow and storytelling', 'purple'),
('sync_demon', '🔥', 'Sync Demon', 'Master of beat sync and rhythm', 'orange'),
('vibe_specialist', '💫', 'Vibe Specialist', 'Captures mood and atmosphere perfectly', 'indigo'),
('technical_analyst', '⚙️', 'Technical Analyst', 'Deep expertise in technical execution', 'slate'),
('emotion_judge', '🎭', 'Emotion Judge', 'Reads emotional impact like no other', 'rose'),
('anime_specialist', '🐉', 'Anime Specialist', 'AMV and anime edit expert', 'cyan'),
('amv_critic', '🧨', 'AMV Critic', 'Hardcore AMV enthusiast and critic', 'red'),
('sfx_coach', '🔊', 'SFX Coach', 'Sound design and SFX mastery', 'emerald'),
('comp_king', '👑', 'Comp King', 'Composition and framing specialist', 'gold'),
('transitions_god', '⚡', 'Transitions God', 'Seamless transitions expert', 'yellow'),
('meme_lord', '😈', 'Meme Lord', 'Meme edit connoisseur', 'pink'),
('freestyle', '🎨', 'Freestyle', 'Rates on their own unique criteria', 'violet')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on judge_badges (public read)
ALTER TABLE public.judge_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judge badges are publicly readable"
ON public.judge_badges FOR SELECT
USING (true);

-- Create review styles reference table
CREATE TABLE IF NOT EXISTS public.review_styles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  pillars JSONB NOT NULL DEFAULT '[]'
);

-- Insert review style presets
INSERT INTO public.review_styles (id, label, description, pillars) VALUES
('full_qoi', 'Full QOI', 'Complete scoring across all pillars', '["emotion", "creativity", "sync", "identity", "execution"]'),
('vibes', 'Vibes Only', 'Pure vibe and mood assessment', '["emotion", "identity"]'),
('sync_only', 'Sync Only', 'Beat sync and rhythm focus', '["sync", "execution"]'),
('comp_only', 'Comp Only', 'Composition and framing', '["creativity", "execution"]'),
('character_edits', 'Character Edits', 'Character-focused content', '["identity", "emotion", "creativity"]'),
('meme_edits', 'Meme Edits', 'Meme and comedy timing', '["creativity", "identity"]'),
('anime_edits', 'Anime/AMV', 'Anime and AMV specific', '["sync", "emotion", "creativity", "execution"]'),
('freestyle', 'Freestyle', 'Custom criteria set by judge', '[]')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on review_styles (public read)
ALTER TABLE public.review_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review styles are publicly readable"
ON public.review_styles FOR SELECT
USING (true);

-- Add index for faster judge lookups
CREATE INDEX IF NOT EXISTS idx_profiles_judge_badge ON public.profiles(judge_badge) WHERE judge_badge IS NOT NULL;

-- ── migration: 20260118194413_bc93d875-0cb1-43c9-90f0-4abd0840cceb.sql ─────────────────────────────────────────
-- Create judge_applications table for prestige-gated judge onboarding
CREATE TABLE public.judge_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  video_url TEXT NOT NULL,
  video_platform TEXT NOT NULL,
  
  -- Skill test scores (3 edits they score, compared to baseline)
  test_edit_1_score INTEGER,
  test_edit_1_baseline INTEGER,
  test_edit_2_score INTEGER,
  test_edit_2_baseline INTEGER,
  test_edit_3_score INTEGER,
  test_edit_3_baseline INTEGER,
  test_accuracy NUMERIC,
  
  -- Optional applicant info
  experience_years TEXT,
  specialty TEXT,
  motivation TEXT,
  
  -- Admin review
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.judge_applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own applications"
ON public.judge_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own applications"
ON public.judge_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
ON public.judge_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can update applications"
ON public.judge_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can delete applications"
ON public.judge_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

-- Create index for faster lookups
CREATE INDEX idx_judge_applications_user_id ON public.judge_applications(user_id);
CREATE INDEX idx_judge_applications_status ON public.judge_applications(status);

-- ── migration: 20260119054054_bb4d5332-2a1e-4aa1-88f9-28f3090fa253.sql ─────────────────────────────────────────
-- Add discord_url and is_featured columns to crews table
ALTER TABLE public.crews 
ADD COLUMN IF NOT EXISTS discord_url TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP WITH TIME ZONE;

-- Create index for featured crews
CREATE INDEX IF NOT EXISTS idx_crews_featured ON public.crews(is_featured, featured_at DESC) WHERE is_featured = true;

-- ── migration: 20260119100942_5e408872-59bd-4c8a-91a5-40c5816f8544.sql ─────────────────────────────────────────
-- Add banner customization columns to crews table
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS banner_color text DEFAULT '#d4af37';

-- ── migration: 20260119101703_9cf02d85-5c53-47c9-89bd-66b7591a0f7a.sql ─────────────────────────────────────────
-- Create crew announcements table
CREATE TABLE public.crew_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read announcements for crews they're in
CREATE POLICY "Crew members can view announcements" 
ON public.crew_announcements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_announcements.crew_id 
    AND crew_members.user_id = auth.uid()
  )
);

-- Only owner/officers can create announcements
CREATE POLICY "Staff can create announcements" 
ON public.crew_announcements 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_announcements.crew_id 
    AND crew_members.user_id = auth.uid()
    AND crew_members.role IN ('owner', 'officer')
  )
);

-- Staff can delete their own announcements
CREATE POLICY "Staff can delete announcements" 
ON public.crew_announcements 
FOR DELETE 
USING (
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_announcements.crew_id 
    AND crew_members.user_id = auth.uid()
    AND crew_members.role = 'owner'
  )
);

-- Create table to track which announcements user has seen
CREATE TABLE public.crew_announcement_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, crew_id)
);

-- Enable RLS
ALTER TABLE public.crew_announcement_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read status
CREATE POLICY "Users can manage their own read status" 
ON public.crew_announcement_reads 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_announcements;

-- ── migration: 20260119130102_9c2dc3cc-a1d5-4d2d-805f-6048969cdeb4.sql ─────────────────────────────────────────
-- Add crew_extended_role enum for additional role badges
CREATE TYPE public.crew_extended_role AS ENUM ('ace_editor', 'veteran', 'challenger', 'recruiter', 'judge');

-- Add extended_role column to crew_members
ALTER TABLE public.crew_members ADD COLUMN extended_role public.crew_extended_role DEFAULT NULL;

-- Create table for crew rivalries
CREATE TABLE public.crew_rivalries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  rival_crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(crew_id, rival_crew_id)
);

-- Enable RLS
ALTER TABLE public.crew_rivalries ENABLE ROW LEVEL SECURITY;

-- Anyone can view rivalries
CREATE POLICY "Anyone can view rivalries"
ON public.crew_rivalries
FOR SELECT
USING (true);

-- Only crew staff can create rivalries
CREATE POLICY "Staff can create rivalries"
ON public.crew_rivalries
FOR INSERT
WITH CHECK (
  is_crew_staff(crew_id, auth.uid())
);

-- Only crew staff can delete rivalries
CREATE POLICY "Staff can delete rivalries"
ON public.crew_rivalries
FOR DELETE
USING (
  is_crew_staff(crew_id, auth.uid())
);

-- Create table for crew activity feed
CREATE TABLE public.crew_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_activity ENABLE ROW LEVEL SECURITY;

-- Crew members can view activity
CREATE POLICY "Crew members can view activity"
ON public.crew_activity
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_activity.crew_id 
    AND crew_members.user_id = auth.uid()
  )
);

-- Enable realtime for crew activity
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_rivalries;

-- ── migration: 20260119131249_e0b73b51-eddf-4b81-a27e-fc51f332158d.sql ─────────────────────────────────────────
-- Create crew challenges table
CREATE TABLE public.crew_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL DEFAULT 'weekly', -- weekly, daily, special
  xp_reward integer NOT NULL DEFAULT 100,
  target_value integer NOT NULL DEFAULT 1, -- e.g., submit 5 edits, get 200 XP
  target_metric text NOT NULL DEFAULT 'crew_xp', -- crew_xp, submissions, members, arena_wins, gqt_scores
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create crew challenge progress table
CREATE TABLE public.crew_challenge_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id uuid NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.crew_challenges(id) ON DELETE CASCADE,
  current_value integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone,
  xp_claimed boolean NOT NULL DEFAULT false,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(crew_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.crew_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_challenge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Anyone can view challenges" 
ON public.crew_challenges 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage challenges" 
ON public.crew_challenges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for progress
CREATE POLICY "Anyone can view challenge progress" 
ON public.crew_challenge_progress 
FOR SELECT 
USING (true);

CREATE POLICY "Crew members can update their crew progress" 
ON public.crew_challenge_progress 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_challenge_progress.crew_id 
    AND crew_members.user_id = auth.uid()
  )
);

CREATE POLICY "Crew members can update progress" 
ON public.crew_challenge_progress 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM crew_members 
    WHERE crew_members.crew_id = crew_challenge_progress.crew_id 
    AND crew_members.user_id = auth.uid()
  )
);

-- Enable realtime for progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_challenge_progress;

-- Insert some initial weekly challenges
INSERT INTO public.crew_challenges (title, description, challenge_type, xp_reward, target_value, target_metric, ends_at) VALUES
('Crew Grind', 'Earn 500 XP as a crew', 'weekly', 200, 500, 'crew_xp', now() + interval '7 days'),
('Arena Warriors', 'Submit 5 edits to Open Arena', 'weekly', 150, 5, 'submissions', now() + interval '7 days'),
('Recruitment Drive', 'Get 3 new members to join', 'weekly', 250, 3, 'members', now() + interval '7 days'),
('Quality Check', 'Have 3 members take the GQT', 'weekly', 175, 3, 'gqt_scores', now() + interval '7 days');

-- ── migration: 20260119190247_005facef-cb1d-447a-8469-ca666a63f266.sql ─────────────────────────────────────────
-- Drop the existing insert policy and create a more permissive one that allows crew owners to add members
DROP POLICY IF EXISTS "Staff can add members" ON public.crew_members;

-- Create new policy that allows:
-- 1. Crew staff (owner/officer) to add members
-- 2. Users to add themselves (for joining open crews)
-- 3. The crew owner (from crews table) to add the first member (themselves)
CREATE POLICY "Staff or self can add members" 
ON public.crew_members 
FOR INSERT 
WITH CHECK (
  is_crew_staff(crew_id, auth.uid()) 
  OR (auth.uid() = user_id)
  OR EXISTS (
    SELECT 1 FROM public.crews 
    WHERE id = crew_id AND owner_id = auth.uid()
  )
);

-- ── migration: 20260119190650_26a5c1c3-3d36-46bc-8b08-4b92b9cf6831.sql ─────────────────────────────────────────
-- Fix the crews UPDATE policy to check owner_id directly (not from crew_members which may be empty)
DROP POLICY IF EXISTS "Owner can update crew" ON public.crews;

CREATE POLICY "Owner can update crew"
ON public.crews
FOR UPDATE
USING (owner_id = auth.uid());

-- ── migration: 20260119193813_8414ae35-64dd-4e90-a924-4174895b74f6.sql ─────────────────────────────────────────

-- Drop the restrictive UPDATE policy that's causing the issue
DROP POLICY IF EXISTS "Owner can update member roles" ON public.crew_members;

-- Create a new policy that allows owners (via crews.owner_id) to update any member
CREATE POLICY "Owner can update member roles"
ON public.crew_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.crews
    WHERE crews.id = crew_members.crew_id
    AND crews.owner_id = auth.uid()
  )
);


-- ── migration: 20260119194555_b491e892-2b40-4e7b-91ee-ac5547ef9a31.sql ─────────────────────────────────────────
-- Drop the current update policy
DROP POLICY IF EXISTS "Owner can update member roles" ON public.crew_members;

-- Create a new policy that allows:
-- 1. The crew owner (via crews.owner_id) to update any member
-- 2. Admins/devs to update any member (bypass for admin accounts)
CREATE POLICY "Owner or admin can update member roles"
ON public.crew_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.crews
    WHERE crews.id = crew_members.crew_id
    AND crews.owner_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'dev')
);


-- ── migration: 20260119212513_041d2124-6b87-4f3d-bceb-56890768b42f.sql ─────────────────────────────────────────
-- Drop the unique constraint on user_id in crew_members to allow admins to be in multiple crews
ALTER TABLE public.crew_members DROP CONSTRAINT IF EXISTS crew_members_user_id_key;

-- ── migration: 20260120152631_980fda93-96c0-47d7-ab9e-a6a8a73f2670.sql ─────────────────────────────────────────
-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Owner can update crew" ON public.crews;

-- Create new policy that allows owner OR admin/dev to update
CREATE POLICY "Owner or admin can update crew"
ON public.crews
FOR UPDATE
USING (
  owner_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'dev')
);

-- ── migration: 20260121145437_74810476-7bad-4516-86c7-6908ab1a4559.sql ─────────────────────────────────────────
-- Drop the admin-only policy for crew creation
DROP POLICY IF EXISTS "Only admins can create crews" ON public.crews;

-- Create new policy allowing any authenticated user to create crews
CREATE POLICY "Authenticated users can create crews"
ON public.crews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ── migration: 20260123211436_0b4face5-1327-4172-8480-ece412d1b64a.sql ─────────────────────────────────────────
-- Practice Matches table
CREATE TABLE public.practice_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Match type and timing
  match_type TEXT NOT NULL DEFAULT 'quick_spar', -- 'quick_spar' (30-90min) or 'extended' (up to 24h)
  duration_minutes INTEGER NOT NULL DEFAULT 60, -- actual duration chosen
  
  -- Participants
  player_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'matched', 'in_progress', 'submitted', 'judging', 'completed', 'voided'
  
  -- Submissions
  player_1_submission_url TEXT,
  player_1_platform TEXT,
  player_1_submitted_at TIMESTAMPTZ,
  player_2_submission_url TEXT,
  player_2_platform TEXT,
  player_2_submitted_at TIMESTAMPTZ,
  
  -- Judging
  judge_id UUID REFERENCES public.profiles(id),
  judge_claimed_at TIMESTAMPTZ,
  judge_auto_assigned BOOLEAN DEFAULT false,
  
  -- Scores (simple for practice - winner determination)
  player_1_score INTEGER,
  player_2_score INTEGER,
  winner_id UUID REFERENCES public.profiles(id),
  judge_notes TEXT,
  
  -- XP awarded
  winner_xp_awarded INTEGER DEFAULT 0,
  loser_xp_awarded INTEGER DEFAULT 0,
  compensation_xp_awarded INTEGER DEFAULT 0, -- for voided matches
  
  -- Timestamps
  matched_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  judged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Practice Queue table (for matchmaking)
CREATE TABLE public.practice_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL DEFAULT 'quick_spar',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  skill_tier TEXT NOT NULL DEFAULT 'open', -- 'open', 'rising', 'established', 'elite' based on QOI
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  
  CONSTRAINT unique_user_in_queue UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.practice_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_matches
CREATE POLICY "Anyone can view practice matches"
ON public.practice_matches FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create practice matches"
ON public.practice_matches FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants can update their submissions"
ON public.practice_matches FOR UPDATE
USING (
  auth.uid() = player_1_id OR 
  auth.uid() = player_2_id OR
  auth.uid() = judge_id OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'judge'::app_role)
);

-- RLS Policies for practice_queue
CREATE POLICY "Anyone can view queue"
ON public.practice_queue FOR SELECT
USING (true);

CREATE POLICY "Users can join queue"
ON public.practice_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave queue"
ON public.practice_queue FOR DELETE
USING (auth.uid() = user_id);

-- Function to get skill tier from QOI score
CREATE OR REPLACE FUNCTION public.get_skill_tier(qoi_score NUMERIC)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN qoi_score >= 80 THEN 'elite'
    WHEN qoi_score >= 60 THEN 'established'
    WHEN qoi_score >= 40 THEN 'rising'
    ELSE 'open'
  END
$$;

-- Function to find and create a match from queue
CREATE OR REPLACE FUNCTION public.find_practice_match(p_user_id UUID, p_match_type TEXT, p_duration INTEGER)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier TEXT;
  matched_queue RECORD;
  new_match_id UUID;
BEGIN
  -- Get user's skill tier
  SELECT get_skill_tier(COALESCE(global_index_score, 0)) INTO user_tier
  FROM public.profiles WHERE id = p_user_id;
  
  -- Look for a match in queue (same tier, same type, not self)
  SELECT * INTO matched_queue
  FROM public.practice_queue
  WHERE user_id != p_user_id
    AND match_type = p_match_type
    AND skill_tier = user_tier
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF matched_queue IS NULL THEN
    -- No match found, add to queue
    INSERT INTO public.practice_queue (user_id, match_type, duration_minutes, skill_tier)
    VALUES (p_user_id, p_match_type, p_duration, user_tier)
    ON CONFLICT (user_id) DO UPDATE 
    SET match_type = p_match_type, 
        duration_minutes = p_duration,
        skill_tier = user_tier,
        queued_at = now(),
        expires_at = now() + INTERVAL '15 minutes';
    
    RETURN NULL;
  END IF;
  
  -- Match found! Create the practice match
  INSERT INTO public.practice_matches (
    match_type, 
    duration_minutes, 
    player_1_id, 
    player_2_id, 
    status,
    matched_at,
    starts_at,
    ends_at
  )
  VALUES (
    p_match_type,
    GREATEST(matched_queue.duration_minutes, p_duration),
    matched_queue.user_id,
    p_user_id,
    'matched',
    now(),
    now(),
    now() + (GREATEST(matched_queue.duration_minutes, p_duration) || ' minutes')::INTERVAL
  )
  RETURNING id INTO new_match_id;
  
  -- Remove both users from queue
  DELETE FROM public.practice_queue WHERE user_id IN (p_user_id, matched_queue.user_id);
  
  -- Create notifications for both players
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES 
    (matched_queue.user_id, 'practice_matched', 'Match Found!', 'You''ve been matched for a 1v1 Practice. Get ready!', 
     jsonb_build_object('match_id', new_match_id, 'match_type', p_match_type)),
    (p_user_id, 'practice_matched', 'Match Found!', 'You''ve been matched for a 1v1 Practice. Get ready!',
     jsonb_build_object('match_id', new_match_id, 'match_type', p_match_type));
  
  RETURN new_match_id;
END;
$$;

-- Function for judge to claim a match
CREATE OR REPLACE FUNCTION public.claim_practice_match(p_judge_id UUID, p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is a judge
  IF NOT has_role(p_judge_id, 'judge'::app_role) THEN
    RETURN false;
  END IF;
  
  -- Try to claim (only if unclaimed and in 'submitted' status)
  UPDATE public.practice_matches
  SET judge_id = p_judge_id,
      judge_claimed_at = now(),
      status = 'judging',
      updated_at = now()
  WHERE id = p_match_id
    AND status = 'submitted'
    AND judge_id IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Enable realtime for practice matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.practice_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.practice_queue;

-- ── migration: 20260123213932_67132adc-f8db-40e6-9dce-77be80c58d53.sql ─────────────────────────────────────────

-- Friendly Competitions table
CREATE TABLE public.friendly_tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  max_players INTEGER NOT NULL DEFAULT 8,
  current_players INTEGER NOT NULL DEFAULT 0,
  judge_id UUID,
  judge_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, filling, live, bracket, completed, cancelled
  bracket_data JSONB DEFAULT '{}',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_player_count CHECK (max_players IN (2, 4, 8, 16)),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'filling', 'live', 'bracket', 'completed', 'cancelled'))
);

-- Participants in friendly tournaments
CREATE TABLE public.friendly_tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.friendly_tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT,
  submission_platform TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  bracket_position INTEGER,
  eliminated_at TIMESTAMP WITH TIME ZONE,
  final_rank INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS
ALTER TABLE public.friendly_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendly_tournament_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendly_tournaments
CREATE POLICY "Anyone can view friendly tournaments"
  ON public.friendly_tournaments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tournaments"
  ON public.friendly_tournaments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = creator_id);

CREATE POLICY "Creator can update their tournament"
  ON public.friendly_tournaments FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = judge_id);

CREATE POLICY "Creator can delete pending tournament"
  ON public.friendly_tournaments FOR DELETE
  USING (auth.uid() = creator_id AND status = 'pending');

-- RLS Policies for participants
CREATE POLICY "Anyone can view participants"
  ON public.friendly_tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join tournaments"
  ON public.friendly_tournament_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.friendly_tournament_participants FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM friendly_tournaments ft 
    WHERE ft.id = tournament_id AND (ft.creator_id = auth.uid() OR ft.judge_id = auth.uid())
  ));

CREATE POLICY "Users can leave pending tournaments"
  ON public.friendly_tournament_participants FOR DELETE
  USING (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM friendly_tournaments ft 
    WHERE ft.id = tournament_id AND ft.status IN ('pending', 'filling')
  ));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendly_tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendly_tournament_participants;


-- ── migration: 20260124091614_39435094-29b3-4a80-94a6-a1afc9d733e1.sql ─────────────────────────────────────────
-- Add is_primary flag to crew_members
ALTER TABLE public.crew_members 
ADD COLUMN is_primary boolean NOT NULL DEFAULT false;

-- Add primary_crew_changed_at to profiles for cooldown tracking
ALTER TABLE public.profiles
ADD COLUMN primary_crew_changed_at timestamp with time zone;

-- Set ONLY the first (oldest) membership per user as primary
UPDATE public.crew_members cm
SET is_primary = true
FROM (
  SELECT DISTINCT ON (user_id) id
  FROM public.crew_members
  ORDER BY user_id, joined_at ASC
) first_crew
WHERE cm.id = first_crew.id;

-- Create unique partial index: only one primary crew per user
CREATE UNIQUE INDEX idx_one_primary_crew_per_user 
ON public.crew_members (user_id) 
WHERE is_primary = true;

-- Create index for faster queries on secondary crews
CREATE INDEX idx_crew_members_secondary 
ON public.crew_members (user_id) 
WHERE is_primary = false;

-- Add comments for documentation
COMMENT ON COLUMN public.crew_members.is_primary IS 'Primary crew shown on profile/rankings. Only one per user. Secondary crews (is_primary=false) are for practice/social.';
COMMENT ON COLUMN public.profiles.primary_crew_changed_at IS 'Timestamp of last primary crew change. 7-day cooldown enforced.';

-- ── migration: 20260124193714_2cc7f253-ce15-4e69-b629-6a7037a710e0.sql ─────────────────────────────────────────
-- Add trial_judge to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trial_judge';

-- Add judging experience field to judge_applications (for Discord comp experience etc)
ALTER TABLE public.judge_applications 
ADD COLUMN IF NOT EXISTS judging_experience TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Make video columns nullable since we're simplifying the application
ALTER TABLE public.judge_applications 
ALTER COLUMN video_url DROP NOT NULL,
ALTER COLUMN video_platform DROP NOT NULL;

-- Set defaults to null for test scores since test is being removed
COMMENT ON TABLE public.judge_applications IS 'Judge applications - simplified application flow without video test';

-- ── migration: 20260125083931_f3577992-ff35-4a91-af17-72a22c7a44e7.sql ─────────────────────────────────────────
-- Sanctioned Tournaments: Crew-proposed, Admin-approved competitive events
CREATE TABLE public.sanctioned_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Crew & Proposer
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL,
  crew_name TEXT NOT NULL,
  crew_avatar_url TEXT,
  
  -- Tournament Details
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  rules TEXT[],
  
  -- Format
  min_players INTEGER NOT NULL DEFAULT 20,
  max_players INTEGER NOT NULL DEFAULT 64,
  duration_hours INTEGER NOT NULL DEFAULT 48,
  format_type TEXT NOT NULL DEFAULT 'single_elimination', -- single_elimination, double_elimination, round_robin
  
  -- Status & Approval
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, ready_up, live, bracket, completed, cancelled
  rejection_reason TEXT,
  
  -- Admin-set fields (after approval)
  index_prize INTEGER, -- Total index points prize pool
  first_place_index INTEGER,
  second_place_index INTEGER,
  third_place_index INTEGER,
  xp_reward INTEGER DEFAULT 100,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Scheduling
  proposed_start_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  ready_up_deadline TIMESTAMPTZ,
  submission_deadline TIMESTAMPTZ,
  
  -- Tracking
  player_count INTEGER NOT NULL DEFAULT 0,
  ready_count INTEGER NOT NULL DEFAULT 0,
  poster_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Participants table
CREATE TABLE public.sanctioned_tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.sanctioned_tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Status
  is_ready BOOLEAN NOT NULL DEFAULT false,
  ready_at TIMESTAMPTZ,
  
  -- Submission
  submission_url TEXT,
  submission_platform TEXT,
  submitted_at TIMESTAMPTZ,
  
  -- Bracket
  bracket_position INTEGER,
  eliminated_at TIMESTAMPTZ,
  final_rank INTEGER,
  
  -- Scoring
  qoi_score NUMERIC,
  
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS
ALTER TABLE public.sanctioned_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctioned_tournament_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sanctioned_tournaments
CREATE POLICY "Anyone can view approved tournaments"
ON public.sanctioned_tournaments FOR SELECT
USING (status != 'pending' OR crew_id IN (
  SELECT crew_id FROM public.crew_members WHERE user_id = auth.uid()
) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Crew staff can propose tournaments"
ON public.sanctioned_tournaments FOR INSERT
WITH CHECK (is_crew_staff(crew_id, auth.uid()));

CREATE POLICY "Admins can manage all tournaments"
ON public.sanctioned_tournaments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Crew staff can update pending tournaments"
ON public.sanctioned_tournaments FOR UPDATE
USING (is_crew_staff(crew_id, auth.uid()) AND status = 'pending');

-- RLS Policies for participants
CREATE POLICY "Anyone can view participants"
ON public.sanctioned_tournament_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join tournaments"
ON public.sanctioned_tournament_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
ON public.sanctioned_tournament_participants FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can leave before tournament starts"
ON public.sanctioned_tournament_participants FOR DELETE
USING (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.sanctioned_tournaments 
  WHERE id = tournament_id AND status IN ('approved', 'ready_up')
));

-- Indexes
CREATE INDEX idx_sanctioned_tournaments_status ON public.sanctioned_tournaments(status);
CREATE INDEX idx_sanctioned_tournaments_crew ON public.sanctioned_tournaments(crew_id);
CREATE INDEX idx_sanctioned_participants_tournament ON public.sanctioned_tournament_participants(tournament_id);
CREATE INDEX idx_sanctioned_participants_user ON public.sanctioned_tournament_participants(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sanctioned_tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sanctioned_tournament_participants;

-- ── migration: 20260125084916_2eead8cf-3adc-4772-870c-8edba855195a.sql ─────────────────────────────────────────
-- Add tournament mode and challenged crew fields to sanctioned_tournaments
ALTER TABLE public.sanctioned_tournaments
ADD COLUMN tournament_mode TEXT NOT NULL DEFAULT 'open',
ADD COLUMN challenged_crew_id UUID REFERENCES public.crews(id),
ADD COLUMN challenged_crew_name TEXT,
ADD COLUMN challenged_crew_avatar_url TEXT,
ADD COLUMN challenge_accepted BOOLEAN DEFAULT NULL,
ADD COLUMN challenge_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for tournament_mode values
ALTER TABLE public.sanctioned_tournaments
ADD CONSTRAINT valid_tournament_mode CHECK (tournament_mode IN ('open', 'crew_vs_crew'));

-- Add constraint: crew_vs_crew mode requires challenged_crew_id
ALTER TABLE public.sanctioned_tournaments
ADD CONSTRAINT crew_vs_crew_requires_challenged CHECK (
  tournament_mode = 'open' OR challenged_crew_id IS NOT NULL
);

-- Index for faster rival-based queries
CREATE INDEX idx_sanctioned_tournaments_challenged_crew ON public.sanctioned_tournaments(challenged_crew_id);
CREATE INDEX idx_sanctioned_tournaments_mode ON public.sanctioned_tournaments(tournament_mode);

-- ── migration: 20260125091254_f7a52321-9489-4150-a431-e569bdf53e1d.sql ─────────────────────────────────────────
-- Update RLS policy to only allow crew OWNERS to propose tournaments (not officers)
DROP POLICY IF EXISTS "Crew staff can propose tournaments" ON public.sanctioned_tournaments;

CREATE POLICY "Crew owners can propose tournaments"
ON public.sanctioned_tournaments FOR INSERT
WITH CHECK (is_crew_owner(crew_id, auth.uid()));

-- ── migration: 20260125172610_f9f0e9bf-bcf3-4f95-b652-a1a2d20430a9.sql ─────────────────────────────────────────
-- Drop the admin-only upload policy
DROP POLICY IF EXISTS "Admins can upload event posters" ON storage.objects;

-- Create new policy allowing authenticated users to upload to event-posters bucket
CREATE POLICY "Authenticated users can upload event posters"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-posters' 
  AND auth.uid() IS NOT NULL
);

-- Also allow users to update their own uploads (for replacing)
DROP POLICY IF EXISTS "Admins can update event posters" ON storage.objects;
CREATE POLICY "Users can update event posters"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-posters' 
  AND auth.uid() IS NOT NULL
);

-- ── migration: 20260126025424_34769beb-f03d-4f12-a618-3a6a91643aef.sql ─────────────────────────────────────────
-- Add participation index and per-win index columns to sanctioned tournaments
ALTER TABLE public.sanctioned_tournaments
ADD COLUMN IF NOT EXISTS participation_index integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS per_win_index integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.sanctioned_tournaments.participation_index IS 'Index points awarded to all participants who submit';
COMMENT ON COLUMN public.sanctioned_tournaments.per_win_index IS 'Index points awarded per bracket match win';

-- ── migration: 20260126032439_c5515388-3b65-4d9d-9250-056792dfa029.sql ─────────────────────────────────────────
-- Create a trigger function to automatically sync player_count when participants change
CREATE OR REPLACE FUNCTION public.sync_sanctioned_tournament_player_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  actual_count INTEGER;
  ready_count INTEGER;
BEGIN
  -- Get actual participant count for the affected tournament
  IF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO actual_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = OLD.tournament_id;
    
    SELECT COUNT(*) INTO ready_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = OLD.tournament_id AND is_ready = true;
    
    UPDATE public.sanctioned_tournaments 
    SET player_count = actual_count, ready_count = ready_count
    WHERE id = OLD.tournament_id;
    
    RETURN OLD;
  ELSE
    SELECT COUNT(*) INTO actual_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = NEW.tournament_id;
    
    SELECT COUNT(*) INTO ready_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = NEW.tournament_id AND is_ready = true;
    
    UPDATE public.sanctioned_tournaments 
    SET player_count = actual_count, ready_count = ready_count
    WHERE id = NEW.tournament_id;
    
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for INSERT, UPDATE, DELETE on participants table
DROP TRIGGER IF EXISTS sync_player_count_trigger ON public.sanctioned_tournament_participants;
CREATE TRIGGER sync_player_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sanctioned_tournament_participants
FOR EACH ROW
EXECUTE FUNCTION public.sync_sanctioned_tournament_player_count();

-- ── migration: 20260126035929_9b6a430a-a78f-4cea-a9df-7a415a3702cf.sql ─────────────────────────────────────────
-- Add INSERT policy for notifications table
-- Allow admins to insert notifications for any user (for broadcast)
CREATE POLICY "Admins can insert notifications for any user"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'dev')
  )
  OR auth.uid() = user_id
);

-- Also allow the system/service role to insert (for triggers)
-- This is handled by the existing trigger functions with SECURITY DEFINER

-- ── migration: 20260126041902_6bcc2784-69ff-4baf-92f1-548f24ddb892.sql ─────────────────────────────────────────
-- Add slug column to sanctioned_tournaments
ALTER TABLE public.sanctioned_tournaments
ADD COLUMN slug text UNIQUE;

-- Generate slugs for existing tournaments
UPDATE public.sanctioned_tournaments
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_tournament_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Only generate if slug is null or name changed
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.name = NEW.name) THEN
    RETURN NEW;
  END IF;
  
  -- Generate base slug from name
  base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  final_slug := base_slug;
  
  -- Check for uniqueness, add suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.sanctioned_tournaments WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug on insert/update
CREATE TRIGGER set_tournament_slug
BEFORE INSERT OR UPDATE ON public.sanctioned_tournaments
FOR EACH ROW
EXECUTE FUNCTION public.generate_tournament_slug();

-- Make slug NOT NULL after populating existing rows
ALTER TABLE public.sanctioned_tournaments
ALTER COLUMN slug SET NOT NULL;

-- ── migration: 20260126042024_82555e63-965b-40ab-b9b7-c199efc5bfdb.sql ─────────────────────────────────────────
-- Fix function search path
CREATE OR REPLACE FUNCTION public.generate_tournament_slug()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Only generate if slug is null or name changed
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.name = NEW.name) THEN
    RETURN NEW;
  END IF;
  
  -- Generate base slug from name
  base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  final_slug := base_slug;
  
  -- Check for uniqueness, add suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.sanctioned_tournaments WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- ── migration: 20260126162347_863ee3fb-8f76-4396-a07b-61adc82b5c37.sql ─────────────────────────────────────────
-- Fix the ambiguous column reference in the trigger
CREATE OR REPLACE FUNCTION public.sync_sanctioned_tournament_player_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actual_count INTEGER;
  ready_total INTEGER;
BEGIN
  -- Get actual participant count for the affected tournament
  IF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO actual_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = OLD.tournament_id;
    
    SELECT COUNT(*) INTO ready_total 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = OLD.tournament_id AND is_ready = true;
    
    UPDATE public.sanctioned_tournaments 
    SET player_count = actual_count, ready_count = ready_total
    WHERE id = OLD.tournament_id;
    
    RETURN OLD;
  ELSE
    SELECT COUNT(*) INTO actual_count 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = NEW.tournament_id;
    
    SELECT COUNT(*) INTO ready_total 
    FROM public.sanctioned_tournament_participants 
    WHERE tournament_id = NEW.tournament_id AND is_ready = true;
    
    UPDATE public.sanctioned_tournaments 
    SET player_count = actual_count, ready_count = ready_total
    WHERE id = NEW.tournament_id;
    
    RETURN NEW;
  END IF;
END;
$function$;

-- ── migration: 20260126220743_b6b31dc0-3cff-4f6e-beb1-ee99b52a4289.sql ─────────────────────────────────────────
-- Create a trigger function to log crew chat activity
CREATE OR REPLACE FUNCTION public.log_crew_chat_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert activity for chat message
  INSERT INTO public.crew_activity (
    crew_id,
    user_id,
    activity_type,
    title,
    description,
    data
  ) VALUES (
    NEW.crew_id,
    NEW.user_id,
    'chat_message',
    NEW.username || ' sent a message',
    CASE 
      WHEN NEW.message_text LIKE 'https://media.tenor.com%' OR NEW.message_text LIKE 'https://media.giphy.com%' THEN 'Sent a GIF'
      WHEN LENGTH(NEW.message_text) > 50 THEN SUBSTRING(NEW.message_text, 1, 47) || '...'
      ELSE NEW.message_text
    END,
    jsonb_build_object('message_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on crew_messages
DROP TRIGGER IF EXISTS on_crew_message_insert ON public.crew_messages;
CREATE TRIGGER on_crew_message_insert
  AFTER INSERT ON public.crew_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crew_chat_activity();

-- Also add trigger for when users join a crew
CREATE OR REPLACE FUNCTION public.log_crew_member_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  member_username TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the username
    SELECT username INTO member_username FROM public.profiles WHERE id = NEW.user_id;
    
    -- Log the join activity
    INSERT INTO public.crew_activity (
      crew_id,
      user_id,
      activity_type,
      title,
      description,
      data
    ) VALUES (
      NEW.crew_id,
      NEW.user_id,
      'join',
      COALESCE(member_username, 'Someone') || ' joined the crew',
      'Welcome to the squad!',
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on crew_members for join activity
DROP TRIGGER IF EXISTS on_crew_member_join ON public.crew_members;
CREATE TRIGGER on_crew_member_join
  AFTER INSERT ON public.crew_members
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crew_member_activity();

-- ── migration: 20260126222424_b54ed6c5-3158-4f9f-876f-c958f0d47e5c.sql ─────────────────────────────────────────
-- Conversations table to track message threads between users
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL,
  participant_2_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_preview TEXT,
  unread_count_1 INTEGER NOT NULL DEFAULT 0,
  unread_count_2 INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Direct messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Policies for direct messages
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = direct_messages.conversation_id
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = direct_messages.conversation_id
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Helper function to get or create conversation (always stores smaller UUID first for consistency)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user_1 UUID, p_user_2 UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  conv_id UUID;
  sorted_user_1 UUID;
  sorted_user_2 UUID;
BEGIN
  -- Always store in consistent order (smaller UUID first)
  IF p_user_1 < p_user_2 THEN
    sorted_user_1 := p_user_1;
    sorted_user_2 := p_user_2;
  ELSE
    sorted_user_1 := p_user_2;
    sorted_user_2 := p_user_1;
  END IF;

  -- Try to find existing
  SELECT id INTO conv_id
  FROM public.conversations
  WHERE participant_1_id = sorted_user_1 AND participant_2_id = sorted_user_2;

  -- Create if not exists
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (sorted_user_1, sorted_user_2)
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$$;

-- Trigger to update conversation when message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  conv RECORD;
BEGIN
  -- Get conversation details
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  
  -- Update conversation with latest message info and increment unread for recipient
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = CASE 
      WHEN NEW.message_text LIKE 'https://media.tenor.com%' THEN 'Sent a GIF'
      WHEN LENGTH(NEW.message_text) > 50 THEN SUBSTRING(NEW.message_text, 1, 47) || '...'
      ELSE NEW.message_text
    END,
    unread_count_1 = CASE WHEN conv.participant_1_id = NEW.sender_id THEN 0 ELSE unread_count_1 + 1 END,
    unread_count_2 = CASE WHEN conv.participant_2_id = NEW.sender_id THEN 0 ELSE unread_count_2 + 1 END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_direct_message_sent
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_on_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  conv RECORD;
BEGIN
  SELECT * INTO conv FROM public.conversations WHERE id = p_conversation_id;
  
  IF conv IS NULL THEN
    RETURN;
  END IF;
  
  -- Update unread count for the user
  IF conv.participant_1_id = p_user_id THEN
    UPDATE public.conversations SET unread_count_1 = 0 WHERE id = p_conversation_id;
  ELSIF conv.participant_2_id = p_user_id THEN
    UPDATE public.conversations SET unread_count_2 = 0 WHERE id = p_conversation_id;
  END IF;
  
  -- Mark messages as read
  UPDATE public.direct_messages
  SET read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
END;
$$;

-- ── migration: 20260127105807_d1e0ab42-a4a6-4e01-b75f-a7840d4493c7.sql ─────────────────────────────────────────
-- Create table for custom 6-digit OTP codes
CREATE TABLE public.login_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_login_codes_email_code ON public.login_codes (email, code);
CREATE INDEX idx_login_codes_expires ON public.login_codes (expires_at);

-- RLS - only service role can access
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;

-- Clean up expired codes automatically (optional function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_login_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.login_codes WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;

-- ── migration: 20260127113433_9ef0d013-4cf6-4a7b-b477-b79fab5b9513.sql ─────────────────────────────────────────
-- Create tournament_messages table for in-event chat
CREATE TABLE public.tournament_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.sanctioned_tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  message_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournament_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages in tournaments
CREATE POLICY "Anyone can view tournament messages"
ON public.tournament_messages
FOR SELECT
USING (true);

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
ON public.tournament_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete own messages within 5 minutes
CREATE POLICY "Users can delete own messages within 5 minutes"
ON public.tournament_messages
FOR DELETE
USING (auth.uid() = user_id AND created_at > now() - interval '5 minutes');

-- Authority can delete any message
CREATE POLICY "Authority can delete tournament messages"
ON public.tournament_messages
FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'judge') OR 
  has_role(auth.uid(), 'dev')
);

-- Create indexes for faster queries
CREATE INDEX idx_tournament_messages_tournament_id ON public.tournament_messages(tournament_id);
CREATE INDEX idx_tournament_messages_created_at ON public.tournament_messages(created_at);

-- Enable realtime for tournament messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_messages;

-- Add profanity filter trigger using the existing function
CREATE TRIGGER filter_tournament_message_profanity
BEFORE INSERT ON public.tournament_messages
FOR EACH ROW
EXECUTE FUNCTION filter_message_profanity();

-- ── migration: 20260127122052_7d68a571-d9d8-49c6-884c-7ac8ec372db3.sql ─────────────────────────────────────────
-- First drop any partially created objects
DROP TABLE IF EXISTS public.battle_views CASCADE;
DROP TABLE IF EXISTS public.battle_votes CASCADE;
DROP TABLE IF EXISTS public.battles CASCADE;

-- Create battles table for 1v1 UFC-style matchups
CREATE TABLE public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenger_username text NOT NULL,
  opponent_username text,
  challenger_avatar_url text,
  opponent_avatar_url text,
  
  -- Battle config
  challenge_type text NOT NULL DEFAULT 'open' CHECK (challenge_type IN ('open', 'direct')),
  league_tier text NOT NULL DEFAULT 'open',
  duration_hours integer NOT NULL DEFAULT 48 CHECK (duration_hours IN (24, 48, 72)),
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'active', 'judging', 'completed', 'cancelled', 'forfeited')),
  accepted_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  
  -- Submissions
  challenger_submission_url text,
  challenger_submission_platform text,
  challenger_submitted_at timestamptz,
  opponent_submission_url text,
  opponent_submission_platform text,
  opponent_submitted_at timestamptz,
  
  -- Judging (hybrid: judge score + community votes)
  judge_id uuid REFERENCES public.profiles(id),
  judge_claimed_at timestamptz,
  challenger_score numeric,
  opponent_score numeric,
  judge_notes text,
  judged_at timestamptz,
  
  -- Community voting
  challenger_votes integer NOT NULL DEFAULT 0,
  opponent_votes integer NOT NULL DEFAULT 0,
  
  -- View tracking (UFC style)
  view_count integer NOT NULL DEFAULT 0,
  
  -- Winner & rewards
  winner_id uuid REFERENCES public.profiles(id),
  winner_index_awarded integer DEFAULT 20,
  loser_index_penalty integer DEFAULT 5,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create battle votes table for community voting
CREATE TABLE public.battle_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voted_for uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(battle_id, user_id)
);

-- Create battle views table
CREATE TABLE public.battle_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create unique index for views
CREATE UNIQUE INDEX idx_battle_views_unique ON public.battle_views (battle_id, COALESCE(viewer_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(viewer_ip, ''));

-- Enable RLS
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_views ENABLE ROW LEVEL SECURITY;

-- Battles policies
CREATE POLICY "Anyone can view battles" ON public.battles
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create battles" ON public.battles
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Participants can update their battle" ON public.battles
  FOR UPDATE USING (
    auth.uid() = challenger_id OR 
    auth.uid() = opponent_id OR 
    has_role(auth.uid(), 'judge'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'dev'::app_role)
  );

CREATE POLICY "Challengers can delete pending battles" ON public.battles
  FOR DELETE USING (auth.uid() = challenger_id AND status = 'pending');

-- Battle votes policies
CREATE POLICY "Anyone can view votes" ON public.battle_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.battle_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote" ON public.battle_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote" ON public.battle_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Battle views policies
CREATE POLICY "Anyone can view view counts" ON public.battle_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can record views" ON public.battle_views
  FOR INSERT WITH CHECK (true);

-- Function to sync vote counts
CREATE OR REPLACE FUNCTION public.sync_battle_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_votes integer;
  o_votes integer;
  b_record record;
BEGIN
  SELECT * INTO b_record FROM battles 
  WHERE id = COALESCE(NEW.battle_id, OLD.battle_id);
  
  SELECT COUNT(*) INTO c_votes FROM battle_votes 
  WHERE battle_id = b_record.id AND voted_for = b_record.challenger_id;
  
  SELECT COUNT(*) INTO o_votes FROM battle_votes 
  WHERE battle_id = b_record.id AND voted_for = b_record.opponent_id;
  
  UPDATE battles 
  SET challenger_votes = c_votes, opponent_votes = o_votes, updated_at = now()
  WHERE id = b_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_battle_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.battle_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_battle_vote_counts();

-- Function to sync view counts
CREATE OR REPLACE FUNCTION public.sync_battle_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE battles 
  SET view_count = (SELECT COUNT(*) FROM battle_views WHERE battle_id = NEW.battle_id)
  WHERE id = NEW.battle_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_battle_views_trigger
AFTER INSERT ON public.battle_views
FOR EACH ROW EXECUTE FUNCTION public.sync_battle_view_count();

-- Enable realtime for battles
ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;

-- Create indexes for performance
CREATE INDEX idx_battles_status ON public.battles(status);
CREATE INDEX idx_battles_league ON public.battles(league_tier);
CREATE INDEX idx_battles_challenger ON public.battles(challenger_id);
CREATE INDEX idx_battles_opponent ON public.battles(opponent_id);
CREATE INDEX idx_battle_votes_battle ON public.battle_votes(battle_id);
CREATE INDEX idx_battle_views_battle ON public.battle_views(battle_id);

-- ── migration: 20260127123730_eacf0ffa-3add-4ab6-93df-43fabfecd51c.sql ─────────────────────────────────────────
-- Allow users to assign themselves ONLY the trial_judge role during onboarding
CREATE POLICY "Users can self-assign trial_judge role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'trial_judge'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'trial_judge'
  )
);

-- ── migration: 20260127133847_a9ffeb09-42d9-449b-8c23-b444dd0befa0.sql ─────────────────────────────────────────
-- Create battle_invites table for tracking 1v1 battle requests
CREATE TABLE public.battle_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_username TEXT NOT NULL,
  sender_avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (battle_id, recipient_id)
);

-- Enable RLS
ALTER TABLE public.battle_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can view invites they sent or received
CREATE POLICY "Users can view their invites"
ON public.battle_invites
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Authenticated users can create invites for battles they own
CREATE POLICY "Challengers can send battle invites"
ON public.battle_invites
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.battles 
    WHERE id = battle_id 
    AND challenger_id = auth.uid()
    AND status = 'pending'
    AND opponent_id IS NULL
  )
);

-- Recipients can update invite status (accept/decline)
CREATE POLICY "Recipients can respond to invites"
ON public.battle_invites
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Senders can delete their pending invites
CREATE POLICY "Senders can cancel pending invites"
ON public.battle_invites
FOR DELETE
USING (auth.uid() = sender_id AND status = 'pending');

-- Enable realtime for battle_invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_invites;

-- Create function to send battle invite notification
CREATE OR REPLACE FUNCTION public.notify_battle_invite()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.recipient_id,
    'battle_invite',
    '⚔️ 1v1 Challenge!',
    NEW.sender_username || ' wants to 1v1 you in the Arena!',
    jsonb_build_object('battle_id', NEW.battle_id, 'invite_id', NEW.id, 'sender_username', NEW.sender_username)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for battle invite notifications
CREATE TRIGGER on_battle_invite_created
AFTER INSERT ON public.battle_invites
FOR EACH ROW
EXECUTE FUNCTION public.notify_battle_invite();

-- ── migration: 20260128163917_7370c4ed-ce0c-4510-b2cf-2145d68cfdd2.sql ─────────────────────────────────────────
-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can view completed reviews" ON public.review_requests;

-- Create a new policy that allows:
-- 1. Users to see their own requests (any status)
-- 2. Judges/admins/devs to see ALL requests (so they can pick up pending ones)
-- 3. Anyone to see completed/reviewed requests (for public feed)
CREATE POLICY "Users and judges can view review requests"
ON public.review_requests
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
  OR status = 'reviewed'
);

-- ── migration: 20260128175512_ab078796-959c-4566-ba7d-37e902b77d9a.sql ─────────────────────────────────────────
-- Add judge_xp and judge_review_count to profiles for judge progression tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS judge_xp integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS judge_review_count integer NOT NULL DEFAULT 0;

-- Create table for judge rating videos (viral content that brings editors to loopgate)
CREATE TABLE public.judge_rating_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  video_url text NOT NULL,
  title text,
  views_at_submission integer DEFAULT 0,
  current_views integer DEFAULT 0,
  viral_bonus_awarded boolean DEFAULT false,
  bonus_xp_awarded integer DEFAULT 0,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.judge_rating_videos ENABLE ROW LEVEL SECURITY;

-- Policies for judge rating videos
CREATE POLICY "Anyone can view rating videos"
  ON public.judge_rating_videos FOR SELECT
  USING (true);

CREATE POLICY "Judges can submit their rating videos"
  ON public.judge_rating_videos FOR INSERT
  WITH CHECK (
    auth.uid() = judge_id AND (
      has_role(auth.uid(), 'judge') OR 
      has_role(auth.uid(), 'trial_judge') OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'dev')
    )
  );

CREATE POLICY "Judges can update their own videos"
  ON public.judge_rating_videos FOR UPDATE
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can delete their own videos"
  ON public.judge_rating_videos FOR DELETE
  USING (auth.uid() = judge_id);

-- Function to award Judge XP
CREATE OR REPLACE FUNCTION public.award_judge_xp(
  p_judge_id uuid,
  p_amount integer,
  p_action text,
  p_description text DEFAULT NULL
)
RETURNS TABLE(new_judge_xp integer, new_review_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp integer;
  v_review_count integer;
BEGIN
  -- Update judge XP and review count
  UPDATE profiles
  SET 
    judge_xp = judge_xp + p_amount,
    judge_review_count = CASE 
      WHEN p_action = 'review_completed' THEN judge_review_count + 1 
      ELSE judge_review_count 
    END
  WHERE id = p_judge_id
  RETURNING judge_xp, judge_review_count INTO v_new_xp, v_review_count;

  -- Also award regular XP (judge actions also give editor XP)
  PERFORM award_xp(p_judge_id, p_amount, p_action, p_description);

  RETURN QUERY SELECT v_new_xp, v_review_count;
END;
$$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_judge_xp ON public.profiles(judge_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_judge_review_count ON public.profiles(judge_review_count DESC);
CREATE INDEX IF NOT EXISTS idx_judge_rating_videos_judge_id ON public.judge_rating_videos(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_rating_videos_views ON public.judge_rating_videos(current_views DESC);

-- ── migration: 20260128182143_6e6b2374-6164-45a6-8a22-3535701a7418.sql ─────────────────────────────────────────
-- Add columns to track rating mode and selected tier for judge reviews
ALTER TABLE public.review_requests
ADD COLUMN rating_mode text DEFAULT 'full',
ADD COLUMN selected_tier text DEFAULT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN public.review_requests.rating_mode IS 'The scoring mode used: full, vibes, two_pillar, or tier_only';
COMMENT ON COLUMN public.review_requests.selected_tier IS 'The tier selected when using tier_only mode (S, A, B, C, D, F)';

-- ── migration: 20260129013957_b94faca4-5527-4f3b-9060-16f1695b03bc.sql ─────────────────────────────────────────
-- Create hosted_competitions table
CREATE TABLE public.hosted_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  host_user_id uuid NOT NULL,
  host_crew_id uuid REFERENCES public.crews(id) ON DELETE SET NULL,
  host_name text NOT NULL, -- Discord server name or creator name
  host_avatar_url text,
  poster_url text,
  
  -- Competition settings
  format text NOT NULL DEFAULT 'battle_royale', -- battle_royale, bracket, round_robin
  max_submissions integer,
  submission_deadline timestamp with time zone NOT NULL,
  
  -- Status flow: pending -> approved -> live -> judging -> completed / rejected
  status text NOT NULL DEFAULT 'pending',
  approved_at timestamp with time zone,
  approved_by uuid,
  rejection_reason text,
  
  -- Rewards (optional - host decides)
  prize_description text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create hosted_competition_submissions table
CREATE TABLE public.hosted_competition_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.hosted_competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  
  -- Submission details
  platform text NOT NULL, -- tiktok, instagram, youtube
  submission_url text NOT NULL,
  
  -- Scoring (by host or invited judges)
  score integer,
  scored_by uuid,
  scored_at timestamp with time zone,
  judge_notes text,
  
  -- Ranking
  final_rank integer,
  
  -- Timestamps
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(competition_id, user_id)
);

-- Create hosted_competition_judges table (invited judges)
CREATE TABLE public.hosted_competition_judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.hosted_competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  invited_by uuid NOT NULL,
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  
  UNIQUE(competition_id, user_id)
);

-- Enable RLS
ALTER TABLE public.hosted_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosted_competition_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosted_competition_judges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hosted_competitions
CREATE POLICY "Anyone can view approved competitions"
ON public.hosted_competitions FOR SELECT
USING (status IN ('approved', 'live', 'judging', 'completed') OR host_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Authenticated users can create competitions"
ON public.hosted_competitions FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their competitions"
ON public.hosted_competitions FOR UPDATE
USING (host_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Admins can delete competitions"
ON public.hosted_competitions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

-- RLS Policies for hosted_competition_submissions
CREATE POLICY "Anyone can view submissions for live competitions"
ON public.hosted_competition_submissions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id 
  AND (hc.status IN ('live', 'judging', 'completed') OR hc.host_user_id = auth.uid())
) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can submit to live competitions"
ON public.hosted_competition_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id AND hc.status = 'live'
));

CREATE POLICY "Hosts and judges can score submissions"
ON public.hosted_competition_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.hosted_competitions hc 
    WHERE hc.id = competition_id AND hc.host_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.hosted_competition_judges hcj 
    WHERE hcj.competition_id = hosted_competition_submissions.competition_id 
    AND hcj.user_id = auth.uid() AND hcj.status = 'accepted'
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for hosted_competition_judges
CREATE POLICY "Anyone can view judges"
ON public.hosted_competition_judges FOR SELECT
USING (true);

CREATE POLICY "Hosts can invite judges"
ON public.hosted_competition_judges FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id AND hc.host_user_id = auth.uid()
));

CREATE POLICY "Invited users can respond to invites"
ON public.hosted_competition_judges FOR UPDATE
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id AND hc.host_user_id = auth.uid()
));

CREATE POLICY "Hosts can remove judges"
ON public.hosted_competition_judges FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.hosted_competitions hc 
  WHERE hc.id = competition_id AND hc.host_user_id = auth.uid()
) OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.hosted_competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hosted_competition_submissions;

-- ── migration: 20260129015907_0a826afb-fe05-491e-8d55-bf6cc09c85ad.sql ─────────────────────────────────────────
-- Add is_featured column to hosted_competitions
ALTER TABLE public.hosted_competitions
ADD COLUMN is_featured boolean DEFAULT false,
ADD COLUMN featured_at timestamp with time zone;

-- Create index for featured comps queries
CREATE INDEX idx_hosted_competitions_featured ON public.hosted_competitions(is_featured, status) WHERE is_featured = true;

-- ── migration: 20260129020742_a05dd4c8-2afa-4530-9b27-41a47667c9b7.sql ─────────────────────────────────────────
-- Add community URL and rules fields to hosted_competitions
ALTER TABLE public.hosted_competitions
ADD COLUMN community_url text,
ADD COLUMN rules text;

-- ── migration: 20260129043228_36355539-67a8-45d7-819e-c7ed0864b88f.sql ─────────────────────────────────────────
-- Create hosted_comp_messages table for competition chat
CREATE TABLE IF NOT EXISTS public.hosted_comp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.hosted_competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hosted_comp_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages
CREATE POLICY "Anyone can read comp messages"
ON public.hosted_comp_messages FOR SELECT
USING (true);

-- Authenticated users can insert their own messages
CREATE POLICY "Users can send messages"
ON public.hosted_comp_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages within 5 minutes
CREATE POLICY "Users can delete own recent messages"
ON public.hosted_comp_messages FOR DELETE
USING (
  auth.uid() = user_id 
  AND created_at > now() - INTERVAL '5 minutes'
);

-- Apply profanity filter trigger
CREATE TRIGGER filter_hosted_comp_message_profanity
  BEFORE INSERT ON public.hosted_comp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.filter_message_profanity();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hosted_comp_messages;

-- Index for performance
CREATE INDEX idx_hosted_comp_messages_comp_id ON public.hosted_comp_messages(competition_id);
CREATE INDEX idx_hosted_comp_messages_created ON public.hosted_comp_messages(created_at);

-- ── migration: 20260129044144_012450c1-ff30-4d7a-90a1-956bc56fe299.sql ─────────────────────────────────────────
-- Participants table (editors who "joined" before submitting)
CREATE TABLE public.hosted_competition_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.hosted_competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_ready BOOLEAN DEFAULT false,
  UNIQUE(competition_id, user_id)
);

-- Enable RLS
ALTER TABLE public.hosted_competition_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view participants" ON public.hosted_competition_participants
FOR SELECT USING (true);

CREATE POLICY "Users can join competitions" ON public.hosted_competition_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave competitions" ON public.hosted_competition_participants
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON public.hosted_competition_participants
FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hosted_competition_participants;

-- Add view tracking and activity columns to hosted_competitions
ALTER TABLE public.hosted_competitions 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_hosted_comp_views(comp_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE hosted_competitions
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = comp_id;
END;
$$;

-- Trigger to sync participant count
CREATE OR REPLACE FUNCTION public.sync_hosted_comp_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comp_id UUID;
  new_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    comp_id := OLD.competition_id;
  ELSE
    comp_id := NEW.competition_id;
  END IF;

  SELECT COUNT(*) INTO new_count
  FROM hosted_competition_participants
  WHERE competition_id = comp_id;

  UPDATE hosted_competitions
  SET participant_count = new_count
  WHERE id = comp_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER sync_hosted_comp_participants
AFTER INSERT OR DELETE ON public.hosted_competition_participants
FOR EACH ROW EXECUTE FUNCTION public.sync_hosted_comp_participant_count();

-- Add scoring_mode to submissions for flexible judging
ALTER TABLE public.hosted_competition_submissions
ADD COLUMN IF NOT EXISTS creativity_score INTEGER,
ADD COLUMN IF NOT EXISTS quality_score INTEGER,
ADD COLUMN IF NOT EXISTS impact_score INTEGER,
ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS winner_place INTEGER;

-- System messages for chat (automated logs)
ALTER TABLE public.hosted_comp_messages
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'chat';

-- Function to post system message
CREATE OR REPLACE FUNCTION public.post_hosted_comp_system_message(
  p_competition_id UUID,
  p_message TEXT,
  p_message_type TEXT DEFAULT 'system'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO hosted_comp_messages (competition_id, user_id, username, message_text, is_system, message_type)
  VALUES (p_competition_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', p_message, true, p_message_type);
END;
$$;

-- Trigger: Auto post when someone joins
CREATE OR REPLACE FUNCTION public.hosted_comp_join_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.post_hosted_comp_system_message(
    NEW.competition_id,
    '@' || NEW.username || ' joined the competition',
    'join'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_hosted_comp_join
AFTER INSERT ON public.hosted_competition_participants
FOR EACH ROW EXECUTE FUNCTION public.hosted_comp_join_notification();

-- Trigger: Auto post when someone submits
CREATE OR REPLACE FUNCTION public.hosted_comp_submission_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.post_hosted_comp_system_message(
    NEW.competition_id,
    '@' || NEW.username || ' submitted an edit 🔥',
    'submission'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_hosted_comp_submission
AFTER INSERT ON public.hosted_competition_submissions
FOR EACH ROW EXECUTE FUNCTION public.hosted_comp_submission_notification();

-- ── migration: 20260129050645_04c33642-2020-4d22-b418-99fb8f8339f8.sql ─────────────────────────────────────────
-- Add slug column to hosted_competitions
ALTER TABLE public.hosted_competitions 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create function to generate hosted comp slug
CREATE OR REPLACE FUNCTION public.generate_hosted_comp_slug(comp_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert name to slug format
  base_slug := lower(regexp_replace(comp_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 50);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM hosted_competitions WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-set slug on insert
CREATE OR REPLACE FUNCTION public.set_hosted_comp_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_hosted_comp_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_hosted_comp_slug_trigger ON hosted_competitions;
CREATE TRIGGER set_hosted_comp_slug_trigger
  BEFORE INSERT ON hosted_competitions
  FOR EACH ROW
  EXECUTE FUNCTION set_hosted_comp_slug();

-- Backfill existing competitions with slugs
UPDATE hosted_competitions 
SET slug = generate_hosted_comp_slug(name)
WHERE slug IS NULL;

-- ── migration: 20260130160929_5d82dcf7-b13f-4988-b6f8-7ff48a2aa5cc.sql ─────────────────────────────────────────
-- Add poster_urls array column for multiple background images
ALTER TABLE public.hosted_competitions 
ADD COLUMN poster_urls TEXT[] DEFAULT NULL;

-- Backfill existing poster_url into poster_urls array
UPDATE public.hosted_competitions 
SET poster_urls = ARRAY[poster_url]
WHERE poster_url IS NOT NULL;

-- ── migration: 20260130172831_0a060370-2ecc-475a-a291-8514a36726b2.sql ─────────────────────────────────────────
-- Add storage policy to allow authenticated users to upload hosted comp avatars
CREATE POLICY "Allow authenticated users to upload hosted comp avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = 'hosted-comps'
);

-- Allow anyone to read avatars (already public bucket but explicit policy helps)
CREATE POLICY "Allow public read access to all avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to update hosted comp avatars
CREATE POLICY "Allow authenticated users to update hosted comp avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = 'hosted-comps'
);

-- Allow authenticated users to delete hosted comp avatars
CREATE POLICY "Allow authenticated users to delete hosted comp avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = 'hosted-comps'
);

-- ── migration: 20260203065633_5a4ddf70-987d-4de0-aca2-49cf91d506e2.sql ─────────────────────────────────────────
-- Add max_members column to crews table (nullable = unlimited)
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS max_members integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.crews.max_members IS 'Maximum number of members allowed. NULL means unlimited.';

-- ── migration: 20260205013659_92482f2d-135a-4f80-9cbc-4624b25e2957.sql ─────────────────────────────────────────
-- Create feed_comments table for TikTok-style comments on submissions
CREATE TABLE public.feed_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Link to submission (composite key approach)
  submission_id TEXT NOT NULL, -- Format: "arena_{id}" or "review_{id}"
  submission_type TEXT NOT NULL CHECK (submission_type IN ('arena', 'review')),
  
  -- Comment content
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  
  -- Reply support (single-level)
  parent_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  
  -- Engagement
  like_count INT NOT NULL DEFAULT 0,
  reply_count INT NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feed_comment_likes table for tracking who liked what
CREATE TABLE public.feed_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_feed_comments_submission ON public.feed_comments(submission_id, submission_type);
CREATE INDEX idx_feed_comments_parent ON public.feed_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_feed_comments_user ON public.feed_comments(user_id);
CREATE INDEX idx_feed_comment_likes_comment ON public.feed_comment_likes(comment_id);
CREATE INDEX idx_feed_comment_likes_user ON public.feed_comment_likes(user_id);

-- Enable RLS
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feed_comments
CREATE POLICY "Comments are viewable by everyone" 
ON public.feed_comments FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" 
ON public.feed_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.feed_comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.feed_comments FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for feed_comment_likes
CREATE POLICY "Comment likes are viewable by everyone" 
ON public.feed_comment_likes FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.feed_comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.feed_comment_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Function to increment like count
CREATE OR REPLACE FUNCTION public.handle_feed_comment_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for like count updates
CREATE TRIGGER on_feed_comment_like
AFTER INSERT OR DELETE ON public.feed_comment_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_feed_comment_like();

-- Function to increment reply count on parent
CREATE OR REPLACE FUNCTION public.handle_feed_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.feed_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.feed_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for reply count updates
CREATE TRIGGER on_feed_comment_reply
AFTER INSERT OR DELETE ON public.feed_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_feed_comment_reply();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comments;

-- ── migration: 20260205030926_49a2782e-1028-46dd-bc7e-2bcda25a21be.sql ─────────────────────────────────────────
-- Connections table (handles both requests and established connections)
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- Index for fast lookups
CREATE INDEX idx_connections_sender ON public.connections(sender_id);
CREATE INDEX idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX idx_connections_status ON public.connections(status);

-- Weekly request limit tracking
CREATE TABLE public.connection_request_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  requests_sent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Add connection_count to profiles for fast display
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connection_count INTEGER NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_request_limits ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own connections (sent or received)
CREATE POLICY "Users can view their own connections"
ON public.connections FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS: Users can send connection requests
CREATE POLICY "Users can send connection requests"
ON public.connections FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- RLS: Users can update connections they received (accept/reject)
CREATE POLICY "Users can respond to connection requests"
ON public.connections FOR UPDATE
USING (auth.uid() = receiver_id AND status = 'pending');

-- RLS: Users can delete their sent pending requests
CREATE POLICY "Users can cancel their pending requests"
ON public.connections FOR DELETE
USING (auth.uid() = sender_id AND status = 'pending');

-- RLS for request limits - users can only see/update their own
CREATE POLICY "Users can view their own request limits"
ON public.connection_request_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own request limits"
ON public.connection_request_limits FOR ALL
USING (auth.uid() = user_id);

-- Function to increment connection count when accepted
CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Increment both users' connection counts
    UPDATE public.profiles SET connection_count = connection_count + 1 WHERE id = NEW.sender_id;
    UPDATE public.profiles SET connection_count = connection_count + 1 WHERE id = NEW.receiver_id;
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for connection acceptance
CREATE TRIGGER on_connection_accepted
BEFORE UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_connection_accepted();

-- Function to decrement connection count if connection is removed
CREATE OR REPLACE FUNCTION public.handle_connection_removed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'accepted' THEN
    UPDATE public.profiles SET connection_count = GREATEST(0, connection_count - 1) WHERE id = OLD.sender_id;
    UPDATE public.profiles SET connection_count = GREATEST(0, connection_count - 1) WHERE id = OLD.receiver_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for connection removal
CREATE TRIGGER on_connection_removed
BEFORE DELETE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_connection_removed();

-- Enable realtime for connections (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;

-- ── migration: 20260205030935_7728b059-d8b6-4c54-9da9-ca51dc098721.sql ─────────────────────────────────────────
-- Fix the overly permissive policy on connection_request_limits
DROP POLICY IF EXISTS "Users can manage their own request limits" ON public.connection_request_limits;

-- Create specific policies for INSERT and UPDATE
CREATE POLICY "Users can insert their own request limits"
ON public.connection_request_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own request limits"
ON public.connection_request_limits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own request limits"
ON public.connection_request_limits FOR DELETE
USING (auth.uid() = user_id);

-- ── migration: 20260205073930_f96fbfb9-62f3-4597-9f34-9eae6ac63e1c.sql ─────────────────────────────────────────
-- Fix the UPDATE policy for connections to allow receivers to update pending requests to accepted/rejected
DROP POLICY IF EXISTS "Users can respond to connection requests" ON public.connections;

CREATE POLICY "Users can respond to connection requests"
ON public.connections
FOR UPDATE
USING (
  auth.uid() = receiver_id 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = receiver_id
  AND status IN ('accepted', 'rejected')
);

-- Also add a policy for senders to delete their connections (for removing accepted connections)
DROP POLICY IF EXISTS "Users can remove accepted connections" ON public.connections;

CREATE POLICY "Users can remove accepted connections"
ON public.connections
FOR DELETE
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND status = 'accepted'
);

-- ── migration: 20260205083138_2c57d07c-8126-41af-aa7a-9776593c025b.sql ─────────────────────────────────────────
-- Add profile background customization columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_bg_color TEXT DEFAULT 'gold',
ADD COLUMN IF NOT EXISTS profile_bg_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.profile_bg_color IS 'User-selected background color for public profile: gold, purple, cyan, red, emerald, zinc';
COMMENT ON COLUMN public.profiles.profile_bg_image_url IS 'Background image URL for public profile (Level 3+ only)';

-- ── migration: 20260205083742_44a6c9cc-d233-472e-a61a-78fdb6e7d6db.sql ─────────────────────────────────────────
-- Create trigger function to notify on new connection request
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_username TEXT;
  sender_avatar TEXT;
BEGIN
  -- Only notify on new pending connections
  IF NEW.status = 'pending' THEN
    -- Get sender info
    SELECT username, avatar_url INTO sender_username, sender_avatar
    FROM public.profiles WHERE id = NEW.sender_id;
    
    -- Create notification for receiver
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.receiver_id,
      'connection_request',
      'New Connection Request',
      '@' || COALESCE(sender_username, 'Someone') || ' wants to connect with you',
      jsonb_build_object(
        'sender_id', NEW.sender_id,
        'sender_username', sender_username,
        'sender_avatar', sender_avatar,
        'connection_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_connection_request_created ON public.connections;
CREATE TRIGGER on_connection_request_created
  AFTER INSERT ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_request();

-- Create trigger function to notify when connection is accepted
CREATE OR REPLACE FUNCTION public.notify_connection_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  accepter_username TEXT;
  accepter_avatar TEXT;
BEGIN
  -- Only notify when status changes to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Get accepter (receiver) info
    SELECT username, avatar_url INTO accepter_username, accepter_avatar
    FROM public.profiles WHERE id = NEW.receiver_id;
    
    -- Create notification for original sender
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.sender_id,
      'connection_accepted',
      'Connection Accepted! 🎉',
      '@' || COALESCE(accepter_username, 'Someone') || ' accepted your connection request',
      jsonb_build_object(
        'user_id', NEW.receiver_id,
        'username', accepter_username,
        'avatar', accepter_avatar,
        'connection_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for acceptance
DROP TRIGGER IF EXISTS on_connection_accepted ON public.connections;
CREATE TRIGGER on_connection_accepted
  AFTER UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_accepted();

-- ── migration: 20260206004938_78317c28-70db-4230-a942-9dc43d9cd375.sql ─────────────────────────────────────────
-- Unit Editor Tiers (custom per crew)
CREATE TABLE public.crew_editor_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tier_order INTEGER NOT NULL DEFAULT 1,
  color TEXT DEFAULT '#FFD700',
  icon TEXT DEFAULT '⭐',
  perks JSONB DEFAULT '[]'::jsonb,
  requirements TEXT,
  application_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unit Editor Applications
CREATE TABLE public.crew_editor_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.crew_editor_tiers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unit Editors (approved applicants)
CREATE TABLE public.crew_editors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tier_id UUID NOT NULL REFERENCES public.crew_editor_tiers(id) ON DELETE CASCADE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crew_id, user_id)
);

-- Unit Channels (Discord-like)
CREATE TABLE public.crew_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'text',
  category TEXT,
  category_order INTEGER DEFAULT 0,
  channel_order INTEGER DEFAULT 0,
  is_editor_only BOOLEAN DEFAULT false,
  min_tier_order INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unit Channel Messages
CREATE TABLE public.crew_channel_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.crew_channels(id) ON DELETE CASCADE,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_bot BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unit Assets (logos, PFPs, overlays for editors)
CREATE TABLE public.crew_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'logo',
  asset_url TEXT NOT NULL,
  min_tier_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_editor_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_editor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crew_editor_tiers (public read, owner/officer write)
CREATE POLICY "Anyone can view tiers" ON public.crew_editor_tiers FOR SELECT USING (true);
CREATE POLICY "Crew officers can manage tiers" ON public.crew_editor_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_editor_tiers.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- RLS Policies for applications
CREATE POLICY "Users can view their own applications" ON public.crew_editor_applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Crew officers can view all applications" ON public.crew_editor_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_editor_applications.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);
CREATE POLICY "Anyone can apply" ON public.crew_editor_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Crew officers can update applications" ON public.crew_editor_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_editor_applications.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- RLS Policies for editors
CREATE POLICY "Anyone can view editors" ON public.crew_editors FOR SELECT USING (true);
CREATE POLICY "Crew officers can manage editors" ON public.crew_editors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_editors.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- RLS Policies for channels
CREATE POLICY "Members can view channels" ON public.crew_channels FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_channels.crew_id AND user_id = auth.uid())
  OR NOT is_editor_only
);
CREATE POLICY "Crew officers can manage channels" ON public.crew_channels FOR ALL USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_channels.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- RLS Policies for channel messages
CREATE POLICY "Members can view channel messages" ON public.crew_channel_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_channel_messages.crew_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.crew_channel_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_channel_messages.crew_id AND user_id = auth.uid())
);

-- RLS Policies for assets
CREATE POLICY "Editors can view assets based on tier" ON public.crew_assets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.crew_editors ce 
    JOIN public.crew_editor_tiers t ON ce.tier_id = t.id 
    WHERE ce.crew_id = crew_assets.crew_id AND ce.user_id = auth.uid() AND t.tier_order >= crew_assets.min_tier_order
  )
  OR EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_assets.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);
CREATE POLICY "Crew officers can manage assets" ON public.crew_assets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = crew_assets.crew_id AND user_id = auth.uid() AND role IN ('owner', 'officer'))
);

-- Enable realtime for channels
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_channel_messages;

-- Indexes
CREATE INDEX idx_crew_editor_tiers_crew ON public.crew_editor_tiers(crew_id);
CREATE INDEX idx_crew_editor_applications_crew ON public.crew_editor_applications(crew_id);
CREATE INDEX idx_crew_editor_applications_user ON public.crew_editor_applications(user_id);
CREATE INDEX idx_crew_editors_crew ON public.crew_editors(crew_id);
CREATE INDEX idx_crew_editors_user ON public.crew_editors(user_id);
CREATE INDEX idx_crew_channels_crew ON public.crew_channels(crew_id);
CREATE INDEX idx_crew_channel_messages_channel ON public.crew_channel_messages(channel_id);
CREATE INDEX idx_crew_assets_crew ON public.crew_assets(crew_id);

-- ── migration: 20260206005315_d9a87813-93bf-434a-99ea-6f0fae72ba5a.sql ─────────────────────────────────────────
-- Create storage bucket for crew assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crew-assets', 'crew-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for crew assets bucket
CREATE POLICY "Anyone can view crew assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'crew-assets');

CREATE POLICY "Crew officers can upload assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'crew-assets' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Crew officers can delete assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'crew-assets' AND 
  auth.uid() IS NOT NULL
);

-- ── migration: 20260206005619_cd23657c-5496-4143-8f10-dae29f40c8aa.sql ─────────────────────────────────────────
-- Add challenge templates table for reusable quest definitions
CREATE TABLE public.crew_challenge_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'weekly',
  xp_reward INTEGER NOT NULL DEFAULT 100,
  target_value INTEGER NOT NULL DEFAULT 1,
  target_metric TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'normal', -- easy, normal, hard, legendary
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_challenge_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates
CREATE POLICY "Anyone can view challenge templates"
ON public.crew_challenge_templates FOR SELECT USING (true);

-- Seed challenge templates with diverse quest types
INSERT INTO public.crew_challenge_templates (title, description, challenge_type, xp_reward, target_value, target_metric, difficulty) VALUES
-- Judge Review Quests
('Rising Stars', 'Have a crew member receive a C tier or higher from a judge review', 'weekly', 150, 1, 'judge_review_c_plus', 'normal'),
('Excellence Pursuit', 'Have a crew member receive a B tier or higher from a judge review', 'weekly', 250, 1, 'judge_review_b_plus', 'hard'),
('S-Tier Hunters', 'Have a crew member receive an S tier from a judge review', 'weekly', 500, 1, 'judge_review_s', 'legendary'),
('Review Rush', 'Crew members receive 3 judge reviews total', 'weekly', 200, 3, 'judge_reviews_received', 'normal'),

-- Submission Quests
('Content Creators', 'Submit 5 videos across the crew', 'weekly', 150, 5, 'submissions', 'normal'),
('Prolific Crew', 'Submit 10 videos across the crew', 'weekly', 300, 10, 'submissions', 'hard'),

-- Activity Quests
('Growing Community', 'Gain 2 new crew members', 'weekly', 200, 2, 'members', 'normal'),
('Arena Warriors', 'Win 3 arena battles as a crew', 'weekly', 250, 3, 'arena_wins', 'hard'),

-- GQT Quests
('Self-Assessment', 'Have 3 members complete their GQT', 'weekly', 150, 3, 'gqt_scores', 'normal'),
('High Standards', 'Have a member score 70+ on their GQT', 'weekly', 200, 1, 'gqt_score_70_plus', 'normal'),

-- Daily Quests
('Daily Grind', 'Crew earns 100 XP today', 'daily', 50, 100, 'crew_xp', 'easy'),
('Quick Submit', 'Submit 1 video today', 'daily', 30, 1, 'submissions', 'easy'),

-- Special/Rare Quests  
('Unit Pride', 'Have 5 members display crew badge on profile', 'special', 300, 5, 'badge_displays', 'normal'),
('Viral Moment', 'A crew member gets 10k+ views on a submission', 'special', 400, 1, 'viral_submission', 'legendary');

-- Function to generate new challenges for a crew
CREATE OR REPLACE FUNCTION public.generate_crew_challenges(p_crew_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_count INTEGER;
  v_new_count INTEGER := 0;
  v_template RECORD;
  v_existing_ids UUID[];
  v_new_challenge_id UUID;
BEGIN
  -- Get count of active challenges for this crew
  SELECT COUNT(*) INTO v_active_count
  FROM crew_challenges c
  JOIN crew_challenge_progress p ON p.challenge_id = c.id
  WHERE p.crew_id = p_crew_id
    AND c.is_active = true
    AND c.ends_at > now()
    AND p.xp_claimed = false;

  -- If crew has less than 3 active quests, generate more
  IF v_active_count < 3 THEN
    -- Get IDs of challenges this crew already has (active or recently completed)
    SELECT ARRAY_AGG(c.id) INTO v_existing_ids
    FROM crew_challenges c
    JOIN crew_challenge_progress p ON p.challenge_id = c.id
    WHERE p.crew_id = p_crew_id
      AND c.ends_at > (now() - interval '7 days');

    -- Pick random templates and create new challenges
    FOR v_template IN
      SELECT * FROM crew_challenge_templates
      WHERE is_active = true
      ORDER BY random()
      LIMIT (3 - v_active_count)
    LOOP
      -- Create the challenge
      INSERT INTO crew_challenges (
        title, description, challenge_type, xp_reward, 
        target_value, target_metric, is_active,
        starts_at, ends_at
      ) VALUES (
        v_template.title,
        v_template.description,
        v_template.challenge_type,
        v_template.xp_reward,
        v_template.target_value,
        v_template.target_metric,
        true,
        now(),
        CASE 
          WHEN v_template.challenge_type = 'daily' THEN now() + interval '1 day'
          WHEN v_template.challenge_type = 'special' THEN now() + interval '14 days'
          ELSE now() + interval '7 days'
        END
      )
      RETURNING id INTO v_new_challenge_id;

      -- Auto-init progress for requesting crew
      INSERT INTO crew_challenge_progress (crew_id, challenge_id, current_value)
      VALUES (p_crew_id, v_new_challenge_id, 0)
      ON CONFLICT (crew_id, challenge_id) DO NOTHING;

      v_new_count := v_new_count + 1;
    END LOOP;
  END IF;

  RETURN v_new_count;
END;
$$;

-- Trigger function to auto-generate quests when one is claimed
CREATE OR REPLACE FUNCTION public.on_challenge_claimed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When XP is claimed, try to generate new challenges for this crew
  IF NEW.xp_claimed = true AND (OLD.xp_claimed = false OR OLD.xp_claimed IS NULL) THEN
    PERFORM generate_crew_challenges(NEW.crew_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_generate_challenges_on_claim ON crew_challenge_progress;
CREATE TRIGGER trigger_generate_challenges_on_claim
  AFTER UPDATE ON crew_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION on_challenge_claimed();

-- ── migration: 20260206010215_248e3200-0917-40fc-aecb-ed1a5cd2e8ac.sql ─────────────────────────────────────────
-- Create function to get unread count per channel for a user (if not exists)
CREATE OR REPLACE FUNCTION public.get_channel_unread_counts(p_user_id UUID, p_crew_id UUID)
RETURNS TABLE(channel_id UUID, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id as channel_id,
    COUNT(m.id)::BIGINT as unread_count
  FROM public.crew_channels ch
  LEFT JOIN public.crew_channel_reads r ON r.channel_id = ch.id AND r.user_id = p_user_id
  LEFT JOIN public.crew_channel_messages m ON m.channel_id = ch.id 
    AND m.created_at > COALESCE(r.last_read_at, '1970-01-01'::timestamptz)
    AND m.user_id != p_user_id
  WHERE ch.crew_id = p_crew_id
  GROUP BY ch.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── migration: 20260206014746_7f920f3a-fc8c-41ea-9ddd-7ee28d8b0522.sql ─────────────────────────────────────────
-- Allow users to delete their own direct messages
CREATE POLICY "Users can delete their own direct messages"
ON public.direct_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- ── migration: 20260206015127_22254640-ff60-47b0-a8c4-cb6e24e46193.sql ─────────────────────────────────────────
-- Add label column to conversations for user-defined labels (client, friend, rival, etc.)
ALTER TABLE public.conversations 
ADD COLUMN label_1 TEXT DEFAULT NULL,
ADD COLUMN label_2 TEXT DEFAULT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN public.conversations.label_1 IS 'Custom label set by participant 1 for this conversation';
COMMENT ON COLUMN public.conversations.label_2 IS 'Custom label set by participant 2 for this conversation';

-- Allow users to delete their own conversations (soft delete by removing themselves)
CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Allow users to update labels on their conversations
CREATE POLICY "Users can update their conversation labels"
ON public.conversations
FOR UPDATE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- ── migration: 20260206135756_0f4c8620-ab90-4ef6-b8cb-fe3c7cfb244b.sql ─────────────────────────────────────────
-- Add thumbnail_url to judge_rating_videos for cached/custom thumbnails
ALTER TABLE public.judge_rating_videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add thumbnail_url to event_participations for cached/custom thumbnails
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add thumbnail_url to round_participations for cached/custom thumbnails
ALTER TABLE public.round_participations ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add thumbnail_url to sanctioned_tournament_participants for cached/custom thumbnails
ALTER TABLE public.sanctioned_tournament_participants ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- ── migration: 20260206140931_862ae55b-4414-4bcf-b07d-8961acb3cae6.sql ─────────────────────────────────────────

-- Create storage bucket for video thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('video-thumbnails', 'video-thumbnails', true);

-- Allow authenticated users to upload
CREATE POLICY "Users can upload video thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'video-thumbnails' AND auth.uid() IS NOT NULL);

-- Allow public read
CREATE POLICY "Video thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-thumbnails');

-- Allow users to update their own thumbnails
CREATE POLICY "Users can update own video thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'video-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own thumbnails
CREATE POLICY "Users can delete own video thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'video-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── migration: 20260206142308_850f89e1-91f7-4d30-9013-a53fd08765f9.sql ─────────────────────────────────────────

-- Add recovery code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS recovery_code TEXT;

-- Add device tracking to active_sessions
ALTER TABLE public.active_sessions ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE public.active_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.active_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Add has_password flag to profiles (so we don't rely on unreliable metadata detection)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT false;


-- ── migration: 20260206161727_1da12d06-c682-4953-8caf-77d6640f4532.sql ─────────────────────────────────────────

-- Unit Feed Posts table
CREATE TABLE public.unit_feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'edit' CHECK (post_type IN ('edit', 'announcement', 'win', 'logo_preview')),
  content TEXT,
  media_url TEXT,
  media_platform TEXT,
  thumbnail_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unit Feed Reactions table
CREATE TABLE public.unit_feed_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.unit_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Unit Feed Comments table
CREATE TABLE public.unit_feed_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.unit_feed_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.unit_feed_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_unit_feed_posts_crew ON public.unit_feed_posts(crew_id, created_at DESC);
CREATE INDEX idx_unit_feed_posts_pinned ON public.unit_feed_posts(crew_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_unit_feed_reactions_post ON public.unit_feed_reactions(post_id);
CREATE INDEX idx_unit_feed_comments_post ON public.unit_feed_comments(post_id, created_at);
CREATE INDEX idx_unit_feed_comments_parent ON public.unit_feed_comments(parent_id);

-- Enable RLS
ALTER TABLE public.unit_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_feed_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Posts
CREATE POLICY "Anyone can view unit feed posts" ON public.unit_feed_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.unit_feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.unit_feed_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.unit_feed_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Reactions
CREATE POLICY "Anyone can view reactions" ON public.unit_feed_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON public.unit_feed_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.unit_feed_reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Comments
CREATE POLICY "Anyone can view comments" ON public.unit_feed_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.unit_feed_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.unit_feed_comments FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_feed_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_feed_comments;


-- ── migration: 20260206161743_2459f177-2c8c-46ec-a015-89b992769a15.sql ─────────────────────────────────────────

-- Tighten insert policies to require auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.unit_feed_posts;
CREATE POLICY "Authenticated users can create posts" ON public.unit_feed_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can react" ON public.unit_feed_reactions;
CREATE POLICY "Authenticated users can react" ON public.unit_feed_reactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.unit_feed_comments;
CREATE POLICY "Authenticated users can comment" ON public.unit_feed_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);


-- ── migration: 20260206162121_1abc22ed-4d80-4ec8-b477-ee349a8c697d.sql ─────────────────────────────────────────

-- Add new fields to crew_editor_applications for richer application data
ALTER TABLE public.crew_editor_applications 
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS software_used TEXT,
  ADD COLUMN IF NOT EXISTS wants_feedback BOOLEAN DEFAULT true;


-- ── migration: 20260206162809_bfc996e6-22a7-4635-b6d7-3e653d7dc9c4.sql ─────────────────────────────────────────

-- Add Unit Identity fields to crews table
ALTER TABLE public.crews 
  ADD COLUMN IF NOT EXISTS unit_standards TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_style TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requirements_text TEXT DEFAULT NULL;

-- Create logo previews table
CREATE TABLE public.unit_logo_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT DEFAULT 'Logo Preview',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'approved', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create logo votes table
CREATE TABLE public.unit_logo_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preview_id UUID NOT NULL REFERENCES public.unit_logo_previews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🔥',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(preview_id, user_id)
);

-- Enable RLS
ALTER TABLE public.unit_logo_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_logo_votes ENABLE ROW LEVEL SECURITY;

-- Logo previews policies
CREATE POLICY "Members can view logo previews" ON public.unit_logo_previews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.crew_members WHERE crew_id = unit_logo_previews.crew_id AND user_id = auth.uid())
  );

CREATE POLICY "Staff can insert logo previews" ON public.unit_logo_previews
  FOR INSERT WITH CHECK (
    public.is_crew_staff(crew_id, auth.uid())
  );

CREATE POLICY "Staff can update logo previews" ON public.unit_logo_previews
  FOR UPDATE USING (
    public.is_crew_staff(crew_id, auth.uid())
  );

CREATE POLICY "Staff can delete logo previews" ON public.unit_logo_previews
  FOR DELETE USING (
    public.is_crew_staff(crew_id, auth.uid())
  );

-- Logo votes policies
CREATE POLICY "Members can view votes" ON public.unit_logo_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.unit_logo_previews p 
      JOIN public.crew_members cm ON cm.crew_id = p.crew_id 
      WHERE p.id = unit_logo_votes.preview_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can vote" ON public.unit_logo_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.unit_logo_previews p 
      JOIN public.crew_members cm ON cm.crew_id = p.crew_id 
      WHERE p.id = unit_logo_votes.preview_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove own vote" ON public.unit_logo_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_logo_previews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_logo_votes;


-- ── migration: 20260206163922_d5cf3a5d-1c7c-43ef-ac2d-44fca7318852.sql ─────────────────────────────────────────

-- Add category, thumbnail, and pinning to crew_announcements
ALTER TABLE public.crew_announcements
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'update',
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Add constraint for valid categories
CREATE OR REPLACE FUNCTION public.validate_announcement_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category NOT IN ('event', 'update', 'recruitment', 'win') THEN
    RAISE EXCEPTION 'Invalid announcement category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_announcement_category_trigger
  BEFORE INSERT OR UPDATE ON public.crew_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_announcement_category();


-- ── migration: 20260206175029_e43e1917-8311-489d-bec1-0c074ee034d6.sql ─────────────────────────────────────────

-- Function to seed default channels for a crew
CREATE OR REPLACE FUNCTION public.ensure_default_channels(p_crew_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only seed if no channels exist for this crew
  IF NOT EXISTS (SELECT 1 FROM crew_channels WHERE crew_id = p_crew_id) THEN
    INSERT INTO crew_channels (crew_id, name, description, channel_type, category, category_order, channel_order, is_editor_only, is_locked)
    VALUES
      (p_crew_id, 'general', 'General discussion for the unit', 'text', 'General', 0, 0, false, false),
      (p_crew_id, 'announcements', 'Important updates from leadership', 'announcement', 'General', 0, 1, false, true);
  END IF;
END;
$$;

-- Trigger function to auto-create default channels on crew creation
CREATE OR REPLACE FUNCTION public.trigger_seed_default_channels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM ensure_default_channels(NEW.id);
  RETURN NEW;
END;
$$;

-- Attach trigger to crews table
DROP TRIGGER IF EXISTS on_crew_created_seed_channels ON public.crews;
CREATE TRIGGER on_crew_created_seed_channels
  AFTER INSERT ON public.crews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_seed_default_channels();


-- ── migration: 20260206175749_893d314c-fb44-4f75-903a-19e2fc8c312d.sql ─────────────────────────────────────────

-- Bot commands table for polls, events, reminders
CREATE TABLE public.unit_bot_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.crew_channels(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.crew_channel_messages(id) ON DELETE SET NULL,
  command_type text NOT NULL, -- 'poll', 'event', 'reminder', 'welcome', 'rules'
  title text NOT NULL,
  description text,
  data jsonb DEFAULT '{}'::jsonb, -- poll options, event time, etc.
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unit_bot_commands ENABLE ROW LEVEL SECURITY;

-- Anyone in the crew can view bot commands
CREATE POLICY "Crew members can view bot commands"
  ON public.unit_bot_commands FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.crew_members
    WHERE crew_members.crew_id = unit_bot_commands.crew_id
      AND crew_members.user_id = auth.uid()
  ));

-- Only officers/owners can create bot commands
CREATE POLICY "Officers can create bot commands"
  ON public.unit_bot_commands FOR INSERT
  WITH CHECK (public.is_crew_staff(crew_id, auth.uid()));

-- Officers can update/delete
CREATE POLICY "Officers can update bot commands"
  ON public.unit_bot_commands FOR UPDATE
  USING (public.is_crew_staff(crew_id, auth.uid()));

CREATE POLICY "Officers can delete bot commands"
  ON public.unit_bot_commands FOR DELETE
  USING (public.is_crew_staff(crew_id, auth.uid()));

-- Poll votes table
CREATE TABLE public.unit_bot_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id uuid NOT NULL REFERENCES public.unit_bot_commands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_index int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (command_id, user_id)
);

ALTER TABLE public.unit_bot_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew members can vote"
  ON public.unit_bot_poll_votes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.unit_bot_commands ubc
    JOIN public.crew_members cm ON cm.crew_id = ubc.crew_id
    WHERE ubc.id = unit_bot_poll_votes.command_id
      AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Users can view votes"
  ON public.unit_bot_poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can change their vote"
  ON public.unit_bot_poll_votes FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for bot commands (for live poll updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_bot_poll_votes;

-- Auto-welcome trigger: post a welcome message when a new member joins
CREATE OR REPLACE FUNCTION public.unit_bot_welcome_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_general_channel_id uuid;
  v_username text;
  v_crew_name text;
BEGIN
  -- Find the general channel for this crew
  SELECT id INTO v_general_channel_id
  FROM crew_channels
  WHERE crew_id = NEW.crew_id AND name = 'general'
  LIMIT 1;

  IF v_general_channel_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get username and crew name
  SELECT username INTO v_username FROM profiles WHERE id = NEW.user_id;
  SELECT name INTO v_crew_name FROM crews WHERE id = NEW.crew_id;

  -- Post welcome bot message
  INSERT INTO crew_channel_messages (
    channel_id, crew_id, user_id, username, display_name, avatar_url, message_text, is_bot
  ) VALUES (
    v_general_channel_id,
    NEW.crew_id,
    NEW.user_id,
    'Unit Bot',
    'Unit Bot',
    NULL,
    '👋 Welcome **@' || COALESCE(v_username, 'new member') || '** to **' || v_crew_name || '**! Check out the channels and introduce yourself.',
    true
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_crew_member_welcome ON public.crew_members;
CREATE TRIGGER on_crew_member_welcome
  AFTER INSERT ON public.crew_members
  FOR EACH ROW
  EXECUTE FUNCTION public.unit_bot_welcome_member();


-- ── migration: 20260206180533_046a0501-b787-4d22-8413-843cd47aadd1.sql ─────────────────────────────────────────

-- Add custom bot identity columns to crews table
ALTER TABLE public.crews ADD COLUMN bot_name TEXT DEFAULT 'Unit Bot';
ALTER TABLE public.crews ADD COLUMN bot_avatar_url TEXT DEFAULT NULL;


-- ── migration: 20260206183528_344117d7-ea87-4d63-851c-fb1a64f4329e.sql ─────────────────────────────────────────
-- Add media_type column to unit_logo_previews
ALTER TABLE public.unit_logo_previews 
ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

-- ── migration: 20260206190439_25f3fd37-974c-4844-8a8b-0473946a8b17.sql ─────────────────────────────────────────

-- Fix: the connection accepted trigger was calling the notification function
-- but not the count-incrementing function. Replace with a combined function.

CREATE OR REPLACE FUNCTION public.handle_connection_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  accepter_username TEXT;
  accepter_avatar TEXT;
BEGIN
  -- When status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Increment both users' connection counts
    UPDATE public.profiles 
    SET connection_count = (
      SELECT count(*) FROM public.connections 
      WHERE (sender_id = NEW.sender_id OR receiver_id = NEW.sender_id) AND status = 'accepted'
    )
    WHERE id = NEW.sender_id;

    UPDATE public.profiles 
    SET connection_count = (
      SELECT count(*) FROM public.connections 
      WHERE (sender_id = NEW.receiver_id OR receiver_id = NEW.receiver_id) AND status = 'accepted'
    )
    WHERE id = NEW.receiver_id;

    NEW.responded_at = now();

    -- Send notification
    SELECT username, avatar_url INTO accepter_username, accepter_avatar
    FROM public.profiles WHERE id = NEW.receiver_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.sender_id,
      'connection_accepted',
      'Connection Accepted! 🎉',
      '@' || COALESCE(accepter_username, 'Someone') || ' accepted your connection request',
      jsonb_build_object(
        'user_id', NEW.receiver_id,
        'username', accepter_username,
        'avatar', accepter_avatar,
        'connection_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also fix the remove function to use accurate count
CREATE OR REPLACE FUNCTION public.handle_connection_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status = 'accepted' THEN
    UPDATE public.profiles 
    SET connection_count = (
      SELECT count(*) FROM public.connections 
      WHERE (sender_id = OLD.sender_id OR receiver_id = OLD.sender_id) AND status = 'accepted' AND id != OLD.id
    )
    WHERE id = OLD.sender_id;

    UPDATE public.profiles 
    SET connection_count = (
      SELECT count(*) FROM public.connections 
      WHERE (sender_id = OLD.receiver_id OR receiver_id = OLD.receiver_id) AND status = 'accepted' AND id != OLD.id
    )
    WHERE id = OLD.receiver_id;
  END IF;
  RETURN OLD;
END;
$$;

-- Replace the broken trigger with the combined one
DROP TRIGGER IF EXISTS on_connection_accepted ON public.connections;
CREATE TRIGGER on_connection_accepted 
  BEFORE UPDATE ON public.connections 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_connection_status_change();

-- Sync all stale connection counts right now
UPDATE public.profiles p
SET connection_count = (
  SELECT count(*) FROM public.connections c
  WHERE (c.sender_id = p.id OR c.receiver_id = p.id) AND c.status = 'accepted'
);


-- ── migration: 20260206190916_9b374d4f-8913-4b0c-a845-c25f87bb69f4.sql ─────────────────────────────────────────

-- League application system for Pro/Elite league promotions
CREATE TABLE public.league_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_league TEXT NOT NULL DEFAULT 'pro',
  current_wins INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_league, status)
);

ALTER TABLE public.league_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own league applications"
  ON public.league_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create applications for themselves
CREATE POLICY "Users can create league applications"
  ON public.league_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all league applications"
  ON public.league_applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can update applications (approve/reject)
CREATE POLICY "Admins can update league applications"
  ON public.league_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can delete applications
CREATE POLICY "Admins can delete league applications"
  ON public.league_applications FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Timestamp trigger
CREATE TRIGGER update_league_applications_updated_at
  BEFORE UPDATE ON public.league_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ── migration: 20260206192320_72dab7d1-0124-4e84-9287-a90e46f66c27.sql ─────────────────────────────────────────

-- Add custom_title to event_participations
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS custom_title text;

-- Add custom_title to round_participations
ALTER TABLE public.round_participations ADD COLUMN IF NOT EXISTS custom_title text;

-- Add custom_title to sanctioned_tournament_participants
ALTER TABLE public.sanctioned_tournament_participants ADD COLUMN IF NOT EXISTS custom_title text;

-- Add thumbnail_url to round_participations if not exists
ALTER TABLE public.round_participations ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Add thumbnail_url to sanctioned_tournament_participants if not exists
ALTER TABLE public.sanctioned_tournament_participants ADD COLUMN IF NOT EXISTS thumbnail_url text;


-- ── migration: 20260209001206_b2d2ad06-f38c-421e-822c-4fb22efc4d3e.sql ─────────────────────────────────────────

-- Enable pg_cron and pg_net for scheduled edge function calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;


-- ── migration: 20260210063612_c68d59e7-ea5b-47f9-9fbb-0050ff8b7451.sql ─────────────────────────────────────────

-- Judge inbox table: many-to-many between judges and review requests
CREATE TABLE public.judge_inbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL,
  review_request_id UUID NOT NULL REFERENCES public.review_requests(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(judge_id, review_request_id)
);

ALTER TABLE public.judge_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view their own inbox"
  ON public.judge_inbox FOR SELECT
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can update their own inbox"
  ON public.judge_inbox FOR UPDATE
  USING (auth.uid() = judge_id);

CREATE POLICY "System can insert inbox items"
  ON public.judge_inbox FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_judge_inbox_judge ON public.judge_inbox(judge_id, dismissed);
CREATE INDEX idx_judge_inbox_request ON public.judge_inbox(review_request_id);

-- Auto-assign new review requests to designated QOI judges (yugi & doris)
CREATE OR REPLACE FUNCTION public.auto_assign_qoi_judges()
RETURNS TRIGGER AS $$
DECLARE
  qoi_judge_ids UUID[] := ARRAY[
    '977f57dc-4d71-4b00-a7d7-e0e88d71e54c'::uuid,
    'fe01e056-1992-47cc-9000-2a2b46690fed'::uuid
  ];
  jid UUID;
BEGIN
  FOREACH jid IN ARRAY qoi_judge_ids LOOP
    INSERT INTO public.judge_inbox (judge_id, review_request_id)
    VALUES (jid, NEW.id)
    ON CONFLICT (judge_id, review_request_id) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_assign_qoi_judges
  AFTER INSERT ON public.review_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_qoi_judges();

-- Backfill all existing review requests to yugi & doris
INSERT INTO public.judge_inbox (judge_id, review_request_id)
SELECT j.jid, rr.id
FROM public.review_requests rr
CROSS JOIN (
  VALUES 
    ('977f57dc-4d71-4b00-a7d7-e0e88d71e54c'::uuid),
    ('fe01e056-1992-47cc-9000-2a2b46690fed'::uuid)
) AS j(jid)
ON CONFLICT (judge_id, review_request_id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_inbox;


-- ── migration: 20260210100109_f553bf29-9947-4d29-84fa-5eefbc14c85a.sql ─────────────────────────────────────────

-- Create a function that distributes index points when a battle is completed
CREATE OR REPLACE FUNCTION public.distribute_battle_index()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when status changes to 'completed' and there's a winner
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.winner_id IS NOT NULL THEN
    -- Award index points to winner
    UPDATE public.profiles
    SET global_index_score = COALESCE(global_index_score, 0) + COALESCE(NEW.winner_index_awarded, 20)
    WHERE id = NEW.winner_id;

    -- Determine loser and apply penalty
    IF NEW.winner_id = NEW.challenger_id AND NEW.opponent_id IS NOT NULL THEN
      UPDATE public.profiles
      SET global_index_score = GREATEST(0, COALESCE(global_index_score, 0) - COALESCE(NEW.loser_index_penalty, 5))
      WHERE id = NEW.opponent_id;
    ELSIF NEW.winner_id = NEW.opponent_id THEN
      UPDATE public.profiles
      SET global_index_score = GREATEST(0, COALESCE(global_index_score, 0) - COALESCE(NEW.loser_index_penalty, 5))
      WHERE id = NEW.challenger_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_distribute_battle_index ON public.battles;
CREATE TRIGGER trigger_distribute_battle_index
  AFTER UPDATE ON public.battles
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_battle_index();


-- ── migration: 20260210110722_159d6e4b-a11c-4551-a92f-8a28ba1bb78f.sql ─────────────────────────────────────────

-- ═══════════════════════════════════════════════════
-- JUDGE MISSIONS SYSTEM
-- Daily + Weekly tasks that reward JXP
-- ═══════════════════════════════════════════════════

-- Mission templates (the task definitions)
CREATE TABLE public.judge_mission_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mission_type TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'weekly'
  action_type TEXT NOT NULL, -- 'review_edits', 'post_video', 'comment_reviews', 'helpful_verdict'
  target_count INT NOT NULL DEFAULT 1,
  jxp_reward INT NOT NULL DEFAULT 25,
  icon TEXT DEFAULT 'target',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_mission_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active mission templates"
ON public.judge_mission_templates FOR SELECT
USING (is_active = true);

-- Mission progress (per judge, per mission, per period)
CREATE TABLE public.judge_mission_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.judge_mission_templates(id) ON DELETE CASCADE,
  period_start DATE NOT NULL, -- the day (for daily) or week start (for weekly)
  current_count INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  jxp_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(judge_id, mission_id, period_start)
);

ALTER TABLE public.judge_mission_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view their own mission progress"
ON public.judge_mission_progress FOR SELECT
USING (auth.uid() = judge_id);

CREATE POLICY "Judges can insert their own mission progress"
ON public.judge_mission_progress FOR INSERT
WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update their own mission progress"
ON public.judge_mission_progress FOR UPDATE
USING (auth.uid() = judge_id);

-- ═══════════════════════════════════════════════════
-- JUDGE DIVISIONS (Seasonal Ranking)
-- Iron → Bronze → Silver → Gold → Onyx → Legendary
-- ═══════════════════════════════════════════════════

CREATE TABLE public.judge_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_number INT NOT NULL,
  season_name TEXT NOT NULL, -- e.g. 'Season 1 — The Awakening'
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons"
ON public.judge_seasons FOR SELECT
USING (true);

CREATE TABLE public.judge_division_standings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES public.judge_seasons(id) ON DELETE CASCADE,
  division TEXT NOT NULL DEFAULT 'iron', -- iron, bronze, silver, gold, onyx, legendary
  seasonal_jxp INT NOT NULL DEFAULT 0,
  reviews_this_season INT NOT NULL DEFAULT 0,
  videos_this_season INT NOT NULL DEFAULT 0,
  peak_division TEXT DEFAULT 'iron',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(judge_id, season_id)
);

ALTER TABLE public.judge_division_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view division standings"
ON public.judge_division_standings FOR SELECT
USING (true);

CREATE POLICY "Judges can insert own standings"
ON public.judge_division_standings FOR INSERT
WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update own standings"
ON public.judge_division_standings FOR UPDATE
USING (auth.uid() = judge_id);

-- ═══════════════════════════════════════════════════
-- JUDGE SPOTLIGHT (Daily recognition)
-- ═══════════════════════════════════════════════════

CREATE TABLE public.judge_spotlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL,
  spotlight_date DATE NOT NULL,
  spotlight_type TEXT NOT NULL, -- 'most_reviews', 'most_viral', 'highest_jxp', 'most_controversial'
  stat_value INT NOT NULL DEFAULT 0,
  headline TEXT, -- e.g. "Filed 12 verdicts in 24 hours"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(spotlight_date, spotlight_type)
);

ALTER TABLE public.judge_spotlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view spotlights"
ON public.judge_spotlights FOR SELECT
USING (true);

-- Seed the first season
INSERT INTO public.judge_seasons (season_number, season_name, starts_at, ends_at, is_active)
VALUES (1, 'Season 1 — Genesis', now(), now() + interval '3 months', true);

-- Seed mission templates
INSERT INTO public.judge_mission_templates (title, description, mission_type, action_type, target_count, jxp_reward, icon) VALUES
('File 5 Verdicts', 'Review 5 edits today', 'daily', 'review_edits', 5, 50, 'gavel'),
('Post a Rating Video', 'Upload 1 rating video to TikTok/IG/YT', 'daily', 'post_video', 1, 25, 'video'),
('Comment on 3 Verdicts', 'Leave feedback on 3 other reviews', 'daily', 'comment_reviews', 3, 10, 'message'),
('File 25 Verdicts', 'Complete 25 reviews this week', 'weekly', 'review_edits', 25, 200, 'trophy'),
('Post 5 Rating Videos', 'Upload 5 rating videos this week', 'weekly', 'post_video', 5, 150, 'flame'),
('Win Most Helpful', 'Get the most upvoted verdict this week', 'weekly', 'helpful_verdict', 1, 75, 'star');

-- Add realtime for mission progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_mission_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_spotlights;


-- ── migration: 20260210121550_af0b47c1-7959-4acc-868c-a6fb26fce4ec.sql ─────────────────────────────────────────
-- Fix: Allow all feed submission types for comments
ALTER TABLE public.feed_comments DROP CONSTRAINT feed_comments_submission_type_check;
ALTER TABLE public.feed_comments ADD CONSTRAINT feed_comments_submission_type_check 
  CHECK (submission_type = ANY (ARRAY['arena'::text, 'review'::text, 'battle'::text, 'judge_video'::text]));

-- ── migration: 20260210132713_7cee6231-1828-47ed-94be-fc18a51fd565.sql ─────────────────────────────────────────
-- Add judge division flag to crews table
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS is_judge_division boolean NOT NULL DEFAULT false;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_crews_judge_division ON public.crews (is_judge_division) WHERE is_judge_division = true;

-- ── migration: 20260211102740_74d74d0a-0b99-4a0c-86a4-617bfd23e200.sql ─────────────────────────────────────────

-- Add judge selection fields to battles
ALTER TABLE public.battles 
ADD COLUMN IF NOT EXISTS requested_judge_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS requested_judge_username TEXT,
ADD COLUMN IF NOT EXISTS judge_status TEXT DEFAULT 'none' CHECK (judge_status IN ('none', 'requested', 'accepted', 'declined')),
ADD COLUMN IF NOT EXISTS submission_mode TEXT DEFAULT 'create' CHECK (submission_mode IN ('create', 'reuse')),
ADD COLUMN IF NOT EXISTS is_rapid BOOLEAN DEFAULT false;

-- Battle chat messages (dual: private fighter chat + public spectator thread)
CREATE TABLE public.battle_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.battle_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read public messages
CREATE POLICY "Anyone can read public battle messages"
ON public.battle_messages FOR SELECT
USING (is_public = true);

-- Battle participants can read private messages
CREATE POLICY "Fighters and judge can read private messages"
ON public.battle_messages FOR SELECT
USING (
  is_public = false AND (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.battles b
      WHERE b.id = battle_id
      AND (b.challenger_id = auth.uid() OR b.opponent_id = auth.uid() OR b.judge_id = auth.uid())
    )
  )
);

-- Authenticated users can send public messages
CREATE POLICY "Authenticated users can send public messages"
ON public.battle_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND is_public = true
);

-- Only fighters and judge can send private messages
CREATE POLICY "Fighters and judge can send private messages"
ON public.battle_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND is_public = false AND
  EXISTS (
    SELECT 1 FROM public.battles b
    WHERE b.id = battle_id
    AND (b.challenger_id = auth.uid() OR b.opponent_id = auth.uid() OR b.judge_id = auth.uid())
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own battle messages"
ON public.battle_messages FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_messages;

-- Apply profanity filter
CREATE TRIGGER filter_battle_message_profanity
BEFORE INSERT OR UPDATE ON public.battle_messages
FOR EACH ROW EXECUTE FUNCTION public.filter_message_profanity();


-- ── migration: 20260211105646_93f8e0f3-29c5-4858-99aa-dea15e4a9592.sql ─────────────────────────────────────────
-- Fix: Allow rapid mode durations (1, 2, 3 hours) alongside standard ones
ALTER TABLE public.battles DROP CONSTRAINT battles_duration_hours_check;
ALTER TABLE public.battles ADD CONSTRAINT battles_duration_hours_check CHECK (duration_hours = ANY (ARRAY[1, 2, 3, 24, 48, 72]));


-- ── migration: 20260213055137_3c4af872-b86c-45fb-bdcc-db5e3dd1117b.sql ─────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════
-- QUICK FIGHTS: Lightweight 1v1 instant battle system
-- ═══════════════════════════════════════════════════════════════

-- Quick fights table - minimal fields, max speed
CREATE TABLE public.quick_fights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Players (RED = player_1, BLUE = player_2)
  player_1_id UUID NOT NULL REFERENCES auth.users(id),
  player_1_username TEXT NOT NULL,
  player_1_avatar_url TEXT,
  player_2_id UUID REFERENCES auth.users(id),
  player_2_username TEXT,
  player_2_avatar_url TEXT,
  
  -- State
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'submitted', 'judging', 'completed', 'forfeited')),
  
  -- Submissions (TikTok/YouTube/CapCut links)
  player_1_submission_url TEXT,
  player_1_submitted_at TIMESTAMPTZ,
  player_2_submission_url TEXT,
  player_2_submitted_at TIMESTAMPTZ,
  
  -- Judging
  judge_id UUID REFERENCES auth.users(id),
  judge_username TEXT,
  winner_id UUID REFERENCES auth.users(id),
  winner_score INTEGER,
  loser_score INTEGER,
  judge_notes TEXT,
  judged_at TIMESTAMPTZ,
  
  -- Timing (3 hour max)
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  matched_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quick fight messages (red vs blue chat + auto-text)
CREATE TABLE public.quick_fight_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_auto_text BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quick fight queue (for instant matchmaking)
CREATE TABLE public.quick_fight_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '5 minutes')
);

-- Quick fight votes (community voting)
CREATE TABLE public.quick_fight_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  voted_for UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fight_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.quick_fights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_fight_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_fight_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_fight_votes ENABLE ROW LEVEL SECURITY;

-- Quick fights: everyone can read, participants can update
CREATE POLICY "Anyone can view quick fights" ON public.quick_fights FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create quick fights" ON public.quick_fights FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_1_id);
CREATE POLICY "Participants can update their fight" ON public.quick_fights FOR UPDATE TO authenticated USING (auth.uid() IN (player_1_id, player_2_id, judge_id));

-- Messages: everyone can read, authenticated can send
CREATE POLICY "Anyone can view fight messages" ON public.quick_fight_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated can send messages" ON public.quick_fight_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Queue: users manage their own queue entry
CREATE POLICY "Users can view queue" ON public.quick_fight_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join queue" ON public.quick_fight_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave queue" ON public.quick_fight_queue FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Votes: anyone can see, authenticated can vote
CREATE POLICY "Anyone can view votes" ON public.quick_fight_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can vote" ON public.quick_fight_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fight_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fight_queue;

-- ═══════════════════════════════════════════════════════════════
-- MATCHMAKING FUNCTION
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.quick_fight_match(p_user_id UUID, p_username TEXT, p_avatar_url TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched RECORD;
  new_fight_id UUID;
  starts TIMESTAMPTZ := now();
BEGIN
  -- Look for someone in queue (not self, not expired)
  SELECT * INTO matched
  FROM public.quick_fight_queue
  WHERE user_id != p_user_id
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF matched IS NULL THEN
    -- No match: join queue
    INSERT INTO public.quick_fight_queue (user_id, username, avatar_url)
    VALUES (p_user_id, p_username, p_avatar_url)
    ON CONFLICT (user_id) DO UPDATE 
    SET username = p_username, avatar_url = p_avatar_url, queued_at = now(), expires_at = now() + INTERVAL '5 minutes';
    RETURN NULL;
  END IF;

  -- Match found! Create the fight
  INSERT INTO public.quick_fights (
    player_1_id, player_1_username, player_1_avatar_url,
    player_2_id, player_2_username, player_2_avatar_url,
    status, matched_at, starts_at, ends_at, duration_minutes
  ) VALUES (
    matched.user_id, matched.username, matched.avatar_url,
    p_user_id, p_username, p_avatar_url,
    'active', starts, starts, starts + INTERVAL '3 hours', 180
  )
  RETURNING id INTO new_fight_id;

  -- Remove both from queue
  DELETE FROM public.quick_fight_queue WHERE user_id IN (p_user_id, matched.user_id);

  -- System message
  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (new_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have 3 hours to submit your edit.', true);

  -- Notifications
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES 
    (matched.user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || p_username || '!', jsonb_build_object('fight_id', new_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || matched.username || '!', jsonb_build_object('fight_id', new_fight_id));

  RETURN new_fight_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- AUTO FORFEIT: Check if time expired + only one submitted
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.quick_fight_submit(p_fight_id UUID, p_user_id UUID, p_url TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fight RECORD;
BEGIN
  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id;
  IF fight IS NULL OR fight.status != 'active' THEN RETURN false; END IF;

  -- Update submission
  IF p_user_id = fight.player_1_id THEN
    UPDATE public.quick_fights SET player_1_submission_url = p_url, player_1_submitted_at = now() WHERE id = p_fight_id;
  ELSIF p_user_id = fight.player_2_id THEN
    UPDATE public.quick_fights SET player_2_submission_url = p_url, player_2_submitted_at = now() WHERE id = p_fight_id;
  ELSE
    RETURN false;
  END IF;

  -- Re-fetch to check both
  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id;
  IF fight.player_1_submitted_at IS NOT NULL AND fight.player_2_submitted_at IS NOT NULL THEN
    UPDATE public.quick_fights SET status = 'judging' WHERE id = p_fight_id;
    -- System message
    INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
    VALUES (p_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '🔥 Both edits submitted! Waiting for a judge...', true);
  END IF;

  RETURN true;
END;
$$;

-- Profanity filter for quick fight messages
CREATE TRIGGER filter_quick_fight_message_profanity
  BEFORE INSERT ON public.quick_fight_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.filter_message_profanity();

-- Index for fast lookups
CREATE INDEX idx_quick_fights_status ON public.quick_fights(status);
CREATE INDEX idx_quick_fights_players ON public.quick_fights(player_1_id, player_2_id);
CREATE INDEX idx_quick_fight_messages_fight ON public.quick_fight_messages(fight_id);
CREATE INDEX idx_quick_fight_queue_expires ON public.quick_fight_queue(expires_at);


-- ── migration: 20260213063653_37d64e2f-4dfa-4f79-b142-2a88c28909ef.sql ─────────────────────────────────────────

-- Trigger: when a quick fight goes from 'waiting' to 'active' (opponent matched), 
-- notify both players + post to activity feed
CREATE OR REPLACE FUNCTION public.on_quick_fight_matched()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p1_email TEXT;
  p2_email TEXT;
BEGIN
  -- Only trigger when status changes to 'active' (match found)
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status = 'waiting') THEN
    -- Notify player 1
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.player_1_id,
      'quick_fight_matched',
      '⚔️ Opponent Found!',
      'You''ve been matched against ' || COALESCE(NEW.player_2_username, 'an editor') || ' for a Quick Edit Battle!',
      jsonb_build_object('fight_id', NEW.id, 'opponent', NEW.player_2_username)
    );
    
    -- Notify player 2
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.player_2_id,
      'quick_fight_matched',
      '⚔️ Opponent Found!',
      'You''ve been matched against ' || NEW.player_1_username || ' for a Quick Edit Battle!',
      jsonb_build_object('fight_id', NEW.id, 'opponent', NEW.player_1_username)
    );
    
    -- Post to activity feed
    INSERT INTO public.activity_feed (user_id, username, avatar_url, activity_type, title, description, data)
    VALUES (
      NEW.player_1_id,
      NEW.player_1_username,
      NEW.player_1_avatar_url,
      'battle',
      NEW.player_1_username || ' vs ' || COALESCE(NEW.player_2_username, '???'),
      '⚔️ Quick Edit Battle started!',
      jsonb_build_object('fight_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quick_fight_matched_trigger
AFTER UPDATE ON public.quick_fights
FOR EACH ROW
EXECUTE FUNCTION public.on_quick_fight_matched();

-- Trigger: when a quick fight is completed, post results to activity feed + award XP via DB
CREATE OR REPLACE FUNCTION public.on_quick_fight_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  winner_username TEXT;
  loser_id UUID;
  loser_username TEXT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') AND NEW.winner_id IS NOT NULL THEN
    -- Determine winner/loser
    IF NEW.winner_id = NEW.player_1_id THEN
      winner_username := NEW.player_1_username;
      loser_id := NEW.player_2_id;
      loser_username := NEW.player_2_username;
    ELSE
      winner_username := NEW.player_2_username;
      loser_id := NEW.player_1_id;
      loser_username := NEW.player_1_username;
    END IF;

    -- Award XP to winner (+20)
    PERFORM public.award_xp(NEW.winner_id, 20, 'quick_fight_win', 'Won Quick Edit Battle vs ' || COALESCE(loser_username, 'opponent'));
    
    -- Award XP to loser (+5)
    IF loser_id IS NOT NULL THEN
      PERFORM public.award_xp(loser_id, 5, 'quick_fight_loss', 'Participated in Quick Edit Battle vs ' || COALESCE(winner_username, 'opponent'));
    END IF;

    -- Post winner to activity feed
    INSERT INTO public.activity_feed (user_id, username, avatar_url, activity_type, title, description, data)
    VALUES (
      NEW.winner_id,
      winner_username,
      CASE WHEN NEW.winner_id = NEW.player_1_id THEN NEW.player_1_avatar_url ELSE NEW.player_2_avatar_url END,
      'battle',
      '🏆 ' || winner_username || ' defeated ' || COALESCE(loser_username, '???'),
      'Quick Edit Battle — Score: ' || COALESCE(NEW.winner_score::TEXT, '?') || ' vs ' || COALESCE(NEW.loser_score::TEXT, '?'),
      jsonb_build_object('fight_id', NEW.id, 'winner_score', NEW.winner_score, 'loser_score', NEW.loser_score)
    );

    -- Notify winner
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.winner_id,
      'quick_fight_result',
      '🏆 You Won!',
      'You defeated ' || COALESCE(loser_username, 'your opponent') || '! +20 XP',
      jsonb_build_object('fight_id', NEW.id, 'xp', 20)
    );

    -- Notify loser
    IF loser_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        loser_id,
        'quick_fight_result',
        '❌ Battle Over',
        winner_username || ' won this time. +5 XP for competing.',
        jsonb_build_object('fight_id', NEW.id, 'xp', 5)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quick_fight_completed_trigger
AFTER UPDATE ON public.quick_fights
FOR EACH ROW
EXECUTE FUNCTION public.on_quick_fight_completed();

-- Add queued_at to quick_fight_queue for timer tracking
ALTER TABLE public.quick_fight_queue ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ DEFAULT now();


-- ── migration: 20260214100731_49bf0ecb-aec7-44b4-920f-5b38994c9833.sql ─────────────────────────────────────────

-- Add 'cancelled' status to quick_fights
ALTER TABLE public.quick_fights DROP CONSTRAINT IF EXISTS quick_fights_status_check;
ALTER TABLE public.quick_fights ADD CONSTRAINT quick_fights_status_check 
  CHECK (status IN ('waiting', 'active', 'submitted', 'judging', 'completed', 'forfeited', 'cancelled'));

-- Function to resolve expired quick fights
-- Called periodically or on page load
CREATE OR REPLACE FUNCTION public.resolve_expired_quick_fights()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fight RECORD;
  resolved_count INTEGER := 0;
  p1_submitted BOOLEAN;
  p2_submitted BOOLEAN;
BEGIN
  -- Find all active fights past their end time
  FOR fight IN
    SELECT * FROM public.quick_fights
    WHERE status = 'active'
      AND ends_at IS NOT NULL
      AND ends_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    p1_submitted := fight.player_1_submitted_at IS NOT NULL;
    p2_submitted := fight.player_2_submitted_at IS NOT NULL;

    IF NOT p1_submitted AND NOT p2_submitted THEN
      -- NEITHER submitted → cancelled, no points
      UPDATE public.quick_fights
      SET status = 'cancelled', updated_at = now()
      WHERE id = fight.id;

      -- Notify both
      INSERT INTO public.notifications (user_id, type, title, message, data) VALUES
        (fight.player_1_id, 'quick_fight_result', '⚔️ Fight Cancelled', 'Neither player submitted. No index awarded.', jsonb_build_object('fight_id', fight.id)),
        (fight.player_2_id, 'quick_fight_result', '⚔️ Fight Cancelled', 'Neither player submitted. No index awarded.', jsonb_build_object('fight_id', fight.id));

    ELSIF p1_submitted AND NOT p2_submitted THEN
      -- P1 submitted, P2 didn't → P1 wins by forfeit
      UPDATE public.quick_fights
      SET status = 'completed',
          winner_id = fight.player_1_id,
          winner_score = 100,
          loser_score = 0,
          judge_notes = 'Won by forfeit — opponent did not submit',
          judged_at = now(),
          updated_at = now()
      WHERE id = fight.id;

      -- Award +20 IDX to winner, -10 IDX to forfeiter
      UPDATE public.profiles SET spendable_index = spendable_index + 20, global_index_score = COALESCE(global_index_score, 0) + 20 WHERE id = fight.player_1_id;
      UPDATE public.profiles SET spendable_index = GREATEST(spendable_index - 10, 0), global_index_score = GREATEST(COALESCE(global_index_score, 0) - 10, 0) WHERE id = fight.player_2_id;

    ELSIF NOT p1_submitted AND p2_submitted THEN
      -- P2 submitted, P1 didn't → P2 wins by forfeit
      UPDATE public.quick_fights
      SET status = 'completed',
          winner_id = fight.player_2_id,
          winner_score = 100,
          loser_score = 0,
          judge_notes = 'Won by forfeit — opponent did not submit',
          judged_at = now(),
          updated_at = now()
      WHERE id = fight.id;

      -- Award +20 IDX to winner, -10 IDX to forfeiter
      UPDATE public.profiles SET spendable_index = spendable_index + 20, global_index_score = COALESCE(global_index_score, 0) + 20 WHERE id = fight.player_2_id;
      UPDATE public.profiles SET spendable_index = GREATEST(spendable_index - 10, 0), global_index_score = GREATEST(COALESCE(global_index_score, 0) - 10, 0) WHERE id = fight.player_1_id;
    END IF;

    resolved_count := resolved_count + 1;
  END LOOP;

  RETURN resolved_count;
END;
$$;


-- ── migration: 20260214114051_199bbc3c-d063-449d-8a63-3a9a1d197119.sql ─────────────────────────────────────────

-- Pinned edits: editors can showcase up to 3 of their best edits
CREATE TABLE public.pinned_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  pin_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Max 3 per user enforced at app level, unique url per user
  UNIQUE(user_id, url)
);

-- Enable RLS
ALTER TABLE public.pinned_edits ENABLE ROW LEVEL SECURITY;

-- Anyone can view pinned edits (they're public showcase)
CREATE POLICY "Pinned edits are publicly viewable"
ON public.pinned_edits FOR SELECT
USING (true);

-- Users can manage their own pinned edits
CREATE POLICY "Users can insert their own pinned edits"
ON public.pinned_edits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pinned edits"
ON public.pinned_edits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pinned edits"
ON public.pinned_edits FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_pinned_edits_user_id ON public.pinned_edits(user_id, pin_order);


-- ── migration: 20260214200031_12cef445-a7ba-4ba2-974b-3d3d5e3fad88.sql ─────────────────────────────────────────

-- Revenue share applications table
CREATE TABLE public.revenue_share_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_email TEXT NOT NULL,
  applicant_name TEXT,
  project_name TEXT NOT NULL,
  project_url TEXT,
  project_type TEXT NOT NULL DEFAULT 'music',
  pitch TEXT NOT NULL,
  social_links TEXT[],
  current_revenue TEXT,
  proposed_percentage INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revenue_share_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (anonymous purchasing)
CREATE POLICY "Anyone can submit revenue share applications"
ON public.revenue_share_applications
FOR INSERT
WITH CHECK (true);

-- Only admins can view/update (via service role in ops panel)
CREATE POLICY "Users can view their own applications by email"
ON public.revenue_share_applications
FOR SELECT
USING (true);


-- ── migration: 20260215060702_6856021b-7d11-4940-a20c-0bc88a041dde.sql ─────────────────────────────────────────

-- Enterprise clients table - completely separate from auth.users
CREATE TABLE public.enterprise_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- NULL if using OTP-only
  display_name TEXT,
  session_token TEXT UNIQUE,
  session_expires_at TIMESTAMPTZ,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only edge functions (service role) access this table
ALTER TABLE public.enterprise_clients ENABLE ROW LEVEL SECURITY;

-- No public RLS policies — only service_role can read/write
-- This ensures clients can't directly query the table


-- ── migration: 20260216064532_e1626440-e497-4824-9a54-dcf946b614eb.sql ─────────────────────────────────────────

-- Featured Artists system
CREATE TABLE public.featured_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  genre TEXT DEFAULT 'phonk',
  social_links JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Featured Drops (each song/challenge from an artist)
CREATE TABLE public.featured_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.featured_artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  song_name TEXT NOT NULL,
  song_url TEXT,
  song_preview_url TEXT,
  poster_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'judging', 'closed')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  xp_reward INTEGER DEFAULT 30,
  index_reward INTEGER DEFAULT 15,
  mystery_reward_label TEXT DEFAULT '???',
  submission_count INTEGER DEFAULT 0,
  top_score NUMERIC DEFAULT 0,
  top_scorer_id UUID,
  top_scorer_username TEXT,
  random_pick_id UUID,
  random_pick_username TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Featured Submissions (user entries for a drop)
CREATE TABLE public.featured_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.featured_drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT DEFAULT 'tiktok',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scored', 'rejected')),
  qoi_score NUMERIC,
  quality_score NUMERIC,
  originality_score NUMERIC,
  impact_score NUMERIC,
  feedback TEXT,
  judge_id UUID,
  judge_username TEXT,
  xp_awarded INTEGER DEFAULT 0,
  index_awarded INTEGER DEFAULT 0,
  judged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(drop_id, user_id)
);

-- Enable RLS
ALTER TABLE public.featured_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_submissions ENABLE ROW LEVEL SECURITY;

-- Public read for artists and drops
CREATE POLICY "Anyone can view featured artists" ON public.featured_artists FOR SELECT USING (true);
CREATE POLICY "Anyone can view featured drops" ON public.featured_drops FOR SELECT USING (true);
CREATE POLICY "Anyone can view featured submissions" ON public.featured_submissions FOR SELECT USING (true);

-- Only admins can manage artists/drops (via has_role or dev auth check)
CREATE POLICY "Admins can manage artists" ON public.featured_artists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage drops" ON public.featured_drops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Users can submit their own entries
CREATE POLICY "Users can submit to drops" ON public.featured_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all submissions (scoring)
CREATE POLICY "Admins can manage submissions" ON public.featured_submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'judge'));

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON public.featured_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update submission count on drop
CREATE OR REPLACE FUNCTION public.sync_featured_drop_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.featured_drops SET submission_count = submission_count + 1 WHERE id = NEW.drop_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.featured_drops SET submission_count = GREATEST(submission_count - 1, 0) WHERE id = OLD.drop_id;
  END IF;
  
  -- Update top scorer
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL THEN
    UPDATE public.featured_drops fd
    SET top_score = sub.max_qoi,
        top_scorer_id = sub.best_user_id,
        top_scorer_username = sub.best_username
    FROM (
      SELECT fs.drop_id, fs.qoi_score as max_qoi, fs.user_id as best_user_id, fs.username as best_username
      FROM public.featured_submissions fs
      WHERE fs.drop_id = NEW.drop_id AND fs.status = 'scored'
      ORDER BY fs.qoi_score DESC
      LIMIT 1
    ) sub
    WHERE fd.id = NEW.drop_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_featured_submission_change
  AFTER INSERT OR UPDATE OR DELETE ON public.featured_submissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_featured_drop_stats();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_drops;


-- ── migration: 20260217185252_7c066cf0-d3cc-4727-ba93-fdc4bae2562c.sql ─────────────────────────────────────────

-- Live chat for featured drops
CREATE TABLE public.featured_drop_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL REFERENCES public.featured_drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_featured_drop_messages_drop ON public.featured_drop_messages(drop_id, created_at DESC);

-- RLS
ALTER TABLE public.featured_drop_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read drop messages"
  ON public.featured_drop_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send drop messages"
  ON public.featured_drop_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own drop messages"
  ON public.featured_drop_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_drop_messages;

-- Profanity filter
CREATE TRIGGER filter_featured_drop_message_profanity
  BEFORE INSERT OR UPDATE ON public.featured_drop_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.filter_message_profanity();


-- ── migration: 20260217203933_66e1489d-d528-4e1d-a923-5878c29e5bc7.sql ─────────────────────────────────────────
-- Create storage bucket for song previews
INSERT INTO storage.buckets (id, name, public) VALUES ('song-previews', 'song-previews', true);

-- Allow anyone to read song previews
CREATE POLICY "Song previews are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'song-previews');

-- Allow authenticated users to upload (admin will upload)
CREATE POLICY "Authenticated users can upload song previews"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'song-previews');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete song previews"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'song-previews');

-- Add a column to battles for featured song theme
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS theme_song_name TEXT;
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS theme_song_preview_url TEXT;
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS theme_drop_id UUID REFERENCES public.featured_drops(id);

-- ── migration: 20260217231250_1c843b90-e6e3-4460-b44b-148580f2f476.sql ─────────────────────────────────────────

-- Add slug to events for clean URLs
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Auto-generate slugs for existing events
UPDATE public.events SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substring(id::text from 1 for 4) WHERE slug IS NULL;

-- Add monthly_streams and achievements to featured_artists
ALTER TABLE public.featured_artists ADD COLUMN IF NOT EXISTS monthly_streams bigint DEFAULT 0;
ALTER TABLE public.featured_artists ADD COLUMN IF NOT EXISTS achievements jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.featured_artists ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.featured_artists ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;


-- ── migration: 20260218060854_020b111b-a459-4742-9302-d82d562270c4.sql ─────────────────────────────────────────

-- Add vote counters to featured_submissions
ALTER TABLE public.featured_submissions
ADD COLUMN IF NOT EXISTS upvotes integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes integer NOT NULL DEFAULT 0;

-- Create votes table
CREATE TABLE public.featured_submission_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.featured_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, user_id)
);

-- Enable RLS
ALTER TABLE public.featured_submission_votes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view votes"
ON public.featured_submission_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.featured_submission_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vote"
ON public.featured_submission_votes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote"
ON public.featured_submission_votes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to sync vote counts
CREATE OR REPLACE FUNCTION public.sync_featured_submission_votes()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.submission_id, OLD.submission_id);
  
  UPDATE public.featured_submissions
  SET upvotes = (SELECT COUNT(*) FROM public.featured_submission_votes WHERE submission_id = target_id AND vote_type = 'up'),
      downvotes = (SELECT COUNT(*) FROM public.featured_submission_votes WHERE submission_id = target_id AND vote_type = 'down')
  WHERE id = target_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_featured_votes
AFTER INSERT OR UPDATE OR DELETE ON public.featured_submission_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_featured_submission_votes();

-- Enable realtime for votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_submission_votes;


-- ── migration: 20260218062237_2c3f81b3-fc7c-4053-aa84-f127281b2e40.sql ─────────────────────────────────────────
-- Allow multiple submissions per user per drop
ALTER TABLE public.featured_submissions DROP CONSTRAINT featured_submissions_drop_id_user_id_key;

-- ── migration: 20260218164452_31456db7-862e-4e7f-8d29-d7765c7ac516.sql ─────────────────────────────────────────

-- Editorium articles table
CREATE TABLE public.editorium_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  subtitle text,
  excerpt text,
  body text NOT NULL,
  cover_image_url text,
  header_image_url text,
  unit_id uuid REFERENCES public.crews(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'LOOPGATE Editorial',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags text[] DEFAULT '{}',
  read_time_minutes integer DEFAULT 5,
  view_count integer DEFAULT 0,
  featured boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  seo_title text,
  seo_description text,
  seo_keywords text[]
);

-- Enable RLS
ALTER TABLE public.editorium_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Anyone can read published articles"
ON public.editorium_articles FOR SELECT
USING (status = 'published');

-- Slug generation function
CREATE OR REPLACE FUNCTION public.generate_editorium_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.title = NEW.title) THEN
    RETURN NEW;
  END IF;
  base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 80);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.editorium_articles WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_editorium_slug
BEFORE INSERT OR UPDATE ON public.editorium_articles
FOR EACH ROW EXECUTE FUNCTION public.generate_editorium_slug();

-- Auto-set published_at
CREATE OR REPLACE FUNCTION public.set_editorium_published_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_editorium_published_at
BEFORE INSERT OR UPDATE ON public.editorium_articles
FOR EACH ROW EXECUTE FUNCTION public.set_editorium_published_at();

-- View count incrementer
CREATE OR REPLACE FUNCTION public.increment_editorium_views(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.editorium_articles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = article_id;
END;
$$;


-- ── migration: 20260218183518_8ada6da9-c343-4aef-b0f5-b0b9a8914223.sql ─────────────────────────────────────────

-- Allow admins/devs to read all articles (including drafts)
CREATE POLICY "Admins can read all articles"
ON public.editorium_articles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Allow admins/devs to insert articles
CREATE POLICY "Admins can insert articles"
ON public.editorium_articles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Allow admins/devs to update articles
CREATE POLICY "Admins can update articles"
ON public.editorium_articles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Allow admins/devs to delete articles
CREATE POLICY "Admins can delete articles"
ON public.editorium_articles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));


-- ── migration: 20260221203421_450e7e6a-f843-41cb-adbc-1d15869a5257.sql ─────────────────────────────────────────

-- Add per-player theme song columns to practice_matches
ALTER TABLE public.practice_matches
ADD COLUMN player_1_theme_drop_id UUID REFERENCES public.featured_drops(id),
ADD COLUMN player_1_theme_song_name TEXT,
ADD COLUMN player_1_theme_song_preview_url TEXT,
ADD COLUMN player_2_theme_drop_id UUID REFERENCES public.featured_drops(id),
ADD COLUMN player_2_theme_song_name TEXT,
ADD COLUMN player_2_theme_song_preview_url TEXT;

-- Function to pick a song for a practice match
-- Sets the player's theme, and if both have picked, starts the match timer
CREATE OR REPLACE FUNCTION public.pick_practice_song(
  p_match_id UUID,
  p_user_id UUID,
  p_drop_id UUID,
  p_song_name TEXT,
  p_song_preview_url TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_is_player_1 BOOLEAN;
  v_both_picked BOOLEAN;
BEGIN
  -- Get the match
  SELECT * INTO v_match FROM practice_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Must be in matched status (song picking phase)
  IF v_match.status NOT IN ('matched') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is not in song picking phase');
  END IF;
  
  -- Determine which player
  v_is_player_1 := (v_match.player_1_id = p_user_id);
  
  IF NOT v_is_player_1 AND v_match.player_2_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not in this match');
  END IF;
  
  -- Update the player's song pick
  IF v_is_player_1 THEN
    UPDATE practice_matches
    SET player_1_theme_drop_id = p_drop_id,
        player_1_theme_song_name = p_song_name,
        player_1_theme_song_preview_url = p_song_preview_url,
        updated_at = now()
    WHERE id = p_match_id;
    
    -- Check if other player already picked
    v_both_picked := (v_match.player_2_theme_drop_id IS NOT NULL);
  ELSE
    UPDATE practice_matches
    SET player_2_theme_drop_id = p_drop_id,
        player_2_theme_song_name = p_song_name,
        player_2_theme_song_preview_url = p_song_preview_url,
        updated_at = now()
    WHERE id = p_match_id;
    
    -- Check if other player already picked
    v_both_picked := (v_match.player_1_theme_drop_id IS NOT NULL);
  END IF;
  
  -- If both players have picked, start the timer
  IF v_both_picked THEN
    UPDATE practice_matches
    SET status = 'in_progress',
        starts_at = now(),
        ends_at = now() + (v_match.duration_minutes || ' minutes')::INTERVAL,
        updated_at = now()
    WHERE id = p_match_id;
    
    RETURN jsonb_build_object('success', true, 'started', true);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'started', false);
END;
$$;

-- Update find_practice_match to NOT set starts_at/ends_at initially (song pick phase first)
CREATE OR REPLACE FUNCTION public.find_practice_match(p_user_id uuid, p_match_type text, p_duration integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  user_tier TEXT;
  matched_queue RECORD;
  new_match_id UUID;
BEGIN
  -- Get user's skill tier
  SELECT get_skill_tier(COALESCE(global_index_score, 0)) INTO user_tier
  FROM public.profiles WHERE id = p_user_id;
  
  -- Look for a match in queue (same tier, same type, not self)
  SELECT * INTO matched_queue
  FROM public.practice_queue
  WHERE user_id != p_user_id
    AND match_type = p_match_type
    AND skill_tier = user_tier
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF matched_queue IS NULL THEN
    -- No match found, add to queue
    INSERT INTO public.practice_queue (user_id, match_type, duration_minutes, skill_tier)
    VALUES (p_user_id, p_match_type, p_duration, user_tier)
    ON CONFLICT (user_id) DO UPDATE 
    SET match_type = p_match_type, 
        duration_minutes = p_duration,
        skill_tier = user_tier,
        queued_at = now(),
        expires_at = now() + INTERVAL '15 minutes';
    
    RETURN NULL;
  END IF;
  
  -- Match found! Create the practice match
  -- starts_at and ends_at are NULL — they get set when both players pick their songs
  INSERT INTO public.practice_matches (
    match_type, 
    duration_minutes, 
    player_1_id, 
    player_2_id, 
    status,
    matched_at
  )
  VALUES (
    p_match_type,
    GREATEST(matched_queue.duration_minutes, p_duration),
    matched_queue.user_id,
    p_user_id,
    'matched',
    now()
  )
  RETURNING id INTO new_match_id;
  
  -- Remove both users from queue
  DELETE FROM public.practice_queue WHERE user_id IN (p_user_id, matched_queue.user_id);
  
  -- Create notifications for both players
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES 
    (matched_queue.user_id, 'practice_matched', 'Match Found!', 'Pick your song to start the 1v1!', 
     jsonb_build_object('match_id', new_match_id, 'match_type', p_match_type)),
    (p_user_id, 'practice_matched', 'Match Found!', 'Pick your song to start the 1v1!',
     jsonb_build_object('match_id', new_match_id, 'match_type', p_match_type));
  
  RETURN new_match_id;
END;
$$;


-- ── migration: 20260221205330_b0c69e17-3022-4e22-8433-44541add9056.sql ─────────────────────────────────────────
-- Add judge video URL column to quick_fights for judge review videos
ALTER TABLE public.quick_fights ADD COLUMN IF NOT EXISTS judge_video_url text;


-- ── migration: 20260223012627_44f80d34-ca8d-46fa-bbe0-048702983e10.sql ─────────────────────────────────────────

-- Update the auto-assign trigger to respect the selected judge
-- If judge_id is set on the review_request, route ONLY to that judge
-- If judge_id is NULL, route to ALL judges (not just 2 hardcoded ones)
CREATE OR REPLACE FUNCTION public.auto_assign_qoi_judges()
RETURNS TRIGGER AS $$
DECLARE
  jid UUID;
  all_judge_ids UUID[];
BEGIN
  -- If the user selected a specific judge, route only to them
  IF NEW.judge_id IS NOT NULL THEN
    INSERT INTO public.judge_inbox (judge_id, review_request_id)
    VALUES (NEW.judge_id, NEW.id)
    ON CONFLICT (judge_id, review_request_id) DO NOTHING;
  ELSE
    -- No specific judge selected — route to ALL judges
    SELECT ARRAY_AGG(user_id) INTO all_judge_ids
    FROM public.user_roles
    WHERE role IN ('judge', 'trial_judge');

    IF all_judge_ids IS NOT NULL THEN
      FOREACH jid IN ARRAY all_judge_ids LOOP
        INSERT INTO public.judge_inbox (judge_id, review_request_id)
        VALUES (jid, NEW.id)
        ON CONFLICT (judge_id, review_request_id) DO NOTHING;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ── migration: 20260223132302_aeaa1b80-5716-46de-8c77-35b3bfe1b5dd.sql ─────────────────────────────────────────
-- Add category/type field for articles (daily_cover, press_release, feature, breaking, artist_spotlight, unit_showcase, review, opinion)
ALTER TABLE public.editorium_articles ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'feature';

-- Add priority for ordering within sections
ALTER TABLE public.editorium_articles ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

-- Add is_breaking flag for the breaking news ticker
ALTER TABLE public.editorium_articles ADD COLUMN IF NOT EXISTS is_breaking boolean NOT NULL DEFAULT false;

-- Add is_daily_cover flag
ALTER TABLE public.editorium_articles ADD COLUMN IF NOT EXISTS is_daily_cover boolean NOT NULL DEFAULT false;

-- ── migration: 20260223134501_28755a62-c25c-427a-9664-4f460e1f22cb.sql ─────────────────────────────────────────
-- Add review_tag and notes columns to review_requests so they actually persist
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS review_tag text;
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS notes text;

-- ── migration: 20260223135552_8eb97f71-456b-4c87-ac41-6cae84440ea8.sql ─────────────────────────────────────────
-- Fix quick_fights RLS: allow judges/admins/devs to update (claim & judge) fights
DROP POLICY IF EXISTS "Participants can update their fight" ON public.quick_fights;

CREATE POLICY "Participants and judges can update fights"
ON public.quick_fights
FOR UPDATE
USING (
  (auth.uid() = player_1_id) 
  OR (auth.uid() = player_2_id) 
  OR (auth.uid() = judge_id)
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
  OR has_role(auth.uid(), 'trial_judge'::app_role)
);

-- ── migration: 20260223141533_74401add-2a84-47bf-b11f-50401f86f45e.sql ─────────────────────────────────────────

-- Add song/theme pick columns to quick_fights (matching battles table pattern)
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS theme_drop_id UUID REFERENCES public.featured_drops(id),
  ADD COLUMN IF NOT EXISTS theme_song_name TEXT,
  ADD COLUMN IF NOT EXISTS theme_song_preview_url TEXT;

-- Add thumbnail columns to quick_fights for each player's submission thumbnail
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS player_1_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS player_2_thumbnail_url TEXT;

-- Add thumbnail columns to battles for each participant's submission thumbnail
ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS challenger_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS opponent_thumbnail_url TEXT;

-- Add community vote columns to quick_fights (matching battles pattern)
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS player_1_votes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player_2_votes INTEGER NOT NULL DEFAULT 0;

-- Create quick_fight_votes table for community voting
CREATE TABLE IF NOT EXISTS public.quick_fight_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  voted_for UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fight_id, user_id)
);

ALTER TABLE public.quick_fight_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quick fight votes"
  ON public.quick_fight_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.quick_fight_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for quick_fight_votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fight_votes;


-- ── migration: 20260224022715_70b3203b-4409-45d9-96d5-7c88a6c3223e.sql ─────────────────────────────────────────
-- Create storage bucket for editorium article images
INSERT INTO storage.buckets (id, name, public) VALUES ('editorium-images', 'editorium-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Editorium images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'editorium-images');

-- Authenticated users can upload (admin check done in app)
CREATE POLICY "Authenticated users can upload editorium images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'editorium-images' AND auth.role() = 'authenticated');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update editorium images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'editorium-images' AND auth.role() = 'authenticated');

-- Authenticated users can delete editorium images
CREATE POLICY "Authenticated users can delete editorium images"
ON storage.objects FOR DELETE
USING (bucket_id = 'editorium-images' AND auth.role() = 'authenticated');

-- ── migration: 20260226021011_ce006906-5e73-4a1e-aad2-745a2d40dd27.sql ─────────────────────────────────────────

-- Add permanent metadata columns to featured_submissions
ALTER TABLE public.featured_submissions
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS video_title text,
  ADD COLUMN IF NOT EXISTS author_username text,
  ADD COLUMN IF NOT EXISTS embed_html text;

-- Add permanent metadata columns to judge_rating_videos
ALTER TABLE public.judge_rating_videos
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS author_username text,
  ADD COLUMN IF NOT EXISTS embed_html text;

-- Add video_title and author_username to round_participations (already has thumbnail_url, custom_title)
ALTER TABLE public.round_participations
  ADD COLUMN IF NOT EXISTS author_username text,
  ADD COLUMN IF NOT EXISTS embed_html text;

-- Add video_title and author_username to event_participations (already has thumbnail_url, custom_title)
ALTER TABLE public.event_participations
  ADD COLUMN IF NOT EXISTS author_username text,
  ADD COLUMN IF NOT EXISTS embed_html text;

-- Add video_title to battles (already has challenger/opponent_thumbnail_url)
ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS challenger_video_title text,
  ADD COLUMN IF NOT EXISTS challenger_author_username text,
  ADD COLUMN IF NOT EXISTS opponent_video_title text,
  ADD COLUMN IF NOT EXISTS opponent_author_username text;


-- ── migration: 20260226021432_1cf91957-7d3f-4bf4-8bd6-4f92c1e711df.sql ─────────────────────────────────────────

-- Add view_count to submission tables (manually updatable, only field that changes after initial submission)
ALTER TABLE public.round_participations ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.featured_submissions ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.judge_rating_videos ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;


-- ── migration: 20260226024401_b2f7635a-d598-4dc7-97c7-b4cc6889667c.sql ─────────────────────────────────────────

-- Feed posts table (Twitter-style short posts)
CREATE TABLE public.feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 280),
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'flex', 'edit_share', 'milestone')),
  media_url TEXT,
  media_platform TEXT,
  submission_id UUID,
  like_count INTEGER NOT NULL DEFAULT 0,
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feed post likes
CREATE TABLE public.feed_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Feed post bookmarks
CREATE TABLE public.feed_post_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX idx_feed_posts_user_id ON public.feed_posts(user_id);
CREATE INDEX idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX idx_feed_posts_post_type ON public.feed_posts(post_type);
CREATE INDEX idx_feed_post_likes_post_id ON public.feed_post_likes(post_id);
CREATE INDEX idx_feed_post_likes_user_id ON public.feed_post_likes(user_id);
CREATE INDEX idx_feed_post_bookmarks_user_id ON public.feed_post_bookmarks(user_id);

-- Enable RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_bookmarks ENABLE ROW LEVEL SECURITY;

-- Feed posts policies
CREATE POLICY "Anyone can view feed posts" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.feed_posts FOR DELETE USING (auth.uid() = user_id);

-- Feed post likes policies
CREATE POLICY "Anyone can view likes" ON public.feed_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.feed_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.feed_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Feed post bookmarks policies
CREATE POLICY "Anyone can view own bookmarks" ON public.feed_post_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark posts" ON public.feed_post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark posts" ON public.feed_post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Trigger: sync like count
CREATE OR REPLACE FUNCTION public.sync_feed_post_like_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_feed_post_like
AFTER INSERT OR DELETE ON public.feed_post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_post_like_count();

-- Trigger: sync bookmark count
CREATE OR REPLACE FUNCTION public.sync_feed_post_bookmark_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_feed_post_bookmark
AFTER INSERT OR DELETE ON public.feed_post_bookmarks
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_post_bookmark_count();

-- Trigger: create notification on like
CREATE OR REPLACE FUNCTION public.notify_feed_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  post_owner UUID;
  liker_username TEXT;
  liker_avatar TEXT;
  post_preview TEXT;
BEGIN
  SELECT user_id, LEFT(content, 50) INTO post_owner, post_preview FROM feed_posts WHERE id = NEW.post_id;
  IF post_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT username, avatar_url INTO liker_username, liker_avatar FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (post_owner, 'post_liked', 'Someone liked your post', '@' || COALESCE(liker_username, 'Someone') || ' liked: "' || COALESCE(post_preview, '') || '..."',
    jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id, 'liker_username', liker_username));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_feed_post_like_notify
AFTER INSERT ON public.feed_post_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_feed_post_like();

-- Enable realtime for feed_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;


-- ── migration: 20260226135443_d23d483c-2813-45f7-9f27-f13baeb61364.sql ─────────────────────────────────────────

-- Artist Campaigns table - tracks campaigns for enterprise clients
CREATE TABLE public.artist_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.enterprise_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  total_views BIGINT NOT NULL DEFAULT 0,
  total_impressions BIGINT NOT NULL DEFAULT 0,
  total_engagements BIGINT NOT NULL DEFAULT 0,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  budget_cents INTEGER DEFAULT 0,
  spent_cents INTEGER DEFAULT 0,
  roi_percentage NUMERIC(6,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign edits - edits linked to a campaign
CREATE TABLE public.artist_campaign_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.artist_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  platform TEXT DEFAULT 'tiktok',
  view_count BIGINT NOT NULL DEFAULT 0,
  like_count BIGINT NOT NULL DEFAULT 0,
  share_count BIGINT NOT NULL DEFAULT 0,
  comment_count BIGINT NOT NULL DEFAULT 0,
  editor_username TEXT,
  editor_id UUID,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('pending', 'live', 'removed')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_campaign_edits ENABLE ROW LEVEL SECURITY;

-- RLS: Enterprise clients can view their own campaigns
CREATE POLICY "Clients can view own campaigns"
  ON public.artist_campaigns FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage campaigns"
  ON public.artist_campaigns FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view campaign edits"
  ON public.artist_campaign_edits FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage campaign edits"
  ON public.artist_campaign_edits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update timestamp trigger
CREATE TRIGGER update_artist_campaigns_updated_at
  BEFORE UPDATE ON public.artist_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_campaign_edits_updated_at
  BEFORE UPDATE ON public.artist_campaign_edits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── migration: 20260226135505_12ca7116-6f6f-4411-a85c-a40d4297ca34.sql ─────────────────────────────────────────

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.artist_campaigns;
DROP POLICY IF EXISTS "Admins can manage campaign edits" ON public.artist_campaign_edits;

-- Only allow mutations from service_role (edge functions) or authenticated admins/devs
CREATE POLICY "Service role manages campaigns"
  ON public.artist_campaigns FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates campaigns"
  ON public.artist_campaigns FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role deletes campaigns"
  ON public.artist_campaigns FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role manages campaign edits"
  ON public.artist_campaign_edits FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates campaign edits"
  ON public.artist_campaign_edits FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role deletes campaign edits"
  ON public.artist_campaign_edits FOR DELETE
  TO service_role
  USING (true);

-- Authenticated admin/dev users can also manage via has_role
CREATE POLICY "Admins can insert campaigns"
  ON public.artist_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can update campaigns"
  ON public.artist_campaigns FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can delete campaigns"
  ON public.artist_campaigns FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can insert campaign edits"
  ON public.artist_campaign_edits FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can update campaign edits"
  ON public.artist_campaign_edits FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can delete campaign edits"
  ON public.artist_campaign_edits FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));


-- ── migration: 20260226140622_278ba479-340d-4412-b6c5-6140e86fcdb6.sql ─────────────────────────────────────────

-- Solo Mode submissions table
CREATE TABLE public.solo_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  username TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Song / Theme
  drop_id UUID REFERENCES public.featured_drops(id),
  song_name TEXT NOT NULL,
  artist_name TEXT,
  theme TEXT NOT NULL,
  
  -- Submission
  submission_url TEXT,
  submission_platform TEXT,
  thumbnail_url TEXT,
  video_title TEXT,
  submitted_at TIMESTAMPTZ,
  
  -- Judge scoring
  judge_id UUID REFERENCES public.profiles(id),
  judge_claimed_at TIMESTAMPTZ,
  quality_score NUMERIC,
  originality_score NUMERIC,
  impact_score NUMERIC,
  qoi_score NUMERIC,
  judge_notes TEXT,
  judged_at TIMESTAMPTZ,
  
  -- Index reward
  index_awarded INTEGER DEFAULT 0,
  
  -- Status: picking_song | editing | submitted | judging | scored
  status TEXT NOT NULL DEFAULT 'picking_song',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solo_submissions ENABLE ROW LEVEL SECURITY;

-- Users can read all scored submissions (leaderboard) and their own
CREATE POLICY "Users can view own solo submissions"
  ON public.solo_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view scored solo submissions"
  ON public.solo_submissions FOR SELECT
  USING (status = 'scored');

CREATE POLICY "Users can create own solo submissions"
  ON public.solo_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own solo submissions"
  ON public.solo_submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Judges can view submitted entries
CREATE POLICY "Judges can view submitted solo entries"
  ON public.solo_submissions FOR SELECT
  USING (status IN ('submitted', 'judging', 'scored'));

-- Judges can update for scoring
CREATE POLICY "Judges can score solo submissions"
  ON public.solo_submissions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('judge', 'trial_judge', 'admin'))
  );

-- Index for leaderboard queries
CREATE INDEX idx_solo_submissions_drop_score ON public.solo_submissions(drop_id, qoi_score DESC NULLS LAST) WHERE status = 'scored';
CREATE INDEX idx_solo_submissions_user ON public.solo_submissions(user_id, created_at DESC);
CREATE INDEX idx_solo_submissions_status ON public.solo_submissions(status);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solo_submissions;

-- Award index on scoring
CREATE OR REPLACE FUNCTION public.award_solo_index()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- Index awarded = floor of QOI score (up to 100+)
    NEW.index_awarded := FLOOR(NEW.qoi_score)::INTEGER;
    
    -- Add to user's spendable and global index
    UPDATE public.profiles
    SET spendable_index = spendable_index + NEW.index_awarded,
        global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
    WHERE id = NEW.user_id;
    
    -- Award XP too
    PERFORM public.award_xp(NEW.user_id, LEAST(NEW.index_awarded, 50), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_solo_submission_scored
  BEFORE UPDATE ON public.solo_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_solo_index();


-- ── migration: 20260226164221_ae8edd72-f32e-4770-b0cb-b8199e4adea9.sql ─────────────────────────────────────────
-- Add solo cancel tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS solo_cancel_count integer NOT NULL DEFAULT 0;

-- ── migration: 20260226183302_54f4d8d6-e2b4-4cb0-b1a5-aeb0a93dd84e.sql ─────────────────────────────────────────

-- Add promoted flag to featured_drops for campaign-priority drops
ALTER TABLE public.featured_drops ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_featured_drops_promoted ON public.featured_drops (is_promoted) WHERE is_promoted = true;


-- ── migration: 20260226184137_81068743-069e-4ffc-b749-95688c63a9dc.sql ─────────────────────────────────────────

-- Add campaign goal tracking
ALTER TABLE public.artist_campaigns ADD COLUMN IF NOT EXISTS goal_views integer NOT NULL DEFAULT 0;
ALTER TABLE public.artist_campaigns ADD COLUMN IF NOT EXISTS goal_label text DEFAULT NULL;

-- Dashboard update requests from clients to admin
CREATE TABLE public.dashboard_update_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.enterprise_clients(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.artist_campaigns(id) ON DELETE SET NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

ALTER TABLE public.dashboard_update_requests ENABLE ROW LEVEL SECURITY;

-- Public read for service role only (edge functions access via service role)
CREATE POLICY "Service role full access" ON public.dashboard_update_requests FOR ALL USING (true) WITH CHECK (true);


-- ── migration: 20260226190329_70f7fb28-0614-4747-8df5-c10651c936f3.sql ─────────────────────────────────────────

-- Add slug, password, and featured artist to campaigns
ALTER TABLE public.artist_campaigns 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS featured_artist_id UUID REFERENCES public.featured_artists(id) ON DELETE SET NULL;

-- Auto-generate slugs for campaigns
CREATE OR REPLACE FUNCTION public.generate_campaign_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name AND NEW.slug = OLD.slug) THEN
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    base_slug := SUBSTRING(base_slug FROM 1 FOR 40);
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.artist_campaigns WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_campaign_slug
BEFORE INSERT OR UPDATE ON public.artist_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.generate_campaign_slug();

-- Backfill existing campaigns with slugs
DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN SELECT id, name FROM public.artist_campaigns WHERE slug IS NULL LOOP
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(rec.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    base_slug := SUBSTRING(base_slug FROM 1 FOR 40);
    final_slug := base_slug;
    counter := 0;
    
    WHILE EXISTS (SELECT 1 FROM public.artist_campaigns WHERE slug = final_slug AND id != rec.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    UPDATE public.artist_campaigns SET slug = final_slug WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_artist_campaigns_slug ON public.artist_campaigns(slug);


-- ── migration: 20260226191423_03f15c33-e961-4bbc-b205-7abab39d143a.sql ─────────────────────────────────────────

ALTER TABLE public.artist_campaigns ADD COLUMN IF NOT EXISTS goal_posts integer NOT NULL DEFAULT 0;
ALTER TABLE public.artist_campaigns ADD COLUMN IF NOT EXISTS client_name text;


-- ── migration: 20260227041808_171bdeea-c7a7-44d0-aaa9-4cb7362d4dba.sql ─────────────────────────────────────────

-- 1. New table: solo_submission_votes
CREATE TABLE public.solo_submission_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.solo_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, user_id)
);

-- 2. New columns on solo_submissions
ALTER TABLE public.solo_submissions
  ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

-- 3. RLS on solo_submission_votes
ALTER TABLE public.solo_submission_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read solo votes"
  ON public.solo_submission_votes FOR SELECT
  USING (true);

CREATE POLICY "Auth users can insert own votes"
  ON public.solo_submission_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth users can delete own votes"
  ON public.solo_submission_votes FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Trigger to sync vote counts
CREATE OR REPLACE FUNCTION public.sync_solo_submission_votes()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.submission_id, OLD.submission_id);
  
  UPDATE public.solo_submissions
  SET upvotes = (SELECT COUNT(*) FROM public.solo_submission_votes WHERE submission_id = target_id AND vote_type = 'up'),
      downvotes = (SELECT COUNT(*) FROM public.solo_submission_votes WHERE submission_id = target_id AND vote_type = 'down')
  WHERE id = target_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_solo_votes_on_change
  AFTER INSERT OR DELETE OR UPDATE ON public.solo_submission_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_solo_submission_votes();

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solo_submission_votes;

-- 6. Storage bucket for solo thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('solo-thumbnails', 'solo-thumbnails', true);

CREATE POLICY "Anyone can view solo thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'solo-thumbnails');

CREATE POLICY "Auth users can upload solo thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'solo-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own solo thumbnails"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'solo-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── migration: 20260227045626_fbdaa869-8be3-4232-b281-7e81db605687.sql ─────────────────────────────────────────
-- Fix: Allow 'solo' and 'quick_fight' in feed_comments submission_type
ALTER TABLE public.feed_comments DROP CONSTRAINT feed_comments_submission_type_check;
ALTER TABLE public.feed_comments ADD CONSTRAINT feed_comments_submission_type_check 
  CHECK (submission_type = ANY (ARRAY['arena'::text, 'review'::text, 'battle'::text, 'judge_video'::text, 'quick_fight'::text, 'solo'::text]));

-- ── migration: 20260227055346_866c101a-8537-4c6a-9092-08694174bc8a.sql ─────────────────────────────────────────

-- ═══ FEATURED DROP ROUNDS ═══
CREATE TABLE public.featured_drop_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL REFERENCES public.featured_drops(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 1,
  max_submissions INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, open, full, judging, completed
  judge_id UUID,
  judge_username TEXT,
  judge_avatar_url TEXT,
  judge_video_url TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(drop_id, round_number)
);

ALTER TABLE public.featured_drop_rounds ENABLE ROW LEVEL SECURITY;

-- Anyone can view rounds
CREATE POLICY "Anyone can view rounds"
  ON public.featured_drop_rounds FOR SELECT USING (true);

-- Admins/devs can insert/update/delete
CREATE POLICY "Admins manage rounds"
  ON public.featured_drop_rounds FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins update rounds"
  ON public.featured_drop_rounds FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins delete rounds"
  ON public.featured_drop_rounds FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Judges can update their own round (to submit video + rankings)
CREATE POLICY "Judge can update own round"
  ON public.featured_drop_rounds FOR UPDATE
  TO authenticated
  USING (judge_id = auth.uid());

-- ═══ ADD round_id TO featured_submissions ═══
ALTER TABLE public.featured_submissions ADD COLUMN round_id UUID REFERENCES public.featured_drop_rounds(id);

-- ═══ FEATURED ROUND RANKINGS ═══
CREATE TABLE public.featured_round_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.featured_drop_rounds(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.featured_submissions(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  index_awarded INTEGER NOT NULL DEFAULT 0,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(round_id, submission_id),
  UNIQUE(round_id, rank)
);

ALTER TABLE public.featured_round_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rankings"
  ON public.featured_round_rankings FOR SELECT USING (true);

CREATE POLICY "Admins manage rankings"
  ON public.featured_round_rankings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins update rankings"
  ON public.featured_round_rankings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins delete rankings"
  ON public.featured_round_rankings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Judge assigned to the round can also manage rankings
CREATE POLICY "Judge can insert rankings"
  ON public.featured_round_rankings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.featured_drop_rounds
      WHERE id = round_id AND judge_id = auth.uid()
    )
  );

CREATE POLICY "Judge can update rankings"
  ON public.featured_round_rankings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.featured_drop_rounds
      WHERE id = round_id AND judge_id = auth.uid()
    )
  );

-- ═══ AUTO-UPDATE round status when submissions fill ═══
CREATE OR REPLACE FUNCTION public.check_round_slot_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
  max_subs INTEGER;
  round_status TEXT;
BEGIN
  IF NEW.round_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT status, max_submissions INTO round_status, max_subs
  FROM public.featured_drop_rounds WHERE id = NEW.round_id;

  IF round_status != 'open' THEN
    RAISE EXCEPTION 'This round is not accepting submissions';
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.featured_submissions WHERE round_id = NEW.round_id;

  -- current_count is BEFORE this insert
  IF current_count >= max_subs THEN
    RAISE EXCEPTION 'Round is full — no more submission slots';
  END IF;

  -- If this insert fills it, mark as full
  IF current_count + 1 >= max_subs THEN
    UPDATE public.featured_drop_rounds SET status = 'full' WHERE id = NEW.round_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_round_slots
  BEFORE INSERT ON public.featured_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_round_slot_limit();

-- ═══ ENABLE REALTIME ═══
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_drop_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_round_rankings;


-- ── migration: 20260227075345_8f89089f-8bf2-4cc9-951f-202eee699421.sql ─────────────────────────────────────────

-- Add disqualification columns to solo_submissions
ALTER TABLE public.solo_submissions
  ADD COLUMN IF NOT EXISTS is_disqualified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS disqualify_reason TEXT;

-- Update the award_solo_index trigger to skip index if disqualified
CREATE OR REPLACE FUNCTION public.award_solo_index()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- Index awarded = floor of QOI score, BUT only if not disqualified
    IF NEW.is_disqualified = true THEN
      NEW.index_awarded := 0;
    ELSE
      NEW.index_awarded := FLOOR(NEW.qoi_score)::INTEGER;
      
      -- Add to user's spendable and global index
      UPDATE public.profiles
      SET spendable_index = spendable_index + NEW.index_awarded,
          global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
      WHERE id = NEW.user_id;
    END IF;
    
    -- Award XP regardless (they still learn from the rating)
    PERFORM public.award_xp(NEW.user_id, LEAST(FLOOR(NEW.qoi_score)::INTEGER, 50), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$$;


-- ── migration: 20260227075828_421b4260-78d8-4c6a-bbdb-8e3578d19ded.sql ─────────────────────────────────────────

-- Add slug to featured_drops for clean URLs
ALTER TABLE public.featured_drops ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing drops
UPDATE public.featured_drops 
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_drops_slug ON public.featured_drops(slug) WHERE slug IS NOT NULL;

-- Auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.generate_featured_drop_slug()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NOT NULL THEN RETURN NEW; END IF;
  base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM featured_drops WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_featured_drop_slug
  BEFORE INSERT ON public.featured_drops
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_featured_drop_slug();


-- ── migration: 20260227113642_582bb6ab-de38-4bc5-885f-6226cdb5d761.sql ─────────────────────────────────────────

-- Add notification email & preferences to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS notification_email TEXT,
  ADD COLUMN IF NOT EXISTS notify_scores BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_battles BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_drops BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_connections BOOLEAN NOT NULL DEFAULT true;

-- Create email log table to prevent spam
CREATE TABLE IF NOT EXISTS public.email_notifications_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resend_id TEXT
);

ALTER TABLE public.email_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs"
  ON public.email_notifications_log FOR SELECT
  USING (auth.uid() = user_id);

-- Index for dedup checks
CREATE INDEX IF NOT EXISTS idx_email_log_user_type ON public.email_notifications_log (user_id, email_type, sent_at DESC);

-- Enable realtime for profiles notification changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_notifications_log;


-- ── migration: 20260227113656_3aa8cb52-a329-4c6b-8e12-2b6df7008ae8.sql ─────────────────────────────────────────

-- Add insert policy for email log (system inserts via service role, users only read their own)
CREATE POLICY "Service role can insert email logs"
  ON public.email_notifications_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ── migration: 20260227120916_bcb8951a-ecd2-4259-8c07-2958d131fd5a.sql ─────────────────────────────────────────

-- Queue table for overflow submissions when a round is full
CREATE TABLE public.featured_drop_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL REFERENCES public.featured_drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  thumbnail_url TEXT,
  video_title TEXT,
  author_username TEXT,
  embed_html TEXT,
  queue_position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, promoted, rejected
  promoted_to_round_id UUID REFERENCES public.featured_drop_rounds(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(drop_id, user_id) -- one queue entry per user per drop
);

-- Enable RLS
ALTER TABLE public.featured_drop_queue ENABLE ROW LEVEL SECURITY;

-- Anyone can read the queue
CREATE POLICY "Anyone can view queue" ON public.featured_drop_queue
  FOR SELECT USING (true);

-- Authenticated users can insert their own entry
CREATE POLICY "Users can submit to queue" ON public.featured_drop_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins/devs can update (promote/reject)
CREATE POLICY "Admins can manage queue" ON public.featured_drop_queue
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Admins can delete queue" ON public.featured_drop_queue
  FOR DELETE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Auto-assign queue position
CREATE OR REPLACE FUNCTION public.set_queue_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_position), 0) + 1 INTO next_pos
  FROM public.featured_drop_queue
  WHERE drop_id = NEW.drop_id;
  
  NEW.queue_position := next_pos;
  
  -- Enforce max 100 queue entries per drop
  IF next_pos > 100 THEN
    RAISE EXCEPTION 'Queue is full (max 100)';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_queue_position_trigger
  BEFORE INSERT ON public.featured_drop_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_queue_position();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_drop_queue;


-- ── migration: 20260227132745_b0056c7c-00af-47ac-8086-7aff2a8c96cd.sql ─────────────────────────────────────────

-- Make user_id nullable on both tables so guests can submit
ALTER TABLE public.featured_drop_queue ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.featured_submissions ALTER COLUMN user_id DROP NOT NULL;

-- Add claim_token for guest submissions (used to link after signup)
ALTER TABLE public.featured_drop_queue ADD COLUMN IF NOT EXISTS claim_token text;
ALTER TABLE public.featured_submissions ADD COLUMN IF NOT EXISTS claim_token text;

-- Drop existing insert policies that require auth
DROP POLICY IF EXISTS "Users can submit to queue" ON public.featured_drop_queue;
DROP POLICY IF EXISTS "Users can submit to drops" ON public.featured_submissions;

-- Allow anyone (including anon) to insert into queue
CREATE POLICY "Anyone can submit to queue"
ON public.featured_drop_queue
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone (including anon) to insert submissions
CREATE POLICY "Anyone can submit to drops"
ON public.featured_submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow claiming: users can update their own submissions by claim_token
CREATE POLICY "Users can claim guest submissions queue"
ON public.featured_drop_queue
FOR UPDATE
TO authenticated
USING (claim_token IS NOT NULL AND user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can claim guest submissions"
ON public.featured_submissions
FOR UPDATE
TO authenticated
USING (claim_token IS NOT NULL AND user_id IS NULL)
WITH CHECK (auth.uid() = user_id);


-- ── migration: 20260227145149_0fddf8e2-89a5-4d56-91fb-0f15f66c7ed8.sql ─────────────────────────────────────────

-- Create trigger function to auto-link featured submissions to campaigns
CREATE OR REPLACE FUNCTION public.auto_link_submission_to_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign_id UUID;
  v_campaign_name TEXT;
BEGIN
  -- Find campaign linked to this drop's artist
  SELECT ac.id INTO v_campaign_id
  FROM artist_campaigns ac
  JOIN featured_drops fd ON fd.artist_id = ac.featured_artist_id
  WHERE fd.id = NEW.drop_id
    AND ac.status = 'active'
  LIMIT 1;

  -- If a campaign exists, create a campaign edit
  IF v_campaign_id IS NOT NULL THEN
    INSERT INTO public.artist_campaign_edits (
      campaign_id,
      editor_id,
      editor_username,
      title,
      video_url,
      platform,
      status,
      published_at
    ) VALUES (
      v_campaign_id,
      NEW.user_id,
      NEW.username,
      'Featured Drop Edit',
      NEW.submission_url,
      NEW.platform,
      'published',
      NEW.created_at
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to featured_submissions
CREATE TRIGGER trg_auto_link_submission_to_campaign
AFTER INSERT ON public.featured_submissions
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_submission_to_campaign();

-- Also link queue entries when they get promoted
CREATE TRIGGER trg_auto_link_queue_to_campaign
AFTER INSERT ON public.featured_drop_queue
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_submission_to_campaign();


-- ── migration: 20260227145417_8d6999e9-5fde-4555-96d9-07af633f14ad.sql ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_link_submission_to_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  SELECT ac.id INTO v_campaign_id
  FROM artist_campaigns ac
  JOIN featured_drops fd ON fd.artist_id = ac.featured_artist_id
  WHERE fd.id = NEW.drop_id
    AND ac.status = 'active'
  LIMIT 1;

  IF v_campaign_id IS NOT NULL THEN
    INSERT INTO public.artist_campaign_edits (
      campaign_id, editor_id, editor_username, title, video_url, platform, status, published_at
    ) VALUES (
      v_campaign_id, NEW.user_id, NEW.username, 'Featured Drop Edit',
      NEW.submission_url, NEW.platform, 'live', NEW.created_at
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


-- ── migration: 20260227175830_3afff09c-d3f2-414f-9df1-08fbd3ea21bd.sql ─────────────────────────────────────────

-- Create user radio tracks table
CREATE TABLE public.user_radio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_name TEXT NOT NULL,
  artist_name TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT false,
  track_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_radio_tracks ENABLE ROW LEVEL SECURITY;

-- Users can view their own tracks
CREATE POLICY "Users can view own radio tracks"
  ON public.user_radio_tracks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public tracks from others
CREATE POLICY "Anyone can view public radio tracks"
  ON public.user_radio_tracks FOR SELECT
  USING (is_public = true);

-- Users can insert their own tracks (max 25 enforced client-side + trigger)
CREATE POLICY "Users can add own radio tracks"
  ON public.user_radio_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tracks
CREATE POLICY "Users can update own radio tracks"
  ON public.user_radio_tracks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tracks
CREATE POLICY "Users can delete own radio tracks"
  ON public.user_radio_tracks FOR DELETE
  USING (auth.uid() = user_id);

-- Enforce 25 track limit via trigger
CREATE OR REPLACE FUNCTION public.enforce_radio_track_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  track_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO track_count
  FROM public.user_radio_tracks
  WHERE user_id = NEW.user_id;

  IF track_count >= 25 THEN
    RAISE EXCEPTION 'Maximum of 25 radio tracks allowed per user';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_radio_track_limit
  BEFORE INSERT ON public.user_radio_tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_radio_track_limit();

-- Create storage bucket for user radio uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('user-radio', 'user-radio', true);

-- Storage policies
CREATE POLICY "Users can upload radio audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-radio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can listen to radio audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-radio');

CREATE POLICY "Users can delete own radio audio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-radio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_radio_tracks;


-- ── migration: 20260227182834_d089f7b8-be65-49a5-813f-9ab40b637e0f.sql ─────────────────────────────────────────
-- Add playlist name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS playlist_name TEXT DEFAULT NULL;

-- ── migration: 20260228065631_10feeea6-6389-43ae-bfd5-0933341d95c0.sql ─────────────────────────────────────────

-- Newsletter subscribers for Editorium
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'editorium',
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT newsletter_subscribers_email_source_key UNIQUE (email, source)
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can unsubscribe (update their own)
CREATE POLICY "Users can update own subscription"
  ON public.newsletter_subscribers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for lookups
CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers (email);
CREATE INDEX idx_newsletter_subscribers_source ON public.newsletter_subscribers (source);


-- ── migration: 20260228075135_63c548c0-b573-487a-9808-169b5444e2d6.sql ─────────────────────────────────────────

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


-- ── migration: 20260301104557_c028c393-43e2-4184-b0ff-afd5cdd0b8f3.sql ─────────────────────────────────────────

-- Storage bucket for loop media uploads (images, videos, GIFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('loop-media', 'loop-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to loop-media
CREATE POLICY "Users can upload loop media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'loop-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone can view loop media (public bucket)
CREATE POLICY "Loop media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'loop-media');

-- Users can delete their own loop media
CREATE POLICY "Users can delete own loop media"
ON storage.objects FOR DELETE
USING (bucket_id = 'loop-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add uploaded media columns to feed_posts
ALTER TABLE public.feed_posts 
ADD COLUMN IF NOT EXISTS uploaded_media_url text,
ADD COLUMN IF NOT EXISTS uploaded_media_type text;

-- Emoji reactions table for loops
CREATE TABLE public.feed_post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

ALTER TABLE public.feed_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
ON public.feed_post_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can add reactions"
ON public.feed_post_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
ON public.feed_post_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast reaction lookups
CREATE INDEX idx_feed_post_reactions_post_id ON public.feed_post_reactions(post_id);
CREATE INDEX idx_feed_post_reactions_user ON public.feed_post_reactions(user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_post_reactions;


-- ── migration: 20260301105613_af807078-1b2d-48ff-99e9-ef91a1bd2463.sql ─────────────────────────────────────────

-- Admin-managed radio tracks for LOOPGATE Radio
CREATE TABLE public.radio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_name TEXT NOT NULL,
  artist_name TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  is_priority BOOLEAN NOT NULL DEFAULT false,
  track_order INTEGER NOT NULL DEFAULT 0,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.radio_tracks ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Radio tracks are public" ON public.radio_tracks FOR SELECT USING (true);

-- Only admins/devs can manage
CREATE POLICY "Admins can insert radio tracks" ON public.radio_tracks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role));
CREATE POLICY "Admins can update radio tracks" ON public.radio_tracks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role));
CREATE POLICY "Admins can delete radio tracks" ON public.radio_tracks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role));

-- User radio settings
CREATE TABLE public.user_radio_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  autoplay_enabled BOOLEAN NOT NULL DEFAULT true,
  default_playlist TEXT NOT NULL DEFAULT 'loopgate',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_radio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings" ON public.user_radio_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_radio_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_radio_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for radio uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('radio-tracks', 'radio-tracks', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view radio tracks" ON storage.objects FOR SELECT USING (bucket_id = 'radio-tracks');
CREATE POLICY "Admins can upload radio tracks" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'radio-tracks' AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role)));
CREATE POLICY "Admins can delete radio tracks" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'radio-tracks' AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role)));


-- ── migration: 20260301115011_b13d4e8c-7343-4ffc-b82f-834273bc9d53.sql ─────────────────────────────────────────

-- Add cover_url to user_radio_tracks for user playlist cover art
ALTER TABLE public.user_radio_tracks ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Create storage bucket for track cover art
INSERT INTO storage.buckets (id, name, public) VALUES ('track-covers', 'track-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload cover art
CREATE POLICY "Users can upload track covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'track-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to covers
CREATE POLICY "Track covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'track-covers');

-- Allow users to update their own covers
CREATE POLICY "Users can update their own covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'track-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own covers
CREATE POLICY "Users can delete their own covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'track-covers' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── migration: 20260301132527_6bc5caed-9d52-49dc-8e55-ba155a40a92e.sql ─────────────────────────────────────────

-- Loopy chat conversations
CREATE TABLE public.loopy_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loopy chat messages
CREATE TABLE public.loopy_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.loopy_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loopy_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loopy_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON public.loopy_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.loopy_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.loopy_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.loopy_conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages access through conversation ownership
CREATE POLICY "Users can view own messages" ON public.loopy_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.loopy_conversations WHERE id = conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create own messages" ON public.loopy_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.loopy_conversations WHERE id = conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own messages" ON public.loopy_messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.loopy_conversations WHERE id = conversation_id AND user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_loopy_conversations_user ON public.loopy_conversations(user_id, updated_at DESC);
CREATE INDEX idx_loopy_messages_conversation ON public.loopy_messages(conversation_id, created_at ASC);


-- ── migration: 20260301174353_31aae5b3-b048-4467-94cc-0fd838e2a529.sql ─────────────────────────────────────────
-- Add equipped status to shop purchases
ALTER TABLE public.shop_purchases ADD COLUMN is_equipped BOOLEAN NOT NULL DEFAULT false;


-- ── migration: 20260301175244_244cb425-5db6-4d68-8f64-73eeb1e4e407.sql ─────────────────────────────────────────
-- Allow users to update their own purchases (equip/unequip)
CREATE POLICY "Users can update their own purchases"
ON public.shop_purchases
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ── migration: 20260301185650_9e3a01be-1b8d-4463-ad07-bd64571d11fc.sql ─────────────────────────────────────────
ALTER TABLE public.featured_drops ADD COLUMN prize_usd numeric DEFAULT 0;

-- ── migration: 20260302121318_090f69cc-017a-4cde-9ae6-392beae3dfc9.sql ─────────────────────────────────────────

-- Commissions table (admin posts paid editing jobs)
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  song_name text,
  artist_name text,
  payout_cents integer NOT NULL DEFAULT 0,
  max_slots integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'open',
  deadline timestamptz,
  thumbnail_url text,
  submission_count integer NOT NULL DEFAULT 0,
  accepted_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Commission submissions (editors submit their work)
CREATE TABLE public.commission_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  submission_url text NOT NULL,
  platform text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  feedback text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique: one submission per user per commission
ALTER TABLE public.commission_submissions ADD CONSTRAINT commission_submissions_unique_user UNIQUE (commission_id, user_id);

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_submissions ENABLE ROW LEVEL SECURITY;

-- Commissions: anyone can read, only admin/dev can write
CREATE POLICY "Anyone can view commissions"
ON public.commissions FOR SELECT USING (true);

CREATE POLICY "Admin can insert commissions"
ON public.commissions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update commissions"
ON public.commissions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete commissions"
ON public.commissions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'admin'));

-- Commission submissions: anyone can read, authenticated can insert own, admin can update
CREATE POLICY "Anyone can view submissions"
ON public.commission_submissions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit"
ON public.commission_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update submissions"
ON public.commission_submissions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'dev') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own pending submissions"
ON public.commission_submissions FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Trigger to sync submission_count and accepted_count on commissions
CREATE OR REPLACE FUNCTION public.sync_commission_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.commission_id, OLD.commission_id);
  
  UPDATE public.commissions
  SET submission_count = (SELECT COUNT(*) FROM public.commission_submissions WHERE commission_id = target_id),
      accepted_count = (SELECT COUNT(*) FROM public.commission_submissions WHERE commission_id = target_id AND status = 'accepted')
  WHERE id = target_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_commission_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.commission_submissions
FOR EACH ROW EXECUTE FUNCTION public.sync_commission_counts();

-- Auto-close commission when accepted_count reaches max_slots
CREATE OR REPLACE FUNCTION public.auto_close_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.accepted_count >= NEW.max_slots AND NEW.status = 'open' THEN
    NEW.status := 'filled';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_close_commission_trigger
BEFORE UPDATE ON public.commissions
FOR EACH ROW EXECUTE FUNCTION public.auto_close_commission();


-- ── migration: 20260303021951_597f4477-948c-4d1b-9e2e-489dc0cf62d5.sql ─────────────────────────────────────────

ALTER TABLE public.artist_campaigns
ADD COLUMN incoming_note text DEFAULT NULL;

COMMENT ON COLUMN public.artist_campaigns.incoming_note IS 'Admin-editable note shown on client dashboards, e.g. "3 edits incoming today"';


-- ── migration: 20260304044306_2f3aa970-2b47-424d-a552-65e3a8b99f3c.sql ─────────────────────────────────────────

-- Add rating and earned_cents to commission_submissions
ALTER TABLE public.commission_submissions
ADD COLUMN rating text DEFAULT NULL,
ADD COLUMN earned_cents integer NOT NULL DEFAULT 0;

-- Add earnings tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN earnings_cents integer NOT NULL DEFAULT 0,
ADD COLUMN pending_withdrawal_cents integer NOT NULL DEFAULT 0,
ADD COLUMN withdrawn_cents integer NOT NULL DEFAULT 0;

-- Create payout_requests table
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  paypal_email text NOT NULL,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own payout requests
CREATE POLICY "Users can view own payout requests"
ON public.payout_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own payout requests
CREATE POLICY "Users can create own payout requests"
ON public.payout_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin/dev can view all payout requests
CREATE POLICY "Staff can view all payout requests"
ON public.payout_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Admin/dev can update payout requests (approve/reject)
CREATE POLICY "Staff can update payout requests"
ON public.payout_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dev'));

-- Trigger: when commission_submission gets rated, update profile earnings
CREATE OR REPLACE FUNCTION public.award_commission_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a submission gets rated with earnings
  IF NEW.earned_cents > 0 AND (OLD.earned_cents IS NULL OR OLD.earned_cents = 0) THEN
    UPDATE public.profiles
    SET earnings_cents = earnings_cents + NEW.earned_cents
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_commission_submission_rated
BEFORE UPDATE ON public.commission_submissions
FOR EACH ROW
EXECUTE FUNCTION public.award_commission_earnings();

-- Enable realtime for payout_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;


-- ── migration: 20260304045518_27e28695-9c12-49f5-ab3b-75a101961048.sql ─────────────────────────────────────────

-- Add Solo Arena rating and earnings fields to featured_submissions
ALTER TABLE public.featured_submissions
ADD COLUMN IF NOT EXISTS rating text,
ADD COLUMN IF NOT EXISTS earned_cents integer NOT NULL DEFAULT 0;

-- Trigger to auto-credit earnings when a featured submission gets rated
CREATE OR REPLACE FUNCTION public.award_featured_submission_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.earned_cents > 0 AND (OLD.earned_cents IS NULL OR OLD.earned_cents = 0) AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET earnings_cents = earnings_cents + NEW.earned_cents
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_featured_submission_rated
BEFORE UPDATE ON public.featured_submissions
FOR EACH ROW
EXECUTE FUNCTION public.award_featured_submission_earnings();


-- ── migration: 20260304050434_f1d02cd6-173c-4f6f-a474-5b8b4a783977.sql ─────────────────────────────────────────

-- Add campaign_id to commissions so they can be tied to artist campaigns
ALTER TABLE public.commissions ADD COLUMN campaign_id uuid REFERENCES public.artist_campaigns(id) ON DELETE SET NULL;

-- Add custom payout tiers per commission (overrides global defaults)
ALTER TABLE public.commissions ADD COLUMN custom_payouts jsonb DEFAULT NULL;
-- Format: {"S": 500, "A": 300, "B": 100, "C": 0, "D": 0, "F": 0} (in cents)

-- Create trigger to auto-link rated commission submissions to campaign edits
CREATE OR REPLACE FUNCTION public.link_commission_submission_to_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign_id uuid;
  v_commission RECORD;
BEGIN
  -- Only fire when submission gets rated (status changes to accepted/declined with a rating)
  IF NEW.rating IS NOT NULL AND (OLD.rating IS NULL) THEN
    -- Get the commission's campaign_id
    SELECT campaign_id, title, artist_name, song_name 
    INTO v_commission
    FROM public.commissions 
    WHERE id = NEW.commission_id;
    
    -- If commission is linked to a campaign, create a campaign edit entry
    IF v_commission.campaign_id IS NOT NULL THEN
      INSERT INTO public.artist_campaign_edits (
        campaign_id,
        editor_id,
        editor_username,
        title,
        video_url,
        platform,
        status,
        published_at
      ) VALUES (
        v_commission.campaign_id,
        NEW.user_id,
        NEW.username,
        COALESCE(v_commission.title, 'Commission Edit'),
        NEW.submission_url,
        COALESCE(NEW.platform, 'other'),
        'live',
        now()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_commission_submission_rated_campaign_link
AFTER UPDATE ON public.commission_submissions
FOR EACH ROW
EXECUTE FUNCTION public.link_commission_submission_to_campaign();


-- ── migration: 20260304075803_9c1c4def-9c58-4991-9543-23961b996fb8.sql ─────────────────────────────────────────

ALTER TABLE public.featured_drops ADD COLUMN arena_eligible boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.featured_drops.arena_eligible IS 'Whether this drop appears in Solo Arena for paid submissions';


-- ── migration: 20260304082555_f5c8e685-91ff-442f-ada6-847b04d77837.sql ─────────────────────────────────────────

-- Add custom payouts and views milestone fields to featured_drops for per-campaign payout configuration
ALTER TABLE public.featured_drops 
ADD COLUMN IF NOT EXISTS custom_payouts jsonb DEFAULT '{"S": 500, "A": 300, "B": 100, "C": 0, "D": 0, "F": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS views_milestone integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_bonus_cents integer DEFAULT 0;

COMMENT ON COLUMN public.featured_drops.custom_payouts IS 'Per-tier payout in cents: {"S": 500, "A": 300, "B": 100, ...}';
COMMENT ON COLUMN public.featured_drops.views_milestone IS 'Views threshold for bonus eligibility (0 = disabled)';
COMMENT ON COLUMN public.featured_drops.views_bonus_cents IS 'Bonus payout in cents when views milestone is hit (C+ rated only, F excluded)';


-- ── migration: 20260304084354_57be5578-c5be-4cc3-92a0-f1783343ade0.sql ─────────────────────────────────────────

-- Marketplace fields for commissions
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS poster_username text,
ADD COLUMN IF NOT EXISTS poster_avatar_url text,
ADD COLUMN IF NOT EXISTS platform_fee_cents integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounty_type text NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS requirements text,
ADD COLUMN IF NOT EXISTS reference_urls text[],
ADD COLUMN IF NOT EXISTS poster_rating_avg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS poster_rating_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_marketplace boolean NOT NULL DEFAULT false;

-- Create bounty-covers storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bounty-covers', 'bounty-covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Bounty covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'bounty-covers');

CREATE POLICY "Users can upload bounty covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bounty-covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own bounty covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bounty-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own bounty covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'bounty-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Bounty poster ratings table
CREATE TABLE public.bounty_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL,
  poster_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bounty_id, rater_id)
);

ALTER TABLE public.bounty_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bounty ratings"
ON public.bounty_ratings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings"
ON public.bounty_ratings FOR INSERT
WITH CHECK (auth.uid() = rater_id);

-- Allow any authenticated user to create marketplace bounties
CREATE POLICY "Users can create marketplace bounties"
ON public.commissions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND is_marketplace = true);

-- Users can update their own marketplace bounties
CREATE POLICY "Users can update own marketplace bounties"
ON public.commissions FOR UPDATE
USING (auth.uid() = created_by AND is_marketplace = true);

-- Sync poster ratings
CREATE OR REPLACE FUNCTION public.sync_bounty_poster_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_r NUMERIC;
  cnt INTEGER;
  p_id UUID;
BEGIN
  p_id := COALESCE(NEW.poster_id, OLD.poster_id);
  
  SELECT AVG(rating), COUNT(*) INTO avg_r, cnt
  FROM public.bounty_ratings
  WHERE poster_id = p_id;
  
  UPDATE public.commissions
  SET poster_rating_avg = COALESCE(avg_r, 0),
      poster_rating_count = COALESCE(cnt, 0)
  WHERE created_by = p_id AND is_marketplace = true;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_bounty_rating
AFTER INSERT OR UPDATE OR DELETE ON public.bounty_ratings
FOR EACH ROW EXECUTE FUNCTION public.sync_bounty_poster_rating();


-- ── migration: 20260304090845_06e7f858-c45f-49a9-b85e-aaa5a5df4c9f.sql ─────────────────────────────────────────

-- Add paypal_email to profiles so users can save their payout method
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paypal_email TEXT DEFAULT NULL;


-- ── migration: 20260305043911_788a3878-27d7-47dd-8d6b-99f35077583b.sql ─────────────────────────────────────────
ALTER TABLE public.featured_drops
ADD COLUMN IF NOT EXISTS mission_live boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mission_custom_payouts jsonb,
ADD COLUMN IF NOT EXISTS mission_views_milestone integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS mission_views_bonus_cents integer NOT NULL DEFAULT 0;

-- ── migration: 20260305050237_e07b1650-7909-4d48-b0bc-cf9e9f56f92b.sql ─────────────────────────────────────────

ALTER TABLE public.featured_drops 
  ADD COLUMN IF NOT EXISTS instant_payout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inspo_url text,
  ADD COLUMN IF NOT EXISTS inspo_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS theme_description text;


-- ── migration: 20260306033112_bb47968f-b5fa-4f05-a591-dd42fab236e5.sql ─────────────────────────────────────────
ALTER TABLE public.featured_submissions ADD COLUMN IF NOT EXISTS is_editorium_indexed boolean NOT NULL DEFAULT false;

-- ── migration: 20260308071039_77f92a68-3e6a-4135-b68d-f7130cd7c694.sql ─────────────────────────────────────────

-- Standalone table for editorium-indexed edits (any source)
CREATE TABLE public.editorium_indexed_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  thumbnail_url TEXT,
  qoi_score NUMERIC,
  source TEXT NOT NULL DEFAULT 'manual',
  source_label TEXT,
  headline TEXT,
  featured_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  indexed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.editorium_indexed_edits ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read indexed edits"
  ON public.editorium_indexed_edits FOR SELECT
  USING (true);

-- Only admins can insert/update/delete (via service role or has_role check)
CREATE POLICY "Admins can manage indexed edits"
  ON public.editorium_indexed_edits FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin'))
  );


-- ── migration: 20260308102540_ca8d2b43-a5af-46f4-b4c5-013d97809def.sql ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.radio_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  song_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  link TEXT NOT NULL,
  genre TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.radio_pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own pitches"
  ON public.radio_pitches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own pitches"
  ON public.radio_pitches FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pitches"
  ON public.radio_pitches FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pitches"
  ON public.radio_pitches FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ── migration: 20260308124628_b5468fdf-3379-4c05-a931-9202c17393d8.sql ─────────────────────────────────────────

CREATE TABLE public.loopy_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_url TEXT NOT NULL,
  platform TEXT,
  emotion_score INTEGER DEFAULT 0,
  creativity_score INTEGER DEFAULT 0,
  sync_score INTEGER DEFAULT 0,
  identity_score INTEGER DEFAULT 0,
  execution_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  grade TEXT,
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  vibe_check TEXT,
  detailed_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loopy_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ratings" ON public.loopy_ratings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ratings" ON public.loopy_ratings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_loopy_ratings_user ON public.loopy_ratings(user_id, created_at DESC);


-- ── migration: 20260308143820_abc45cc7-66d9-4e49-97b0-1f23fc1ba474.sql ─────────────────────────────────────────

-- Trigger: auto-create notification when someone likes a feed post
CREATE OR REPLACE FUNCTION public.notify_on_feed_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_owner_id UUID;
  liker_username TEXT;
  liker_avatar TEXT;
  post_preview TEXT;
BEGIN
  -- Get post owner
  SELECT user_id, SUBSTRING(content, 1, 50) INTO post_owner_id, post_preview
  FROM public.feed_posts WHERE id = NEW.post_id;
  
  -- Don't notify yourself
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  
  -- Get liker info
  SELECT username, avatar_url INTO liker_username, liker_avatar
  FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    post_owner_id,
    'post_liked',
    '❤️ ' || COALESCE(liker_username, 'Someone') || ' liked your loop',
    COALESCE(post_preview, 'your post'),
    jsonb_build_object('liker_id', NEW.user_id, 'liker_username', liker_username, 'liker_avatar', liker_avatar, 'post_id', NEW.post_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_feed_post_like
  AFTER INSERT ON public.feed_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_feed_post_like();

-- Trigger: auto-create notification when someone comments on a feed post
CREATE OR REPLACE FUNCTION public.notify_on_feed_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_owner_id UUID;
  commenter_username TEXT;
  commenter_avatar TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM public.feed_posts WHERE id = NEW.post_id;
  
  -- Don't notify yourself
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  
  -- Get commenter info
  SELECT username, avatar_url INTO commenter_username, commenter_avatar
  FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    post_owner_id,
    'post_commented',
    '💬 ' || COALESCE(commenter_username, 'Someone') || ' commented on your loop',
    SUBSTRING(NEW.content, 1, 60),
    jsonb_build_object('commenter_id', NEW.user_id, 'commenter_username', commenter_username, 'commenter_avatar', commenter_avatar, 'post_id', NEW.post_id, 'comment_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_feed_comment
  AFTER INSERT ON public.feed_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_feed_comment();

-- Trigger: auto-create notification when someone bookmarks/shares a feed post
CREATE OR REPLACE FUNCTION public.notify_on_feed_post_bookmark()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_owner_id UUID;
  bookmarker_username TEXT;
  bookmarker_avatar TEXT;
BEGIN
  SELECT user_id INTO post_owner_id
  FROM public.feed_posts WHERE id = NEW.post_id;
  
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  
  SELECT username, avatar_url INTO bookmarker_username, bookmarker_avatar
  FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    post_owner_id,
    'post_saved',
    '🔖 ' || COALESCE(bookmarker_username, 'Someone') || ' saved your loop',
    'Your post is getting traction',
    jsonb_build_object('user_id', NEW.user_id, 'username', bookmarker_username, 'avatar', bookmarker_avatar, 'post_id', NEW.post_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_feed_post_bookmark
  AFTER INSERT ON public.feed_post_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_feed_post_bookmark();


-- ── migration: 20260308211207_bf55473c-e80e-456b-8ae5-56ab9b924ea6.sql ─────────────────────────────────────────

-- Add earnings tracking for hosted competitions
ALTER TABLE public.hosted_competitions
ADD COLUMN IF NOT EXISTS host_earnings_cents integer NOT NULL DEFAULT 0;

-- Add a comment for clarity
COMMENT ON COLUMN public.hosted_competitions.host_earnings_cents IS 'Calculated earnings based on views and participants. Formula: (view_count * 0.5 + participant_count * 2) cents';


-- ── migration: 20260308214802_6816c2da-7b81-4831-9edb-04780549d94f.sql ─────────────────────────────────────────

-- Add CPM rate to hosted_competitions for view-based earnings
ALTER TABLE public.hosted_competitions 
  ADD COLUMN IF NOT EXISTS cpm_rate_cents integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS total_payout_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_last_calculated_at timestamptz;

-- Create trigger function to auto-calculate host earnings from views
CREATE OR REPLACE FUNCTION public.calculate_host_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Calculate earnings: (view_count / 1000) * cpm_rate_cents
  NEW.host_earnings_cents := FLOOR(COALESCE(NEW.view_count, 0)::numeric / 1000 * COALESCE(NEW.cpm_rate_cents, 500));
  NEW.earnings_last_calculated_at := now();
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trg_calculate_host_earnings ON public.hosted_competitions;
CREATE TRIGGER trg_calculate_host_earnings
  BEFORE UPDATE OF view_count ON public.hosted_competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_host_earnings();

-- Add lifecycle columns to sanctioned_tournaments if not exists
ALTER TABLE public.sanctioned_tournaments
  ADD COLUMN IF NOT EXISTS submissions_open_at timestamptz,
  ADD COLUMN IF NOT EXISTS submissions_close_at timestamptz,
  ADD COLUMN IF NOT EXISTS judging_open_at timestamptz,
  ADD COLUMN IF NOT EXISTS judging_close_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;


-- ── migration: 20260308221216_29a13198-dcba-4487-8ae3-6f8f78c1e26f.sql ─────────────────────────────────────────

-- Link page settings (customization per user)
CREATE TABLE public.editor_link_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  page_title TEXT,
  bio TEXT,
  bg_type TEXT NOT NULL DEFAULT 'solid',
  bg_color TEXT DEFAULT '#0a0a0a',
  bg_gradient_from TEXT,
  bg_gradient_to TEXT,
  bg_image_url TEXT,
  accent_color TEXT DEFAULT '#d4af37',
  text_color TEXT DEFAULT '#ffffff',
  card_style TEXT DEFAULT 'default',
  show_avatar BOOLEAN DEFAULT true,
  show_stats BOOLEAN DEFAULT true,
  show_socials BOOLEAN DEFAULT true,
  custom_avatar_url TEXT,
  custom_css TEXT,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual links on the page
CREATE TABLE public.editor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  thumbnail_url TEXT,
  link_type TEXT DEFAULT 'link',
  embed_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.editor_link_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editor_links ENABLE ROW LEVEL SECURITY;

-- Link pages: owner can CRUD, anyone can read published pages
CREATE POLICY "Users can manage own link page" ON public.editor_link_pages
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view published link pages" ON public.editor_link_pages
  FOR SELECT TO anon, authenticated USING (is_published = true);

-- Links: owner can CRUD, anyone can read active links for published pages
CREATE POLICY "Users can manage own links" ON public.editor_links
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view active links" ON public.editor_links
  FOR SELECT TO anon, authenticated USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.editor_link_pages WHERE user_id = editor_links.user_id AND is_published = true
    )
  );

-- Index for fast lookups
CREATE INDEX idx_editor_links_user_order ON public.editor_links(user_id, sort_order);
CREATE INDEX idx_editor_link_pages_user ON public.editor_link_pages(user_id);


-- ── migration: 20260308223218_25c6589d-80f6-45db-996f-28f7358e8691.sql ─────────────────────────────────────────

-- Table to track which edits a user has hidden from public view
-- The edit stays in the system but won't show on their public profile
CREATE TABLE public.hidden_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'standard', 'round', 'sanctioned', 'featured', 'battle'
  source_id UUID NOT NULL, -- ID in the source table
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, source, source_id)
);

ALTER TABLE public.hidden_edits ENABLE ROW LEVEL SECURITY;

-- Users can see their own hidden edits
CREATE POLICY "Users can view own hidden edits"
  ON public.hidden_edits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can hide their own edits
CREATE POLICY "Users can hide own edits"
  ON public.hidden_edits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can unhide their own edits
CREATE POLICY "Users can unhide own edits"
  ON public.hidden_edits FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ── migration: 20260316035123_44b215ee-bb1e-4f7e-b5f6-47bf6c41c911.sql ─────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_earnings boolean NOT NULL DEFAULT false;

-- ── migration: 20260401220300_024c23ba-4b8d-434f-8d2b-20085d426543.sql ─────────────────────────────────────────
ALTER TABLE public.artist_campaigns 
ADD COLUMN IF NOT EXISTS campaign_type text NOT NULL DEFAULT 'artist',
ADD COLUMN IF NOT EXISTS logo_url text;


-- ── migration: 20260402071449_526db507-de41-4d66-80ca-6adb98dfcdd0.sql ─────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-logos', 'campaign-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view campaign logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-logos');

CREATE POLICY "Authenticated users can upload campaign logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-logos');


-- ── migration: 20260402114049_f36b72c1-e6de-421e-8db3-f918b7ddbf43.sql ─────────────────────────────────────────
ALTER TABLE public.featured_drops ADD COLUMN submission_goal integer NOT NULL DEFAULT 0;

-- ── migration: 20260402123322_03246c7b-50ab-4c21-8acc-d17cfa1e910a.sql ─────────────────────────────────────────
ALTER TABLE public.featured_drops ADD COLUMN drop_type text NOT NULL DEFAULT 'artist';

-- ── migration: 20260402223026_e78e6efb-37cf-46cc-8ad8-48153cc3ceaf.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  chosen_username TEXT;
  fallback_username TEXT;
BEGIN
  -- Use the username from signup metadata if provided
  chosen_username := TRIM(NEW.raw_user_meta_data ->> 'username');
  
  -- If no username in metadata, generate a fallback
  IF chosen_username IS NULL OR chosen_username = '' THEN
    fallback_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = fallback_username) LOOP
      fallback_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
    END LOOP;
    chosen_username := fallback_username;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    username,
    display_name,
    created_at,
    updated_at,
    xp,
    level,
    league,
    onboarding_completed,
    username_changed_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    chosen_username,
    chosen_username,
    NOW(),
    NOW(),
    0,
    1,
    'open',
    false,
    NULL
  );
  
  RETURN NEW;
END;
$function$;

-- ── migration: 20260403221843_38c932cb-cf4b-4170-9293-f2c68ac118bf.sql ─────────────────────────────────────────

-- Add reply columns to featured_drop_messages
ALTER TABLE public.featured_drop_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.featured_drop_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_username text,
  ADD COLUMN IF NOT EXISTS reply_to_text text;

-- Add reply columns to battle_messages
ALTER TABLE public.battle_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.battle_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_username text,
  ADD COLUMN IF NOT EXISTS reply_to_text text;

-- Add reply columns to arena_messages
ALTER TABLE public.arena_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.arena_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_username text,
  ADD COLUMN IF NOT EXISTS reply_to_text text;

-- Function to extract @mentions from message text and create notifications
CREATE OR REPLACE FUNCTION public.notify_chat_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mention text;
  mentioned_user_id uuid;
  chat_context text;
  notif_data jsonb;
BEGIN
  -- Extract @mentions from message_text
  FOR mention IN
    SELECT (regexp_matches(NEW.message_text, '@(\w+)', 'g'))[1]
  LOOP
    -- Look up user by username
    SELECT id INTO mentioned_user_id
    FROM public.profiles
    WHERE lower(username) = lower(mention)
    LIMIT 1;

    -- Don't notify yourself
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      -- Determine context
      chat_context := TG_TABLE_NAME;
      notif_data := jsonb_build_object(
        'chat_type', chat_context,
        'message_id', NEW.id,
        'sender_username', NEW.username
      );

      -- Add context-specific data
      IF TG_TABLE_NAME = 'featured_drop_messages' THEN
        notif_data := notif_data || jsonb_build_object('drop_id', NEW.drop_id);
      ELSIF TG_TABLE_NAME = 'battle_messages' THEN
        notif_data := notif_data || jsonb_build_object('battle_id', NEW.battle_id);
      ELSIF TG_TABLE_NAME = 'arena_messages' THEN
        notif_data := notif_data || jsonb_build_object('arena_id', NEW.arena_id);
      END IF;

      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        mentioned_user_id,
        'chat_mention',
        '💬 ' || NEW.username || ' mentioned you',
        substring(NEW.message_text from 1 for 100),
        notif_data
      );
    END IF;
  END LOOP;

  -- Also notify on replies
  IF NEW.reply_to_username IS NOT NULL THEN
    SELECT id INTO mentioned_user_id
    FROM public.profiles
    WHERE lower(username) = lower(NEW.reply_to_username)
    LIMIT 1;

    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      chat_context := TG_TABLE_NAME;
      notif_data := jsonb_build_object(
        'chat_type', chat_context,
        'message_id', NEW.id,
        'sender_username', NEW.username
      );

      IF TG_TABLE_NAME = 'featured_drop_messages' THEN
        notif_data := notif_data || jsonb_build_object('drop_id', NEW.drop_id);
      ELSIF TG_TABLE_NAME = 'battle_messages' THEN
        notif_data := notif_data || jsonb_build_object('battle_id', NEW.battle_id);
      ELSIF TG_TABLE_NAME = 'arena_messages' THEN
        notif_data := notif_data || jsonb_build_object('arena_id', NEW.arena_id);
      END IF;

      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        mentioned_user_id,
        'chat_reply',
        '↩️ ' || NEW.username || ' replied to you',
        substring(NEW.message_text from 1 for 100),
        notif_data
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach triggers to all chat tables
CREATE TRIGGER notify_mentions_drop_chat
  AFTER INSERT ON public.featured_drop_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_mentions();

CREATE TRIGGER notify_mentions_battle_chat
  AFTER INSERT ON public.battle_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_mentions();

CREATE TRIGGER notify_mentions_arena_chat
  AFTER INSERT ON public.arena_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_mentions();


-- ── migration: 20260404034331_60043018-5946-4eb7-b849-16bd53874660.sql ─────────────────────────────────────────

CREATE TABLE public.qoi_hidden_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  source_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, source, source_id)
);

ALTER TABLE public.qoi_hidden_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read qoi hidden status"
  ON public.qoi_hidden_edits FOR SELECT USING (true);

CREATE POLICY "Users can manage their own qoi visibility"
  ON public.qoi_hidden_edits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own qoi visibility"
  ON public.qoi_hidden_edits FOR DELETE USING (auth.uid() = user_id);


-- ── migration: 20260404054200_e2b11078-4801-4534-97fa-dbcb211527fe.sql ─────────────────────────────────────────

CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  category TEXT NOT NULL DEFAULT 'bug',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  replied_by TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all tickets"
ON public.support_tickets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);


-- ── migration: 20260404062415_af3c58d3-c40c-4013-89e0-428abc70c3df.sql ─────────────────────────────────────────

-- Add new columns for the competition system
ALTER TABLE public.hosted_competitions
  ADD COLUMN IF NOT EXISTS song_name text,
  ADD COLUMN IF NOT EXISTS song_preview_url text,
  ADD COLUMN IF NOT EXISTS league_suggestion text DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS scoring_mode text DEFAULT 'judged',
  ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS index_reward_pool integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Add submission_url and platform to participants so they can submit edits
ALTER TABLE public.hosted_competition_participants
  ADD COLUMN IF NOT EXISTS submission_url text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS qoi_score numeric,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'joined',
  ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Function to calculate index reward based on participant count
CREATE OR REPLACE FUNCTION public.calculate_comp_index_reward(participant_count integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN participant_count >= 100 THEN 500
    WHEN participant_count >= 75 THEN 350
    WHEN participant_count >= 50 THEN 200
    WHEN participant_count >= 25 THEN 100
    WHEN participant_count >= 10 THEN 50
    WHEN participant_count >= 5 THEN 25
    WHEN participant_count >= 2 THEN 10
    ELSE 0
  END
$$;

-- Trigger to auto-update index_reward_pool when participant count changes
CREATE OR REPLACE FUNCTION public.update_comp_reward_pool()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.hosted_competitions
  SET index_reward_pool = public.calculate_comp_index_reward(
    (SELECT COUNT(*)::integer FROM public.hosted_competition_participants WHERE competition_id = COALESCE(NEW.competition_id, OLD.competition_id))
  )
  WHERE id = COALESCE(NEW.competition_id, OLD.competition_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_comp_reward_on_join ON public.hosted_competition_participants;
CREATE TRIGGER update_comp_reward_on_join
  AFTER INSERT OR DELETE ON public.hosted_competition_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comp_reward_pool();


-- ── migration: 20260404063755_f6dbbc69-6f03-4e91-b064-7fe4db19bd05.sql ─────────────────────────────────────────

-- Make song_name truly optional (it already allows null, just ensuring)
ALTER TABLE public.hosted_competitions 
  ADD COLUMN IF NOT EXISTS cash_prize_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'index',
  ADD COLUMN IF NOT EXISTS prize_distribution jsonb DEFAULT null;

-- prize_distribution example: [{"rank":1,"index":300,"cash_cents":5000},{"rank":2,"index":150},{"rank":3,"index":50}]


-- ── migration: 20260404070138_05455903-ecf8-424f-a671-bbd5bf973b9f.sql ─────────────────────────────────────────

-- Ensure loop-media bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('loop-media', 'loop-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Authenticated users can upload to loop-media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view loop-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own loop-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own loop-media" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to loop-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'loop-media');

-- Allow public read access
CREATE POLICY "Anyone can view loop-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'loop-media');

-- Allow users to update their own files
CREATE POLICY "Users can update their own loop-media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'loop-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own loop-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'loop-media' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── migration: 20260404183720_1d9b9d78-a109-411e-a09d-77196480d72f.sql ─────────────────────────────────────────

-- New competitions table (open lobby model)
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  creator_id UUID NOT NULL,
  creator_username TEXT NOT NULL,
  creator_avatar_url TEXT,
  league TEXT NOT NULL DEFAULT 'open',
  scoring_mode TEXT NOT NULL DEFAULT 'judged',
  max_players INTEGER NOT NULL DEFAULT 100,
  current_players INTEGER NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'lobby',
  started_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  index_reward_pool INTEGER NOT NULL DEFAULT 0,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competitions"
  ON public.competitions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create competitions"
  ON public.competitions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own competitions"
  ON public.competitions FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

-- Auto-generate slug
CREATE OR REPLACE FUNCTION public.generate_competition_slug()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.name = NEW.name) THEN
    RETURN NEW;
  END IF;
  base_slug := lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 50);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.competitions WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_competition_slug
  BEFORE INSERT OR UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.generate_competition_slug();

-- Auto-update updated_at
CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Participants table
CREATE TABLE public.competition_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants"
  ON public.competition_participants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join"
  ON public.competition_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave"
  ON public.competition_participants FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Sync participant count
CREATE OR REPLACE FUNCTION public.sync_competition_player_count()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  comp_id UUID;
  new_count INTEGER;
BEGIN
  comp_id := COALESCE(NEW.competition_id, OLD.competition_id);
  SELECT COUNT(*) INTO new_count FROM public.competition_participants WHERE competition_id = comp_id;
  UPDATE public.competitions SET current_players = new_count WHERE id = comp_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_competition_players
  AFTER INSERT OR DELETE ON public.competition_participants
  FOR EACH ROW EXECUTE FUNCTION public.sync_competition_player_count();

-- Auto-calculate index reward pool based on player count
CREATE OR REPLACE FUNCTION public.update_competition_reward_pool()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.competitions
  SET index_reward_pool = CASE
    WHEN current_players >= 100 THEN 500
    WHEN current_players >= 75 THEN 350
    WHEN current_players >= 50 THEN 200
    WHEN current_players >= 25 THEN 100
    WHEN current_players >= 10 THEN 50
    WHEN current_players >= 5 THEN 25
    WHEN current_players >= 2 THEN 10
    ELSE 0
  END
  WHERE id = COALESCE(NEW.competition_id, OLD.competition_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_competition_rewards
  AFTER INSERT OR DELETE ON public.competition_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_competition_reward_pool();

-- Submissions table
CREATE TABLE public.competition_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  submission_url TEXT NOT NULL,
  platform TEXT DEFAULT 'tiktok',
  score INTEGER,
  judge_notes TEXT,
  is_winner BOOLEAN DEFAULT false,
  winner_place INTEGER,
  scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

ALTER TABLE public.competition_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view submissions"
  ON public.competition_submissions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit"
  ON public.competition_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
  ON public.competition_submissions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_participants;


-- ── migration: 20260404184857_2016f743-28d9-4170-8782-6a2358e609f5.sql ─────────────────────────────────────────

-- Migrate the live competition
INSERT INTO public.competitions (id, name, description, theme, creator_id, creator_username, creator_avatar_url, league, scoring_mode, max_players, current_players, cover_image_url, status, started_at, deadline, index_reward_pool, slug, created_at, updated_at)
VALUES (
  'ca794d22-aa79-4dd0-a074-64acb9cb543c',
  'Best football edit',
  NULL,
  'Make your best football edit',
  'a432262c-5781-49a8-b4e1-5600549426a2',
  'Gladiator',
  NULL,
  'open',
  'judged',
  100,
  1,
  'https://tmfnqnmyxxydrxwjkaiq.supabase.co/storage/v1/object/public/loop-media/competitions/a432262c-5781-49a8-b4e1-5600549426a2/1775327113177.jpeg',
  'live',
  '2026-04-04 18:25:20.229243+00',
  '2026-04-05 06:25:19.766+00',
  0,
  'best-football-edit',
  '2026-04-04 18:25:20.229243+00',
  '2026-04-04 18:25:20.229243+00'
)
ON CONFLICT (id) DO NOTHING;

-- Migrate participant
INSERT INTO public.competition_participants (competition_id, user_id, username, avatar_url, joined_at)
VALUES (
  'ca794d22-aa79-4dd0-a074-64acb9cb543c',
  'a432262c-5781-49a8-b4e1-5600549426a2',
  'Gladiator',
  NULL,
  '2026-04-04 18:25:20.580226+00'
)
ON CONFLICT DO NOTHING;


-- ── migration: 20260404205444_3f084a7d-1de6-4773-8a06-4285341db14c.sql ─────────────────────────────────────────

CREATE TABLE public.competition_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.competition_messages(id),
  reply_to_username TEXT,
  reply_to_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_competition_messages_comp ON public.competition_messages(competition_id, created_at);

ALTER TABLE public.competition_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competition messages"
  ON public.competition_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post messages"
  ON public.competition_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_messages;


-- ── migration: 20260406031237_489aff73-e80d-477a-b5c3-f9704e56c929.sql ─────────────────────────────────────────
-- Add mission_type to commissions for artist/brand/film categorization
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS mission_type text NOT NULL DEFAULT 'standard';

-- Add client_name for brand/film missions
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS client_name text;

-- Add reference video URL
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS reference_video_url text;

-- ── migration: 20260406034857_e67a00c4-a56f-4f29-96d4-42ea0f106b8e.sql ─────────────────────────────────────────

CREATE TABLE public.commission_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_id UUID NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  reply_to_id UUID REFERENCES public.commission_messages(id) ON DELETE SET NULL,
  reply_to_username TEXT,
  reply_to_text TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_commission_messages_commission_id ON public.commission_messages(commission_id);
CREATE INDEX idx_commission_messages_created_at ON public.commission_messages(created_at);

ALTER TABLE public.commission_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read commission messages"
  ON public.commission_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can post commission messages"
  ON public.commission_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commission messages"
  ON public.commission_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.commission_messages;


-- ── migration: 20260406084501_d1f2a25f-8989-40ce-bcb0-d4b7275be929.sql ─────────────────────────────────────────

CREATE TABLE public.mission_lobby_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (drop_id, user_id)
);

ALTER TABLE public.mission_lobby_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lobby presence"
  ON public.mission_lobby_presence FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upsert their own presence"
  ON public.mission_lobby_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence"
  ON public.mission_lobby_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_mission_lobby_drop ON public.mission_lobby_presence(drop_id, last_seen_at DESC);


-- ── migration: 20260406091310_29e15ac4-5f5d-4cd1-b180-9e43d85dfca7.sql ─────────────────────────────────────────
ALTER TABLE public.featured_drops ADD COLUMN scenepack_url text DEFAULT NULL;

-- ── migration: 20260406091359_0c3b15f0-c204-4a94-b12d-d69f69987eec.sql ─────────────────────────────────────────
ALTER TABLE public.commissions ADD COLUMN scenepack_url text DEFAULT NULL;

-- ── migration: 20260406092333_2ec72b15-f8c0-4c1d-9d1d-d85a5a1df88f.sql ─────────────────────────────────────────

-- Add commission_id column to mission_lobby_presence for commission-based missions
ALTER TABLE public.mission_lobby_presence ADD COLUMN IF NOT EXISTS commission_id uuid;

-- Allow either drop_id or commission_id to be set
CREATE INDEX IF NOT EXISTS idx_lobby_presence_commission ON public.mission_lobby_presence (commission_id) WHERE commission_id IS NOT NULL;

-- Make drop_id nullable since commissions use commission_id
ALTER TABLE public.mission_lobby_presence ALTER COLUMN drop_id DROP NOT NULL;


-- ── migration: 20260406092656_ce38bc20-d3f4-4fc9-b886-c5a5a398bee9.sql ─────────────────────────────────────────

-- Add unique constraint for commission-based presence upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_lobby_presence_user_commission 
ON public.mission_lobby_presence (user_id, commission_id) 
WHERE commission_id IS NOT NULL;


-- ── migration: 20260406161717_20e10bab-0c45-4f4c-9325-25face1ef4bd.sql ─────────────────────────────────────────
DROP POLICY "Anyone authenticated can read commission messages" ON public.commission_messages;

CREATE POLICY "Anyone can read commission messages"
ON public.commission_messages
FOR SELECT
TO anon, authenticated
USING (true);

-- ── migration: 20260406213607_1d66f8f2-6f21-4ccc-a368-b41af0e76008.sql ─────────────────────────────────────────
-- Drop the partial unique index that doesn't work for upserts
DROP INDEX IF EXISTS idx_lobby_presence_user_commission;

-- Add a proper unique constraint
ALTER TABLE public.mission_lobby_presence
ADD CONSTRAINT mission_lobby_presence_user_commission_key UNIQUE (user_id, commission_id);

-- ── migration: 20260407015812_fd675708-1abc-4c63-8687-073305851649.sql ─────────────────────────────────────────

-- Add thumbnail_url to commission_submissions
ALTER TABLE public.commission_submissions
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Create storage bucket for submission thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('submission-thumbnails', 'submission-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Submission thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'submission-thumbnails');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload submission thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submission-thumbnails' AND auth.role() = 'authenticated');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update submission thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'submission-thumbnails' AND auth.role() = 'authenticated');


-- ── migration: 20260407035755_b8a42ca3-12a6-4da6-a924-b26570440e1d.sql ─────────────────────────────────────────
ALTER TABLE public.feed_comments DROP CONSTRAINT feed_comments_submission_type_check;
ALTER TABLE public.feed_comments ADD CONSTRAINT feed_comments_submission_type_check CHECK (submission_type = ANY (ARRAY['arena'::text, 'review'::text, 'battle'::text, 'judge_video'::text, 'quick_fight'::text, 'solo'::text, 'feed_post'::text]));

-- ── migration: 20260407093040_3fa6793d-fa7f-4db7-b143-5f1b2e0f3f4f.sql ─────────────────────────────────────────

-- Cash battle applications table
CREATE TABLE public.cash_battle_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  tiktok_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  demo_reel_url TEXT NOT NULL,
  pitch TEXT,
  agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  matched_battle_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_battle_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON public.cash_battle_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON public.cash_battle_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own applications"
  ON public.cash_battle_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND agreed_to_terms = true);

CREATE POLICY "Admins can update applications"
  ON public.cash_battle_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cash_battle_applications_updated_at
  BEFORE UPDATE ON public.cash_battle_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cash battles table (admin-curated matches)
CREATE TABLE public.cash_battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  challenger_username TEXT NOT NULL,
  challenger_avatar_url TEXT,
  opponent_id UUID,
  opponent_username TEXT,
  opponent_avatar_url TEXT,
  prize_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming',
  duration_hours INTEGER NOT NULL DEFAULT 24,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  winner_id UUID,
  created_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cash battles"
  ON public.cash_battles FOR SELECT
  USING (true);

CREATE POLICY "Admins can create cash battles"
  ON public.cash_battles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cash battles"
  ON public.cash_battles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cash_battles_updated_at
  BEFORE UPDATE ON public.cash_battles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── migration: 20260407105701_9c27bd2a-a473-4d4e-b689-d3561137dcd6.sql ─────────────────────────────────────────

ALTER TABLE public.cash_battles
  ADD COLUMN sponsor_name text,
  ADD COLUMN sponsor_logo_url text,
  ADD COLUMN sponsor_campaign_id uuid REFERENCES public.artist_campaigns(id),
  ADD COLUMN challenger_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN opponent_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN challenger_accepted_at timestamptz,
  ADD COLUMN opponent_accepted_at timestamptz;


-- ── migration: 20260407111050_a3e9e732-eca6-420f-bf45-19aa33464db8.sql ─────────────────────────────────────────
ALTER TABLE public.cash_battles
  ADD COLUMN IF NOT EXISTS challenger_submission_url TEXT,
  ADD COLUMN IF NOT EXISTS challenger_submission_platform TEXT,
  ADD COLUMN IF NOT EXISTS challenger_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opponent_submission_url TEXT,
  ADD COLUMN IF NOT EXISTS opponent_submission_platform TEXT,
  ADD COLUMN IF NOT EXISTS opponent_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scenepack_url TEXT;

-- ── migration: 20260407112155_ac3a8eb2-9ae3-4d02-b186-84fb8e3a417d.sql ─────────────────────────────────────────

-- Cash battle messages for live chat
CREATE TABLE public.cash_battle_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.cash_battles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.cash_battle_messages(id),
  reply_to_username TEXT,
  reply_to_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_battle_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cash battle messages"
ON public.cash_battle_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post cash battle messages"
ON public.cash_battle_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_battle_messages;

-- Add thumbnail columns to cash_battles
ALTER TABLE public.cash_battles
ADD COLUMN IF NOT EXISTS challenger_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS opponent_thumbnail_url TEXT;


-- ── migration: 20260407112436_7672a2ff-e75e-422b-8e5d-ceb2162e5e41.sql ─────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES ('battle-thumbnails', 'battle-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view battle thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'battle-thumbnails');

CREATE POLICY "Authenticated users can upload battle thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'battle-thumbnails');

CREATE POLICY "Users can update their own battle thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'battle-thumbnails');


-- ── migration: 20260407114643_b02190db-2c53-41b4-ac4e-7a2c7ef27563.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_feed_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_owner_id UUID;
  commenter_username TEXT;
  commenter_avatar TEXT;
BEGIN
  -- Only notify for comments on feed posts
  IF NEW.submission_type IS DISTINCT FROM 'feed_post' THEN
    RETURN NEW;
  END IF;

  -- Get feed post owner using submission_id
  SELECT user_id INTO post_owner_id
  FROM public.feed_posts
  WHERE id::text = NEW.submission_id;

  -- Skip if post not found or user is commenting on their own post
  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get commenter info
  SELECT username, avatar_url INTO commenter_username, commenter_avatar
  FROM public.profiles
  WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    post_owner_id,
    'post_commented',
    '💬 ' || COALESCE(commenter_username, 'Someone') || ' commented on your loop',
    SUBSTRING(NEW.content, 1, 60),
    jsonb_build_object(
      'commenter_id', NEW.user_id,
      'commenter_username', commenter_username,
      'commenter_avatar', commenter_avatar,
      'post_id', NEW.submission_id,
      'comment_id', NEW.id
    )
  );

  RETURN NEW;
END;
$function$;

-- ── migration: 20260408081445_20911575-9b57-40ba-b966-1e810911202e.sql ─────────────────────────────────────────
ALTER TABLE public.cash_battles 
ADD COLUMN viral_bonus_cents integer NOT NULL DEFAULT 5000,
ADD COLUMN viral_bonus_threshold_views integer NOT NULL DEFAULT 100000,
ADD COLUMN viral_bonus_awarded boolean NOT NULL DEFAULT false;

-- ── migration: 20260408082308_aa45844e-6921-4a11-a5e0-25168b13bf66.sql ─────────────────────────────────────────
ALTER TABLE public.commission_submissions DROP CONSTRAINT commission_submissions_unique_user;

-- ── migration: 20260408122813_d3160db8-1dac-46ba-b07d-0ef0a56d495c.sql ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own applications" ON public.cash_battle_applications;

CREATE POLICY "Users can view own or open cash battle applications"
ON public.cash_battle_applications
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR status = 'pending'
);

DROP POLICY IF EXISTS "Admins can view all applications" ON public.cash_battle_applications;

CREATE POLICY "Admins can view all applications"
ON public.cash_battle_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create own applications" ON public.cash_battle_applications;

CREATE POLICY "Users can create own applications"
ON public.cash_battle_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND agreed_to_terms = true);

DROP POLICY IF EXISTS "Admins can update applications" ON public.cash_battle_applications;

CREATE POLICY "Admins can update applications"
ON public.cash_battle_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own cash battle application"
ON public.cash_battle_applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ── migration: 20260408123905_31cf5b12-4570-44e8-a80b-0a3a172fed40.sql ─────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can view pending cash battle applications" ON public.cash_battle_applications;

CREATE POLICY "Anyone can view pending cash battle applications"
ON public.cash_battle_applications
FOR SELECT
TO anon
USING (status = 'pending');


-- ── migration: 20260408124822_03b89299-2682-4b0a-b7d9-10e79711c13c.sql ─────────────────────────────────────────
ALTER TABLE public.cash_battles ADD COLUMN IF NOT EXISTS cover_image_url text;

-- ── migration: 20260408131250_c2b88347-d89a-40d5-b2c1-c1a43fe99665.sql ─────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_battle_applications;

-- ── migration: 20260408131339_81e2ff31-c4b4-4380-b351-396136082dc5.sql ─────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_battles;

-- ── migration: 20260408132223_a40ac349-fcb1-42c8-a6ed-448fedb68d04.sql ─────────────────────────────────────────

CREATE TABLE public.cash_battle_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.cash_battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team TEXT NOT NULL CHECK (team IN ('challenger', 'opponent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (battle_id, user_id)
);

ALTER TABLE public.cash_battle_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.cash_battle_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.cash_battle_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON public.cash_battle_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON public.cash_battle_votes FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_battle_votes;


-- ── migration: 20260408133419_70a2a6d2-f336-41b4-89e8-36d0232fb9e9.sql ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_matchmake_cash_battle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_app RECORD;
  new_battle_id uuid;
  now_ts timestamptz := now();
BEGIN
  -- Only act on pending applications
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Find the oldest other pending application (not this user)
  SELECT * INTO other_app
  FROM cash_battle_applications
  WHERE status = 'pending'
    AND user_id != NEW.user_id
    AND id != NEW.id
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If no match found, leave this one pending
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Create a live battle instantly
  INSERT INTO cash_battles (
    challenger_id, challenger_username, challenger_avatar_url,
    opponent_id, opponent_username, opponent_avatar_url,
    duration_hours, status, starts_at, ends_at,
    challenger_accepted, opponent_accepted,
    challenger_accepted_at, opponent_accepted_at
  ) VALUES (
    other_app.user_id, other_app.username, other_app.avatar_url,
    NEW.user_id, NEW.username, NEW.avatar_url,
    24, 'live', now_ts, now_ts + interval '24 hours',
    true, true, now_ts, now_ts
  )
  RETURNING id INTO new_battle_id;

  -- Mark both applications as matched
  UPDATE cash_battle_applications
  SET status = 'matched', matched_battle_id = new_battle_id
  WHERE id = other_app.id;

  -- Mark the current (NEW) application as matched too
  NEW.status := 'matched';
  NEW.matched_battle_id := new_battle_id;

  RETURN NEW;
END;
$$;

-- Drop if exists to avoid duplicates
DROP TRIGGER IF EXISTS trg_auto_matchmake_cash_battle ON cash_battle_applications;

CREATE TRIGGER trg_auto_matchmake_cash_battle
  BEFORE INSERT OR UPDATE ON cash_battle_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_matchmake_cash_battle();


-- ── migration: 20260409014318_cb7ab84a-ccee-42d1-978c-aacefc2167cf.sql ─────────────────────────────────────────

ALTER TABLE public.cash_battles
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url text,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url text;

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url text,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url text;


-- ── migration: 20260410065227_eab058be-8a9f-49e3-a830-2e98df22505a.sql ─────────────────────────────────────────
-- Add reply fields to direct_messages
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.direct_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reply_to_text TEXT,
ADD COLUMN IF NOT EXISTS reply_to_sender_id UUID;

-- Create typing status table
CREATE TABLE public.dm_typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.dm_typing_status ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see typing status for their conversations
CREATE POLICY "Users can view typing in their conversations"
ON public.dm_typing_status
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- Users can manage their own typing status
CREATE POLICY "Users can insert their own typing status"
ON public.dm_typing_status
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status"
ON public.dm_typing_status
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status"
ON public.dm_typing_status
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for typing status
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_typing_status;

-- ── migration: 20260415193655_803642f4-23fc-43b2-8b52-c5185e052d10.sql ─────────────────────────────────────────

CREATE POLICY "Fighters can update their own cash battle"
  ON public.cash_battles FOR UPDATE
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);


-- ── migration: 20260421201558_0011dfa9-77c0-4a33-b03f-ef0bb0a5914e.sql ─────────────────────────────────────────
-- Add inspo edit video and upvote fields to competitions
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS inspo_video_url TEXT,
  ADD COLUMN IF NOT EXISTS inspo_video_platform TEXT,
  ADD COLUMN IF NOT EXISTS inspo_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS upvote_count INTEGER NOT NULL DEFAULT 0;

-- Upvotes table
CREATE TABLE IF NOT EXISTS public.competition_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, user_id)
);

ALTER TABLE public.competition_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes"
  ON public.competition_upvotes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upvote"
  ON public.competition_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own upvote"
  ON public.competition_upvotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sync trigger for upvote_count
CREATE OR REPLACE FUNCTION public.sync_competition_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comp_id UUID;
BEGIN
  comp_id := COALESCE(NEW.competition_id, OLD.competition_id);
  UPDATE public.competitions
  SET upvote_count = (SELECT COUNT(*) FROM public.competition_upvotes WHERE competition_id = comp_id)
  WHERE id = comp_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_competition_upvote_count ON public.competition_upvotes;
CREATE TRIGGER trg_sync_competition_upvote_count
AFTER INSERT OR DELETE ON public.competition_upvotes
FOR EACH ROW EXECUTE FUNCTION public.sync_competition_upvote_count();

-- ── migration: 20260421235539_a0f1e047-e598-42f8-8302-2ad2d705ce80.sql ─────────────────────────────────────────
DROP POLICY IF EXISTS "Participants can update their battle" ON public.battles;

CREATE POLICY "Participants or open-challenge claimers can update battle"
ON public.battles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = challenger_id
  OR auth.uid() = opponent_id
  OR (status = 'pending' AND opponent_id IS NULL AND auth.uid() <> challenger_id)
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
)
WITH CHECK (
  auth.uid() = challenger_id
  OR auth.uid() = opponent_id
  OR (status = 'active' AND auth.uid() <> challenger_id)
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
);

-- ── migration: 20260422123034_e0b7c0b2-e737-480f-8996-abddcb514339.sql ─────────────────────────────────────────
-- 1. Prune all currently expired queue entries (cleans up the 6 stale ghosts)
DELETE FROM public.quick_fight_queue WHERE expires_at < now();

-- 2. Update the matchmaker to auto-prune expired entries every time it runs
CREATE OR REPLACE FUNCTION public.quick_fight_match(p_user_id uuid, p_username text, p_avatar_url text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  matched RECORD;
  new_fight_id UUID;
  starts TIMESTAMPTZ := now();
BEGIN
  -- Auto-prune expired entries on every match attempt
  DELETE FROM public.quick_fight_queue WHERE expires_at < now();

  -- Look for someone in queue (not self, not expired)
  SELECT * INTO matched
  FROM public.quick_fight_queue
  WHERE user_id != p_user_id
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF matched IS NULL THEN
    INSERT INTO public.quick_fight_queue (user_id, username, avatar_url)
    VALUES (p_user_id, p_username, p_avatar_url)
    ON CONFLICT (user_id) DO UPDATE
    SET username = p_username, avatar_url = p_avatar_url, queued_at = now(), expires_at = now() + INTERVAL '5 minutes';
    RETURN NULL;
  END IF;

  INSERT INTO public.quick_fights (
    player_1_id, player_1_username, player_1_avatar_url,
    player_2_id, player_2_username, player_2_avatar_url,
    status, matched_at, starts_at, ends_at, duration_minutes
  ) VALUES (
    matched.user_id, matched.username, matched.avatar_url,
    p_user_id, p_username, p_avatar_url,
    'active', starts, starts, starts + INTERVAL '3 hours', 180
  )
  RETURNING id INTO new_fight_id;

  DELETE FROM public.quick_fight_queue WHERE user_id IN (p_user_id, matched.user_id);

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (new_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have 3 hours to submit your edit.', true);

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (matched.user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || p_username || '!', jsonb_build_object('fight_id', new_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || matched.username || '!', jsonb_build_object('fight_id', new_fight_id));

  RETURN new_fight_id;
END;
$function$;

-- 3. Bump the queue lifetime from 5 min to 30 min so users have a real chance to match
ALTER TABLE public.quick_fight_queue
  ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '30 minutes');

-- ── migration: 20260422192922_d106a585-c93b-4adf-8101-843c775bbcd9.sql ─────────────────────────────────────────

-- Campaign portal chat: real conversations between campaign clients and Loopgate admins
CREATE TABLE public.campaign_portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.artist_campaigns(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
  sender_name TEXT,
  message_text TEXT NOT NULL,
  read_by_admin BOOLEAN NOT NULL DEFAULT false,
  read_by_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_portal_messages_campaign ON public.campaign_portal_messages(campaign_id, created_at DESC);

ALTER TABLE public.campaign_portal_messages ENABLE ROW LEVEL SECURITY;

-- Public can read & insert messages for any campaign (portal is public via slug; client identity is contextual).
-- Admins manage everything via has_role.
CREATE POLICY "Anyone can read campaign portal messages"
ON public.campaign_portal_messages FOR SELECT
USING (true);

CREATE POLICY "Anyone can post a client message"
ON public.campaign_portal_messages FOR INSERT
WITH CHECK (sender_type = 'client');

CREATE POLICY "Admins can post admin messages"
ON public.campaign_portal_messages FOR INSERT
TO authenticated
WITH CHECK (sender_type = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update messages"
ON public.campaign_portal_messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete messages"
ON public.campaign_portal_messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_portal_messages;
ALTER TABLE public.campaign_portal_messages REPLICA IDENTITY FULL;


-- ── migration: 20260422194030_f58c60c8-06ed-4a07-89d0-98b0b624bed6.sql ─────────────────────────────────────────
CREATE POLICY "Anyone can delete client messages"
ON public.campaign_portal_messages FOR DELETE
USING (sender_type = 'client');

-- ── migration: 20260422202250_3960e99c-d386-4540-bbad-23fc2588419f.sql ─────────────────────────────────────────
-- Create RPC for users to delete their own account
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove role rows (FK-safe)
  DELETE FROM public.user_roles WHERE user_id = uid;

  -- Delete profile (most tables FK-cascade off auth.users or are nullable)
  DELETE FROM public.profiles WHERE id = uid;

  -- Finally remove the auth user — cascades through auth-owned data
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ── migration: 20260423020645_09bc8418-d926-49df-a60c-f051d7947569.sql ─────────────────────────────────────────
ALTER TABLE public.editorium_indexed_edits
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_storage_path text,
  ADD COLUMN IF NOT EXISTS autoplay_with_sound boolean NOT NULL DEFAULT true;

-- ── migration: 20260423201422_a77bfa39-1e5c-46d1-aa7a-f730feaa624b.sql ─────────────────────────────────────────
-- Add clipper role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clipper';

-- Create clipper_profiles table
CREATE TABLE IF NOT EXISTS public.clipper_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  age_confirmed_18_plus BOOLEAN NOT NULL DEFAULT false,
  agreed_30_day_post BOOLEAN NOT NULL DEFAULT false,
  total_earnings_cents INTEGER NOT NULL DEFAULT 0,
  total_index_earned INTEGER NOT NULL DEFAULT 0,
  total_clips INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clipper_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clipper profile"
ON public.clipper_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all clipper profiles"
ON public.clipper_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Users can create their own clipper profile"
ON public.clipper_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clipper profile"
ON public.clipper_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_clipper_profiles_updated_at
BEFORE UPDATE ON public.clipper_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── migration: 20260423203926_24a32b9d-956b-41b6-b390-e9c0e1282393.sql ─────────────────────────────────────────
-- Clip submissions
CREATE TABLE IF NOT EXISTS public.clip_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.artist_campaigns(id) ON DELETE SET NULL,
  campaign_name text,
  title text,
  video_url text NOT NULL,
  thumbnail_url text,
  platform text,
  posted_account_handle text,
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | paid
  earned_cents integer NOT NULL DEFAULT 0,
  index_earned integer NOT NULL DEFAULT 0,
  feedback text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clip_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clippers view own submissions"
  ON public.clip_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clippers create own submissions"
  ON public.clip_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clippers update own submissions"
  ON public.clip_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Clippers delete own submissions"
  ON public.clip_submissions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all submissions"
  ON public.clip_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update all submissions"
  ON public.clip_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_clip_submissions_user ON public.clip_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_clip_submissions_campaign ON public.clip_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_clip_submissions_status ON public.clip_submissions(status);

CREATE TRIGGER trg_clip_submissions_updated
  BEFORE UPDATE ON public.clip_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Linked accounts
CREATE TABLE IF NOT EXISTS public.clipper_linked_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL, -- tiktok | instagram | youtube | x | facebook
  handle text NOT NULL,
  profile_url text,
  follower_count integer DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, handle)
);

ALTER TABLE public.clipper_linked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clippers view own linked accounts"
  ON public.clipper_linked_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clippers manage own linked accounts"
  ON public.clipper_linked_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_clipper_linked_user ON public.clipper_linked_accounts(user_id);

-- Withdrawals
CREATE TABLE IF NOT EXISTS public.clipper_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  method text NOT NULL, -- paypal | bank | crypto
  destination text NOT NULL, -- email, account number, wallet address
  status text NOT NULL DEFAULT 'pending', -- pending | processing | paid | rejected
  admin_notes text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clipper_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clippers view own withdrawals"
  ON public.clipper_withdrawals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clippers create own withdrawals"
  ON public.clipper_withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all withdrawals"
  ON public.clipper_withdrawals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update all withdrawals"
  ON public.clipper_withdrawals FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_clipper_withdrawals_user ON public.clipper_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_clipper_withdrawals_status ON public.clipper_withdrawals(status);

CREATE TRIGGER trg_clipper_withdrawals_updated
  BEFORE UPDATE ON public.clipper_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── migration: 20260423224558_b1788943-a9ec-4f9d-ae77-e89799dc92df.sql ─────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════
-- MISSIONS — standalone paid clipper missions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  reference_video_url TEXT,
  scenepack_url TEXT,
  -- Payout config
  base_payout_cents INTEGER NOT NULL DEFAULT 0,
  -- view_milestones is an array of objects: [{"views": 10000, "bonus_cents": 1000}, ...]
  view_milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget_cents INTEGER NOT NULL DEFAULT 0,
  spent_cents INTEGER NOT NULL DEFAULT 0,
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft', -- draft, live, paused, closed
  deadline TIMESTAMPTZ,
  -- Stats
  submission_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  -- Admin
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_missions_created_at ON public.missions(created_at DESC);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Public can view live/paused missions
CREATE POLICY "Anyone can view live missions"
  ON public.missions FOR SELECT
  USING (status IN ('live', 'paused', 'closed'));

-- Staff can do everything
CREATE POLICY "Staff can view all missions"
  ON public.missions FOR SELECT
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can insert missions"
  ON public.missions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update missions"
  ON public.missions FOR UPDATE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can delete missions"
  ON public.missions FOR DELETE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════════════════
-- MISSION SUBMISSIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.mission_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT,
  avatar_url TEXT,
  -- Submission data
  video_url TEXT NOT NULL,
  platform TEXT,
  thumbnail_url TEXT,
  title TEXT,
  posted_handle TEXT,
  -- Performance
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  -- Earnings
  base_earned_cents INTEGER NOT NULL DEFAULT 0,
  bonus_earned_cents INTEGER NOT NULL DEFAULT 0,
  total_earned_cents INTEGER NOT NULL DEFAULT 0,
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, paid
  feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mission_subs_mission ON public.mission_submissions(mission_id);
CREATE INDEX idx_mission_subs_user ON public.mission_submissions(user_id);
CREATE INDEX idx_mission_subs_status ON public.mission_submissions(status);

ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;

-- Users can see their own
CREATE POLICY "Users can view own submissions"
  ON public.mission_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Staff can see all
CREATE POLICY "Staff can view all submissions"
  ON public.mission_submissions FOR SELECT
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- Users can submit
CREATE POLICY "Users can insert own submissions"
  ON public.mission_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update certain fields on their own (e.g. add view_count)
CREATE POLICY "Users can update own submissions"
  ON public.mission_submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Staff can update any (for review)
CREATE POLICY "Staff can update any submission"
  ON public.mission_submissions FOR UPDATE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can delete submissions"
  ON public.mission_submissions FOR DELETE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- Auto-compute total_earned_cents
CREATE OR REPLACE FUNCTION public.sync_mission_submission_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.total_earned_cents := COALESCE(NEW.base_earned_cents, 0) + COALESCE(NEW.bonus_earned_cents, 0);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mission_submission_total
  BEFORE INSERT OR UPDATE ON public.mission_submissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_mission_submission_total();

-- ═══════════════════════════════════════════════════════════
-- MISSION PAYOUTS (instant withdrawals, no minimum)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.mission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  method TEXT NOT NULL, -- paypal, bank, crypto
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, rejected
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mission_payouts_user ON public.mission_payouts(user_id);
CREATE INDEX idx_mission_payouts_status ON public.mission_payouts(status);

ALTER TABLE public.mission_payouts ENABLE ROW LEVEL SECURITY;

-- Users see their own payouts
CREATE POLICY "Users can view own payouts"
  ON public.mission_payouts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can request payouts
CREATE POLICY "Users can insert own payouts"
  ON public.mission_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Staff see all
CREATE POLICY "Staff can view all payouts"
  ON public.mission_payouts FOR SELECT
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- Staff process payouts
CREATE POLICY "Staff can update payouts"
  ON public.mission_payouts FOR UPDATE
  USING (has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER trg_missions_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_mission_payouts_updated_at
  BEFORE UPDATE ON public.mission_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── migration: 20260423231917_3694d7d8-511c-4ddd-ab49-ff1466a6d67a.sql ─────────────────────────────────────────

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS inspirations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url TEXT,
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url TEXT;


-- ── migration: 20260423233254_04b49276-5589-4335-abfc-6157bbea02a8.sql ─────────────────────────────────────────
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS cap_type text NOT NULL DEFAULT 'budget',
  ADD COLUMN IF NOT EXISTS max_posts integer;

-- ── migration: 20260424034733_19970577-9d5b-4392-894b-ab505697fbc9.sql ─────────────────────────────────────────
-- Create support_ticket_messages for real chat threads
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  message text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id, created_at);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Ticket owner can view messages on their own ticket
CREATE POLICY "Ticket owner can view messages"
ON public.support_ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_messages.ticket_id
      AND t.user_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all ticket messages"
ON public.support_ticket_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ticket owner can post messages on their ticket as 'user'
CREATE POLICY "Ticket owner can send messages"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND sender_role = 'user'
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_messages.ticket_id
      AND t.user_id = auth.uid()
  )
);

-- Admins can post messages as 'admin'
CREATE POLICY "Admins can send messages"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND sender_role = 'admin'
  AND auth.uid() = user_id
);

-- Bump ticket updated_at when a new message arrives
CREATE OR REPLACE FUNCTION public.bump_ticket_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = now(),
      status = CASE
        WHEN NEW.sender_role = 'user' AND status = 'closed' THEN 'open'
        ELSE status
      END
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_ticket_on_message ON public.support_ticket_messages;
CREATE TRIGGER trg_bump_ticket_on_message
AFTER INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_ticket_on_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;

-- ── migration: 20260424041832_5b71a0a9-4134-480d-ac97-0b177a654cce.sql ─────────────────────────────────────────
ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS eligible_platforms text[] NOT NULL DEFAULT ARRAY['tiktok','instagram','youtube']::text[];

-- ── migration: 20260424170502_8b4d2d90-ae91-431e-91d9-cdd209f3c91f.sql ─────────────────────────────────────────
ALTER TABLE public.clipper_linked_accounts
  ADD COLUMN IF NOT EXISTS verification_code text,
  ADD COLUMN IF NOT EXISTS code_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS stats_fetched_at timestamptz;

-- ── migration: 20260424191327_b6b3af01-fd8b-4a6f-96a2-14c0f7888dda.sql ─────────────────────────────────────────
-- Add base payout requirements + manual approval rate to missions
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS approval_rate_pct integer,
  ADD COLUMN IF NOT EXISTS base_payout_requirements text;

-- Per-user / per-mission base-payout eligibility requests
CREATE TABLE IF NOT EXISTS public.mission_base_eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text,
  avatar_url text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_id, user_id)
);

ALTER TABLE public.mission_base_eligibility ENABLE ROW LEVEL SECURITY;

-- A user sees their own request
CREATE POLICY "Users view own eligibility"
ON public.mission_base_eligibility FOR SELECT
USING (auth.uid() = user_id);

-- Admin/dev see all
CREATE POLICY "Admins view all eligibility"
ON public.mission_base_eligibility FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

-- A user can request (insert) for themselves
CREATE POLICY "Users request eligibility"
ON public.mission_base_eligibility FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin/dev can update (approve/reject)
CREATE POLICY "Admins update eligibility"
ON public.mission_base_eligibility FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

CREATE TRIGGER trg_mission_base_eligibility_updated
BEFORE UPDATE ON public.mission_base_eligibility
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_mission_base_eligibility_user ON public.mission_base_eligibility(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_base_eligibility_mission ON public.mission_base_eligibility(mission_id, status);

-- ── migration: 20260427185022_3155b70c-5723-44e8-bab3-426d2435d2a2.sql ─────────────────────────────────────────
UPDATE public.artist_campaigns SET status = 'completed' WHERE name ILIKE '%weirdcity%';

-- ── migration: 20260427230652_8a6f5c8f-ef78-44b4-86fa-e4ea3d513a1f.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp_amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE
    WHEN xp_amount >= 1255943 THEN 100
    WHEN xp_amount >= 1228478 THEN 99
    WHEN xp_amount >= 1201344 THEN 98
    WHEN xp_amount >= 1174540 THEN 97
    WHEN xp_amount >= 1148066 THEN 96
    WHEN xp_amount >= 1121920 THEN 95
    WHEN xp_amount >= 1096103 THEN 94
    WHEN xp_amount >= 1070613 THEN 93
    WHEN xp_amount >= 1045450 THEN 92
    WHEN xp_amount >= 1020613 THEN 91
    WHEN xp_amount >= 996101 THEN 90
    WHEN xp_amount >= 971914 THEN 89
    WHEN xp_amount >= 948051 THEN 88
    WHEN xp_amount >= 924512 THEN 87
    WHEN xp_amount >= 901294 THEN 86
    WHEN xp_amount >= 878399 THEN 85
    WHEN xp_amount >= 855824 THEN 84
    WHEN xp_amount >= 833569 THEN 83
    WHEN xp_amount >= 811634 THEN 82
    WHEN xp_amount >= 790018 THEN 81
    WHEN xp_amount >= 768720 THEN 80
    WHEN xp_amount >= 747738 THEN 79
    WHEN xp_amount >= 727073 THEN 78
    WHEN xp_amount >= 706724 THEN 77
    WHEN xp_amount >= 686689 THEN 76
    WHEN xp_amount >= 666968 THEN 75
    WHEN xp_amount >= 647560 THEN 74
    WHEN xp_amount >= 628464 THEN 73
    WHEN xp_amount >= 609679 THEN 72
    WHEN xp_amount >= 591205 THEN 71
    WHEN xp_amount >= 573041 THEN 70
    WHEN xp_amount >= 555185 THEN 69
    WHEN xp_amount >= 537638 THEN 68
    WHEN xp_amount >= 520397 THEN 67
    WHEN xp_amount >= 503462 THEN 66
    WHEN xp_amount >= 486832 THEN 65
    WHEN xp_amount >= 470507 THEN 64
    WHEN xp_amount >= 454485 THEN 63
    WHEN xp_amount >= 438765 THEN 62
    WHEN xp_amount >= 423346 THEN 61
    WHEN xp_amount >= 408228 THEN 60
    WHEN xp_amount >= 393409 THEN 59
    WHEN xp_amount >= 378889 THEN 58
    WHEN xp_amount >= 364666 THEN 57
    WHEN xp_amount >= 350739 THEN 56
    WHEN xp_amount >= 337107 THEN 55
    WHEN xp_amount >= 323770 THEN 54
    WHEN xp_amount >= 310726 THEN 53
    WHEN xp_amount >= 297973 THEN 52
    WHEN xp_amount >= 285512 THEN 51
    WHEN xp_amount >= 273341 THEN 50
    WHEN xp_amount >= 261458 THEN 49
    WHEN xp_amount >= 249862 THEN 48
    WHEN xp_amount >= 238553 THEN 47
    WHEN xp_amount >= 227529 THEN 46
    WHEN xp_amount >= 216789 THEN 45
    WHEN xp_amount >= 206332 THEN 44
    WHEN xp_amount >= 196156 THEN 43
    WHEN xp_amount >= 186260 THEN 42
    WHEN xp_amount >= 176642 THEN 41
    WHEN xp_amount >= 167302 THEN 40
    WHEN xp_amount >= 158238 THEN 39
    WHEN xp_amount >= 149449 THEN 38
    WHEN xp_amount >= 140933 THEN 37
    WHEN xp_amount >= 132689 THEN 36
    WHEN xp_amount >= 124715 THEN 35
    WHEN xp_amount >= 117010 THEN 34
    WHEN xp_amount >= 109572 THEN 33
    WHEN xp_amount >= 102400 THEN 32
    WHEN xp_amount >= 95492 THEN 31
    WHEN xp_amount >= 88846 THEN 30
    WHEN xp_amount >= 82460 THEN 29
    WHEN xp_amount >= 76334 THEN 28
    WHEN xp_amount >= 70464 THEN 27
    WHEN xp_amount >= 64850 THEN 26
    WHEN xp_amount >= 59489 THEN 25
    WHEN xp_amount >= 54379 THEN 24
    WHEN xp_amount >= 49519 THEN 23
    WHEN xp_amount >= 44906 THEN 22
    WHEN xp_amount >= 40537 THEN 21
    WHEN xp_amount >= 36411 THEN 20
    WHEN xp_amount >= 32526 THEN 19
    WHEN xp_amount >= 28878 THEN 18
    WHEN xp_amount >= 25466 THEN 17
    WHEN xp_amount >= 22286 THEN 16
    WHEN xp_amount >= 19336 THEN 15
    WHEN xp_amount >= 16613 THEN 14
    WHEN xp_amount >= 14114 THEN 13
    WHEN xp_amount >= 11835 THEN 12
    WHEN xp_amount >= 9773 THEN 11
    WHEN xp_amount >= 7924 THEN 10
    WHEN xp_amount >= 6285 THEN 9
    WHEN xp_amount >= 4850 THEN 8
    WHEN xp_amount >= 3616 THEN 7
    WHEN xp_amount >= 2576 THEN 6
    WHEN xp_amount >= 1725 THEN 5
    WHEN xp_amount >= 1056 THEN 4
    WHEN xp_amount >= 561 THEN 3
    WHEN xp_amount >= 230 THEN 2
    ELSE 1
  END;
END;
$function$;

-- ── migration: 20260427230911_98a8d30c-7ff3-4d5e-ac48-8bd76403b26a.sql ─────────────────────────────────────────
-- 10x competition reward pools (drives both `competitions` and `hosted_competitions` via the two trigger funcs)
CREATE OR REPLACE FUNCTION public.calculate_comp_index_reward(participant_count integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN participant_count >= 100 THEN 5000
    WHEN participant_count >= 75 THEN 3500
    WHEN participant_count >= 50 THEN 2000
    WHEN participant_count >= 25 THEN 1000
    WHEN participant_count >= 10 THEN 500
    WHEN participant_count >= 5 THEN 250
    WHEN participant_count >= 2 THEN 100
    ELSE 0
  END
$function$;

CREATE OR REPLACE FUNCTION public.update_competition_reward_pool()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.competitions
  SET index_reward_pool = CASE
    WHEN current_players >= 100 THEN 5000
    WHEN current_players >= 75 THEN 3500
    WHEN current_players >= 50 THEN 2000
    WHEN current_players >= 25 THEN 1000
    WHEN current_players >= 10 THEN 500
    WHEN current_players >= 5 THEN 250
    WHEN current_players >= 2 THEN 100
    ELSE 0
  END
  WHERE id = COALESCE(NEW.competition_id, OLD.competition_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 10x solo mode index payout (was floor(qoi_score), now floor(qoi_score * 10))
CREATE OR REPLACE FUNCTION public.award_solo_index()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- Index awarded = floor of QOI score * 10, BUT only if not disqualified
    IF NEW.is_disqualified = true THEN
      NEW.index_awarded := 0;
    ELSE
      NEW.index_awarded := FLOOR(NEW.qoi_score * 10)::INTEGER;

      -- Add to user's spendable and global index
      UPDATE public.profiles
      SET spendable_index = spendable_index + NEW.index_awarded,
          global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
      WHERE id = NEW.user_id;
    END IF;

    -- Award XP regardless (10x scaled, capped at 500)
    PERFORM public.award_xp(NEW.user_id, LEAST(FLOOR(NEW.qoi_score * 10)::INTEGER, 500), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$function$;

-- 10x default battle index rewards/penalties for newly created battles
ALTER TABLE public.battles
  ALTER COLUMN winner_index_awarded SET DEFAULT 200,
  ALTER COLUMN loser_index_penalty SET DEFAULT 50;

-- ── migration: 20260427233252_629264bb-0ec3-4a4e-8ab2-ac14d901b196.sql ─────────────────────────────────────────

-- 10x another bump on Index economy: battle defaults, competition pools, solo index, hosted comp tiers

-- Battle distribution: bump default winner reward & loser penalty 10x
CREATE OR REPLACE FUNCTION public.distribute_battle_index()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.winner_id IS NOT NULL THEN
    UPDATE public.profiles
    SET global_index_score = COALESCE(global_index_score, 0) + COALESCE(NEW.winner_index_awarded, 200)
    WHERE id = NEW.winner_id;

    IF NEW.winner_id = NEW.challenger_id AND NEW.opponent_id IS NOT NULL THEN
      UPDATE public.profiles
      SET global_index_score = GREATEST(0, COALESCE(global_index_score, 0) - COALESCE(NEW.loser_index_penalty, 50))
      WHERE id = NEW.opponent_id;
    ELSIF NEW.winner_id = NEW.opponent_id THEN
      UPDATE public.profiles
      SET global_index_score = GREATEST(0, COALESCE(global_index_score, 0) - COALESCE(NEW.loser_index_penalty, 50))
      WHERE id = NEW.challenger_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Hosted competition reward pool tiers (10x bump)
CREATE OR REPLACE FUNCTION public.calculate_comp_index_reward(participant_count integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN participant_count >= 100 THEN 50000
    WHEN participant_count >= 75 THEN 35000
    WHEN participant_count >= 50 THEN 20000
    WHEN participant_count >= 25 THEN 10000
    WHEN participant_count >= 10 THEN 5000
    WHEN participant_count >= 5 THEN 2500
    WHEN participant_count >= 2 THEN 1000
    ELSE 0
  END
$function$;

-- Open competitions reward pool (10x bump)
CREATE OR REPLACE FUNCTION public.update_competition_reward_pool()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.competitions
  SET index_reward_pool = CASE
    WHEN current_players >= 100 THEN 50000
    WHEN current_players >= 75 THEN 35000
    WHEN current_players >= 50 THEN 20000
    WHEN current_players >= 25 THEN 10000
    WHEN current_players >= 10 THEN 5000
    WHEN current_players >= 5 THEN 2500
    WHEN current_players >= 2 THEN 1000
    ELSE 0
  END
  WHERE id = COALESCE(NEW.competition_id, OLD.competition_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Solo index payout: floor(qoi * 100) (was 10), and XP cap 5000 (was 500)
CREATE OR REPLACE FUNCTION public.award_solo_index()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    IF NEW.is_disqualified = true THEN
      NEW.index_awarded := 0;
    ELSE
      NEW.index_awarded := FLOOR(NEW.qoi_score * 100)::INTEGER;

      UPDATE public.profiles
      SET spendable_index = spendable_index + NEW.index_awarded,
          global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
      WHERE id = NEW.user_id;
    END IF;

    PERFORM public.award_xp(NEW.user_id, LEAST(FLOOR(NEW.qoi_score * 100)::INTEGER, 5000), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$function$;


-- ── migration: 20260427234737_12a1ac69-d653-411c-bffa-e15f76f1521c.sql ─────────────────────────────────────────

-- Battles: bump defaults & backfill
ALTER TABLE public.battles ALTER COLUMN winner_index_awarded SET DEFAULT 2000;
ALTER TABLE public.battles ALTER COLUMN loser_index_penalty SET DEFAULT 500;
UPDATE public.battles SET winner_index_awarded = 2000 WHERE winner_index_awarded < 2000;
UPDATE public.battles SET loser_index_penalty = 500 WHERE loser_index_penalty < 500;

-- Featured drops: bump defaults & 100x existing rows
ALTER TABLE public.featured_drops ALTER COLUMN xp_reward SET DEFAULT 5000;
ALTER TABLE public.featured_drops ALTER COLUMN index_reward SET DEFAULT 3000;
UPDATE public.featured_drops SET xp_reward = xp_reward * 100 WHERE xp_reward < 5000;
UPDATE public.featured_drops SET index_reward = index_reward * 100 WHERE index_reward < 3000;


-- ── migration: 20260428011543_5f321feb-d108-472a-964c-91955ecb52e1.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_solo_index()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'scored' AND NEW.qoi_score IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'scored') THEN
    IF NEW.is_disqualified = true THEN
      NEW.index_awarded := 0;
    ELSE
      NEW.index_awarded := FLOOR(NEW.qoi_score * 1000)::INTEGER;

      UPDATE public.profiles
      SET spendable_index = spendable_index + NEW.index_awarded,
          global_index_score = COALESCE(global_index_score, 0) + NEW.index_awarded
      WHERE id = NEW.user_id;
    END IF;

    PERFORM public.award_xp(NEW.user_id, LEAST(FLOOR(NEW.qoi_score * 1000)::INTEGER, 10000), 'solo_scored', 'Solo Mode: Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI');
  END IF;
  RETURN NEW;
END;
$function$;

-- ── migration: 20260429170140_130d7859-2e55-4239-b90a-55ab503ca2c5.sql ─────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rings INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_profiles_rings ON public.profiles(rings);

-- ── migration: 20260429173330_86842780-b7a2-43fa-b637-418565e49f98.sql ─────────────────────────────────────────
ALTER TABLE public.shop_items
ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'common';

ALTER TABLE public.shop_items
ADD CONSTRAINT shop_items_rarity_check
CHECK (rarity IN ('common','uncommon','rare','epic','legendary','mythic'));

UPDATE public.shop_items SET rarity = 'epic' WHERE name = 'Obsidian Frame';
UPDATE public.shop_items SET rarity = 'mythic' WHERE name = 'OG Claim';

-- ── migration: 20260430031939_494dddc0-1d51-4466-9fc6-814e75a5682e.sql ─────────────────────────────────────────
CREATE POLICY "Users can delete own pending cash battle application"
ON public.cash_battle_applications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- ── migration: 20260430050540_59414b57-ad00-4bc6-ba1c-54c2b669ed64.sql ─────────────────────────────────────────
DELETE FROM public.competitions WHERE id = 'ca794d22-aa79-4dd0-a074-64acb9cb543c';

-- ── migration: 20260430051017_bb164a3b-8dda-4792-8780-f2d2fbbe1767.sql ─────────────────────────────────────────

ALTER TABLE public.competition_participants
  ADD COLUMN IF NOT EXISTS is_ready boolean NOT NULL DEFAULT false;

-- Allow editors to update their own ready status
DROP POLICY IF EXISTS "Users can update own participant" ON public.competition_participants;
CREATE POLICY "Users can update own participant"
ON public.competition_participants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Auto-start when 2+ participants are all ready
CREATE OR REPLACE FUNCTION public.auto_start_competition_when_ready()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count int;
  ready_count int;
  comp_status text;
BEGIN
  SELECT status INTO comp_status FROM public.competitions WHERE id = NEW.competition_id;
  IF comp_status <> 'lobby' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_ready = true)
    INTO total_count, ready_count
  FROM public.competition_participants
  WHERE competition_id = NEW.competition_id;

  IF total_count >= 2 AND ready_count = total_count THEN
    UPDATE public.competitions
       SET status = 'live',
           started_at = now(),
           deadline = now() + interval '30 minutes'
     WHERE id = NEW.competition_id AND status = 'lobby';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_start_competition_ready ON public.competition_participants;
CREATE TRIGGER trg_auto_start_competition_ready
AFTER UPDATE OF is_ready ON public.competition_participants
FOR EACH ROW
EXECUTE FUNCTION public.auto_start_competition_when_ready();


-- ── migration: 20260430071850_6955faa2-9f89-4110-b540-ef43d54d3570.sql ─────────────────────────────────────────

-- Voting window columns
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS voting_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voting_deadline TIMESTAMPTZ;

-- Vote count cache on submissions
ALTER TABLE public.competition_submissions
  ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0;

-- Votes table
CREATE TABLE IF NOT EXISTS public.competition_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.competition_submissions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, voter_id)
);

ALTER TABLE public.competition_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view competition votes" ON public.competition_votes;
CREATE POLICY "Anyone can view competition votes"
  ON public.competition_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users cast their own vote" ON public.competition_votes;
CREATE POLICY "Users cast their own vote"
  ON public.competition_votes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = voter_id
    AND NOT EXISTS (
      SELECT 1 FROM public.competition_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users remove their own vote" ON public.competition_votes;
CREATE POLICY "Users remove their own vote"
  ON public.competition_votes FOR DELETE TO authenticated
  USING (auth.uid() = voter_id);

-- Sync vote counts onto submissions
CREATE OR REPLACE FUNCTION public.sync_competition_submission_votes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sub_id UUID;
BEGIN
  sub_id := COALESCE(NEW.submission_id, OLD.submission_id);
  UPDATE public.competition_submissions
    SET vote_count = (SELECT COUNT(*) FROM public.competition_votes WHERE submission_id = sub_id)
    WHERE id = sub_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_competition_submission_votes ON public.competition_votes;
CREATE TRIGGER trg_sync_competition_submission_votes
  AFTER INSERT OR DELETE ON public.competition_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_competition_submission_votes();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_submissions;


-- ── migration: 20260430204819_fe2d4bb4-55a3-4b0f-a645-31758ad696f9.sql ─────────────────────────────────────────
DELETE FROM public.battles WHERE id = '2dd56776-5bfa-4871-a35d-f6834296180f';

-- ── migration: 20260430212923_066c48c1-fbc5-43ce-a8b8-b3e475b9e56c.sql ─────────────────────────────────────────
UPDATE public.battles SET status = 'cancelled' WHERE id = '9ed9d2ca-b3ad-4d59-a12e-689b7012a4f3';

-- ── migration: 20260430214036_0bbae1e9-013d-45df-b4c8-45c5f6e89457.sql ─────────────────────────────────────────

-- Forfeit a 1v1 battle (caller must be challenger or opponent)
CREATE OR REPLACE FUNCTION public.battle_forfeit(p_battle_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_battle public.battles%ROWTYPE;
  v_winner uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  SELECT * INTO v_battle FROM public.battles WHERE id = p_battle_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_battle.challenger_id <> v_uid AND v_battle.opponent_id <> v_uid THEN
    RETURN false;
  END IF;
  IF v_battle.status NOT IN ('pending','accepted','active','judging') THEN
    RETURN false;
  END IF;

  IF v_uid = v_battle.challenger_id THEN
    v_winner := v_battle.opponent_id;
  ELSE
    v_winner := v_battle.challenger_id;
  END IF;

  UPDATE public.battles
  SET status = 'forfeited',
      winner_id = v_winner,
      judge_notes = COALESCE(judge_notes,'') || ' [Forfeited by user]'
  WHERE id = p_battle_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.battle_forfeit(uuid) TO authenticated;

-- Forfeit a quick fight (caller must be one of the players)
CREATE OR REPLACE FUNCTION public.quick_fight_forfeit(p_fight_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_fight public.quick_fights%ROWTYPE;
  v_winner uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  SELECT * INTO v_fight FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_fight.player_1_id <> v_uid AND COALESCE(v_fight.player_2_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_uid THEN
    RETURN false;
  END IF;
  IF v_fight.status NOT IN ('waiting','active','submitted','judging') THEN
    RETURN false;
  END IF;

  IF v_uid = v_fight.player_1_id THEN
    v_winner := v_fight.player_2_id;
  ELSE
    v_winner := v_fight.player_1_id;
  END IF;

  UPDATE public.quick_fights
  SET status = 'forfeited',
      winner_id = v_winner,
      judge_notes = COALESCE(judge_notes,'') || ' [Forfeited by user]',
      judged_at = now()
  WHERE id = p_fight_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quick_fight_forfeit(uuid) TO authenticated;


-- ── migration: 20260430221411_0bf7f9f7-9ae7-4892-a9fc-bcc39a34d72f.sql ─────────────────────────────────────────
-- Set REPLICA IDENTITY FULL so realtime UPDATE events broadcast the full row,
-- including status/timer changes that drive UI updates.
ALTER TABLE public.battles REPLICA IDENTITY FULL;
ALTER TABLE public.quick_fights REPLICA IDENTITY FULL;
ALTER TABLE public.sanctioned_tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.sanctioned_tournament_participants REPLICA IDENTITY FULL;
ALTER TABLE public.friendly_tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.friendly_tournament_participants REPLICA IDENTITY FULL;
ALTER TABLE public.competitions REPLICA IDENTITY FULL;
ALTER TABLE public.competition_participants REPLICA IDENTITY FULL;
ALTER TABLE public.competition_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.cash_battles REPLICA IDENTITY FULL;
ALTER TABLE public.cash_battle_applications REPLICA IDENTITY FULL;
ALTER TABLE public.featured_drops REPLICA IDENTITY FULL;
ALTER TABLE public.featured_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.featured_drop_queue REPLICA IDENTITY FULL;
ALTER TABLE public.featured_drop_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.solo_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.feed_posts REPLICA IDENTITY FULL;
ALTER TABLE public.hosted_competitions REPLICA IDENTITY FULL;
ALTER TABLE public.hosted_competition_participants REPLICA IDENTITY FULL;
ALTER TABLE public.hosted_competition_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.event_participations REPLICA IDENTITY FULL;
ALTER TABLE public.event_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.practice_matches REPLICA IDENTITY FULL;
ALTER TABLE public.quick_fight_queue REPLICA IDENTITY FULL;
ALTER TABLE public.gatekeeper_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.review_requests REPLICA IDENTITY FULL;
ALTER TABLE public.judge_inbox REPLICA IDENTITY FULL;
ALTER TABLE public.battle_invites REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- ── migration: 20260430230121_089b72cf-6d98-42dd-b6f9-6e4db188184a.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finalize_expired_competitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  winner_id UUID;
BEGIN
  FOR comp IN
    SELECT id
    FROM public.competitions
    WHERE status = 'voting'
      AND voting_deadline IS NOT NULL
      AND voting_deadline <= now()
  LOOP
    SELECT id INTO winner_id
    FROM public.competition_submissions
    WHERE competition_id = comp.id
    ORDER BY COALESCE(vote_count, 0) DESC, created_at DESC
    LIMIT 1;

    IF winner_id IS NOT NULL THEN
      UPDATE public.competition_submissions
      SET is_winner = (id = winner_id),
          winner_place = CASE WHEN id = winner_id THEN 1 ELSE winner_place END,
          scored_at = CASE WHEN id = winner_id THEN COALESCE(scored_at, now()) ELSE scored_at END
      WHERE competition_id = comp.id;
    END IF;

    UPDATE public.competitions
    SET status = CASE WHEN winner_id IS NULL THEN 'closed' ELSE 'completed' END,
        updated_at = now()
    WHERE id = comp.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  winner_id UUID;
BEGIN
  SELECT id, status, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL OR comp.status <> 'voting' OR comp.voting_deadline IS NULL OR comp.voting_deadline > now() THEN
    RETURN false;
  END IF;

  SELECT id INTO winner_id
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id
  ORDER BY COALESCE(vote_count, 0) DESC, created_at DESC
  LIMIT 1;

  IF winner_id IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (id = winner_id),
        winner_place = CASE WHEN id = winner_id THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN id = winner_id THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winner_id IS NULL THEN 'closed' ELSE 'completed' END,
      updated_at = now()
  WHERE id = p_competition_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_finalize_expired_competitions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.finalize_expired_competitions();
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_finalize_expired_competitions_on_competitions ON public.competitions;
CREATE TRIGGER trg_finalize_expired_competitions_on_competitions
AFTER INSERT OR UPDATE ON public.competitions
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_finalize_expired_competitions();

DROP TRIGGER IF EXISTS trg_finalize_expired_competitions_on_votes ON public.competition_votes;
CREATE TRIGGER trg_finalize_expired_competitions_on_votes
AFTER INSERT OR DELETE ON public.competition_votes
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_finalize_expired_competitions();

DROP POLICY IF EXISTS "Participants can close expired voting" ON public.competitions;
CREATE POLICY "Participants can close expired voting"
ON public.competitions
FOR UPDATE TO authenticated
USING (
  status = 'voting'
  AND voting_deadline IS NOT NULL
  AND voting_deadline <= now()
  AND EXISTS (
    SELECT 1
    FROM public.competition_participants cp
    WHERE cp.competition_id = competitions.id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.competition_participants cp
    WHERE cp.competition_id = competitions.id
      AND cp.user_id = auth.uid()
  )
);

-- ── migration: 20260430230420_5e79de50-fdca-4274-97b4-2b491750670b.sql ─────────────────────────────────────────
DROP POLICY IF EXISTS "Participants can close expired voting" ON public.competitions;

CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  winner_id UUID;
  submission_count integer;
  total_votes integer;
  requester uuid := auth.uid();
BEGIN
  SELECT id, status, deadline, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN
    RETURN false;
  END IF;

  IF requester IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = p_competition_id AND c.creator_id = requester
  ) AND NOT EXISTS (
    SELECT 1 FROM public.competition_participants cp
    WHERE cp.competition_id = p_competition_id AND cp.user_id = requester
  ) THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)::integer, COALESCE(SUM(COALESCE(vote_count, 0)), 0)::integer
    INTO submission_count, total_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  IF comp.status = 'live' AND comp.deadline IS NOT NULL AND comp.deadline <= now() THEN
    IF submission_count = 0 THEN
      UPDATE public.competitions
      SET status = 'closed', updated_at = now()
      WHERE id = p_competition_id AND status = 'live';
      RETURN true;
    END IF;

    UPDATE public.competitions
    SET status = 'voting',
        voting_started_at = COALESCE(voting_started_at, now()),
        voting_deadline = COALESCE(voting_deadline, now() + interval '2 minutes'),
        updated_at = now()
    WHERE id = p_competition_id AND status = 'live';
    RETURN true;
  END IF;

  IF comp.status <> 'voting' THEN
    RETURN false;
  END IF;

  IF NOT (
    submission_count = 0
    OR submission_count = 1
    OR total_votes >= submission_count
    OR (comp.voting_deadline IS NOT NULL AND comp.voting_deadline <= now())
  ) THEN
    RETURN false;
  END IF;

  SELECT id INTO winner_id
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id
  ORDER BY COALESCE(vote_count, 0) DESC, created_at DESC
  LIMIT 1;

  IF winner_id IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (id = winner_id),
        winner_place = CASE WHEN id = winner_id THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN id = winner_id THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winner_id IS NULL THEN 'closed' ELSE 'completed' END,
      updated_at = now()
  WHERE id = p_competition_id AND status = 'voting';

  RETURN true;
END;
$$;

-- ── migration: 20260430230448_07b5fd5a-4ddc-464b-bbbd-4a16425664b3.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_advance_competition_on_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_count integer;
  submission_count integer;
  comp_status text;
BEGIN
  SELECT status INTO comp_status
  FROM public.competitions
  WHERE id = NEW.competition_id;

  IF comp_status <> 'live' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::integer INTO total_count
  FROM public.competition_participants
  WHERE competition_id = NEW.competition_id;

  SELECT COUNT(*)::integer INTO submission_count
  FROM public.competition_submissions
  WHERE competition_id = NEW.competition_id;

  IF total_count > 0 AND submission_count >= total_count THEN
    UPDATE public.competitions
    SET status = 'voting',
        voting_started_at = now(),
        voting_deadline = now() + interval '2 minutes',
        updated_at = now()
    WHERE id = NEW.competition_id AND status = 'live';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_advance_competition_on_submission ON public.competition_submissions;
CREATE TRIGGER trg_auto_advance_competition_on_submission
AFTER INSERT ON public.competition_submissions
FOR EACH ROW
EXECUTE FUNCTION public.auto_advance_competition_on_submission();

-- ── migration: 20260430230620_f3b8decb-abad-4e08-a889-26b8f78b765a.sql ─────────────────────────────────────────
SELECT public.finalize_expired_competitions();

-- ── migration: 20260430234724_b2899efb-5c9c-4e5c-86b0-1838c6536027.sql ─────────────────────────────────────────

-- Award rewards (XP + Index) when a competition completes.
-- Splits the IDX prize pool equally among all tied top-vote submissions.
-- Every participant who submitted gets a base XP for showing up.
CREATE OR REPLACE FUNCTION public.award_competition_rewards(p_competition_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  winner_count integer := 0;
  per_winner_idx integer := 0;
  per_winner_xp integer := 0;
  base_xp integer := 5000;       -- participation XP (matches submit_edit reward)
  win_bonus_xp integer := 30000; -- winner XP pool to split (matches event_win)
  rec RECORD;
BEGIN
  SELECT id, name, index_reward_pool
    INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN RETURN; END IF;

  -- Idempotency guard: if anyone already got a comp_win reward for this comp, bail.
  IF EXISTS (
    SELECT 1 FROM public.xp_history
    WHERE action = 'competition_win'
      AND description LIKE '%' || comp.id::text || '%'
  ) THEN
    RETURN;
  END IF;

  -- Count winners (handles ties — finalize step sets is_winner=true for every tied top submission)
  SELECT COUNT(*) INTO winner_count
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id AND is_winner = true;

  IF winner_count > 0 THEN
    per_winner_idx := FLOOR(COALESCE(comp.index_reward_pool, 0)::numeric / winner_count)::integer;
    per_winner_xp  := FLOOR(win_bonus_xp::numeric / winner_count)::integer;
  END IF;

  -- Participation XP for everyone who submitted
  FOR rec IN
    SELECT DISTINCT user_id
    FROM public.competition_submissions
    WHERE competition_id = p_competition_id AND user_id IS NOT NULL
  LOOP
    PERFORM public.award_xp(
      rec.user_id,
      base_xp,
      'competition_submit',
      'Competition: submitted edit · ' || comp.id::text
    );
  END LOOP;

  -- Winner rewards (split pool + bonus XP)
  IF winner_count > 0 THEN
    FOR rec IN
      SELECT DISTINCT user_id
      FROM public.competition_submissions
      WHERE competition_id = p_competition_id AND is_winner = true AND user_id IS NOT NULL
    LOOP
      IF per_winner_idx > 0 THEN
        UPDATE public.profiles
        SET spendable_index = COALESCE(spendable_index, 0) + per_winner_idx,
            global_index_score = COALESCE(global_index_score, 0) + per_winner_idx,
            total_wins = COALESCE(total_wins, 0) + CASE WHEN winner_count = 1 THEN 1 ELSE 0 END
        WHERE id = rec.user_id;
      ELSE
        UPDATE public.profiles
        SET total_wins = COALESCE(total_wins, 0) + CASE WHEN winner_count = 1 THEN 1 ELSE 0 END
        WHERE id = rec.user_id;
      END IF;

      PERFORM public.award_xp(
        rec.user_id,
        per_winner_xp,
        'competition_win',
        CASE WHEN winner_count > 1
             THEN 'Competition: tied winner (split) · ' || comp.id::text
             ELSE 'Competition: winner · ' || comp.id::text END
      );
    END LOOP;
  END IF;
END;
$$;

-- Update finalize function to mark ALL tied top-vote submissions as winners
-- and invoke the reward distribution at completion.
CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
  top_votes integer;
  submission_count integer;
  total_votes integer;
  requester uuid := auth.uid();
  winners_marked integer := 0;
BEGIN
  SELECT id, status, deadline, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN RETURN false; END IF;
  IF requester IS NULL THEN RETURN false; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = p_competition_id AND c.creator_id = requester
  ) AND NOT EXISTS (
    SELECT 1 FROM public.competition_participants cp
    WHERE cp.competition_id = p_competition_id AND cp.user_id = requester
  ) THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)::integer, COALESCE(SUM(COALESCE(vote_count, 0)), 0)::integer
    INTO submission_count, total_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  -- Move expired live → voting (or close if no submissions)
  IF comp.status = 'live' AND comp.deadline IS NOT NULL AND comp.deadline <= now() THEN
    IF submission_count = 0 THEN
      UPDATE public.competitions
      SET status = 'closed', updated_at = now()
      WHERE id = p_competition_id AND status = 'live';
      RETURN true;
    END IF;

    UPDATE public.competitions
    SET status = 'voting',
        voting_started_at = COALESCE(voting_started_at, now()),
        voting_deadline = COALESCE(voting_deadline, now() + interval '2 minutes'),
        updated_at = now()
    WHERE id = p_competition_id AND status = 'live';
    RETURN true;
  END IF;

  IF comp.status <> 'voting' THEN
    RETURN false;
  END IF;

  IF NOT (
    submission_count = 0
    OR submission_count = 1
    OR total_votes >= submission_count
    OR (comp.voting_deadline IS NOT NULL AND comp.voting_deadline <= now())
  ) THEN
    RETURN false;
  END IF;

  -- Find the top vote count
  SELECT MAX(COALESCE(vote_count, 0)) INTO top_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  -- Mark every submission tied at top_votes as a winner (handles ties)
  IF top_votes IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (COALESCE(vote_count, 0) = top_votes),
        winner_place = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;

    GET DIAGNOSTICS winners_marked = ROW_COUNT;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winners_marked = 0 OR submission_count = 0 THEN 'closed' ELSE 'completed' END,
      updated_at = now()
  WHERE id = p_competition_id AND status = 'voting';

  -- Distribute XP + IDX rewards (idempotent inside)
  PERFORM public.award_competition_rewards(p_competition_id);

  RETURN true;
END;
$$;


-- ── migration: 20260501043756_e800796a-16e4-4031-b471-b8dd02c2b451.sql ─────────────────────────────────────────
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30;

CREATE POLICY "Creators can delete their own competitions"
ON public.competitions
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- ── migration: 20260501053712_a1e2d290-3ef9-4f92-a571-f4eff9e0db9c.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  comp RECORD;
  top_votes integer;
  submission_count integer;
  total_votes integer;
  requester uuid := auth.uid();
  winners_marked integer := 0;
  v_showcase_seconds integer;
  v_showcase_ends timestamptz;
BEGIN
  SELECT id, status, deadline, voting_started_at, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN RETURN false; END IF;
  IF requester IS NULL THEN RETURN false; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = p_competition_id AND c.creator_id = requester
  ) AND NOT EXISTS (
    SELECT 1 FROM public.competition_participants cp
    WHERE cp.competition_id = p_competition_id AND cp.user_id = requester
  ) THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)::integer, COALESCE(SUM(COALESCE(vote_count, 0)), 0)::integer
    INTO submission_count, total_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  -- Showcase = 15s per submission. Voting window after showcase = 3 minutes.
  v_showcase_seconds := GREATEST(submission_count, 0) * 15;

  -- Move expired live → voting (or close if no submissions)
  IF comp.status = 'live' AND comp.deadline IS NOT NULL AND comp.deadline <= now() THEN
    IF submission_count = 0 THEN
      UPDATE public.competitions
      SET status = 'closed', updated_at = now()
      WHERE id = p_competition_id AND status = 'live';
      RETURN true;
    END IF;

    UPDATE public.competitions
    SET status = 'voting',
        voting_started_at = COALESCE(voting_started_at, now()),
        voting_deadline = COALESCE(
          voting_deadline,
          now() + make_interval(secs => v_showcase_seconds) + interval '3 minutes'
        ),
        updated_at = now()
    WHERE id = p_competition_id AND status = 'live';
    RETURN true;
  END IF;

  IF comp.status <> 'voting' THEN
    RETURN false;
  END IF;

  -- Compute when the synchronized showcase ends. Voting ballots cast during the
  -- showcase MUST NOT trigger early finalization — every edit deserves its 15s on
  -- screen before a winner is crowned.
  v_showcase_ends := COALESCE(comp.voting_started_at, now()) + make_interval(secs => v_showcase_seconds);

  IF NOT (
    submission_count = 0
    OR submission_count = 1
    OR (
      total_votes >= submission_count
      AND now() >= v_showcase_ends
    )
    OR (comp.voting_deadline IS NOT NULL AND comp.voting_deadline <= now())
  ) THEN
    RETURN false;
  END IF;

  -- Find the top vote count
  SELECT MAX(COALESCE(vote_count, 0)) INTO top_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  -- Mark every submission tied at top_votes as a winner (handles ties)
  IF top_votes IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (COALESCE(vote_count, 0) = top_votes),
        winner_place = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;

    GET DIAGNOSTICS winners_marked = ROW_COUNT;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winners_marked > 0 THEN 'completed' ELSE 'closed' END,
      updated_at = now()
  WHERE id = p_competition_id AND status = 'voting';

  PERFORM public.award_competition_rewards(p_competition_id);

  RETURN true;
END;
$function$;

-- ── migration: 20260501054447_0b7f73d5-0fd5-4528-9b4e-6938c1e8b84e.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_competition_vote_window()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comp RECORD;
  target_submission RECORD;
  submission_count integer;
  showcase_ends_at timestamptz;
BEGIN
  SELECT id, status, voting_started_at, voting_deadline
    INTO comp
  FROM public.competitions
  WHERE id = NEW.competition_id;

  IF comp.id IS NULL THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  SELECT id, competition_id, user_id
    INTO target_submission
  FROM public.competition_submissions
  WHERE id = NEW.submission_id;

  IF target_submission.id IS NULL OR target_submission.competition_id <> NEW.competition_id THEN
    RAISE EXCEPTION 'Invalid competition vote target';
  END IF;

  IF target_submission.user_id = NEW.voter_id THEN
    RAISE EXCEPTION 'Editors cannot vote for their own submission';
  END IF;

  IF comp.status <> 'voting' OR comp.voting_started_at IS NULL THEN
    RAISE EXCEPTION 'Voting is not open for this competition';
  END IF;

  SELECT COUNT(*)::integer
    INTO submission_count
  FROM public.competition_submissions
  WHERE competition_id = NEW.competition_id;

  showcase_ends_at := comp.voting_started_at + make_interval(secs => GREATEST(submission_count, 0) * 15);

  IF now() < showcase_ends_at THEN
    RAISE EXCEPTION 'Voting opens after the showcase ends';
  END IF;

  IF comp.voting_deadline IS NULL OR now() >= comp.voting_deadline THEN
    RAISE EXCEPTION 'Voting is closed for this competition';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_competition_vote_window ON public.competition_votes;
CREATE TRIGGER trg_validate_competition_vote_window
  BEFORE INSERT OR UPDATE ON public.competition_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_competition_vote_window();

DROP POLICY IF EXISTS "Users cast their own vote" ON public.competition_votes;
CREATE POLICY "Users cast their own vote"
  ON public.competition_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = voter_id
    AND EXISTS (
      SELECT 1
      FROM public.competitions c
      WHERE c.id = competition_id
        AND c.status = 'voting'
        AND c.voting_started_at IS NOT NULL
        AND now() >= (
          c.voting_started_at + make_interval(secs => (
            SELECT COUNT(*)::integer * 15
            FROM public.competition_submissions cs
            WHERE cs.competition_id = c.id
          ))
        )
        AND c.voting_deadline IS NOT NULL
        AND now() < c.voting_deadline
    )
    AND EXISTS (
      SELECT 1
      FROM public.competition_submissions s
      WHERE s.id = submission_id
        AND s.competition_id = competition_id
        AND s.user_id <> auth.uid()
    )
  );

-- ── migration: 20260501054518_0ddedfa2-3be1-4ead-9474-4f36c96c18d4.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  comp RECORD;
  top_votes integer;
  submission_count integer;
  total_votes integer;
  requester uuid := auth.uid();
  winners_marked integer := 0;
  v_showcase_seconds integer;
  v_showcase_ends timestamptz;
BEGIN
  SELECT id, status, deadline, voting_started_at, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN RETURN false; END IF;
  IF requester IS NULL THEN RETURN false; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = p_competition_id AND c.creator_id = requester
  ) AND NOT EXISTS (
    SELECT 1 FROM public.competition_participants cp
    WHERE cp.competition_id = p_competition_id AND cp.user_id = requester
  ) THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)::integer, COALESCE(SUM(COALESCE(vote_count, 0)), 0)::integer
    INTO submission_count, total_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  -- Showcase = 15s per submission. Voting window after showcase = 3 minutes.
  v_showcase_seconds := GREATEST(submission_count, 0) * 15;

  -- Move expired live → voting (or close if no submissions)
  IF comp.status = 'live' AND comp.deadline IS NOT NULL AND comp.deadline <= now() THEN
    IF submission_count = 0 THEN
      UPDATE public.competitions
      SET status = 'closed', updated_at = now()
      WHERE id = p_competition_id AND status = 'live';
      RETURN true;
    END IF;

    UPDATE public.competitions
    SET status = 'voting',
        voting_started_at = COALESCE(voting_started_at, now()),
        voting_deadline = COALESCE(
          voting_deadline,
          now() + make_interval(secs => v_showcase_seconds) + interval '3 minutes'
        ),
        updated_at = now()
    WHERE id = p_competition_id AND status = 'live';
    RETURN true;
  END IF;

  IF comp.status <> 'voting' THEN
    RETURN false;
  END IF;

  v_showcase_ends := COALESCE(comp.voting_started_at, now()) + make_interval(secs => v_showcase_seconds);

  -- No winner reveal before the showcase ends. After that, finish only when all
  -- possible votes are in or the full 3-minute voting window has expired.
  IF NOT (
    submission_count = 0
    OR (
      now() >= v_showcase_ends
      AND (
        total_votes >= submission_count
        OR (comp.voting_deadline IS NOT NULL AND comp.voting_deadline <= now())
      )
    )
  ) THEN
    RETURN false;
  END IF;

  SELECT MAX(COALESCE(vote_count, 0)) INTO top_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  IF top_votes IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (COALESCE(vote_count, 0) = top_votes),
        winner_place = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;

    GET DIAGNOSTICS winners_marked = ROW_COUNT;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winners_marked > 0 THEN 'completed' ELSE 'closed' END,
      updated_at = now()
  WHERE id = p_competition_id AND status = 'voting';

  PERFORM public.award_competition_rewards(p_competition_id);

  RETURN true;
END;
$function$;

-- ── migration: 20260501054925_63e41fe5-17e2-451d-8935-f2293f22b87b.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  comp RECORD;
  top_votes integer;
  submission_count integer;
  total_votes integer;
  requester uuid := auth.uid();
  winners_marked integer := 0;
  v_showcase_seconds integer;
  v_showcase_ends timestamptz;
BEGIN
  SELECT id, status, deadline, voting_started_at, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN RETURN false; END IF;
  IF requester IS NULL THEN RETURN false; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = p_competition_id AND c.creator_id = requester
  ) AND NOT EXISTS (
    SELECT 1 FROM public.competition_participants cp
    WHERE cp.competition_id = p_competition_id AND cp.user_id = requester
  ) THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)::integer, COALESCE(SUM(COALESCE(vote_count, 0)), 0)::integer
    INTO submission_count, total_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  v_showcase_seconds := GREATEST(submission_count, 0) * 15;

  IF comp.status = 'live' AND comp.deadline IS NOT NULL AND comp.deadline <= now() THEN
    IF submission_count = 0 THEN
      UPDATE public.competitions
      SET status = 'closed', updated_at = now()
      WHERE id = p_competition_id AND status = 'live';
      RETURN true;
    END IF;

    UPDATE public.competitions
    SET status = 'voting',
        voting_started_at = COALESCE(voting_started_at, now()),
        voting_deadline = COALESCE(
          voting_deadline,
          now() + make_interval(secs => v_showcase_seconds) + interval '3 minutes'
        ),
        updated_at = now()
    WHERE id = p_competition_id AND status = 'live';
    RETURN true;
  END IF;

  IF comp.status <> 'voting' THEN
    RETURN false;
  END IF;

  v_showcase_ends := COALESCE(comp.voting_started_at, now()) + make_interval(secs => v_showcase_seconds);

  IF NOT (
    submission_count = 0
    OR (
      now() >= v_showcase_ends
      AND (
        submission_count = 1
        OR total_votes >= submission_count
        OR (comp.voting_deadline IS NOT NULL AND comp.voting_deadline <= now())
      )
    )
  ) THEN
    RETURN false;
  END IF;

  SELECT MAX(COALESCE(vote_count, 0)) INTO top_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  IF top_votes IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (COALESCE(vote_count, 0) = top_votes),
        winner_place = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;

    GET DIAGNOSTICS winners_marked = ROW_COUNT;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winners_marked > 0 THEN 'completed' ELSE 'closed' END,
      updated_at = now()
  WHERE id = p_competition_id AND status = 'voting';

  PERFORM public.award_competition_rewards(p_competition_id);

  RETURN true;
END;
$function$;

-- ── migration: 20260501063408_8b192747-0c5a-4917-8a23-d28a0c64a884.sql ─────────────────────────────────────────
-- 1) Add guest-tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prompted_for_password_at timestamptz;

-- 2) Replace handle_new_user to support anonymous signups (no email)
--    and to guarantee a unique username even when metadata collides.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  chosen_username text;
  base_username   text;
  candidate       text;
  attempts        int := 0;
  is_anon         boolean;
BEGIN
  is_anon := COALESCE((NEW.raw_app_meta_data ->> 'provider') = 'anonymous', false)
             OR NEW.is_anonymous IS TRUE
             OR NEW.email IS NULL;

  -- Prefer explicit username from signup metadata
  chosen_username := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'username'), '');

  -- Fallback base
  IF chosen_username IS NULL THEN
    IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
      base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
    ELSE
      base_username := 'guest';
    END IF;
    chosen_username := base_username;
  END IF;

  -- Sanitize to allowed charset
  chosen_username := REGEXP_REPLACE(chosen_username, '[^a-zA-Z0-9_]', '', 'g');
  IF chosen_username = '' OR chosen_username IS NULL THEN
    chosen_username := 'guest';
  END IF;

  -- Ensure uniqueness (case-insensitive). If collision, append short suffix.
  candidate := chosen_username;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(candidate)
  ) LOOP
    attempts := attempts + 1;
    candidate := chosen_username || '_' || SUBSTR(MD5(RANDOM()::text || NEW.id::text || attempts::text), 1, 4);
    EXIT WHEN attempts > 12;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    email,
    username,
    display_name,
    created_at,
    updated_at,
    xp,
    level,
    league,
    onboarding_completed,
    username_changed_at,
    is_guest
  )
  VALUES (
    NEW.id,
    NEW.email,
    candidate,
    candidate,
    NOW(),
    NOW(),
    0,
    1,
    'open',
    is_anon,           -- anon users are pre-onboarded, they're already in
    NULL,
    is_anon
  );

  RETURN NEW;
END;
$function$;

-- 3) Helper the app calls after the guest sets a real password (and optionally email)
CREATE OR REPLACE FUNCTION public.mark_account_converted()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET is_guest = false,
      onboarding_completed = true,
      updated_at = now()
  WHERE id = auth.uid();
$$;

-- 4) Helper to bump the prompted-at timestamp (used to space out nudges)
CREATE OR REPLACE FUNCTION public.mark_password_prompted()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET prompted_for_password_at = now()
  WHERE id = auth.uid();
$$;

-- 5) Allow authenticated users (incl. anon) to call the helpers
GRANT EXECUTE ON FUNCTION public.mark_account_converted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_password_prompted() TO authenticated;

-- ── migration: 20260501065653_bf42b14b-b1ac-49ff-a4d5-49875ef8e897.sql ─────────────────────────────────────────

-- ─── Battle showcase + judging deadline + public vote fallback ─────────
ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS showcase_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS judging_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_vote_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_vote_deadline TIMESTAMPTZ;

-- When both edits are submitted, kick off the showcase clock and the 30-min judge window
CREATE OR REPLACE FUNCTION public.start_battle_showcase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.challenger_submitted_at IS NOT NULL
     AND NEW.opponent_submitted_at IS NOT NULL
     AND NEW.showcase_started_at IS NULL
     AND NEW.status IN ('active','judging')
  THEN
    NEW.showcase_started_at := now();
    NEW.judging_deadline   := now() + interval '30 minutes';
    NEW.status             := 'judging';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_start_battle_showcase ON public.battles;
CREATE TRIGGER trg_start_battle_showcase
BEFORE UPDATE ON public.battles
FOR EACH ROW
EXECUTE FUNCTION public.start_battle_showcase();

-- Finalize a battle whose timers have expired:
--   • If 30-min judge window passed and no judge verdict → open 15-min public vote
--   • If 15-min public vote window passed → declare winner by community votes
CREATE OR REPLACE FUNCTION public.finalize_battle_if_expired(p_battle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b RECORD;
  v_winner uuid;
BEGIN
  SELECT * INTO b FROM public.battles WHERE id = p_battle_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Step 1: judge window expired → open public vote
  IF b.status = 'judging'
     AND b.judged_at IS NULL
     AND b.judging_deadline IS NOT NULL
     AND now() >= b.judging_deadline
     AND b.public_vote_started_at IS NULL
  THEN
    UPDATE public.battles
       SET public_vote_started_at = now(),
           public_vote_deadline   = now() + interval '15 minutes'
     WHERE id = p_battle_id;
    RETURN;
  END IF;

  -- Step 2: public vote window expired → finalize by votes
  IF b.status = 'judging'
     AND b.judged_at IS NULL
     AND b.public_vote_deadline IS NOT NULL
     AND now() >= b.public_vote_deadline
  THEN
    IF b.challenger_votes > b.opponent_votes THEN
      v_winner := b.challenger_id;
    ELSIF b.opponent_votes > b.challenger_votes THEN
      v_winner := b.opponent_id;
    ELSE
      -- Tie → challenger wins (defender's-advantage off; pick deterministic side)
      v_winner := b.challenger_id;
    END IF;

    UPDATE public.battles
       SET winner_id            = v_winner,
           challenger_score     = b.challenger_votes,
           opponent_score       = b.opponent_votes,
           judge_notes          = 'Decided by public vote',
           judged_at            = now(),
           status               = 'completed'
     WHERE id = p_battle_id;
  END IF;
END;
$$;


-- ── migration: 20260501070749_340faf81-92f8-4623-847a-8290e1659ff6.sql ─────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'battle-edits',
  'battle-edits',
  true,
  209715200, -- 200 MB
  ARRAY['video/mp4','video/quicktime','video/webm','video/x-m4v','image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
DROP POLICY IF EXISTS "battle_edits_public_read" ON storage.objects;
CREATE POLICY "battle_edits_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'battle-edits');

-- Anyone (incl. anon/guests) can upload
DROP POLICY IF EXISTS "battle_edits_any_upload" ON storage.objects;
CREATE POLICY "battle_edits_any_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'battle-edits');


-- ── migration: 20260501235512_1d5b8931-c617-4afc-aec9-2b192e9e8ea9.sql ─────────────────────────────────────────
-- Public spectator chat for quick fights (separate from participant battle chat)
CREATE TABLE IF NOT EXISTS public.quick_fight_public_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qf_public_messages_fight ON public.quick_fight_public_messages(fight_id, created_at);

ALTER TABLE public.quick_fight_public_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public quick fight messages"
ON public.quick_fight_public_messages
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post public quick fight messages"
ON public.quick_fight_public_messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND length(message_text) BETWEEN 1 AND 500);

ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_fight_public_messages;

-- ── migration: 20260504154423_8f8e97d9-96bc-4b56-b426-c0b765e893e6.sql ─────────────────────────────────────────

-- Scenepack pool (curated)
CREATE TABLE public.scenepack_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  series text,
  preview_video_url text,
  thumbnail_url text,
  scenepack_youtube_url text,
  scenepack_gdrive_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scenepack_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scenepack_pool readable by all" ON public.scenepack_pool FOR SELECT USING (true);
CREATE POLICY "scenepack_pool admin write" ON public.scenepack_pool FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Battle columns
ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS scenepack_option_a_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_option_b_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_vote_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS scenepack_vote_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS challenger_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS opponent_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS scenepack_locked_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url text,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url text,
  ADD COLUMN IF NOT EXISTS scenepack_url text;

ALTER TABLE public.cash_battles
  ADD COLUMN IF NOT EXISTS scenepack_option_a_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_option_b_id uuid REFERENCES public.scenepack_pool(id),
  ADD COLUMN IF NOT EXISTS scenepack_vote_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS scenepack_vote_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS challenger_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS opponent_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS scenepack_locked_id uuid REFERENCES public.scenepack_pool(id);

-- Helper: pick 2 random active scenepacks
CREATE OR REPLACE FUNCTION public.pick_random_scenepack_pair()
RETURNS TABLE (a uuid, b uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE picked uuid[];
BEGIN
  SELECT array_agg(id) INTO picked FROM (
    SELECT id FROM public.scenepack_pool WHERE active = true ORDER BY random() LIMIT 2
  ) s;
  IF picked IS NULL OR array_length(picked, 1) < 2 THEN
    RETURN;
  END IF;
  a := picked[1]; b := picked[2];
  RETURN NEXT;
END;
$$;

-- Resolve vote: pick winner, copy URLs onto battle row
CREATE OR REPLACE FUNCTION public.resolve_scenepack_vote(p_battle_id uuid, p_is_cash boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_a uuid; v_b uuid; v_ca uuid; v_op uuid; v_locked uuid; v_winner uuid;
  v_ct_a int := 0; v_ct_b int := 0;
  v_yt text; v_gd text; v_pv text;
BEGIN
  IF p_is_cash THEN
    SELECT scenepack_option_a_id, scenepack_option_b_id, challenger_scenepack_vote, opponent_scenepack_vote, scenepack_locked_id
      INTO v_a, v_b, v_ca, v_op, v_locked FROM public.cash_battles WHERE id = p_battle_id FOR UPDATE;
  ELSE
    SELECT scenepack_option_a_id, scenepack_option_b_id, challenger_scenepack_vote, opponent_scenepack_vote, scenepack_locked_id
      INTO v_a, v_b, v_ca, v_op, v_locked FROM public.battles WHERE id = p_battle_id FOR UPDATE;
  END IF;

  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF v_a IS NULL OR v_b IS NULL THEN RETURN NULL; END IF;

  IF v_ca = v_a THEN v_ct_a := v_ct_a + 1; ELSIF v_ca = v_b THEN v_ct_b := v_ct_b + 1; END IF;
  IF v_op = v_a THEN v_ct_a := v_ct_a + 1; ELSIF v_op = v_b THEN v_ct_b := v_ct_b + 1; END IF;

  IF v_ct_a > v_ct_b THEN
    v_winner := v_a;
  ELSIF v_ct_b > v_ct_a THEN
    v_winner := v_b;
  ELSE
    -- tie (0-0 or 1-1): coin flip
    v_winner := CASE WHEN random() < 0.5 THEN v_a ELSE v_b END;
  END IF;

  SELECT scenepack_youtube_url, scenepack_gdrive_url, preview_video_url
    INTO v_yt, v_gd, v_pv FROM public.scenepack_pool WHERE id = v_winner;

  IF p_is_cash THEN
    UPDATE public.cash_battles SET
      scenepack_locked_id = v_winner,
      scenepack_youtube_url = v_yt,
      scenepack_gdrive_url = v_gd,
      scenepack_url = COALESCE(v_yt, v_gd, v_pv)
    WHERE id = p_battle_id;
  ELSE
    UPDATE public.battles SET
      scenepack_locked_id = v_winner,
      scenepack_youtube_url = v_yt,
      scenepack_gdrive_url = v_gd,
      scenepack_url = COALESCE(v_yt, v_gd, v_pv)
    WHERE id = p_battle_id;
  END IF;

  RETURN v_winner;
END;
$$;

-- Cast vote and auto-resolve if both voted or deadline passed
CREATE OR REPLACE FUNCTION public.cast_scenepack_vote(p_battle_id uuid, p_scenepack_id uuid, p_is_cash boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_challenger uuid; v_opponent uuid; v_a uuid; v_b uuid;
  v_ca uuid; v_op uuid; v_deadline timestamptz; v_locked uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  IF p_is_cash THEN
    SELECT challenger_id, opponent_id, scenepack_option_a_id, scenepack_option_b_id, challenger_scenepack_vote, opponent_scenepack_vote, scenepack_vote_deadline, scenepack_locked_id
      INTO v_challenger, v_opponent, v_a, v_b, v_ca, v_op, v_deadline, v_locked FROM public.cash_battles WHERE id = p_battle_id FOR UPDATE;
  ELSE
    SELECT challenger_id, opponent_id, scenepack_option_a_id, scenepack_option_b_id, challenger_scenepack_vote, opponent_scenepack_vote, scenepack_vote_deadline, scenepack_locked_id
      INTO v_challenger, v_opponent, v_a, v_b, v_ca, v_op, v_deadline, v_locked FROM public.battles WHERE id = p_battle_id FOR UPDATE;
  END IF;

  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF p_scenepack_id NOT IN (v_a, v_b) THEN RAISE EXCEPTION 'invalid pick'; END IF;
  IF v_user NOT IN (v_challenger, v_opponent) THEN RAISE EXCEPTION 'not a participant'; END IF;

  IF v_user = v_challenger THEN
    v_ca := p_scenepack_id;
    IF p_is_cash THEN UPDATE public.cash_battles SET challenger_scenepack_vote = p_scenepack_id WHERE id = p_battle_id;
    ELSE UPDATE public.battles SET challenger_scenepack_vote = p_scenepack_id WHERE id = p_battle_id; END IF;
  ELSE
    v_op := p_scenepack_id;
    IF p_is_cash THEN UPDATE public.cash_battles SET opponent_scenepack_vote = p_scenepack_id WHERE id = p_battle_id;
    ELSE UPDATE public.battles SET opponent_scenepack_vote = p_scenepack_id WHERE id = p_battle_id; END IF;
  END IF;

  -- both voted? resolve now
  IF v_ca IS NOT NULL AND v_op IS NOT NULL THEN
    RETURN public.resolve_scenepack_vote(p_battle_id, p_is_cash);
  END IF;

  -- deadline passed? resolve
  IF v_deadline IS NOT NULL AND now() >= v_deadline THEN
    RETURN public.resolve_scenepack_vote(p_battle_id, p_is_cash);
  END IF;

  RETURN NULL;
END;
$$;

-- Public function to resolve if expired (any spectator can poke it)
CREATE OR REPLACE FUNCTION public.resolve_scenepack_if_expired(p_battle_id uuid, p_is_cash boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_deadline timestamptz; v_locked uuid;
BEGIN
  IF p_is_cash THEN
    SELECT scenepack_vote_deadline, scenepack_locked_id INTO v_deadline, v_locked FROM public.cash_battles WHERE id = p_battle_id;
  ELSE
    SELECT scenepack_vote_deadline, scenepack_locked_id INTO v_deadline, v_locked FROM public.battles WHERE id = p_battle_id;
  END IF;
  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF v_deadline IS NULL OR now() < v_deadline THEN RETURN NULL; END IF;
  RETURN public.resolve_scenepack_vote(p_battle_id, p_is_cash);
END;
$$;

-- Trigger: when battle becomes active, assign 2 random scenepacks + 30s deadline
CREATE OR REPLACE FUNCTION public.trg_assign_scenepack_options()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pair record;
BEGIN
  IF NEW.scenepack_option_a_id IS NOT NULL THEN RETURN NEW; END IF;
  IF (TG_TABLE_NAME = 'battles' AND NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active'))
     OR (TG_TABLE_NAME = 'cash_battles' AND NEW.status IN ('live','active') AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      NEW.scenepack_option_a_id := v_pair.a;
      NEW.scenepack_option_b_id := v_pair.b;
      NEW.scenepack_vote_started_at := now();
      NEW.scenepack_vote_deadline := now() + interval '30 seconds';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_scenepack_battles ON public.battles;
CREATE TRIGGER trg_assign_scenepack_battles
  BEFORE UPDATE ON public.battles
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_options();

DROP TRIGGER IF EXISTS trg_assign_scenepack_cash_battles ON public.cash_battles;
CREATE TRIGGER trg_assign_scenepack_cash_battles
  BEFORE UPDATE ON public.cash_battles
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_options();

-- Storage bucket for preview clips
INSERT INTO storage.buckets (id, name, public) VALUES ('scenepack-previews', 'scenepack-previews', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "scenepack-previews public read" ON storage.objects;
CREATE POLICY "scenepack-previews public read" ON storage.objects FOR SELECT USING (bucket_id = 'scenepack-previews');
DROP POLICY IF EXISTS "scenepack-previews admin write" ON storage.objects;
CREATE POLICY "scenepack-previews admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'scenepack-previews' AND has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.scenepack_pool;


-- ── migration: 20260504160719_620e4319-92f9-4c75-9c1e-43184ae0a195.sql ─────────────────────────────────────────
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS payout_display_override text;

-- ── migration: 20260504160748_305fbde5-046c-4329-a01b-141d0efd8fc2.sql ─────────────────────────────────────────
UPDATE public.missions
SET base_payout_cents = 1000,
    payout_display_override = '$10–15 per edit',
    base_payout_requirements = E'You qualify if either:\n\n• We''ve already reached out to you directly, OR\n• You make edits featuring any of these characters:\n   – Suguru Geto (Jujutsu Kaisen)\n   – Aki Hayakawa (Chainsaw Man)\n   – Light Yagami (Death Note)\n   – Fyodor Dostoevsky (Bungo Stray Dogs)\n\nOr more broadly — you make dark / alt-style anime edits.'
WHERE id = '33d2f047-5b13-447b-81f0-b27af5351e4f';

-- ── migration: 20260504161946_36164dd5-0829-46ea-817b-fb5035a13df0.sql ─────────────────────────────────────────

ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS sound_url text;

UPDATE public.missions
SET sound_url = 'https://vt.tiktok.com/ZS9FR5LegKk9r-r67v7/'
WHERE title ILIKE '%FIX MY SOUL%';


-- ── migration: 20260504172408_e3e09b5c-d241-43c0-a344-d28983e43e5e.sql ─────────────────────────────────────────

-- Add INSERT triggers so battles created already-active get scenepack options
CREATE OR REPLACE FUNCTION public.trg_assign_scenepack_options()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pair record; v_should boolean := false;
BEGIN
  IF NEW.scenepack_option_a_id IS NOT NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF (TG_TABLE_NAME = 'battles' AND NEW.status = 'active')
       OR (TG_TABLE_NAME = 'cash_battles' AND NEW.status IN ('live','active')) THEN
      v_should := true;
    END IF;
  ELSE
    IF (TG_TABLE_NAME = 'battles' AND NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active'))
       OR (TG_TABLE_NAME = 'cash_battles' AND NEW.status IN ('live','active') AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
      v_should := true;
    END IF;
  END IF;

  IF v_should THEN
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      NEW.scenepack_option_a_id := v_pair.a;
      NEW.scenepack_option_b_id := v_pair.b;
      NEW.scenepack_vote_started_at := now();
      NEW.scenepack_vote_deadline := now() + interval '30 seconds';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_scenepack_battles_ins ON public.battles;
CREATE TRIGGER trg_assign_scenepack_battles_ins
  BEFORE INSERT ON public.battles
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_options();

DROP TRIGGER IF EXISTS trg_assign_scenepack_cash_battles_ins ON public.cash_battles;
CREATE TRIGGER trg_assign_scenepack_cash_battles_ins
  BEFORE INSERT ON public.cash_battles
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_options();

-- Backfill: assign options + fresh 30s window to active battles missing them
DO $$
DECLARE r record; v_pair record;
BEGIN
  FOR r IN SELECT id FROM public.battles WHERE status='active' AND scenepack_option_a_id IS NULL AND scenepack_locked_id IS NULL LOOP
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      UPDATE public.battles SET
        scenepack_option_a_id = v_pair.a,
        scenepack_option_b_id = v_pair.b,
        scenepack_vote_started_at = now(),
        scenepack_vote_deadline = now() + interval '30 seconds'
      WHERE id = r.id;
    END IF;
  END LOOP;

  FOR r IN SELECT id FROM public.cash_battles WHERE status IN ('live','active') AND scenepack_option_a_id IS NULL AND scenepack_locked_id IS NULL LOOP
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      UPDATE public.cash_battles SET
        scenepack_option_a_id = v_pair.a,
        scenepack_option_b_id = v_pair.b,
        scenepack_vote_started_at = now(),
        scenepack_vote_deadline = now() + interval '30 seconds'
      WHERE id = r.id;
    END IF;
  END LOOP;
END $$;


-- ── migration: 20260504175501_d93d0df1-23f2-44f6-bf81-40f83be93484.sql ─────────────────────────────────────────

-- 1) Add scenepack columns to quick_fights
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS scenepack_option_a_id uuid,
  ADD COLUMN IF NOT EXISTS scenepack_option_b_id uuid,
  ADD COLUMN IF NOT EXISTS scenepack_vote_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS scenepack_vote_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS player_1_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS player_2_scenepack_vote uuid,
  ADD COLUMN IF NOT EXISTS scenepack_locked_id uuid,
  ADD COLUMN IF NOT EXISTS scenepack_youtube_url text,
  ADD COLUMN IF NOT EXISTS scenepack_gdrive_url text;

-- 2) Lower default Edit Battle duration to 60 min (1 hour)
ALTER TABLE public.quick_fights ALTER COLUMN duration_minutes SET DEFAULT 60;

-- 3) Trigger: assign 30s vote when a quick_fight is created (already active)
CREATE OR REPLACE FUNCTION public.trg_assign_scenepack_quick_fight()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pair record;
BEGIN
  IF NEW.scenepack_option_a_id IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.player_2_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('active','live','pending') THEN RETURN NEW; END IF;

  SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
  IF v_pair.a IS NOT NULL THEN
    NEW.scenepack_option_a_id := v_pair.a;
    NEW.scenepack_option_b_id := v_pair.b;
    NEW.scenepack_vote_started_at := now();
    NEW.scenepack_vote_deadline := now() + interval '30 seconds';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_scenepack_qf_ins ON public.quick_fights;
CREATE TRIGGER trg_assign_scenepack_qf_ins
  BEFORE INSERT ON public.quick_fights
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_scenepack_quick_fight();

-- 4) Resolve scenepack vote for a quick_fight
CREATE OR REPLACE FUNCTION public.resolve_scenepack_vote_quick_fight(p_fight_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_a uuid; v_b uuid; v_p1 uuid; v_p2 uuid; v_locked uuid; v_winner uuid;
  v_ct_a int := 0; v_ct_b int := 0;
  v_yt text; v_gd text;
BEGIN
  SELECT scenepack_option_a_id, scenepack_option_b_id, player_1_scenepack_vote, player_2_scenepack_vote, scenepack_locked_id
    INTO v_a, v_b, v_p1, v_p2, v_locked FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;

  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF v_a IS NULL OR v_b IS NULL THEN RETURN NULL; END IF;

  IF v_p1 = v_a THEN v_ct_a := v_ct_a + 1; ELSIF v_p1 = v_b THEN v_ct_b := v_ct_b + 1; END IF;
  IF v_p2 = v_a THEN v_ct_a := v_ct_a + 1; ELSIF v_p2 = v_b THEN v_ct_b := v_ct_b + 1; END IF;

  IF v_ct_a > v_ct_b THEN v_winner := v_a;
  ELSIF v_ct_b > v_ct_a THEN v_winner := v_b;
  ELSE v_winner := CASE WHEN random() < 0.5 THEN v_a ELSE v_b END;
  END IF;

  SELECT scenepack_youtube_url, scenepack_gdrive_url INTO v_yt, v_gd FROM public.scenepack_pool WHERE id = v_winner;

  UPDATE public.quick_fights
     SET scenepack_locked_id = v_winner,
         scenepack_youtube_url = COALESCE(scenepack_youtube_url, v_yt),
         scenepack_gdrive_url = COALESCE(scenepack_gdrive_url, v_gd)
   WHERE id = p_fight_id;

  RETURN v_winner;
END;
$$;

-- 5) Cast vote for quick_fight
CREATE OR REPLACE FUNCTION public.cast_scenepack_vote_quick_fight(p_fight_id uuid, p_scenepack_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_p1 uuid; v_p2 uuid; v_a uuid; v_b uuid;
  v_v1 uuid; v_v2 uuid; v_deadline timestamptz; v_locked uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT player_1_id, player_2_id, scenepack_option_a_id, scenepack_option_b_id,
         player_1_scenepack_vote, player_2_scenepack_vote, scenepack_vote_deadline, scenepack_locked_id
    INTO v_p1, v_p2, v_a, v_b, v_v1, v_v2, v_deadline, v_locked
    FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;

  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF p_scenepack_id NOT IN (v_a, v_b) THEN RAISE EXCEPTION 'invalid pick'; END IF;
  IF v_user NOT IN (v_p1, v_p2) THEN RAISE EXCEPTION 'not a participant'; END IF;

  IF v_user = v_p1 THEN
    v_v1 := p_scenepack_id;
    UPDATE public.quick_fights SET player_1_scenepack_vote = p_scenepack_id WHERE id = p_fight_id;
  ELSE
    v_v2 := p_scenepack_id;
    UPDATE public.quick_fights SET player_2_scenepack_vote = p_scenepack_id WHERE id = p_fight_id;
  END IF;

  IF v_v1 IS NOT NULL AND v_v2 IS NOT NULL THEN
    RETURN public.resolve_scenepack_vote_quick_fight(p_fight_id);
  END IF;
  IF v_deadline IS NOT NULL AND now() >= v_deadline THEN
    RETURN public.resolve_scenepack_vote_quick_fight(p_fight_id);
  END IF;
  RETURN NULL;
END;
$$;

-- 6) Resolve-if-expired helper
CREATE OR REPLACE FUNCTION public.resolve_scenepack_if_expired_quick_fight(p_fight_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_deadline timestamptz; v_locked uuid;
BEGIN
  SELECT scenepack_vote_deadline, scenepack_locked_id INTO v_deadline, v_locked FROM public.quick_fights WHERE id = p_fight_id;
  IF v_locked IS NOT NULL THEN RETURN v_locked; END IF;
  IF v_deadline IS NULL OR now() < v_deadline THEN RETURN NULL; END IF;
  RETURN public.resolve_scenepack_vote_quick_fight(p_fight_id);
END;
$$;

-- 7) Backfill any in-flight active Edit Battles missing a vote
DO $$
DECLARE r record; v_pair record;
BEGIN
  FOR r IN SELECT id FROM public.quick_fights
            WHERE status IN ('active','live','pending')
              AND scenepack_option_a_id IS NULL
              AND scenepack_locked_id IS NULL
              AND player_2_id IS NOT NULL
  LOOP
    SELECT * INTO v_pair FROM public.pick_random_scenepack_pair();
    IF v_pair.a IS NOT NULL THEN
      UPDATE public.quick_fights SET
        scenepack_option_a_id = v_pair.a,
        scenepack_option_b_id = v_pair.b,
        scenepack_vote_started_at = now(),
        scenepack_vote_deadline = now() + interval '30 seconds'
      WHERE id = r.id;
    END IF;
  END LOOP;
END $$;


-- ── migration: 20260504180928_28d2989a-96d2-48b8-afc8-41fe8f89a029.sql ─────────────────────────────────────────

-- Update default duration on quick_fights table
ALTER TABLE public.quick_fights ALTER COLUMN duration_minutes SET DEFAULT 60;

-- Rewrite quick_fight_match to use 1 hour
CREATE OR REPLACE FUNCTION public.quick_fight_match(p_user_id uuid, p_username text, p_avatar_url text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  matched RECORD;
  new_fight_id UUID;
  starts TIMESTAMPTZ := now();
BEGIN
  DELETE FROM public.quick_fight_queue WHERE expires_at < now();

  SELECT * INTO matched
  FROM public.quick_fight_queue
  WHERE user_id != p_user_id
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF matched IS NULL THEN
    INSERT INTO public.quick_fight_queue (user_id, username, avatar_url)
    VALUES (p_user_id, p_username, p_avatar_url)
    ON CONFLICT (user_id) DO UPDATE
    SET username = p_username, avatar_url = p_avatar_url, queued_at = now(), expires_at = now() + INTERVAL '5 minutes';
    RETURN NULL;
  END IF;

  INSERT INTO public.quick_fights (
    player_1_id, player_1_username, player_1_avatar_url,
    player_2_id, player_2_username, player_2_avatar_url,
    status, matched_at, starts_at, ends_at, duration_minutes
  ) VALUES (
    matched.user_id, matched.username, matched.avatar_url,
    p_user_id, p_username, p_avatar_url,
    'active', starts, starts, starts + INTERVAL '1 hour', 60
  )
  RETURNING id INTO new_fight_id;

  DELETE FROM public.quick_fight_queue WHERE user_id IN (p_user_id, matched.user_id);

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (new_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have 1 hour to submit your edit.', true);

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (matched.user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || p_username || '!', jsonb_build_object('fight_id', new_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Quick Fight!', 'You''ve been matched vs @' || matched.username || '!', jsonb_build_object('fight_id', new_fight_id));

  RETURN new_fight_id;
END;
$function$;

-- Shorten existing in-flight fights still showing 3hr to 1hr from their start
UPDATE public.quick_fights
SET duration_minutes = 60,
    ends_at = COALESCE(starts_at, matched_at, created_at) + INTERVAL '1 hour'
WHERE status IN ('active', 'waiting')
  AND duration_minutes > 60;


-- ── migration: 20260504214451_31348898-5d0f-441e-92c3-55330bade298.sql ─────────────────────────────────────────

ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_battles_is_private ON public.battles(is_private);

DROP POLICY IF EXISTS "Anyone can view battles" ON public.battles;

CREATE POLICY "Public battles viewable, private only by judges or participants"
ON public.battles
FOR SELECT
USING (
  is_private = false
  OR auth.uid() = challenger_id
  OR auth.uid() = opponent_id
  OR auth.uid() = judge_id
  OR auth.uid() = requested_judge_id
  OR has_role(auth.uid(), 'judge'::app_role)
  OR has_role(auth.uid(), 'trial_judge'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'dev'::app_role)
);


-- ── migration: 20260504221330_4f1f46a1-7592-4e5f-b91f-071092fbccdb.sql ─────────────────────────────────────────
ALTER TABLE public.battles DROP CONSTRAINT IF EXISTS battles_duration_hours_check;
ALTER TABLE public.battles ALTER COLUMN duration_hours TYPE numeric USING duration_hours::numeric;
ALTER TABLE public.battles ADD CONSTRAINT battles_duration_hours_check CHECK (duration_hours = ANY (ARRAY[0.25, 0.5, 1, 2, 3, 24, 48, 72]::numeric[]));

-- ── migration: 20260505021210_c0bb9ee1-d67b-4023-b621-a416a3c7907d.sql ─────────────────────────────────────────
-- Allow battle participants to hide a battle from public carousels
-- Stats remain intact; the battle row stays in the database.

ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid;

CREATE INDEX IF NOT EXISTS idx_battles_hidden_at ON public.battles (hidden_at);

-- RPC so a participant can hide / unhide their battle even if RLS UPDATE is restricted
CREATE OR REPLACE FUNCTION public.toggle_battle_hidden(p_battle_id uuid, p_hide boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_challenger uuid;
  v_opponent uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT challenger_id, opponent_id
    INTO v_challenger, v_opponent
  FROM public.battles
  WHERE id = p_battle_id;

  IF v_challenger IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;

  IF v_uid <> v_challenger AND v_uid <> COALESCE(v_opponent, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RAISE EXCEPTION 'Only battle participants can hide this battle';
  END IF;

  IF p_hide THEN
    UPDATE public.battles
       SET hidden_at = now(), hidden_by = v_uid
     WHERE id = p_battle_id;
  ELSE
    -- Only the user who hid it (or the other participant) may unhide
    UPDATE public.battles
       SET hidden_at = NULL, hidden_by = NULL
     WHERE id = p_battle_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_battle_hidden(uuid, boolean) TO authenticated;

-- ── migration: 20260505034114_df98a427-6e6f-4da9-9d39-718e0b4da5ba.sql ─────────────────────────────────────────
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid;

CREATE INDEX IF NOT EXISTS idx_quick_fights_hidden_at ON public.quick_fights (hidden_at);

CREATE OR REPLACE FUNCTION public.toggle_quick_fight_hidden(p_fight_id uuid, p_hide boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_p1 uuid;
  v_p2 uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT player_1_id, player_2_id
    INTO v_p1, v_p2
  FROM public.quick_fights
  WHERE id = p_fight_id;

  IF v_p1 IS NULL THEN
    RAISE EXCEPTION 'Fight not found';
  END IF;

  IF v_uid <> v_p1 AND v_uid <> COALESCE(v_p2, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RAISE EXCEPTION 'Only fight participants can hide this fight';
  END IF;

  IF p_hide THEN
    UPDATE public.quick_fights
       SET hidden_at = now(), hidden_by = v_uid
     WHERE id = p_fight_id;
  ELSE
    UPDATE public.quick_fights
       SET hidden_at = NULL, hidden_by = NULL
     WHERE id = p_fight_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_quick_fight_hidden(uuid, boolean) TO authenticated;

-- ── migration: 20260506111934_c9992a65-01fe-409b-ab49-1c21728dd9fd.sql ─────────────────────────────────────────
CREATE TABLE public.mission_global_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 280),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mission_global_chat_created ON public.mission_global_chat(created_at DESC);

ALTER TABLE public.mission_global_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mission chat"
  ON public.mission_global_chat FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can post own messages"
  ON public.mission_global_chat FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.mission_global_chat FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.mission_global_chat;
ALTER TABLE public.mission_global_chat REPLICA IDENTITY FULL;

-- ── migration: 20260506115709_c99a85b7-e246-4653-813a-3ef3d0e0514e.sql ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_mission_leaderboard(_mission_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  total_cents bigint,
  posts bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ms.user_id,
    COALESCE(MAX(ms.username), 'editor') AS username,
    MAX(ms.avatar_url) AS avatar_url,
    SUM(ms.total_earned_cents)::bigint AS total_cents,
    COUNT(*)::bigint AS posts
  FROM public.mission_submissions ms
  WHERE ms.status = 'approved'
    AND ms.user_id IS NOT NULL
    AND (_mission_id IS NULL OR ms.mission_id = _mission_id)
  GROUP BY ms.user_id
  HAVING SUM(ms.total_earned_cents) > 0
  ORDER BY total_cents DESC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.get_mission_leaderboard(uuid) TO anon, authenticated;


-- ── migration: 20260506120233_25759105-aed9-4849-b07a-ce1a16c97069.sql ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_mission_leaderboard(_mission_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  total_cents bigint,
  posts bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      ms.user_id,
      SUM(ms.total_earned_cents)::bigint AS total_cents,
      COUNT(*)::bigint AS posts
    FROM public.mission_submissions ms
    WHERE ms.status = 'approved'
      AND ms.user_id IS NOT NULL
      AND (_mission_id IS NULL OR ms.mission_id = _mission_id)
    GROUP BY ms.user_id
    HAVING SUM(ms.total_earned_cents) > 0
  )
  SELECT
    a.user_id,
    COALESCE(
      NULLIF(u.raw_user_meta_data->>'username', ''),
      NULLIF(p.username, ''),
      'editor'
    ) AS username,
    p.avatar_url,
    a.total_cents,
    a.posts
  FROM agg a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  LEFT JOIN auth.users u ON u.id = a.user_id
  ORDER BY a.total_cents DESC
  LIMIT 100;
$$;


-- ── migration: 20260506121520_8c240b59-3537-4ba3-a4f9-96aa96251059.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_mission_leaderboard(_mission_id uuid DEFAULT NULL)
RETURNS TABLE(user_id uuid, username text, avatar_url text, total_cents bigint, posts bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    agg.user_id,
    COALESCE(
      NULLIF(u.raw_user_meta_data->>'username', ''),
      -- strip auto-generated _xxxx hex suffix from profile username
      regexp_replace(p.username, '_[a-f0-9]{4}$', ''),
      'editor'
    ) AS username,
    p.avatar_url,
    agg.total_cents,
    agg.posts
  FROM (
    SELECT ms.user_id,
           SUM(ms.total_earned_cents)::bigint AS total_cents,
           COUNT(*)::bigint AS posts
    FROM public.mission_submissions ms
    WHERE ms.status = 'approved'
      AND (_mission_id IS NULL OR ms.mission_id = _mission_id)
    GROUP BY ms.user_id
  ) agg
  LEFT JOIN public.profiles p ON p.id = agg.user_id
  LEFT JOIN auth.users u ON u.id = agg.user_id
  ORDER BY agg.total_cents DESC;
$$;

-- ── migration: 20260506134721_8332b7fb-dfb1-4469-81c3-9fb0fc6a29a5.sql ─────────────────────────────────────────
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- ── migration: 20260506161318_6a55e5cb-4a84-480a-ad01-0a0ced2eab70.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.join_waiting_quick_fight(
  p_fight_id uuid,
  p_user_id uuid,
  p_username text,
  p_avatar_url text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fight RECORD;
  starts timestamptz := now();
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO fight
  FROM public.quick_fights
  WHERE id = p_fight_id
  FOR UPDATE;

  IF fight IS NULL THEN
    RAISE EXCEPTION 'Lobby not found';
  END IF;

  IF fight.status <> 'waiting' OR fight.player_2_id IS NOT NULL THEN
    RAISE EXCEPTION 'Lobby is no longer open';
  END IF;

  IF fight.player_1_id = p_user_id THEN
    RAISE EXCEPTION 'Owner cannot join their own lobby';
  END IF;

  DELETE FROM public.quick_fight_queue WHERE user_id = p_user_id;

  UPDATE public.quick_fights
  SET
    player_2_id = p_user_id,
    player_2_username = p_username,
    player_2_avatar_url = p_avatar_url,
    status = 'active',
    matched_at = starts,
    starts_at = starts,
    ends_at = starts + interval '1 hour',
    duration_minutes = 60
  WHERE id = p_fight_id;

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (p_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have 1 hour to submit your edit.', true);

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (fight.player_1_id, 'quick_fight', '⚔️ Custom Lobby Joined!', '@' || p_username || ' joined your edit battle.', jsonb_build_object('fight_id', p_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Edit Battle Started!', 'You joined @' || fight.player_1_username || '''s edit battle.', jsonb_build_object('fight_id', p_fight_id));

  RETURN p_fight_id;
END;
$function$;

-- ── migration: 20260506172504_c3ed1354-504a-4bba-b7f6-a6a4e0eba168.sql ─────────────────────────────────────────

-- Add private lobby support to quick_fights
ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS join_code text;

CREATE INDEX IF NOT EXISTS idx_quick_fights_join_code ON public.quick_fights(join_code) WHERE join_code IS NOT NULL;

-- Helper to generate a short unique join code
CREATE OR REPLACE FUNCTION public.generate_quick_fight_join_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
  exists_already boolean;
BEGIN
  LOOP
    code := upper(substr(encode(gen_random_bytes(6), 'base64'), 1, 6));
    code := regexp_replace(code, '[^A-Z0-9]', '', 'g');
    IF length(code) < 6 THEN
      CONTINUE;
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.quick_fights WHERE join_code = code AND status = 'waiting') INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END;
$$;

-- Update join function to enforce private lobby code
CREATE OR REPLACE FUNCTION public.join_waiting_quick_fight(
  p_fight_id uuid,
  p_user_id uuid,
  p_username text,
  p_avatar_url text DEFAULT NULL::text,
  p_join_code text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fight RECORD;
  starts timestamptz := now();
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO fight
  FROM public.quick_fights
  WHERE id = p_fight_id
  FOR UPDATE;

  IF fight IS NULL THEN
    RAISE EXCEPTION 'Lobby not found';
  END IF;

  IF fight.status <> 'waiting' OR fight.player_2_id IS NOT NULL THEN
    RAISE EXCEPTION 'Lobby is no longer open';
  END IF;

  IF fight.player_1_id = p_user_id THEN
    RAISE EXCEPTION 'Owner cannot join their own lobby';
  END IF;

  IF fight.is_private THEN
    IF p_join_code IS NULL OR upper(trim(p_join_code)) <> fight.join_code THEN
      RAISE EXCEPTION 'Invalid join code';
    END IF;
  END IF;

  DELETE FROM public.quick_fight_queue WHERE user_id = p_user_id;

  UPDATE public.quick_fights
  SET
    player_2_id = p_user_id,
    player_2_username = p_username,
    player_2_avatar_url = p_avatar_url,
    status = 'active',
    matched_at = starts,
    starts_at = starts,
    ends_at = starts + interval '1 hour',
    duration_minutes = 60
  WHERE id = p_fight_id;

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (p_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have 1 hour to submit your edit.', true);

  RETURN p_fight_id;
END;
$function$;


-- ── migration: 20260507001515_80c739a6-e2ed-43ee-9120-e68c203d9fb7.sql ─────────────────────────────────────────
-- Campaign edit feedback (client thumbs up/down with optional reason)
CREATE TABLE public.campaign_edit_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edit_id UUID NOT NULL,
  campaign_id UUID,
  reaction TEXT NOT NULL CHECK (reaction IN ('up','down')),
  note TEXT,
  client_name TEXT,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_edit_feedback_edit ON public.campaign_edit_feedback(edit_id);
CREATE INDEX idx_campaign_edit_feedback_campaign ON public.campaign_edit_feedback(campaign_id);

ALTER TABLE public.campaign_edit_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone with portal link can submit feedback
CREATE POLICY "Anyone can submit campaign edit feedback"
ON public.campaign_edit_feedback
FOR INSERT
WITH CHECK (true);

-- Only admins can read feedback
CREATE POLICY "Admins can view all feedback"
ON public.campaign_edit_feedback
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update (mark reviewed)
CREATE POLICY "Admins can update feedback"
ON public.campaign_edit_feedback
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- ── migration: 20260507084128_eff0dfe5-1390-4486-b00e-055d0a7ae211.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_quick_fight_join_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  exists_count int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.quick_fights WHERE join_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$$;

-- ── migration: 20260507201655_87414655-b07c-4535-bfc6-29fe10814b04.sql ─────────────────────────────────────────
-- confirmed_at is a generated column; only set email_confirmed_at.

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email LIKE '%@loopgate.local'
  AND email_confirmed_at IS NULL;

CREATE OR REPLACE FUNCTION public.auto_confirm_placeholder_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.email IS NOT NULL
     AND NEW.email LIKE '%@loopgate.local'
     AND NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_placeholder_email ON auth.users;
CREATE TRIGGER trg_auto_confirm_placeholder_email
BEFORE INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_placeholder_email();

-- ── migration: 20260508075539_21010ca6-36a6-40d9-b30a-b4eb8216c02b.sql ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_start_full_competition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mins INTEGER;
BEGIN
  IF NEW.status = 'lobby' AND NEW.current_players >= NEW.max_players THEN
    mins := COALESCE(NEW.duration_minutes, 30);
    NEW.status := 'live';
    NEW.started_at := now();
    NEW.deadline := now() + (mins || ' minutes')::interval;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_start_full_competition ON public.competitions;
CREATE TRIGGER trg_auto_start_full_competition
BEFORE UPDATE OF current_players, max_players ON public.competitions
FOR EACH ROW
EXECUTE FUNCTION public.auto_start_full_competition();

-- Kick off n0va's Room and any other already-full lobbies
UPDATE public.competitions
SET status = 'live',
    started_at = now(),
    deadline = now() + (COALESCE(duration_minutes, 30) || ' minutes')::interval
WHERE status = 'lobby' AND current_players >= max_players;


-- ── migration: 20260508142544_2b7db968-4e0f-4410-9929-9f3da85684c1.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_global_rank(p_user_id uuid)
RETURNS TABLE(rank integer, total integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT
      COALESCE(global_index_score, 0) AS gis,
      COALESCE(best_gatekeeper_qoi, 0) AS bgq,
      COALESCE(level, 0) AS lvl,
      COALESCE(xp, 0) AS xp
    FROM public.profiles
    WHERE id = p_user_id AND is_hidden = false
  ),
  ahead AS (
    SELECT COUNT(*)::int AS c
    FROM public.profiles p, me
    WHERE p.is_hidden = false
      AND (
        COALESCE(p.global_index_score, 0) > me.gis
        OR (COALESCE(p.global_index_score, 0) = me.gis
            AND COALESCE(p.best_gatekeeper_qoi, 0) > me.bgq)
        OR (COALESCE(p.global_index_score, 0) = me.gis
            AND COALESCE(p.best_gatekeeper_qoi, 0) = me.bgq
            AND COALESCE(p.level, 0) > me.lvl)
        OR (COALESCE(p.global_index_score, 0) = me.gis
            AND COALESCE(p.best_gatekeeper_qoi, 0) = me.bgq
            AND COALESCE(p.level, 0) = me.lvl
            AND COALESCE(p.xp, 0) > me.xp)
      )
  ),
  total AS (
    SELECT COUNT(*)::int AS c FROM public.profiles WHERE is_hidden = false
  )
  SELECT (ahead.c + 1) AS rank, total.c AS total
  FROM ahead, total, me;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_global_rank(uuid) TO anon, authenticated;

-- ── migration: 20260509133943_8357ec39-531b-462f-b0d7-b806e6dfbb40.sql ─────────────────────────────────────────
CREATE POLICY "Host can kick participants" ON public.competition_participants FOR DELETE USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_participants.competition_id AND c.creator_id = auth.uid()));

-- ── migration: 20260509135355_06a612a5-de64-41b4-933f-803f14cd3fe6.sql ─────────────────────────────────────────

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS join_code text;

-- Tighten participant insert policy: private rooms can only be joined via RPC
DROP POLICY IF EXISTS "Authenticated users can join" ON public.competition_participants;
CREATE POLICY "Authenticated users can join"
ON public.competition_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = competition_id
      AND (c.is_private = false OR c.creator_id = auth.uid())
  )
);

-- RPC for joining a private competition with code
CREATE OR REPLACE FUNCTION public.join_private_competition(
  p_competition_id uuid,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_comp record;
  v_username text;
  v_avatar text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT id, is_private, join_code, creator_id, max_players, current_players, status
    INTO v_comp
    FROM public.competitions
    WHERE id = p_competition_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_comp.status NOT IN ('lobby', 'live') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'closed');
  END IF;

  IF v_comp.is_private = true
     AND v_comp.creator_id <> v_user
     AND (v_comp.join_code IS NULL OR upper(trim(p_code)) <> upper(trim(v_comp.join_code))) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  IF v_comp.current_players >= v_comp.max_players THEN
    RETURN jsonb_build_object('ok', false, 'error', 'full');
  END IF;

  -- Already joined? idempotent success
  IF EXISTS (SELECT 1 FROM public.competition_participants
             WHERE competition_id = p_competition_id AND user_id = v_user) THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  SELECT username, avatar_url INTO v_username, v_avatar
    FROM public.profiles WHERE id = v_user;

  INSERT INTO public.competition_participants (competition_id, user_id, username, avatar_url)
  VALUES (p_competition_id, v_user, COALESCE(v_username, 'editor'), v_avatar);

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_private_competition(uuid, text) TO authenticated;


-- ── migration: 20260509204419_b9682d6f-e364-4648-9b9f-5552ada67ccc.sql ─────────────────────────────────────────
INSERT INTO public.notifications (user_id, type, title, message, data)
SELECT
  u.id,
  'announcement',
  'LOOPGATE v1.1 — Lobby Refresh',
  'Cleaner competition lobbies, smarter matchmaking screen, and a live info ticker that walks you through how each battle starts. Mute remote editors in voice chat with a tap. Bolder fonts across the Arena.',
  jsonb_build_object(
    'version', '1.1',
    'kind', 'platform_update',
    'highlights', jsonb_build_array(
      'Live info ticker on every lobby header',
      'Mute or unmute any voice chat member with one tap',
      'Listen-only voice — no mic prompt until you Unmute',
      'Cleaner Competitions list — bolder, less clutter',
      'Matchmaking lobby redesigned with rotating tips'
    )
  )
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n
  WHERE n.user_id = u.id
    AND n.type = 'announcement'
    AND n.data->>'version' = '1.1'
);

-- ── migration: 20260509205840_115ab13a-52eb-4747-8cf1-4e2e1114fff5.sql ─────────────────────────────────────────
-- Community moderation: user reports for battles & competitions
CREATE TYPE public.report_reason AS ENUM ('cheating','toxicity','harassment','spam','impersonation','inappropriate_content','other');
CREATE TYPE public.report_context AS ENUM ('battle','competition','submission','profile','chat','other');
CREATE TYPE public.report_status AS ENUM ('pending','reviewing','resolved','dismissed');

CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason public.report_reason NOT NULL,
  context public.report_context NOT NULL DEFAULT 'other',
  context_id TEXT,
  details TEXT,
  status public.report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_reports_no_self_report CHECK (reporter_id <> reported_user_id),
  CONSTRAINT user_reports_details_length CHECK (details IS NULL OR char_length(details) <= 2000)
);

CREATE INDEX idx_user_reports_reported ON public.user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status ON public.user_reports(status);
CREATE INDEX idx_user_reports_context ON public.user_reports(context, context_id);
-- Rate limit: 1 active pending report per reporter per target per context
CREATE UNIQUE INDEX idx_user_reports_unique_pending
  ON public.user_reports(reporter_id, reported_user_id, context, COALESCE(context_id,''))
  WHERE status = 'pending';

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Reporters can create reports as themselves
CREATE POLICY "Users can file their own reports"
ON public.user_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Reporters can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.user_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

-- Admins can view & manage all reports (relies on existing has_role + app_role 'admin')
CREATE POLICY "Admins can view all reports"
ON public.user_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.user_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports"
ON public.user_reports FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER trg_user_reports_updated_at
BEFORE UPDATE ON public.user_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── migration: 20260510113913_62cd79ee-47e1-46c7-baa1-177d11e86019.sql ─────────────────────────────────────────

-- Auto-maintain missions.approved_count from mission_submissions
CREATE OR REPLACE FUNCTION public.recalc_mission_approved_count(_mission_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.missions m
  SET approved_count = (
    SELECT COUNT(*) FROM public.mission_submissions
    WHERE mission_id = _mission_id AND status = 'approved'
  )
  WHERE m.id = _mission_id;
$$;

CREATE OR REPLACE FUNCTION public.trg_mission_submissions_recalc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_mission_approved_count(OLD.mission_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_mission_approved_count(NEW.mission_id);
    IF TG_OP = 'UPDATE' AND NEW.mission_id <> OLD.mission_id THEN
      PERFORM public.recalc_mission_approved_count(OLD.mission_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS mission_submissions_recalc_count ON public.mission_submissions;
CREATE TRIGGER mission_submissions_recalc_count
AFTER INSERT OR UPDATE OF status, mission_id OR DELETE ON public.mission_submissions
FOR EACH ROW EXECUTE FUNCTION public.trg_mission_submissions_recalc();

-- Backfill existing data
UPDATE public.missions m
SET approved_count = COALESCE((
  SELECT COUNT(*) FROM public.mission_submissions s
  WHERE s.mission_id = m.id AND s.status = 'approved'
), 0);


-- ── migration: 20260510114627_be2e82fb-50b0-46f8-b262-735e39392a79.sql ─────────────────────────────────────────
-- Allow anyone (including guests) to read mission_submission rows for transparency counts
CREATE POLICY "Anyone can view mission submission counts"
ON public.mission_submissions
FOR SELECT
TO anon, authenticated
USING (true);


-- ── migration: 20260510171842_68feea9c-aac0-4a7d-958b-fa14bbdb4ede.sql ─────────────────────────────────────────
-- ============================================================
-- COLLABS MODE
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.collab_status AS ENUM (
    'open', 'paired', 'editing', 'pending_approval', 'live', 'rejected', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.collab_invite_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.collab_emoji AS ENUM ('fire', 'zap', 'diamond', 'crown', 'clapper');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLE: collab_slots
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collab_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  creator_username TEXT NOT NULL,
  creator_avatar_url TEXT,
  partner_id UUID,
  partner_username TEXT,
  partner_avatar_url TEXT,
  song_title TEXT NOT NULL,
  song_artist TEXT,
  song_url TEXT,
  total_duration_seconds INT NOT NULL DEFAULT 20,
  creator_segment TEXT NOT NULL,
  partner_segment TEXT NOT NULL,
  status public.collab_status NOT NULL DEFAULT 'open',
  final_video_url TEXT,
  uploaded_by UUID,
  creator_approved BOOLEAN NOT NULL DEFAULT FALSE,
  partner_approved BOOLEAN NOT NULL DEFAULT FALSE,
  reaction_score INT NOT NULL DEFAULT 0,
  total_reactions INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paired_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ,
  live_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_collab_slots_status ON public.collab_slots(status);
CREATE INDEX IF NOT EXISTS idx_collab_slots_creator ON public.collab_slots(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_slots_partner ON public.collab_slots(partner_id);
CREATE INDEX IF NOT EXISTS idx_collab_slots_live_at ON public.collab_slots(live_at DESC) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_collab_slots_score ON public.collab_slots(reaction_score DESC) WHERE status = 'live';

ALTER TABLE public.collab_slots ENABLE ROW LEVEL SECURITY;

-- Public can read live + open
CREATE POLICY "Anyone can view live or open collabs"
  ON public.collab_slots FOR SELECT
  USING (status IN ('live', 'open'));

-- Editors can see their own slots in any state
CREATE POLICY "Editors can view their own collab slots"
  ON public.collab_slots FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = partner_id);

-- Only auth users can create
CREATE POLICY "Authenticated users can create collab slots"
  ON public.collab_slots FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Either editor can update (joining, uploading, approving)
CREATE POLICY "Editors can update their collab slots"
  ON public.collab_slots FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = partner_id OR (status = 'open' AND auth.uid() IS NOT NULL))
  WITH CHECK (auth.uid() = creator_id OR auth.uid() = partner_id);

-- Creator can delete while open
CREATE POLICY "Creator can delete open slots"
  ON public.collab_slots FOR DELETE
  USING (auth.uid() = creator_id AND status = 'open');

-- ============================================================
-- TABLE: collab_invites
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collab_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  status public.collab_invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(slot_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_collab_invites_to ON public.collab_invites(to_user_id, status);

ALTER TABLE public.collab_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter and invitee can view invites"
  ON public.collab_invites FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create invites they send"
  ON public.collab_invites FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Invitee can update invite status"
  ON public.collab_invites FOR UPDATE
  USING (auth.uid() = to_user_id);

-- ============================================================
-- TABLE: collab_reactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collab_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji public.collab_emoji NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slot_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_collab_reactions_slot ON public.collab_reactions(slot_id);

ALTER TABLE public.collab_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collab reactions"
  ON public.collab_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can react"
  ON public.collab_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON public.collab_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: collab_daily_winners
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collab_daily_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  award_date DATE NOT NULL,
  place INT NOT NULL CHECK (place BETWEEN 1 AND 3),
  slot_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  xp_awarded INT NOT NULL DEFAULT 0,
  index_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(award_date, place)
);

CREATE INDEX IF NOT EXISTS idx_collab_winners_date ON public.collab_daily_winners(award_date DESC);

ALTER TABLE public.collab_daily_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily winners"
  ON public.collab_daily_winners FOR SELECT
  USING (true);

-- ============================================================
-- TRIGGER: stamp lifecycle timestamps + flip status
-- ============================================================
CREATE OR REPLACE FUNCTION public.collab_slot_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just paired
  IF NEW.partner_id IS NOT NULL AND OLD.partner_id IS NULL THEN
    NEW.paired_at := now();
    IF NEW.status = 'open' THEN
      NEW.status := 'paired';
    END IF;
  END IF;

  -- Just uploaded
  IF NEW.final_video_url IS NOT NULL AND (OLD.final_video_url IS NULL OR OLD.final_video_url <> NEW.final_video_url) THEN
    NEW.uploaded_at := now();
    -- reset approvals; the uploader auto-approves their own upload
    IF NEW.uploaded_by = NEW.creator_id THEN
      NEW.creator_approved := TRUE;
      NEW.partner_approved := FALSE;
    ELSIF NEW.uploaded_by = NEW.partner_id THEN
      NEW.partner_approved := TRUE;
      NEW.creator_approved := FALSE;
    END IF;
    NEW.status := 'pending_approval';
  END IF;

  -- Both approved → live
  IF NEW.creator_approved AND NEW.partner_approved AND NEW.status <> 'live' THEN
    NEW.status := 'live';
    NEW.live_at := COALESCE(NEW.live_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_collab_slot_lifecycle ON public.collab_slots;
CREATE TRIGGER trg_collab_slot_lifecycle
  BEFORE UPDATE ON public.collab_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.collab_slot_lifecycle();

-- ============================================================
-- TRIGGER: maintain reaction_score on collab_slots
-- emoji weights: fire=1, zap=1, diamond=2, crown=3, clapper=1
-- ============================================================
CREATE OR REPLACE FUNCTION public.collab_recompute_score(p_slot UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INT;
  v_total INT;
BEGIN
  SELECT
    COALESCE(SUM(CASE emoji
      WHEN 'fire' THEN 1
      WHEN 'zap' THEN 1
      WHEN 'diamond' THEN 2
      WHEN 'crown' THEN 3
      WHEN 'clapper' THEN 1
    END), 0),
    COUNT(*)
  INTO v_score, v_total
  FROM public.collab_reactions
  WHERE slot_id = p_slot;

  UPDATE public.collab_slots
  SET reaction_score = v_score, total_reactions = v_total
  WHERE id = p_slot;
END;
$$;

CREATE OR REPLACE FUNCTION public.collab_reaction_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.collab_recompute_score(OLD.slot_id);
    RETURN OLD;
  ELSE
    PERFORM public.collab_recompute_score(NEW.slot_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_collab_reaction_changed ON public.collab_reactions;
CREATE TRIGGER trg_collab_reaction_changed
  AFTER INSERT OR DELETE ON public.collab_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.collab_reaction_changed();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_reactions;


-- ── migration: 20260510172431_32c1efeb-f4da-4bfd-b390-f02dc79e5b21.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_daily_collabs()
RETURNS TABLE(slot_id UUID, place INT, xp INT, idx INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'UTC')::DATE;
  v_since TIMESTAMPTZ := (now() - interval '24 hours');
  v_winner RECORD;
  v_place INT;
  v_xp INT;
  v_idx INT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.collab_daily_winners WHERE award_date = v_today) THEN
    RETURN;
  END IF;

  v_place := 1;
  FOR v_winner IN
    SELECT cs.id, cs.creator_id, cs.partner_id, cs.reaction_score
    FROM public.collab_slots cs
    WHERE cs.status = 'live'
      AND cs.live_at >= v_since
      AND cs.reaction_score > 0
      AND cs.partner_id IS NOT NULL
    ORDER BY cs.reaction_score DESC, cs.live_at ASC
    LIMIT 3
  LOOP
    IF v_place = 1 THEN v_xp := 5000; v_idx := 1000;
    ELSIF v_place = 2 THEN v_xp := 3000; v_idx := 600;
    ELSE v_xp := 1500; v_idx := 300;
    END IF;

    UPDATE public.profiles
      SET xp = COALESCE(xp, 0) + v_xp,
          spendable_index = COALESCE(spendable_index, 0) + v_idx
      WHERE id IN (v_winner.creator_id, v_winner.partner_id);

    INSERT INTO public.collab_daily_winners (award_date, place, slot_id, xp_awarded, index_awarded)
    VALUES (v_today, v_place, v_winner.id, v_xp, v_idx);

    slot_id := v_winner.id;
    place := v_place;
    xp := v_xp;
    idx := v_idx;
    RETURN NEXT;

    v_place := v_place + 1;
  END LOOP;
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('award-daily-collabs');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'award-daily-collabs',
  '5 0 * * *',
  $$ SELECT public.award_daily_collabs(); $$
);


-- ── migration: 20260510174335_30bf4f43-bf98-4409-8053-289fedd37443.sql ─────────────────────────────────────────
ALTER TABLE public.collab_slots ADD COLUMN IF NOT EXISTS social_url text;

-- ── migration: 20260510181024_db81c262-eaf1-486f-8016-ae04bf167595.sql ─────────────────────────────────────────

CREATE TABLE public.collab_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT,
  avatar_url TEXT,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_collab_messages_slot ON public.collab_messages(slot_id, created_at);

ALTER TABLE public.collab_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read collab messages"
ON public.collab_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can post their own messages"
ON public.collab_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.collab_messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_messages;
ALTER TABLE public.collab_messages REPLICA IDENTITY FULL;


-- ── migration: 20260510221721_191422c5-49df-4640-9ad1-b4e37c22a991.sql ─────────────────────────────────────────
-- Duo Edit Battles: pair two live collab slots into a head-to-head battle
CREATE TABLE IF NOT EXISTS public.collab_battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_a_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  slot_b_id UUID NOT NULL REFERENCES public.collab_slots(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'live', -- live | judged | settled
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  reactions_a INTEGER NOT NULL DEFAULT 0,
  reactions_b INTEGER NOT NULL DEFAULT 0,
  judge_score_a NUMERIC NOT NULL DEFAULT 0,
  judge_score_b NUMERIC NOT NULL DEFAULT 0,
  winner_slot_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT collab_battles_distinct_slots CHECK (slot_a_id <> slot_b_id),
  CONSTRAINT collab_battles_unique_a UNIQUE (slot_a_id),
  CONSTRAINT collab_battles_unique_b UNIQUE (slot_b_id)
);

CREATE INDEX IF NOT EXISTS idx_collab_battles_status ON public.collab_battles(status);
CREATE INDEX IF NOT EXISTS idx_collab_battles_ends_at ON public.collab_battles(ends_at);

ALTER TABLE public.collab_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battles viewable by everyone"
ON public.collab_battles FOR SELECT
USING (true);

-- Judge votes on battles (one row per judge per battle)
CREATE TABLE IF NOT EXISTS public.collab_battle_judges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.collab_battles(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL,
  pick_slot_id UUID NOT NULL,
  qoi_score NUMERIC NOT NULL DEFAULT 50,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (battle_id, judge_id)
);

ALTER TABLE public.collab_battle_judges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battle judge votes viewable by everyone"
ON public.collab_battle_judges FOR SELECT USING (true);

CREATE POLICY "Authenticated can cast judge vote"
ON public.collab_battle_judges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update own vote"
ON public.collab_battle_judges FOR UPDATE
TO authenticated
USING (auth.uid() = judge_id);

-- Auto-matchmake: when a slot becomes live, pair it with another orphan live slot
CREATE OR REPLACE FUNCTION public.trg_auto_matchmake_collab_battle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opponent_id UUID;
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS DISTINCT FROM 'live') THEN
    -- Already in a battle? skip
    IF EXISTS (
      SELECT 1 FROM public.collab_battles
      WHERE slot_a_id = NEW.id OR slot_b_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;

    -- Find an orphan live slot (not already in a battle, not the same duo)
    SELECT s.id INTO v_opponent_id
    FROM public.collab_slots s
    WHERE s.status = 'live'
      AND s.id <> NEW.id
      AND s.creator_id <> NEW.creator_id
      AND (NEW.partner_id IS NULL OR s.creator_id <> NEW.partner_id)
      AND (s.partner_id IS NULL OR s.partner_id <> NEW.creator_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.collab_battles b
        WHERE b.slot_a_id = s.id OR b.slot_b_id = s.id
      )
    ORDER BY s.live_at ASC NULLS LAST
    LIMIT 1;

    IF v_opponent_id IS NOT NULL THEN
      INSERT INTO public.collab_battles (slot_a_id, slot_b_id)
      VALUES (v_opponent_id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_matchmake_collab_battle ON public.collab_slots;
CREATE TRIGGER auto_matchmake_collab_battle
AFTER UPDATE OF status ON public.collab_slots
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_matchmake_collab_battle();

-- Recompute battle scores from reactions + judge votes
CREATE OR REPLACE FUNCTION public.collab_battle_recompute(_battle_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b RECORD;
  ra INTEGER := 0; rb INTEGER := 0;
  ja NUMERIC := 0; jb NUMERIC := 0;
  na INTEGER := 0; nb INTEGER := 0;
  sa NUMERIC; sb NUMERIC;
BEGIN
  SELECT * INTO b FROM public.collab_battles WHERE id = _battle_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COALESCE(reaction_score,0) INTO ra FROM public.collab_slots WHERE id = b.slot_a_id;
  SELECT COALESCE(reaction_score,0) INTO rb FROM public.collab_slots WHERE id = b.slot_b_id;

  SELECT COALESCE(AVG(qoi_score),0), COUNT(*) INTO ja, na
    FROM public.collab_battle_judges
    WHERE battle_id = _battle_id AND pick_slot_id = b.slot_a_id;
  SELECT COALESCE(AVG(qoi_score),0), COUNT(*) INTO jb, nb
    FROM public.collab_battle_judges
    WHERE battle_id = _battle_id AND pick_slot_id = b.slot_b_id;

  -- 70% reactions / 30% judge avg, normalized to a 0-1000 range loosely
  sa := (ra::NUMERIC * 0.7) + (ja * (na+1) * 0.3);
  sb := (rb::NUMERIC * 0.7) + (jb * (nb+1) * 0.3);

  UPDATE public.collab_battles
  SET reactions_a = ra,
      reactions_b = rb,
      judge_score_a = ja,
      judge_score_b = jb,
      score_a = ROUND(sa)::INT,
      score_b = ROUND(sb)::INT
  WHERE id = _battle_id;
END;
$$;

-- Recompute trigger when judges vote
CREATE OR REPLACE FUNCTION public.trg_collab_battle_judge_recompute()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.collab_battle_recompute(COALESCE(NEW.battle_id, OLD.battle_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS collab_battle_judge_recompute ON public.collab_battle_judges;
CREATE TRIGGER collab_battle_judge_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.collab_battle_judges
FOR EACH ROW EXECUTE FUNCTION public.trg_collab_battle_judge_recompute();

-- Recompute when reactions change on either slot
CREATE OR REPLACE FUNCTION public.trg_collab_reaction_battle_recompute()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_slot UUID;
  v_battle UUID;
BEGIN
  v_slot := COALESCE(NEW.slot_id, OLD.slot_id);
  SELECT id INTO v_battle FROM public.collab_battles
   WHERE slot_a_id = v_slot OR slot_b_id = v_slot LIMIT 1;
  IF v_battle IS NOT NULL THEN
    PERFORM public.collab_battle_recompute(v_battle);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS collab_reaction_battle_recompute ON public.collab_reactions;
CREATE TRIGGER collab_reaction_battle_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.collab_reactions
FOR EACH ROW EXECUTE FUNCTION public.trg_collab_reaction_battle_recompute();

ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_battle_judges;

-- ── migration: 20260511084255_07e98296-c391-4d5a-8e7f-9fbd200bbb40.sql ─────────────────────────────────────────
DELETE FROM public.collab_battles WHERE slot_a_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3' OR slot_b_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_battle_judges WHERE battle_id IN (SELECT id FROM public.collab_battles WHERE slot_a_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3' OR slot_b_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3');
DELETE FROM public.collab_reactions WHERE slot_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_messages WHERE slot_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_invites WHERE slot_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_daily_winners WHERE slot_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_slots WHERE id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';

-- ── migration: 20260511092058_55d5396c-e472-4d81-ab11-d48aa59fc4a5.sql ─────────────────────────────────────────
ALTER TABLE public.collab_slots
  ADD COLUMN IF NOT EXISTS submit_deadline_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.collab_slot_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just paired
  IF NEW.partner_id IS NOT NULL AND OLD.partner_id IS NULL THEN
    NEW.paired_at := now();
    NEW.submit_deadline_at := now() + interval '3 hours';
    IF NEW.status = 'open' THEN
      NEW.status := 'paired';
    END IF;
  END IF;

  -- Just uploaded
  IF NEW.final_video_url IS NOT NULL AND (OLD.final_video_url IS NULL OR OLD.final_video_url <> NEW.final_video_url) THEN
    NEW.uploaded_at := now();
    IF NEW.uploaded_by = NEW.creator_id THEN
      NEW.creator_approved := TRUE;
      NEW.partner_approved := FALSE;
    ELSIF NEW.uploaded_by = NEW.partner_id THEN
      NEW.partner_approved := TRUE;
      NEW.creator_approved := FALSE;
    END IF;
    NEW.status := 'pending_approval';
  END IF;

  -- Both approved → live
  IF NEW.creator_approved AND NEW.partner_approved AND NEW.status <> 'live' THEN
    NEW.status := 'live';
    NEW.live_at := COALESCE(NEW.live_at, now());
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill deadline for already-paired duos that don't have one
UPDATE public.collab_slots
SET submit_deadline_at = COALESCE(paired_at, now()) + interval '3 hours'
WHERE partner_id IS NOT NULL
  AND submit_deadline_at IS NULL
  AND status IN ('paired', 'editing');

-- Auto-expire helper: any paired/editing duo past deadline becomes 'expired'
CREATE OR REPLACE FUNCTION public.expire_overdue_collab_slots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.collab_slots
  SET status = 'expired'
  WHERE status IN ('paired', 'editing')
    AND submit_deadline_at IS NOT NULL
    AND submit_deadline_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Schedule expirer every 5 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('expire-overdue-collabs') WHERE TRUE;
    PERFORM cron.schedule(
      'expire-overdue-collabs',
      '*/5 * * * *',
      $cron$ SELECT public.expire_overdue_collab_slots(); $cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ── migration: 20260511095504_a2c79082-3a67-4846-a863-c3ca99e650eb.sql ─────────────────────────────────────────
ALTER TABLE public.collab_messages ADD COLUMN IF NOT EXISTS gif_url TEXT;
ALTER TABLE public.collab_messages DROP CONSTRAINT IF EXISTS collab_messages_body_check;
ALTER TABLE public.collab_messages ALTER COLUMN body DROP NOT NULL;
ALTER TABLE public.collab_messages ADD CONSTRAINT collab_messages_content_check CHECK (
  (body IS NOT NULL AND length(body) > 0 AND length(body) <= 500) OR (gif_url IS NOT NULL AND length(gif_url) <= 500)
);

-- ── migration: 20260511101011_d8b62941-fecd-487b-b57b-82f8b639347c.sql ─────────────────────────────────────────
ALTER TABLE public.collab_slots
ADD COLUMN IF NOT EXISTS challenges_slot_id uuid REFERENCES public.collab_slots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_collab_slots_challenges_slot_id
ON public.collab_slots(challenges_slot_id);

-- ── migration: 20260511105356_0e8ae8ae-718a-41df-ae80-59f1cc3db728.sql ─────────────────────────────────────────
-- 1) Backfill the missing battle (Kaizen×OXNY challenged vax_edits×quinx)
INSERT INTO public.collab_battles (slot_a_id, slot_b_id)
SELECT s.challenges_slot_id, s.id
FROM public.collab_slots s
WHERE s.status = 'live'
  AND s.challenges_slot_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.collab_slots t
    WHERE t.id = s.challenges_slot_id AND t.status = 'live'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.collab_battles b
    WHERE b.slot_a_id IN (s.id, s.challenges_slot_id)
       OR b.slot_b_id IN (s.id, s.challenges_slot_id)
  );

-- 2) Update the auto-matchmake trigger to prefer the explicit challenge target
CREATE OR REPLACE FUNCTION public.trg_auto_matchmake_collab_battle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opponent_id UUID;
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS DISTINCT FROM 'live') THEN
    IF EXISTS (
      SELECT 1 FROM public.collab_battles
      WHERE slot_a_id = NEW.id OR slot_b_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;

    -- Prefer explicit challenge target if it's live and free
    IF NEW.challenges_slot_id IS NOT NULL THEN
      SELECT s.id INTO v_opponent_id
      FROM public.collab_slots s
      WHERE s.id = NEW.challenges_slot_id
        AND s.status = 'live'
        AND NOT EXISTS (
          SELECT 1 FROM public.collab_battles b
          WHERE b.slot_a_id = s.id OR b.slot_b_id = s.id
        )
      LIMIT 1;
    END IF;

    -- Fallback: any orphan live duo
    IF v_opponent_id IS NULL THEN
      SELECT s.id INTO v_opponent_id
      FROM public.collab_slots s
      WHERE s.status = 'live'
        AND s.id <> NEW.id
        AND s.creator_id <> NEW.creator_id
        AND (NEW.partner_id IS NULL OR s.creator_id <> NEW.partner_id)
        AND (s.partner_id IS NULL OR s.partner_id <> NEW.creator_id)
        AND NOT EXISTS (
          SELECT 1 FROM public.collab_battles b
          WHERE b.slot_a_id = s.id OR b.slot_b_id = s.id
        )
      ORDER BY s.live_at ASC NULLS LAST
      LIMIT 1;
    END IF;

    IF v_opponent_id IS NOT NULL THEN
      INSERT INTO public.collab_battles (slot_a_id, slot_b_id)
      VALUES (v_opponent_id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── migration: 20260512201929_b771af83-df0c-4534-a485-4b716d50e43e.sql ─────────────────────────────────────────
ALTER TABLE public.competition_submissions
ADD COLUMN IF NOT EXISTS clip_start numeric NOT NULL DEFAULT 0;

-- ── migration: 20260513120310_fff8dcb8-b853-419c-8235-e568b91ad95c.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finalize_competition_if_expired(p_competition_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  comp RECORD;
  top_votes integer;
  submission_count integer;
  total_votes integer;
  requester uuid := auth.uid();
  winners_marked integer := 0;
  v_showcase_seconds integer;
  v_showcase_ends timestamptz;
BEGIN
  SELECT id, status, deadline, voting_started_at, voting_deadline INTO comp
  FROM public.competitions
  WHERE id = p_competition_id;

  IF comp.id IS NULL THEN RETURN false; END IF;
  IF requester IS NULL THEN RETURN false; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = p_competition_id AND c.creator_id = requester
  ) AND NOT EXISTS (
    SELECT 1 FROM public.competition_participants cp
    WHERE cp.competition_id = p_competition_id AND cp.user_id = requester
  ) THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)::integer, COALESCE(SUM(COALESCE(vote_count, 0)), 0)::integer
    INTO submission_count, total_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  v_showcase_seconds := GREATEST(submission_count, 0) * 15;

  IF comp.status = 'live' AND comp.deadline IS NOT NULL AND comp.deadline <= now() THEN
    IF submission_count = 0 THEN
      UPDATE public.competitions
      SET status = 'closed', updated_at = now()
      WHERE id = p_competition_id AND status = 'live';
      RETURN true;
    END IF;

    UPDATE public.competitions
    SET status = 'voting',
        voting_started_at = COALESCE(voting_started_at, now()),
        voting_deadline = COALESCE(
          voting_deadline,
          now() + make_interval(secs => v_showcase_seconds) + interval '1 minute'
        ),
        updated_at = now()
    WHERE id = p_competition_id AND status = 'live';
    RETURN true;
  END IF;

  IF comp.status <> 'voting' THEN
    RETURN false;
  END IF;

  v_showcase_ends := COALESCE(comp.voting_started_at, now()) + make_interval(secs => v_showcase_seconds);

  IF NOT (
    submission_count = 0
    OR (
      now() >= v_showcase_ends
      AND (
        submission_count = 1
        OR total_votes >= submission_count
        OR (comp.voting_deadline IS NOT NULL AND comp.voting_deadline <= now())
      )
    )
  ) THEN
    RETURN false;
  END IF;

  SELECT MAX(COALESCE(vote_count, 0)) INTO top_votes
  FROM public.competition_submissions
  WHERE competition_id = p_competition_id;

  IF top_votes IS NOT NULL THEN
    UPDATE public.competition_submissions
    SET is_winner = (COALESCE(vote_count, 0) = top_votes),
        winner_place = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN 1 ELSE winner_place END,
        scored_at = CASE WHEN COALESCE(vote_count, 0) = top_votes THEN COALESCE(scored_at, now()) ELSE scored_at END
    WHERE competition_id = p_competition_id;

    GET DIAGNOSTICS winners_marked = ROW_COUNT;
  END IF;

  UPDATE public.competitions
  SET status = CASE WHEN winners_marked > 0 THEN 'completed' ELSE 'closed' END,
      updated_at = now()
  WHERE id = p_competition_id AND status = 'voting';

  PERFORM public.award_competition_rewards(p_competition_id);

  RETURN true;
END;
$function$;

UPDATE public.competitions
SET voting_deadline = voting_started_at
    + make_interval(secs => GREATEST((
        SELECT COUNT(*)::int FROM public.competition_submissions s
        WHERE s.competition_id = competitions.id
      ), 0) * 15)
    + interval '1 minute',
    updated_at = now()
WHERE status = 'voting'
  AND voting_started_at IS NOT NULL
  AND voting_deadline IS NOT NULL
  AND voting_deadline > now();

-- ── migration: 20260514162731_3a23a2af-d74d-4568-bf22-0c729fc84549.sql ─────────────────────────────────────────
UPDATE public.events SET rules = ARRAY[
  'Theme: Light Yagami (Death Note)',
  'Use the official Fix My Soul TikTok sound (linked above)',
  'Submit your edit on TikTok, Instagram, or YouTube',
  'Top edits judged by QOI score — Quality + Originality + Impact'
]::text[] WHERE slug = 'light-yagami-edit-competition';

-- ── migration: 20260514172805_79b41311-20a6-4f40-b1da-776d1c9dab85.sql ─────────────────────────────────────────
DELETE FROM public.event_participations WHERE id = '69c7d555-e910-4a88-89ee-ce42559664e1';

-- ── migration: 20260514173401_d03bdc87-c141-4e68-bf38-a11a02b3f8ed.sql ─────────────────────────────────────────

-- event_messages
CREATE TABLE public.event_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  message_text text,
  message_type text NOT NULL DEFAULT 'text', -- text | gif | sticker
  media_url text,
  reply_to_id uuid REFERENCES public.event_messages(id) ON DELETE SET NULL,
  reply_to_username text,
  reply_to_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_messages_event ON public.event_messages(event_id, created_at);

ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event messages"
  ON public.event_messages FOR SELECT USING (true);

CREATE POLICY "Auth users can post event messages"
  ON public.event_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event messages"
  ON public.event_messages FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;

-- event_chat_reads
CREATE TABLE public.event_chat_reads (
  user_id uuid NOT NULL,
  event_id text NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE public.event_chat_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own read marks"
  ON public.event_chat_reads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own read marks"
  ON public.event_chat_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own read marks"
  ON public.event_chat_reads FOR UPDATE USING (auth.uid() = user_id);


-- ── migration: 20260514184652_2e98ddba-505c-488a-9ac0-c688e20c06d3.sql ─────────────────────────────────────────
ALTER TABLE public.event_participations ADD COLUMN IF NOT EXISTS is_showcase BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.round_participations ADD COLUMN IF NOT EXISTS is_showcase BOOLEAN NOT NULL DEFAULT false;

-- ── migration: 20260517155849_fc617473-148c-43b0-b0c0-997fa853f9b2.sql ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('competition-covers', 'competition-covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Competition covers public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'competition-covers');

CREATE POLICY "Authenticated upload competition covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'competition-covers');

CREATE POLICY "Authenticated update competition covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'competition-covers');

CREATE POLICY "Authenticated delete competition covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'competition-covers');

-- ── migration: 20260517212434_a231cdef-6fcf-435d-98a4-756338bf1b25.sql ─────────────────────────────────────────
ALTER TABLE public.quick_fight_messages ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'battle';
CREATE INDEX IF NOT EXISTS idx_quick_fight_messages_fight_channel ON public.quick_fight_messages(fight_id, channel);

-- ── migration: 20260519124209_delete_yoyo_competition.sql ─────────────────────────────────────────
DELETE FROM competitions WHERE id = 'c8ae6e49-0905-4234-ae0a-b7df071cb538';


-- ── migration: 20260519131644_2eae8b18-777a-40ed-9a16-c842ca257ae8.sql ─────────────────────────────────────────
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_battles_featured_completed ON public.battles (is_featured, status) WHERE is_featured = true;

-- ── migration: 20260519133336_5e39e756-c18a-44c2-a404-f1f237cfa167.sql ─────────────────────────────────────────
ALTER TABLE public.quick_fights ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_quick_fights_featured ON public.quick_fights (is_featured, status) WHERE is_featured = true;

-- ── migration: 20260519154242_97f0f22b-ec40-44c7-b7b6-a717922714f5.sql ─────────────────────────────────────────
DELETE FROM competitions WHERE id = 'c8ae6e49-0905-4234-ae0a-b7df071cb538';

-- ── migration: 20260519161354_6ab92e5a-fb9d-45ad-905e-6aa0efdb90b5.sql ─────────────────────────────────────────

-- Drop the legacy 4-arg overload (buggy + unused) to remove ambiguity
DROP FUNCTION IF EXISTS public.join_waiting_quick_fight(uuid, uuid, text, text);

-- Replace the 5-arg version to honor the lobby's stored duration_minutes
CREATE OR REPLACE FUNCTION public.join_waiting_quick_fight(
  p_fight_id uuid,
  p_user_id uuid,
  p_username text,
  p_avatar_url text DEFAULT NULL::text,
  p_join_code text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fight RECORD;
  starts timestamptz := now();
  duration_mins int;
  duration_label text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO fight
  FROM public.quick_fights
  WHERE id = p_fight_id
  FOR UPDATE;

  IF fight IS NULL THEN
    RAISE EXCEPTION 'Lobby not found';
  END IF;

  IF fight.status <> 'waiting' OR fight.player_2_id IS NOT NULL THEN
    RAISE EXCEPTION 'Lobby is no longer open';
  END IF;

  IF fight.player_1_id = p_user_id THEN
    RAISE EXCEPTION 'Owner cannot join their own lobby';
  END IF;

  IF fight.is_private THEN
    IF p_join_code IS NULL OR upper(trim(p_join_code)) <> fight.join_code THEN
      RAISE EXCEPTION 'Invalid join code';
    END IF;
  END IF;

  duration_mins := COALESCE(fight.duration_minutes, 60);
  duration_label := CASE
    WHEN duration_mins >= 60 AND duration_mins % 60 = 0 THEN (duration_mins / 60)::text || ' hour' || CASE WHEN duration_mins / 60 = 1 THEN '' ELSE 's' END
    ELSE duration_mins::text || ' minutes'
  END;

  DELETE FROM public.quick_fight_queue WHERE user_id = p_user_id;

  UPDATE public.quick_fights
  SET
    player_2_id = p_user_id,
    player_2_username = p_username,
    player_2_avatar_url = p_avatar_url,
    status = 'active',
    matched_at = starts,
    starts_at = starts,
    ends_at = starts + make_interval(mins => duration_mins)
  WHERE id = p_fight_id;

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (
    p_fight_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'System',
    '⚔️ FIGHT STARTED! You have ' || duration_label || ' to submit your edit.',
    true
  );

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (fight.player_1_id, 'quick_fight', '⚔️ Custom Lobby Joined!', '@' || p_username || ' joined your edit battle.', jsonb_build_object('fight_id', p_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Edit Battle Started!', 'You joined @' || fight.player_1_username || '''s edit battle.', jsonb_build_object('fight_id', p_fight_id));

  RETURN p_fight_id;
END;
$function$;


-- ── migration: 20260519165125_7ada80be-9757-451b-b34f-2437f61f58e1.sql ─────────────────────────────────────────
UPDATE public.competitions SET status='lobby', updated_at=now() WHERE id='32a65d02-2b69-4836-a8d7-ae6f2c525ea5';

-- ── migration: 20260520125500_7c5976f2-1304-4323-bdf4-24015aa5749d.sql ─────────────────────────────────────────
ALTER TABLE public.quick_fights DROP CONSTRAINT IF EXISTS quick_fights_status_check;
ALTER TABLE public.quick_fights ADD CONSTRAINT quick_fights_status_check
CHECK (status IN ('waiting', 'selecting', 'active', 'submitted', 'judging', 'completed', 'forfeited', 'cancelled'));

ALTER TABLE public.quick_fights
  ADD COLUMN IF NOT EXISTS selection_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS selection_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS player_1_selection_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS player_2_selection_ready boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.quick_fight_selections (
  fight_id uuid NOT NULL REFERENCES public.quick_fights(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  side text NOT NULL CHECK (side IN ('red', 'blue')),
  scenepack_id text,
  scenepack_name text,
  scenepack_poster text,
  scenepack_count integer,
  song_id text,
  song_title text,
  song_artist text,
  song_cover text,
  song_preview text,
  ready boolean NOT NULL DEFAULT false,
  ready_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (fight_id, player_id)
);

ALTER TABLE public.quick_fight_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view their own quick fight selections" ON public.quick_fight_selections;
CREATE POLICY "Players can view their own quick fight selections"
ON public.quick_fight_selections
FOR SELECT
TO authenticated
USING (auth.uid() = player_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Players can create their own quick fight selections" ON public.quick_fight_selections;
CREATE POLICY "Players can create their own quick fight selections"
ON public.quick_fight_selections
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = player_id
  AND EXISTS (
    SELECT 1 FROM public.quick_fights qf
    WHERE qf.id = fight_id
      AND auth.uid() IN (qf.player_1_id, qf.player_2_id)
  )
);

DROP POLICY IF EXISTS "Players can update their own quick fight selections" ON public.quick_fight_selections;
CREATE POLICY "Players can update their own quick fight selections"
ON public.quick_fight_selections
FOR UPDATE
TO authenticated
USING (auth.uid() = player_id)
WITH CHECK (auth.uid() = player_id);

CREATE INDEX IF NOT EXISTS idx_quick_fight_selections_fight ON public.quick_fight_selections(fight_id);

CREATE OR REPLACE FUNCTION public.touch_quick_fight_selection_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_quick_fight_selection_updated_at ON public.quick_fight_selections;
CREATE TRIGGER trg_touch_quick_fight_selection_updated_at
BEFORE UPDATE ON public.quick_fight_selections
FOR EACH ROW
EXECUTE FUNCTION public.touch_quick_fight_selection_updated_at();

CREATE OR REPLACE FUNCTION public.get_quick_fight_selection_state(p_fight_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fight record;
  v_user uuid := auth.uid();
  v_side text;
  my_sel record;
  opp_sel record;
  reveal boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id;
  IF fight IS NULL THEN RAISE EXCEPTION 'Fight not found'; END IF;

  IF v_user = fight.player_1_id THEN
    v_side := 'red';
  ELSIF v_user = fight.player_2_id THEN
    v_side := 'blue';
  ELSE
    RAISE EXCEPTION 'Not a participant';
  END IF;

  SELECT * INTO my_sel FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id = v_user;
  SELECT * INTO opp_sel FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id <> v_user LIMIT 1;

  reveal := fight.status <> 'selecting'
    OR (COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false))
    OR (fight.selection_deadline IS NOT NULL AND fight.selection_deadline <= now());

  RETURN jsonb_build_object(
    'status', fight.status,
    'selectionStartedAt', fight.selection_started_at,
    'selectionDeadline', fight.selection_deadline,
    'mySide', v_side,
    'myReady', COALESCE(my_sel.ready, false),
    'opponentReady', CASE WHEN v_side = 'red' THEN COALESCE(fight.player_2_selection_ready, false) ELSE COALESCE(fight.player_1_selection_ready, false) END,
    'bothReady', COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false),
    'reveal', reveal,
    'mine', CASE WHEN my_sel IS NULL THEN NULL ELSE jsonb_build_object(
      'pack', jsonb_build_object('id', my_sel.scenepack_id, 'name', my_sel.scenepack_name, 'poster', my_sel.scenepack_poster, 'packCount', my_sel.scenepack_count),
      'song', jsonb_build_object('id', my_sel.song_id, 'title', my_sel.song_title, 'artist', my_sel.song_artist, 'cover', my_sel.song_cover, 'preview', my_sel.song_preview),
      'ready', my_sel.ready
    ) END,
    'opponent', CASE WHEN reveal AND opp_sel IS NOT NULL THEN jsonb_build_object(
      'pack', jsonb_build_object('id', opp_sel.scenepack_id, 'name', opp_sel.scenepack_name, 'poster', opp_sel.scenepack_poster, 'packCount', opp_sel.scenepack_count),
      'song', jsonb_build_object('id', opp_sel.song_id, 'title', opp_sel.song_title, 'artist', opp_sel.song_artist, 'cover', opp_sel.song_cover, 'preview', opp_sel.song_preview),
      'ready', opp_sel.ready
    ) ELSE NULL END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_quick_fight_selection(
  p_fight_id uuid,
  p_scenepack jsonb DEFAULT NULL,
  p_song jsonb DEFAULT NULL,
  p_ready boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fight record;
  v_user uuid := auth.uid();
  v_side text;
  already_ready boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF fight IS NULL THEN RAISE EXCEPTION 'Fight not found'; END IF;

  IF v_user = fight.player_1_id THEN
    v_side := 'red';
  ELSIF v_user = fight.player_2_id THEN
    v_side := 'blue';
  ELSE
    RAISE EXCEPTION 'Not a participant';
  END IF;

  IF fight.status <> 'selecting' THEN RAISE EXCEPTION 'Selection is not open'; END IF;
  IF p_ready AND (p_scenepack IS NULL OR p_song IS NULL) THEN RAISE EXCEPTION 'Pick scenepack and song first'; END IF;

  SELECT COALESCE(ready, false) INTO already_ready FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id = v_user;
  IF COALESCE(already_ready, false) THEN
    RETURN public.get_quick_fight_selection_state(p_fight_id);
  END IF;

  INSERT INTO public.quick_fight_selections (
    fight_id, player_id, side,
    scenepack_id, scenepack_name, scenepack_poster, scenepack_count,
    song_id, song_title, song_artist, song_cover, song_preview,
    ready, ready_at
  ) VALUES (
    p_fight_id, v_user, v_side,
    p_scenepack->>'id', p_scenepack->>'name', p_scenepack->>'poster', NULLIF(p_scenepack->>'packCount', '')::integer,
    p_song->>'id', p_song->>'title', p_song->>'artist', p_song->>'cover', p_song->>'preview',
    p_ready, CASE WHEN p_ready THEN now() ELSE NULL END
  )
  ON CONFLICT (fight_id, player_id) DO UPDATE SET
    scenepack_id = EXCLUDED.scenepack_id,
    scenepack_name = EXCLUDED.scenepack_name,
    scenepack_poster = EXCLUDED.scenepack_poster,
    scenepack_count = EXCLUDED.scenepack_count,
    song_id = EXCLUDED.song_id,
    song_title = EXCLUDED.song_title,
    song_artist = EXCLUDED.song_artist,
    song_cover = EXCLUDED.song_cover,
    song_preview = EXCLUDED.song_preview,
    ready = EXCLUDED.ready,
    ready_at = CASE WHEN EXCLUDED.ready THEN now() ELSE NULL END;

  IF v_side = 'red' THEN
    UPDATE public.quick_fights SET player_1_selection_ready = player_1_selection_ready OR p_ready, updated_at = now() WHERE id = p_fight_id;
  ELSE
    UPDATE public.quick_fights SET player_2_selection_ready = player_2_selection_ready OR p_ready, updated_at = now() WHERE id = p_fight_id;
  END IF;

  RETURN public.get_quick_fight_selection_state(p_fight_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.start_quick_fight_from_selection(p_fight_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fight record;
  starts timestamptz := now();
  duration_mins int;
  duration_label text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF fight IS NULL THEN RETURN false; END IF;
  IF auth.uid() NOT IN (fight.player_1_id, fight.player_2_id) THEN RAISE EXCEPTION 'Not a participant'; END IF;
  IF fight.status = 'active' THEN RETURN true; END IF;
  IF fight.status <> 'selecting' THEN RETURN false; END IF;

  IF NOT ((COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false)) OR (fight.selection_deadline IS NOT NULL AND fight.selection_deadline <= now())) THEN
    RETURN false;
  END IF;

  duration_mins := COALESCE(fight.duration_minutes, 60);
  duration_label := CASE
    WHEN duration_mins >= 60 AND duration_mins % 60 = 0 THEN (duration_mins / 60)::text || ' hour' || CASE WHEN duration_mins / 60 = 1 THEN '' ELSE 's' END
    ELSE duration_mins::text || ' minutes'
  END;

  UPDATE public.quick_fights
  SET status = 'active',
      matched_at = COALESCE(matched_at, starts),
      starts_at = starts,
      ends_at = starts + make_interval(mins => duration_mins),
      player_1_selection_ready = true,
      player_2_selection_ready = true,
      updated_at = now()
  WHERE id = p_fight_id;

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (p_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ FIGHT STARTED! You have ' || duration_label || ' to submit your edit.', true);

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.quick_fight_match(p_user_id uuid, p_username text, p_avatar_url text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  matched RECORD;
  new_fight_id UUID;
  starts TIMESTAMPTZ := now();
BEGIN
  DELETE FROM public.quick_fight_queue WHERE expires_at < now();

  SELECT * INTO matched
  FROM public.quick_fight_queue
  WHERE user_id != p_user_id
    AND expires_at > now()
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF matched IS NULL THEN
    INSERT INTO public.quick_fight_queue (user_id, username, avatar_url)
    VALUES (p_user_id, p_username, p_avatar_url)
    ON CONFLICT (user_id) DO UPDATE
    SET username = p_username, avatar_url = p_avatar_url, queued_at = now(), expires_at = now() + INTERVAL '5 minutes';
    RETURN NULL;
  END IF;

  INSERT INTO public.quick_fights (
    player_1_id, player_1_username, player_1_avatar_url,
    player_2_id, player_2_username, player_2_avatar_url,
    status, matched_at, duration_minutes, selection_started_at, selection_deadline
  ) VALUES (
    matched.user_id, matched.username, matched.avatar_url,
    p_user_id, p_username, p_avatar_url,
    'selecting', starts, 60, starts, starts + INTERVAL '3 minutes'
  )
  RETURNING id INTO new_fight_id;

  DELETE FROM public.quick_fight_queue WHERE user_id IN (p_user_id, matched.user_id);

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (new_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '🎬 Selection lobby opened. Both editors have 3 minutes to pick scenepack + song.', true);

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (matched.user_id, 'quick_fight', '⚔️ Match Found!', 'Pick your scenepack and song vs @' || p_username || '.', jsonb_build_object('fight_id', new_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Match Found!', 'Pick your scenepack and song vs @' || matched.username || '.', jsonb_build_object('fight_id', new_fight_id));

  RETURN new_fight_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_waiting_quick_fight(
  p_fight_id uuid,
  p_user_id uuid,
  p_username text,
  p_avatar_url text DEFAULT NULL::text,
  p_join_code text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fight RECORD;
  starts timestamptz := now();
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id FOR UPDATE;
  IF fight IS NULL THEN RAISE EXCEPTION 'Lobby not found'; END IF;
  IF fight.status <> 'waiting' OR fight.player_2_id IS NOT NULL THEN RAISE EXCEPTION 'Lobby is no longer open'; END IF;
  IF fight.player_1_id = p_user_id THEN RAISE EXCEPTION 'Owner cannot join their own lobby'; END IF;

  IF fight.is_private THEN
    IF p_join_code IS NULL OR upper(trim(p_join_code)) <> fight.join_code THEN RAISE EXCEPTION 'Invalid join code'; END IF;
  END IF;

  DELETE FROM public.quick_fight_queue WHERE user_id = p_user_id;

  UPDATE public.quick_fights
  SET player_2_id = p_user_id,
      player_2_username = p_username,
      player_2_avatar_url = p_avatar_url,
      status = 'selecting',
      matched_at = starts,
      selection_started_at = starts,
      selection_deadline = starts + INTERVAL '3 minutes',
      player_1_selection_ready = false,
      player_2_selection_ready = false,
      updated_at = now()
  WHERE id = p_fight_id;

  INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
  VALUES (p_fight_id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '🎬 Selection lobby opened. Both editors have 3 minutes to pick scenepack + song.', true);

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (fight.player_1_id, 'quick_fight', '⚔️ Battle Accepted!', '@' || p_username || ' joined. Pick your scenepack and song.', jsonb_build_object('fight_id', p_fight_id)),
    (p_user_id, 'quick_fight', '⚔️ Selection Lobby!', 'Pick your scenepack and song vs @' || fight.player_1_username || '.', jsonb_build_object('fight_id', p_fight_id));

  RETURN p_fight_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_expired_quick_fights()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fight RECORD;
  resolved_count INTEGER := 0;
  p1_submitted BOOLEAN;
  p2_submitted BOOLEAN;
BEGIN
  FOR fight IN
    SELECT * FROM public.quick_fights
    WHERE status = 'selecting'
      AND selection_deadline IS NOT NULL
      AND selection_deadline <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.quick_fights
    SET status = 'active',
        starts_at = now(),
        ends_at = now() + make_interval(mins => COALESCE(duration_minutes, 60)),
        player_1_selection_ready = true,
        player_2_selection_ready = true,
        updated_at = now()
    WHERE id = fight.id;
    INSERT INTO public.quick_fight_messages (fight_id, user_id, username, message_text, is_system)
    VALUES (fight.id, '00000000-0000-0000-0000-000000000000'::uuid, 'System', '⚔️ Selection timer expired. Fight started.', true);
    resolved_count := resolved_count + 1;
  END LOOP;

  FOR fight IN
    SELECT * FROM public.quick_fights
    WHERE status = 'active'
      AND ends_at IS NOT NULL
      AND ends_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    p1_submitted := fight.player_1_submitted_at IS NOT NULL;
    p2_submitted := fight.player_2_submitted_at IS NOT NULL;

    IF NOT p1_submitted AND NOT p2_submitted THEN
      UPDATE public.quick_fights SET status = 'cancelled', updated_at = now() WHERE id = fight.id;
      INSERT INTO public.notifications (user_id, type, title, message, data) VALUES
        (fight.player_1_id, 'quick_fight_result', '⚔️ Fight Cancelled', 'Neither player submitted. No index awarded.', jsonb_build_object('fight_id', fight.id)),
        (fight.player_2_id, 'quick_fight_result', '⚔️ Fight Cancelled', 'Neither player submitted. No index awarded.', jsonb_build_object('fight_id', fight.id));
    ELSIF p1_submitted AND NOT p2_submitted THEN
      UPDATE public.quick_fights
      SET status = 'completed', winner_id = fight.player_1_id, winner_score = 100, loser_score = 0,
          judge_notes = 'Won by forfeit — opponent did not submit', judged_at = now(), updated_at = now()
      WHERE id = fight.id;
      UPDATE public.profiles SET spendable_index = spendable_index + 20, global_index_score = COALESCE(global_index_score, 0) + 20 WHERE id = fight.player_1_id;
      UPDATE public.profiles SET spendable_index = GREATEST(spendable_index - 10, 0), global_index_score = GREATEST(COALESCE(global_index_score, 0) - 10, 0) WHERE id = fight.player_2_id;
    ELSIF NOT p1_submitted AND p2_submitted THEN
      UPDATE public.quick_fights
      SET status = 'completed', winner_id = fight.player_2_id, winner_score = 100, loser_score = 0,
          judge_notes = 'Won by forfeit — opponent did not submit', judged_at = now(), updated_at = now()
      WHERE id = fight.id;
      UPDATE public.profiles SET spendable_index = spendable_index + 20, global_index_score = COALESCE(global_index_score, 0) + 20 WHERE id = fight.player_2_id;
      UPDATE public.profiles SET spendable_index = GREATEST(spendable_index - 10, 0), global_index_score = GREATEST(COALESCE(global_index_score, 0) - 10, 0) WHERE id = fight.player_1_id;
    END IF;

    resolved_count := resolved_count + 1;
  END LOOP;

  RETURN resolved_count;
END;
$$;

-- ── migration: 20260520184713_7f7c63c0-e9a0-465a-abaf-0c66da9bcd6e.sql ─────────────────────────────────────────
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'upload';

-- ── migration: 20260520194552_b8871705-2f74-48b4-84c0-b77c7d3430b8.sql ─────────────────────────────────────────
ALTER TABLE public.event_participations DROP CONSTRAINT IF EXISTS event_participations_user_id_event_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS event_participations_user_event_unique_non_showcase
  ON public.event_participations (user_id, event_id)
  WHERE is_showcase = false;

-- ── migration: 20260520195834_bcb22a4a-87a3-405d-9ca4-f44633fd6d0d.sql ─────────────────────────────────────────
DELETE FROM public.event_participations WHERE id = 'd55a28df-4861-403a-ac40-3e3d8615fa48' AND is_showcase = true;

-- ── migration: 20260521112048_dd3969bb-a15d-41ea-8007-74a6ea4a6e8a.sql ─────────────────────────────────────────

ALTER TABLE public.radio_tracks
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS deezer_id BIGINT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_radio_tracks_featured ON public.radio_tracks (is_featured, track_order);
CREATE UNIQUE INDEX IF NOT EXISTS uq_radio_tracks_deezer ON public.radio_tracks (deezer_id) WHERE deezer_id IS NOT NULL;


-- ── migration: 20260521114304_reveal_opponent_picks.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_quick_fight_selection_state(p_fight_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  fight record;
  v_user uuid := auth.uid();
  v_side text;
  my_sel record;
  opp_sel record;
  reveal boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO fight FROM public.quick_fights WHERE id = p_fight_id;
  IF fight IS NULL THEN RAISE EXCEPTION 'Fight not found'; END IF;

  IF v_user = fight.player_1_id THEN
    v_side := 'red';
  ELSIF v_user = fight.player_2_id THEN
    v_side := 'blue';
  ELSE
    RAISE EXCEPTION 'Not a participant';
  END IF;

  SELECT * INTO my_sel FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id = v_user;
  SELECT * INTO opp_sel FROM public.quick_fight_selections WHERE fight_id = p_fight_id AND player_id <> v_user LIMIT 1;

  reveal := fight.status <> 'selecting'
    OR (COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false))
    OR (fight.selection_deadline IS NOT NULL AND fight.selection_deadline <= now());

  RETURN jsonb_build_object(
    'status', fight.status,
    'selectionStartedAt', fight.selection_started_at,
    'selectionDeadline', fight.selection_deadline,
    'mySide', v_side,
    'myReady', COALESCE(my_sel.ready, false),
    'opponentReady', CASE WHEN v_side = 'red' THEN COALESCE(fight.player_2_selection_ready, false) ELSE COALESCE(fight.player_1_selection_ready, false) END,
    'bothReady', COALESCE(fight.player_1_selection_ready, false) AND COALESCE(fight.player_2_selection_ready, false),
    'reveal', reveal,
    'mine', CASE WHEN my_sel IS NULL THEN NULL ELSE jsonb_build_object(
      'pack', jsonb_build_object('id', my_sel.scenepack_id, 'name', my_sel.scenepack_name, 'poster', my_sel.scenepack_poster, 'packCount', my_sel.scenepack_count),
      'song', jsonb_build_object('id', my_sel.song_id, 'title', my_sel.song_title, 'artist', my_sel.song_artist, 'cover', my_sel.song_cover, 'preview', my_sel.song_preview),
      'ready', my_sel.ready
    ) END,
    -- Always expose opponent selections to participants; reveal screen + battle banner need them.
    'opponent', CASE WHEN opp_sel IS NULL THEN NULL ELSE jsonb_build_object(
      'pack', jsonb_build_object('id', opp_sel.scenepack_id, 'name', opp_sel.scenepack_name, 'poster', opp_sel.scenepack_poster, 'packCount', opp_sel.scenepack_count),
      'song', jsonb_build_object('id', opp_sel.song_id, 'title', opp_sel.song_title, 'artist', opp_sel.song_artist, 'cover', opp_sel.song_cover, 'preview', opp_sel.song_preview),
      'ready', opp_sel.ready
    ) END
  );
END;
$function$;


-- ── migration: 20260521182714_f17654c8-10fb-466c-bc44-a43a0cdfc275.sql ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view participations" ON public.event_participations;

CREATE POLICY "Anyone can view participations"
ON public.event_participations
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Anyone can view round participations" ON public.round_participations;

CREATE POLICY "Anyone can view round participations"
ON public.round_participations
FOR SELECT
TO public
USING (true);

-- ── migration: 20260521202813_ec823aa8-f2b5-4562-8df6-a14f804051bc.sql ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_submission_scored()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  event_title TEXT;
  profile_username TEXT;
  profile_avatar TEXT;
BEGIN
  IF NEW.status = 'scored' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status != 'scored') THEN
    -- event_participations.event_id is text while events.id is uuid.
    -- Compare as text so scoring never fails with "operator does not exist: uuid = text".
    SELECT title INTO event_title
    FROM public.events
    WHERE id::text = NEW.event_id
    LIMIT 1;
    
    SELECT username, avatar_url INTO profile_username, profile_avatar 
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'submission_judged',
      'Your submission has been judged!',
      'Your entry in ' || COALESCE(event_title, 'an event') || ' received a QOI score of ' || ROUND(NEW.qoi_score::NUMERIC, 1),
      jsonb_build_object(
        'event_id', NEW.event_id,
        'qoi_score', NEW.qoi_score,
        'quality_score', NEW.quality_score,
        'originality_score', NEW.originality_score,
        'impact_score', NEW.impact_score
      )
    );
    
    INSERT INTO public.activity_feed (user_id, username, avatar_url, activity_type, title, description, data)
    VALUES (
      NEW.user_id,
      COALESCE(profile_username, 'Unknown'),
      profile_avatar,
      'submission',
      COALESCE(profile_username, 'Unknown') || ' submitted to ' || COALESCE(event_title, 'an event'),
      'Scored ' || ROUND(NEW.qoi_score::NUMERIC, 1) || ' QOI',
      jsonb_build_object('event_id', NEW.event_id, 'qoi_score', NEW.qoi_score)
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- ── migration: 20260522122152_9c1cbe0a-5100-4231-8e9c-463a029a9423.sql ─────────────────────────────────────────
create or replace function public.hide_public_forfeit_quick_fights()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('forfeited', 'cancelled')
     or (
       new.status = 'completed'
       and (
         new.player_1_submission_url is null
         or new.player_2_submission_url is null
       )
     ) then
    new.hidden_at := coalesce(new.hidden_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hide_public_forfeit_quick_fights on public.quick_fights;

create trigger trg_hide_public_forfeit_quick_fights
before insert or update of status, player_1_submission_url, player_2_submission_url
on public.quick_fights
for each row
execute function public.hide_public_forfeit_quick_fights();

-- ── migration: 20260523000000_cancel_light_yagami_comp.sql ─────────────────────────────────────────
-- Award 1,000,000 rings to every user who submitted to the Light Yagami competition
UPDATE public.profiles
SET rings = rings + 1000000
WHERE id IN (
  SELECT ep.user_id
  FROM public.event_participations ep
  JOIN public.events e ON ep.event_id = e.id::text
  WHERE e.slug = 'light-yagami-edit-competition'
);

-- Insert one-time cancellation notification for each affected user
INSERT INTO public.notifications (user_id, type, title, message, data)
SELECT
  ep.user_id,
  'comp_cancelled'                                                         AS type,
  'Competition Cancelled'                                                  AS title,
  'The Light Yagami Edit Comp has been cancelled due to low submissions. As compensation, 1,000,000 rings have been added to your account.'
                                                                           AS message,
  jsonb_build_object(
    'slug',          'light-yagami-edit-competition',
    'rings_awarded', 1000000,
    'event_title',   'Light Yagami Edit Comp'
  )                                                                        AS data
FROM public.event_participations ep
JOIN public.events e ON ep.event_id = e.id::text
WHERE e.slug = 'light-yagami-edit-competition';

-- Mark the event as closed
UPDATE public.events
SET    status     = 'closed',
       updated_at = now()
WHERE  slug = 'light-yagami-edit-competition';

