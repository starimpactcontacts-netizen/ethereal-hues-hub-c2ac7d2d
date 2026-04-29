import { cn } from "@/lib/utils";
import { getXPForNextLevel, getXPForCurrentLevel, XP_LEVELS, MAX_LEVEL, calculateLevelFromXP } from "@/hooks/useXP";

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
  // Defensive: derive the true level from XP in case the stored level is stale/out of sync
  const safeXp = Math.max(0, xp || 0);
  const derivedLevel = calculateLevelFromXP(safeXp);
  const effectiveLevel = Math.min(derivedLevel, level || derivedLevel) || derivedLevel;
  const currentLevelXP = getXPForCurrentLevel(effectiveLevel);
  const nextLevelXP = getXPForNextLevel(effectiveLevel);
  const isMaxLevel = effectiveLevel >= MAX_LEVEL;
  
  // Calculate progress percentage (clamped 0-100)
  const xpIntoCurrentLevel = safeXp - currentLevelXP;
  const xpNeededForNextLevel = Math.max(1, nextLevelXP - currentLevelXP);
  const progress = isMaxLevel
    ? 100
    : Math.max(0, Math.min(100, (xpIntoCurrentLevel / xpNeededForNextLevel) * 100));

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
            {isMaxLevel ? "Max Level" : `XP: ${safeXp.toLocaleString()} / ${nextLevelXP.toLocaleString()}`}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {isMaxLevel ? "" : `→ Level ${effectiveLevel + 1}`}
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
