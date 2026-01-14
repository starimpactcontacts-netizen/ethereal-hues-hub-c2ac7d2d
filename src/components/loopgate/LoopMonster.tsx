import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface LoopMonsterProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export default function LoopMonster({ scrollContainerRef }: LoopMonsterProps) {
  const [pullAmount, setPullAmount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const lastScrollTop = useRef(0);
  const consecutiveBottomScrolls = useRef(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let startY = 0;
    let isTouchActive = false;
    let wasAtBottom = false;

    const isAtBottom = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      // For short pages, always at bottom
      const isShortPage = scrollHeight <= clientHeight + 10;
      // Within 30px of bottom
      return isShortPage || scrollTop + clientHeight >= scrollHeight - 30;
    };

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isTouchActive = true;
      wasAtBottom = isAtBottom();
      
      // Clear any pending hide
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      
      console.log('[LoopMonster] Touch start, at bottom:', wasAtBottom);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchActive) return;
      
      const currentY = e.touches[0].clientY;
      const diff = startY - currentY; // Positive = swiping up
      
      // Check if touch started in bottom third of screen
      const screenHeight = window.innerHeight;
      const touchStartedInBottomZone = startY > screenHeight * 0.6;
      
      // Trigger when: at bottom (or was at bottom) AND swiping up AND started low on screen
      if (wasAtBottom && diff > 15 && touchStartedInBottomZone) {
        const pull = Math.min((diff - 15) * 0.8, 100);
        setPullAmount(pull);
        
        if (pull > 5) {
          setIsVisible(true);
          console.log('[LoopMonster] Showing, pull:', pull);
        }
      } else if (diff < -10) {
        // Swiping down - hide
        setPullAmount(0);
      }
    };

    const handleTouchEnd = () => {
      isTouchActive = false;
      wasAtBottom = false;
      setPullAmount(0);
      
      // Delay hiding for fly-away animation
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 600);
      
      console.log('[LoopMonster] Touch end');
    };

    // Also detect scroll-to-bottom attempts (repeated scrolling at bottom)
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
      const scrollingDown = scrollTop > lastScrollTop.current;
      
      if (atBottom && scrollingDown) {
        consecutiveBottomScrolls.current++;
        
        // After 3 consecutive scroll attempts at bottom, show briefly
        if (consecutiveBottomScrolls.current >= 3) {
          setIsVisible(true);
          setPullAmount(60);
          console.log('[LoopMonster] Scroll trigger activated');
          
          setTimeout(() => {
            setPullAmount(0);
            setIsVisible(false);
          }, 1200);
          
          consecutiveBottomScrolls.current = 0;
        }
      } else if (!atBottom) {
        consecutiveBottomScrolls.current = 0;
      }
      
      lastScrollTop.current = scrollTop;
    };

    // Global touch listeners
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
      
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const progress = Math.min(pullAmount / 60, 1);

  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      style={{ bottom: 120 }} // Above bottom nav + safe area
      initial={{ y: 150, opacity: 0 }}
      animate={{ 
        y: isVisible ? -(pullAmount * 0.6) : 150,
        opacity: isVisible ? Math.max(0.3, progress) : 0,
        scale: 0.7 + (progress * 0.5),
        rotate: progress * 360
      }}
      transition={{ 
        type: "spring", 
        stiffness: 180, 
        damping: 18,
        rotate: { duration: 0.6, ease: "easeOut" }
      }}
    >
      {/* Loop Monster - Infinity Symbol with Eyes */}
      <div className="relative">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 blur-xl bg-gold/50 rounded-full"
          style={{ transform: `scale(${1.2 + progress * 0.5})` }}
        />
        
        {/* Main infinity symbol */}
        <svg 
          width="72" 
          height="48" 
          viewBox="0 0 64 40" 
          className="relative z-10"
        >
          {/* Infinity path */}
          <motion.path
            d="M16 20C16 12 8 8 8 20C8 32 16 28 16 20C16 12 24 8 32 20C32 20 40 8 48 20C48 32 56 28 56 20C56 8 48 12 48 20C48 28 40 32 32 20C24 8 16 28 16 20Z"
            fill="none"
            stroke="url(#goldGradientMonster)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: isVisible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Left eye */}
          <motion.circle
            cx="12"
            cy="18"
            r="4"
            fill="hsl(var(--gold))"
            animate={{ 
              scale: isVisible ? [1, 1.3, 1] : 0,
            }}
            transition={{ repeat: isVisible ? Infinity : 0, duration: 0.8 }}
          />
          
          {/* Right eye */}
          <motion.circle
            cx="52"
            cy="18"
            r="4"
            fill="hsl(var(--gold))"
            animate={{ 
              scale: isVisible ? [1, 1.3, 1] : 0,
            }}
            transition={{ repeat: isVisible ? Infinity : 0, duration: 0.8, delay: 0.4 }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="goldGradientMonster" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(45, 93%, 47%)" />
              <stop offset="50%" stopColor="hsl(45, 100%, 65%)" />
              <stop offset="100%" stopColor="hsl(45, 93%, 47%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Sparkles */}
        {isVisible && progress > 0.4 && (
          <>
            <motion.div
              className="absolute -top-3 -left-3 w-3 h-3 bg-gold rounded-full"
              animate={{ 
                y: [-5, -20, -5],
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
            <motion.div
              className="absolute -top-3 -right-3 w-3 h-3 bg-gold rounded-full"
              animate={{ 
                y: [-5, -20, -5],
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.25 }}
            />
            <motion.div
              className="absolute top-1/2 -left-4 w-2 h-2 bg-gold/70 rounded-full"
              animate={{ 
                x: [-5, -15, -5],
                opacity: [0, 1, 0],
              }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.5 }}
            />
            <motion.div
              className="absolute top-1/2 -right-4 w-2 h-2 bg-gold/70 rounded-full"
              animate={{ 
                x: [5, 15, 5],
                opacity: [0, 1, 0],
              }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.75 }}
            />
          </>
        )}
      </div>
      
      {/* Text */}
      <motion.p
        className="text-center text-xs text-gold font-display mt-3 uppercase tracking-[0.2em] font-bold"
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: isVisible && progress > 0.5 ? 1 : 0,
          y: isVisible && progress > 0.5 ? 0 : 10
        }}
        transition={{ duration: 0.3 }}
      >
        ∞ LOOP
      </motion.p>
    </motion.div>
  );
}
