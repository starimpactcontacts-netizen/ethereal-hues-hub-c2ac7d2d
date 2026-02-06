import { cn } from "@/lib/utils";

interface LoopedXProps {
  className?: string;
  size?: number;
}

// Loopgate signature close icon - an infinity-style looped X
export function LoopedX({ className, size = 20 }: LoopedXProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-foreground", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Looped X - two curved lines that weave/interlock */}
      <path
        d="M4 4C4 4 8 8 12 12C16 16 20 20 20 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 4C20 4 16 8 14 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 14C8 16 4 20 4 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* The loop/knot in the center */}
      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

export default LoopedX;
