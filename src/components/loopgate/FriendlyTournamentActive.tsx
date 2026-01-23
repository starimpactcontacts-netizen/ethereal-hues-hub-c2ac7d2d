import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Trophy, Clock, Users, Upload, CheckCircle2,
  User, Swords, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFriendlyTournament } from "@/hooks/useFriendlyTournament";
import { detectPlatform } from "@/lib/urlValidation";

interface FriendlyTournamentActiveProps {
  tournamentId: string;
  onBack: () => void;
}

export default function FriendlyTournamentActive({
  tournamentId,
  onBack,
}: FriendlyTournamentActiveProps) {
  const {
    tournament,
    participants,
    loading,
    isParticipant,
    isCreator,
    isJudge,
    submitToTournament,
  } = useFriendlyTournament(tournamentId);

  const [submissionUrl, setSubmissionUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Calculate time remaining
  useEffect(() => {
    if (!tournament?.started_at) return;

    const updateTimer = () => {
      const startTime = new Date(tournament.started_at!).getTime();
      const endTime = startTime + (tournament.duration_minutes * 60 * 1000);
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining("Time's up!");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tournament?.started_at, tournament?.duration_minutes]);

  if (loading || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const myParticipation = participants.find(p => p.user_id === tournament.creator_id);
  const hasSubmitted = participants.some(p => p.submitted_at);
  const allSubmitted = participants.every(p => p.submission_url);
  const submittedCount = participants.filter(p => p.submission_url).length;

  const handleSubmit = async () => {
    if (!submissionUrl.trim()) return;
    
    setIsSubmitting(true);
    try {
      const platform = detectPlatform(submissionUrl);
      await submitToTournament(submissionUrl, platform || 'other');
      setSubmissionUrl("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUserParticipant = participants.find(p => isParticipant);

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,hsl(var(--violet-500)/0.1),transparent_50%)]" />
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-pulse">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg text-foreground">{tournament.name}</h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 font-bold uppercase">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Friendly Competition</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="px-4 mt-4">
        <div className="bg-surface-1 border-2 border-violet-500/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-400" />
              <span className="text-sm font-bold text-violet-400 uppercase tracking-wider">
                Time Remaining
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              <span>{submittedCount}/{participants.length} submitted</span>
            </div>
          </div>
          
          <div className="text-center">
            <span className="font-display text-4xl text-foreground">{timeRemaining}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* My Submission */}
        {isParticipant && (
          <div className="bg-surface-1 border border-border p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              <Upload className="w-3.5 h-3.5 inline mr-2" />
              Your Submission
            </h3>

            {currentUserParticipant?.submission_url ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-foreground">Submitted!</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">
                  {currentUserParticipant.submission_url}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="Paste your video URL..."
                  className="bg-surface-2 border-border"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!submissionUrl.trim() || isSubmitting}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                >
                  {isSubmitting ? "Submitting..." : "Submit Entry"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Participants Status */}
        <div className="bg-surface-1 border border-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            <Users className="w-3.5 h-3.5 inline mr-2" />
            Competitors
          </h3>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center gap-3 p-3 border ${
                  participant.submission_url
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-surface-2/50 border-border/50'
                }`}
              >
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
                <span className="text-sm text-foreground flex-1">{participant.username}</span>
                {participant.submission_url ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Judge Actions */}
        {(isJudge || isCreator) && allSubmitted && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">All Submitted!</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Everyone has submitted. As the {isJudge ? 'judge' : 'host'}, you can now review entries and pick a winner.
            </p>
            <Button 
              className="w-full bg-amber-500 text-background hover:bg-amber-400"
              onClick={() => {/* TODO: Judge scoring modal */}}
            >
              Review & Pick Winner
            </Button>
          </div>
        )}

        {/* Waiting message */}
        {!allSubmitted && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Waiting for all competitors to submit...
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
