import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type MatchType = "quick_spar" | "extended";
export type MatchStatus = "queued" | "matched" | "in_progress" | "submitted" | "judging" | "completed" | "voided";

export interface PracticeMatch {
  id: string;
  match_type: MatchType;
  duration_minutes: number;
  player_1_id: string;
  player_2_id: string | null;
  status: MatchStatus;
  player_1_submission_url: string | null;
  player_1_platform: string | null;
  player_1_submitted_at: string | null;
  player_2_submission_url: string | null;
  player_2_platform: string | null;
  player_2_submitted_at: string | null;
  judge_id: string | null;
  judge_claimed_at: string | null;
  player_1_score: number | null;
  player_2_score: number | null;
  winner_id: string | null;
  judge_notes: string | null;
  winner_xp_awarded: number;
  loser_xp_awarded: number;
  compensation_xp_awarded: number;
  matched_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  judged_at: string | null;
  created_at: string;
  updated_at: string;
  // Song theme fields
  player_1_theme_drop_id: string | null;
  player_1_theme_song_name: string | null;
  player_1_theme_song_preview_url: string | null;
  player_2_theme_drop_id: string | null;
  player_2_theme_song_name: string | null;
  player_2_theme_song_preview_url: string | null;
  // Joined data
  player_1?: { username: string; avatar_url: string | null; level: number };
  player_2?: { username: string; avatar_url: string | null; level: number };
  judge?: { username: string; avatar_url: string | null };
}

interface QueueEntry {
  id: string;
  user_id: string;
  match_type: string;
  duration_minutes: number;
  skill_tier: string;
  queued_at: string;
  expires_at: string;
}

