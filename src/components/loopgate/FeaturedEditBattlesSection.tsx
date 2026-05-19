import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useFeaturedBattles } from '@/hooks/useFeaturedBattles';
import { QuickFightCarouselCard } from '@/components/loopgate/CashBattlesSection';

export default function FeaturedEditBattlesSection() {
  const { featuredBattles, loading } = useFeaturedBattles(6);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [featuredBattles.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  if (loading || featuredBattles.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="px-4 mt-8"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-3 max-w-[340px] mx-auto">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#FF3B3B]" strokeWidth={2.5} />
          <h2
            className="font-display text-white uppercase leading-none"
            style={{
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '0',
            }}
          >
            Featured Edit Battles
          </h2>
        </div>
        <Link
          to="/arena"
          className="flex items-center gap-0.5 font-display text-[14px] uppercase tracking-normal text-muted-foreground hover:text-white transition-colors"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Horizontal carousel — single card, Rankings-tile width */}
      <div className="relative max-w-[340px] mx-auto">
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {featuredBattles.map((fight) => (
            <div
              key={fight.id}
              className="snap-center shrink-0 w-full aspect-[4/3] relative"
            >
              <QuickFightCarouselCard fight={fight} isMine={false} />
              {/* Prize badge — featured battles award $150 to the winner */}
              <div
                className="absolute top-2 right-2 z-20 pointer-events-none flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/95 border border-emerald-300/60 shadow-[0_4px_12px_rgba(16,185,129,0.45)]"
              >
                <span
                  className="font-display text-black uppercase leading-none"
                  style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0' }}
                >
                  $150 Prize
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Side indicators */}
        {canLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-95 transition"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
        {canRight && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-95 transition animate-pulse"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </motion.section>
  );
}