import { motion } from "framer-motion";

interface FoundingBadgeProps {
  size?: 'sm' | 'md';
  animate?: boolean;
}

// Custom zero hour ring icon - circle with break at top
const ZeroHourIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round"
    className={className}
  >
    <path d="M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17" />
  </svg>
);

export default function FoundingBadge({ size = 'sm', animate = true }: FoundingBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'h-4 px-1.5 text-[9px] gap-0.5' 
    : 'h-5 px-2 text-[10px] gap-1';
  
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  
  const badge = (
    <span 
      className={`inline-flex items-center ${sizeClasses} bg-black text-gold border border-gold/60 rounded-full font-semibold uppercase tracking-wider`}
      title="First Circle - Founding Loopgate Competitor"
    >
      <ZeroHourIcon className={iconSize} />
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
