import { motion } from 'framer-motion';
import loopgateLogo from '@/assets/loopgate-logo.png';

interface LoadingScreenProps {
  minimal?: boolean;
}

// Modern crosshairs-style spinner component
function CrosshairsSpinner({ size = 48 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer ring - static */}
      <div 
        className="absolute inset-0 rounded-full border border-gold/20"
      />
      
      {/* Rotating arc segments */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        {/* Primary arc */}
        <svg className="w-full h-full" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="hsl(var(--gold))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="35 104"
          />
        </svg>
      </motion.div>

      {/* Counter-rotating inner arc */}
      <motion.div
        className="absolute inset-2"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="hsl(var(--gold))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="20 94"
            opacity="0.6"
          />
        </svg>
      </motion.div>

      {/* Center dot */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gold"
      />

      {/* Crosshair lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-1.5 h-px bg-gold/40 left-1" />
        <div className="absolute w-1.5 h-px bg-gold/40 right-1" />
        <div className="absolute h-1.5 w-px bg-gold/40 top-1" />
        <div className="absolute h-1.5 w-px bg-gold/40 bottom-1" />
      </div>
    </div>
  );
}

export default function LoadingScreen({ minimal = false }: LoadingScreenProps) {
  if (minimal) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <CrosshairsSpinner size={40} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      {/* Logo with subtle pulse */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <motion.img 
          src={loopgateLogo} 
          alt="Loopgate" 
          className="w-16 h-16 object-contain"
          animate={{ 
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Crosshairs spinner */}
      <CrosshairsSpinner size={56} />

      {/* Loading text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <span className="text-xs text-muted-foreground tracking-[0.3em] uppercase">
          Loading
        </span>
      </motion.div>
    </div>
  );
}
