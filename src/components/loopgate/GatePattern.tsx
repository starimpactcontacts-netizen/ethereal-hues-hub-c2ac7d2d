/**
 * GatePattern — Islamic geometric lattice overlay.
 * Accurate 8-pointed star + interlocking band pattern.
 * Matches traditional Moroccan/Dubai zellige art with proper band crossings.
 */

import { cn } from '@/lib/utils';

interface GatePatternProps {
  className?: string;
  /** Opacity 0-100, default 4 (very subtle) */
  opacity?: number;
  /** Pattern color — defaults to current text color */
  color?: string;
  /** Scale of the pattern tile in px, default 100 */
  tileSize?: number;
}

export default function GatePattern({
  className,
  opacity = 4,
  color = 'white',
  tileSize = 100,
}: GatePatternProps) {
  const patternId = `gate-lattice-${tileSize}`;
  const s = tileSize;
  const h = s / 2;

  // Key ratio for 8-pointed star: tan(22.5°) ≈ 0.4142
  // d = distance from edge to where star points begin
  const d = s * 0.2071; // s / (2 + √2)
  const e = s - d;

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
            <g
              fill="none"
              stroke={color}
              strokeWidth={s * 0.012}
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              {/* === 8-POINTED STAR (center) === */}
              {/* Square 1: axis-aligned, inscribed */}
              <rect x={d} y={d} width={e - d} height={e - d} />
              
              {/* Square 2: rotated 45° — diamond */}
              <polygon points={`${h},${0} ${s},${h} ${h},${s} ${0},${h}`} />
              
              {/* === INTERLOCKING BANDS === */}
              {/* Top-left */}
              <line x1={0} y1={d} x2={d} y2={0} />
              <line x1={0} y1={d} x2={d} y2={d} />
              <line x1={d} y1={0} x2={d} y2={d} />
              
              {/* Top-right */}
              <line x1={s} y1={d} x2={e} y2={0} />
              <line x1={s} y1={d} x2={e} y2={d} />
              <line x1={e} y1={0} x2={e} y2={d} />
              
              {/* Bottom-left */}
              <line x1={0} y1={e} x2={d} y2={s} />
              <line x1={0} y1={e} x2={d} y2={e} />
              <line x1={d} y1={s} x2={d} y2={e} />
              
              {/* Bottom-right */}
              <line x1={s} y1={e} x2={e} y2={s} />
              <line x1={s} y1={e} x2={e} y2={e} />
              <line x1={e} y1={s} x2={e} y2={e} />
              
              {/* === CORNER DIAGONALS === */}
              <line x1={0} y1={0} x2={d} y2={d} />
              <line x1={s} y1={0} x2={e} y2={d} />
              <line x1={0} y1={s} x2={d} y2={e} />
              <line x1={s} y1={s} x2={e} y2={e} />

              {/* === EDGE MIDPOINT CONNECTORS === */}
              <line x1={h} y1={0} x2={d} y2={d} />
              <line x1={h} y1={0} x2={e} y2={d} />
              <line x1={h} y1={s} x2={d} y2={e} />
              <line x1={h} y1={s} x2={e} y2={e} />
              <line x1={0} y1={h} x2={d} y2={d} />
              <line x1={0} y1={h} x2={d} y2={e} />
              <line x1={s} y1={h} x2={e} y2={d} />
              <line x1={s} y1={h} x2={e} y2={e} />

              {/* === INNER OCTAGON for depth === */}
              {(() => {
                const inset = s * 0.12;
                const id2 = d + inset;
                const ie = e - inset;
                const cornerOff = inset * 0.7071;
                return (
                  <polygon points={`
                    ${h},${id2 - inset * 0.3}
                    ${ie + cornerOff * 0.3},${id2 - cornerOff * 0.3}
                    ${ie + inset * 0.3},${h}
                    ${ie + cornerOff * 0.3},${ie + cornerOff * 0.3}
                    ${h},${ie + inset * 0.3}
                    ${id2 - cornerOff * 0.3},${ie + cornerOff * 0.3}
                    ${id2 - inset * 0.3},${h}
                    ${id2 - cornerOff * 0.3},${id2 - cornerOff * 0.3}
                  `} />
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
