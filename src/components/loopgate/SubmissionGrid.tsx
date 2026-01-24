import { useState, useCallback } from "react";
import { Play, Star, ExternalLink, Trophy, Clock, CheckCircle, RefreshCw, ArrowRight } from "lucide-react";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";

// Extract thumbnail from platform URL
function getThumbnailUrl(url: string, platform: string): string | null {
  try {
    if (platform === 'youtube') {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      if (match) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

// Platform gradient colors
const platformColors: Record<string, string> = {
  tiktok: "from-pink-500 to-cyan-400",
  instagram: "from-purple-500 via-pink-500 to-orange-400",
  youtube: "from-red-600 to-red-400",
};

const PULL_THRESHOLD = 80;

interface SubmissionGridProps {
  userId?: string;
}

export default function SubmissionGrid({ userId }: SubmissionGridProps) {
  const { submissions, loading, refetch } = useUserSubmissions(userId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, PULL_THRESHOLD], [0, 1]);
  const scale = useTransform(y, [0, PULL_THRESHOLD], [0.5, 1]);
  const rotate = useTransform(y, [0, PULL_THRESHOLD], [0, 180]);

  const handlePanEnd = useCallback(async (event: any, info: PanInfo) => {
    if (info.offset.y > PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    y.set(0);
  }, [isRefreshing, refetch, y]);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (info.offset.y > 0 && !isRefreshing) {
      const distance = Math.min(info.offset.y, PULL_THRESHOLD * 1.5);
      setPullDistance(distance);
      y.set(distance);
    }
  }, [isRefreshing, y]);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[9/16] bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
          <Play className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No submissions yet</p>
        <p className="text-xs text-muted-foreground mb-4">
          Submit your first edit to see it here
        </p>
        <Link 
          to="/arena"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-black font-semibold rounded-lg text-sm hover:bg-gold/90 transition-colors"
        >
          Enter Arena
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Pull to Refresh Indicator */}
      <motion.div 
        style={{ opacity, scale }}
        className="flex items-center justify-center py-3"
      >
        <motion.div style={{ rotate }}>
          <RefreshCw className={`w-5 h-5 text-gold ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.div>
        <span className="ml-2 text-xs text-muted-foreground">
          {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </motion.div>

      {/* TikTok-style Grid with pull gesture */}
      <motion.div 
        className="grid grid-cols-3 gap-0.5"
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{ touchAction: 'pan-x' }}
      >
        {submissions.map((submission, index) => {
          const thumbnail = getThumbnailUrl(submission.submission_url, submission.platform);
          const gradient = platformColors[submission.platform] || "from-gray-600 to-gray-400";
          const isScored = submission.status === 'scored' && submission.qoi_score;
          
          return (
            <motion.button
              key={submission.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedSubmission(submission.id)}
              className="relative aspect-[9/16] overflow-hidden group"
            >
              {/* Background */}
              {thumbnail ? (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbnail})` }}
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
              
              {/* Platform icon */}
              <div className="absolute top-2 left-2">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                  <Play className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="absolute top-2 right-2">
                {isScored ? (
                  <div className="bg-gold/90 rounded px-1.5 py-0.5 flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 text-black fill-black" />
                    <span className="text-[11px] font-bold text-black">{submission.qoi_score?.toFixed(1)}</span>
                  </div>
                ) : (
                  <div className="bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span className="text-[10px] text-muted-foreground">Pending</span>
                  </div>
                )}
              </div>
              
              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                {/* Rank badge if available */}
                {submission.final_rank && (
                  <div className="flex items-center gap-1 mb-1">
                    <Trophy className="w-3 h-3 text-gold" />
                    <span className="text-xs font-bold text-gold">#{submission.final_rank}</span>
                  </div>
                )}
                <p className="text-[10px] text-white/80 truncate">
                  {submission.event?.title || 'Event'}
                </p>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedSubmission(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-surface-1 border border-border overflow-hidden"
            >
              {(() => {
                const submission = submissions.find(s => s.id === selectedSubmission);
                if (!submission) return null;
                
                const gradient = platformColors[submission.platform] || "from-gray-600 to-gray-400";
                const thumbnail = getThumbnailUrl(submission.submission_url, submission.platform);
                
                return (
                  <>
                    {/* Header with thumbnail/gradient */}
                    <div className="relative h-48">
                      {thumbnail ? (
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${thumbnail})` }}
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-black/50" />
                      
                      {/* Play button overlay */}
                      <a
                        href={submission.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                      </a>
                      
                      {/* Close button */}
                      <button
                        onClick={() => setSelectedSubmission(null)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
                      >
                        ×
                      </button>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 space-y-4">
                      {/* Event title */}
                      <div>
                        <Link 
                          to={`/event/${submission.event_id}`}
                          className="font-semibold text-sm hover:text-gold transition-colors"
                        >
                          {submission.event?.title || 'Unknown Event'}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wider rounded bg-gradient-to-r ${gradient} text-white`}>
                            {submission.platform}
                          </span>
                          {submission.status === 'scored' ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-500">
                              <CheckCircle size={10} />
                              Scored
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-yellow-500">
                              <Clock size={10} />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* QOI Scores */}
                      {submission.status === 'scored' && submission.qoi_score && (
                        <div className="grid grid-cols-4 gap-2 text-center p-3 bg-background">
                          <div>
                            <p className="text-lg font-bold">{submission.quality_score || '—'}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Quality</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{submission.originality_score || '—'}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Original</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{submission.impact_score || '—'}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Impact</p>
                          </div>
                          <div className="bg-gold/10 -my-1 py-1">
                            <p className="text-lg font-bold text-gold">{submission.qoi_score.toFixed(1)}</p>
                            <p className="text-[9px] text-gold uppercase tracking-wider">QOI</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Final Rank */}
                      {submission.final_rank && (
                        <div className="text-center p-3 bg-gold/10 border border-gold/30">
                          <p className="text-2xl font-bold text-gold">#{submission.final_rank}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Final Rank</p>
                        </div>
                      )}
                      
                      {/* View button */}
                      <a
                        href={submission.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3 bg-gold text-black text-center text-sm font-semibold uppercase tracking-wider hover:bg-gold/90 transition-colors"
                      >
                        View Submission →
                      </a>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
