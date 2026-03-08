import { motion } from "framer-motion";

interface FoundingBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

// Minimal gold emblem — small circle with inner ring
function BadgeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#C4A44A" strokeWidth="1.2" fill="none" opacity="0.8" />
      <circle cx="8" cy="8" r="2.5" stroke="#C4A44A" strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="8" cy="8" r="0.8" fill="#C4A44A" opacity="0.7" />
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
