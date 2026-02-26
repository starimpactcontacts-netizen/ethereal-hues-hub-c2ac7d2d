/**
 * GatePattern — Minimal crosshair dot grid.
 * Subtle, barely-visible geometric texture. Sits behind content.
 */

import { cn } from '@/lib/utils';

interface GatePatternProps {
  className?: string;
  /** Opacity 0-100, default 3 */
  opacity?: number;
  /** Pattern color */
  color?: string;
  /** Tile size in px, default 48 */
  tileSize?: number;
}

export default function GatePattern({
  className,
  opacity = 3,
  color = 'white',
  tileSize = 48,
}: GatePatternProps) {
  const patternId = `gate-crosshair-${tileSize}`;
  const s = tileSize;
  const h = s / 2;
  const arm = s * 0.08; // short crosshair arm
  const dotR = s * 0.015; // tiny dot
  const strokeW = s * 0.012;

  return (
    <div
      className={cn('pointer-events-none -z-10', className?.includes('fixed') ? '' : 'absolute inset-0', className)}
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
            x="0" y="0"
            width={s} height={s}
            patternUnits="userSpaceOnUse"
          >
            {/* Center crosshair */}
            <g stroke={color} strokeWidth={strokeW} strokeLinecap="round">
              <line x1={h - arm} y1={h} x2={h + arm} y2={h} />
              <line x1={h} y1={h - arm} x2={h} y2={h + arm} />
            </g>

            {/* Corner dots */}
            {[[0, 0], [s, 0], [0, s], [s, s]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={dotR} fill={color} />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
