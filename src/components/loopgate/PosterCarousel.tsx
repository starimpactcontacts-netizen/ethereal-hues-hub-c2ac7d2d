import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PosterCarouselProps {
  posterUrls: string[];
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
}

export default function PosterCarousel({
  posterUrls,
  className,
  autoPlay = true,
  autoPlayInterval = 4000,
  showIndicators = true,
  showArrows = true
}: PosterCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const validUrls = posterUrls.filter(url => url && url.trim() !== '');

  const goToNext = useCallback(() => {
    if (validUrls.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % validUrls.length);
  }, [validUrls.length]);

  const goToPrev = useCallback(() => {
    if (validUrls.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + validUrls.length) % validUrls.length);
  }, [validUrls.length]);

  useEffect(() => {
    if (!autoPlay || isPaused || validUrls.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, isPaused, autoPlayInterval, goToNext, validUrls.length]);

  if (validUrls.length === 0) {
    return null;
  }

  if (validUrls.length === 1) {
    return (
      <img 
        src={validUrls[0]} 
        alt="" 
        className={cn("w-full h-full object-cover", className)} 
      />
    );
  }

  return (
    <div 
      className={cn("relative w-full h-full", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={validUrls[currentIndex]}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {showIndicators && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {validUrls.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                idx === currentIndex 
                  ? "bg-white w-4" 
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}