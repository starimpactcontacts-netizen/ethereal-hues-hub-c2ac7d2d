import { useNavigate } from "react-router-dom";
import { Play, Star, Trophy, MessageCircle, Share2, ExternalLink, Sparkles, Clock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

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

const platformColors: Record<string, string> = {
  tiktok: "from-pink-500 to-cyan-400",
  instagram: "from-purple-500 to-orange-400",
  youtube: "from-red-600 to-red-400",
};

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
  onOpenPlayer: () => void;
  onOpenComments: () => void;
}

export default function LoopFeedCard({ item, onOpenPlayer, onOpenComments }: LoopFeedCardProps) {
  const navigate = useNavigate();
  const gradient = platformColors[item.platform] || "from-gray-600 to-gray-400";
  const displayTitle = item.custom_title || item.event_title || 'Untitled Edit';
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  const handleShare = () => {
    navigator.share?.({ url: item.submission_url, title: displayTitle });
  };

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Thumbnail / Hero */}
      <button onClick={onOpenPlayer} className="relative w-full aspect-video overflow-hidden group">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={displayTitle}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          {item.type === 'arena' ? (
            <div className="bg-gold/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              ARENA
            </div>
          ) : (
            <div className="bg-purple-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              REVIEW
            </div>
          )}
        </div>

        {/* Platform badge */}
        <div className="absolute top-3 right-3">
          <div className={`bg-gradient-to-r ${gradient} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
            {platformLabels[item.platform] || item.platform}
          </div>
        </div>

        {/* Score overlay bottom-right */}
        {item.type === 'arena' && item.qoi_score != null && (
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-gold" fill="currentColor" />
            <span className="text-white font-bold text-sm">{Math.round(item.qoi_score)}</span>
          </div>
        )}
        {item.type === 'review' && item.total_score != null && (
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1">
            <span className={`font-display text-lg font-bold ${getGrade(item.total_score).color}`}>
              {getGrade(item.total_score).grade}
            </span>
          </div>
        )}

        {/* Rank badge */}
        {item.final_rank && (
          <div className="absolute bottom-3 left-3 bg-gold text-black rounded-lg px-2.5 py-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            <span className="font-bold text-xs">#{item.final_rank}</span>
          </div>
        )}
      </button>

      {/* Content section */}
      <div className="p-3.5">
        {/* Title row */}
        <div className="flex gap-3 mb-2">
          <button onClick={() => navigate(`/editor/${item.user_id}`)} className="shrink-0">
            <Avatar className="w-9 h-9 border border-border">
              <AvatarImage src={item.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                {item.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
              {displayTitle}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <button
                onClick={() => navigate(`/editor/${item.user_id}`)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                @{item.username}
              </button>
              <span className="text-muted-foreground/50 text-[10px]">·</span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Score pills for arena */}
        {item.type === 'arena' && item.quality_score != null && (
          <div className="flex gap-1.5 mb-2.5">
            <div className="bg-muted/50 rounded-full px-2 py-0.5 text-[10px]">
              <span className="text-muted-foreground">Q </span>
              <span className="font-bold text-foreground">{item.quality_score}</span>
            </div>
            <div className="bg-muted/50 rounded-full px-2 py-0.5 text-[10px]">
              <span className="text-muted-foreground">O </span>
              <span className="font-bold text-foreground">{item.originality_score}</span>
            </div>
            <div className="bg-muted/50 rounded-full px-2 py-0.5 text-[10px]">
              <span className="text-muted-foreground">I </span>
              <span className="font-bold text-foreground">{item.impact_score}</span>
            </div>
          </div>
        )}

        {/* Judge comment for reviews */}
        {item.type === 'review' && item.judge_comment && (
          <p className="text-xs text-muted-foreground italic line-clamp-2 mb-2.5">
            "{item.judge_comment}"
          </p>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-1 border-t border-border/50 pt-2.5 -mx-0.5">
          <button
            onClick={onOpenComments}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          <div className="flex-1" />
          <a
            href={item.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-xs"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open</span>
          </a>
        </div>
      </div>
    </article>
  );
}