export function usePracticeMatch() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [queueEntry, setQueueEntry] = useState<QueueEntry | null>(null);
  const [activeMatch, setActiveMatch] = useState<PracticeMatch | null>(null);
  const [myMatches, setMyMatches] = useState<PracticeMatch[]>([]);

  // Check if user is in queue or has active match
  const checkStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Check queue
      const { data: queueData } = await supabase
        .from("practice_queue")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (queueData) {
        setInQueue(true);
        setQueueEntry(queueData);
      } else {
        setInQueue(false);
        setQueueEntry(null);
      }

      // Check for active match
      const { data: matchData } = await supabase
        .from("practice_matches")
        .select(`
          *,
          player_1:profiles!practice_matches_player_1_id_fkey(username, avatar_url, level),
          player_2:profiles!practice_matches_player_2_id_fkey(username, avatar_url, level)
        `)
        .or(`player_1_id.eq.${user.id},player_2_id.eq.${user.id}`)
        .in("status", ["matched", "in_progress", "submitted", "judging"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (matchData) {
        setActiveMatch(matchData as unknown as PracticeMatch);
      } else {
        setActiveMatch(null);
      }

      // Get recent matches
      const { data: recentMatches } = await supabase
        .from("practice_matches")
        .select(`
          *,
          player_1:profiles!practice_matches_player_1_id_fkey(username, avatar_url, level),
          player_2:profiles!practice_matches_player_2_id_fkey(username, avatar_url, level)
        `)
        .or(`player_1_id.eq.${user.id},player_2_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentMatches) {
        setMyMatches(recentMatches as unknown as PracticeMatch[]);
      }
    } catch (error) {
      console.error("Error checking practice status:", error);
    }
  }, [user?.id]);

  // Join queue for matchmaking
  const joinQueue = async (matchType: MatchType, durationMinutes: number) => {
    if (!user?.id) {
      toast.error("Please sign in to join practice");
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("find_practice_match", {
        p_user_id: user.id,
        p_match_type: matchType,
        p_duration: durationMinutes,
      });

      if (error) throw error;

      if (data) {
        // Match found immediately!
        toast.success("Match found!", {
          description: "You've been paired with an opponent!",
        });
        await checkStatus();
        return data as string;
      } else {
        // Added to queue
        toast.info("Searching for opponent...", {
          description: "You'll be notified when matched!",
        });
        await checkStatus();
        return null;
      }
    } catch (error: any) {
      toast.error("Failed to join queue", {
        description: error.message,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Leave queue
  const leaveQueue = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("practice_queue")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setInQueue(false);
      setQueueEntry(null);
      toast.success("Left queue");
    } catch (error: any) {
      toast.error("Failed to leave queue", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit to match
  const submitToMatch = async (
    matchId: string,
    submissionUrl: string,
    platform: string
  ) => {
    if (!user?.id) return false;

    setLoading(true);
    try {
      // Determine which player we are
      const match = activeMatch || myMatches.find((m) => m.id === matchId);
      if (!match) throw new Error("Match not found");

      const isPlayer1 = match.player_1_id === user.id;
      const updateData = isPlayer1
        ? {
            player_1_submission_url: submissionUrl,
            player_1_platform: platform,
            player_1_submitted_at: new Date().toISOString(),
          }
        : {
            player_2_submission_url: submissionUrl,
            player_2_platform: platform,
            player_2_submitted_at: new Date().toISOString(),
          };

      // Check if other player already submitted
      const otherSubmitted = isPlayer1
        ? match.player_2_submitted_at
        : match.player_1_submitted_at;

      const newStatus = otherSubmitted ? "submitted" : "in_progress";

      const { error } = await supabase
        .from("practice_matches")
        .update({
          ...updateData,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (error) throw error;

      toast.success("Submission received!", {
        description: otherSubmitted
          ? "Both submissions in! Awaiting judge."
          : "Waiting for opponent to submit.",
      });

      await checkStatus();
      return true;
    } catch (error: any) {
      toast.error("Failed to submit", {
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    checkStatus();

    // Subscribe to queue changes
    const queueChannel = supabase
      .channel("practice-queue")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "practice_queue",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          checkStatus();
        }
      )
      .subscribe();

    // Subscribe to match changes
    const matchChannel = supabase
      .channel("practice-matches")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "practice_matches",
        },
        (payload) => {
          const match = payload.new as any;
          if (
            match &&
            (match.player_1_id === user.id || match.player_2_id === user.id)
          ) {
            checkStatus();

            // Show toast for status changes
            if (payload.eventType === "INSERT") {
              toast.success("Match found!", {
                description: "Your 1v1 practice is ready!",
              });
            } else if (match.status === "completed") {
              toast.success("Match judged!", {
                description: "Check your results!",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(matchChannel);
    };
  }, [user?.id, checkStatus]);

  return {
    loading,
    inQueue,
    queueEntry,
    activeMatch,
    myMatches,
    joinQueue,
    leaveQueue,
    submitToMatch,
    checkStatus,
  };
}

// Hook for judges to see and claim matches
export function usePracticeJudging() {
  const { user, isJudge } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingMatches, setPendingMatches] = useState<PracticeMatch[]>([]);
  const [myJudgingMatches, setMyJudgingMatches] = useState<PracticeMatch[]>([]);

  const fetchPendingMatches = useCallback(async () => {
    if (!isJudge) return;

    try {
      // Matches awaiting judge claim
      const { data: pending } = await supabase
        .from("practice_matches")
        .select(`
          *,
          player_1:profiles!practice_matches_player_1_id_fkey(username, avatar_url, level),
          player_2:profiles!practice_matches_player_2_id_fkey(username, avatar_url, level)
        `)
        .eq("status", "submitted")
        .is("judge_id", null)
        .order("updated_at", { ascending: true });

      if (pending) {
        setPendingMatches(pending as unknown as PracticeMatch[]);
      }

      // Matches I'm judging
      if (user?.id) {
        const { data: myMatches } = await supabase
          .from("practice_matches")
          .select(`
            *,
            player_1:profiles!practice_matches_player_1_id_fkey(username, avatar_url, level),
            player_2:profiles!practice_matches_player_2_id_fkey(username, avatar_url, level)
          `)
          .eq("judge_id", user.id)
          .in("status", ["judging", "completed"])
          .order("judge_claimed_at", { ascending: false })
          .limit(20);

        if (myMatches) {
          setMyJudgingMatches(myMatches as unknown as PracticeMatch[]);
        }
      }
    } catch (error) {
      console.error("Error fetching practice matches:", error);
    }
  }, [user?.id, isJudge]);

  // Claim a match
  const claimMatch = async (matchId: string) => {
    if (!user?.id || !isJudge) {
      toast.error("Only judges can claim matches");
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("claim_practice_match", {
        p_judge_id: user.id,
        p_match_id: matchId,
      });

      if (error) throw error;

      if (data) {
        toast.success("Match claimed!", {
          description: "You can now judge this 1v1.",
        });
        await fetchPendingMatches();
        return true;
      } else {
        toast.error("Match already claimed");
        await fetchPendingMatches();
        return false;
      }
    } catch (error: any) {
      toast.error("Failed to claim match", {
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Submit judgment
  const submitJudgment = async (
    matchId: string,
    player1Score: number,
    player2Score: number,
    notes?: string
  ) => {
    if (!user?.id || !isJudge) return false;

    setLoading(true);
    try {
      // Get the match to determine winner
      const { data: match } = await supabase
        .from("practice_matches")
        .select("player_1_id, player_2_id")
        .eq("id", matchId)
        .single();

      if (!match) throw new Error("Match not found");

      const winnerId =
        player1Score > player2Score
          ? match.player_1_id
          : player2Score > player1Score
          ? match.player_2_id
          : null;

      // XP rewards
      const winnerXP = 50;
      const loserXP = 20;

      const { error } = await supabase
        .from("practice_matches")
        .update({
          player_1_score: player1Score,
          player_2_score: player2Score,
          winner_id: winnerId,
          judge_notes: notes,
          status: "completed",
          judged_at: new Date().toISOString(),
          winner_xp_awarded: winnerXP,
          loser_xp_awarded: loserXP,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (error) throw error;

      // Award XP to players
      if (winnerId) {
        const loserId =
          winnerId === match.player_1_id
            ? match.player_2_id
            : match.player_1_id;

        await supabase.rpc("award_xp", {
          p_user_id: winnerId,
          p_amount: winnerXP,
          p_action: "practice_win",
          p_description: "Won 1v1 Practice",
        });

        if (loserId) {
          await supabase.rpc("award_xp", {
            p_user_id: loserId,
            p_amount: loserXP,
            p_action: "practice_loss",
            p_description: "Completed 1v1 Practice",
          });
        }
      }

      // Award XP to judge
      await supabase.rpc("award_xp", {
        p_user_id: user.id,
        p_amount: 30,
        p_action: "practice_judged",
        p_description: "Judged a 1v1 Practice",
      });

      toast.success("Judgment submitted!", {
        description: winnerId ? "Winner determined, XP awarded!" : "Tie game!",
      });

      await fetchPendingMatches();
      return true;
    } catch (error: any) {
      toast.error("Failed to submit judgment", {
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isJudge) {
      fetchPendingMatches();

      // Subscribe to new matches needing judges
      const channel = supabase
        .channel("practice-judging")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "practice_matches",
            filter: "status=eq.submitted",
          },
          () => {
            fetchPendingMatches();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isJudge, fetchPendingMatches]);

  return {
    loading,
    pendingMatches,
    myJudgingMatches,
    claimMatch,
    submitJudgment,
    fetchPendingMatches,
  };
}
