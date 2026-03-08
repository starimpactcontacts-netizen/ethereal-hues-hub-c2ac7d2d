import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Trophy, Users, Clock, Shield, CheckCircle, Lock, Send,
  AlertCircle, Swords, Sparkles, Timer, Zap, Crown, Target,
  ChevronDown, ChevronUp, HelpCircle, Share2, Eye, Medal, Star,
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
import TournamentInviteModal from "@/components/loopgate/TournamentInviteModal";
import TournamentChat from "@/components/loopgate/TournamentChat";

const teko = { fontFamily: "Teko, sans-serif" };

export default function SanctionedTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    tournament, participants, loading, isParticipant,
    userParticipation, joinTournament, leaveTournament, readyUp, refetch,
  } = useSanctionedTournament(id || null);

  const [submissionUrl, setSubmissionUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleJoinTournament = async () => {
    if (!user) {
      localStorage.setItem("pending_tournament_join", JSON.stringify({
        tournamentId: id, tournamentName: tournament?.name,
      }));
      navigate(`/start?redirect=/sanctioned/${id}`);
      return false;
    }
    return joinTournament();
  };

  const isReady = userParticipation?.is_ready || false;
  const hasSubmitted = !!userParticipation?.submitted_at;
  const readyParticipants = participants.filter((p) => p.is_ready);
  const submittedParticipants = participants.filter((p) => p.submitted_at);
  const minReached = (tournament?.ready_count || 0) >= (tournament?.min_players || 20);
  const maxReached = (tournament?.player_count || 0) >= (tournament?.max_players || 100);
  const isCrewVsCrew = tournament?.tournament_mode === "crew_vs_crew";

  const handleSubmit = async () => {
    if (!user || !id || !submissionUrl.trim()) return;
    setIsSubmitting(true);
    try {
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
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Tournament not found</p>
        <Button variant="outline" onClick={() => navigate("/arena")}>Back to Arena</Button>
      </div>
    );
  }

  const accentGradient = isCrewVsCrew
    ? "from-red-950/60 via-red-900/20 to-background"
    : "from-amber-950/60 via-amber-900/20 to-background";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background pb-32">
      {/* ━━━ CINEMATIC HEADER ━━━ */}
      <div className="relative overflow-hidden">
        {/* Poster Background */}
        {tournament.poster_url && (
          <div className="absolute inset-0 h-48">
            <img src={tournament.poster_url} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b ${accentGradient}`} />
        
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${
          isCrewVsCrew ? "bg-gradient-to-r from-transparent via-red-500 to-transparent" : "bg-gradient-to-r from-transparent via-gold to-transparent"
        }`} />

        <div className="relative px-4 pt-5 pb-5" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}>
          {/* Nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate("/arena")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-widest font-bold" style={teko}>Arena</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInviteModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                  isCrewVsCrew 
                    ? "border-red-500/30 text-red-400 hover:bg-red-500/10" 
                    : "border-gold/30 text-gold hover:bg-gold/10"
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                Invite
              </button>
              <TournamentChat tournamentId={tournament.id} />
            </div>
          </div>

          {/* Title Card */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 flex items-center justify-center shadow-xl overflow-hidden shrink-0 border ${
              isCrewVsCrew 
                ? "bg-gradient-to-br from-red-600 to-red-800 border-red-500/40 shadow-red-500/30" 
                : "bg-gradient-to-br from-amber-500 to-amber-700 border-gold/40 shadow-gold/30"
            }`}>
              {tournament.crew_avatar_url ? (
                <img src={tournament.crew_avatar_url} alt={tournament.crew_name} className="w-full h-full object-cover" />
              ) : isCrewVsCrew ? (
                <Swords className="w-7 h-7 text-white" />
              ) : (
                <Shield className="w-7 h-7 text-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[9px] px-2 py-0.5 font-black uppercase tracking-wider border ${
                  isCrewVsCrew 
                    ? "bg-red-500/15 text-red-400 border-red-500/30" 
                    : "bg-gold/15 text-gold border-gold/30"
                }`} style={teko}>
                  {isCrewVsCrew ? "Unit vs Unit" : "Sanctioned"}
                </span>
                <StatusBadge status={tournament.status} />
              </div>
              <h1 className="text-xl font-black uppercase tracking-wide text-foreground leading-tight" style={teko}>
                {tournament.name}
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Hosted by <span className={isCrewVsCrew ? "text-red-400" : "text-gold"}>{tournament.crew_name}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Phase-specific content */}
      <AnimatePresence mode="wait">
        {(tournament.status === "approved" || tournament.status === "ready_up") && (
          <LobbyPhase
            tournament={tournament} participants={participants}
            readyParticipants={readyParticipants} isParticipant={isParticipant}
            isReady={isReady} minReached={minReached} maxReached={maxReached}
            onJoin={handleJoinTournament} onLeave={leaveTournament}
            onReadyUp={readyUp} isCrewVsCrew={isCrewVsCrew}
          />
        )}
        {tournament.status === "live" && (
          <SubmissionPhase
            tournament={tournament} participants={participants}
            submittedParticipants={submittedParticipants} isParticipant={isParticipant}
            hasSubmitted={hasSubmitted} submissionUrl={submissionUrl}
            setSubmissionUrl={setSubmissionUrl} onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        {tournament.status === "bracket" && (
          <BracketPhase tournament={tournament} participants={participants} />
        )}
        {tournament.status === "completed" && (
          <CompletedPhase tournament={tournament} participants={participants} />
        )}
      </AnimatePresence>

      <TournamentInviteModal
        open={showInviteModal} onOpenChange={setShowInviteModal}
        tournamentName={tournament.name} tournamentId={tournament.id}
        tournamentSlug={tournament.slug} crewName={tournament.crew_name}
        posterUrl={tournament.poster_url} playerCount={participants.length}
        maxPlayers={tournament.max_players} isCrewVsCrew={isCrewVsCrew}
      />
    </motion.div>
  );
}

