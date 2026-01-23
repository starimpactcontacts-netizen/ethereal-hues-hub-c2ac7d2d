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
      className={`text-white fill-[hsl(214,89%,52%)] ${className}`}
      strokeWidth={2.5}
      aria-label="Verified"
    />
  );
}
