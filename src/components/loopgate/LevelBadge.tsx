import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  showAura?: boolean;
  className?: string;
}

function getLevelColors(_level: number) {
  return { bg: "bg-white/[0.05]", text: "text-white/50", border: "border-white/[0.08]" } as const;
}

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
  const colors = getLevelColors(level);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold uppercase tracking-wider border rounded-md",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      {showLabel && <span>Lv</span>}
      <span>{level}</span>
    </span>
  );
}