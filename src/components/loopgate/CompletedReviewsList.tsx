import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink, CheckCircle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useThumbnail } from '@/hooks/useThumbnail';
import { Button } from '@/components/ui/button';
import JudgeCardExport from './JudgeCardExport';

import { getDisplayGrade } from '@/hooks/useJudgeReviews';

interface CompletedReview {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
  total_score: number;
  emotion_score: number | null;
  creativity_score: number | null;
  sync_score: number | null;
  identity_score: number | null;
  execution_score: number | null;
  judge_comment: string | null;
  reviewed_at: string;
  rating_mode: string | null;
  selected_tier: string | null;
}

function ReviewCard({ review, onExport }: { review: CompletedReview; onExport: () => void }) {
  const { thumbnail } = useThumbnail(review.submission_url, review.platform);
  const { grade, color } = getDisplayGrade(review);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-1 border border-border rounded-xl p-4"
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-20 bg-surface-0 rounded-lg overflow-hidden shrink-0">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Star className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm">@{review.username}</p>
            <div className="flex items-center gap-1">
              <span className={`font-display text-xl ${color}`}>{grade}</span>
              <span className="text-xs text-muted-foreground">({review.total_score})</span>
            </div>
          </div>
          
          <a
            href={review.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold hover:underline flex items-center gap-1 mb-2"
          >
            <ExternalLink size={10} />
            View Edit
          </a>
          
          {review.judge_comment && (
            <p className="text-xs text-muted-foreground line-clamp-2 italic">
              "{review.judge_comment}"
            </p>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
        <Button
          onClick={onExport}
          size="sm"
          className="flex-1 bg-gold text-black hover:bg-gold/90"
        >
          <Download className="w-3 h-3 mr-1.5" />
          Export Card
        </Button>
      </div>
    </motion.div>
  );
}

export default function CompletedReviewsList() {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<CompletedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingReview, setExportingReview] = useState<CompletedReview | null>(null);
  
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('review_requests')
        .select('id, user_id, username, avatar_url, submission_url, platform, total_score, emotion_score, creativity_score, sync_score, identity_score, execution_score, judge_comment, reviewed_at, rating_mode, selected_tier')
        .eq('judge_id', user.id)
        .eq('status', 'reviewed')
        .order('reviewed_at', { ascending: false });
      
      if (!error && data) {
        setReviews(data as CompletedReview[]);
      }
      setLoading(false);
    };
    
    fetchReviews();
  }, [user?.id]);
  
  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            No Completed Reviews Yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Start reviewing submissions from your inbox to see them here.
          </p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <>
      <div className="p-4 space-y-3">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onExport={() => setExportingReview(review)}
          />
        ))}
      </div>
      
      {/* Export Modal */}
      {exportingReview && profile && (
        <JudgeCardExport
          isOpen={true}
          onClose={() => setExportingReview(null)}
          data={{
            editorUsername: exportingReview.username,
            judgeUsername: profile.username,
            judgeAvatarUrl: profile.avatar_url,
            totalScore: exportingReview.total_score,
            emotionScore: exportingReview.emotion_score || Math.round(exportingReview.total_score * 0.15),
            creativityScore: exportingReview.creativity_score || Math.round(exportingReview.total_score * 0.25),
            syncScore: exportingReview.sync_score || Math.round(exportingReview.total_score * 0.25),
            identityScore: exportingReview.identity_score || Math.round(exportingReview.total_score * 0.10),
            executionScore: exportingReview.execution_score || Math.round(exportingReview.total_score * 0.25),
            comment: exportingReview.judge_comment || undefined,
            ratingMode: exportingReview.rating_mode,
            selectedTier: exportingReview.selected_tier,
          }}
        />
      )}
    </>
  );
}
