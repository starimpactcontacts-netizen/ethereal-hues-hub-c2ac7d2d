import { useEffect, useRef, useCallback, type ReactNode, type RefObject } from 'react';

interface FeaturedCarouselProps {
  children: ReactNode;
  scrollRef: RefObject<HTMLDivElement>;
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
  autoScrollRef: RefObject<ReturnType<typeof setInterval> | null>;
  totalFeatured: number;
}

export default function FeaturedCarousel({
  children,
  scrollRef,
  activeIdx,
  setActiveIdx,
  autoScrollRef,
  totalFeatured,
}: FeaturedCarouselProps) {
  const userInteracting = useRef(false);
  const interactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Count visible cards from the scroll container
  const getCardCount = useCallback(() => {
    if (!scrollRef.current) return 0;
    return scrollRef.current.children.length;
  }, [scrollRef]);

  // Smooth scroll to a specific card index
  const scrollToCard = useCallback((idx: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.children;
    if (idx < 0 || idx >= cards.length) return;
    const card = cards[idx] as HTMLElement;
    const scrollLeft = card.offsetLeft - container.offsetLeft - 16; // account for px-4
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    setActiveIdx(idx);
  }, [scrollRef, setActiveIdx]);

  // Track scroll position to update active dot
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cards = container.children;
      if (!cards.length) return;
      const containerLeft = container.scrollLeft + 16;
      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        const dist = Math.abs(card.offsetLeft - container.offsetLeft - containerLeft);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
      setActiveIdx(closest);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollRef, setActiveIdx]);

  // Pause auto-scroll on user interaction
  const handleUserInteraction = useCallback(() => {
    userInteracting.current = true;
    if (interactionTimer.current) clearTimeout(interactionTimer.current);
    interactionTimer.current = setTimeout(() => {
      userInteracting.current = false;
    }, 8000); // Resume auto-scroll 8s after last touch/scroll
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('touchstart', handleUserInteraction, { passive: true });
    container.addEventListener('mousedown', handleUserInteraction, { passive: true });
    container.addEventListener('wheel', handleUserInteraction, { passive: true });
    return () => {
      container.removeEventListener('touchstart', handleUserInteraction);
      container.removeEventListener('mousedown', handleUserInteraction);
      container.removeEventListener('wheel', handleUserInteraction);
    };
  }, [scrollRef, handleUserInteraction]);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (totalFeatured <= 1) return;

    const interval = setInterval(() => {
      if (userInteracting.current) return;
      const count = getCardCount();
      if (count <= 1) return;
      const next = (activeIdx + 1) % count;
      scrollToCard(next);
    }, 5000);

    (autoScrollRef as any).current = interval;
    return () => clearInterval(interval);
  }, [totalFeatured, activeIdx, getCardCount, scrollToCard, autoScrollRef]);

  const cardCount = getCardCount() || totalFeatured;

  return (
    <div className="relative">
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="relative flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-3 scroll-smooth"
      >
        {children}
      </div>

      {/* Dot indicators */}
      {cardCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {Array.from({ length: Math.min(cardCount, 12) }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToCard(i)}
              className={`transition-all duration-300 rounded-full ${
                i === activeIdx
                  ? 'w-5 h-1.5 bg-gold'
                  : 'w-1.5 h-1.5 bg-foreground/20 hover:bg-foreground/40'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
