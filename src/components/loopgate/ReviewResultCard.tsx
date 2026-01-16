import { ExternalLink, User, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewResult {
  id: string;
  submission_url: string;
  platform: string;
  status: string;
  total_score: number | null;
  emotion_score: number | null;
  creativity_score: number | null;
  sync_score: number | null;
  identity_score: number | null;
  execution_score: number | null;
  judge_comment: string | null;
  judge_username: string | null;
  judge_avatar_url: string | null;
  reviewed_at: string | null;
  username: string;
}

interface ReviewResultCardProps {
  review: ReviewResult;
  compact?: boolean;
}

const SCORE_PILLARS = [
  { key: 'emotion_score', label: 'Emotion', max: 15 },
  { key: 'creativity_score', label: 'Creativity', max: 25 },
  { key: 'sync_score', label: 'Sync', max: 25 },
  { key: 'identity_score', label: 'Identity', max: 10 },
  { key: 'execution_score', label: 'Execution', max: 25 },
] as const;

function getScoreColor(score: number, max: number): string {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return 'text-green-400';
  if (percentage >= 60) return 'text-gold';
  if (percentage >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getTotalScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'S+', color: 'text-gold' };
  if (score >= 80) return { grade: 'S', color: 'text-gold' };
  if (score >= 70) return { grade: 'A', color: 'text-green-400' };
  if (score >= 60) return { grade: 'B', color: 'text-blue-400' };
  if (score >= 50) return { grade: 'C', color: 'text-orange-400' };
  if (score >= 40) return { grade: 'D', color: 'text-orange-500' };
  return { grade: 'F', color: 'text-red-500' };
}

export default function ReviewResultCard({ review, compact = false }: ReviewResultCardProps) {
  const totalScore = review.total_score || 0;
  const { grade, color } = getTotalScoreGrade(totalScore);

  if (compact) {
    return (
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`font-display text-xl ${color}`}>{grade}</span>
            <span className="text-sm text-muted-foreground">{totalScore}/100</span>
          </div>
          <a
            href={review.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold text-xs hover:underline flex items-center gap-1"
          >
            View <ExternalLink size={10} />
          </a>
        </div>
        {review.judge_comment && (
          <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
            "{review.judge_comment}"
          </p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-card via-card to-gold/5 border border-gold/30 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-gold" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Review by QOI Judge
            </span>
          </div>
          <span className={`font-display text-2xl ${color}`}>
            {grade}
          </span>
        </div>
        {review.judge_username && (
          <div className="flex items-center gap-2 mt-2">
            {review.judge_avatar_url ? (
              <img
                src={review.judge_avatar_url}
                alt={review.judge_username}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-gold">{review.judge_username}</span>
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="p-4 space-y-3">
        <div className="text-center mb-4">
          <p className="text-3xl font-display text-foreground">{totalScore}</p>
          <p className="text-xs text-muted-foreground">/ 100</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {SCORE_PILLARS.map((pillar) => {
            const score = review[pillar.key] || 0;
            return (
              <div
                key={pillar.key}
                className="flex items-center justify-between bg-surface-1 px-3 py-2 rounded-lg"
              >
                <span className="text-muted-foreground text-xs">{pillar.label}</span>
                <span className={`font-semibold ${getScoreColor(score, pillar.max)}`}>
                  {score} / {pillar.max}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Judge Comment */}
      {review.judge_comment && (
        <div className="px-4 pb-4">
          <div className="bg-surface-1 border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Judge Comment
            </p>
            <p className="text-sm italic">"{review.judge_comment}"</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Edit by: <span className="text-foreground">@{review.username}</span>
        </div>
        <a
          href={review.submission_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold text-xs font-medium hover:underline flex items-center gap-1"
        >
          View Edit <ExternalLink size={10} />
        </a>
      </div>
    </motion.div>
  );
}
