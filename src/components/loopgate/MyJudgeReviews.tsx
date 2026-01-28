import { ExternalLink, Star, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';
import { useJudgeReviews } from '@/hooks/useJudgeReviews';
import { useThumbnail } from '@/hooks/useThumbnail';
import { formatDistanceToNow } from 'date-fns';

function getGrade(score: number) {
  if (score >= 90) return { grade: 'S', color: 'text-gold' };
  if (score >= 70) return { grade: 'A', color: 'text-emerald-400' };
  if (score >= 50) return { grade: 'B', color: 'text-blue-400' };
  if (score >= 30) return { grade: 'C', color: 'text-orange-400' };
  return { grade: 'F', color: 'text-red-400' };
}

function ReviewCard({ review }: { review: any }) {
  const { thumbnail } = useThumbnail(review.submission_url, review.platform);
  const { grade, color } = getGrade(review.total_score || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-1 border border-border rounded-lg p-3"
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-14 h-18 bg-surface-0 rounded overflow-hidden shrink-0">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Star className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium truncate">@{review.username}</p>
            <div className="flex items-center gap-1">
              <span className={`font-display text-lg ${color}`}>{grade}</span>
              <span className="text-[10px] text-muted-foreground">({review.total_score})</span>
            </div>
          </div>

          <a
            href={review.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gold hover:underline flex items-center gap-1 mb-1"
          >
            <ExternalLink size={8} />
            View Edit
          </a>

          {review.judge_comment && (
            <p className="text-[10px] text-muted-foreground italic line-clamp-2">
              "{review.judge_comment}"
            </p>
          )}

          <p className="text-[8px] text-muted-foreground mt-1">
            {review.reviewed_at 
              ? formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true })
              : 'Recently'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyJudgeReviews() {
  const { reviews, loading } = useJudgeReviews();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-1 flex items-center justify-center mb-3">
          <Gavel className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">No reviews given yet</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Head to the Judge Panel to review submissions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
