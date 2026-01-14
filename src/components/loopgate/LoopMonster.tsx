import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface LoopMonsterProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export default function LoopMonster({ scrollContainerRef }: LoopMonsterProps) {
  const [pullAmount, setPullAmount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [eyesBlink, setEyesBlink] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let startY = 0;
    let isTouchActive = false;
    let wasAtTop = false;

    const isAtTop = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      return scrollTop <= 5;
    };

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isTouchActive = true;
      wasAtTop = isAtTop();
      
      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchActive) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY; // Positive = pulling DOWN
      
      // Only trigger when at top AND pulling down
      if (wasAtTop && diff > 10) {
        // Apply resistance for elastic feel
        const pull = Math.min(Math.pow(diff - 10, 0.75) * 1.5, 120);
        setPullAmount(pull);
        
        if (pull > 8) {
          setIsVisible(true);
        }
      } else {
        setPullAmount(0);
      }
    };

    const handleTouchEnd = () => {
      isTouchActive = false;
      wasAtTop = false;
      
      // Snap away immediately
      setPullAmount(0);
      
      // Brief delay before fully hiding for snap animation
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 300);
    };

    // Blink animation interval
    const blinkInterval = setInterval(() => {
      if (isVisible) {
        setEyesBlink(true);
        setTimeout(() => setEyesBlink(false), 150);
      }
    }, 2500);

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      clearInterval(blinkInterval);
      
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isVisible]);

  // Progress from 0 to 1 based on pull
  const progress = Math.min(pullAmount / 80, 1);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          style={{ top: -20 }}
          initial={{ y: -100, opacity: 0 }}
          animate={{ 
            y: pullAmount * 0.9, // Follows the pull
            opacity: Math.min(progress * 1.5, 1),
          }}
          exit={{ 
            y: -120,
            opacity: 0,
            transition: { duration: 0.25, ease: "easeIn" }
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
          }}
        >
          {/* Loop Monster - Premium Infinity Creature */}
          <div className="relative flex flex-col items-center">
            {/* Subtle glow behind */}
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-20 rounded-full blur-2xl"
              style={{ 
                background: 'radial-gradient(ellipse, hsla(45, 93%, 47%, 0.4) 0%, transparent 70%)'
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            
            {/* Main Monster SVG */}
            <svg 
              width="100" 
              height="60" 
              viewBox="0 0 100 60" 
              className="relative z-10"
            >
              <defs>
                {/* Premium gold gradient */}
                <linearGradient id="loopMonsterGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(43, 74%, 49%)" />
                  <stop offset="30%" stopColor="hsl(45, 100%, 60%)" />
                  <stop offset="50%" stopColor="hsl(48, 100%, 70%)" />
                  <stop offset="70%" stopColor="hsl(45, 100%, 60%)" />
                  <stop offset="100%" stopColor="hsl(43, 74%, 49%)" />
                </linearGradient>
                
                {/* Shine gradient for highlight */}
                <linearGradient id="loopMonsterShine" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(48, 100%, 80%)" />
                  <stop offset="100%" stopColor="hsl(45, 93%, 55%)" />
                </linearGradient>
                
                {/* Eye glow filter */}
                <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Main infinity body - fluid, premium stroke */}
              <motion.path
                d="M25 30 C25 18, 12 12, 12 30 C12 48, 25 42, 25 30 C25 18, 38 12, 50 30 C50 30, 62 12, 75 30 C75 42, 88 48, 88 30 C88 12, 75 18, 75 30 C75 42, 62 48, 50 30 C38 48, 25 42, 25 30"
                fill="none"
                stroke="url(#loopMonsterGold)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{
                  pathLength: progress > 0 ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                style={{ filter: 'drop-shadow(0 2px 8px hsla(45, 93%, 47%, 0.5))' }}
              />
              
              {/* Inner shine line */}
              <motion.path
                d="M27 30 C27 20, 16 16, 16 30 C16 44, 27 40, 27 30 C27 20, 38 16, 50 30 C50 30, 62 16, 73 30 C73 40, 84 44, 84 30 C84 16, 73 20, 73 30 C73 40, 62 44, 50 30 C38 44, 27 40, 27 30"
                fill="none"
                stroke="url(#loopMonsterShine)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
                animate={{
                  opacity: progress > 0.3 ? [0.3, 0.7, 0.3] : 0,
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              
              {/* Left eye - premium, mysterious */}
              <motion.g filter="url(#eyeGlow)">
                <motion.ellipse
                  cx="20"
                  cy="28"
                  rx={eyesBlink ? 3.5 : 3.5}
                  ry={eyesBlink ? 0.5 : 5}
                  fill="hsl(48, 100%, 70%)"
                  animate={{
                    ry: eyesBlink ? 0.5 : 5,
                    opacity: progress > 0.2 ? 1 : 0,
                  }}
                  transition={{ duration: 0.1 }}
                />
                {/* Eye pupil */}
                {!eyesBlink && (
                  <motion.circle
                    cx="20"
                    cy="29"
                    r="2"
                    fill="hsl(30, 80%, 25%)"
                    animate={{
                      opacity: progress > 0.3 ? 1 : 0,
                    }}
                  />
                )}
              </motion.g>
              
              {/* Right eye - premium, mysterious */}
              <motion.g filter="url(#eyeGlow)">
                <motion.ellipse
                  cx="80"
                  cy="28"
                  rx={eyesBlink ? 3.5 : 3.5}
                  ry={eyesBlink ? 0.5 : 5}
                  fill="hsl(48, 100%, 70%)"
                  animate={{
                    ry: eyesBlink ? 0.5 : 5,
                    opacity: progress > 0.2 ? 1 : 0,
                  }}
                  transition={{ duration: 0.1 }}
                />
                {/* Eye pupil */}
                {!eyesBlink && (
                  <motion.circle
                    cx="80"
                    cy="29"
                    r="2"
                    fill="hsl(30, 80%, 25%)"
                    animate={{
                      opacity: progress > 0.3 ? 1 : 0,
                    }}
                  />
                )}
              </motion.g>
            </svg>
            
            {/* Subtle wiggle particles - only when fully pulled */}
            {progress > 0.6 && (
              <>
                <motion.div
                  className="absolute top-3 -left-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'hsl(45, 100%, 60%)' }}
                  animate={{ 
                    y: [0, -8, 0],
                    x: [-2, 2, -2],
                    opacity: [0.6, 1, 0.6],
                    scale: [0.8, 1, 0.8]
                  }}
                  transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute top-3 -right-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'hsl(45, 100%, 60%)' }}
                  animate={{ 
                    y: [0, -8, 0],
                    x: [2, -2, 2],
                    opacity: [0.6, 1, 0.6],
                    scale: [0.8, 1, 0.8]
                  }}
                  transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }}
                />
              </>
            )}
            
            {/* Body wiggle effect */}
            <motion.div
              className="absolute inset-0"
              animate={{
                rotate: progress > 0.5 ? [-1, 1, -1] : 0,
              }}
              transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
