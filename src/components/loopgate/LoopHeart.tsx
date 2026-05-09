import { SVGProps } from "react";

/**
 * LoopHeart — bespoke Loopgate "like" mark.
 * A chunky geometric heart with an inset notch, inspired by sticker /
 * trophy badges. Replaces the generic lucide Heart so likes don't read
 * as a default AI-template icon.
 *
 * Props mirror lucide: size, className, fill, strokeWidth.
 */
interface LoopHeartProps extends Omit<SVGProps<SVGSVGElement>, "fill"> {
  size?: number | string;
  filled?: boolean;
  strokeWidth?: number;
}

export default function LoopHeart({
  size = 20,
  filled = false,
  strokeWidth = 2,
  className,
  ...rest
}: LoopHeartProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {/* Faceted heart silhouette — flatter shoulders, sharper point */}
      <path d="M12 21 3.6 12.6a4.8 4.8 0 0 1 0-6.8 4.8 4.8 0 0 1 6.8 0L12 7.4l1.6-1.6a4.8 4.8 0 0 1 6.8 0 4.8 4.8 0 0 1 0 6.8Z" />
      {/* Inner spark notch — gives the icon a unique loop signature */}
      <path d="m9.5 11 2 2 3-3.5" />
    </svg>
  );
}
