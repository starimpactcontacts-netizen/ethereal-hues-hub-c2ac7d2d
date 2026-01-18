import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export interface JudgeBadgeData {
  id: string;
  emoji: string;
  label: string;
  description?: string;
  color: string;
}

// Badge color mappings
const BADGE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
  slate: { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400', glow: 'shadow-slate-500/20' },
  rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', glow: 'shadow-red-500/20' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  gold: { bg: 'bg-gold/20', border: 'border-gold/50', text: 'text-gold', glow: 'shadow-gold/20' },
  yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
  pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400', glow: 'shadow-pink-500/20' },
  violet: { bg: 'bg-violet-500/20', border: 'border-violet-500/50', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
};

interface JudgeBadgeProps {
  badge: JudgeBadgeData;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  animate?: boolean;
}

export default function JudgeBadge({ badge, size = 'md', showTooltip = true, animate = true }: JudgeBadgeProps) {
  const colors = BADGE_COLORS[badge.color] || BADGE_COLORS.purple;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };

  const emojiSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const BadgeContent = (
    <motion.div
      initial={animate ? { scale: 0.9, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={animate ? { scale: 1.05 } : undefined}
      className={`inline-flex items-center font-semibold border rounded-full ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses[size]} shadow-lg ${colors.glow} cursor-default`}
    >
      <span className={emojiSizes[size]}>{badge.emoji}</span>
      <span className="tracking-wide uppercase">{badge.label}</span>
    </motion.div>
  );

  if (!showTooltip || !badge.description) {
    return BadgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {BadgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold mb-0.5">{badge.emoji} {badge.label}</p>
          <p className="text-muted-foreground text-xs">{badge.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Predefined badge data for easy use
export const JUDGE_BADGES: Record<string, JudgeBadgeData> = {
  story_master: { id: 'story_master', emoji: '🟣', label: 'Story Master', description: 'Expert at narrative flow and storytelling', color: 'purple' },
  sync_demon: { id: 'sync_demon', emoji: '🔥', label: 'Sync Demon', description: 'Master of beat sync and rhythm', color: 'orange' },
  vibe_specialist: { id: 'vibe_specialist', emoji: '💫', label: 'Vibe Specialist', description: 'Captures mood and atmosphere perfectly', color: 'indigo' },
  technical_analyst: { id: 'technical_analyst', emoji: '⚙️', label: 'Technical Analyst', description: 'Deep expertise in technical execution', color: 'slate' },
  emotion_judge: { id: 'emotion_judge', emoji: '🎭', label: 'Emotion Judge', description: 'Reads emotional impact like no other', color: 'rose' },
  anime_specialist: { id: 'anime_specialist', emoji: '🐉', label: 'Anime Specialist', description: 'AMV and anime edit expert', color: 'cyan' },
  amv_critic: { id: 'amv_critic', emoji: '🧨', label: 'AMV Critic', description: 'Hardcore AMV enthusiast and critic', color: 'red' },
  sfx_coach: { id: 'sfx_coach', emoji: '🔊', label: 'SFX Coach', description: 'Sound design and SFX mastery', color: 'emerald' },
  comp_king: { id: 'comp_king', emoji: '👑', label: 'Comp King', description: 'Composition and framing specialist', color: 'gold' },
  transitions_god: { id: 'transitions_god', emoji: '⚡', label: 'Transitions God', description: 'Seamless transitions expert', color: 'yellow' },
  meme_lord: { id: 'meme_lord', emoji: '😈', label: 'Meme Lord', description: 'Meme edit connoisseur', color: 'pink' },
  freestyle: { id: 'freestyle', emoji: '🎨', label: 'Freestyle', description: 'Rates on their own unique criteria', color: 'violet' },
};

// Review style presets
export const REVIEW_STYLES = {
  full_qoi: { id: 'full_qoi', label: 'Full QOI', description: 'Complete scoring across all pillars' },
  vibes: { id: 'vibes', label: 'Vibes Only', description: 'Pure vibe and mood assessment' },
  sync_only: { id: 'sync_only', label: 'Sync Only', description: 'Beat sync and rhythm focus' },
  comp_only: { id: 'comp_only', label: 'Comp Only', description: 'Composition and framing' },
  character_edits: { id: 'character_edits', label: 'Character Edits', description: 'Character-focused content' },
  meme_edits: { id: 'meme_edits', label: 'Meme Edits', description: 'Meme and comedy timing' },
  anime_edits: { id: 'anime_edits', label: 'Anime/AMV', description: 'Anime and AMV specific' },
  freestyle: { id: 'freestyle', label: 'Freestyle', description: 'Custom criteria set by judge' },
};
