import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, Activity, ExternalLink, ChevronLeft, ChevronRight, Trophy, Zap } from "lucide-react";
import { useRecentSubmissions, RecentSubmission } from "@/hooks/useRecentSubmissions";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityFeedProps {
  limit?: number;
  compact?: boolean;
}

function SubmissionCard({ submission }: { submission: RecentSubmission }) {
  const hasScore = submission.qoi_score !== null;
  const isAdvanced = submission.status === 'advanced';
  
  return (
    <Link 
      to={`/event/${submission.event_id}`}
      className="block min-w-[280px] max-w-[280px] bg-surface-1 border border-border hover:border-gold/30 transition-colors"
    >
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          {submission.avatar_url ? (
            <img 
              src={submission.avatar_url} 
              alt={submission.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
              <span className="font-display text-xs text-gold">
                {submission.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{submission.username}</p>
            <p className="text-[10px] text-muted-foreground truncate">{submission.event_title}</p>
          </div>
          {hasScore && (
            <div className="flex items-center gap-1 bg-gold/10 px-2 py-1 rounded-sm">
              <Trophy size={10} className="text-gold" />
              <span className="text-xs font-bold text-gold">{submission.qoi_score}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center">
            <Send size={10} className="text-gold" />
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {submission.platform}
          </span>
          {isAdvanced && (
            <span className="text-[9px] text-green-400 uppercase tracking-wider flex items-center gap-1">
              <Zap size={8} /> Advanced
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
          </span>
          <span className="text-[10px] text-gold flex items-center gap-1">
            View <ExternalLink size={8} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CompactSubmissionRow({ submission }: { submission: RecentSubmission }) {
  const hasScore = submission.qoi_score !== null;
  
  return (
    <Link 
      to={`/event/${submission.event_id}`}
      className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 hover:bg-white/[0.02] transition-colors"
    >
      {submission.avatar_url ? (
        <img 
          src={submission.avatar_url} 
          alt={submission.username}
          className="w-7 h-7 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
          <span className="font-display text-[10px] text-gold">
            {submission.username.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate">
          <span className="font-medium">{submission.username}</span>
          <span className="text-muted-foreground"> submitted to </span>
          <span className="text-gold">{submission.event_title}</span>
        </p>
      </div>
      {hasScore && (
        <span className="text-xs font-bold text-gold shrink-0">{submission.qoi_score}</span>
      )}
      <span className="text-[10px] text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: false })}
      </span>
    </Link>
  );
}

export default function ActivityFeed({ limit = 10, compact = false }: ActivityFeedProps) {
  const { submissions, loading } = useRecentSubmissions(limit);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', updateScrollButtons);
      return () => ref.removeEventListener('scroll', updateScrollButtons);
    }
  }, [submissions]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 296; // 280px card + 16px gap
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
          <Activity className="w-5 h-5 text-gold animate-pulse" />
        </div>
        <p className="text-sm font-medium text-foreground">Arena warming up</p>
        <p className="text-xs text-muted-foreground mt-1">
          Be the first to submit an edit
        </p>
      </div>
    );
  }

  // Compact mode - show as list
  if (compact) {
    return (
      <div className="bg-surface-1 border border-border p-3">
        {submissions.slice(0, limit).map((submission) => (
          <CompactSubmissionRow key={submission.id} submission={submission} />
        ))}
      </div>
    );
  }

  // Full mode - horizontal carousel
  return (
    <div className="relative">
      {/* Carousel Navigation */}
      {submissions.length > 1 && (
        <>
          <AnimatePresence>
            {canScrollLeft && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/90 border border-border flex items-center justify-center hover:bg-surface-1 transition-colors"
              >
                <ChevronLeft size={16} />
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
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/90 border border-border flex items-center justify-center hover:bg-surface-1 transition-colors"
              >
                <ChevronRight size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Carousel Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {submissions.map((submission, index) => (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="snap-start"
          >
            <SubmissionCard submission={submission} />
          </motion.div>
        ))}
      </div>

      {/* Progress Dots */}
      {submissions.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {submissions.slice(0, Math.min(submissions.length, 6)).map((_, index) => (
            <div 
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === 0 ? 'bg-gold' : 'bg-border'
              }`}
            />
          ))}
          {submissions.length > 6 && (
            <span className="text-[8px] text-muted-foreground ml-1">+{submissions.length - 6}</span>
          )}
        </div>
      )}
    </div>
  );
}
