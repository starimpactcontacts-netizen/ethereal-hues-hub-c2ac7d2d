import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, Star, Flame, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useThumbnail } from '@/hooks/useThumbnail';
import { formatDistanceToNow } from 'date-fns';

interface ReviewItem {
  id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
  total_score: number | null;
  judge_username: string | null;
  judge_avatar_url: string | null;
  reviewed_at: string | null;
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-gold';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 60) return 'text-purple-400';
  if (score >= 50) return 'text-orange-400';
  return 'text-red-400';
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const { thumbnail, loading } = useThumbnail(review.submission_url, review.platform);
  const scoreClass = review.total_score ? getScoreClass(review.total_score) : null;
  
  return (
    <Link
      to={`/editor/${review.username}`}
      className="flex-shrink-0 w-[140px] group"
    >
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="relative aspect-[9/16] rounded-xl overflow-hidden bg-surface-1 border border-border group-hover:border-gold/50 transition-colors"
      >
        {/* Thumbnail */}
        {loading ? (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-1 to-surface-2 animate-pulse" />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt="Edit thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-surface-1 to-purple-500/20" />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        
        {/* Score badge */}
        {scoreClass && review.total_score && (
          <div className="absolute top-2 right-2">
            <div className={`w-8 h-8 rounded-lg bg-black/80 backdrop-blur-sm border border-gold/30 flex items-center justify-center ${getScoreColor(review.total_score)}`}>
              <span className="text-sm font-bold">{scoreClass}</span>
            </div>
          </div>
        )}
        
        {/* Judge avatar */}
        {review.judge_avatar_url && (
          <div className="absolute top-2 left-2">
            <img
              src={review.judge_avatar_url}
              alt={review.judge_username || 'Judge'}
              className="w-6 h-6 rounded-full border border-gold/50 object-cover"
            />
          </div>
        )}
        
        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="flex items-center gap-1.5">
            {review.avatar_url ? (
              <img
                src={review.avatar_url}
                alt={review.username}
                className="w-5 h-5 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gold/30 flex items-center justify-center">
                <span className="text-[8px] font-bold text-gold">
                  {review.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-[10px] font-medium truncate text-white">
              @{review.username}
            </span>
          </div>
          
          {/* Score */}
          {review.total_score && (
            <div className="flex items-center gap-1 mt-1">
              <Star size={10} className="text-gold fill-gold" />
              <span className={`text-xs font-bold ${getScoreColor(review.total_score)}`}>
                {review.total_score}
              </span>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Time ago */}
      <p className="text-[10px] text-muted-foreground text-center mt-1.5 truncate">
        {review.reviewed_at ? formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true }) : 'Recently'}
      </p>
    </Link>
  );
}

export default function JudgeReviewsFeed() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetchReviews();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('judge_reviews_feed')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'review_requests',
          filter: 'status=eq.reviewed',
        },
        () => fetchReviews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchReviews() {
    try {
      const { data, error } = await supabase
        .from('review_requests')
        .select('*')
        .eq('status', 'reviewed')
        .not('total_score', 'is', null)
        .order('reviewed_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  function updateScrollButtons() {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }

  useEffect(() => {
    updateScrollButtons();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', updateScrollButtons);
      return () => ref.removeEventListener('scroll', updateScrollButtons);
    }
  }, [reviews]);

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <h2 className="font-display text-sm tracking-wide">LIVE REVIEWS</h2>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-[10px] text-red-400">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {reviews.length} recent
        </span>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-surface-1 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-surface-1 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4"
          onScroll={updateScrollButtons}
        >
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <ReviewCard review={review} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
