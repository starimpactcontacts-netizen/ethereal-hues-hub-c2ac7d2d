import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface JudgeReview {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
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
  reviewed_at: string | null;
  rating_mode: string | null;
  selected_tier: string | null;
}

// Shared utility for getting display grade - prioritizes selected_tier
export function getDisplayGrade(review: { rating_mode?: string | null; selected_tier?: string | null; total_score?: number | null }): { grade: string; color: string } {
  // If tier_only mode with a selected tier, use that directly
  if (review.rating_mode === 'tier_only' && review.selected_tier) {
    const tierColors: Record<string, string> = {
      'S': 'text-gold',
      'A': 'text-purple-400',
      'B': 'text-blue-400',
      'C': 'text-slate-300',
      'D': 'text-orange-400',
      'F': 'text-red-500',
    };
    return { grade: review.selected_tier, color: tierColors[review.selected_tier] || 'text-muted-foreground' };
  }
  
  // Fallback to score-based calculation
  const score = review.total_score || 0;
  if (score >= 90) return { grade: 'S', color: 'text-gold' };
  if (score >= 70) return { grade: 'A', color: 'text-purple-400' };
  if (score >= 50) return { grade: 'B', color: 'text-blue-400' };
  if (score >= 30) return { grade: 'C', color: 'text-slate-300' };
  return { grade: 'F', color: 'text-red-500' };
}

export function useJudgeReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<JudgeReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!user?.id) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('review_requests')
      .select('*')
      .eq('judge_id', user.id)
      .eq('status', 'reviewed')
      .order('reviewed_at', { ascending: false });

    if (error) {
      console.error('Error fetching judge reviews:', error);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    refetch: fetchReviews
  };
}
