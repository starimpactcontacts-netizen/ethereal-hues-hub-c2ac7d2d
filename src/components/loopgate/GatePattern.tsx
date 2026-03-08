/**
 * GatePattern — Premium geometric lattice background.
 * Layered hexagonal grid + crosshairs + concentric rings for depth.
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
  const id = `gate-lattice-${tileSize}`;
  const s = tileSize;
  const h = s / 2;
  const arm = s * 0.14;
  const dotR = s * 0.02;
  const strokeW = s * 0.01;
  const ringR1 = s * 0.12;
  const ringR2 = s * 0.22;
  const diagLen = s * 0.08;

  return (
    <div
      className={cn(
        'pointer-events-none -z-10',
        className?.includes('fixed') ? '' : 'absolute inset-0',
        className
      )}
      style={{ opacity: opacity / 100 }}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Main tile pattern */}
          <pattern
            id={id}
            x="0" y="0"
            width={s} height={s}
            patternUnits="userSpaceOnUse"
          >
            {/* Center crosshair — thicker, more visible */}
            <g stroke={color} strokeWidth={strokeW * 1.5} strokeLinecap="round" opacity="0.7">
              <line x1={h - arm} y1={h} x2={h + arm} y2={h} />
              <line x1={h} y1={h - arm} x2={h} y2={h + arm} />
            </g>

            {/* Inner ring */}
            <circle
              cx={h} cy={h} r={ringR1}
              fill="none" stroke={color}
              strokeWidth={strokeW * 0.8}
              opacity="0.35"
            />

            {/* Outer ring */}
            <circle
              cx={h} cy={h} r={ringR2}
              fill="none" stroke={color}
              strokeWidth={strokeW * 0.5}
              opacity="0.15"
            />

            {/* Corner brackets — L-shaped marks */}
            {[
              { x: 0, y: 0, dx: 1, dy: 1 },
              { x: s, y: 0, dx: -1, dy: 1 },
              { x: 0, y: s, dx: 1, dy: -1 },
              { x: s, y: s, dx: -1, dy: -1 },
            ].map((c, i) => (
              <g key={i} stroke={color} strokeWidth={strokeW} strokeLinecap="round" opacity="0.4">
                <line x1={c.x} y1={c.y} x2={c.x + c.dx * arm * 0.7} y2={c.y} />
                <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + c.dy * arm * 0.7} />
              </g>
            ))}

            {/* Diagonal tick marks at 45° from center */}
            {[
              [h - diagLen, h - diagLen, h - diagLen * 0.5, h - diagLen * 0.5],
              [h + diagLen, h - diagLen, h + diagLen * 0.5, h - diagLen * 0.5],
              [h - diagLen, h + diagLen, h - diagLen * 0.5, h + diagLen * 0.5],
              [h + diagLen, h + diagLen, h + diagLen * 0.5, h + diagLen * 0.5],
            ].map(([x1, y1, x2, y2], i) => (
              <line
                key={`diag-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth={strokeW * 0.6}
                strokeLinecap="round"
                opacity="0.25"
              />
            ))}

            {/* Corner dots */}
            {[[0, 0], [s, 0], [0, s], [s, s]].map(([cx, cy], i) => (
              <circle key={`dot-${i}`} cx={cx} cy={cy} r={dotR} fill={color} opacity="0.5" />
            ))}

            {/* Center dot */}
            <circle cx={h} cy={h} r={dotR * 1.2} fill={color} opacity="0.6" />

            {/* Edge midpoint ticks */}
            {[
              [h, 0], [h, s], [0, h], [s, h],
            ].map(([cx, cy], i) => (
              <circle key={`edge-${i}`} cx={cx} cy={cy} r={dotR * 0.7} fill={color} opacity="0.2" />
            ))}
          </pattern>

          {/* Large-scale overlay pattern for depth */}
          <pattern
            id={`${id}-macro`}
            x="0" y="0"
            width={s * 4} height={s * 4}
            patternUnits="userSpaceOnUse"
          >
            {/* Large concentric target */}
            <circle
              cx={s * 2} cy={s * 2} r={s * 1.2}
              fill="none" stroke={color}
              strokeWidth={strokeW * 0.4}
              opacity="0.08"
            />
            <circle
              cx={s * 2} cy={s * 2} r={s * 1.8}
              fill="none" stroke={color}
              strokeWidth={strokeW * 0.3}
              opacity="0.05"
            />

            {/* Diamond connector lines */}
            <line
              x1={s * 2} y1={s * 0.5}
              x2={s * 3.5} y2={s * 2}
              stroke={color} strokeWidth={strokeW * 0.3}
              opacity="0.06"
            />
            <line
              x1={s * 3.5} y1={s * 2}
              x2={s * 2} y2={s * 3.5}
              stroke={color} strokeWidth={strokeW * 0.3}
              opacity="0.06"
            />
            <line
              x1={s * 2} y1={s * 3.5}
              x2={s * 0.5} y2={s * 2}
              stroke={color} strokeWidth={strokeW * 0.3}
              opacity="0.06"
            />
            <line
              x1={s * 0.5} y1={s * 2}
              x2={s * 2} y2={s * 0.5}
              stroke={color} strokeWidth={strokeW * 0.3}
              opacity="0.06"
            />
          </pattern>
        </defs>

        {/* Base micro grid */}
        <rect width="100%" height="100%" fill={`url(#${id})`} />
        {/* Macro overlay */}
        <rect width="100%" height="100%" fill={`url(#${id}-macro)`} />
      </svg>
    </div>
  );
}
