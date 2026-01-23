import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: 12,
  md: 16,
  lg: 20,
};

export default function VerifiedBadge({ size = "md", className = "" }: VerifiedBadgeProps) {
  return (
    <BadgeCheck
      size={sizeMap[size]}
      className={`text-[hsl(210,100%,52%)] fill-[hsl(210,100%,52%)]/20 ${className}`}
      aria-label="Verified"
    />
  );
}
