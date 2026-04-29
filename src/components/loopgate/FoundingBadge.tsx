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

const SIZES = {
  sm: { icon: 12, text: 'text-[8px]', px: 'px-2 py-[2px]', gap: 'gap-1' },
  md: { icon: 14, text: 'text-[10px]', px: 'px-2.5 py-[3px]', gap: 'gap-1' },
  lg: { icon: 48, text: '', px: '', gap: '' },
};

/* Roblox-tier limited collectible — animated holographic medallion */
function HeroMedallion() {
  return (
    <div className="relative w-[180px] h-[180px] flex items-center justify-center">
      {/* Rotating conic halo (holographic) */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-70"
        style={{
          background:
            "conic-gradient(from 0deg, #FFD27A, #FF6BD6, #6BCBFF, #B6FF6B, #FFD27A)",
          filter: "blur(14px)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* Outer rotating runic ring */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#FFE9A8" />
            <stop offset="50%" stopColor="#C99535" />
            <stop offset="100%" stopColor="#5A3F0C" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="1.2"
          strokeDasharray="2 6"
          opacity="0.9"
        />
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="0.6"
          opacity="0.6"
        />
      </motion.svg>

      {/* Coin */}
      <motion.div
        className="relative w-[150px] h-[150px]"
        animate={{ rotateY: [0, 8, 0, -8, 0], rotateX: [0, -4, 0, 4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_12px_30px_rgba(212,169,74,0.45)]">
          <defs>
            {/* Coin face — radial */}
            <radialGradient id="coinFace" cx="32%" cy="28%" r="85%">
              <stop offset="0%" stopColor="#FFF6D6" />
              <stop offset="35%" stopColor="#F4CE6A" />
              <stop offset="75%" stopColor="#A87625" />
              <stop offset="100%" stopColor="#3F2A08" />
            </radialGradient>
            {/* Outer rim — beveled */}
            <linearGradient id="coinRim" x1="0" y1="0" x2="0" y2="200">
              <stop offset="0%" stopColor="#FFEAA0" />
              <stop offset="30%" stopColor="#D4A94A" />
              <stop offset="65%" stopColor="#8B6420" />
              <stop offset="100%" stopColor="#2A1B05" />
            </linearGradient>
            {/* Inner ring shadow */}
            <radialGradient id="innerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
            </radialGradient>
            {/* Top gloss */}
            <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#FFF8DC" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer beveled rim */}
          <circle cx="100" cy="100" r="96" fill="url(#coinRim)" />
          <circle cx="100" cy="100" r="92" fill="none" stroke="#2A1B05" strokeWidth="0.6" opacity="0.55" />

          {/* Inner face */}
          <circle cx="100" cy="100" r="86" fill="url(#coinFace)" />
          <circle cx="100" cy="100" r="86" fill="url(#innerShadow)" />

          {/* Engraved double ring */}
          <circle cx="100" cy="100" r="74" fill="none" stroke="#3A2808" strokeWidth="1.2" opacity="0.55" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="#FFE7A8" strokeWidth="0.4" opacity="0.55"
                  strokeDasharray="1 2.5" />

          {/* Sunburst rays inside */}
          <g opacity="0.18">
            {Array.from({ length: 24 }).map((_, i) => (
              <rect
                key={i}
                x="99.4"
                y="20"
                width="1.2"
                height="56"
                fill="#3a2a08"
                transform={`rotate(${i * 15} 100 100)`}
              />
            ))}
          </g>

          {/* Center glow */}
          <circle cx="100" cy="100" r="48" fill="url(#centerGlow)" />

          {/* "I" — Roman numeral, deeply embossed */}
          <g transform="translate(100 100)">
            {/* shadow */}
            <g transform="translate(1.2 1.5)" opacity="0.55">
              <rect x="-5" y="-30" width="10" height="60" fill="#2a1c05" rx="1.2" />
              <rect x="-20" y="-32" width="40" height="7" fill="#2a1c05" rx="1.2" />
              <rect x="-20" y="25" width="40" height="7" fill="#2a1c05" rx="1.2" />
            </g>
            {/* highlight */}
            <g transform="translate(-0.7 -0.7)">
              <rect x="-5" y="-30" width="10" height="60" fill="#FFF1B8" opacity="0.85" rx="1.2" />
              <rect x="-20" y="-32" width="40" height="7" fill="#FFF1B8" opacity="0.85" rx="1.2" />
              <rect x="-20" y="25" width="40" height="7" fill="#FFF1B8" opacity="0.85" rx="1.2" />
            </g>
            {/* face */}
            <rect x="-5" y="-30" width="10" height="60" fill="#9C6E20" rx="1.2" />
            <rect x="-20" y="-32" width="40" height="7" fill="#9C6E20" rx="1.2" />
            <rect x="-20" y="25" width="40" height="7" fill="#9C6E20" rx="1.2" />
          </g>

          {/* Microtext arcing top */}
          <defs>
            <path id="arcTop" d="M 30 100 A 70 70 0 0 1 170 100" />
            <path id="arcBottom" d="M 30 100 A 70 70 0 0 0 170 100" />
          </defs>
          <text fill="#3A2808" opacity="0.75" fontSize="9" fontWeight="700" letterSpacing="3">
            <textPath href="#arcTop" startOffset="50%" textAnchor="middle">FIRST CIRCLE</textPath>
          </text>
          <text fill="#3A2808" opacity="0.65" fontSize="6.5" fontWeight="700" letterSpacing="4">
            <textPath href="#arcBottom" startOffset="50%" textAnchor="middle">★ FOUNDING MEMBER ★</textPath>
          </text>

          {/* Top gloss */}
          <ellipse cx="80" cy="50" rx="48" ry="18" fill="url(#gloss)" />
        </svg>

        {/* Moving specular sweep */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          style={{ WebkitMaskImage: "radial-gradient(circle, #000 64%, transparent 66%)", maskImage: "radial-gradient(circle, #000 64%, transparent 66%)" }}
        >
          <motion.div
            className="absolute -inset-1/2"
            style={{
              background:
                "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
            }}
            animate={{ x: ["-60%", "60%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 }}
          />
        </motion.div>
      </motion.div>

      {/* Floating sparkles */}
      {[
        { top: "6%", left: "12%", d: 0, s: 10 },
        { top: "14%", right: "8%", d: 0.6, s: 8 },
        { bottom: "10%", left: "8%", d: 1.1, s: 7 },
        { bottom: "18%", right: "14%", d: 0.3, s: 9 },
        { top: "44%", right: "0%", d: 1.4, s: 6 },
        { top: "44%", left: "0%", d: 0.9, s: 6 },
      ].map((p, i) => (
        <motion.span
          key={i}
          className="absolute text-amber-200"
          style={{ ...p, fontSize: p.s }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.3, 0.4], rotate: [0, 180, 360] }}
          transition={{ duration: 2.4, delay: p.d, repeat: Infinity, ease: "easeInOut" }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}

export default function FoundingBadge({ size = 'sm', animate = true }: FoundingBadgeProps) {
  const s = SIZES[size];

  // Large standalone — Roblox-tier holographic medallion
  if (size === 'lg') {
    const coin = <HeroMedallion />;
    if (!animate) return <div className="inline-flex">{coin}</div>;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 220, damping: 18 }}
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
      <ChipEmblem size={s.icon} />
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
