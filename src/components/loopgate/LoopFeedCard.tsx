import { useNavigate } from "react-router-dom";
import { Play, Star, Trophy, MessageCircle, Share2, ExternalLink, Sparkles, ChevronDown, ChevronUp, Swords } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useThumbnail } from "@/hooks/useThumbnail";
import FeedInlineComments from "./FeedInlineComments";

export interface LoopFeedItem {
  id: string;
  rawId: string;
  type: 'arena' | 'review' | 'battle';
  submission_url: string;
  platform: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  thumbnail_url: string | null;
  custom_title: string | null;
  qoi_score?: number | null;
  quality_score?: number | null;
  originality_score?: number | null;
  impact_score?: number | null;
  event_title?: string;
  final_rank?: number | null;
  total_score?: number;
  judge_comment?: string | null;
  judge_username?: string | null;
  judge_avatar_url?: string | null;
  // Battle-specific
  battle_id?: string;
  opponent_username?: string | null;
  challenger_username?: string | null;
  challenger_score?: number | null;
  opponent_score?: number | null;
  winner_id?: string | null;
  battle_status?: string;
}

const platformLabels: Record<string, string> = {
  tiktok: "TT",
  instagram: "IG",
  youtube: "YT",
};

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'S+', color: 'text-gold' };
  if (score >= 80) return { grade: 'S', color: 'text-gold' };
  if (score >= 70) return { grade: 'A', color: 'text-green-400' };
  if (score >= 60) return { grade: 'B', color: 'text-blue-400' };
  if (score >= 50) return { grade: 'C', color: 'text-orange-400' };
  return { grade: 'D', color: 'text-red-400' };
}

interface LoopFeedCardProps {
  item: LoopFeedItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenPlayer: () => void;
}

