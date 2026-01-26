import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Shield, Users, Clock, Trophy, ChevronDown, 
  Check, X, ExternalLink, Play, CheckCircle, Coins, Swords, Eye, Gavel, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { SanctionedTournament, SanctionedParticipant } from "@/hooks/useSanctionedTournaments";

interface SanctionedTournamentManagementProps {
  onClose: () => void;
}

export default function SanctionedTournamentManagement({ onClose }: SanctionedTournamentManagementProps) {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<SanctionedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<SanctionedTournament | null>(null);
  const [approvalMode, setApprovalMode] = useState(false);
  const [judgingMode, setJudgingMode] = useState(false);
  const [participants, setParticipants] = useState<SanctionedParticipant[]>([]);
  
  // Approval form state
  const [indexPrize, setIndexPrize] = useState("");
  const [firstPlaceIndex, setFirstPlaceIndex] = useState("");
  const [secondPlaceIndex, setSecondPlaceIndex] = useState("");
  const [thirdPlaceIndex, setThirdPlaceIndex] = useState("");
  const [xpReward, setXpReward] = useState("100");
  const [startDate, setStartDate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Judging state
  const [scoringParticipant, setScoringParticipant] = useState<SanctionedParticipant | null>(null);
  const [qoiScore, setQoiScore] = useState(70);
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    fetchTournaments();

    const channel = supabase
      .channel("admin-sanctioned")
      .on("postgres_changes", { event: "*", schema: "public", table: "sanctioned_tournaments" }, () => {
        fetchTournaments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("sanctioned_tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTournaments((data as SanctionedTournament[]) || []);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (tournamentId: string) => {
    try {
      const { data, error } = await supabase
        .from("sanctioned_tournament_participants")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("qoi_score", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setParticipants((data as SanctionedParticipant[]) || []);
    } catch (err) {
      console.error("Error fetching participants:", err);
    }
  };

  const handleApprove = async () => {
    if (!selectedTournament || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("sanctioned_tournaments")
        .update({
          status: "approved",
          index_prize: indexPrize ? parseInt(indexPrize) : null,
          first_place_index: firstPlaceIndex ? parseInt(firstPlaceIndex) : null,
          second_place_index: secondPlaceIndex ? parseInt(secondPlaceIndex) : null,
          third_place_index: thirdPlaceIndex ? parseInt(thirdPlaceIndex) : null,
          xp_reward: parseInt(xpReward) || 100,
          start_date: startDate || null,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedTournament.id);

      if (error) throw error;

      toast.success("Tournament approved!");
      setSelectedTournament(null);
      setApprovalMode(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTournament || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("sanctioned_tournaments")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim(),
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedTournament.id);

      if (error) throw error;

      toast.success("Tournament rejected");
      setSelectedTournament(null);
      setApprovalMode(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (tournamentId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      const tournament = tournaments.find(t => t.id === tournamentId);
      
      if (newStatus === "ready_up") {
        // Set ready up deadline to 24 hours from now
        updates.ready_up_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (newStatus === "live") {
        updates.start_date = new Date().toISOString();
        updates.submission_deadline = new Date(Date.now() + (tournament?.duration_hours || 48) * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from("sanctioned_tournaments")
        .update(updates)
        .eq("id", tournamentId);

      if (error) throw error;
      toast.success(`Status updated to ${newStatus}`);

      // When tournament goes live, send emails and create notifications
      if (newStatus === "live" && tournament) {
        // Fetch ready participants to create notifications
        const { data: participants } = await supabase
          .from("sanctioned_tournament_participants")
          .select("user_id, username")
          .eq("tournament_id", tournamentId)
          .eq("is_ready", true);

        if (participants && participants.length > 0) {
          // Create in-app notifications for all ready participants
          const notifications = participants.map(p => ({
            user_id: p.user_id,
            type: "tournament_started",
            title: "🏆 Tournament Started!",
            message: `${tournament.name} is now live! Submit your edit before the deadline.`,
            data: { tournament_id: tournamentId, tournament_name: tournament.name }
          }));

          await supabase.from("notifications").insert(notifications);

          // Send emails via edge function
          try {
            await supabase.functions.invoke("send-tournament-email", {
              body: { tournament_id: tournamentId }
            });
            toast.success(`Sent notifications to ${participants.length} editors!`);
          } catch (emailErr) {
            console.error("Email send failed:", emailErr);
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleScoreSubmission = async () => {
    if (!scoringParticipant || !user || !selectedTournament) return;

    setSavingScore(true);
    try {
      const { error } = await supabase
        .from("sanctioned_tournament_participants")
        .update({ qoi_score: qoiScore })
        .eq("id", scoringParticipant.id);

      if (error) throw error;

      // Award XP to participant for being scored (participation XP)
      // Wrap in try-catch to prevent XP failure from blocking score save
      const xpAmount = selectedTournament.xp_reward || 100;
      try {
        await supabase.rpc('award_xp', {
          p_user_id: scoringParticipant.user_id,
          p_amount: xpAmount,
          p_action: 'sanctioned_tournament',
          p_description: `Competed in ${selectedTournament.name}`,
        });
      } catch (xpErr) {
        console.error("XP award failed (non-blocking):", xpErr);
      }

      // Create notification for the scored participant (non-blocking)
      try {
        await supabase.from("notifications").insert({
          user_id: scoringParticipant.user_id,
          type: "tournament_scored",
          title: "Your submission was judged!",
          message: `You scored ${qoiScore} QOI in ${selectedTournament.name} (+${xpAmount} XP)`,
          data: { 
            tournament_id: selectedTournament.id, 
            tournament_name: selectedTournament.name,
            qoi_score: qoiScore,
            xp_awarded: xpAmount
          }
        });
      } catch (notifErr) {
        console.error("Notification insert failed (non-blocking):", notifErr);
      }

      // Add to activity feed for live feed visibility (non-blocking)
      try {
        await supabase.from("activity_feed").insert({
          user_id: scoringParticipant.user_id,
          username: scoringParticipant.username,
          avatar_url: scoringParticipant.avatar_url,
          activity_type: "arena_win",
          title: `@${scoringParticipant.username} scored ${qoiScore} QOI`,
          description: `in ${selectedTournament.name}`,
          data: { 
            tournament_id: selectedTournament.id, 
            tournament_name: selectedTournament.name,
            qoi_score: qoiScore,
            submission_url: scoringParticipant.submission_url
          }
        });
      } catch (feedErr) {
        console.error("Activity feed insert failed (non-blocking):", feedErr);
      }

      toast.success(`Score saved! +${xpAmount} XP awarded`);
      setScoringParticipant(null);
      setQoiScore(70);
      fetchParticipants(selectedTournament.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to save score");
    } finally {
      setSavingScore(false);
    }
  };

  // Complete tournament and award Index points to top 3
  const handleCompleteTournament = async (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      toast.error("Tournament not found");
      return;
    }

    try {
      // Get all participants sorted by score
      const { data: allParticipants, error: fetchError } = await supabase
        .from("sanctioned_tournament_participants")
        .select("*")
        .eq("tournament_id", tournamentId)
        .not("qoi_score", "is", null)
        .order("qoi_score", { ascending: false });

      if (fetchError) throw fetchError;

      if (!allParticipants || allParticipants.length === 0) {
        // No scored participants - just mark as completed without rewards
        await supabase
          .from("sanctioned_tournaments")
          .update({ 
            status: "completed",
            end_date: new Date().toISOString()
          })
          .eq("id", tournamentId);
        
        toast.success("Tournament marked as completed (no scored participants)");
        return;
      }

      // Set final ranks
      for (let i = 0; i < allParticipants.length; i++) {
        const rank = i + 1;
        try {
          await supabase
            .from("sanctioned_tournament_participants")
            .update({ final_rank: rank })
            .eq("id", allParticipants[i].id);
        } catch (rankErr) {
          console.error(`Failed to set rank for participant ${allParticipants[i].id}:`, rankErr);
        }
      }

      // Award Index points to top 3
      const indexRewards = [
        { rank: 1, points: tournament.first_place_index || 0 },
        { rank: 2, points: tournament.second_place_index || 0 },
        { rank: 3, points: tournament.third_place_index || 0 },
      ];

      for (const reward of indexRewards) {
        const participant = allParticipants[reward.rank - 1];
        if (participant && reward.points > 0) {
          try {
            // Get current profile values and increment
            const { data: profile } = await supabase
              .from("profiles")
              .select("global_index_score, spendable_index")
              .eq("id", participant.user_id)
              .maybeSingle();

            if (profile) {
              await supabase
                .from("profiles")
                .update({
                  global_index_score: (profile.global_index_score || 0) + reward.points,
                  spendable_index: (profile.spendable_index || 0) + reward.points,
                })
                .eq("id", participant.user_id);
            }

            // Notify winner (non-blocking)
            const placementText = reward.rank === 1 ? "1st" : reward.rank === 2 ? "2nd" : "3rd";
            try {
              await supabase.from("notifications").insert({
                user_id: participant.user_id,
                type: "tournament_placement",
                title: `🏆 ${placementText} Place!`,
                message: `You placed ${placementText} in ${tournament.name} and earned ${reward.points} Index points!`,
                data: { 
                  tournament_id: tournamentId, 
                  tournament_name: tournament.name,
                  rank: reward.rank,
                  index_awarded: reward.points
                }
              });
            } catch (notifErr) {
              console.error("Winner notification failed (non-blocking):", notifErr);
            }

            // Add to activity feed (non-blocking)
            try {
              await supabase.from("activity_feed").insert({
                user_id: participant.user_id,
                username: participant.username,
                avatar_url: participant.avatar_url,
                activity_type: "tournament_win",
                title: `@${participant.username} placed ${placementText}`,
                description: `in ${tournament.name} (+${reward.points} Index)`,
                data: { 
                  tournament_id: tournamentId, 
                  tournament_name: tournament.name,
                  rank: reward.rank,
                  index_awarded: reward.points
                }
              });
            } catch (feedErr) {
              console.error("Activity feed insert failed (non-blocking):", feedErr);
            }
          } catch (rewardErr) {
            console.error(`Failed to award Index to rank ${reward.rank}:`, rewardErr);
          }
        }
      }

      // Mark tournament as completed
      await supabase
        .from("sanctioned_tournaments")
        .update({ 
          status: "completed",
          end_date: new Date().toISOString()
        })
        .eq("id", tournamentId);

      toast.success("Tournament completed! Rewards distributed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete tournament");
    }
  };

  // Manual reward distribution for already-completed tournaments (admin recovery)
  const handleDistributeRewards = async (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      toast.error("Tournament not found");
      return;
    }

    try {
      const { data: allParticipants, error: fetchError } = await supabase
        .from("sanctioned_tournament_participants")
        .select("*")
        .eq("tournament_id", tournamentId)
        .not("qoi_score", "is", null)
        .order("qoi_score", { ascending: false });

      if (fetchError) throw fetchError;

      if (!allParticipants || allParticipants.length === 0) {
        toast.error("No scored participants found");
        return;
      }

      // Set final ranks if not set
      for (let i = 0; i < allParticipants.length; i++) {
        const rank = i + 1;
        if (allParticipants[i].final_rank !== rank) {
          await supabase
            .from("sanctioned_tournament_participants")
            .update({ final_rank: rank })
            .eq("id", allParticipants[i].id);
        }
      }

      // Award Index points to top 3
      const indexRewards = [
        { rank: 1, points: tournament.first_place_index || 0 },
        { rank: 2, points: tournament.second_place_index || 0 },
        { rank: 3, points: tournament.third_place_index || 0 },
      ];

      let awarded = 0;
      for (const reward of indexRewards) {
        const participant = allParticipants[reward.rank - 1];
        if (participant && reward.points > 0) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("global_index_score, spendable_index")
            .eq("id", participant.user_id)
            .maybeSingle();

          if (profile) {
            await supabase
              .from("profiles")
              .update({
                global_index_score: (profile.global_index_score || 0) + reward.points,
                spendable_index: (profile.spendable_index || 0) + reward.points,
              })
              .eq("id", participant.user_id);
            awarded++;
          }
        }
      }

      toast.success(`Rewards distributed to ${awarded} participants`);
    } catch (err: any) {
      toast.error(err.message || "Failed to distribute rewards");
    }
  };

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Are you sure you want to delete "${tournamentName}"? This will also remove all participants.`)) {
      return;
    }

    try {
      // First delete all participants
      const { error: participantsError } = await supabase
        .from("sanctioned_tournament_participants")
        .delete()
        .eq("tournament_id", tournamentId);

      if (participantsError) throw participantsError;

      // Then delete the tournament
      const { error } = await supabase
        .from("sanctioned_tournaments")
        .delete()
        .eq("id", tournamentId);

      if (error) throw error;

      toast.success("Tournament deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete tournament");
    }
  };

  const resetForm = () => {
    setIndexPrize("");
    setFirstPlaceIndex("");
    setSecondPlaceIndex("");
    setThirdPlaceIndex("");
    setXpReward("100");
    setStartDate("");
    setAdminNotes("");
    setRejectionReason("");
  };

  const pendingTournaments = tournaments.filter(t => t.status === "pending");
  const approvedTournaments = tournaments.filter(t => ["approved", "ready_up", "live", "bracket"].includes(t.status));
  const completedTournaments = tournaments.filter(t => ["completed", "rejected", "cancelled"].includes(t.status));

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500",
    approved: "bg-emerald-500",
    rejected: "bg-red-500",
    ready_up: "bg-amber-500",
    live: "bg-emerald-500",
    bracket: "bg-sky-500",
    completed: "bg-purple-500",
    cancelled: "bg-muted-foreground",
  };

  if (approvalMode && selectedTournament) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setApprovalMode(false);
              setSelectedTournament(null);
              resetForm();
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>
          <h3 className="font-display text-lg text-foreground">Review Proposal</h3>
        </div>

        {/* Tournament Details */}
        <div className="bg-surface-1 border border-gold/30 p-4 space-y-3">
          <div className="flex items-center gap-3">
            {selectedTournament.crew_avatar_url ? (
              <img src={selectedTournament.crew_avatar_url} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
            )}
            <div>
              <p className="font-bold text-foreground">{selectedTournament.name}</p>
              <p className="text-xs text-muted-foreground">by {selectedTournament.crew_name}</p>
            </div>
          </div>

          {selectedTournament.description && (
            <p className="text-sm text-muted-foreground">{selectedTournament.description}</p>
          )}

          {selectedTournament.theme && (
            <div className="bg-surface-2 p-3">
              <p className="text-[10px] text-gold uppercase tracking-wider mb-1">Theme</p>
              <p className="text-sm text-foreground">{selectedTournament.theme}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Format</p>
              <p className="text-sm font-bold text-foreground">{selectedTournament.format_type.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Editors</p>
              <p className="text-sm font-bold text-foreground">{selectedTournament.min_players}-{selectedTournament.max_players}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
              <p className="text-sm font-bold text-foreground">{selectedTournament.duration_hours}h</p>
            </div>
          </div>
        </div>

        {/* Approval Form */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Set Index Prizes
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">1st Place</label>
              <Input
                type="number"
                value={firstPlaceIndex}
                onChange={(e) => setFirstPlaceIndex(e.target.value)}
                placeholder="100"
                className="bg-surface-1 border-border"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">2nd Place</label>
              <Input
                type="number"
                value={secondPlaceIndex}
                onChange={(e) => setSecondPlaceIndex(e.target.value)}
                placeholder="50"
                className="bg-surface-1 border-border"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">3rd Place</label>
              <Input
                type="number"
                value={thirdPlaceIndex}
                onChange={(e) => setThirdPlaceIndex(e.target.value)}
                placeholder="25"
                className="bg-surface-1 border-border"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">XP Reward (per participant)</label>
            <Input
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(e.target.value)}
              className="bg-surface-1 border-border"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Admin Notes (internal)</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Any notes about this tournament..."
              className="bg-surface-1 border-border min-h-[60px]"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              {submitting ? "Approving..." : "Approve Tournament"}
            </Button>
          </div>

          {/* Rejection Section */}
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3">Or Reject</h4>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="bg-surface-1 border-border min-h-[60px] mb-3"
            />
            <Button
              onClick={handleReject}
              disabled={submitting || !rejectionReason.trim()}
              variant="destructive"
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Reject Proposal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Judging Mode UI
  if (judgingMode && selectedTournament) {
    const submittedParticipants = participants.filter(p => p.submission_url);
    const scoredCount = participants.filter(p => p.qoi_score !== null).length;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setJudgingMode(false);
              setSelectedTournament(null);
              setParticipants([]);
              setScoringParticipant(null);
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>
          <h3 className="font-display text-lg text-foreground">Judge Submissions</h3>
        </div>

        {/* Tournament Info */}
        <div className="bg-surface-1 border border-gold/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {selectedTournament.crew_avatar_url ? (
                <img src={selectedTournament.crew_avatar_url} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
              )}
              <div>
                <p className="font-bold text-foreground">{selectedTournament.name}</p>
                <p className="text-xs text-muted-foreground">{selectedTournament.crew_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-display text-gold">{scoredCount}/{submittedParticipants.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Scored</p>
            </div>
          </div>
          {selectedTournament.theme && (
            <div className="bg-surface-2 p-3 text-center">
              <p className="text-[10px] text-gold uppercase tracking-wider mb-1">Theme</p>
              <p className="text-sm text-foreground">{selectedTournament.theme}</p>
            </div>
          )}
        </div>

        {/* Scoring Modal */}
        {scoringParticipant && (
          <div className="bg-surface-1 border border-gold p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={scoringParticipant.avatar_url || undefined} />
                  <AvatarFallback>{scoringParticipant.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-foreground">{scoringParticipant.username}</p>
                  <a 
                    href={scoringParticipant.submission_url || ""} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Edit
                  </a>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setScoringParticipant(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  QOI Score
                </label>
                <span className="text-2xl font-display text-gold">{qoiScore}</span>
              </div>
              <Slider
                value={[qoiScore]}
                onValueChange={(v) => setQoiScore(v[0])}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            <Button
              onClick={handleScoreSubmission}
              disabled={savingScore}
              className="w-full bg-gold text-black hover:bg-gold/90"
            >
              {savingScore ? "Saving..." : "Save Score"}
            </Button>
          </div>
        )}

        {/* Submissions List */}
        <div className="space-y-2">
          {submittedParticipants.length === 0 ? (
            <div className="text-center py-8">
              <Gavel className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            </div>
          ) : (
            submittedParticipants.map((participant) => (
              <div
                key={participant.id}
                className={`bg-surface-1 border p-3 flex items-center justify-between ${
                  participant.qoi_score !== null ? "border-emerald-500/30" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={participant.avatar_url || undefined} />
                    <AvatarFallback>{participant.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm text-foreground">{participant.username}</p>
                    <a 
                      href={participant.submission_url || ""} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-gold hover:underline"
                    >
                      {participant.submission_platform || "tiktok"} →
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {participant.qoi_score !== null ? (
                    <span className="text-lg font-display text-gold">{participant.qoi_score}</span>
                  ) : null}
                  <Button
                    size="sm"
                    variant={participant.qoi_score !== null ? "outline" : "default"}
                    onClick={() => {
                      setScoringParticipant(participant);
                      setQoiScore(participant.qoi_score || 70);
                    }}
                    className={participant.qoi_score === null ? "bg-gold text-black hover:bg-gold/90" : ""}
                  >
                    {participant.qoi_score !== null ? "Edit" : "Score"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">Sanctioned Tournaments</h3>
          <p className="text-xs text-muted-foreground">Review proposals and manage tournaments</p>
        </div>
      </div>

      {/* Pending Proposals */}
      {pendingTournaments.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Proposals ({pendingTournaments.length})
          </h4>
          <div className="space-y-2">
            {pendingTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-surface-1 border border-amber-500/30 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {tournament.crew_avatar_url ? (
                    <img src={tournament.crew_avatar_url} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gold" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-foreground">{tournament.name}</p>
                      {tournament.tournament_mode === "crew_vs_crew" && (
                        <Swords className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      by {tournament.crew_name} • {tournament.min_players}-{tournament.max_players} players
                      {tournament.tournament_mode === "crew_vs_crew" && tournament.challenged_crew_name && (
                        <> vs {tournament.challenged_crew_name}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTournament(tournament);
                      setApprovalMode(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Review
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Tournaments */}
      {approvedTournaments.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
            <Play className="w-4 h-4" />
            Active Tournaments ({approvedTournaments.length})
          </h4>
          <div className="space-y-2">
            {approvedTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-surface-1 border border-border p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${statusColors[tournament.status]}`} />
                    <p className="font-bold text-sm text-foreground">{tournament.name}</p>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-surface-2 px-2 py-0.5">
                      {tournament.status.replace("_", " ")}
                    </span>
                    {tournament.tournament_mode === "crew_vs_crew" && (
                      <Swords className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{tournament.player_count}/{tournament.max_players}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {tournament.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(tournament.id, "ready_up")}
                      className="text-xs"
                    >
                      Start Ready-Up
                    </Button>
                  )}
                  {tournament.status === "ready_up" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(tournament.id, "live")}
                        className="text-xs"
                      >
                        Go Live
                      </Button>
                      <span className="text-[10px] text-muted-foreground">
                        {tournament.ready_count} ready
                      </span>
                    </>
                  )}
                  {(tournament.status === "live" || tournament.status === "bracket") && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setJudgingMode(true);
                          fetchParticipants(tournament.id);
                        }}
                        className="text-xs bg-gold text-black hover:bg-gold/90"
                      >
                        <Gavel className="w-3 h-3 mr-1" />
                        Judge
                      </Button>
                      {tournament.status === "live" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(tournament.id, "bracket")}
                          className="text-xs"
                        >
                          Start Bracket
                        </Button>
                      )}
                      {tournament.status === "bracket" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteTournament(tournament.id)}
                          className="text-xs"
                        >
                          <Trophy className="w-3 h-3 mr-1" />
                          Complete & Award
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {tournament.index_prize || tournament.first_place_index ? (
                  <div className="mt-3 flex items-center gap-3 text-[10px]">
                    <span className="text-gold flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      1st: {tournament.first_place_index || 0} IDX
                    </span>
                    <span className="text-muted-foreground">2nd: {tournament.second_place_index || 0}</span>
                    <span className="text-muted-foreground">3rd: {tournament.third_place_index || 0}</span>
                  </div>
                ) : null}

                {/* Delete Button for Active Tournaments */}
                <div className="mt-3 pt-3 border-t border-border">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove Tournament
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed / Rejected */}
      {completedTournaments.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            History ({completedTournaments.length})
          </h4>
          <div className="space-y-2">
            {completedTournaments.slice(0, 5).map((tournament) => (
              <div
                key={tournament.id}
                className="bg-surface-1 border border-border p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${statusColors[tournament.status]}`} />
                    <div>
                      <p className="text-sm text-foreground">{tournament.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {tournament.status} • {tournament.crew_name}
                      </p>
                    </div>
                  </div>
                  {/* Admin recovery: distribute rewards manually for completed tournaments */}
                  {tournament.status === "completed" && (tournament.first_place_index || tournament.second_place_index || tournament.third_place_index) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDistributeRewards(tournament.id)}
                      className="text-xs text-gold hover:text-gold/80"
                      title="Manually distribute Index rewards if they weren't awarded"
                    >
                      <Coins className="w-3 h-3 mr-1" />
                      Distribute
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tournaments.length === 0 && !loading && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No tournament proposals yet</p>
        </div>
      )}
    </div>
  );
}
