/**
 * GatePattern — Authentic Islamic 8-pointed star geometric lattice.
 * Thick interlocking bands with negative space, matching traditional
 * Moroccan/Arabic mashrabiya screens. Dark-on-dark aesthetic.
 * 
 * The geometry: Two overlapping squares (one rotated 45°) create an
 * 8-pointed star. The bands have real WIDTH (not just strokes) creating
 * the carved/3D look from the reference images.
 */

import { cn } from '@/lib/utils';

interface GatePatternProps {
  className?: string;
  /** Opacity 0-100, default 6 */
  opacity?: number;
  /** Pattern color */
  color?: string;
  /** Tile size in px, default 120 */
  tileSize?: number;
}

export default function GatePattern({
  className,
  opacity = 6,
  color = 'white',
  tileSize = 120,
}: GatePatternProps) {
  const patternId = `gate-lattice-${tileSize}`;
  const s = tileSize;
  const h = s / 2;

  // Islamic geometry ratio: tan(22.5°) ≈ 0.4142
  // This creates the perfect 8-pointed star proportion
  const t = s / (2 + Math.SQRT2); // ≈ 0.2929 * s — inset from edge
  const u = s - t; // opposite edge

  // Band width — this is what makes it look THICK and carved, not wispy
  const bw = s * 0.04;

  // The pattern is constructed from filled polygons (bands) not thin strokes.
  // Each band is a thick parallelogram connecting the star points.

  // 8 outer points of the star (on tile edges)
  // and 8 inner vertices where bands cross

  // Key coordinates for the interlocking pattern:
  // Outer square vertices: (t,t), (u,t), (u,u), (t,u)
  // Diamond vertices: (h,0), (s,h), (h,s), (0,h)

  // Build the path for one complete tile's lattice
  // Using filled shapes for the "band" look

  const sw = s * 0.012; // thin accent stroke for inner detail

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
            {/* === THICK BAND APPROACH === */}
            {/* Each geometric element drawn as a filled polygon with width */}
            <g fill="none" stroke={color} strokeLinejoin="round" strokeLinecap="round">
              
              {/* ── Main 8-pointed star bands ── */}
              {/* Outer axis-aligned square band */}
              <rect 
                x={t} y={t} 
                width={u - t} height={u - t} 
                strokeWidth={bw} 
                rx={0}
              />
              
              {/* 45° rotated diamond band */}
              <polygon 
                points={`${h},${bw * 0.3} ${s - bw * 0.3},${h} ${h},${s - bw * 0.3} ${bw * 0.3},${h}`} 
                strokeWidth={bw} 
              />

              {/* ── Corner X-bands connecting tiles ── */}
              {/* These create the interlocking lattice between adjacent stars */}
              
              {/* Top-left corner bands */}
              <line x1={0} y1={0} x2={t} y2={t} strokeWidth={bw * 0.8} />
              <line x1={0} y1={t} x2={t} y2={0} strokeWidth={bw * 0.8} />

              {/* Top-right corner bands */}
              <line x1={s} y1={0} x2={u} y2={t} strokeWidth={bw * 0.8} />
              <line x1={u} y1={0} x2={s} y2={t} strokeWidth={bw * 0.8} />

              {/* Bottom-right corner bands */}
              <line x1={s} y1={s} x2={u} y2={u} strokeWidth={bw * 0.8} />
              <line x1={s} y1={u} x2={u} y2={s} strokeWidth={bw * 0.8} />

              {/* Bottom-left corner bands */}
              <line x1={0} y1={s} x2={t} y2={u} strokeWidth={bw * 0.8} />
              <line x1={t} y1={s} x2={0} y2={u} strokeWidth={bw * 0.8} />

              {/* ── Star arm bands — diamond tips to square corners ── */}
              {/* These are the 8 "arms" radiating from center */}
              
              {/* Top arm */}
              <line x1={t} y1={t} x2={h} y2={bw * 0.3} strokeWidth={bw * 0.7} />
              <line x1={u} y1={t} x2={h} y2={bw * 0.3} strokeWidth={bw * 0.7} />

              {/* Right arm */}
              <line x1={u} y1={t} x2={s - bw * 0.3} y2={h} strokeWidth={bw * 0.7} />
              <line x1={u} y1={u} x2={s - bw * 0.3} y2={h} strokeWidth={bw * 0.7} />

              {/* Bottom arm */}
              <line x1={u} y1={u} x2={h} y2={s - bw * 0.3} strokeWidth={bw * 0.7} />
              <line x1={t} y1={u} x2={h} y2={s - bw * 0.3} strokeWidth={bw * 0.7} />

              {/* Left arm */}
              <line x1={t} y1={u} x2={bw * 0.3} y2={h} strokeWidth={bw * 0.7} />
              <line x1={t} y1={t} x2={bw * 0.3} y2={h} strokeWidth={bw * 0.7} />

              {/* ── Edge midpoint connecting bands ── */}
              {/* Horizontal & vertical bands connecting to adjacent tiles */}
              <line x1={t} y1={0} x2={t} y2={t} strokeWidth={bw * 0.7} />
              <line x1={u} y1={0} x2={u} y2={t} strokeWidth={bw * 0.7} />
              <line x1={s} y1={t} x2={u} y2={t} strokeWidth={bw * 0.7} />
              <line x1={s} y1={u} x2={u} y2={u} strokeWidth={bw * 0.7} />
              <line x1={u} y1={s} x2={u} y2={u} strokeWidth={bw * 0.7} />
              <line x1={t} y1={s} x2={t} y2={u} strokeWidth={bw * 0.7} />
              <line x1={0} y1={u} x2={t} y2={u} strokeWidth={bw * 0.7} />
              <line x1={0} y1={t} x2={t} y2={t} strokeWidth={bw * 0.7} />

              {/* ── Inner octagon detail ── */}
              {/* Small octagon at center for the star void detail */}
              {(() => {
                const r = s * 0.1; // inner octagon radius
                const pts = Array.from({ length: 8 }, (_, i) => {
                  const angle = (Math.PI / 8) + (i * Math.PI / 4);
                  return `${h + r * Math.cos(angle)},${h + r * Math.sin(angle)}`;
                }).join(' ');
                return <polygon points={pts} strokeWidth={bw * 0.5} />;
              })()}

              {/* ── Small 4-pointed stars in the negative spaces ── */}
              {/* These sit in the gaps between the main stars at (0,0), (s,0), etc */}
              {(() => {
                const starSize = s * 0.06;
                const positions = [
                  [0, 0], [s, 0], [0, s], [s, s],
                ];
                return positions.map(([cx, cy], i) => (
                  <g key={i}>
                    <line x1={cx - starSize} y1={cy} x2={cx + starSize} y2={cy} strokeWidth={bw * 0.4} />
                    <line x1={cx} y1={cy - starSize} x2={cx} y2={cy + starSize} strokeWidth={bw * 0.4} />
                  </g>
                ));
              })()}
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
