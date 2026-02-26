/**
 * IndexHeroPattern — Bespoke technical blueprint pattern for the Index hero.
 * Layered concentric rings, hash marks, and scan lines.
 * Feels like a military-grade targeting system / architectural blueprint.
 */
import { cn } from '@/lib/utils';

interface IndexHeroPatternProps {
  className?: string;
}

export default function IndexHeroPattern({ className }: IndexHeroPatternProps) {
  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Repeating grid — fine hash marks */}
          <pattern id="idx-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            {/* Intersection crosshairs */}
            <line x1="19" y1="16" x2="19" y2="24" stroke="white" strokeWidth="0.3" opacity="0.12" />
            <line x1="16" y1="20" x2="24" y2="20" stroke="white" strokeWidth="0.3" opacity="0.12" />
            {/* Corner ticks */}
            <line x1="0" y1="0" x2="3" y2="0" stroke="white" strokeWidth="0.4" opacity="0.08" />
            <line x1="0" y1="0" x2="0" y2="3" stroke="white" strokeWidth="0.4" opacity="0.08" />
            <line x1="40" y1="0" x2="37" y2="0" stroke="white" strokeWidth="0.4" opacity="0.08" />
            <line x1="40" y1="40" x2="37" y2="40" stroke="white" strokeWidth="0.4" opacity="0.08" />
            <line x1="40" y1="40" x2="40" y2="37" stroke="white" strokeWidth="0.4" opacity="0.08" />
            <line x1="0" y1="40" x2="0" y2="37" stroke="white" strokeWidth="0.4" opacity="0.08" />
            <line x1="0" y1="40" x2="3" y2="40" stroke="white" strokeWidth="0.4" opacity="0.08" />
          </pattern>

          {/* Concentric targeting rings */}
          <radialGradient id="idx-ring-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.06" />
            <stop offset="60%" stopColor="white" stopOpacity="0.03" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base grid */}
        <rect width="100%" height="100%" fill="url(#idx-grid)" />

        {/* Concentric rings — left cluster */}
        <g opacity="0.06">
          <circle cx="15%" cy="60%" r="120" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="15%" cy="60%" r="80" fill="none" stroke="white" strokeWidth="0.4" />
          <circle cx="15%" cy="60%" r="40" fill="none" stroke="white" strokeWidth="0.3" />
          <circle cx="15%" cy="60%" r="6" fill="white" opacity="0.5" />
        </g>

        {/* Concentric rings — right cluster */}
        <g opacity="0.05">
          <circle cx="85%" cy="30%" r="100" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="85%" cy="30%" r="60" fill="none" stroke="white" strokeWidth="0.4" />
          <circle cx="85%" cy="30%" r="25" fill="none" stroke="white" strokeWidth="0.3" />
          <circle cx="85%" cy="30%" r="4" fill="white" opacity="0.4" />
        </g>

        {/* Diagonal scan lines */}
        <g opacity="0.03" strokeWidth="0.5" stroke="white">
          <line x1="0" y1="0" x2="100%" y2="100%" />
          <line x1="30%" y1="0" x2="100%" y2="70%" />
          <line x1="60%" y1="0" x2="100%" y2="40%" />
        </g>

        {/* Horizontal scan bands */}
        <rect x="0" y="25%" width="100%" height="1" fill="white" opacity="0.025" />
        <rect x="0" y="50%" width="100%" height="1" fill="white" opacity="0.02" />
        <rect x="0" y="75%" width="100%" height="1" fill="white" opacity="0.025" />

        {/* Bracket marks — top left */}
        <g opacity="0.08" stroke="white" strokeWidth="0.6" fill="none">
          <polyline points="20,8 8,8 8,28" />
          <polyline points="20,100% 8,100% 8,calc(100%-20)" />
        </g>

        {/* Corner registration marks — top right */}
        <g opacity="0.06" stroke="white" strokeWidth="0.5" fill="none" transform="translate(-20, 0)">
          <line x1="100%" y1="10" x2="calc(100% - 12)" y2="10" />
          <line x1="100%" y1="10" x2="100%" y2="22" />
        </g>

        {/* Radial fade overlay */}
        <rect width="100%" height="100%" fill="url(#idx-ring-fade)" />
      </svg>
    </div>
  );
}