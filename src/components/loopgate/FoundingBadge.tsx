import { motion } from "framer-motion";

interface FoundingBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

/* ── Inline chip (sm / md) — Valorant-style angular tag ── */
function OGChip({ size }: { size: 'sm' | 'md' }) {
  const isMd = size === 'md';
  const h  = isMd ? 22 : 17;
  const fs = isMd ? 13 : 10;
  const px = isMd ? 12 : 8;
  const skew = isMd ? 9 : 7;

  return (
    <span
      className="inline-flex items-center gap-1 font-black uppercase select-none relative"
      style={{
        fontFamily: 'Teko, sans-serif',
        fontSize: fs,
        letterSpacing: '0.14em',
        paddingInline: px,
        height: h,
        color: '#FFD060',
        background: 'linear-gradient(135deg, #2a1a00 0%, #1a0e00 40%, #0d0700 100%)',
        border: '1px solid rgba(255,190,40,0.5)',
        clipPath: `polygon(${skew}px 0%, 100% 0%, calc(100% - ${skew}px) 100%, 0% 100%)`,
        boxShadow: '0 0 12px rgba(255,165,0,0.15), inset 0 1px 0 rgba(255,220,80,0.12)',
        textShadow: '0 0 8px rgba(255,200,40,0.6)',
      }}
      title="OG — Founding Loopgate Member"
    >
      {/* Valorant-style 4-pt star */}
      <svg width={isMd ? 8 : 6} height={isMd ? 8 : 6} viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
        <path d="M4 0 L4.9 3.1 L8 4 L4.9 4.9 L4 8 L3.1 4.9 L0 4 L3.1 3.1 Z" fill="#FFD060" />
      </svg>
      OG
      {/* top-edge glint */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: `polygon(${skew}px 0%, 100% 0%, calc(100% - ${skew}px) 100%, 0% 100%)`,
          background: 'linear-gradient(180deg, rgba(255,220,80,0.12) 0%, transparent 40%)',
        }}
      />
    </span>
  );
}

/* ── Inventory / Profile hero emblem (lg) — Valorant diamond frame ── */
function OGMedallion() {
  const S = 160;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: S, height: S }}>

        {/* Outer ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,175,20,0.22) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />

        {/* SVG badge — diamond/hexagonal Valorant shape */}
        <svg width={S} height={S} viewBox="0 0 160 160" fill="none" className="absolute inset-0">
          <defs>
            <linearGradient id="og-outer" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFE566" />
              <stop offset="50%" stopColor="#C07800" />
              <stop offset="100%" stopColor="#7A4500" />
            </linearGradient>
            <linearGradient id="og-inner-bg" x1="80" y1="20" x2="80" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1a0e00" />
              <stop offset="100%" stopColor="#080400" />
            </linearGradient>
            <linearGradient id="og-text" x1="80" y1="55" x2="80" y2="115" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFE566" />
              <stop offset="50%" stopColor="#F4A820" />
              <stop offset="100%" stopColor="#A05800" />
            </linearGradient>
          </defs>

          {/* Outer diamond frame */}
          <polygon
            points="80,6 148,50 148,110 80,154 12,110 12,50"
            fill="url(#og-inner-bg)"
            stroke="url(#og-outer)"
            strokeWidth="2"
          />

          {/* Inner hexagon inset */}
          <polygon
            points="80,18 136,50 136,110 80,142 24,110 24,50"
            fill="none"
            stroke="rgba(255,190,40,0.2)"
            strokeWidth="1"
          />

          {/* Corner accent ticks */}
          {[
            [80, 6], [148, 50], [148, 110], [80, 154], [12, 110], [12, 50]
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2.5" fill="#FFD060" opacity="0.7" />
          ))}

          {/* 4-pt star at top */}
          <path
            d="M80 28 L82.5 35.5 L90 38 L82.5 40.5 L80 48 L77.5 40.5 L70 38 L77.5 35.5 Z"
            fill="url(#og-text)"
          />

          {/* OG text */}
          <text
            x="80" y="108"
            textAnchor="middle"
            fontFamily="Teko, sans-serif"
            fontWeight="900"
            fontSize="58"
            fill="url(#og-text)"
            letterSpacing="-1"
          >OG</text>

          {/* Bottom label */}
          <text
            x="80" y="132"
            textAnchor="middle"
            fontFamily="Teko, sans-serif"
            fontWeight="700"
            fontSize="10"
            fill="rgba(255,185,30,0.45)"
            letterSpacing="4"
          >FOUNDING</text>
        </svg>

        {/* Specular sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ clipPath: 'polygon(80px 6px, 148px 50px, 148px 110px, 80px 154px, 12px 110px, 12px 50px)' }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ x: ['-120%', '120%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 5 }}
            style={{
              background: 'linear-gradient(110deg, transparent 35%, rgba(255,230,100,0.13) 50%, transparent 65%)',
            }}
          />
        </motion.div>
      </div>
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
