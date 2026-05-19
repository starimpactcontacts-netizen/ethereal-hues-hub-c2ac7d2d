import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, ChevronRight } from 'lucide-react';
import { useFeaturedBattles } from '@/hooks/useFeaturedBattles';
import { QuickFightCarouselCard } from '@/components/loopgate/CashBattlesSection';

export default function FeaturedEditBattlesSection() {
  const { featuredBattles, loading } = useFeaturedBattles(3);

  if (loading || featuredBattles.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="px-4 mt-8"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-3 max-w-[640px] mx-auto">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#FF3B3B]" strokeWidth={2.5} />
          <h2
            className="text-white uppercase leading-none"
            style={{
              fontFamily: 'Teko, "Bebas Neue", monospace',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              paddingLeft: '0.18em',
            }}
          >
            Featured Edit Battles
          </h2>
        </div>
        <Link
          to="/arena"
          className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-white transition-colors"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Cards grid (matches Arena card sizing) */}
      <div className="grid grid-cols-2 gap-3 max-w-[640px] mx-auto">
        {featuredBattles.slice(0, 2).map((fight) => (
          <div key={fight.id} className="aspect-[3/4]">
            <QuickFightCarouselCard fight={fight} isMine={false} />
          </div>
        ))}
      </div>
    </motion.section>
  );
}