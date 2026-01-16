import { motion } from "framer-motion";
import { ExternalLink, Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { ReviewRequest } from "@/hooks/useReviewRequests";

interface ReviewCardProps {
  review: ReviewRequest;
  compact?: boolean;
}

// Score category display
const SCORE_CATEGORIES = [
  { key: 'emotion_score', label: 'Emotion', max: 15 },
  { key: 'creativity_score', label: 'Creativity', max: 25 },
  { key: 'sync_score', label: 'Sync', max: 25 },
  { key: 'identity_score', label: 'Identity', max: 10 },
  { key: 'execution_score', label: 'Execution', max: 25 },
] as const;

export default function ReviewCard({ review, compact = false }: ReviewCardProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-1 border border-border rounded-lg p-3"
      >
        <div className="flex items-start gap-3">
          {/* Editor info */}
          <button
            onClick={() => navigate(`/u/${review.username}`)}
            className="flex-shrink-0"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={review.avatar_url || undefined} />
              <AvatarFallback className="bg-muted">
                {review.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">@{review.username}</span>
              <span className="text-muted-foreground text-xs">reviewed by</span>
              <span className="text-amber-500 font-semibold text-sm">
                {review.judge_username || 'QOI Judge'}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-500">
                  {review.total_score || 0} / 100
                </span>
              </div>
              {review.reviewed_at && (
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true })}
                </span>
              )}
            </div>

            {/* Comment */}
            {review.judge_comment && (
              <p className="text-sm text-muted-foreground italic line-clamp-2">
                "{review.judge_comment}"
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Full card view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-1 border border-amber-500/30 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold">
              Review by QOI Judge
            </span>
            <span className="font-bold text-amber-500">
              {review.judge_username || 'ANONYMOUS'}
            </span>
          </div>
          {review.reviewed_at && (
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="p-4 space-y-4">
        {/* Total score */}
        <div className="text-center">
          <p className="text-4xl font-bold text-amber-500">
            {review.total_score || 0}
            <span className="text-lg text-muted-foreground"> / 100</span>
          </p>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {SCORE_CATEGORIES.map(({ key, label, max }) => (
            <div key={key} className="bg-background rounded p-2">
              <p className="text-lg font-bold">
                {(review[key as keyof ReviewRequest] as number) || 0}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className="text-[8px] text-muted-foreground">/ {max}</p>
            </div>
          ))}
        </div>

        {/* Judge comment */}
        {review.judge_comment && (
          <div className="bg-background rounded-lg p-4 border-l-2 border-amber-500">
            <p className="text-sm italic text-foreground">
              "{review.judge_comment}"
            </p>
          </div>
        )}

        {/* Editor info */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button
            onClick={() => navigate(`/u/${review.username}`)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={review.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-xs">
                {review.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">@{review.username}</span>
          </button>

          <a
            href={review.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View Edit
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
