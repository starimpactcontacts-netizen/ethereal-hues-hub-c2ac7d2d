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
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useSanctionedTournament } from "@/hooks/useSanctionedTournaments";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import BracketTree from "@/components/loopgate/BracketTree";

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
  const [showGuide, setShowGuide] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const isReadyUpPhase = tournament.status === "ready_up";
  const readyDeadline = tournament.ready_up_deadline;
  
  // Only show first 6 participants in preview, rest on expand
  const previewParticipants = participants.slice(0, 6);
  const remainingCount = Math.max(0, tournament.max_players - 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-4 space-y-4"
    >
      {/* ========== HERO ACTION SECTION - JOIN BUTTON FIRST ========== */}
      <div className={`relative overflow-hidden p-5 border ${
        isCrewVsCrew 
          ? "bg-gradient-to-br from-red-950/60 via-surface-1 to-surface-1 border-red-500/40" 
          : "bg-gradient-to-br from-gold/15 via-surface-1 to-surface-1 border-gold/40"
      }`}>
        {/* Glow effect */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 blur-3xl ${
          isCrewVsCrew ? "bg-red-500/20" : "bg-gold/20"
        }`} />
        
        <div className="relative">
          {/* Countdown if in ready-up phase */}
          {isReadyUpPhase && readyDeadline && (
            <div className="text-center mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Lobby Closes In
              </p>
              <CountdownTimer endDate={readyDeadline} large />
            </div>
          )}

          {/* Main CTA - THE BUTTON */}
          {!isParticipant ? (
            <Button
              onClick={onJoin}
              disabled={maxReached}
              className={`w-full h-14 font-display text-base uppercase tracking-wider shadow-lg ${
                isCrewVsCrew
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30"
                  : "bg-gradient-to-r from-gold via-amber-400 to-gold hover:from-amber-500 hover:via-gold hover:to-amber-500 text-background shadow-gold/30"
              }`}
            >
              <Zap className="w-5 h-5 mr-2" />
              {maxReached ? "Lobby Full" : "Join Tournament"}
            </Button>
          ) : isReadyUpPhase && !isReady ? (
            <Button
              onClick={onReadyUp}
              className="w-full h-14 font-display text-base uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Ready Up
            </Button>
          ) : isReady ? (
            <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <span className="font-display text-lg text-emerald-400">You're Ready!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 p-4 bg-surface-2 border border-border">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-medium text-foreground">Joined — Waiting for ready-up phase</span>
            </div>
          )}

          {/* Quick leave option */}
          {isParticipant && !isReady && tournament.status === "approved" && (
            <button
              onClick={onLeave}
              className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              Leave Tournament
            </button>
          )}

          {/* Quick stats inline */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className={`w-4 h-4 ${isCrewVsCrew ? "text-red-400" : "text-gold"}`} />
              <span className="text-foreground font-semibold">{tournament.player_count}</span>
              <span className="text-muted-foreground">/ {tournament.max_players}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <CheckCircle className={`w-4 h-4 ${minReached ? "text-emerald-400" : "text-amber-400"}`} />
              <span className="text-foreground font-semibold">{tournament.ready_count}</span>
              <span className="text-muted-foreground">ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prize Pool - Compact */}
      {(tournament.first_place_index || tournament.index_prize) && (
        <div className="p-3 bg-gradient-to-r from-gold/10 via-surface-1 to-surface-1 border border-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              <span className="text-xs font-semibold text-gold uppercase tracking-wider">Prizes</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span><span className="font-bold text-gold">{tournament.first_place_index || 200}</span> <span className="text-muted-foreground text-xs">1st</span></span>
              <span><span className="font-bold text-foreground">{tournament.second_place_index || 100}</span> <span className="text-muted-foreground text-xs">2nd</span></span>
              <span><span className="font-bold text-foreground">{tournament.third_place_index || 50}</span> <span className="text-muted-foreground text-xs">3rd</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Theme Lock Notice - More compact */}
      <div className="flex items-center gap-3 p-3 bg-violet-500/5 border border-violet-500/20">
        <Lock className="w-4 h-4 text-violet-400" />
        <div className="flex-1">
          <span className="text-sm text-foreground">Theme Locked</span>
          <span className="text-xs text-muted-foreground ml-2">Revealed when lobby closes</span>
        </div>
      </div>

      {/* How It Works - Collapsible */}
      <div className="border border-border bg-surface-1 overflow-hidden">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-3 hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">How It Works</span>
          </div>
          {showGuide ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border"
            >
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-emerald-400">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Lobby Phase</p>
                    <p className="text-xs text-muted-foreground">Join and ready up. Min {tournament.min_players}, max {tournament.max_players}.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-amber-400">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Submission</p>
                    <p className="text-xs text-muted-foreground">Theme revealed! {tournament.duration_hours}h to submit.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-sky-400">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Bracket</p>
                    <p className="text-xs text-muted-foreground">Judged by QOI. Single elimination.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Participant Preview - Compact Grid */}
      <div className="border border-border bg-surface-1 overflow-hidden">
        <button
          onClick={() => setShowAllSlots(!showAllSlots)}
          className="w-full flex items-center justify-between p-3 hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {showAllSlots ? "Ready Lobby" : `${participants.length} Editors Joined`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!showAllSlots && participants.length > 0 && (
              <div className="flex -space-x-2">
                {previewParticipants.slice(0, 4).map((p) => (
                  <Avatar key={p.id} className="w-6 h-6 border-2 border-surface-1">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-surface-2 text-[8px]">
                      {p.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-surface-2 border-2 border-surface-1 flex items-center justify-center">
                    <span className="text-[8px] text-muted-foreground">+{participants.length - 4}</span>
                  </div>
                )}
              </div>
            )}
            {showAllSlots ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {showAllSlots && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border p-3"
            >
              <div className="grid grid-cols-8 gap-2">
                {/* Ready participants */}
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
                
                {/* Non-ready participants */}
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
                
                {/* Empty slots - only show 12 max */}
                {Array.from({ length: Math.min(tournament.max_players - participants.length, 12) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-full aspect-square border border-dashed border-border/30 bg-surface-1/50 flex items-center justify-center"
                  >
                    <Users className="w-3 h-3 text-muted-foreground/20" />
                  </div>
                ))}
              </div>
              
              {tournament.max_players - participants.length > 12 && (
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  +{tournament.max_players - participants.length - 12} more slots
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
  // Filter to only submitted participants
  const submittedParticipants = participants.filter((p) => p.submitted_at);
  const rankedParticipants = [...submittedParticipants]
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
            <p className="text-[10px] text-muted-foreground">Judges are reviewing matchups</p>
          </div>
        </div>
      </div>

      {/* Visual Bracket Tree */}
      <BracketTree participants={submittedParticipants} />

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
