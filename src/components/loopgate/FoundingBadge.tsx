import { motion } from "framer-motion";

interface FoundingBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

/* Tiny inline emblem for chip use (sm/md) */
function ChipEmblem({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="16" y2="16">
          <stop offset="0%" stopColor="#F4D27A" />
          <stop offset="100%" stopColor="#8C6A1F" />
        </linearGradient>
      </defs>
      <path d="M8 1.5 L9.6 5.6 L14 6 L10.7 8.9 L11.7 13.2 L8 11 L4.3 13.2 L5.3 8.9 L2 6 L6.4 5.6 Z"
            fill="url(#cg)" stroke="#3a2a08" strokeWidth="0.5" strokeLinejoin="round" />
    </svg>
  );
}

/* Luxury medallion for the hero (lg) — coin with engraved star + ring */
function MedallionEmblem({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="mFace" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FCE9A8" />
          <stop offset="45%" stopColor="#D4A94A" />
          <stop offset="100%" stopColor="#5A3F0C" />
        </radialGradient>
        <linearGradient id="mRim" x1="0" y1="0" x2="0" y2="100">
          <stop offset="0%" stopColor="#F8DC8A" />
          <stop offset="50%" stopColor="#A87A22" />
          <stop offset="100%" stopColor="#3A2808" />
        </linearGradient>
        <linearGradient id="mShine" x1="0" y1="0" x2="0" y2="100">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer rim */}
      <circle cx="50" cy="50" r="48" fill="url(#mRim)" />
      {/* Inner face */}
      <circle cx="50" cy="50" r="40" fill="url(#mFace)" />
      {/* Engraved ring */}
      <circle cx="50" cy="50" r="34" fill="none" stroke="#3a2a08" strokeWidth="0.8" opacity="0.55" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#FFE7A8" strokeWidth="0.4" opacity="0.5"
              strokeDasharray="1 2" />

      {/* Roman numeral I (First) */}
      <g transform="translate(50 50)">
        <rect x="-2" y="-16" width="4" height="32" fill="#3a2a08" opacity="0.85" rx="0.5" />
        <rect x="-9" y="-17" width="18" height="3" fill="#3a2a08" opacity="0.85" rx="0.5" />
        <rect x="-9" y="14" width="18" height="3" fill="#3a2a08" opacity="0.85" rx="0.5" />
      </g>

      {/* Glossy highlight */}
      <ellipse cx="38" cy="28" rx="22" ry="10" fill="url(#mShine)" />
    </svg>
  );
}

const SIZES = {
  sm: { icon: 12, text: 'text-[8px]', px: 'px-2 py-[2px]', gap: 'gap-1' },
  md: { icon: 14, text: 'text-[10px]', px: 'px-2.5 py-[3px]', gap: 'gap-1' },
  lg: { icon: 48, text: '', px: '', gap: '' },
};

export default function FoundingBadge({ size = 'sm', animate = true }: FoundingBadgeProps) {
  const s = SIZES[size];

  // Large standalone — just the icon
  if (size === 'lg') {
    const coin = <BadgeIcon size={s.icon} />;
    if (!animate) return coin;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="inline-flex"
      >
        {coin}
      </motion.div>
    );
  }

  // Fortnite-style skewed badge
  const badge = (
    <span
      className={`inline-flex items-center ${s.gap} ${s.px} font-display ${s.text} tracking-[0.15em] text-gold uppercase`}
      style={{
        background: 'linear-gradient(135deg, #1a1608 0%, #0e0c04 100%)',
        border: '1px solid hsl(var(--gold) / 0.3)',
        clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
      }}
      title="First Circle — Founding Loopgate Member"
    >
      <BadgeIcon size={s.icon} />
      FIRST CIRCLE
    </span>
  );

  if (!animate) return badge;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex"
    >
      {badge}
    </motion.span>
  );
}
