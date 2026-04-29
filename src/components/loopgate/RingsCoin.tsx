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
      className={cn('drop-shadow-[0_2px_8px_rgba(245,158,11,0.45)]', className)}
      animate={spin ? { rotateY: [0, 360] } : undefined}
      transition={spin ? { duration: 3.2, repeat: Infinity, ease: 'linear' } : undefined}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <defs>
        <radialGradient id={`${id}-face`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="45%" stopColor="#F5B331" />
          <stop offset="85%" stopColor="#B8761A" />
          <stop offset="100%" stopColor="#7A4A0F" />
        </radialGradient>
        <radialGradient id={`${id}-inner`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FFD86B" />
          <stop offset="60%" stopColor="#E89A1F" />
          <stop offset="100%" stopColor="#9C5E12" />
        </radialGradient>
        <linearGradient id={`${id}-r`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3A1F05" />
          <stop offset="100%" stopColor="#1A0E02" />
        </linearGradient>
      </defs>

      {/* Outer rim with notches */}
      <circle cx="32" cy="32" r="30" fill={`url(#${id}-face)`} />
      {/* Notches around rim */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const x = 32 + Math.cos(a) * 30;
        const y = 32 + Math.sin(a) * 30;
        return <circle key={i} cx={x} cy={y} r="1.1" fill="#7A4A0F" opacity="0.85" />;
      })}

      {/* Inner disc — the "face" */}
      <circle cx="32" cy="32" r="24" fill={`url(#${id}-inner)`} stroke="#7A4A0F" strokeWidth="1.2" />
      {/* Inner ring detail */}
      <circle cx="32" cy="32" r="22" fill="none" stroke="#FFE39A" strokeWidth="0.8" opacity="0.6" />

      {/* Bold serif R monogram */}
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontSize="34"
        fill={`url(#${id}-r)`}
        style={{ letterSpacing: '-0.04em' }}
      >
        R
      </text>
      {/* Subtle highlight on R */}
      <text
        x="31.4"
        y="43.4"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontSize="34"
        fill="#FFE9A8"
        opacity="0.18"
        style={{ letterSpacing: '-0.04em' }}
      >
        R
      </text>

      {/* Top-left specular highlight */}
      <ellipse cx="22" cy="18" rx="9" ry="5" fill="#FFFFFF" opacity="0.35" />
    </motion.svg>
  );
}
