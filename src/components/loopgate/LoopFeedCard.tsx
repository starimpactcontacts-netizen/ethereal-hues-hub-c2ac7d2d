import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Star, Trophy, MessageCircle, Share2, ExternalLink, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import FeedInlineComments from "./FeedInlineComments";

export interface LoopFeedItem {
  id: string;
  rawId: string;
  type: 'arena' | 'review';
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
  const displayTitle = item.custom_title || item.event_title || 'Untitled Edit';
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.share?.({ url: item.submission_url, title: displayTitle });
  };

  const score = item.type === 'arena' ? item.qoi_score : item.total_score;
  const gradeInfo = score != null ? getGrade(score) : null;

  return (
    <article className="border-b border-border/60 hover:bg-surface-1/30 transition-colors">
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="flex gap-2.5">
          {/* Avatar */}
          <button onClick={() => navigate(`/editor/${item.user_id}`)} className="shrink-0 mt-0.5">
            <Avatar className="w-8 h-8 border border-border">
              <AvatarImage src={item.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
                {item.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Author line */}
            <div className="flex items-center gap-1 mb-0.5">
              <button
                onClick={() => navigate(`/editor/${item.user_id}`)}
                className="font-semibold text-foreground text-[13px] hover:underline truncate"
              >
                @{item.username}
              </button>
              <span className="text-muted-foreground text-[11px] shrink-0">· {timeAgo}</span>
              <div className="flex-1" />
              {item.type === 'arena' ? (
                <span className="bg-gold/15 text-gold text-[9px] font-bold px-1.5 py-px rounded flex items-center gap-0.5 shrink-0">
                  <Trophy className="w-2.5 h-2.5" />
                  ARENA
                </span>
              ) : (
                <span className="bg-purple-500/15 text-purple-400 text-[9px] font-bold px-1.5 py-px rounded flex items-center gap-0.5 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  REVIEW
                </span>
              )}
            </div>

            {/* Title — compact */}
            <p className="text-[13px] text-foreground leading-tight mb-1.5">
              {displayTitle}
            </p>

            {/* Thumbnail — compact */}
            <button onClick={onOpenPlayer} className="relative w-full rounded-lg overflow-hidden group mb-1.5 block">
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={displayTitle}
                  className="w-full aspect-[16/9] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[16/9] bg-surface-2 flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
              {/* Hover play */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                </div>
              </div>

              {/* Score */}
              {gradeInfo && score != null && (
                <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-0.5">
                  {item.type === 'arena' ? (
                    <>
                      <Star className="w-3 h-3 text-gold" fill="currentColor" />
                      <span className="text-white font-bold text-[11px]">{Math.round(score)}</span>
                    </>
                  ) : (
                    <span className={`font-display text-sm font-bold ${gradeInfo.color}`}>
                      {gradeInfo.grade}
                    </span>
                  )}
                </div>
              )}

              {/* Rank */}
              {item.final_rank && (
                <div className="absolute bottom-1.5 left-1.5 bg-gold text-black rounded px-1.5 py-0.5 flex items-center gap-0.5">
                  <Trophy className="w-2.5 h-2.5" />
                  <span className="font-bold text-[10px]">#{item.final_rank}</span>
                </div>
              )}

              {/* Platform */}
              <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                {platformLabels[item.platform] || item.platform}
              </div>
            </button>

            {/* Score breakdown — inline compact */}
            {item.type === 'arena' && item.quality_score != null && (
              <div className="flex gap-2 mb-1">
                {[
                  { label: 'Q', val: item.quality_score },
                  { label: 'O', val: item.originality_score },
                  { label: 'I', val: item.impact_score },
                ].map(({ label, val }) => (
                  <span key={label} className="text-[10px] text-muted-foreground">
                    {label} <span className="text-foreground font-medium">{val}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Judge quote */}
            {item.type === 'review' && item.judge_comment && (
              <p className="text-[12px] text-muted-foreground leading-snug mb-1.5 line-clamp-2 italic">
                "{item.judge_comment}"
                {item.judge_username && (
                  <span className="text-foreground font-medium not-italic ml-1">— @{item.judge_username}</span>
                )}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center -ml-2">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-[11px]"
              >
                <MessageCircle className="w-4 h-4" />
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-muted-foreground hover:text-green-400 hover:bg-green-400/10 transition-colors text-[11px]"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <a
                href={item.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-[11px]"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/40 bg-surface-0/50">
          <FeedInlineComments
            submissionId={item.rawId}
            submissionType={item.type}
          />
        </div>
      )}
    </article>
  );
}
