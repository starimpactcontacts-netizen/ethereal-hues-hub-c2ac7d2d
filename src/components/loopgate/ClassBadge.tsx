import { useId } from 'react';

const RANK_ORDER = ['F', 'D', 'C', 'B', 'A', 'S', 'S+', 'S++'];

// Light → dark two-stop gradient per tier — bronze/silver/gold escalation, crystal at the peak
const RANK_COLORS: Record<string, [string, string]> = {
  'F':   ['#9ca3af', '#4b5563'],
  'D':   ['#cd9265', '#8a5a35'],
  'C':   ['#e6e9ed', '#9aa3ad'],
  'B':   ['#e7b878', '#a86a2e'],
  'A':   ['#eef2f6', '#aab4bf'],
  'S':   ['#ffe8a3', '#d4970f'],
  'S+':  ['#fff2c4', '#f0a800'],
  'S++': ['#ffe9ff', '#b86bff'],
};

// Stylized swept-feather wing, drawn pointing rightward from its attachment point — mirrored for the left side
const WING_PATH = 'M0 0 C7 -5 16 -6 23 -2 C17 -1 11 1 6 2 C12 3 17 6 21 9 C13 8 5 6 0 3 Z';

function hexPoints(r: number, cx = 32, cy = 32): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

function pointAt(r: number, angleDeg: number, cx = 32, cy = 32): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

interface ClassBadgeProps {
  rank: string;
  size?: number;
  className?: string;
}

/**
 * Medal-style class badge — a hex-shield emblem that gains ridges, scalloped
 * edges, wings, gems and finally crystal plumage as tier escalates, mirroring
 * the bronze → silver → gold → winged-crystal progression of medal sets.
 */
export function ClassBadge({ rank, size = 40, className }: ClassBadgeProps) {
  const gradId = useId();
  const wingGradId = useId();
  const [light, dark] = RANK_COLORS[rank] || RANK_COLORS['F'];
  const tier = RANK_ORDER.indexOf(rank);

  const hasRidges = tier >= 2;     // C and up — notched inner rim
  const hasScallops = tier >= 3;   // B and up — bumped outer edge
  const hasWings = tier >= 4;      // A and up — wings flank the shield
  const isGilded = tier >= 5;      // S and up — radiant glow
  const isOrnate = tier >= 6;      // S+ and up — gem-studded plumage
  const isCrystal = rank === 'S++';

  const r = 16;
  const apothem = r * Math.cos(Math.PI / 6);
  const wingScale = tier === 4 ? 0.5 : tier === 5 ? 0.68 : tier === 6 ? 0.85 : tier === 7 ? 1.02 : 0;
  const wingFill = isCrystal ? `url(#${wingGradId})` : light;
  const wingOpacity = isCrystal ? 0.95 : isGilded ? 0.9 : 0.7;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={isGilded ? { filter: `drop-shadow(0 0 ${isCrystal ? 7 : 4}px ${dark}aa)` } : undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        {isCrystal && (
          <linearGradient id={wingGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="50%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#fda4af" />
          </linearGradient>
        )}
      </defs>

      {/* Soft iridescent halo — the crystal tier only */}
      {isCrystal && <circle cx="32" cy="32" r="29" fill={`url(#${wingGradId})`} fillOpacity="0.14" />}

      {/* Wings — flank the shield from A onward, escalating in span + ornament */}
      {hasWings && (
        <>
          <g transform={`translate(${32 - apothem - 1} 32) scale(${-wingScale} ${wingScale})`}>
            <path d={WING_PATH} fill={wingFill} fillOpacity={wingOpacity} />
            {isOrnate && <circle cx="14" cy="2" r="1.6" fill={light} />}
          </g>
          <g transform={`translate(${32 + apothem + 1} 32) scale(${wingScale} ${wingScale})`}>
            <path d={WING_PATH} fill={wingFill} fillOpacity={wingOpacity} />
            {isOrnate && <circle cx="14" cy="2" r="1.6" fill={light} />}
          </g>
        </>
      )}

      {/* Scalloped edge — small studs tracing the hexagon's perimeter, B and up */}
      {hasScallops && Array.from({ length: 6 }).map((_, i) => {
        const [x, y] = pointAt(apothem + 1.2, -60 + 60 * i);
        return <circle key={i} cx={x} cy={y} r="1.6" fill={dark} fillOpacity="0.75" stroke={light} strokeWidth="0.5" />;
      })}

      {/* Shield body */}
      <polygon points={hexPoints(r)} fill={`url(#${gradId})`} fillOpacity={rank === 'F' ? 0.14 : 0.92}
        stroke={light} strokeWidth="1.5" strokeOpacity={rank === 'F' ? 0.5 : 0.8} />

      {/* Ridged inner rim — notch ticks tracing an inner ring, C and up */}
      {hasRidges && <polygon points={hexPoints(r - 3.5)} fill="none" stroke={dark} strokeWidth="1" strokeOpacity="0.4" />}
      {hasRidges && Array.from({ length: 12 }).map((_, i) => {
        const [x1, y1] = pointAt(r - 1.5, 30 * i);
        const [x2, y2] = pointAt(r - 4.5, 30 * i);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={dark} strokeWidth="0.8" opacity="0.35" />;
      })}

      {/* Star centerpiece — dim outline when unranked, filled emblem once ranked */}
      <path d="M32 21 L34.6 27.8 L42 28.2 L36.2 32.8 L38.2 40 L32 35.8 L25.8 40 L27.8 32.8 L22 28.2 L29.4 27.8 Z"
        fill={rank === 'F' ? 'none' : light}
        fillOpacity={rank === 'F' ? 1 : 0.95}
        stroke={rank === 'F' ? light : dark}
        strokeWidth={rank === 'F' ? 1.2 : 0.8}
        strokeOpacity={rank === 'F' ? 0.45 : 0.5} />
    </svg>
  );
}

export default ClassBadge;
