import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '@/lib/utils';

interface RingsCoinProps {
  size?: number;
  spin?: boolean;
  className?: string;
}

/**
 * Iconic Rings currency coin — V-Bucks style.
 * Gold disc with a bold serif "R" monogram, deep bevel, and rim notches.
 */
export default function RingsCoin({ size = 28, spin = false, className }: RingsCoinProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn(className)}
      animate={spin ? { rotateY: [0, 360] } : undefined}
      transition={spin ? { duration: 3.2, repeat: Infinity, ease: 'linear' } : undefined}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* GTA-style green $ + chrome R */}
      <text
        x="32"
        y="48"
        textAnchor="middle"
        fontFamily="'Teko', 'Bebas Neue', Impact, sans-serif"
        fontWeight="700"
        fontSize="56"
        stroke="#000000"
        strokeWidth={9}
        strokeLinejoin="round"
        style={{ letterSpacing: '-0.06em', paintOrder: 'stroke fill' }}
      >
        <tspan fill="#3BCB6B">$</tspan>
        <tspan fill="#F4F4F5">R</tspan>
      </text>
    </motion.svg>
  );
}
