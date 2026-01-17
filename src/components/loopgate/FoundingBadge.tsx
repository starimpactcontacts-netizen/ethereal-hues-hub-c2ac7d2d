import { Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface FoundingBadgeProps {
  size?: 'sm' | 'md';
  animate?: boolean;
}

export default function FoundingBadge({ size = 'sm', animate = true }: FoundingBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'h-4 px-1.5 text-[9px] gap-0.5' 
    : 'h-5 px-2 text-[10px] gap-1';
  
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  
  const badge = (
    <span 
      className={`inline-flex items-center ${sizeClasses} bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/50 rounded-full font-semibold uppercase tracking-wider`}
      title="Founding Competitor - Early Loopgate Adopter"
    >
      <Rocket className={iconSize} />
      FOUNDER
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
