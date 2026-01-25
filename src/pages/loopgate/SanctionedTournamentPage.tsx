import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Users,
  Clock,
  Shield,
  CheckCircle,
  Lock,
  Send,
  AlertCircle,
  Swords,
  Sparkles,
  Timer,
  Zap,
  Crown,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useSanctionedTournament } from "@/hooks/useSanctionedTournaments";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CountdownTimer from "@/components/loopgate/CountdownTimer";

export default function SanctionedTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    tournament,
    participants,
    loading,
    isParticipant,
    userParticipation,
    joinTournament,
    leaveTournament,
    readyUp,
    refetch,
  } = useSanctionedTournament(id || null);

  const [submissionUrl, setSubmissionUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate derived state
  const isReady = userParticipation?.is_ready || false;
  const hasSubmitted = !!userParticipation?.submitted_at;
  const readyParticipants = participants.filter((p) => p.is_ready);
  const submittedParticipants = participants.filter((p) => p.submitted_at);
  
  const minReached = (tournament?.ready_count || 0) >= (tournament?.min_players || 20);
  const maxReached = (tournament?.player_count || 0) >= (tournament?.max_players || 100);
  const isCrewVsCrew = tournament?.tournament_mode === "crew_vs_crew";

  // Handle submission
  const handleSubmit = async () => {
    if (!user || !id || !submissionUrl.trim()) return;

    setIsSubmitting(true);
    try {
      // Detect platform from URL
      let platform = "other";
      if (submissionUrl.includes("tiktok.com")) platform = "tiktok";
      else if (submissionUrl.includes("youtube.com") || submissionUrl.includes("youtu.be")) platform = "youtube";
      else if (submissionUrl.includes("instagram.com")) platform = "instagram";

      const { error } = await supabase
        .from("sanctioned_tournament_participants")
        .update({
          submission_url: submissionUrl.trim(),
          submission_platform: platform,
          submitted_at: new Date().toISOString(),
        })
        .eq("tournament_id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Submission received! Good luck!");
      setSubmissionUrl("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Tournament not found</p>
        <Button variant="outline" onClick={() => navigate("/arena")}>
          Back to Arena
        </Button>
      </div>
    );
  }

  // Render based on tournament status
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${
          isCrewVsCrew 
            ? "from-red-950/40 via-background to-background" 
            : "from-gold/10 via-background to-background"
        }`} />
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${
          isCrewVsCrew ? "via-red-500/50" : "via-gold/50"
        } to-transparent`} />

        <div className="relative px-4 pt-5 pb-4">
          <button
            onClick={() => navigate("/arena")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Arena</span>
          </button>

          {/* Tournament Title Card */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-lg ${
              isCrewVsCrew 
                ? "bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/30" 
                : "bg-gradient-to-br from-gold to-amber-600 shadow-gold/30"
            }`}>
              {isCrewVsCrew ? (
                <Swords className="w-7 h-7 text-white" />
              ) : (
                <Shield className="w-7 h-7 text-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider ${
                  isCrewVsCrew 
                    ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                    : "bg-gold/20 text-gold border border-gold/30"
                }`}>
                  {isCrewVsCrew ? "Crew vs Crew" : "Sanctioned"}
                </span>
                <StatusBadge status={tournament.status} />
              </div>
              <h1 className="font-display text-xl text-foreground leading-tight">
                {tournament.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hosted by {tournament.crew_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Phase-specific content */}
      <AnimatePresence mode="wait">
        {(tournament.status === "approved" || tournament.status === "ready_up") && (
          <LobbyPhase
            tournament={tournament}
            participants={participants}
            readyParticipants={readyParticipants}
            isParticipant={isParticipant}
            isReady={isReady}
            minReached={minReached}
            maxReached={maxReached}
            onJoin={joinTournament}
            onLeave={leaveTournament}
            onReadyUp={readyUp}
            isCrewVsCrew={isCrewVsCrew}
          />
        )}

        {tournament.status === "live" && (
          <SubmissionPhase
            tournament={tournament}
            participants={participants}
            submittedParticipants={submittedParticipants}
            isParticipant={isParticipant}
            hasSubmitted={hasSubmitted}
            submissionUrl={submissionUrl}
            setSubmissionUrl={setSubmissionUrl}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {tournament.status === "bracket" && (
          <BracketPhase
            tournament={tournament}
            participants={participants}
          />
        )}

        {tournament.status === "completed" && (
          <CompletedPhase
            tournament={tournament}
            participants={participants}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    approved: { label: "FILLING", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30" },
    ready_up: { label: "READY UP", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/30" },
    live: { label: "LIVE", color: "text-red-400", bg: "bg-red-500/20 border-red-500/30" },
    bracket: { label: "JUDGING", color: "text-sky-400", bg: "bg-sky-500/20 border-sky-500/30" },
    completed: { label: "COMPLETE", color: "text-gold", bg: "bg-gold/20 border-gold/30" },
  };

  const c = config[status] || config.approved;
  
  return (
    <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider border ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  );
}

// ==================== LOBBY PHASE ====================
interface LobbyPhaseProps {
  tournament: any;
  participants: any[];
  readyParticipants: any[];
  isParticipant: boolean;
  isReady: boolean;
  minReached: boolean;
  maxReached: boolean;
  onJoin: () => Promise<boolean>;
  onLeave: () => Promise<boolean>;
  onReadyUp: () => Promise<boolean>;
  isCrewVsCrew: boolean;
}

function LobbyPhase({
  tournament,
  participants,
  readyParticipants,
  isParticipant,
  isReady,
  minReached,
  maxReached,
  onJoin,
  onLeave,
  onReadyUp,
  isCrewVsCrew,
}: LobbyPhaseProps) {
  const isReadyUpPhase = tournament.status === "ready_up";
  const readyDeadline = tournament.ready_up_deadline;
  
  // Calculate grid slots (show empty slots for FOMO effect)
  const maxSlots = Math.min(tournament.max_players, 100);
  const emptySlots = maxSlots - participants.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-6 space-y-6"
    >
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Users}
          label="Editors"
          value={`${tournament.player_count}/${tournament.max_players}`}
          accent={isCrewVsCrew ? "red" : "gold"}
        />
        <StatCard
          icon={Target}
          label="Minimum"
          value={`${tournament.min_players}`}
          accent={minReached ? "green" : "muted"}
        />
        <StatCard
          icon={CheckCircle}
          label="Ready"
          value={`${tournament.ready_count}/${tournament.min_players}`}
          accent={minReached ? "green" : "amber"}
        />
      </div>

      {/* Countdown Timer */}
      {isReadyUpPhase && readyDeadline && (
        <div className={`p-4 border text-center ${
          isCrewVsCrew 
            ? "bg-red-500/5 border-red-500/20" 
            : "bg-gold/5 border-gold/20"
        }`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Lobby Closes In
          </p>
          <CountdownTimer endDate={readyDeadline} large />
          <p className="text-[10px] text-muted-foreground mt-2">
            {maxReached ? "Max reached — Starting soon!" : minReached ? "Minimum reached — Ready up!" : `Need ${tournament.min_players - tournament.ready_count} more ready`}
          </p>
        </div>
      )}

      {/* Theme Lock Notice */}
      <div className="flex items-center gap-3 p-3 bg-surface-1 border border-border">
        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
          <Lock className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Theme Locked</p>
          <p className="text-[11px] text-muted-foreground">
            Theme will be revealed when the lobby ends — no early prep!
          </p>
        </div>
      </div>

      {/* Prize Pool */}
      {(tournament.first_place_index || tournament.index_prize) && (
        <div className="p-4 bg-gradient-to-br from-gold/10 via-surface-1 to-surface-1 border border-gold/20">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold text-gold uppercase tracking-wider">Prize Pool</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gold/10 border border-gold/20">
              <Crown className="w-4 h-4 text-gold mx-auto mb-1" />
              <p className="text-lg font-bold text-gold">{tournament.first_place_index || 200}</p>
              <p className="text-[9px] text-muted-foreground">1st Place</p>
            </div>
            <div className="text-center p-2 bg-surface-2 border border-border">
              <p className="text-lg font-bold text-foreground">{tournament.second_place_index || 100}</p>
              <p className="text-[9px] text-muted-foreground">2nd Place</p>
            </div>
            <div className="text-center p-2 bg-surface-2 border border-border">
              <p className="text-lg font-bold text-foreground">{tournament.third_place_index || 50}</p>
              <p className="text-[9px] text-muted-foreground">3rd Place</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            +{tournament.xp_reward || 100} XP for all participants
          </p>
        </div>
      )}

      {/* Participant Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Ready Lobby</h3>
          <span className="text-[10px] text-muted-foreground">
            {readyParticipants.length} ready / {participants.length} joined
          </span>
        </div>
        
        <div className="grid grid-cols-8 gap-2">
          {/* Show ready participants first */}
          {readyParticipants.map((p) => (
            <motion.div
              key={p.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <Avatar className="w-full aspect-square border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                  {p.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          ))}
          
          {/* Show non-ready participants */}
          {participants.filter((p) => !p.is_ready).map((p) => (
            <motion.div
              key={p.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative opacity-50"
            >
              <Avatar className="w-full aspect-square border border-border">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="bg-surface-2 text-muted-foreground text-[10px]">
                  {p.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          ))}
          
          {/* Show empty slots for FOMO */}
          {Array.from({ length: Math.min(emptySlots, 20) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-full aspect-square border border-dashed border-border/50 bg-surface-1/50 flex items-center justify-center"
            >
              <Users className="w-3 h-3 text-muted-foreground/30" />
            </div>
          ))}
        </div>
        
        {emptySlots > 20 && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            +{emptySlots - 20} more slots available
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isParticipant ? (
          <Button
            onClick={onJoin}
            disabled={maxReached}
            className={`w-full h-12 font-display text-sm uppercase tracking-wider ${
              isCrewVsCrew
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                : "bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-background"
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            {maxReached ? "Lobby Full" : "Join Tournament"}
          </Button>
        ) : isReadyUpPhase && !isReady ? (
          <Button
            onClick={onReadyUp}
            className="w-full h-12 font-display text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Ready Up
          </Button>
        ) : isReady ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-emerald-400">You're Ready!</span>
          </div>
        ) : null}

        {isParticipant && !isReady && tournament.status === "approved" && (
          <Button
            onClick={onLeave}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-red-400"
          >
            Leave Tournament
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ==================== SUBMISSION PHASE ====================
interface SubmissionPhaseProps {
  tournament: any;
  participants: any[];
  submittedParticipants: any[];
  isParticipant: boolean;
  hasSubmitted: boolean;
  submissionUrl: string;
  setSubmissionUrl: (url: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function SubmissionPhase({
  tournament,
  participants,
  submittedParticipants,
  isParticipant,
  hasSubmitted,
  submissionUrl,
  setSubmissionUrl,
  onSubmit,
  isSubmitting,
}: SubmissionPhaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-6 space-y-6"
    >
      {/* Live Banner */}
      <div className="p-4 bg-gradient-to-r from-red-500/20 via-red-500/10 to-transparent border border-red-500/30">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-red-400">TOURNAMENT LIVE</span>
        </div>
      </div>

      {/* Submission Deadline */}
      {tournament.submission_deadline && (
        <div className="p-4 bg-surface-1 border border-border text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Submissions Close In
          </p>
          <CountdownTimer endDate={tournament.submission_deadline} large />
        </div>
      )}

      {/* Theme Reveal */}
      {tournament.theme && (
        <div className="p-4 bg-gradient-to-br from-violet-500/10 via-surface-1 to-surface-1 border border-violet-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Theme</span>
          </div>
          <p className="text-lg font-display text-foreground">{tournament.theme}</p>
        </div>
      )}

      {/* Rules */}
      {tournament.rules && tournament.rules.length > 0 && (
        <div className="p-4 bg-surface-1 border border-border">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Rules</h3>
          <ul className="space-y-2">
            {tournament.rules.map((rule: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-gold">{i + 1}.</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submission Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label="Participants"
          value={`${participants.length}`}
          accent="gold"
        />
        <StatCard
          icon={Send}
          label="Submitted"
          value={`${submittedParticipants.length}`}
          accent={submittedParticipants.length > 0 ? "green" : "muted"}
        />
      </div>

      {/* Submission Form */}
      {isParticipant && (
        <div className="space-y-3">
          {hasSubmitted ? (
            <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">Submitted!</span>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Your Submission (TikTok/YouTube/Instagram URL)
                </label>
                <Input
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://tiktok.com/@you/video/..."
                  className="bg-surface-1 border-border"
                />
              </div>
              <Button
                onClick={onSubmit}
                disabled={!submissionUrl.trim() || isSubmitting}
                className="w-full h-12 font-display text-sm uppercase tracking-wider bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-background"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Entry"}
              </Button>
            </>
          )}
        </div>
      )}

      {!isParticipant && (
        <div className="p-4 bg-surface-1 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            You're not a participant in this tournament.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ==================== BRACKET PHASE ====================
function BracketPhase({ tournament, participants }: { tournament: any; participants: any[] }) {
  // Sort by QOI score for preliminary ranking
  const rankedParticipants = [...participants]
    .filter((p) => p.submitted_at)
    .sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-6 space-y-6"
    >
      {/* Judging Banner */}
      <div className="p-4 bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent border border-sky-500/30">
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-sky-400 animate-pulse" />
          <div>
            <span className="text-sm font-semibold text-sky-400">BRACKETS IN PROGRESS</span>
            <p className="text-[10px] text-muted-foreground">Judges are reviewing submissions</p>
          </div>
        </div>
      </div>

      {/* Bracket Visualization Placeholder */}
      <div className="p-6 bg-surface-1 border border-border text-center">
        <Swords className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-display text-lg text-foreground mb-2">Bracket View Coming</h3>
        <p className="text-sm text-muted-foreground">
          Full bracket visualization will appear here once judging begins.
        </p>
      </div>

      {/* Current Standings */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Current Standings</h3>
        <div className="space-y-2">
          {rankedParticipants.slice(0, 10).map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 border ${
                i === 0 ? "bg-gold/10 border-gold/30" : "bg-surface-1 border-border"
              }`}
            >
              <span className={`w-6 text-center font-bold ${
                i === 0 ? "text-gold" : i === 1 ? "text-foreground" : i === 2 ? "text-amber-600" : "text-muted-foreground"
              }`}>
                #{i + 1}
              </span>
              <Avatar className="w-8 h-8">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="bg-surface-2 text-xs">
                  {p.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium text-foreground truncate">
                {p.username}
              </span>
              {p.qoi_score && (
                <span className="text-xs font-mono text-gold">{p.qoi_score.toFixed(1)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ==================== COMPLETED PHASE ====================
function CompletedPhase({ tournament, participants }: { tournament: any; participants: any[] }) {
  const winners = [...participants]
    .filter((p) => p.final_rank)
    .sort((a, b) => (a.final_rank || 999) - (b.final_rank || 999))
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-6 space-y-6"
    >
      {/* Completion Banner */}
      <div className="p-4 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent border border-gold/30">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-gold" />
          <span className="text-sm font-semibold text-gold">TOURNAMENT COMPLETE</span>
        </div>
      </div>

      {/* Winners Podium */}
      {winners.length > 0 && (
        <div className="p-6 bg-gradient-to-br from-gold/10 via-surface-1 to-surface-1 border border-gold/20">
          <h3 className="text-center text-xs font-semibold text-gold uppercase tracking-wider mb-6">Champions</h3>
          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            {winners[1] && (
              <div className="text-center">
                <Avatar className="w-16 h-16 mx-auto border-2 border-foreground/50 mb-2">
                  <AvatarImage src={winners[1].avatar_url || undefined} />
                  <AvatarFallback className="bg-surface-2 text-lg">
                    {winners[1].username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold text-foreground">{winners[1].username}</p>
                <p className="text-xs text-muted-foreground">2nd</p>
              </div>
            )}
            
            {/* 1st Place */}
            {winners[0] && (
              <div className="text-center -mt-4">
                <Crown className="w-6 h-6 text-gold mx-auto mb-1" />
                <Avatar className="w-20 h-20 mx-auto border-4 border-gold shadow-lg shadow-gold/30 mb-2">
                  <AvatarImage src={winners[0].avatar_url || undefined} />
                  <AvatarFallback className="bg-gold/20 text-gold text-xl">
                    {winners[0].username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-base font-bold text-gold">{winners[0].username}</p>
                <p className="text-xs text-gold/70">Champion</p>
              </div>
            )}
            
            {/* 3rd Place */}
            {winners[2] && (
              <div className="text-center">
                <Avatar className="w-16 h-16 mx-auto border-2 border-amber-600/50 mb-2">
                  <AvatarImage src={winners[2].avatar_url || undefined} />
                  <AvatarFallback className="bg-surface-2 text-lg">
                    {winners[2].username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold text-foreground">{winners[2].username}</p>
                <p className="text-xs text-muted-foreground">3rd</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Participants" value={`${participants.length}`} accent="gold" />
        <StatCard icon={Send} label="Submissions" value={`${participants.filter((p) => p.submitted_at).length}`} accent="green" />
        <StatCard icon={Trophy} label="Index Awarded" value={`${tournament.first_place_index || 200}`} accent="gold" />
      </div>
    </motion.div>
  );
}

// ==================== STAT CARD ====================
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: "gold" | "red" | "green" | "amber" | "muted";
}) {
  const colors = {
    gold: "text-gold border-gold/30 bg-gold/5",
    red: "text-red-400 border-red-500/30 bg-red-500/5",
    green: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    amber: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    muted: "text-muted-foreground border-border bg-surface-1",
  };

  return (
    <div className={`p-3 border text-center ${colors[accent]}`}>
      <Icon className="w-4 h-4 mx-auto mb-1" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[9px] uppercase tracking-wider opacity-70">{label}</p>
    </div>
  );
}
