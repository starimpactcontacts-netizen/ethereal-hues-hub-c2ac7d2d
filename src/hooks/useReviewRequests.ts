import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ReviewRequest {
  id: string;
  user_id: string;
  submission_url: string;
  platform: string;
  status: 'pending' | 'claimed' | 'reviewed';
  requested_at: string;
  judge_id: string | null;
  claimed_at: string | null;
  emotion_score: number | null;
  creativity_score: number | null;
  sync_score: number | null;
  identity_score: number | null;
  execution_score: number | null;
  total_score: number | null;
  judge_comment: string | null;
  judge_username: string | null;
  judge_avatar_url: string | null;
  reviewed_at: string | null;
  username: string;
  avatar_url: string | null;
}

const DAILY_LIMIT = 3;

export function useReviewRequests() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [todayRequests, setTodayRequests] = useState(0);

  // Fetch today's request count
  useEffect(() => {
    if (!user) return;
    
    async function fetchTodayCount() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from('review_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('requested_at', today.toISOString());
      
      setTodayRequests(count || 0);
    }
    
    fetchTodayCount();
  }, [user]);

  const canRequest = todayRequests < DAILY_LIMIT;
  const remainingRequests = DAILY_LIMIT - todayRequests;

  const requestReview = useCallback(async (submissionUrl: string, platform: string): Promise<boolean> => {
    if (!user || !profile) {
      toast.error("You must be logged in to request reviews");
      return false;
    }

    if (!canRequest) {
      toast.error(`Daily limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`);
      return false;
    }

    setLoading(true);
    try {
      // Check if already requested for this URL
      const { data: existing } = await supabase
        .from('review_requests')
        .select('id')
        .eq('submission_url', submissionUrl)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast.error("You've already requested a review for this edit");
        return false;
      }

      // Create review request
      const { error } = await supabase
        .from('review_requests')
        .insert({
          user_id: user.id,
          submission_url: submissionUrl,
          platform,
          username: profile.username,
          avatar_url: profile.avatar_url,
        });

      if (error) throw error;

      setTodayRequests(prev => prev + 1);
      toast.success("Review requested! A QOI Judge will review your edit soon.");
      return true;
    } catch (error) {
      console.error('Error requesting review:', error);
      toast.error("Failed to request review");
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, profile, canRequest]);

  return {
    requestReview,
    loading,
    canRequest,
    remainingRequests,
    todayRequests,
    dailyLimit: DAILY_LIMIT,
  };
}

// Hook for fetching completed reviews for the feed
export function usePublicReviews(limit = 20) {
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      const { data, error } = await supabase
        .from('review_requests')
        .select('*')
        .eq('status', 'reviewed')
        .order('reviewed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching reviews:', error);
      } else {
        setReviews(data as ReviewRequest[]);
      }
      setLoading(false);
    }

    fetchReviews();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public-reviews')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'review_requests',
        filter: 'status=eq.reviewed',
      }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { reviews, loading };
}
