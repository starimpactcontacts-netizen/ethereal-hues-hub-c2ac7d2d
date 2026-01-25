import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Play, Star, ChevronUp, ChevronDown, 
  X, Share2, Trophy, Loader2, User, Sparkles
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetchThumbnailsBatch } from "@/hooks/useThumbnail";

// Unified feed item type
type FeedItemType = 'arena' | 'review';

interface BaseFeedItem {
  id: string;
  type: FeedItemType;
  submission_url: string;
  platform: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

interface ArenaFeedItem extends BaseFeedItem {
  type: 'arena';
  qoi_score: number | null;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  event_id: string;
  event_title: string;
  final_rank: number | null;
}

interface ReviewFeedItem extends BaseFeedItem {
  type: 'review';
  total_score: number;
  emotion_score: number | null;
  creativity_score: number | null;
  sync_score: number | null;
  identity_score: number | null;
  execution_score: number | null;
  judge_comment: string | null;
  judge_username: string | null;
  judge_avatar_url: string | null;
}

type FeedItem = ArenaFeedItem | ReviewFeedItem;

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'S+', color: 'text-gold' };
  if (score >= 80) return { grade: 'S', color: 'text-gold' };
  if (score >= 70) return { grade: 'A', color: 'text-green-400' };
  if (score >= 60) return { grade: 'B', color: 'text-blue-400' };
  if (score >= 50) return { grade: 'C', color: 'text-orange-400' };
  return { grade: 'D', color: 'text-red-400' };
}

