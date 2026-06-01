import { motion } from "framer-motion";

interface FoundingBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

/* ── Inline chip (sm / md) ──────────────────────────────────── */
function OGChip({ size }: { size: 'sm' | 'md' }) {
  const isMd = size === 'md';
  return (
    <span
      className="inline-flex items-center gap-1 font-black uppercase select-none"
      style={{
        fontFamily: 'Teko, sans-serif',
        fontSize: isMd ? 13 : 10,
        letterSpacing: '0.1em',
        paddingInline: isMd ? 10 : 7,
        paddingBlock: isMd ? 3 : 2,
        color: '#FFD060',
        background: 'linear-gradient(135deg, #1c1200 0%, #0a0800 100%)',
        border: '1px solid rgba(255,200,40,0.45)',
        clipPath: 'polygon(7px 0%, 100% 0%, calc(100% - 7px) 100%, 0% 100%)',
        boxShadow: '0 0 10px rgba(255,190,30,0.08) inset, 0 0 6px rgba(255,190,30,0.12)',
        textShadow: '0 0 10px rgba(255,200,40,0.55)',
      }}
      title="OG — Founding Loopgate Member"
    >
      ★ OG
    </span>
  );
}

/* ── Inventory / Profile hero emblem (lg) ───────────────────── */
function OGMedallion() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Outer glow */}
      <div className="relative w-[160px] h-[160px] flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(255,185,20,0.18) 0%, transparent 68%)',
            filter: 'blur(6px)',
          }}
        />

        {/* Ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '1px solid rgba(255,190,35,0.22)',
          }}
        />

        {/* Disc */}
        <motion.div
          className="relative w-[140px] h-[140px] rounded-full flex flex-col items-center justify-center overflow-hidden"
          animate={{ rotate: [0, 1.2, 0, -1.2, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background:
              'radial-gradient(circle at 38% 30%, rgba(255,215,60,0.12) 0%, rgba(10,8,0,0.98) 65%)',
            border: '1px solid rgba(255,190,35,0.28)',
            boxShadow:
              '0 0 40px rgba(255,180,20,0.10), inset 0 0 24px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,220,80,0.18)',
          }}
        >
          {/* Crown icon */}
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none" style={{ marginBottom: -2 }}>
            <defs>
              <linearGradient id="og-crown" x1="0" y1="0" x2="28" y2="20">
                <stop offset="0%" stopColor="#FFE066" />
                <stop offset="55%" stopColor="#F4A820" />
                <stop offset="100%" stopColor="#9A6200" />
              </linearGradient>
            </defs>
            <path
              d="M2 17 L4 7 L9 12 L14 2 L19 12 L24 7 L26 17 Z"
              fill="url(#og-crown)"
              stroke="rgba(80,45,0,0.6)"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
            <rect x="2" y="17" width="24" height="3" rx="0.8" fill="url(#og-crown)" />
          </svg>

          {/* OG lettering */}
          <div
            style={{
              fontFamily: 'Teko, sans-serif',
              fontWeight: 700,
              fontSize: 68,
              lineHeight: 0.88,
              letterSpacing: '-0.01em',
              background: 'linear-gradient(180deg, #FFE566 0%, #F4A820 45%, #C07010 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 10px rgba(255,175,20,0.35))',
            }}
          >
            OG
          </div>

          {/* Specular sweep */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{ x: ['-110%', '110%'] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }}
            style={{
              background:
                'linear-gradient(110deg, transparent 40%, rgba(255,230,100,0.14) 50%, transparent 60%)',
            }}
          />
        </motion.div>
      </div>

      {/* Caption */}
      <p
        className="text-[8px] font-black uppercase tracking-[0.38em]"
        style={{ color: 'rgba(255,185,30,0.45)', fontFamily: 'Teko, sans-serif' }}
      >
        OG · FOUNDING MEMBER
      </p>
    </div>
  );
}

export default function FoundingBadge({ size = 'sm', animate = true }: FoundingBadgeProps) {
  if (size === 'lg') {
    if (!animate) return <div className="inline-flex"><OGMedallion /></div>;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.82, rotate: -6 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 210, damping: 17 }}
        className="inline-flex"
      >
        <OGMedallion />
      </motion.div>
    );
  }

  const chip = <OGChip size={size} />;
  if (!animate) return chip;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28 }}
      className="inline-flex"
    >
      {chip}
    </motion.span>
  );
}
