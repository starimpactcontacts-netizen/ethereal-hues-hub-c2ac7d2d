import { useId } from 'react';

const RANK_ORDER = ['F', 'D', 'C', 'B', 'A', 'S', 'S+', 'S++'];

// Per-rank palettes — each tier has its own color family.
// F starts grey, D/C climb through red ranks, B-A go blue/green,
// S tier ascends through violet → gold for the prestige climax.
type Palette = { light: string; mid: string; deep: string; dark: string; rim: string };
const PALETTES: Record<string, Palette> = {
  F:    { light: '#e5e7eb', mid: '#9ca3af', deep: '#4b5563', dark: '#1f2937', rim: '#f3f4f6' }, // grey
  D:    { light: '#fecaca', mid: '#f87171', deep: '#b91c1c', dark: '#7f1d1d', rim: '#fee2e2' }, // red
  C:    { light: '#fed7aa', mid: '#fb923c', deep: '#c2410c', dark: '#7c2d12', rim: '#ffedd5' }, // orange
  B:    { light: '#bfdbfe', mid: '#60a5fa', deep: '#1d4ed8', dark: '#1e3a8a', rim: '#dbeafe' }, // blue
  A:    { light: '#bbf7d0', mid: '#4ade80', deep: '#15803d', dark: '#14532d', rim: '#dcfce7' }, // emerald
  S:    { light: '#e9d5ff', mid: '#c084fc', deep: '#7e22ce', dark: '#4c1d95', rim: '#f5d0fe' }, // violet
  'S+': { light: '#fde68a', mid: '#fbbf24', deep: '#b45309', dark: '#78350f', rim: '#fef3c7' }, // amber/gold
  'S++':{ light: '#fef3c7', mid: '#fcd34d', deep: '#d97706', dark: '#7c2d12', rim: '#fffbeb' }, // radiant gold
};

// Pentagon shield — flat top, angled shoulders, pointed base (matches reference)
const SHIELD_PATH = 'M32 14 L46 20 L43 40 L32 50 L21 40 L18 20 Z';
const SHIELD_INNER = 'M32 18 L43 23 L40.5 38.5 L32 46 L23.5 38.5 L21 23 Z';

// Open V-shaped rank chevron
function chevron(cx: number, y: number, halfWidth: number): string {
  return `M ${cx - halfWidth} ${y - 2.5} L ${cx} ${y + 2.5} L ${cx + halfWidth} ${y - 2.5}`;
}

// 5-point star
const STAR_PATH = 'M0 -4 L1.18 -1.24 L4.18 -0.94 L1.9 1.06 L2.6 4 L0 2.4 L-2.6 4 L-1.9 1.06 L-4.18 -0.94 L-1.18 -1.24 Z';

// Feathered wing — multiple layered blade strokes, fanning outward
const WING_FEATHERS = [
  { angle: -28, length: 0.55 },
  { angle: -14, length: 0.78 },
  { angle: 0,   length: 1.0  },
  { angle: 14,  length: 0.82 },
  { angle: 28,  length: 0.62 },
];
const FEATHER_PATH = 'M0 -1.4 C5 -2.6 10 -2 13 0 C10 1.4 5 1.8 0 1.4 Z';

interface ClassBadgeProps {
  rank: string;
  size?: number;
  className?: string;
}

/**
 * Gameified neon-violet rank crest — pentagon shield builds up chevrons, then
 * earns star emblems and a feathered wing-plume that grows wider with each tier.
 * Always the same purple gradient family; only count and span scale with rank.
 */
export function ClassBadge({ rank, size = 40, className }: ClassBadgeProps) {
  const gradId = useId();
  const rimId = useId();
  const glowId = useId();
  const tier = RANK_ORDER.indexOf(rank);
  const palette = PALETTES[rank] ?? PALETTES.F;

  // Progression matched to reference art (10 badges → mapped to 8 ranks):
  // F: empty shield, D: 1 chev, C: 2 chev, B: 3 chev,
  // A: small wings + 1 star, S: wings + 2 stars,
  // S+: bigger wings + 1 star + chevrons, S++: full eagle wings + star
  const chevronCount =
    tier === 0 ? 0 :
    tier === 1 ? 1 :
    tier === 2 ? 2 :
    tier === 3 ? 3 :
    tier === 6 ? 2 :
    tier === 7 ? 1 : 0;
  const starCount = tier === 4 ? 1 : tier === 5 ? 2 : tier === 6 ? 1 : tier === 7 ? 1 : 0;
  const wingScale =
    tier === 4 ? 0.7 :
    tier === 5 ? 0.95 :
    tier === 6 ? 1.15 :
    tier === 7 ? 1.4 : 0;
  const isMax = rank === 'S++';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={{ filter: `drop-shadow(0 0 ${3 + tier * 0.8}px ${palette.deep}aa)` }}
    >
      <defs>
        <linearGradient id={gradId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="40%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.dark} />
        </linearGradient>
        <linearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.rim} />
          <stop offset="100%" stopColor={palette.deep} />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={palette.light} stopOpacity="0.5" />
          <stop offset="100%" stopColor={palette.light} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow */}
      {tier > 0 && <circle cx="32" cy="32" r="22" fill={`url(#${glowId})`} opacity={0.3 + tier * 0.05} />}

      {/* Wings — feathered plume each side (A and up) */}
      {wingScale > 0 && [-1, 1].map((side) => (
        <g key={side} transform={`translate(${32 + side * 11} 30) scale(${side * wingScale} ${wingScale})`}>
          {WING_FEATHERS.map((f, i) => (
            <g key={i} transform={`rotate(${f.angle}) scale(${f.length})`}>
              <path
                d={FEATHER_PATH}
                fill={`url(#${gradId})`}
                stroke={palette.dark}
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </g>
      ))}

      {/* Shield outer rim */}
      <path
        d={SHIELD_PATH}
        fill={`url(#${rimId})`}
        stroke={palette.dark}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Shield inner face — gradient body */}
      <path
        d={SHIELD_INNER}
        fill={`url(#${gradId})`}
        stroke={palette.light}
        strokeWidth="0.6"
        strokeOpacity="0.6"
        strokeLinejoin="round"
      />

      {/* Diagonal glossy highlight */}
      <path
        d="M24 21 L28 21 L34 44 L30 44 Z"
        fill={palette.rim}
        fillOpacity="0.35"
      />

      {/* Stars — sit in crest crown */}
      {starCount > 0 && Array.from({ length: starCount }).map((_, i) => {
        const offset = starCount === 1 ? 0 : (i === 0 ? -4 : 4);
        return (
          <g key={i} transform={`translate(${32 + offset} 28)`}>
            <path d={STAR_PATH} fill={palette.rim} stroke={palette.dark} strokeWidth="0.5" strokeLinejoin="round" />
          </g>
        );
      })}

      {/* Chevrons — stack in crest's lower field */}
      {Array.from({ length: chevronCount }).map((_, i) => {
        const baseY = starCount > 0 ? 36 : 28;
        return (
          <path
            key={i}
            d={chevron(32, baseY + i * 4, 7 - i * 0.8)}
            stroke={palette.rim}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {/* Max-tier sparkle dots on wing tips */}
      {isMax && [-1, 1].map((side) => (
        <circle key={side} cx={32 + side * 24} cy="30" r="1.4" fill={palette.rim} />
      ))}
    </svg>
  );
}

export default ClassBadge;