// Arena feed card
function ArenaFeedCard({ 
  item, 
  thumbnail,
  onOpen, 
  onProfile 
}: { 
  item: ArenaFeedItem; 
  thumbnail: string | null;
  onOpen: () => void;
  onProfile: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="absolute inset-0 cursor-pointer" onClick={onOpen}>
        {thumbnail ? (
          <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface via-black to-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
            <span className="text-white/80 text-xs font-medium">
              Watch on {platformLabels[item.platform] || item.platform}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Type badge */}
      <div className="absolute top-3 right-3 z-30">
        <div className="bg-gold/90 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          ARENA
        </div>
      </div>

      {/* Right side actions - lifted for navbar (56px) + safe area */}
      <div className="absolute right-3 bottom-[calc(4rem+env(safe-area-inset-bottom)+5rem)] flex flex-col items-center gap-4 z-20">
        <button onClick={(e) => { e.stopPropagation(); onProfile(); }} className="flex flex-col items-center gap-1">
          <Avatar className="w-11 h-11 border-2 border-white shadow-lg">
            <AvatarImage src={item.avatar_url || undefined} />
            <AvatarFallback className="bg-gold text-black font-bold">
              {item.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex flex-col items-center">
          <div className="w-11 h-11 rounded-full bg-gold flex items-center justify-center shadow-lg">
            <Star className="w-5 h-5 text-black" fill="currentColor" />
          </div>
          <span className="text-white text-xs font-bold mt-1 drop-shadow-lg">
            {Math.round(item.qoi_score || 0)}
          </span>
        </div>

        {item.final_rank && (
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5 text-gold" />
            </div>
            <span className="text-white text-xs font-bold mt-1 drop-shadow-lg">
              #{item.final_rank}
            </span>
          </div>
        )}

        <button onClick={(e) => { e.stopPropagation(); navigator.share?.({ url: item.submission_url }); }} className="flex flex-col items-center">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom info - lifted for navbar (56px) + safe area */}
      <div className="absolute left-0 right-16 p-4 z-10" style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
        <button onClick={onProfile} className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity">
          <span className="text-white font-bold text-base drop-shadow-lg">@{item.username}</span>
        </button>
        <p className="text-white/90 text-sm mb-3 drop-shadow-lg line-clamp-2">{item.event_title}</p>
        {item.quality_score !== null && (
          <div className="flex gap-2 text-xs">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-white/60">Q</span>
              <span className="text-white font-bold ml-1">{item.quality_score}</span>
            </div>
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-white/60">O</span>
              <span className="text-white font-bold ml-1">{item.originality_score}</span>
            </div>
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-white/60">I</span>
              <span className="text-white font-bold ml-1">{item.impact_score}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Review feed card
function ReviewFeedCard({ 
  item, 
  thumbnail,
  onOpen, 
  onProfile 
}: { 
  item: ReviewFeedItem; 
  thumbnail: string | null;
  onOpen: () => void;
  onProfile: () => void;
}) {
  const { grade, color } = getGrade(item.total_score);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="absolute inset-0 cursor-pointer" onClick={onOpen}>
        {thumbnail ? (
          <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface via-black to-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
            <span className="text-white/80 text-xs font-medium">
              Watch on {platformLabels[item.platform] || item.platform}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Type badge */}
      <div className="absolute top-3 right-3 z-30">
        <div className="bg-purple-500/90 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          REVIEW
        </div>
      </div>

      {/* Right side actions - lifted for navbar (56px) + safe area */}
      <div className="absolute right-3 bottom-[calc(4rem+env(safe-area-inset-bottom)+5rem)] flex flex-col items-center gap-4 z-20">
        <button onClick={(e) => { e.stopPropagation(); onProfile(); }} className="flex flex-col items-center gap-1">
          <Avatar className="w-11 h-11 border-2 border-white shadow-lg">
            <AvatarImage src={item.avatar_url || undefined} />
            <AvatarFallback className="bg-purple-500 text-white font-bold">
              {item.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* Grade */}
        <div className="flex flex-col items-center">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg">
            <span className={`font-display text-lg font-bold ${color}`}>{grade}</span>
          </div>
          <span className="text-white text-xs font-bold mt-1 drop-shadow-lg">
            {item.total_score}/100
          </span>
        </div>

        {/* Judge */}
        {item.judge_username && (
          <div className="flex flex-col items-center">
            <Avatar className="w-9 h-9 border border-gold">
              {item.judge_avatar_url ? (
                <AvatarImage src={item.judge_avatar_url} />
              ) : (
                <AvatarFallback className="bg-gold/20 text-gold text-xs">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-gold text-[10px] mt-1">Judge</span>
          </div>
        )}

        <button onClick={(e) => { e.stopPropagation(); navigator.share?.({ url: item.submission_url }); }} className="flex flex-col items-center">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom info - lifted for navbar (56px) + safe area */}
      <div className="absolute left-0 right-16 p-4 z-10" style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
        <button onClick={onProfile} className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity">
          <span className="text-white font-bold text-base drop-shadow-lg">@{item.username}</span>
        </button>
        
        {item.judge_comment && (
          <p className="text-white/90 text-sm mb-3 drop-shadow-lg line-clamp-2 italic">
            "{item.judge_comment}"
          </p>
        )}
        
        {/* Score pillars */}
        <div className="flex gap-1.5 text-xs flex-wrap">
          {item.emotion_score !== null && (
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 border border-white/10">
              <span className="text-white/60">E</span>
              <span className="text-white font-bold ml-0.5">{item.emotion_score}</span>
            </div>
          )}
          {item.creativity_score !== null && (
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 border border-white/10">
              <span className="text-white/60">C</span>
              <span className="text-white font-bold ml-0.5">{item.creativity_score}</span>
            </div>
          )}
          {item.sync_score !== null && (
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 border border-white/10">
              <span className="text-white/60">S</span>
              <span className="text-white font-bold ml-0.5">{item.sync_score}</span>
            </div>
          )}
          {item.identity_score !== null && (
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 border border-white/10">
              <span className="text-white/60">I</span>
              <span className="text-white font-bold ml-0.5">{item.identity_score}</span>
            </div>
          )}
          {item.execution_score !== null && (
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 border border-white/10">
              <span className="text-white/60">X</span>
              <span className="text-white font-bold ml-0.5">{item.execution_score}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const seenUrls = useRef(new Set<string>());
  const offsetRef = useRef({ arena: 0, review: 0 });

  const BATCH_SIZE = 20;

  // Fix mobile viewport height
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  const fetchFeed = useCallback(async (isLoadMore = false) => {
    if (isLoadMore && (loadingMore || !hasMore)) return;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      seenUrls.current.clear();
      offsetRef.current = { arena: 0, review: 0 };
    }

    try {
      const arenaOffset = offsetRef.current.arena;
      const reviewOffset = offsetRef.current.review;

      const [roundRes, eventRes, sanctionedRes, reviewRes] = await Promise.all([
        supabase
          .from('round_participations')
          .select('id, submission_url, platform, qoi_score, quality_score, originality_score, impact_score, user_id, event_id, created_at')
          .not('qoi_score', 'is', null)
          .not('submission_url', 'is', null)
          .order('created_at', { ascending: false })
          .range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase
          .from('event_participations')
          .select('id, submission_url, platform, qoi_score, quality_score, originality_score, impact_score, user_id, event_id, final_rank')
          .not('qoi_score', 'is', null)
          .not('submission_url', 'is', null)
          .order('qoi_score', { ascending: false })
          .range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase
          .from('sanctioned_tournament_participants')
          .select('id, submission_url, submission_platform, qoi_score, user_id, tournament_id, submitted_at, final_rank')
          .not('qoi_score', 'is', null)
          .not('submission_url', 'is', null)
          .order('submitted_at', { ascending: false })
          .range(arenaOffset, arenaOffset + BATCH_SIZE - 1),
        supabase
          .from('review_requests')
          .select('*')
          .eq('status', 'reviewed')
          .not('total_score', 'is', null)
          .order('reviewed_at', { ascending: false })
          .range(reviewOffset, reviewOffset + BATCH_SIZE - 1)
      ]);

      const roundData = roundRes.data || [];
      const eventData = eventRes.data || [];
      const sanctionedData = sanctionedRes.data || [];
      const reviewData = reviewRes.data || [];

      // Update offsets
      offsetRef.current.arena += Math.max(roundData.length, eventData.length, sanctionedData.length);
      offsetRef.current.review += reviewData.length;

      // Check if we have more data
      const fetchedCount = roundData.length + eventData.length + sanctionedData.length + reviewData.length;
      if (fetchedCount === 0) {
        setHasMore(false);
        if (isLoadMore) {
          setLoadingMore(false);
          return;
        }
      }

      const arenaUserIds = [...roundData.map(s => s.user_id), ...eventData.map(s => s.user_id), ...sanctionedData.map(s => s.user_id)];
      const reviewUserIds = reviewData.map(r => r.user_id);
      const userIds = [...new Set([...arenaUserIds, ...reviewUserIds])];
      const eventIds = [...new Set([...roundData.map(s => s.event_id), ...eventData.map(s => s.event_id)])];
      const tournamentIds = [...new Set(sanctionedData.map(s => s.tournament_id))];

      const [profilesRes, eventsRes, tournamentsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', userIds.length > 0 ? userIds : ['']),
        supabase.from('events').select('id, title').in('id', eventIds.length > 0 ? eventIds : ['']),
        supabase.from('sanctioned_tournaments').select('id, name').in('id', tournamentIds.length > 0 ? tournamentIds : [''])
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const eventMap = new Map(eventsRes.data?.map(e => [e.id, e]) || []);
      const tournamentMap = new Map(tournamentsRes.data?.map(t => [t.id, { id: t.id, title: t.name }]) || []);

      const roundItems: ArenaFeedItem[] = roundData.map(s => ({
        id: `arena-${s.id}`,
        type: 'arena' as const,
        submission_url: s.submission_url!,
        platform: s.platform || 'tiktok',
        user_id: s.user_id,
        username: profileMap.get(s.user_id)?.username || 'editor',
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
        created_at: s.created_at || new Date().toISOString(),
        qoi_score: s.qoi_score,
        quality_score: s.quality_score || null,
        originality_score: s.originality_score || null,
        impact_score: s.impact_score || null,
        event_id: s.event_id,
        event_title: eventMap.get(s.event_id)?.title || 'Event',
        final_rank: null,
      }));

      const eventItems: ArenaFeedItem[] = eventData.map(s => ({
        id: `arena-event-${s.id}`,
        type: 'arena' as const,
        submission_url: s.submission_url!,
        platform: s.platform || 'tiktok',
        user_id: s.user_id,
        username: profileMap.get(s.user_id)?.username || 'editor',
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
        created_at: new Date().toISOString(),
        qoi_score: s.qoi_score,
        quality_score: s.quality_score || null,
        originality_score: s.originality_score || null,
        impact_score: s.impact_score || null,
        event_id: s.event_id,
        event_title: eventMap.get(s.event_id)?.title || 'Event',
        final_rank: s.final_rank || null,
      }));

      const sanctionedItems: ArenaFeedItem[] = sanctionedData.map(s => ({
        id: `arena-sanctioned-${s.id}`,
        type: 'arena' as const,
        submission_url: s.submission_url!,
        platform: s.submission_platform || 'tiktok',
        user_id: s.user_id,
        username: profileMap.get(s.user_id)?.username || 'editor',
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
        created_at: s.submitted_at || new Date().toISOString(),
        qoi_score: s.qoi_score,
        quality_score: null,
        originality_score: null,
        impact_score: null,
        event_id: s.tournament_id,
        event_title: tournamentMap.get(s.tournament_id)?.title || 'Sanctioned Tournament',
        final_rank: s.final_rank || null,
      }));

      const arenaItems = [...roundItems, ...eventItems, ...sanctionedItems];

      const reviewItems: ReviewFeedItem[] = reviewData.map(r => ({
        id: `review-${r.id}`,
        type: 'review' as const,
        submission_url: r.submission_url,
        platform: r.platform || 'tiktok',
        user_id: r.user_id,
        username: r.username || 'editor',
        avatar_url: r.avatar_url,
        created_at: r.reviewed_at || r.requested_at,
        total_score: r.total_score || 0,
        emotion_score: r.emotion_score,
        creativity_score: r.creativity_score,
        sync_score: r.sync_score,
        identity_score: r.identity_score,
        execution_score: r.execution_score,
        judge_comment: r.judge_comment,
        judge_username: r.judge_username,
        judge_avatar_url: r.judge_avatar_url,
      }));

      const allItems = [...arenaItems, ...reviewItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const newItems = allItems.filter(item => {
        if (seenUrls.current.has(item.submission_url)) return false;
        seenUrls.current.add(item.submission_url);
        return true;
      });

      if (isLoadMore) {
        setFeedItems(prev => [...prev, ...newItems]);
      } else {
        setFeedItems(newItems);
      }

      // Batch fetch thumbnails for new items
      if (newItems.length > 0) {
        const submissions = newItems.map(item => ({
          submission_url: item.submission_url,
          platform: item.platform
        }));
        fetchThumbnailsBatch(submissions).then(thumbs => {
          setThumbnails(prev => ({ ...prev, ...thumbs }));
        });
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  useEffect(() => {
    fetchFeed(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      if (e.key === 'ArrowDown' || e.key === 'j') goNext();
      else if (e.key === 'ArrowUp' || e.key === 'k') goPrev();
      else if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, feedItems.length, isTransitioning]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 50) {
      deltaY > 0 ? goNext() : goPrev();
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (isTransitioning) return;
    if (Math.abs(e.deltaY) > 30) {
      e.deltaY > 0 ? goNext() : goPrev();
    }
  }, [isTransitioning, currentIndex, feedItems.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const goNext = () => {
    if (currentIndex < feedItems.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 400);
      
      // Load more when approaching end
      if (currentIndex >= feedItems.length - 5 && hasMore && !loadingMore) {
        fetchFeed(true);
      }
    }
  };

  const goPrev = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  };

  const openSubmission = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentItem = feedItems[currentIndex];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading loop...</p>
        </div>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6">
        <Play className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">No Content Yet</h2>
        <p className="text-muted-foreground text-center mb-6">
          Once submissions are judged or reviews are completed, they'll appear here.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 overflow-hidden touch-none"
      style={{ 
        width: '100vw', 
        height: 'calc(var(--vh, 1vh) * 100)',
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button - larger tap target */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-50 w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors flex items-center justify-center active:scale-95"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
          <Loader2 className="w-3 h-3 text-white animate-spin" />
          <span className="text-white text-xs font-medium">Loading more...</span>
        </div>
      )}

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0"
        >
          {currentItem.type === 'arena' ? (
            <ArenaFeedCard 
              item={currentItem}
              thumbnail={thumbnails[currentItem.submission_url] || null}
              onOpen={() => openSubmission(currentItem.submission_url)}
              onProfile={() => navigate(`/editor/${currentItem.user_id}`)}
            />
          ) : (
            <ReviewFeedCard 
              item={currentItem}
              thumbnail={thumbnails[currentItem.submission_url] || null}
              onOpen={() => openSubmission(currentItem.submission_url)}
              onProfile={() => navigate(`/editor/${currentItem.user_id}`)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation hints */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex flex-col items-center gap-1 z-30 pointer-events-none">
        {currentIndex > 0 && <ChevronUp className="w-5 h-5 text-white/40" />}
        {currentIndex < feedItems.length - 1 && <ChevronDown className="w-5 h-5 text-white/40 animate-bounce" />}
      </div>
    </div>
  );
}
