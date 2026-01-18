import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

// Judge Class tiers based on review count
export type JudgeClass = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+' | 'S++';

export interface JudgeClassConfig {
  class: JudgeClass;
  label: string;
  minReviews: number;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

export const JUDGE_CLASS_TIERS: JudgeClassConfig[] = [
  { class: 'S++', label: 'Legendary', minReviews: 500, color: 'text-amber-300', bgColor: 'bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-orange-500/30', borderColor: 'border-amber-400', glowColor: 'shadow-amber-500/50' },
  { class: 'S+', label: 'Master', minReviews: 300, color: 'text-gold', bgColor: 'bg-gradient-to-br from-gold/30 to-yellow-600/20', borderColor: 'border-gold', glowColor: 'shadow-gold/40' },
  { class: 'S', label: 'Expert', minReviews: 150, color: 'text-yellow-400', bgColor: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/10', borderColor: 'border-yellow-500/60', glowColor: 'shadow-yellow-500/30' },
  { class: 'A', label: 'Veteran', minReviews: 75, color: 'text-purple-400', bgColor: 'bg-purple-500/15', borderColor: 'border-purple-500/50', glowColor: 'shadow-purple-500/20' },
  { class: 'B', label: 'Senior', minReviews: 35, color: 'text-blue-400', bgColor: 'bg-blue-500/15', borderColor: 'border-blue-500/50', glowColor: 'shadow-blue-500/20' },
  { class: 'C', label: 'Regular', minReviews: 15, color: 'text-cyan-400', bgColor: 'bg-cyan-500/15', borderColor: 'border-cyan-500/50', glowColor: 'shadow-cyan-500/20' },
  { class: 'D', label: 'Apprentice', minReviews: 5, color: 'text-green-400', bgColor: 'bg-green-500/15', borderColor: 'border-green-500/50', glowColor: 'shadow-green-500/20' },
  { class: 'F', label: 'Rookie', minReviews: 0, color: 'text-muted-foreground', bgColor: 'bg-surface-1', borderColor: 'border-border', glowColor: '' },
];

export function getJudgeClassFromReviews(reviewCount: number): JudgeClassConfig {
  for (const tier of JUDGE_CLASS_TIERS) {
    if (reviewCount >= tier.minReviews) {
      return tier;
    }
  }
  return JUDGE_CLASS_TIERS[JUDGE_CLASS_TIERS.length - 1]; // F tier
}

export function getNextJudgeTier(currentReviews: number): { next: JudgeClassConfig | null; reviewsNeeded: number } {
  const sortedTiers = [...JUDGE_CLASS_TIERS].reverse(); // F to S++
  for (const tier of sortedTiers) {
    if (currentReviews < tier.minReviews) {
      return { next: tier, reviewsNeeded: tier.minReviews - currentReviews };
    }
  }
  return { next: null, reviewsNeeded: 0 }; // Already at S++
}

interface JudgeClassBadgeProps {
  reviewCount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showProgress?: boolean;
  animate?: boolean;
}

export default function JudgeClassBadge({ 
  reviewCount, 
  size = 'md',
  showLabel = false,
  showProgress = false,
  animate = true 
}: JudgeClassBadgeProps) {
  const config = getJudgeClassFromReviews(reviewCount);
  const { next, reviewsNeeded } = getNextJudgeTier(reviewCount);
  
  const isHighTier = ['S', 'S+', 'S++'].includes(config.class);
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };
  
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        initial={animate ? { scale: 0.8, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'inline-flex items-center rounded-full border font-display tracking-wider',
          config.bgColor,
          config.borderColor,
          config.color,
          isHighTier && config.glowColor && `shadow-lg ${config.glowColor}`,
          sizeClasses[size]
        )}
      >
        <Gavel size={iconSizes[size]} className={config.color} />
        <span>{config.class}</span>
        {showLabel && (
          <span className="text-muted-foreground font-normal">
            {config.label}
          </span>
        )}
      </motion.div>
      
      {showProgress && next && (
        <div className="text-center">
          <p className="text-[9px] text-muted-foreground">
            {reviewsNeeded} more to {next.class}
          </p>
          <div className="w-20 h-1 bg-surface-1 rounded-full overflow-hidden mt-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${((reviewCount - (getJudgeClassFromReviews(reviewCount - 1).minReviews)) / 
                  (next.minReviews - getJudgeClassFromReviews(reviewCount - 1).minReviews)) * 100}%` 
              }}
              className={cn('h-full rounded-full', next.bgColor.replace('/15', '/50').replace('/20', '/60'))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
