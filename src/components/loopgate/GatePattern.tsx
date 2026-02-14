/**
 * GatePattern — Dubai Mall–inspired geometric lattice overlay.
 * Pure SVG, infinitely tiling, ultra-subtle at low opacity.
 * Use as a background layer with pointer-events-none.
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
            width={tileSize}
            height={tileSize}
            patternUnits="userSpaceOnUse"
          >
            {/* 8-pointed star lattice — inspired by Islamic geometric art */}
            <g
              fill="none"
              stroke={color}
              strokeWidth="1"
              strokeLinecap="round"
            >
              {/* Central 8-point star */}
              <polygon
                points={`
                  ${tileSize * 0.5},${tileSize * 0.15}
                  ${tileSize * 0.58},${tileSize * 0.35}
                  ${tileSize * 0.85},${tileSize * 0.5}
                  ${tileSize * 0.58},${tileSize * 0.65}
                  ${tileSize * 0.5},${tileSize * 0.85}
                  ${tileSize * 0.42},${tileSize * 0.65}
                  ${tileSize * 0.15},${tileSize * 0.5}
                  ${tileSize * 0.42},${tileSize * 0.35}
                `}
              />
              {/* Inner octagon */}
              <polygon
                points={`
                  ${tileSize * 0.5},${tileSize * 0.28}
                  ${tileSize * 0.62},${tileSize * 0.38}
                  ${tileSize * 0.72},${tileSize * 0.5}
                  ${tileSize * 0.62},${tileSize * 0.62}
                  ${tileSize * 0.5},${tileSize * 0.72}
                  ${tileSize * 0.38},${tileSize * 0.62}
                  ${tileSize * 0.28},${tileSize * 0.5}
                  ${tileSize * 0.38},${tileSize * 0.38}
                `}
              />
              {/* Corner diamond connectors — top-left */}
              <line x1="0" y1="0" x2={tileSize * 0.15} y2={tileSize * 0.5} />
              <line x1="0" y1="0" x2={tileSize * 0.5} y2={tileSize * 0.15} />
              {/* Corner — top-right */}
              <line x1={tileSize} y1="0" x2={tileSize * 0.85} y2={tileSize * 0.5} />
              <line x1={tileSize} y1="0" x2={tileSize * 0.5} y2={tileSize * 0.15} />
              {/* Corner — bottom-left */}
              <line x1="0" y1={tileSize} x2={tileSize * 0.15} y2={tileSize * 0.5} />
              <line x1="0" y1={tileSize} x2={tileSize * 0.5} y2={tileSize * 0.85} />
              {/* Corner — bottom-right */}
              <line x1={tileSize} y1={tileSize} x2={tileSize * 0.85} y2={tileSize * 0.5} />
              <line x1={tileSize} y1={tileSize} x2={tileSize * 0.5} y2={tileSize * 0.85} />
              {/* Small inner cross */}
              <line x1={tileSize * 0.45} y1={tileSize * 0.5} x2={tileSize * 0.55} y2={tileSize * 0.5} />
              <line x1={tileSize * 0.5} y1={tileSize * 0.45} x2={tileSize * 0.5} y2={tileSize * 0.55} />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
