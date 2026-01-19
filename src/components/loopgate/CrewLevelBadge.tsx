import { cn } from "@/lib/utils";
import { Shield, Crown, Star, Zap, Gem, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface CrewLevelBadgeProps {
  level: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  showAura?: boolean;
  animate?: boolean;
  className?: string;
}

// Badge tier configuration - evolution system
const BADGE_TIERS = {
  // Level 1-2: Grey/Stone tier
  stone: {
    levels: [1, 2],
    bg: "bg-gradient-to-br from-zinc-600/20 to-zinc-700/30",
    border: "border-zinc-500/30",
    text: "text-zinc-400",
    icon: Shield,
    glow: "",
    label: "Stone",
  },
  // Level 3-4: Bronze tier
  bronze: {
    levels: [3, 4],
    bg: "bg-gradient-to-br from-amber-700/20 to-orange-800/30",
    border: "border-amber-600/40",
    text: "text-amber-500",
    icon: Shield,
    glow: "shadow-[0_0_10px_rgba(180,83,9,0.3)]",
    label: "Bronze",
  },
  // Level 5-6: Silver tier
  silver: {
    levels: [5, 6],
    bg: "bg-gradient-to-br from-slate-300/20 to-slate-400/30",
    border: "border-slate-300/50",
    text: "text-slate-200",
    icon: Star,
    glow: "shadow-[0_0_12px_rgba(203,213,225,0.4)]",
    label: "Silver",
  },
  // Level 7-8: Gold tier
  gold: {
    levels: [7, 8],
    bg: "bg-gradient-to-br from-yellow-500/20 to-amber-500/30",
    border: "border-gold/50",
    text: "text-gold",
    icon: Crown,
    glow: "shadow-[0_0_15px_rgba(212,175,55,0.5)]",
    label: "Gold",
  },
  // Level 9: Diamond tier
  diamond: {
    levels: [9],
    bg: "bg-gradient-to-br from-cyan-400/20 to-blue-500/30",
    border: "border-cyan-400/60",
    text: "text-cyan-300",
    icon: Gem,
    glow: "shadow-[0_0_18px_rgba(34,211,238,0.5)]",
    label: "Diamond",
  },
  // Level 10: Legendary/Rainbow tier
  legendary: {
    levels: [10],
    bg: "bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20",
    border: "border-purple-400/60",
    text: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400",
    icon: Sparkles,
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.4),0_0_40px_rgba(236,72,153,0.2)]",
    label: "Legendary",
  },
};

function getTierForLevel(level: number) {
  if (level >= 10) return BADGE_TIERS.legendary;
  if (level >= 9) return BADGE_TIERS.diamond;
  if (level >= 7) return BADGE_TIERS.gold;
  if (level >= 5) return BADGE_TIERS.silver;
  if (level >= 3) return BADGE_TIERS.bronze;
  return BADGE_TIERS.stone;
}

const SIZE_CLASSES = {
  xs: {
    container: "h-5 px-1.5 gap-0.5",
    icon: "w-3 h-3",
    text: "text-[9px]",
    level: "text-[10px]",
  },
  sm: {
    container: "h-6 px-2 gap-1",
    icon: "w-3.5 h-3.5",
    text: "text-[10px]",
    level: "text-xs",
  },
  md: {
    container: "h-7 px-2.5 gap-1.5",
    icon: "w-4 h-4",
    text: "text-xs",
    level: "text-sm",
  },
  lg: {
    container: "h-9 px-3 gap-2",
    icon: "w-5 h-5",
    text: "text-sm",
    level: "text-base",
  },
  xl: {
    container: "h-12 px-4 gap-2",
    icon: "w-6 h-6",
    text: "text-base",
    level: "text-lg",
  },
};

export default function CrewLevelBadge({
  level,
  size = "sm",
  showLabel = false,
  showAura = true,
  animate = true,
  className,
}: CrewLevelBadgeProps) {
  const tier = getTierForLevel(level);
  const sizeClass = SIZE_CLASSES[size];
  const IconComponent = tier.icon;
  const isLegendary = level >= 10;
  const isDiamond = level >= 9;
  const isGold = level >= 7;

  const content = (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border font-bold",
        tier.bg,
        tier.border,
        showAura && tier.glow,
        sizeClass.container,
        isLegendary && animate && "animate-pulse",
        className
      )}
    >
      <IconComponent className={cn(sizeClass.icon, tier.text)} />
      {showLabel && (
        <span className={cn(sizeClass.text, "uppercase tracking-wider font-semibold", tier.text)}>
          {tier.label}
        </span>
      )}
      <span className={cn(sizeClass.level, "font-black", tier.text)}>
        {level}
      </span>
    </div>
  );

  // Add motion wrapper for high-tier badges
  if (animate && (isLegendary || isDiamond)) {
    return (
      <motion.div
        animate={isLegendary ? {
          scale: [1, 1.02, 1],
        } : undefined}
        transition={isLegendary ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        } : undefined}
        className="inline-flex"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// Export tier info for use in other components
export { getTierForLevel, BADGE_TIERS };
