import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Zap, Flame, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveSession } from "@/hooks/useRealData";
import { useMixedFeed } from "@/hooks/useMixedFeed";
import FeedItemRenderer from "@/components/loopgate/feed/FeedItemRenderer";
import SEO, { pageSEO } from "@/components/SEO";

export default function RankingsPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep session active
  useActiveSession();

  // Mixed feed data
  const { items, loading, refetch } = useMixedFeed(40);

  // Pull to refresh on mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isPulling && e.changedTouches[0].clientY - startY > 80) {
        refetch();
      }
      isPulling = false;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [refetch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen pb-24 bg-background overflow-y-auto"
    >
      <SEO {...pageSEO.rankings} />
      
      {/* Compact Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Flame className="w-5 h-5 text-gold" />
              <div className="absolute inset-0 w-5 h-5 text-gold animate-ping opacity-30">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <h1 className="font-display text-xl tracking-wide">FEED</h1>
          </div>

          {/* Live indicator + refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Live</span>
            </div>
            <button 
              onClick={() => refetch()}
              className="p-2 hover:bg-surface-1 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Feed content */}
      {items.length === 0 ? (
        <EmptyFeed />
      ) : (
        <div className="divide-y divide-border/30">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <FeedItemRenderer item={item} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* End of feed */}
      {items.length > 0 && (
        <div className="py-12 text-center">
          <Sparkles className="w-6 h-6 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">You're all caught up</p>
        </div>
      )}
    </div>
  );
}

// Empty state
function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="font-display text-xl mb-2">No Activity Yet</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        When editors submit, judges review, and arenas go live — you'll see it all here.
      </p>
    </div>
  );
}
