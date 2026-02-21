/**
 * GatePattern — Luxury monogram-style repeating pattern.
 * Crown icons + 4-point stars + dotted diamond lattice.
 * Inspired by high-fashion house motifs (LV, Goyard, etc.)
 */

import { cn } from '@/lib/utils';

interface GatePatternProps {
  className?: string;
  /** Opacity 0-100, default 4 (very subtle) */
  opacity?: number;
  /** Pattern color — defaults to current text color */
  color?: string;
  /** Scale of the pattern tile in px, default 120 */
  tileSize?: number;
}

export default function GatePattern({
  className,
  opacity = 4,
  color = 'white',
  tileSize = 120,
}: GatePatternProps) {
  const patternId = `gate-luxury-${tileSize}`;
  const s = tileSize;
  const h = s / 2;

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
            <g fill={color} stroke="none">
              {/* === Crown at center === */}
              <g transform={`translate(${h}, ${h * 0.45}) scale(${s / 200})`}>
                {/* Crown base */}
                <rect x="-12" y="8" width="24" height="3" rx="1" />
                {/* Crown body */}
                <path d="M-14,8 L-12,-2 L-7,5 L-3,-6 L0,3 L3,-6 L7,5 L12,-2 L14,8 Z" />
                {/* Crown jewels (dots on tips) */}
                <circle cx="-3" cy="-8" r="1.5" />
                <circle cx="0" cy="-1" r="1.2" />
                <circle cx="3" cy="-8" r="1.5" />
                <circle cx="-7" cy="3" r="1.2" />
                <circle cx="7" cy="3" r="1.2" />
              </g>

              {/* === 4-point star accents === */}
              {/* Star top-left quadrant */}
              <g transform={`translate(${s * 0.18}, ${s * 0.18})`}>
                <path d={`M0,-${s*0.025} L${s*0.008},0 L0,${s*0.025} L-${s*0.008},0 Z`} />
              </g>
              {/* Star top-right */}
              <g transform={`translate(${s * 0.82}, ${s * 0.18})`}>
                <path d={`M0,-${s*0.025} L${s*0.008},0 L0,${s*0.025} L-${s*0.008},0 Z`} />
              </g>
              {/* Star bottom-left */}
              <g transform={`translate(${s * 0.18}, ${s * 0.82})`}>
                <path d={`M0,-${s*0.025} L${s*0.008},0 L0,${s*0.025} L-${s*0.008},0 Z`} />
              </g>
              {/* Star bottom-right */}
              <g transform={`translate(${s * 0.82}, ${s * 0.82})`}>
                <path d={`M0,-${s*0.025} L${s*0.008},0 L0,${s*0.025} L-${s*0.008},0 Z`} />
              </g>
              {/* Star center-left */}
              <g transform={`translate(${s * 0.0}, ${s * 0.5})`}>
                <path d={`M0,-${s*0.025} L${s*0.008},0 L0,${s*0.025} L-${s*0.008},0 Z`} />
              </g>
              {/* Star center-right */}
              <g transform={`translate(${s * 1.0}, ${s * 0.5})`}>
                <path d={`M0,-${s*0.025} L${s*0.008},0 L0,${s*0.025} L-${s*0.008},0 Z`} />
              </g>
              {/* Star center-top */}
              <g transform={`translate(${h}, ${0})`}>
                <path d={`M0,-${s*0.025} L${s*0.008},0 L0,${s*0.025} L-${s*0.008},0 Z`} />
              </g>
              {/* Star center-bottom */}
              <g transform={`translate(${h}, ${s})`}>
                <path d={`M0,-${s*0.025} L${s*0.008},0 L0,${s*0.025} L-${s*0.008},0 Z`} />
              </g>
            </g>

            {/* === Dotted diamond lattice === */}
            <g fill="none" stroke={color} strokeWidth="0.5" strokeDasharray={`${s * 0.015} ${s * 0.03}`}>
              {/* Diamond from center-top to center-right to center-bottom to center-left */}
              <polygon points={`${h},${0} ${s},${h} ${h},${s} ${0},${h}`} />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
