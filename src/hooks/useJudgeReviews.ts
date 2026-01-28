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
