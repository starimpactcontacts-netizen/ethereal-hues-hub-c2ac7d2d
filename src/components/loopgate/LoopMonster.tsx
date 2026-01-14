import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

interface LoopMonsterProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export default function LoopMonster({ scrollContainerRef }: LoopMonsterProps) {
  const [pullAmount, setPullAmount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    let startY = 0;
    let currentPull = 0;

    const getScrollTop = () => {
      if (scrollContainerRef?.current) {
        return scrollContainerRef.current.scrollTop;
      }
      return window.scrollY || document.documentElement.scrollTop;
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Only start tracking if at top of page
      if (getScrollTop() <= 5) {
        startY = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling && getScrollTop() > 5) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      // Only activate when pulling down (positive diff) and at top
      if (diff > 0 && getScrollTop() <= 5) {
        // Apply resistance for natural feel
        currentPull = Math.min(diff * 0.6, 120);
        setPullAmount(currentPull);
        
        if (currentPull > 15) {
          setIsVisible(true);
        }
      } else {
        currentPull = 0;
        setPullAmount(0);
      }
    };

    const handleTouchEnd = () => {
      setIsPulling(false);
      setPullAmount(0);
      // Delay hiding for smooth exit animation
      setTimeout(() => setIsVisible(false), 400);
    };

    // Add listeners to window for global touch tracking
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [scrollContainerRef, isPulling]);

  const progress = Math.min(pullAmount / 80, 1);

  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: isVisible ? 80 + (pullAmount * 0.5) : -100,
        opacity: isVisible ? progress : 0,
        scale: 0.8 + (progress * 0.4),
        rotate: progress * 360
      }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 20,
        rotate: { duration: 0.8, ease: "easeOut" }
      }}
    >
      {/* Loop Monster - Infinity Symbol with Eyes */}
      <div className="relative">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 blur-xl bg-gold/40 rounded-full"
          style={{ transform: `scale(${1 + progress * 0.5})` }}
        />
        
        {/* Main infinity symbol */}
        <svg 
          width="64" 
          height="40" 
          viewBox="0 0 64 40" 
          className="relative z-10"
        >
          {/* Infinity path */}
          <motion.path
            d="M16 20C16 12 8 8 8 20C8 32 16 28 16 20C16 12 24 8 32 20C32 20 40 8 48 20C48 32 56 28 56 20C56 8 48 12 48 20C48 28 40 32 32 20C24 8 16 28 16 20Z"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Left eye */}
          <motion.circle
            cx="12"
            cy="18"
            r="3"
            fill="hsl(var(--gold))"
            animate={{ 
              scale: isVisible ? [1, 1.2, 1] : 1,
              opacity: progress 
            }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
          
          {/* Right eye */}
          <motion.circle
            cx="52"
            cy="18"
            r="3"
            fill="hsl(var(--gold))"
            animate={{ 
              scale: isVisible ? [1, 1.2, 1] : 1,
              opacity: progress 
            }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.5 }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(45, 93%, 47%)" />
              <stop offset="50%" stopColor="hsl(45, 100%, 60%)" />
              <stop offset="100%" stopColor="hsl(45, 93%, 47%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Sparkles around */}
        {isVisible && progress > 0.5 && (
          <>
            <motion.div
              className="absolute -top-2 -left-2 w-2 h-2 bg-gold rounded-full"
              animate={{ 
                y: [-5, -15, -5],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <motion.div
              className="absolute -top-2 -right-2 w-2 h-2 bg-gold rounded-full"
              animate={{ 
                y: [-5, -15, -5],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
            />
          </>
        )}
      </div>
      
      {/* Text below */}
      <motion.p
        className="text-center text-xs text-gold font-display mt-2 uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: progress > 0.7 ? 1 : 0 }}
      >
        ∞ LOOP
      </motion.p>
    </motion.div>
  );
}