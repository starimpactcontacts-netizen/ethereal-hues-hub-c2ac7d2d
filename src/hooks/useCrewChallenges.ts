import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CrewChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: "weekly" | "daily" | "special";
  xp_reward: number;
  target_value: number;
  target_metric: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

export interface ChallengeProgress {
  id: string;
  crew_id: string;
  challenge_id: string;
  current_value: number;
  completed_at: string | null;
  xp_claimed: boolean;
  started_at: string;
  updated_at: string;
}

export interface ChallengeWithProgress extends CrewChallenge {
  progress?: ChallengeProgress;
  percentComplete: number;
  isCompleted: boolean;
  canClaim: boolean;
  xpClaimed: boolean;
}

const METRIC_ICONS: Record<string, string> = {
  crew_xp: "⚡",
  submissions: "🎬",
  members: "👥",
  arena_wins: "🏆",
  gqt_scores: "📊",
  judge_review_c_plus: "⭐",
  judge_review_b_plus: "🌟",
  judge_review_s: "💎",
  judge_reviews_received: "📝",
  gqt_score_70_plus: "🎯",
  badge_displays: "🏅",
  viral_submission: "🔥",
};

const METRIC_LABELS: Record<string, string> = {
  crew_xp: "Crew XP",
  submissions: "Submissions",
  members: "New Members",
  arena_wins: "Arena Wins",
  gqt_scores: "GQT Completions",
  judge_review_c_plus: "C+ Judge Rating",
  judge_review_b_plus: "B+ Judge Rating",
  judge_review_s: "S Tier Rating",
  judge_reviews_received: "Reviews Received",
  gqt_score_70_plus: "GQT 70+ Score",
  badge_displays: "Badge Displays",
  viral_submission: "Viral Video",
};

export function useCrewChallenges(crewId: string | undefined) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!crewId) return;

    try {
      // First, try to generate new challenges if needed
      await supabase.rpc("generate_crew_challenges", { p_crew_id: crewId });

      // Fetch active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("crew_challenges")
        .select("*")
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: true });

      if (challengesError) {
        console.error("Error fetching challenges:", challengesError);
        return;
      }

      // Fetch progress for this crew
      let { data: progressData, error: progressError } = await supabase
        .from("crew_challenge_progress")
        .select("*")
        .eq("crew_id", crewId);

      if (progressError) {
        console.error("Error fetching progress:", progressError);
      }

      // Auto-initialize progress for challenges that don't have it yet
      const existingChallengeIds = new Set(progressData?.map((p) => p.challenge_id) || []);
      const missingChallenges = (challengesData || []).filter(
        (c) => !existingChallengeIds.has(c.id)
      );

      if (missingChallenges.length > 0 && user) {
        const newProgressRows = missingChallenges.map((challenge) => ({
          crew_id: crewId,
          challenge_id: challenge.id,
          current_value: 0,
        }));

        const { data: insertedProgress, error: insertError } = await supabase
          .from("crew_challenge_progress")
          .upsert(newProgressRows, { onConflict: "crew_id,challenge_id" })
          .select();

        if (insertError) {
          console.error("Error initializing progress:", insertError);
        } else if (insertedProgress) {
          progressData = [...(progressData || []), ...insertedProgress];
        }
      }

      // Combine challenges with progress
      const challengesWithProgress: ChallengeWithProgress[] = (challengesData || []).map(
        (challenge) => {
          const progress = progressData?.find((p) => p.challenge_id === challenge.id);
          const currentValue = progress?.current_value || 0;
          const percentComplete = Math.min(
            100,
            Math.round((currentValue / challenge.target_value) * 100)
          );
          const isCompleted = currentValue >= challenge.target_value;
          const xpClaimed = progress?.xp_claimed || false;
          const canClaim = isCompleted && !xpClaimed;

          return {
            ...challenge,
            challenge_type: challenge.challenge_type as "weekly" | "daily" | "special",
            progress,
            percentComplete,
            isCompleted,
            canClaim,
            xpClaimed,
          };
        }
      );

      setChallenges(challengesWithProgress);
    } catch (error) {
      console.error("Error in fetchChallenges:", error);
    } finally {
      setLoading(false);
    }
  }, [crewId, user]);

  // Initialize or update progress for a challenge
  const initProgress = useCallback(
    async (challengeId: string) => {
      if (!crewId || !user) return;

      const { error } = await supabase.from("crew_challenge_progress").upsert(
        {
          crew_id: crewId,
          challenge_id: challengeId,
          current_value: 0,
        },
        { onConflict: "crew_id,challenge_id" }
      );

      if (error) {
        console.error("Error initializing progress:", error);
      }
    },
    [crewId, user]
  );

  // Increment progress for a specific metric
  const incrementProgress = useCallback(
    async (metric: string, amount: number = 1) => {
      if (!crewId || !user) return;

      // Find challenges matching this metric
      const matchingChallenges = challenges.filter(
        (c) => c.target_metric === metric && !c.isCompleted
      );

      for (const challenge of matchingChallenges) {
        const currentValue = challenge.progress?.current_value || 0;
        const newValue = Math.min(currentValue + amount, challenge.target_value);

        const { error } = await supabase
          .from("crew_challenge_progress")
          .upsert(
            {
              crew_id: crewId,
              challenge_id: challenge.id,
              current_value: newValue,
              completed_at: newValue >= challenge.target_value ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "crew_id,challenge_id" }
          );

        if (error) {
          console.error("Error updating progress:", error);
        }
      }

      // Refresh challenges
      fetchChallenges();
    },
    [crewId, user, challenges, fetchChallenges]
  );

  // Claim XP reward for completed challenge
  const claimReward = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!crewId || !user) return false;

      const challenge = challenges.find((c) => c.id === challengeId);
      if (!challenge || !challenge.canClaim) {
        toast.error("Cannot claim this reward");
        return false;
      }

      // Mark as claimed
      const { error } = await supabase
        .from("crew_challenge_progress")
        .update({ xp_claimed: true })
        .eq("crew_id", crewId)
        .eq("challenge_id", challengeId);

      if (error) {
        console.error("Error claiming reward:", error);
        toast.error("Failed to claim reward");
        return false;
      }

      toast.success(`+${challenge.xp_reward} XP claimed!`, {
        icon: "🎉",
      });

      // Refresh challenges
      fetchChallenges();
      return true;
    },
    [crewId, user, challenges, fetchChallenges]
  );

  // Subscribe to realtime progress updates
  useEffect(() => {
    if (!crewId) return;

    const channel = supabase
      .channel(`crew-challenge-progress-${crewId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crew_challenge_progress",
          filter: `crew_id=eq.${crewId}`,
        },
        () => {
          fetchChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId, fetchChallenges]);

  // Initial fetch
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Get time remaining for a challenge
  const getTimeRemaining = (endsAt: string): string => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return {
    challenges,
    loading,
    incrementProgress,
    claimReward,
    getTimeRemaining,
    METRIC_ICONS,
    METRIC_LABELS,
    refetch: fetchChallenges,
  };
}
