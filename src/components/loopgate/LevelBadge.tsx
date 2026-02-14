import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  showAura?: boolean;
  className?: string;
}

// Color scheme based on level tier
const levelColors: Record<number, { bg: string; text: string; border: string; glow?: string }> = {
  1: { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-muted-foreground/30" },
  2: { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-muted-foreground/30" },
  3: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  4: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  5: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  6: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  7: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  8: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  9: { bg: "bg-gold/10", text: "text-gold", border: "border-gold/30", glow: "shadow-[0_0_8px_rgba(212,175,55,0.4)]" },
  10: { bg: "bg-gold/20", text: "text-gold", border: "border-gold/50", glow: "shadow-[0_0_12px_rgba(212,175,55,0.6)]" },
};

const sizeClasses = {
  xs: "text-[7px] px-1.5 py-px",
  sm: "text-[8px] px-2 py-0.5",
  md: "text-[9px] px-2 py-0.5",
  lg: "text-[10px] px-2.5 py-1",
};

export default function LevelBadge({ 
  level, 
  size = "sm", 
  showLabel = true,
  showAura = false,
  className 
}: LevelBadgeProps) {
  const colors = levelColors[level] || levelColors[1];
  const hasGoldAura = showAura && level >= 5;
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold uppercase tracking-wider border rounded-md transition-shadow",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        hasGoldAura && colors.glow,
        hasGoldAura && level >= 9 && "animate-pulse",
        className
      )}
    >
      {showLabel && <span>Lv</span>}
      <span>{level}</span>
    </span>
  );
}