import { useId } from 'react';

const RANK_ORDER = ['F', 'D', 'C', 'B', 'A', 'S', 'S+', 'S++'];

// Aura energy palette — each tier radiates a different glow color, escalating from dormant steel
// through cool currents, into a magenta/crimson blaze, and finally a golden-white supernova at the peak.
const AURA: Record<string, [string, string]> = {
  'F':   ['#9ca3af', '#4b5563'],
  'D':   ['#7dd3fc', '#1d4ed8'],
  'C':   ['#5eead4', '#0f766e'],
  'B':   ['#86efac', '#15803d'],
  'A':   ['#c4b5fd', '#6d28d9'],
  'S':   ['#f9a8d4', '#be185d'],
  'S+':  ['#fca5a5', '#b91c1c'],
  'S++': ['#fef9c3', '#f59e0b'],
};

// Flat-topped crest — the rectangular field (good chevron real estate) tapers to a point at the base
function shieldPath(w: number, cx = 32, cy = 32): string {
  return `M ${cx - w} ${cy - 12} L ${cx + w} ${cy - 12} L ${cx + w} ${cy + 8} L ${cx} ${cy + 16} L ${cx - w} ${cy + 8} Z`;
}

// Open V-shaped rank stripe
function chevron(cx: number, y: number, halfWidth: number): string {
  return `M ${cx - halfWidth} ${y - 3} L ${cx} ${y + 3} L ${cx + halfWidth} ${y - 3}`;
}

// A short feather blade — three fan out per side at staggered angles to form a compact plume
const FEATHER_PATH = 'M0 -1.1 C4 -2.4 7.5 -1.8 9.5 0 C7.5 1.1 4 1.6 0 1.1 Z';
const FEATHER_ANGLES = [-20, 0, 20];
const FEATHER_LENGTHS = [0.72, 1, 0.72];

const STAR_PATH = 'M32 21.5 L33.6 25 L37.4 25.3 L34.5 27.8 L35.4 31.5 L32 29.4 L28.6 31.5 L29.5 27.8 L26.6 25.3 L30.4 25 Z';

interface ClassBadgeProps {
  rank: string;
  size?: number;
  className?: string;
}

/**
 * Military-crest class badge — a shield insignia that builds up rank chevrons,
 * then earns a star emblem and a feathered plume, all wrapped in an "aura" glow
 * whose color and intensity escalate with tier (cool currents → crimson blaze → gold supernova).
 */
export function ClassBadge({ rank, size = 40, className }: ClassBadgeProps) {
  const gradId = useId();
  const auraId = useId();
  const [glow, deep] = AURA[rank] || AURA['F'];
  const tier = RANK_ORDER.indexOf(rank);

  const chevronCount = Math.min(3, tier);  // 0,1,2,3,3,3,3,3 — caps out at B
  const hasStar = tier >= 4;                // A and up — emblem earned
  const hasWings = tier >= 5;               // S and up — plumage unlocked
  const isOrnate = tier >= 6;               // S+ and up — gem-trimmed
  const isMaximal = rank === 'S++';

  const w = 14;
  const wingScale = tier === 5 ? 0.85 : tier === 6 ? 1.1 : tier === 7 ? 1.35 : 0;
  const auraLevel = Math.max(0, tier - 1);  // the aura starts charging at C, escalating fast from there

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={auraLevel > 0 ? { filter: `drop-shadow(0 0 ${2 + auraLevel * 1.6}px ${deep}cc)` } : undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={glow} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        <radialGradient id={auraId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Aura bloom — radiant energy field, charges up fast starting at C */}
      {auraLevel > 0 && (
        <circle cx="32" cy="32" r={16 + auraLevel * 2.4} fill={`url(#${auraId})`}
          opacity={Math.min(0.9, 0.22 + auraLevel * 0.12)} />
      )}

      {/* Wings — feathered plume fans from each flank once earned (S and up) */}
      {hasWings && [-1, 1].map((side) => (
        <g key={side} transform={`translate(${32 + side * (w + 1)} 29) scale(${side * wingScale} ${wingScale})`}>
          {FEATHER_ANGLES.map((deg, i) => (
            <g key={i} transform={`rotate(${deg}) scale(${FEATHER_LENGTHS[i]})`}>
              <path d={FEATHER_PATH} fill={glow} fillOpacity={isMaximal ? 0.95 : 0.85}
                stroke={isOrnate ? deep : 'none'} strokeWidth={isOrnate ? 0.5 : 0} strokeOpacity="0.5" />
            </g>
          ))}
          {isOrnate && <circle cx="9.5" cy="0" r="1.3" fill={glow} />}
        </g>
      ))}

      {/* Shield body — gradient-filled crest */}
      <path d={shieldPath(w)} fill={`url(#${gradId})`} fillOpacity={rank === 'F' ? 0.16 : 0.95}
        stroke={glow} strokeWidth="1.4" strokeOpacity={rank === 'F' ? 0.4 : 0.8} strokeLinejoin="round" />

      {/* Glossy sheen — diagonal highlight streak across the crest face */}
      {rank !== 'F' && (
        <path d="M20 23 L25 23 L30 42 L25 42 Z" fill="white" fillOpacity="0.1" />
      )}

      {/* Star emblem — earned at A and beyond, sits in the crest's crown */}
      {hasStar && (
        <path d={STAR_PATH} fill={glow} fillOpacity="0.95" stroke={deep} strokeWidth="0.6" strokeLinejoin="round" />
      )}

      {/* Rank chevrons — stack in the crest's lower field, count escalates with tier */}
      {Array.from({ length: chevronCount }).map((_, i) => (
        <path key={i} d={chevron(32, 34 + i * 4.5, 9 - i * 1.2)}
          stroke={glow} strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
      ))}

      {/* Dormant pip — unranked placeholder */}
      {rank === 'F' && <circle cx="32" cy="32" r="2.6" fill={glow} opacity="0.4" />}
    </svg>
  );
}

export default ClassBadge;
