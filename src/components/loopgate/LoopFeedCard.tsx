import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Star, Trophy, MessageCircle, Share2, ExternalLink, Sparkles, Heart, ChevronDown, ChevronUp } from "lucide-react";
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
  // Arena fields
  qoi_score?: number | null;
  quality_score?: number | null;
  originality_score?: number | null;
  impact_score?: number | null;
  event_title?: string;
  final_rank?: number | null;
  // Review fields
  total_score?: number;
  judge_comment?: string | null;
  judge_username?: string | null;
  judge_avatar_url?: string | null;
}

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
    <article className="border-b border-border hover:bg-surface-1/50 transition-colors">
      {/* Main post area — Twitter-style horizontal layout */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-3">
          {/* Avatar column */}
          <button onClick={() => navigate(`/editor/${item.user_id}`)} className="shrink-0 mt-0.5">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={item.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                {item.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            {/* Author line */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <button
                onClick={() => navigate(`/editor/${item.user_id}`)}
                className="font-semibold text-foreground text-sm hover:underline truncate"
              >
                @{item.username}
              </button>
              <span className="text-muted-foreground text-xs shrink-0">· {timeAgo}</span>
              <div className="flex-1" />
              {/* Type pill */}
              {item.type === 'arena' ? (
                <span className="bg-gold/15 text-gold text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                  <Trophy className="w-2.5 h-2.5" />
                  ARENA
                </span>
              ) : (
                <span className="bg-purple-500/15 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  REVIEW
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-[15px] text-foreground leading-snug mb-2">
              {displayTitle}
            </h3>

            {/* Thumbnail — click to play */}
            <button onClick={onOpenPlayer} className="relative w-full rounded-xl overflow-hidden group mb-2 block">
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={displayTitle}
                  className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-video bg-surface-2 flex items-center justify-center">
                  <Play className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                </div>
              </div>

              {/* Score badge */}
              {gradeInfo && score != null && (
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
                  {item.type === 'arena' ? (
                    <>
                      <Star className="w-3.5 h-3.5 text-gold" fill="currentColor" />
                      <span className="text-white font-bold text-xs">{Math.round(score)}</span>
                    </>
                  ) : (
                    <span className={`font-display text-base font-bold ${gradeInfo.color}`}>
                      {gradeInfo.grade}
                    </span>
                  )}
                </div>
              )}

              {/* Rank badge */}
              {item.final_rank && (
                <div className="absolute bottom-2 left-2 bg-gold text-black rounded-md px-2 py-1 flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  <span className="font-bold text-[11px]">#{item.final_rank}</span>
                </div>
              )}

              {/* Platform pill */}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                {platformLabels[item.platform] || item.platform}
              </div>
            </button>

            {/* Score breakdown for arena */}
            {item.type === 'arena' && item.quality_score != null && (
              <div className="flex gap-2 mb-2">
                {[
                  { label: 'Quality', val: item.quality_score },
                  { label: 'Originality', val: item.originality_score },
                  { label: 'Impact', val: item.impact_score },
                ].map(({ label, val }) => (
                  <span key={label} className="text-[11px] text-muted-foreground">
                    <span className="text-foreground font-medium">{val}</span> {label}
                  </span>
                ))}
              </div>
            )}

            {/* Judge comment for reviews */}
            {item.type === 'review' && item.judge_comment && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-2 line-clamp-3">
                "{item.judge_comment}"
                {item.judge_username && (
                  <span className="text-foreground font-medium ml-1">— @{item.judge_username}</span>
                )}
              </p>
            )}

            {/* Action bar — Twitter style */}
            <div className="flex items-center -ml-2 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-xs group"
              >
                <MessageCircle className="w-[18px] h-[18px]" />
                <span>Thread</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:text-green-400 hover:bg-green-400/10 transition-colors text-xs"
              >
                <Share2 className="w-[18px] h-[18px]" />
              </button>

              <a
                href={item.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-xs"
              >
                <ExternalLink className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Inline threaded comments — Twitter style */}
      {isExpanded && (
        <div className="border-t border-border/50 bg-surface-0/50">
          <FeedInlineComments
            submissionId={item.rawId}
            submissionType={item.type}
          />
        </div>
      )}
    </article>
  );
}
