import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Shield, Users, Clock, Trophy, ChevronDown, 
  Check, X, ExternalLink, Play, CheckCircle, Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { SanctionedTournament } from "@/hooks/useSanctionedTournaments";

interface SanctionedTournamentManagementProps {
  onClose: () => void;
}

export default function SanctionedTournamentManagement({ onClose }: SanctionedTournamentManagementProps) {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<SanctionedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<SanctionedTournament | null>(null);
  const [approvalMode, setApprovalMode] = useState(false);
  
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
      
      if (newStatus === "ready_up") {
        // Set ready up deadline to 24 hours from now
        updates.ready_up_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (newStatus === "live") {
        const tournament = tournaments.find(t => t.id === tournamentId);
        updates.start_date = new Date().toISOString();
        updates.submission_deadline = new Date(Date.now() + (tournament?.duration_hours || 48) * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from("sanctioned_tournaments")
        .update(updates)
        .eq("id", tournamentId);

      if (error) throw error;
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
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
              <p className="text-[10px] text-muted-foreground uppercase">Players</p>
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
                    <p className="font-bold text-sm text-foreground">{tournament.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      by {tournament.crew_name} • {tournament.min_players}-{tournament.max_players} players
                    </p>
                  </div>
                </div>
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
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{tournament.player_count}/{tournament.max_players}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(tournament.id, "live")}
                      className="text-xs"
                    >
                      Go Live
                    </Button>
                  )}
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
                      onClick={() => handleStatusChange(tournament.id, "completed")}
                      className="text-xs"
                    >
                      Mark Complete
                    </Button>
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
                className="bg-surface-1 border border-border p-3 flex items-center justify-between opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${statusColors[tournament.status]}`} />
                  <div>
                    <p className="text-sm text-foreground">{tournament.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {tournament.status} • {tournament.crew_name}
                    </p>
                  </div>
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
