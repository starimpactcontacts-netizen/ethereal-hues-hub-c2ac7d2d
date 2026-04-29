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

/* iPhone 17 Pro — Liquid Glass disc. Pure monochrome, no gradient kitsch. */
function HeroMedallion() {
  return (
    <div className="relative w-[170px] h-[170px] flex items-center justify-center">
      {/* Soft ambient light bloom */}
      <div className="absolute inset-0 rounded-full bg-white/[0.04] blur-2xl" />

      {/* Glass disc */}
      <motion.div
        className="relative w-[150px] h-[150px] rounded-full overflow-hidden"
        animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "0.5px solid rgba(255,255,255,0.18)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.4), 0 24px 60px -20px rgba(0,0,0,0.8)",
        }}
      >
        {/* Inner ring — hairline */}
        <div
          className="absolute inset-3 rounded-full"
          style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}
        />

        {/* Roman numeral I — SF-style, ultra-thin */}
        <div
          className="absolute inset-0 flex items-center justify-center text-foreground"
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif",
            fontWeight: 200,
            fontSize: 76,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            textShadow: "0 1px 0 rgba(255,255,255,0.15), 0 -1px 0 rgba(0,0,0,0.4)",
          }}
        >
          I
        </div>

        {/* Specular highlight */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.06) 100%)",
          }}
        />

        {/* Slow specular sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
          style={{
            background:
              "linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
          }}
        />
      </motion.div>

      {/* Micro caption */}
      <div
        className="absolute -bottom-1 left-0 right-0 text-center text-foreground/40"
        style={{
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: "0.35em",
        }}
      >
        FIRST · CIRCLE
      </div>
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
