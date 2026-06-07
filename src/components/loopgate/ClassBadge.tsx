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

// Rim tick-mark count escalates per tier — like a dial filling toward completion
const RANK_TICKS: Record<string, number> = {
  'F': 0, 'D': 6, 'C': 8, 'B': 10, 'A': 12, 'S': 16, 'S+': 20, 'S++': 24,
};

function pointOnCircle(r: number, angleDeg: number, cx = 32, cy = 32): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

interface ClassBadgeProps {
  rank: string;
  size?: number;
  className?: string;
}

/**
 * Medallion-style class badge — a Discord-Nitro-esque coin emblem whose rim
 * ticks, sunburst rays, orbiting gems and crown all escalate with tier,
 * rendered in Loopgate's gold-escalation palette.
 */
export function ClassBadge({ rank, size = 40, className }: ClassBadgeProps) {
  const faceGradId = useId();
  const rimGradId = useId();
  const [light, dark] = RANK_COLORS[rank] || RANK_COLORS['F'];
  const ticks = RANK_TICKS[rank] ?? 0;
  const tier = RANK_ORDER.indexOf(rank);
  const hasGlow = tier >= 5;        // S, S+, S++ radiate
  const isOrnate = tier >= 6;       // S+, S++ earn rays + orbiting gems
  const isMaximal = rank === 'S++'; // the absolute pinnacle — crowned

  const rayCount = isMaximal ? 16 : 12;
  const gemCount = isMaximal ? 8 : 6;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={hasGlow ? { filter: `drop-shadow(0 0 ${isMaximal ? 7 : 4}px ${dark}aa)` } : undefined}
    >
      <defs>
        <radialGradient id={faceGradId} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <linearGradient id={rimGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>

      {/* Sunburst rays — radiate from behind the medallion, top tiers only */}
      {isOrnate && Array.from({ length: rayCount }).map((_, i) => {
        const angle = (360 / rayCount) * i;
        const [x1, y1] = pointOnCircle(26, angle);
        const [x2, y2] = pointOnCircle(isMaximal ? 31.5 : 29.5, angle);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={light} strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
        );
      })}

      {/* Outer rim ring — dashed/dim when unranked, solid gradient once ranked */}
      <circle cx="32" cy="32" r="25" stroke={`url(#${rimGradId})`}
        strokeWidth={hasGlow ? 2 : 1.4} fill="none"
        opacity={rank === 'F' ? 0.3 : 0.85}
        strokeDasharray={rank === 'F' ? '2,3' : undefined} />

      {/* Rim tick marks — dial-style progress indicator, density escalates with tier */}
      {Array.from({ length: ticks }).map((_, i) => {
        const angle = (360 / ticks) * i;
        const [x1, y1] = pointOnCircle(22.5, angle);
        const [x2, y2] = pointOnCircle(25.5, angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={light} strokeWidth="1.1" opacity="0.5" />;
      })}

      {/* Coin face — gradient-filled medallion */}
      <circle cx="32" cy="32" r="20" fill={`url(#${faceGradId})`}
        fillOpacity={rank === 'F' ? 0.16 : 0.92} stroke={light} strokeWidth="1" strokeOpacity="0.45" />

      {/* Inner bevel ring — appears once ranked (D and up) */}
      {rank !== 'F' && <circle cx="32" cy="32" r="15.5" stroke={dark} strokeWidth="1" fill="none" opacity="0.35" />}

      {/* Orbiting gems along the rim — reserved for the elite tiers */}
      {isOrnate && Array.from({ length: gemCount }).map((_, i) => {
        const angle = (360 / gemCount) * i - 90;
        const [x, y] = pointOnCircle(25, angle);
        return <circle key={i} cx={x} cy={y} r={isMaximal ? 1.7 : 1.3} fill={light} />;
      })}

      {/* Centerpiece — faceted gem for ranked tiers, dim pip for unranked */}
      {rank !== 'F' ? (
        <g>
          <path d="M32 22 L40 32 L32 42 L24 32 Z" fill={dark} fillOpacity="0.88" />
          <path d="M32 22 L40 32 L32 32 Z" fill={light} fillOpacity="0.95" />
          <path d="M32 22 L24 32 L32 32 Z" fill={light} fillOpacity="0.55" />
        </g>
      ) : (
        <circle cx="32" cy="32" r="3" fill={light} opacity="0.4" />
      )}

      {/* Crown flourish — S++ only, marking the absolute pinnacle */}
      {isMaximal && (
        <path d="M23 15 L27.5 20.5 L32 13 L36.5 20.5 L41 15 L38.5 24.5 L25.5 24.5 Z"
          fill={light} fillOpacity="0.88" stroke={dark} strokeWidth="0.6" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default ClassBadge;
