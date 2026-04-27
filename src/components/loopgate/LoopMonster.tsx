import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import loopyAvatar from "@/assets/loopy-avatar.png";

interface LoopMonsterProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export default function LoopMonster({ scrollContainerRef }: LoopMonsterProps) {
  const [pullAmount, setPullAmount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchActive) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (wasAtTop && diff > 10) {
        const pull = Math.min(Math.pow(diff - 10, 0.75) * 1.5, 140);
        setPullAmount(pull);
        if (pull > 8) setIsVisible(true);
      } else {
        setPullAmount(0);
      }
    };

    const handleTouchEnd = () => {
      isTouchActive = false;
      wasAtTop = false;
      setPullAmount(0);
      hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 400);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const progress = Math.min(pullAmount / 80, 1);
  // Panic level — the more you pull, the more distressed Loopy gets
  const isPanicking = progress > 0.6;
  const isMax = progress > 0.9;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          style={{ top: -10 }}
          initial={{ y: -80, opacity: 0 }}
          animate={{
            y: pullAmount * 0.7,
            opacity: Math.min(progress * 2, 1),
          }}
          exit={{
            y: -100,
            opacity: 0,
            transition: { duration: 0.3, ease: "easeIn" },
          }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 22,
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Arms clinging to top edge */}
            <svg width="120" height="20" viewBox="0 0 120 20" className="relative z-20 -mb-1">
              {/* Left arm */}
              <motion.path
                d="M30 18 Q28 8, 20 2 Q16 0, 14 2"
                fill="none"
                stroke="hsl(0, 0%, 15%)"
                strokeWidth="3"
                strokeLinecap="round"
                animate={{
                  d: isPanicking
                    ? "M30 18 Q26 6, 16 1 Q12 -1, 10 2"
                    : "M30 18 Q28 8, 20 2 Q16 0, 14 2",
                }}
                transition={{ duration: 0.2 }}
              />
              {/* Left paw grip */}
              <motion.circle
                cx={isPanicking ? 10 : 14}
                cy="2"
                r="3"
                fill="hsl(0, 0%, 95%)"
                stroke="hsl(0, 0%, 15%)"
                strokeWidth="2"
                animate={{
                  cy: isPanicking ? [1, 3, 1] : 2,
                }}
                transition={{ repeat: isPanicking ? Infinity : 0, duration: 0.3 }}
              />

              {/* Right arm */}
              <motion.path
                d="M90 18 Q92 8, 100 2 Q104 0, 106 2"
                fill="none"
                stroke="hsl(0, 0%, 15%)"
                strokeWidth="3"
                strokeLinecap="round"
                animate={{
                  d: isPanicking
                    ? "M90 18 Q94 6, 104 1 Q108 -1, 110 2"
                    : "M90 18 Q92 8, 100 2 Q104 0, 106 2",
                }}
                transition={{ duration: 0.2 }}
              />
              {/* Right paw grip */}
              <motion.circle
                cx={isPanicking ? 110 : 106}
                cy="2"
                r="3"
                fill="hsl(0, 0%, 95%)"
                stroke="hsl(0, 0%, 15%)"
                strokeWidth="2"
                animate={{
                  cy: isPanicking ? [1, 3, 1] : 2,
                }}
                transition={{ repeat: isPanicking ? Infinity : 0, duration: 0.3, delay: 0.15 }}
              />
            </svg>

            {/* Loopy's face */}
            <motion.div
              className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-background shadow-lg z-10"
              animate={{
                rotate: isPanicking ? [-5, 5, -5] : [0, 0],
                scale: isMax ? [1, 1.05, 1] : 1,
              }}
              transition={{
                repeat: isPanicking ? Infinity : 0,
                duration: isPanicking ? 0.25 : 0.5,
                ease: "easeInOut",
              }}
            >
              <img
                src={loopyAvatar}
                alt="Loopy hanging on!"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Speech bubble — escalates with pull */}
            <motion.div
              className="mt-1 px-2 py-0.5 rounded-full bg-card border border-border shadow-md"
              animate={{
                opacity: progress > 0.3 ? 1 : 0,
                scale: progress > 0.3 ? 1 : 0.8,
              }}
            >
              <span className="text-[10px] font-bold text-foreground whitespace-nowrap">
                {isMax
                  ? "BRO STOP 😭😭😭"
                  : isPanicking
                  ? "HELP ME 💀"
                  : progress > 0.3
                  ? "yo chill 😰"
                  : ""}
              </span>
            </motion.div>

            {/* Sweat drops when panicking */}
            {isPanicking && (
              <>
                <motion.div
                  className="absolute -left-2 top-6 text-[10px]"
                  animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  💧
                </motion.div>
                <motion.div
                  className="absolute -right-2 top-8 text-[10px]"
                  animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: 0.25 }}
                >
                  💧
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
