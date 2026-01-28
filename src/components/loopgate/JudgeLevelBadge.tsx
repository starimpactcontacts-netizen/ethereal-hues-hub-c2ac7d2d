import { cn } from '@/lib/utils';
import { Gavel } from 'lucide-react';

interface JudgeLevelBadgeProps {
  level: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

// Color scheme based on judge level tier
const judgeLevelColors: Record<number, { bg: string; text: string; border: string; glow?: string }> = {
  1: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-muted-foreground/30' },
  2: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-muted-foreground/30' },
  3: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  4: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  5: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  6: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  7: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  8: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  9: { bg: 'bg-gold/10', text: 'text-gold', border: 'border-gold/30', glow: 'shadow-[0_0_8px_rgba(212,175,55,0.4)]' },
  10: { bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold/50', glow: 'shadow-[0_0_12px_rgba(212,175,55,0.6)]' },
};

const sizeClasses = {
  xs: 'text-[8px] px-1 py-0.5 gap-0.5',
  sm: 'text-[9px] px-1.5 py-0.5 gap-1',
  md: 'text-[10px] px-2 py-1 gap-1',
  lg: 'text-xs px-2.5 py-1 gap-1.5',
};

const iconSizes = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
};

export default function JudgeLevelBadge({ 
  level, 
  size = 'sm', 
  showIcon = true,
  className 
}: JudgeLevelBadgeProps) {
  const colors = judgeLevelColors[level] || judgeLevelColors[1];
  const hasGlow = level >= 9;
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold uppercase tracking-wider border transition-shadow rounded',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        hasGlow && colors.glow,
        hasGlow && 'animate-pulse',
        className
      )}
    >
      {showIcon && <Gavel size={iconSizes[size]} />}
      <span>JLv{level}</span>
    </span>
  );
}
