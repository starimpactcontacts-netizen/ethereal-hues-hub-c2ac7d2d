import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Play, Star, ChevronUp, ChevronDown, 
  X, Share2, Trophy, Loader2
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useThumbnail } from "@/hooks/useThumbnail";

interface Submission {
  id: string;
  submission_url: string;
  platform: string;
  qoi_score: number | null;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  user_id: string;
  event_id: string;
  username: string;
  avatar_url: string | null;
  event_title: string;
  final_rank: number | null;
}

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

// Full-screen feed card with thumbnail background
function FeedCard({ 
  submission, 
  onOpen, 
  onProfile 
}: { 
  submission: Submission; 
  onOpen: () => void;
  onProfile: () => void;
}) {
  const { thumbnail, loading: thumbLoading } = useThumbnail(submission.submission_url, submission.platform);
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Fullscreen thumbnail background */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onOpen}
      >
        {/* Thumbnail or loading state */}
        {thumbLoading ? (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : thumbnail ? (
          <img 
            src={thumbnail} 
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-800" />
        )}
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        
        {/* Center play indicator */}
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
              Watch on {platformLabels[submission.platform] || submission.platform}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
        {/* Profile */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onProfile();
          }}
          className="flex flex-col items-center gap-1"
        >
          <Avatar className="w-11 h-11 border-2 border-white shadow-lg">
            <AvatarImage src={submission.avatar_url || undefined} />
            <AvatarFallback className="bg-gold text-black font-bold">
              {submission.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* QOI Score */}
        <div className="flex flex-col items-center">
          <div className="w-11 h-11 rounded-full bg-gold flex items-center justify-center shadow-lg">
            <Star className="w-5 h-5 text-black" fill="currentColor" />
          </div>
          <span className="text-white text-xs font-bold mt-1 drop-shadow-lg">
            {Math.round(submission.qoi_score || 0)}
          </span>
        </div>

        {/* Rank if available */}
        {submission.final_rank && (
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5 text-gold" />
            </div>
            <span className="text-white text-xs font-bold mt-1 drop-shadow-lg">
              #{submission.final_rank}
            </span>
          </div>
        )}

        {/* Share */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            navigator.share?.({ url: submission.submission_url });
          }}
          className="flex flex-col items-center"
        >
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 z-10">
        {/* Username */}
        <button 
          onClick={onProfile}
          className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-white font-bold text-base drop-shadow-lg">@{submission.username}</span>
        </button>

        {/* Event */}
        <p className="text-white/90 text-sm mb-3 drop-shadow-lg line-clamp-2">
          {submission.event_title}
        </p>

        {/* Score breakdown */}
        {submission.quality_score !== null && (
          <div className="flex gap-2 text-xs">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-white/60">Q</span>
              <span className="text-white font-bold ml-1">{submission.quality_score}</span>
            </div>
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-white/60">O</span>
              <span className="text-white font-bold ml-1">{submission.originality_score}</span>
            </div>
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-white/60">I</span>
              <span className="text-white font-bold ml-1">{submission.impact_score}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch rated submissions
  useEffect(() => {
    async function fetchSubmissions() {
      try {
        // First get round_participations with scores
        const { data: roundData, error: roundError } = await supabase
          .from('round_participations')
          .select(`
            id,
            submission_url,
            platform,
            qoi_score,
            quality_score,
            originality_score,
            impact_score,
            user_id,
            event_id
          `)
          .not('qoi_score', 'is', null)
          .not('submission_url', 'is', null)
          .order('qoi_score', { ascending: false })
          .limit(50);

        if (roundError) {
          console.error('Error fetching round submissions:', roundError);
        }

        // Also get event_participations
        const { data: eventData, error: eventError } = await supabase
          .from('event_participations')
          .select(`
            id,
            submission_url,
            platform,
            qoi_score,
            quality_score,
            originality_score,
            impact_score,
            user_id,
            event_id,
            final_rank
          `)
          .not('qoi_score', 'is', null)
          .not('submission_url', 'is', null)
          .order('qoi_score', { ascending: false })
          .limit(50);

        if (eventError) {
          console.error('Error fetching event submissions:', eventError);
        }

        const allData = [...(roundData || []), ...(eventData || [])];

        if (allData.length === 0) {
          setLoading(false);
          return;
        }

        // Get unique user IDs and event IDs
        const userIds = [...new Set(allData.map(s => s.user_id))];
        const eventIds = [...new Set(allData.map(s => s.event_id))];

        // Fetch profiles and events in parallel
        const [profilesRes, eventsRes] = await Promise.all([
          supabase.from('profiles').select('id, username, avatar_url').in('id', userIds.length > 0 ? userIds : ['']),
          supabase.from('events').select('id, title').in('id', eventIds.length > 0 ? eventIds : [''])
        ]);

        const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
        const eventMap = new Map(eventsRes.data?.map(e => [e.id, e]) || []);

        const enriched: Submission[] = allData.map(s => ({
          id: s.id,
          submission_url: s.submission_url!,
          platform: s.platform || 'tiktok',
          qoi_score: s.qoi_score,
          quality_score: s.quality_score || null,
          originality_score: s.originality_score || null,
          impact_score: s.impact_score || null,
          user_id: s.user_id,
          event_id: s.event_id,
          username: profileMap.get(s.user_id)?.username || 'editor',
          avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
          event_title: eventMap.get(s.event_id)?.title || 'Event',
          final_rank: (s as any).final_rank || null,
        }));

        // Sort by QOI and dedupe by submission_url
        const seen = new Set<string>();
        const unique = enriched.filter(s => {
          if (seen.has(s.submission_url)) return false;
          seen.add(s.submission_url);
          return true;
        });

        setSubmissions(unique);
      } catch (error) {
        console.error('Error fetching feed submissions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goPrev();
      } else if (e.key === 'Escape') {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, submissions.length, isTransitioning]);

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  // Wheel scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isTransitioning) return;
    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  }, [isTransitioning, currentIndex, submissions.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const goNext = () => {
    if (currentIndex < submissions.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 400);
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

  const currentSubmission = submissions[currentIndex];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6">
        <Play className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">No Rated Edits Yet</h2>
        <p className="text-muted-foreground text-center mb-6">
          Once submissions are judged, they'll appear here for you to browse.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      style={{ 
        width: '100vw', 
        height: '100dvh',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50 p-1.5 sm:p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Progress indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
        <span className="text-white text-xs font-medium">
          {currentIndex + 1} / {submissions.length}
        </span>
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSubmission.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0"
        >
          <FeedCard 
            submission={currentSubmission}
            onOpen={() => openSubmission(currentSubmission.submission_url)}
            onProfile={() => navigate(`/editor/${currentSubmission.user_id}`)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation hints */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex flex-col items-center gap-1 z-30 pointer-events-none">
        {currentIndex > 0 && (
          <ChevronUp className="w-5 h-5 text-white/40" />
        )}
        {currentIndex < submissions.length - 1 && (
          <ChevronDown className="w-5 h-5 text-white/40 animate-bounce" />
        )}
      </div>
    </div>
  );
}
