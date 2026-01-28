import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ReviewRequest {
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
  judge_id: string | null;
  judge_username: string | null;
  judge_avatar_url: string | null;
  requested_at: string;
  claimed_at: string | null;
  reviewed_at: string | null;
  rating_mode: string | null;
  selected_tier: string | null;
}

export function useReviewRequests(targetUserId?: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = targetUserId || user?.id;

  const fetchReviews = useCallback(async () => {
    if (!userId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('review_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchReviews();

    if (!userId) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`review-requests-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'review_requests',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchReviews]);

  const pendingReviews = reviews.filter(r => r.status === 'pending' || r.status === 'claimed');
  const completedReviews = reviews.filter(r => r.status === 'reviewed');

  return {
    reviews,
    pendingReviews,
    completedReviews,
    loading,
    refetch: fetchReviews
  };
}
