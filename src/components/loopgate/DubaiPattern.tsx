/**
 * DubaiPattern — Islamic geometric lattice overlay.
 * 8-pointed star + octagon + connecting lattice.
 * Inspired by Dubai Mall / Moroccan zellige art.
 */

import { cn } from '@/lib/utils';

interface DubaiPatternProps {
  className?: string;
  opacity?: number;
  color?: string;
  tileSize?: number;
}

export default function DubaiPattern({
  className,
  opacity = 4,
  color = 'white',
  tileSize = 120,
}: DubaiPatternProps) {
  const patternId = `dubai-lattice-${tileSize}`;
  const s = tileSize;
  const h = s / 2;
  const a = s * 0.2071;
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
              {/* Central 8-pointed star */}
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

              {/* Corner squares */}
              <rect x={0} y={0} width={a} height={a} />
              <rect x={b} y={0} width={a} height={a} />
              <rect x={0} y={b} width={a} height={a} />
              <rect x={b} y={b} width={a} height={a} />

              {/* Horizontal/vertical connectors */}
              <line x1={a} y1={a} x2={h - a * 0.5} y2={a} />
              <line x1={h + a * 0.5} y1={a} x2={b} y2={a} />
              <line x1={a} y1={b} x2={h - a * 0.5} y2={b} />
              <line x1={h + a * 0.5} y1={b} x2={b} y2={b} />
              <line x1={a} y1={a} x2={a} y2={h - a * 0.5} />
              <line x1={a} y1={h + a * 0.5} x2={a} y2={b} />
              <line x1={b} y1={a} x2={b} y2={h - a * 0.5} />
              <line x1={b} y1={h + a * 0.5} x2={b} y2={b} />

              {/* Diagonal corner connectors */}
              <line x1={0} y1={a} x2={a} y2={0} />
              <line x1={s} y1={a} x2={b} y2={0} />
              <line x1={0} y1={b} x2={a} y2={s} />
              <line x1={s} y1={b} x2={b} y2={s} />

              {/* Star arm tips */}
              <line x1={h} y1={0} x2={h - a * 0.5} y2={a} />
              <line x1={h} y1={0} x2={h + a * 0.5} y2={a} />
              <line x1={h} y1={s} x2={h - a * 0.5} y2={b} />
              <line x1={h} y1={s} x2={h + a * 0.5} y2={b} />
              <line x1={0} y1={h} x2={a + a * 0.5} y2={h} />
              <line x1={s} y1={h} x2={b - a * 0.5} y2={h} />

              {/* Side midpoint to corner connections */}
              <line x1={0} y1={h} x2={a} y2={a} />
              <line x1={0} y1={h} x2={a} y2={b} />
              <line x1={s} y1={h} x2={b} y2={a} />
              <line x1={s} y1={h} x2={b} y2={b} />

              {/* Small kite accents */}
              <polygon points={`${a * 0.5},${h} ${a},${h - a * 0.5} ${a},${h + a * 0.5}`} />
              <polygon points={`${s - a * 0.5},${h} ${b},${h - a * 0.5} ${b},${h + a * 0.5}`} />
              <polygon points={`${h},${a * 0.5} ${h - a * 0.5},${a} ${h + a * 0.5},${a}`} />
              <polygon points={`${h},${s - a * 0.5} ${h - a * 0.5},${b} ${h + a * 0.5},${b}`} />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
