import { motion } from "framer-motion";

interface GlitchEdgeProps {
  side: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * JS-driven infinite hue-rotate animation.
 * CSS filter animations break on iOS Safari — this uses framer-motion
 * to animate hue-rotate via inline styles, which works everywhere.
 */
export default function GlitchEdge({ side, className = "", style }: GlitchEdgeProps) {
  const baseGradient = side === "left"
    ? "linear-gradient(135deg, #f59e0b, #ef4444)"
    : "linear-gradient(135deg, #06b6d4, #a855f7)";

  const baseShadow = side === "left"
    ? "0 0 14px rgba(245,158,11,0.5)"
    : "0 0 14px rgba(139,92,246,0.5)";

  return (
    <motion.div
      className={className}
      style={{
        background: baseGradient,
        boxShadow: baseShadow,
        ...style,
      }}
      animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "linear",
        delay: side === "right" ? -4 : 0,
      }}
    />
  );
}
