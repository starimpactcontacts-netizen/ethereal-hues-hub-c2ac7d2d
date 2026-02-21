/**
 * GatePattern — 4-pointed star grid overlay.
 * Clean, minimal repeating diamond-star pattern.
 */

import { cn } from '@/lib/utils';

interface GatePatternProps {
  className?: string;
  /** Opacity 0-100, default 4 (very subtle) */
  opacity?: number;
  /** Pattern color — defaults to current text color */
  color?: string;
  /** Scale of the pattern tile in px, default 32 */
  tileSize?: number;
}

export default function GatePattern({
  className,
  opacity = 4,
  color = 'white',
  tileSize = 32,
}: GatePatternProps) {
  const patternId = `gate-stars-${tileSize}`;
  const s = tileSize;
  const h = s / 2;
  // 4-pointed star dimensions
  const starW = s * 0.12; // horizontal half-width
  const starH = s * 0.3;  // vertical half-height

  return (
    <div
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{ opacity: opacity / 100 }}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width={s}
            height={s}
            patternUnits="userSpaceOnUse"
          >
            {/* 4-pointed star at center of each tile */}
            <path
              d={`M${h},${h - starH} C${h + starW * 0.6},${h - starH * 0.3} ${h + starW},${h - starW * 0.6} ${h + starW},${h} C${h + starW},${h + starW * 0.6} ${h + starW * 0.6},${h + starH * 0.3} ${h},${h + starH} C${h - starW * 0.6},${h + starH * 0.3} ${h - starW},${h + starW * 0.6} ${h - starW},${h} C${h - starW},${h - starW * 0.6} ${h - starW * 0.6},${h - starH * 0.3} ${h},${h - starH}Z`}
              fill="none"
              stroke={color}
              strokeWidth={s * 0.025}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
