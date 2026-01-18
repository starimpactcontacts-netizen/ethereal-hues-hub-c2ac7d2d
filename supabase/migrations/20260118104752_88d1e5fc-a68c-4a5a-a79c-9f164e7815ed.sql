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