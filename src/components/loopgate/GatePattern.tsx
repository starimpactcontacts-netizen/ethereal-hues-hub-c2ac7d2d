/**
 * GatePattern — Islamic geometric lattice overlay.
 * Authentic 8-pointed star + octagon + connecting lattice.
 * Based on traditional Moroccan/Dubai zellige patterns.
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
  const patternId = `gate-lattice-${tileSize}`;
  const s = tileSize;
  const h = s / 2;

  // Key ratio for Islamic 8-point star geometry
  const a = s * 0.2071; // (1 - 1/√2) / 2 ≈ 0.2071 — the classic octagonal cut
  const b = s - a;

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
              strokeWidth="0.8"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              {/* === Central 8-pointed star === */}
              {/* Outer star points */}
              <polygon points={`
                ${h},${0}
                ${h + a * 0.5},${a}
                ${b},${a}
                ${b - a * 0.5},${h}
                ${b},${b}
                ${h + a * 0.5},${b}
                ${h},${s}
                ${h - a * 0.5},${b}
                ${a},${b}
                ${a + a * 0.5},${h}
                ${a},${a}
                ${h - a * 0.5},${a}
              `} />

              {/* Inner octagon */}
              <polygon points={`
                ${h},${a * 1.4}
                ${b - a * 0.9},${a * 1.4}
                ${b - a * 0.4},${h}
                ${b - a * 0.9},${b - a * 0.4}
                ${h},${b - a * 0.4}
                ${a * 1.4},${b - a * 0.4}
                ${a + a * 0.4},${h}
                ${a * 1.4},${a * 1.4}
              `} />

              {/* === Corner rosettes (quarter patterns at each corner) === */}
              {/* Top-left corner star fragment */}
              <polygon points={`
                ${0},${0}
                ${a},${0}
                ${a},${a}
                ${0},${a}
              `} />
              <line x1={0} y1={a} x2={a} y2={a} />
              <line x1={a} y1={0} x2={a} y2={a} />

              {/* Top-right corner */}
              <polygon points={`
                ${s},${0}
                ${b},${0}
                ${b},${a}
                ${s},${a}
              `} />
              <line x1={s} y1={a} x2={b} y2={a} />
              <line x1={b} y1={0} x2={b} y2={a} />

              {/* Bottom-left corner */}
              <polygon points={`
                ${0},${s}
                ${a},${s}
                ${a},${b}
                ${0},${b}
              `} />
              <line x1={0} y1={b} x2={a} y2={b} />
              <line x1={a} y1={s} x2={a} y2={b} />

              {/* Bottom-right corner */}
              <polygon points={`
                ${s},${s}
                ${b},${s}
                ${b},${b}
                ${s},${b}
              `} />
              <line x1={s} y1={b} x2={b} y2={b} />
              <line x1={b} y1={s} x2={b} y2={b} />

              {/* === Diagonal connecting lines (star arms to corners) === */}
              <line x1={a} y1={a} x2={h - a * 0.5} y2={a} />
              <line x1={h + a * 0.5} y1={a} x2={b} y2={a} />
              <line x1={a} y1={b} x2={h - a * 0.5} y2={b} />
              <line x1={h + a * 0.5} y1={b} x2={b} y2={b} />

              <line x1={a} y1={a} x2={a} y2={h - a * 0.5} />
              <line x1={a} y1={h + a * 0.5} x2={a} y2={b} />
              <line x1={b} y1={a} x2={b} y2={h - a * 0.5} />
              <line x1={b} y1={h + a * 0.5} x2={b} y2={b} />

              {/* Cross-diagonal lattice connectors */}
              <line x1={0} y1={a} x2={a} y2={0} />
              <line x1={s} y1={a} x2={b} y2={0} />
              <line x1={0} y1={b} x2={a} y2={s} />
              <line x1={s} y1={b} x2={b} y2={s} />

              {/* Mid-edge star points connecting to border */}
              <line x1={h} y1={0} x2={h - a * 0.5} y2={a} />
              <line x1={h} y1={0} x2={h + a * 0.5} y2={a} />
              <line x1={h} y1={s} x2={h - a * 0.5} y2={b} />
              <line x1={h} y1={s} x2={h + a * 0.5} y2={b} />

              <line x1={0} y1={h} x2={a + a * 0.5} y2={h} />
              <line x1={s} y1={h} x2={b - a * 0.5} y2={h} />

              {/* Side midpoint connections */}
              <line x1={0} y1={h} x2={a} y2={a} />
              <line x1={0} y1={h} x2={a} y2={b} />
              <line x1={s} y1={h} x2={b} y2={a} />
              <line x1={s} y1={h} x2={b} y2={b} />

              {/* === Small decorative shapes === */}
              {/* Small hexagonal accents between stars */}
              <polygon points={`
                ${a * 0.5},${h}
                ${a},${h - a * 0.5}
                ${a},${h + a * 0.5}
              `} />
              <polygon points={`
                ${s - a * 0.5},${h}
                ${b},${h - a * 0.5}
                ${b},${h + a * 0.5}
              `} />
              <polygon points={`
                ${h},${a * 0.5}
                ${h - a * 0.5},${a}
                ${h + a * 0.5},${a}
              `} />
              <polygon points={`
                ${h},${s - a * 0.5}
                ${h - a * 0.5},${b}
                ${h + a * 0.5},${b}
              `} />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
