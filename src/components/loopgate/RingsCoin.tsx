import { motion } from 'framer-motion';
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
  const id = `rings-${size}`;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn('drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]', className)}
      animate={spin ? { rotateY: [0, 360] } : undefined}
      transition={spin ? { duration: 3.2, repeat: Infinity, ease: 'linear' } : undefined}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <defs>
        {/* Brushed chrome face */}
        <radialGradient id={`${id}-face`} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#E8E8EC" />
          <stop offset="80%" stopColor="#9A9AA2" />
          <stop offset="100%" stopColor="#3A3A40" />
        </radialGradient>
        <radialGradient id={`${id}-inner`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#D4D4D8" />
          <stop offset="100%" stopColor="#52525B" />
        </radialGradient>
      </defs>

      {/* Outer rim */}
      <circle cx="32" cy="32" r="30" fill={`url(#${id}-face)`} />
      {/* Notches */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const x = 32 + Math.cos(a) * 30;
        const y = 32 + Math.sin(a) * 30;
        return <circle key={i} cx={x} cy={y} r="1" fill="#1A1A1F" opacity="0.7" />;
      })}

      {/* Inner disc */}
      <circle cx="32" cy="32" r="24" fill={`url(#${id}-inner)`} stroke="#27272A" strokeWidth="1" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.5" />

      {/* Bold R monogram — deep black */}
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontSize="34"
        fill="#0A0A0F"
        style={{ letterSpacing: '-0.04em' }}
      >
        R
      </text>

      {/* Top-left specular highlight */}
      <ellipse cx="22" cy="17" rx="10" ry="5" fill="#FFFFFF" opacity="0.5" />
    </motion.svg>
  );
}