export default function LoopFeedCard({ item, isExpanded, onToggleExpand, onOpenPlayer }: LoopFeedCardProps) {
  const navigate = useNavigate();
  // Self-heal: if feed didn't resolve a thumbnail, try per-card
  const { thumbnail: hookThumb } = useThumbnail(
    item.thumbnail_url ? '' : item.submission_url,
    item.platform
  );
  const resolvedThumb = item.thumbnail_url || hookThumb;

  const displayTitle = item.custom_title || item.event_title || 'Untitled Edit';
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.share?.({ url: item.submission_url, title: displayTitle });
  };

  const score = item.type === 'arena' ? item.qoi_score : item.total_score;
  const gradeInfo = score != null ? getGrade(score) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="border-b border-border/40 hover:bg-surface-1/20 transition-colors"
    >
      <div className="px-3 pt-2 pb-1">
        <div className="flex gap-2">
          {/* Avatar */}
          <button onClick={() => navigate(`/editor/${item.user_id}`)} className="shrink-0 mt-0.5">
            <Avatar className="w-7 h-7 border border-border/60">
              <AvatarImage src={item.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-foreground text-[9px] font-bold">
                {item.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Author line */}
            <div className="flex items-center gap-1 mb-px">
              <button
                onClick={() => navigate(`/editor/${item.user_id}`)}
                className="font-semibold text-foreground text-[12px] hover:underline truncate"
              >
                @{item.username}
              </button>
              <span className="text-muted-foreground text-[10px] shrink-0">· {timeAgo}</span>
              <div className="flex-1" />
              {item.type === 'arena' ? (
                <span className="bg-gold/15 text-gold text-[8px] font-bold px-1 py-px rounded flex items-center gap-0.5 shrink-0">
                  <Trophy className="w-2 h-2" />
                  ARENA
                </span>
              ) : item.type === 'battle' ? (
                <span className="bg-red-500/15 text-red-400 text-[8px] font-bold px-1 py-px rounded flex items-center gap-0.5 shrink-0">
                  <span className="font-display">⚔</span>
                  1v1
                </span>
              ) : (
                <span className="bg-purple-500/15 text-purple-400 text-[8px] font-bold px-1 py-px rounded flex items-center gap-0.5 shrink-0">
                  <Sparkles className="w-2 h-2" />
                  REVIEW
                </span>
              )}
            </div>

            {/* Title */}
            {item.type === 'battle' ? (
              <div className="mb-1">
                <p className="text-[12px] text-foreground/90 leading-tight line-clamp-1">
                  ⚔ <span className="font-semibold">{item.challenger_username}</span>
                  <span className="text-muted-foreground mx-1">vs</span>
                  <span className="font-semibold">{item.opponent_username || '???'}</span>
                </p>
                {item.battle_status === 'completed' && item.challenger_score != null && item.opponent_score != null && (
                  <p className="text-[10px] text-muted-foreground">
                    Score: <span className="text-foreground font-bold">{item.challenger_score}</span> - <span className="text-foreground font-bold">{item.opponent_score}</span>
                    {item.winner_id && (
                      <span className="text-gold ml-1">
                        🏆 {item.winner_id === item.user_id ? item.challenger_username : item.opponent_username}
                      </span>
                    )}
                  </p>
                )}
                {item.battle_status === 'active' && (
                  <p className="text-[10px] text-red-400 font-bold uppercase">🔴 Live Now</p>
                )}
                {item.battle_status === 'judging' && (
                  <p className="text-[10px] text-purple-400 font-bold uppercase">⏳ Judging</p>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-foreground/90 leading-tight mb-1 line-clamp-1">
                {displayTitle}
              </p>
            )}

            {/* Thumbnail — compact */}
            <button onClick={onOpenPlayer} className="relative w-full rounded-md overflow-hidden group mb-1 block">
              {resolvedThumb ? (
                <img
                  src={resolvedThumb}
                  alt={displayTitle}
                  className="w-full aspect-[16/9] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[16/9] bg-surface-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                </div>
              )}
              {/* Hover play */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
                </div>
              </div>

              {/* Score */}
              {gradeInfo && score != null && (
                <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm rounded px-1 py-px flex items-center gap-0.5">
                  {item.type === 'arena' ? (
                    <>
                      <Star className="w-2.5 h-2.5 text-gold" fill="currentColor" />
                      <span className="text-white font-bold text-[10px]">{Math.round(score)}</span>
                    </>
                  ) : (
                    <span className={`font-display text-xs font-bold ${gradeInfo.color}`}>
                      {gradeInfo.grade}
                    </span>
                  )}
                </div>
              )}

              {/* Rank */}
              {item.final_rank && (
                <div className="absolute bottom-1 left-1 bg-gold text-black rounded px-1 py-px flex items-center gap-0.5">
                  <Trophy className="w-2 h-2" />
                  <span className="font-bold text-[9px]">#{item.final_rank}</span>
                </div>
              )}

              {/* Platform */}
              <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-1 py-px rounded">
                {platformLabels[item.platform] || item.platform}
              </div>
            </button>

            {/* Score breakdown */}
            {item.type === 'arena' && item.quality_score != null && (
              <div className="flex gap-2 mb-0.5">
                {[
                  { label: 'Q', val: item.quality_score },
                  { label: 'O', val: item.originality_score },
                  { label: 'I', val: item.impact_score },
                ].map(({ label, val }) => (
                  <span key={label} className="text-[9px] text-muted-foreground">
                    {label} <span className="text-foreground font-medium">{val}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Judge quote */}
            {item.type === 'review' && item.judge_comment && (
              <p className="text-[11px] text-muted-foreground leading-snug mb-1 line-clamp-1 italic">
                "{item.judge_comment}"
                {item.judge_username && (
                  <span className="text-foreground font-medium not-italic ml-1">— @{item.judge_username}</span>
                )}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center -ml-1.5 gap-px">
              {item.type === 'battle' && item.battle_id && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/battle/${item.battle_id}`); }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-red-400 hover:bg-red-500/10 transition-colors text-[10px] font-semibold"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Watch</span>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-[10px]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-1.5 py-0.5 rounded-full text-muted-foreground hover:text-green-400 hover:bg-green-400/10 transition-colors text-[10px]"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <a
                href={item.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center px-1.5 py-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-[10px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/30 bg-surface-0/50"
          >
            <FeedInlineComments
              submissionId={item.rawId}
              submissionType={item.type}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}