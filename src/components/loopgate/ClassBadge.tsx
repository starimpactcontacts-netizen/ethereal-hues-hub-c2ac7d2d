import { useId } from 'react';

const RANK_ORDER = ['F', 'D', 'C', 'B', 'A', 'S', 'S+', 'S++'];

// Light → dark two-stop gradient per tier, escalating from dull grey to radiant gold
const RANK_COLORS: Record<string, [string, string]> = {
  'F':   ['#9ca3af', '#4b5563'],
  'D':   ['#fdba74', '#c2570a'],
  'C':   ['#e2e8f0', '#94a3b8'],
  'B':   ['#7dd3fc', '#2563eb'],
  'A':   ['#6ee7b7', '#059669'],
  'S':   ['#fde68a', '#d97706'],
  'S+':  ['#fde047', '#f59e0b'],
  'S++': ['#fff7d6', '#f59e0b'],
};

// Outer-shape side count escalates per tier — circle (unranked) up through a 9-point burst
const RANK_SIDES: Record<string, number> = {
  'F': 0, 'D': 3, 'C': 4, 'B': 5, 'A': 6, 'S': 7, 'S+': 8, 'S++': 9,
};

function polygonPoints(sides: number, r: number, rotateDeg = 0, cx = 32, cy = 32): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + (rotateDeg * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

interface ClassBadgeProps {
  rank: string;
  size?: number;
  className?: string;
}

/**
 * Faceted class badge — shape complexity, gem centerpiece, vertex sparkles and
 * glow all escalate with tier, mirroring how Valorant/Discord badges evolve.
 */
export function ClassBadge({ rank, size = 40, className }: ClassBadgeProps) {
  const gradId = useId();
  const [light, dark] = RANK_COLORS[rank] || RANK_COLORS['F'];
  const sides = RANK_SIDES[rank] ?? 0;
  const tier = RANK_ORDER.indexOf(rank);
  const hasGlow = tier >= 5;       // S, S+, S++ radiate
  const isOrnate = tier >= 6;      // S+, S++ get vertex gems
  const isMaximal = rank === 'S++';

  const outerPts = sides ? polygonPoints(sides, 23) : '';
  const innerPts = sides ? polygonPoints(sides, 18) : '';
  const outerVerts = outerPts.split(' ').map(p => p.split(',').map(Number) as [number, number]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={hasGlow ? { filter: `drop-shadow(0 0 ${isMaximal ? 6 : 4}px ${dark}aa)` } : undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>

      {/* Outermost halo ring — S++ only, doubles up the silhouette */}
      {isMaximal && sides > 0 && (
        <polygon points={polygonPoints(sides, 28)} stroke={light} strokeWidth="0.75" fill="none" opacity="0.3" />
      )}

      {/* Outer shape — escalates from dashed circle (unranked) to a 9-point burst */}
      {sides > 0 ? (
        <polygon points={outerPts} stroke={`url(#${gradId})`} strokeWidth="2" fill={dark} fillOpacity="0.16" />
      ) : (
        <circle cx="32" cy="32" r="22" stroke={light} strokeWidth="1.5" strokeDasharray="3,3" fill={dark} fillOpacity="0.08" />
      )}

      {/* Inner ring — appears from C upward */}
      {sides > 0 && tier >= 2 && (
        <polygon points={innerPts} stroke={light} strokeWidth="1" fill="none" opacity="0.4" />
      )}

      {/* Vertex gems — only the top tiers earn the full constellation */}
      {isOrnate && outerVerts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={isMaximal ? 1.8 : 1.4} fill={light} />
      ))}

      {/* Faceted gem centerpiece — every ranked tier (D+) gets one; unranked gets a dim pip */}
      {rank !== 'F' ? (
        <g>
          <path d="M32 21 L41 32 L32 43 L23 32 Z" fill={dark} fillOpacity="0.92" />
          <path d="M32 21 L41 32 L32 32 Z" fill={light} fillOpacity="0.95" />
          <path d="M32 21 L23 32 L32 32 Z" fill={light} fillOpacity="0.6" />
        </g>
      ) : (
        <circle cx="32" cy="32" r="3" fill={light} opacity="0.45" />
      )}
    </svg>
  );
}

export default ClassBadge;
