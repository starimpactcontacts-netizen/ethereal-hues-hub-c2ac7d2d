import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ChevronLeft, ChevronRight, Star, ExternalLink, X, Play, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useThumbnail } from '@/hooks/useThumbnail';
import { formatDistanceToNow } from 'date-fns';
import loopgateLogo from '@/assets/loopgate-logo.png';

// Branded gradient backgrounds for when thumbnails can't load
const CARD_GRADIENTS = [
  'from-purple-900/80 via-black to-indigo-900/60',
  'from-emerald-900/70 via-black to-teal-900/50',
  'from-amber-900/70 via-black to-orange-900/50',
  'from-red-900/60 via-black to-rose-900/50',
  'from-blue-900/70 via-black to-cyan-900/50',
  'from-fuchsia-900/60 via-black to-pink-900/50',
  'from-violet-900/70 via-black to-purple-900/50',
  'from-sky-900/60 via-black to-blue-900/50',
];

interface ReviewItem {
  id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
  total_score: number | null;
  judge_username: string | null;
  judge_avatar_url: string | null;
  judge_comment: string | null;
  reviewed_at: string | null;
  rating_mode: string | null;
  selected_tier: string | null;
}

// Thresholds: S+/S++ (90+), S (80-89), A (70-79), B (60-69), C (50-59), D (30-49), F (0-29)
function getDisplayGrade(review: ReviewItem): string {
  // If judge used tier_only mode and selected a tier, use that directly
  if (review.rating_mode === 'tier_only' && review.selected_tier) {
    return review.selected_tier;
  }
  
  // Otherwise calculate from score using GQT thresholds
  const score = review.total_score || 0;
  if (score >= 90) return 'S';
  if (score >= 80) return 'S';
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'S';
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-gold';
  if (score >= 80) return 'text-amber-400';
  if (score >= 70) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 50) return 'text-slate-300';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-500';
}

function getScoreBg(score: number): string {
  if (score >= 90) return 'bg-gold/20 border-gold/50';
  if (score >= 80) return 'bg-amber-400/20 border-amber-400/50';
  if (score >= 70) return 'bg-emerald-400/20 border-emerald-400/50';
  if (score >= 60) return 'bg-blue-400/20 border-blue-400/50';
  if (score >= 50) return 'bg-slate-300/20 border-slate-300/50';
  if (score >= 40) return 'bg-orange-400/20 border-orange-400/50';
  return 'bg-red-500/20 border-red-500/50';
}

