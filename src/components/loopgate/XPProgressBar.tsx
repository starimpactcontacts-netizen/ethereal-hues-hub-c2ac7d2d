import { cn } from "@/lib/utils";
import { getXPForNextLevel, getXPForCurrentLevel, XP_LEVELS } from "@/hooks/useXP";

interface XPProgressBarProps {
  xp: number;
  level: number;
  showNumbers?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function XPProgressBar({ 
  xp, 
  level, 
  showNumbers = true,
  size = "md",
  className 
}: XPProgressBarProps) {
  const currentLevelXP = getXPForCurrentLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  const isMaxLevel = level >= 10;
  
  // Calculate progress percentage
  const xpIntoCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progress = isMaxLevel ? 100 : Math.min(100, (xpIntoCurrentLevel / xpNeededForNextLevel) * 100);

  const heightClasses = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  };

  return (
    <div className={cn("w-full", className)}>
      {showNumbers && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {isMaxLevel ? "Max Level" : `XP: ${xp.toLocaleString()} / ${nextLevelXP.toLocaleString()}`}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {isMaxLevel ? "" : `→ Level ${level + 1}`}
          </span>
        </div>
      )}
      <div className={cn("w-full bg-muted overflow-hidden", heightClasses[size])}>
        <div 
          className="h-full bg-gold transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