// ━━━ STATUS BADGE ━━━
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    approved: { label: "FILLING", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
    ready_up: { label: "READY UP", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
    live: { label: "LIVE", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30" },
    bracket: { label: "JUDGING", color: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/30" },
    completed: { label: "COMPLETE", color: "text-gold", bg: "bg-gold/15 border-gold/30" },
  };
  const c = config[status] || config.approved;
  return (
    <span className={`text-[9px] px-2 py-0.5 font-black uppercase tracking-wider border ${c.bg} ${c.color}`} style={teko}>
      {c.label}
    </span>
  );
}

// ━━━ LOBBY PHASE ━━━
function LobbyPhase({
  tournament, participants, readyParticipants, isParticipant,
  isReady, minReached, maxReached, onJoin, onLeave, onReadyUp, isCrewVsCrew,
}: any) {
  const [showGuide, setShowGuide] = useState(false);
  const isReadyUpPhase = tournament.status === "ready_up";
  const totalSlots = tournament.max_players || 64;
  const emptySlots = Math.max(0, totalSlots - participants.length);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-4 py-4 space-y-4">
      {/* Stats Bar */}
      <div className={`relative overflow-hidden p-4 border ${
        isCrewVsCrew 
          ? "bg-gradient-to-br from-red-950/30 via-card to-card border-red-500/20" 
          : "bg-gradient-to-br from-amber-950/30 via-card to-card border-gold/20"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 flex items-center justify-center ${isCrewVsCrew ? "bg-red-500/15" : "bg-gold/15"}`}>
              <Users className={`w-5 h-5 ${isCrewVsCrew ? "text-red-400" : "text-gold"}`} />
            </div>
            <div>
              <p className="text-3xl font-black text-foreground leading-none" style={teko}>
                {participants.length}<span className="text-lg text-muted-foreground">/{totalSlots}</span>
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Editors Joined</p>
            </div>
          </div>
          {isReadyUpPhase && tournament.ready_up_deadline ? (
            <div className="text-right">
              <CountdownTimer endDate={tournament.ready_up_deadline} />
              <p className="text-[9px] text-amber-400 uppercase tracking-widest mt-0.5">Ready-Up</p>
            </div>
          ) : (
            <div className="text-right">
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${minReached ? "text-emerald-400" : "text-amber-400"}`} />
                <span className="text-2xl font-black text-foreground" style={teko}>{tournament.ready_count}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">min {tournament.min_players} to start</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div>
        {!isParticipant ? (
          <Button
            onClick={onJoin} disabled={maxReached}
            className={`w-full h-14 text-[16px] font-black uppercase tracking-wider shadow-lg ${
              isCrewVsCrew
                ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/30"
                : "bg-gradient-to-r from-amber-600 via-gold to-amber-600 hover:from-gold hover:to-amber-500 text-background shadow-gold/30"
            }`}
            style={teko}
          >
            <Zap className="w-5 h-5 mr-2" />
            {maxReached ? "Lobby Full" : "Enter Lobby"}
          </Button>
        ) : !isReady ? (
          <Button
            onClick={onReadyUp}
            className="w-full h-14 text-[16px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/30"
            style={teko}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Ready Up
          </Button>
        ) : (
          <div className={`w-full h-14 flex items-center justify-center gap-2 border ${
            isCrewVsCrew ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"
          }`}>
            <CheckCircle className={`w-5 h-5 ${isCrewVsCrew ? "text-red-400" : "text-emerald-400"}`} />
            <span className={`text-[16px] font-black uppercase ${isCrewVsCrew ? "text-red-400" : "text-emerald-400"}`} style={teko}>
              You're Ready
            </span>
          </div>
        )}
      </div>

      {/* Lobby Grid */}
      <div className={`relative p-4 border ${isCrewVsCrew ? "border-red-500/15" : "border-gold/15"} bg-card`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isCrewVsCrew ? "text-red-400" : "text-gold"}`} />
            <span className="text-[13px] font-black uppercase tracking-wider text-foreground" style={teko}>Lobby</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{readyParticipants.length} ready</span>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
          {readyParticipants.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.02, type: "spring", stiffness: 400 }} className="relative group">
              <Avatar className={`w-full aspect-square border-2 shadow-lg ${
                isCrewVsCrew ? "border-red-500 shadow-red-500/30" : "border-emerald-500 shadow-emerald-500/30"
              }`}>
                <AvatarImage src={p.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className={`text-[10px] font-bold ${isCrewVsCrew ? "bg-red-500/30 text-red-300" : "bg-emerald-500/30 text-emerald-300"}`}>
                  {p.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${isCrewVsCrew ? "bg-red-500" : "bg-emerald-500"}`}>
                <CheckCircle className="w-2.5 h-2.5 text-white" />
              </div>
            </motion.div>
          ))}
          
          {participants.filter((p: any) => !p.is_ready).map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: (readyParticipants.length + i) * 0.02 }}>
              <Avatar className="w-full aspect-square border border-border opacity-50">
                <AvatarImage src={p.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">{p.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
            </motion.div>
          ))}
          
          {Array.from({ length: Math.min(emptySlots, 48) }).map((_, i) => (
            <div key={`e-${i}`} className={`w-full aspect-square border border-dashed flex items-center justify-center ${
              isCrewVsCrew ? "border-red-500/8 bg-red-500/3" : "border-gold/8 bg-gold/3"
            }`}>
              <Users className="w-2.5 h-2.5 text-muted-foreground/15" />
            </div>
          ))}
        </div>
        {emptySlots > 48 && <p className="text-[10px] text-muted-foreground text-center mt-3">+{emptySlots - 48} more slots</p>}
      </div>

      {isParticipant && !isReady && tournament.status === "approved" && (
        <button onClick={onLeave} className="w-full py-2 text-xs text-muted-foreground hover:text-destructive transition-colors">Leave Tournament</button>
      )}

      {/* Prize Pool */}
      {(tournament.first_place_index || tournament.index_prize) && (
        <div className="p-4 bg-gradient-to-r from-gold/8 via-card to-card border border-gold/20">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="text-[12px] font-black text-gold uppercase tracking-wider" style={teko}>Prize Pool</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-gold/10 border border-gold/20">
              <Crown className="w-4 h-4 text-gold mx-auto mb-1" />
              <p className="text-xl font-black text-gold" style={teko}>{tournament.first_place_index || 200}</p>
              <p className="text-[8px] text-gold/60 uppercase tracking-widest">1st Place</p>
            </div>
            <div className="text-center p-2 bg-muted/20 border border-border">
              <Medal className="w-4 h-4 text-foreground/60 mx-auto mb-1" />
              <p className="text-xl font-black text-foreground" style={teko}>{tournament.second_place_index || 100}</p>
              <p className="text-[8px] text-muted-foreground uppercase tracking-widest">2nd Place</p>
            </div>
            <div className="text-center p-2 bg-muted/20 border border-border">
              <Medal className="w-4 h-4 text-amber-600/60 mx-auto mb-1" />
              <p className="text-xl font-black text-foreground" style={teko}>{tournament.third_place_index || 50}</p>
              <p className="text-[8px] text-muted-foreground uppercase tracking-widest">3rd Place</p>
            </div>
          </div>
        </div>
      )}

      {tournament.description && (
        <div className="p-3 bg-card border border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{tournament.description}</p>
        </div>
      )}

      <div className="flex items-center gap-3 p-3 bg-violet-500/5 border border-violet-500/20">
        <Lock className="w-4 h-4 text-violet-400" />
        <div className="flex-1">
          <span className="text-sm text-foreground">Theme Locked</span>
          <span className="text-xs text-muted-foreground ml-2">Revealed when lobby closes</span>
        </div>
      </div>

      {/* How It Works */}
      <div className="border border-border bg-card overflow-hidden">
        <button onClick={() => setShowGuide(!showGuide)} className="w-full flex items-center justify-between p-3 hover:bg-muted/10 transition-colors">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">How It Works</span>
          </div>
          {showGuide ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {showGuide && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
              <div className="p-4 space-y-3">
                {[
                  { n: 1, color: "emerald", title: "Lobby Phase", desc: `Join and ready up. Min ${tournament.min_players}, max ${tournament.max_players}.` },
                  { n: 2, color: "amber", title: "Submission", desc: `Theme revealed! ${tournament.duration_hours}h to submit.` },
                  { n: 3, color: "sky", title: "Bracket", desc: "Single elimination judged by QOI." },
                ].map(step => (
                  <div key={step.n} className="flex gap-3">
                    <div className={`w-6 h-6 rounded-full bg-${step.color}-500/20 flex items-center justify-center shrink-0`}>
                      <span className={`text-[10px] font-bold text-${step.color}-400`}>{step.n}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ━━━ SUBMISSION PHASE ━━━
function SubmissionPhase({
  tournament, participants, submittedParticipants, isParticipant,
  hasSubmitted, submissionUrl, setSubmissionUrl, onSubmit, isSubmitting,
}: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-4 py-6 space-y-5">
      {/* Live Banner */}
      <div className="p-4 bg-gradient-to-r from-red-500/15 via-red-500/5 to-transparent border border-red-500/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
          <span className="text-[14px] font-black text-red-400 uppercase tracking-wider" style={teko}>Tournament Live</span>
        </div>
      </div>

      {tournament.submission_deadline && (
        <div className="p-5 bg-card border border-border text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Submissions Close In</p>
          <CountdownTimer endDate={tournament.submission_deadline} large />
        </div>
      )}

      {tournament.theme && (
        <div className="p-4 bg-gradient-to-br from-violet-500/8 via-card to-card border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-[11px] font-black text-violet-400 uppercase tracking-wider" style={teko}>Theme</span>
          </div>
          <p className="text-lg font-black text-foreground uppercase" style={teko}>{tournament.theme}</p>
        </div>
      )}

      {tournament.rules && tournament.rules.length > 0 && (
        <div className="p-4 bg-card border border-border">
          <h3 className="text-[11px] font-black text-foreground uppercase tracking-wider mb-3" style={teko}>Rules</h3>
          <ul className="space-y-2">
            {tournament.rules.map((rule: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-gold font-bold">{i + 1}.</span> {rule}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Participants" value={`${participants.length}`} accent="gold" />
        <StatCard icon={Send} label="Submitted" value={`${submittedParticipants.length}`} accent={submittedParticipants.length > 0 ? "green" : "muted"} />
      </div>

      {isParticipant && (
        <div className="space-y-3">
          {hasSubmitted ? (
            <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-[14px] font-black text-emerald-400 uppercase" style={teko}>Submitted!</span>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">
                  Your Submission (TikTok/YouTube/Instagram URL)
                </label>
                <Input value={submissionUrl} onChange={(e) => setSubmissionUrl(e.target.value)} placeholder="https://tiktok.com/@you/video/..." className="bg-card border-border" />
              </div>
              <Button onClick={onSubmit} disabled={!submissionUrl.trim() || isSubmitting}
                className="w-full h-12 text-[14px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 via-gold to-amber-600 hover:from-gold hover:to-amber-500 text-background" style={teko}
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Entry"}
              </Button>
            </>
          )}
        </div>
      )}

      {!isParticipant && (
        <div className="p-4 bg-card border border-border text-center">
          <p className="text-sm text-muted-foreground">You're not a participant in this tournament.</p>
        </div>
      )}
    </motion.div>
  );
}

// ━━━ BRACKET PHASE ━━━
function BracketPhase({ tournament, participants }: { tournament: any; participants: any[] }) {
  const submittedParticipants = participants.filter((p) => p.submitted_at);
  const rankedParticipants = [...submittedParticipants].sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-4 py-6 space-y-5">
      <div className="p-4 bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent border border-sky-500/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500" />
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-sky-400 animate-pulse" />
          <div>
            <span className="text-[14px] font-black text-sky-400 uppercase tracking-wider" style={teko}>Brackets In Progress</span>
            <p className="text-[10px] text-muted-foreground">Judges are reviewing matchups</p>
          </div>
        </div>
      </div>

      <BracketTree participants={submittedParticipants} />

      <div>
        <h3 className="text-[13px] font-black text-foreground uppercase tracking-wider mb-3" style={teko}>Current Standings</h3>
        <div className="space-y-1.5">
          {rankedParticipants.slice(0, 10).map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 p-3 border transition-colors ${
              i === 0 ? "bg-gold/8 border-gold/20" : "bg-card border-border"
            }`}>
              <span className={`w-6 text-center text-sm font-black ${
                i === 0 ? "text-gold" : i === 1 ? "text-foreground" : i === 2 ? "text-amber-600" : "text-muted-foreground"
              }`} style={teko}>#{i + 1}</span>
              <Avatar className="w-8 h-8 border border-border">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-xs">{p.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium text-foreground truncate">{p.username}</span>
              {p.qoi_score && <span className="text-xs font-mono font-bold text-gold">{p.qoi_score.toFixed(1)}</span>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ━━━ COMPLETED PHASE ━━━
function CompletedPhase({ tournament, participants }: { tournament: any; participants: any[] }) {
  const [showBracket, setShowBracket] = useState(true);
  const winners = [...participants].filter((p) => p.final_rank).sort((a, b) => (a.final_rank || 999) - (b.final_rank || 999)).slice(0, 3);
  const rankedParticipants = [...participants].filter((p) => p.submitted_at).sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-4 py-6 space-y-5">
      {/* Completion Banner */}
      <div className="p-4 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent border border-gold/25 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold via-amber-400 to-gold" />
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-gold" />
          <span className="text-[14px] font-black text-gold uppercase tracking-wider" style={teko}>Tournament Complete</span>
        </div>
      </div>

      {/* ━━━ CHAMPIONS PODIUM ━━━ */}
      {winners.length > 0 && (
        <div className="relative p-6 border border-gold/20 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-gold/8 via-card to-card" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold/10 rounded-full blur-3xl" />
          
          <div className="relative">
            <h3 className="text-center text-[14px] font-black text-gold uppercase tracking-[0.3em] mb-6" style={teko}>Champions</h3>
            
            <div className="flex items-end justify-center gap-3 sm:gap-6">
              {/* 2nd Place */}
              {winners[1] && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center flex-1 max-w-[100px]">
                  <div className="relative mx-auto w-fit mb-2">
                    <Avatar className="w-16 h-16 border-2 border-foreground/30 shadow-lg">
                      <AvatarImage src={winners[1].avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-lg font-bold">{winners[1].username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-foreground/80 rounded-full flex items-center justify-center">
                      <span className="text-[9px] font-black text-background">2</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">{winners[1].username}</p>
                  <p className="text-[10px] text-muted-foreground">2nd Place</p>
                  {winners[1].qoi_score && <p className="text-[10px] font-mono text-gold mt-0.5">{winners[1].qoi_score.toFixed(1)} QOI</p>}
                </motion.div>
              )}
              
              {/* 1st Place */}
              {winners[0] && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }} className="text-center flex-1 max-w-[120px] -mt-6">
                  <Crown className="w-8 h-8 text-gold mx-auto mb-2 drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]" />
                  <div className="relative mx-auto w-fit mb-2">
                    <div className="absolute -inset-1 bg-gradient-to-b from-gold/40 to-gold/10 rounded-full animate-pulse" />
                    <Avatar className="relative w-20 h-20 border-[3px] border-gold shadow-xl shadow-gold/30">
                      <AvatarImage src={winners[0].avatar_url || undefined} />
                      <AvatarFallback className="bg-gold/20 text-gold text-xl font-black">{winners[0].username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-base font-black text-gold" style={teko}>{winners[0].username}</p>
                  <p className="text-[10px] text-gold/70">Champion</p>
                  {winners[0].qoi_score && <p className="text-xs font-mono font-bold text-gold mt-0.5">{winners[0].qoi_score.toFixed(1)} QOI</p>}
                </motion.div>
              )}
              
              {/* 3rd Place */}
              {winners[2] && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center flex-1 max-w-[100px]">
                  <div className="relative mx-auto w-fit mb-2">
                    <Avatar className="w-16 h-16 border-2 border-amber-600/40 shadow-lg">
                      <AvatarImage src={winners[2].avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-lg font-bold">{winners[2].username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-700 rounded-full flex items-center justify-center">
                      <span className="text-[9px] font-black text-white">3</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">{winners[2].username}</p>
                  <p className="text-[10px] text-muted-foreground">3rd Place</p>
                  {winners[2].qoi_score && <p className="text-[10px] font-mono text-gold mt-0.5">{winners[2].qoi_score.toFixed(1)} QOI</p>}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Users} label="Participants" value={`${participants.length}`} accent="gold" />
        <StatCard icon={Send} label="Submissions" value={`${participants.filter((p: any) => p.submitted_at).length}`} accent="green" />
        <StatCard icon={Trophy} label="Index Awarded" value={`${tournament.first_place_index || 0}`} accent="gold" />
      </div>

      {/* Bracket History */}
      <div className="border border-gold/15 bg-card overflow-hidden">
        <button onClick={() => setShowBracket(!showBracket)} className="w-full p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gold" />
            <span className="text-[13px] font-black uppercase tracking-wider text-foreground" style={teko}>Bracket History</span>
          </div>
          {showBracket ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {showBracket && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="border-t border-gold/10"><BracketTree participants={participants} /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* All Submissions */}
      {rankedParticipants.length > 0 && (
        <div className="border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span className="text-[13px] font-black uppercase tracking-wider text-foreground" style={teko}>All Submissions</span>
              <span className="text-xs text-muted-foreground ml-auto">{rankedParticipants.length} edits</span>
            </div>
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {rankedParticipants.map((p: any, index: number) => (
              <div key={p.id} className="p-3 flex items-center gap-3 hover:bg-muted/10 transition-colors">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  index === 0 ? "bg-gold/20 text-gold" : index === 1 ? "bg-foreground/15 text-foreground" : index === 2 ? "bg-amber-600/20 text-amber-500" : "bg-muted text-muted-foreground"
                }`} style={teko}>{index + 1}</div>
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-xs">{p.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.username}</p>
                  {p.submission_platform && <p className="text-[10px] text-muted-foreground capitalize">{p.submission_platform}</p>}
                </div>
                {p.qoi_score !== null && (
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-gold">{p.qoi_score.toFixed(1)}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">QOI</p>
                  </div>
                )}
                {p.submission_url && (
                  <a href={p.submission_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ━━━ STAT CARD ━━━
function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string;
  accent: "gold" | "red" | "green" | "amber" | "muted";
}) {
  const colors = {
    gold: "text-gold border-gold/20 bg-gold/5",
    red: "text-red-400 border-red-500/20 bg-red-500/5",
    green: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    muted: "text-muted-foreground border-border bg-card",
  };
  return (
    <div className={`p-3 border text-center ${colors[accent]}`}>
      <Icon className="w-4 h-4 mx-auto mb-1" />
      <p className="text-xl font-black" style={teko}>{value}</p>
      <p className="text-[8px] uppercase tracking-[0.15em] opacity-60">{label}</p>
    </div>
  );
}
