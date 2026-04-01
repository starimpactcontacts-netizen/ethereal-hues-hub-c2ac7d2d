import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

/** Hub — eye with signal rings */
export function HubIcon({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={cn("text-current", className)}>
      {/* Outer signal ring */}
      <path d="M5 16C5 16 9 8 16 8s11 8 11 8-4 8-11 8S5 16 5 16z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Inner iris */}
      <circle cx="16" cy="16" r="4.5" stroke="currentColor" strokeWidth="2" />
      {/* Pupil with loop */}
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      {/* Signal dots */}
      <circle cx="4" cy="16" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="28" cy="16" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** Arena — crossed blades with spark */
export function ArenaIcon({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={cn("text-current", className)}>
      {/* Left blade */}
      <path d="M8 4L22 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 4L6 6l2 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Right blade */}
      <path d="M24 4L10 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 4L26 6l-2 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Center spark */}
      <circle cx="16" cy="12" r="2" fill="currentColor" />
      {/* Ground plate */}
      <path d="M10 24h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 27h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Stem */}
      <line x1="16" y1="18" x2="16" y2="24" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Rankings — podium with crown */
export function RankingsIcon({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={cn("text-current", className)}>
      {/* Crown on top */}
      <path d="M11 10L13 6l3 3 3-3 2 4H11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 1st place pillar (center, tallest) */}
      <rect x="12" y="12" width="8" height="14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* 2nd place pillar (left) */}
      <rect x="3" y="18" width="9" height="8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* 3rd place pillar (right) */}
      <rect x="20" y="20" width="9" height="6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Number marks */}
      <text x="16" y="22" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="bold" fontFamily="Teko, sans-serif">1</text>
    </svg>
  );
}

/** Rate My Edit — brain with meter */
export function RateIcon({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={cn("text-current", className)}>
      {/* Brain outline */}
      <path d="M16 4C12 4 9 6 9 9c0 2-2 3-2 6 0 4 3 7 7 8h4c4-1 7-4 7-8 0-3-2-4-2-6 0-3-3-5-7-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Brain center split */}
      <line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      {/* Brain folds */}
      <path d="M12 10c2 1 4 0 4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M20 10c-2 1-4 0-4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 15c2 0 3-1 5-1s3 1 5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Meter bar at bottom */}
      <rect x="8" y="26" width="16" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="26" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** Units — shield with people */
export function UnitsIcon({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={cn("text-current", className)}>
      {/* Shield outline */}
      <path d="M16 3L5 8v8c0 6 4.5 10.5 11 13 6.5-2.5 11-7 11-13V8L16 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Center figure */}
      <circle cx="16" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 21c0-2.5 2-4 4-4s4 1.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Side marks */}
      <circle cx="10" cy="15" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="22" cy="15" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** Missions — target with dollar */
export function MissionsIcon({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={cn("text-current", className)}>
      {/* Outer target ring */}
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
      {/* Inner ring */}
      <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="1.5" />
      {/* Bullseye */}
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      {/* Crosshair ticks */}
      <line x1="16" y1="2" x2="16" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="27" x2="16" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="16" x2="5" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default { HubIcon, ArenaIcon, RankingsIcon, RateIcon, UnitsIcon, MissionsIcon };
