/**
 * GatePattern — Luxury monogram diamond lattice.
 * Kingdom Hearts / playing card style: diagonal grid with alternating
 * crowns and 4-pointed stars. Dark-on-dark prestige aesthetic.
 */

import { cn } from '@/lib/utils';

interface GatePatternProps {
  className?: string;
  /** Opacity 0-100, default 5 */
  opacity?: number;
  /** Pattern color */
  color?: string;
  /** Tile size in px, default 60 */
  tileSize?: number;
}

export default function GatePattern({
  className,
  opacity = 5,
  color = 'white',
  tileSize = 60,
}: GatePatternProps) {
  const patternId = `gate-monogram-${tileSize}`;
  const s = tileSize;
  const h = s / 2;

  // Diamond grid line width
  const gridW = s * 0.008;
  // Icon sizes
  const iconS = s * 0.18;

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
            {/* Diamond grid lines */}
            <g stroke={color} strokeWidth={gridW} fill="none">
              {/* Diagonal lines forming diamond grid */}
              <line x1={0} y1={0} x2={s} y2={s} />
              <line x1={s} y1={0} x2={0} y2={s} />
              <line x1={h} y1={0} x2={s} y2={h} />
              <line x1={s} y1={h} x2={h} y2={s} />
              <line x1={h} y1={0} x2={0} y2={h} />
              <line x1={0} y1={h} x2={h} y2={s} />
            </g>

            {/* Crown icon at center of tile */}
            <g transform={`translate(${h}, ${h})`} fill={color} stroke="none">
              {/* Simple 3-point crown */}
              {(() => {
                const cw = iconS * 0.9;
                const ch = iconS * 0.7;
                return (
                  <path d={`M${-cw / 2},${ch * 0.2} L${-cw / 2},${-ch * 0.1} L${-cw * 0.25},${ch * 0.05} L${0},${-ch * 0.4} L${cw * 0.25},${ch * 0.05} L${cw / 2},${-ch * 0.1} L${cw / 2},${ch * 0.2} Z`} />
                );
              })()}
            </g>

            {/* 4-pointed star at corners (where tiles meet) */}
            {[[0, 0], [s, 0], [0, s], [s, s]].map(([cx, cy], i) => {
              const r = iconS * 0.45;
              const ri = r * 0.25;
              return (
                <polygon
                  key={i}
                  points={`${cx},${cy - r} ${cx + ri},${cy - ri} ${cx + r},${cy} ${cx + ri},${cy + ri} ${cx},${cy + r} ${cx - ri},${cy + ri} ${cx - r},${cy} ${cx - ri},${cy - ri}`}
                  fill={color}
                  stroke="none"
                />
              );
            })}

            {/* Small dot accents at diamond midpoints */}
            {[[h, 0], [s, h], [h, s], [0, h]].map(([cx, cy], i) => (
              <circle key={`d${i}`} cx={cx} cy={cy} r={s * 0.012} fill={color} />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
