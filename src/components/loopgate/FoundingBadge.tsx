import { motion } from "framer-motion";

interface FoundingBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

// Engraved coin-style founding badge with inner pattern
function BadgeIcon({ className, size }: { className?: string; size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      className={className}
    >
      <defs>
        {/* Radial gold gradient for coin base */}
        <radialGradient id="fc-coin" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#E8D5A3" />
          <stop offset="40%" stopColor="#C4A44A" />
          <stop offset="100%" stopColor="#8B7028" />
        </radialGradient>
        
        {/* Inner shadow for engraved feel */}
        <radialGradient id="fc-inner" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#1a1708" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#1a1708" stopOpacity="0.6" />
        </radialGradient>
        
        {/* Subtle shimmer highlight */}
        <linearGradient id="fc-shimmer" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="45%" stopColor="white" stopOpacity="0.15" />
          <stop offset="55%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Sophisticated geometric pattern */}
        <pattern id="fc-pattern" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3" cy="3" r="0.4" fill="#C4A44A" opacity="0.3" />
          <line x1="0" y1="3" x2="6" y2="3" stroke="#C4A44A" strokeWidth="0.15" opacity="0.2" />
          <line x1="3" y1="0" x2="3" y2="6" stroke="#C4A44A" strokeWidth="0.15" opacity="0.2" />
        </pattern>
      </defs>
      
      {/* Outer ring — thick, beveled edge */}
      <circle cx="24" cy="24" r="22" fill="url(#fc-coin)" />
      <circle cx="24" cy="24" r="22" fill="url(#fc-shimmer)" />
      
      {/* Knurled outer edge detail */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i * 10) * Math.PI / 180;
        const x1 = 24 + 21 * Math.cos(angle);
        const y1 = 24 + 21 * Math.sin(angle);
        const x2 = 24 + 22.5 * Math.cos(angle);
        const y2 = 24 + 22.5 * Math.sin(angle);
        return (
          <line 
            key={i} 
            x1={x1} y1={y1} x2={x2} y2={y2} 
            stroke="#8B7028" 
            strokeWidth="0.6" 
            opacity="0.5" 
          />
        );
      })}
      
      {/* Inner recessed circle */}
      <circle cx="24" cy="24" r="17.5" fill="#0d0b05" />
      <circle cx="24" cy="24" r="17.5" fill="url(#fc-inner)" />
      
      {/* Texture pattern inside */}
      <circle cx="24" cy="24" r="17" fill="url(#fc-pattern)" />
      
      {/* Inner decorative ring */}
      <circle cx="24" cy="24" r="17.5" stroke="#C4A44A" strokeWidth="0.5" fill="none" opacity="0.6" />
      <circle cx="24" cy="24" r="15" stroke="#C4A44A" strokeWidth="0.3" fill="none" opacity="0.25" strokeDasharray="1.5 2" />
      
      {/* Center emblem — zero hour ring (open circle) */}
      <circle cx="24" cy="24" r="6" stroke="#C4A44A" strokeWidth="1.8" fill="none" opacity="0.9" strokeLinecap="round" strokeDasharray="34 4" strokeDashoffset="-2" />
      
      {/* Dot at center */}
      <circle cx="24" cy="24" r="1.2" fill="#C4A44A" opacity="0.7" />
      
      {/* Corner accent marks — 4 cardinal ticks */}
      {[0, 90, 180, 270].map((deg) => {
        const angle = deg * Math.PI / 180;
        const x1 = 24 + 12 * Math.cos(angle);
        const y1 = 24 + 12 * Math.sin(angle);
        const x2 = 24 + 14 * Math.cos(angle);
        const y2 = 24 + 14 * Math.sin(angle);
        return (
          <line 
            key={deg} 
            x1={x1} y1={y1} x2={x2} y2={y2} 
            stroke="#C4A44A" 
            strokeWidth="0.8" 
            opacity="0.5" 
            strokeLinecap="round"
          />
        );
      })}
      
      {/* Top edge highlight for 3D feel */}
      <ellipse cx="24" cy="10" rx="10" ry="3" fill="white" opacity="0.04" />
    </svg>
  );
}

const SIZES = {
  sm: { icon: 14, container: 'h-[15px] px-1.5 text-[7px] gap-0.5' },
  md: { icon: 22, container: 'h-6 px-2 text-[10px] gap-1' },
  lg: { icon: 48, container: '' },
};

export default function FoundingBadge({ size = 'sm', animate = true }: FoundingBadgeProps) {
  const s = SIZES[size];
  
  // Large standalone mode — just the coin
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
  
  const badge = (
    <span 
      className={`inline-flex items-center ${s.container} bg-[#1a1708] text-gold border border-gold/40 rounded-full font-semibold uppercase tracking-wider`}
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
