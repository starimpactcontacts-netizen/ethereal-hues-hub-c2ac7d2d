/**
 * GatePattern — Islamic 8-pointed star geometric lattice.
 * Two overlapping squares (one rotated 45°) with interlocking bands.
 * Dark-on-dark aesthetic matching traditional Moroccan/Arabic mashrabiya screens.
 */

import { cn } from '@/lib/utils';

interface GatePatternProps {
  className?: string;
  /** Opacity 0-100, default 5 */
  opacity?: number;
  /** Pattern stroke color */
  color?: string;
  /** Tile size in px, default 80 */
  tileSize?: number;
}

export default function GatePattern({
  className,
  opacity = 5,
  color = 'white',
  tileSize = 80,
}: GatePatternProps) {
  const patternId = `gate-islamic-${tileSize}`;
  const s = tileSize;
  const h = s / 2;
  
  // For an 8-pointed star: key ratio from tan(22.5°) ≈ 0.4142
  // p = inset from edge where the star arms begin
  const p = s / (2 + Math.SQRT2); // ≈ 0.2929 * s
  const q = s - p; // opposite side

  // The 8 vertices of the star (tips of the 8 points)
  // Top, Top-Right, Right, Bottom-Right, Bottom, Bottom-Left, Left, Top-Left
  const tips = [
    [h, 0],      // top
    [s, 0],      // top-right corner (of tile, for band connections)  
    [s, h],      // right
    [s, s],      // bottom-right corner
    [h, s],      // bottom
    [0, s],      // bottom-left corner
    [0, h],      // left
    [0, 0],      // top-left corner
  ];

  // Inner square vertices (axis-aligned)
  const sq1 = `${p},${p} ${q},${p} ${q},${q} ${p},${q}`;
  
  // Diamond (45° rotated square)
  const sq2 = `${h},${0} ${s},${h} ${h},${s} ${0},${h}`;

  const sw = s * 0.015; // stroke width

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
            x="0" y="0"
            width={s} height={s}
            patternUnits="userSpaceOnUse"
          >
            <g fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round">
              {/* Axis-aligned square */}
              <polygon points={sq1} />
              
              {/* 45° rotated diamond */}
              <polygon points={sq2} />

              {/* Band connections — top-left corner */}
              <line x1={0} y1={p} x2={p} y2={0} />
              <line x1={0} y1={p} x2={p} y2={p} />
              <line x1={p} y1={0} x2={p} y2={p} />

              {/* Band connections — top-right corner */}
              <line x1={q} y1={0} x2={s} y2={p} />
              <line x1={q} y1={0} x2={q} y2={p} />
              <line x1={s} y1={p} x2={q} y2={p} />

              {/* Band connections — bottom-right corner */}
              <line x1={s} y1={q} x2={q} y2={s} />
              <line x1={s} y1={q} x2={q} y2={q} />
              <line x1={q} y1={s} x2={q} y2={q} />

              {/* Band connections — bottom-left corner */}
              <line x1={p} y1={s} x2={0} y2={q} />
              <line x1={p} y1={s} x2={p} y2={q} />
              <line x1={0} y1={q} x2={p} y2={q} />

              {/* Corner diagonal fills */}
              <line x1={0} y1={0} x2={p} y2={p} />
              <line x1={s} y1={0} x2={q} y2={p} />
              <line x1={s} y1={s} x2={q} y2={q} />
              <line x1={0} y1={s} x2={p} y2={q} />

              {/* Diamond tip to inner square connections */}
              <line x1={h} y1={0} x2={p} y2={p} />
              <line x1={h} y1={0} x2={q} y2={p} />
              <line x1={s} y1={h} x2={q} y2={p} />
              <line x1={s} y1={h} x2={q} y2={q} />
              <line x1={h} y1={s} x2={q} y2={q} />
              <line x1={h} y1={s} x2={p} y2={q} />
              <line x1={0} y1={h} x2={p} y2={q} />
              <line x1={0} y1={h} x2={p} y2={p} />

              {/* Inner 8-pointed star void — small rotated square inside */}
              {(() => {
                const i = s * 0.15;
                const a = h - i;
                const b = h + i;
                return (
                  <>
                    <polygon points={`${a},${a} ${b},${a} ${b},${b} ${a},${b}`} />
                    <polygon points={`${h},${a - i * 0.42} ${b + i * 0.42},${h} ${h},${b + i * 0.42} ${a - i * 0.42},${h}`} />
                  </>
                );
              })()}
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
