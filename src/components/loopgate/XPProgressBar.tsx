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

  const trackH = size === "sm" ? 6 : size === "md" ? 8 : 10;

  return (
    <div className={cn("w-full", className)}>
      {showNumbers && (
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ fontFamily: 'Teko, sans-serif', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em' }}
          >
            {isMaxLevel
              ? "MAX LEVEL"
              : `XP  ${safeXp.toLocaleString()} / ${nextLevelXP.toLocaleString()}`}
          </span>
          {!isMaxLevel && (
            <span
              className="text-[10px] font-black"
              style={{ fontFamily: 'Teko, sans-serif', color: 'rgba(245,158,11,0.55)', letterSpacing: '0.12em' }}
            >
              → LV {effectiveLevel + 1}
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className="relative w-full overflow-visible"
        style={{ height: trackH }}
      >
        {/* Background track */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        />

        {/* Fill */}
        {progress > 0 && (
          <div
            className="absolute top-0 left-0 h-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #b45309 0%, #d97706 35%, #f59e0b 70%, #fcd34d 100%)',
              boxShadow: '0 0 10px rgba(245,158,11,0.5), 0 0 24px rgba(245,158,11,0.2)',
              transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* Shimmer sweep */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ borderRadius: 'inherit' }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-60%',
                  width: '50%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                  animation: 'xp-shimmer 2.2s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        )}

        {/* Glowing tip dot */}
        {progress > 2 && progress < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              left: `calc(${progress}% - ${trackH / 2}px)`,
              width: trackH + 2,
              height: trackH + 2,
              borderRadius: '50%',
              background: '#fcd34d',
              boxShadow: '0 0 6px 2px rgba(252,211,77,0.7), 0 0 14px 4px rgba(245,158,11,0.4)',
              transition: 'left 0.7s cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        )}

        {/* Tick marks at 25 / 50 / 75 */}
        {[25, 50, 75].map((pct) => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${pct}%`,
              background: pct <= progress
                ? 'rgba(0,0,0,0.3)'
                : 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes xp-shimmer {
          0%   { left: -60%; }
          100% { left: 130%; }
        }
      `}</style>
    </div>
  );
}
