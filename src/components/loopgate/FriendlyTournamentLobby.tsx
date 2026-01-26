import { motion } from "framer-motion";
import { 
  ArrowLeft, Users, Clock, Trophy, Copy, CheckCircle2,
  Play, X, User, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFriendlyTournament } from "@/hooks/useFriendlyTournament";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

interface FriendlyTournamentLobbyProps {
  tournamentId: string;
  onBack: () => void;
  onStarted: () => void;
}

export default function FriendlyTournamentLobby({
  tournamentId,
  onBack,
  onStarted,
}: FriendlyTournamentLobbyProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    tournament,
    participants,
    loading,
    isParticipant,
    isCreator,
    joinTournament,
    leaveTournament,
    startTournament,
    cancelTournament,
  } = useFriendlyTournament(tournamentId);

  const [copied, setCopied] = useState(false);

  // Wrapper to check auth before joining
  const handleJoinTournament = async () => {
    if (!user) {
      localStorage.setItem("pending_friendly_tournament", JSON.stringify({
        tournamentId,
        tournamentName: tournament?.name,
      }));
      navigate(`/start?redirect=/arena/friendly/${tournamentId}`);
      return;
    }
    joinTournament();
  };

  if (loading || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If tournament has started, redirect to active view
  if (tournament.status === 'live' || tournament.status === 'bracket') {
    onStarted();
    return null;
  }

  const shareUrl = `${window.location.origin}/arena/friendly/${tournamentId}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    const success = await startTournament();
    if (success) {
      onStarted();
    }
  };

  const isFull = tournament.current_players >= tournament.max_players;
  const canStart = isCreator && tournament.current_players >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        <div className="relative px-4 pt-5 pb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-lg text-foreground truncate">
                {tournament.name}
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="bg-violet-500/20 text-violet-400 px-2 py-0.5">
                  FILLING
                </span>
                <span>•</span>
                <span>{tournament.duration_minutes} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Player Count */}
        <div className="bg-surface-1 border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Players</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-display text-lg text-violet-400">
                {tournament.current_players}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{tournament.max_players}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
              initial={{ width: 0 }}
              animate={{ width: `${(tournament.current_players / tournament.max_players) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Participant list */}
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-2 bg-surface-2/50 border border-border/50"
              >
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-violet-400">{index + 1}</span>
                </div>
                {participant.avatar_url ? (
                  <img
                    src={participant.avatar_url}
                    alt={participant.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm text-foreground flex-1 truncate">
                  {participant.username}
                </span>
                {participant.user_id === tournament.creator_id && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5">
                    HOST
                  </span>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: tournament.max_players - tournament.current_players }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 p-2 bg-surface-2/20 border border-dashed border-border/50"
              >
                <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {tournament.current_players + i + 1}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-surface-2" />
                <span className="text-sm text-muted-foreground italic">Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-surface-1 border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Share this link to invite friends:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-2 border border-border px-3 py-2 text-sm text-foreground truncate font-mono">
              {shareUrl}
            </div>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <div className="bg-surface-1 border border-border p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">
              About
            </p>
            <p className="text-sm text-muted-foreground">{tournament.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isCreator ? (
            <>
              <Button
                onClick={handleStart}
                disabled={!canStart}
                className="w-full py-5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-display uppercase tracking-wider"
              >
                <Play className="w-4 h-4 mr-2" />
                {isFull ? "Start Tournament" : `Start with ${tournament.current_players} Players`}
              </Button>
              {!isFull && (
                <p className="text-[10px] text-center text-muted-foreground">
                  {canStart ? "Or wait for more players to join" : "Need at least 2 players to start"}
                </p>
              )}
              <Button
                onClick={cancelTournament}
                variant="ghost"
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Tournament
              </Button>
            </>
          ) : isParticipant ? (
            <Button
              onClick={leaveTournament}
              variant="outline"
              className="w-full py-5 border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Leave Tournament
            </Button>
          ) : (
            <Button
              onClick={handleJoinTournament}
              disabled={isFull}
              className="w-full py-5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-display uppercase tracking-wider"
            >
              {isFull ? "Tournament Full" : "Join Tournament"}
            </Button>
          )}
        </div>

        {/* Judge info */}
        {tournament.judge_username && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-foreground">
                Judge: <span className="font-medium">@{tournament.judge_username}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
