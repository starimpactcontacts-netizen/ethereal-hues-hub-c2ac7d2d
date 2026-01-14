import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface LoopMonsterProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export default function LoopMonster({ scrollContainerRef }: LoopMonsterProps) {
  const [overscrollY, setOverscrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef?.current || window;
    const isWindow = container === window;

    let startY = 0;
    let isAtTop = true;

    const handleScroll = () => {
      const scrollTop = isWindow 
        ? window.scrollY 
        : (container as HTMLElement).scrollTop;
      isAtTop = scrollTop <= 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 0) {
        // Pulling down while at top
        const pullAmount = Math.min(diff, 150);
        setOverscrollY(pullAmount);
        setIsVisible(pullAmount > 20);
      }
    };

    const handleTouchEnd = () => {
      setOverscrollY(0);
      setTimeout(() => setIsVisible(false), 300);
    };

    // Also handle mouse wheel overscroll for desktop
    const handleWheel = (e: WheelEvent) => {
      const scrollTop = isWindow 
        ? window.scrollY 
        : (container as HTMLElement).scrollTop;
      
      if (scrollTop <= 0 && e.deltaY < 0) {
        const pullAmount = Math.min(Math.abs(e.deltaY) * 2, 100);
        setOverscrollY(pullAmount);
        setIsVisible(true);
        
        setTimeout(() => {
          setOverscrollY(0);
          setTimeout(() => setIsVisible(false), 300);
        }, 500);
      }
    };

    if (isWindow) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
      window.addEventListener('wheel', handleWheel, { passive: true });
    } else {
      const el = container as HTMLElement;
      el.addEventListener('scroll', handleScroll, { passive: true });
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchmove', handleTouchMove, { passive: true });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
      el.addEventListener('wheel', handleWheel, { passive: true });
    }

    return () => {
      if (isWindow) {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('wheel', handleWheel);
      } else {
        const el = container as HTMLElement;
        el.removeEventListener('scroll', handleScroll);
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchmove', handleTouchMove);
        el.removeEventListener('touchend', handleTouchEnd);
        el.removeEventListener('wheel', handleWheel);
      }
    };
  }, [scrollContainerRef]);

  const progress = Math.min(overscrollY / 100, 1);

  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: isVisible ? 80 + (overscrollY * 0.5) : -100,
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