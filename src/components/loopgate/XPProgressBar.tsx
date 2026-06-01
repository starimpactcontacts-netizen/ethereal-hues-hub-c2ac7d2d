import { cn } from "@/lib/utils";
import { getXPForNextLevel, getXPForCurrentLevel, MAX_LEVEL, calculateLevelFromXP } from "@/hooks/useXP";

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
  className,
}: XPProgressBarProps) {
  const safeXp = Math.max(0, xp || 0);
  const derivedLevel = calculateLevelFromXP(safeXp);
  const effectiveLevel = Math.min(derivedLevel, level || derivedLevel) || derivedLevel;
  const currentLevelXP = getXPForCurrentLevel(effectiveLevel);
  const nextLevelXP = getXPForNextLevel(effectiveLevel);
  const isMaxLevel = effectiveLevel >= MAX_LEVEL;

  const xpIntoCurrentLevel = safeXp - currentLevelXP;
  const xpNeededForNextLevel = Math.max(1, nextLevelXP - currentLevelXP);
  const progress = isMaxLevel
    ? 100
    : Math.max(0, Math.min(100, (xpIntoCurrentLevel / xpNeededForNextLevel) * 100));

  const trackH = size === "sm" ? 3 : size === "md" ? 4 : 6;

  return (
    <div className={cn("w-full", className)}>
      {showNumbers && (
        <div className="flex items-center justify-between mb-1.5">
          <span
            style={{
              fontFamily: 'Teko, sans-serif',
              fontSize: 9,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.28)',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {isMaxLevel ? "MAX LEVEL" : `XP  ${safeXp.toLocaleString()} / ${nextLevelXP.toLocaleString()}`}
          </span>
          {!isMaxLevel && (
            <span
              style={{
                fontFamily: 'Teko, sans-serif',
                fontSize: 9,
                letterSpacing: '0.06em',
                color: 'rgba(245,158,11,0.5)',
                fontWeight: 700,
              }}
            >
              → LV {effectiveLevel + 1}
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div className="relative w-full" style={{ height: trackH }}>
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        />

        {/* Fill */}
        {progress > 0 && (
          <div
            className="absolute top-0 left-0 h-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ca8a04, #fbbf24)',
              boxShadow: '0 0 6px rgba(251,191,36,0.3)',
              transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* Single subtle shimmer */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-80%',
                  width: '40%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                  animation: 'xp-shimmer 3s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes xp-shimmer {
          0%   { left: -80%; }
          100% { left: 120%; }
        }
      `}</style>
    </div>
  );
}
