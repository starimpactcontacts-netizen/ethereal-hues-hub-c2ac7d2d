import { cn } from '@/lib/utils';
import { JUDGE_XP_LEVELS, getJudgeXPForNextLevel, getJudgeLevelPerk } from '@/hooks/useJudgeLeaderboard';
import { Gavel, Sparkles } from 'lucide-react';

interface JudgeXPProgressBarProps {
  judgeXp: number;
  judgeLevel: number;
  showNumbers?: boolean;
  showPerk?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function JudgeXPProgressBar({ 
  judgeXp, 
  judgeLevel, 
  showNumbers = true,
  showPerk = false,
  size = 'md',
  className 
}: JudgeXPProgressBarProps) {
  const currentLevelXP = JUDGE_XP_LEVELS[judgeLevel - 1]?.xpRequired || 0;
  const nextLevelXP = getJudgeXPForNextLevel(judgeLevel);
  const isMaxLevel = judgeLevel >= 10;
  const nextPerk = getJudgeLevelPerk(judgeLevel + 1);
  
  // Calculate progress percentage
  const xpIntoCurrentLevel = judgeXp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progress = isMaxLevel ? 100 : Math.min(100, (xpIntoCurrentLevel / xpNeededForNextLevel) * 100);

  const heightClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className={cn('w-full', className)}>
      {showNumbers && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Gavel size={10} className="text-gold" />
            {isMaxLevel ? 'Max Judge Level' : `JXP: ${judgeXp.toLocaleString()} / ${nextLevelXP.toLocaleString()}`}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {isMaxLevel ? '' : `→ JLv${judgeLevel + 1}`}
          </span>
        </div>
      )}
      <div className={cn('w-full bg-muted overflow-hidden rounded-full', heightClasses[size])}>
        <div 
          className="h-full bg-gradient-to-r from-gold to-amber-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showPerk && nextPerk && !isMaxLevel && (
        <div className="flex items-center gap-1 mt-1.5">
          <Sparkles size={10} className="text-purple-400" />
          <span className="text-[9px] text-purple-400">
            Unlock at JLv{judgeLevel + 1}: {nextPerk}
          </span>
        </div>
      )}
    </div>
  );
}
