import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Play, ExternalLink, ChevronLeft, ChevronRight, Trophy, Zap, Clock } from "lucide-react";
import { useRecentSubmissions, RecentSubmission, getVideoThumbnail } from "@/hooks/useRecentSubmissions";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityFeedProps {
  limit?: number;
  compact?: boolean;
}

// Platform icons as simple text badges
const platformColors: Record<string, string> = {
  tiktok: 'bg-black border-white/20 text-white',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white',
  youtube: 'bg-red-600 border-transparent text-white',
};

// Visual edit card - the star of the show
function EditCard({ submission, index }: { submission: RecentSubmission; index: number }) {
  const hasScore = submission.qoi_score !== null;
  const isAdvanced = submission.status === 'advanced';
  const isTrending = hasScore && (submission.qoi_score || 0) >= 80;
  const thumbnail = getVideoThumbnail(submission.submission_url, submission.platform);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="snap-start shrink-0"
    >
      <Link 
        to={`/editor/${submission.user_id}`}
        className={`block w-[140px] group relative ${
          isTrending ? 'ring-1 ring-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : ''
        }`}
      >
        {/* Thumbnail / Visual */}
        <div className="aspect-[9/16] relative bg-surface-1 border border-border group-hover:border-gold/40 transition-all overflow-hidden">
          {/* Background - thumbnail or gradient */}
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-surface-1 via-black to-surface-1" />
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          
          {/* Play indicator */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-gold/90 flex items-center justify-center">
              <Play size={16} className="text-black ml-0.5" fill="currentColor" />
            </div>
          </div>
          
          {/* Top badges */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
            {/* Platform badge */}
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 border ${platformColors[submission.platform] || platformColors.tiktok}`}>
              {submission.platform.slice(0, 2)}
            </span>
            
            {/* Score badge if judged */}
            {hasScore && (
              <div className="flex items-center gap-0.5 bg-black/80 border border-gold/50 px-1.5 py-0.5">
                <Trophy size={8} className="text-gold" />
                <span className="text-[10px] font-bold text-gold">{Math.round(submission.qoi_score!)}</span>
              </div>
            )}
          </div>
          
          {/* Round indicator */}
          {submission.round_number && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2">
              <span className="text-[8px] font-bold text-muted-foreground bg-black/60 px-1.5 py-0.5">
                R{submission.round_number}
              </span>
            </div>
          )}
          
          {/* Advanced badge */}
          {isAdvanced && (
            <div className="absolute top-8 right-2">
              <span className="text-[8px] font-bold text-green-400 bg-green-500/20 border border-green-500/30 px-1.5 py-0.5 flex items-center gap-0.5">
                <Zap size={6} /> ADV
              </span>
            </div>
          )}
          
          {/* Trending glow effect */}
          {isTrending && (
            <div className="absolute inset-0 border border-gold/30 animate-pulse pointer-events-none" />
          )}
          
          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            {/* Avatar + Name */}
            <div className="flex items-center gap-1.5 mb-1">
              {submission.avatar_url ? (
                <img 
                  src={submission.avatar_url} 
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
                  <span className="text-[8px] font-bold text-gold">
                    {(submission.display_name || submission.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-[10px] font-semibold text-white truncate flex-1">
                {submission.display_name || submission.username}
              </span>
            </div>
            
            {/* Index score */}
            {submission.global_index_score > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[8px] text-gold font-bold">
                  {submission.global_index_score.toFixed(0)} IDX
                </span>
              </div>
            )}
            
            {/* Time */}
            <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
              <Clock size={8} />
              <span>{formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: false })}</span>
            </div>
          </div>
        </div>
        
        {/* Event name below card */}
        <div className="mt-1.5 px-0.5">
          <p className="text-[9px] text-muted-foreground truncate">{submission.event_title}</p>
        </div>
      </Link>
    </motion.div>
  );
}

// Compact text row for archive log
function CompactLogRow({ submission }: { submission: RecentSubmission }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-[10px] text-muted-foreground border-b border-border/30 last:border-0">
      <span className="text-foreground font-medium">{submission.display_name || submission.username}</span>
      <span>submitted to</span>
      <span className="text-gold">{submission.event_title}</span>
      {submission.qoi_score !== null && (
        <span className="text-gold font-bold ml-auto">{Math.round(submission.qoi_score)}</span>
      )}
      <span className="text-muted-foreground/60">
        {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: false })}
      </span>
    </div>
  );
}

export default function ActivityFeed({ limit = 10, compact = false }: ActivityFeedProps) {
  const { submissions, loading } = useRecentSubmissions(limit);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        ref.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [submissions]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 156; // 140px card + 16px gap
      const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-6 h-6 text-gold animate-pulse" />
        </div>
        <p className="font-display text-lg text-foreground mb-1">ARENA WARMING UP</p>
        <p className="text-xs text-muted-foreground">
          Be the first to submit an edit
        </p>
      </div>
    );
  }

  // Compact mode - minimal text log
  if (compact) {
    return (
      <div className="px-1">
        {submissions.slice(0, 5).map((submission) => (
          <CompactLogRow key={submission.id} submission={submission} />
        ))}
      </div>
    );
  }

  // Full mode - cinematic visual carousel
  return (
    <div className="relative">
      {/* Navigation Arrows */}
      {submissions.length > 2 && (
        <>
          <AnimatePresence>
            {canScrollLeft && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => scroll('left')}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/90 border border-gold/30 flex items-center justify-center hover:bg-gold/10 hover:border-gold/50 transition-all"
              >
                <ChevronLeft size={14} className="text-gold" />
              </motion.button>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {canScrollRight && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => scroll('right')}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/90 border border-gold/30 flex items-center justify-center hover:bg-gold/10 hover:border-gold/50 transition-all"
              >
                <ChevronRight size={14} className="text-gold" />
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Visual Carousel */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {submissions.map((submission, index) => (
          <EditCard key={submission.id} submission={submission} index={index} />
        ))}
      </div>

      {/* Minimal Archive Log Below */}
      {submissions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/30">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mb-2">Recent Activity</p>
          <div className="max-h-[80px] overflow-y-auto scrollbar-hide">
            {submissions.slice(0, 4).map((submission) => (
              <CompactLogRow key={`log-${submission.id}`} submission={submission} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