function ReviewCard({ review, onSelect }: { review: ReviewItem; onSelect: (review: ReviewItem) => void }) {
  const { thumbnail, loading } = useThumbnail(review.submission_url, review.platform);
  const scoreClass = getDisplayGrade(review);
  const scoreForColor = review.rating_mode === 'tier_only' && review.selected_tier
    ? { 'S': 95, 'A': 85, 'B': 75, 'C': 65, 'D': 55, 'F': 25 }[review.selected_tier] || 0
    : review.total_score || 0;
  
  return (
    <motion.button
      onClick={() => onSelect(review)}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0 w-[120px] text-left group"
    >
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black ring-1 ring-border group-hover:ring-gold/60 transition-all shadow-lg group-hover:shadow-gold/20">
        {/* Thumbnail or Branded Fallback */}
        {loading ? (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-background animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <img src={loopgateLogo} alt="" className="w-8 h-8 opacity-20" />
            </div>
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt="Edit thumbnail"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-bg')?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* Branded fallback — always rendered behind, visible when no thumbnail */}
        <div className={`absolute inset-0 bg-gradient-to-br ${CARD_GRADIENTS[Math.abs(review.id.charCodeAt(0)) % CARD_GRADIENTS.length]} ${thumbnail && !loading ? 'hidden' : ''} fallback-bg`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <img src={loopgateLogo} alt="" className="w-10 h-10 opacity-40 drop-shadow-lg" />
            <div className="w-8 h-[1px] bg-white/10" />
          </div>
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
            backgroundSize: '12px 12px'
          }} />
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        
        {/* Play indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play size={16} className="text-white ml-0.5" fill="white" />
          </div>
        </div>
        
        {/* Score badge - top right */}
        {scoreClass && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-md border backdrop-blur-sm ${getScoreBg(scoreForColor)}`}>
            <span className={`text-sm font-bold ${getScoreColor(scoreForColor)}`}>{scoreClass}</span>
          </div>
        )}
        
        {/* Judge avatar - top left */}
        {review.judge_avatar_url && (
          <div className="absolute top-2 left-2">
            <img
              src={review.judge_avatar_url}
              alt={review.judge_username || 'Judge'}
              className="w-6 h-6 rounded-full border-2 border-gold/60 object-cover"
            />
          </div>
        )}
        
        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            {review.avatar_url ? (
              <img
                src={review.avatar_url}
                alt={review.username}
                className="w-4 h-4 rounded-full object-cover ring-1 ring-white/30"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-gold/40 flex items-center justify-center">
                <span className="text-[8px] font-bold text-gold">
                  {review.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-[10px] font-medium truncate text-white/90">
              @{review.username}
            </span>
          </div>
          
          {/* Score number */}
          {(review.total_score || review.selected_tier) && (
            <div className="flex items-center gap-1">
              <Star size={10} className="text-gold fill-gold" />
              <span className={`text-xs font-bold ${getScoreColor(scoreForColor)}`}>
                {review.rating_mode === 'tier_only' && review.selected_tier
                  ? `${review.selected_tier} Class`
                  : `${review.total_score}/100`
                }
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Time ago */}
      <p className="text-[10px] text-muted-foreground text-center mt-1.5 truncate">
        {review.reviewed_at ? formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true }) : 'Recently'}
      </p>
    </motion.button>
  );
}

function ReviewPreviewModal({ review, onClose }: { review: ReviewItem; onClose: () => void }) {
  const { thumbnail } = useThumbnail(review.submission_url, review.platform);
  const scoreClass = getDisplayGrade(review);
  const scoreForColor = review.rating_mode === 'tier_only' && review.selected_tier
    ? { 'S': 95, 'A': 85, 'B': 75, 'C': 65, 'D': 55, 'F': 25 }[review.selected_tier] || 0
    : review.total_score || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-black rounded-2xl overflow-hidden ring-1 ring-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            {review.judge_avatar_url ? (
              <img src={review.judge_avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gold/50" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <Star size={14} className="text-gold" />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Reviewed by</p>
              <p className="text-sm font-medium">@{review.judge_username || 'QOI Judge'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-1 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        {/* Thumbnail */}
        <div className="relative aspect-video bg-surface-1">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${CARD_GRADIENTS[Math.abs(review.id.charCodeAt(0)) % CARD_GRADIENTS.length]} flex items-center justify-center`}>
              <img src={loopgateLogo} alt="" className="w-16 h-16 opacity-30 drop-shadow-lg" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Score overlay */}
          {scoreClass && (
            <div className="absolute bottom-3 right-3">
              <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-sm ${getScoreBg(scoreForColor)}`}>
                <span className={`text-2xl font-bold ${getScoreColor(scoreForColor)}`}>{scoreClass}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Editor info */}
          <div className="flex items-center gap-2 mb-3">
            {review.avatar_url ? (
              <img src={review.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="font-bold text-gold">{review.username.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="font-medium">@{review.username}</p>
              <p className="text-xs text-muted-foreground">
                {review.reviewed_at ? formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true }) : 'Recently'}
              </p>
            </div>
            {(review.total_score || review.selected_tier) && (
              <div className="ml-auto text-right">
                <p className={`text-xl font-bold ${getScoreColor(scoreForColor)}`}>
                  {review.rating_mode === 'tier_only' && review.selected_tier
                    ? review.selected_tier
                    : review.total_score
                  }
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">
                  {review.rating_mode === 'tier_only' ? 'Class' : '/100'}
                </p>
              </div>
            )}
          </div>
          
          {/* Comment */}
          {review.judge_comment && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">"{review.judge_comment}"</p>
          )}
          
          {/* CTA */}
          <a
            href={review.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-gold text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gold/90 transition-colors"
          >
            <ExternalLink size={14} />
            Watch Edit
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface JudgeReviewsFeedProps {
  embedded?: boolean;
}

export default function JudgeReviewsFeed({ embedded = false }: JudgeReviewsFeedProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
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
        .select('id, username, avatar_url, submission_url, platform, total_score, judge_username, judge_avatar_url, judge_comment, reviewed_at, rating_mode, selected_tier')
        .eq('status', 'reviewed')
        .or('total_score.not.is.null,selected_tier.not.is.null')
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
    <>
      <div className={embedded ? "" : "py-4"}>
        {/* Header - only show when not embedded */}
        {!embedded && (
          <div className="flex items-center justify-between mb-3 px-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="font-display text-sm tracking-wide">REVIEWS</h2>
            </div>
            <Link to="/judges" className="text-[10px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
              ALL JUDGES <ArrowRight size={10} />
            </Link>
          </div>
        )}

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
            className={`flex gap-3 overflow-x-auto scrollbar-hide ${embedded ? '' : 'px-4'}`}
            onScroll={updateScrollButtons}
          >
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <ReviewCard review={review} onSelect={setSelectedReview} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      <AnimatePresence>
        {selectedReview && (
          <ReviewPreviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
