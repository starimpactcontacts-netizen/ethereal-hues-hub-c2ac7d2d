import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Clock, User, Zap, CheckCircle2, 
  AlertCircle, Loader2, Send, Trophy, Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePracticeMatch, PracticeMatch } from "@/hooks/usePracticeMatch";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";

interface PracticeMatchViewProps {
  matchId: string;
  onBack: () => void;
}

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", color: "text-pink-400" },
  { id: "instagram", label: "Instagram", color: "text-purple-400" },
  { id: "youtube", label: "YouTube", color: "text-red-400" },
];

export default function PracticeMatchView({ matchId, onBack }: PracticeMatchViewProps) {
  const { user } = useAuth();
  const { activeMatch, myMatches, submitToMatch, loading, checkStatus } = usePracticeMatch();
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Find the match
  const match = activeMatch?.id === matchId 
    ? activeMatch 
    : myMatches.find(m => m.id === matchId);

  const isPlayer1 = match?.player_1_id === user?.id;
  const mySubmission = isPlayer1 
    ? match?.player_1_submitted_at 
    : match?.player_2_submitted_at;
  const opponentSubmission = isPlayer1 
    ? match?.player_2_submitted_at 
    : match?.player_1_submitted_at;
  const opponent = isPlayer1 ? match?.player_2 : match?.player_1;
  const me = isPlayer1 ? match?.player_1 : match?.player_2;

  // Timer countdown
  useEffect(() => {
    if (!match?.ends_at) return;

    const updateTimer = () => {
      const endsAt = new Date(match.ends_at!);
      const now = new Date();
      const diff = differenceInSeconds(endsAt, now);

      if (diff <= 0) {
        setTimeLeft("Time's up!");
        return;
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [match?.ends_at]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSubmit = async () => {
    if (!submissionUrl || !platform) return;
    await submitToMatch(matchId, submissionUrl, platform);
    setSubmissionUrl("");
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const isCompleted = match.status === "completed";
  const isJudging = match.status === "judging";
  const didIWin = match.winner_id === user?.id;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        <div className="relative px-4 pt-5 pb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl text-foreground tracking-wide">
                1v1 MATCH
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {match.match_type === "quick_spar" ? "Quick Spar" : "Extended"} • {match.duration_minutes} min
              </p>
            </div>

            {!isCompleted && !isJudging && (
              <div className="flex items-center gap-2 bg-surface-1 border border-border px-3 py-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-sm text-foreground">{timeLeft}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* VS Display */}
        <div className="bg-surface-1 border border-border p-4">
          <div className="flex items-center justify-between">
            {/* Me */}
            <div className="text-center flex-1">
              <div className={`
                w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2
                ${mySubmission 
                  ? "bg-emerald-500/20 border-2 border-emerald-500/50" 
                  : "bg-surface-2 border-2 border-border"
                }
              `}>
                {me?.avatar_url ? (
                  <img src={me.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs font-medium text-foreground">{me?.username || "You"}</p>
              <p className="text-[10px] text-muted-foreground">Lv. {me?.level || 1}</p>
              {mySubmission && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">Submitted</span>
                </div>
              )}
              {isCompleted && (
                <div className={`mt-2 text-lg font-display ${
                  didIWin ? "text-gold" : "text-muted-foreground"
                }`}>
                  {isPlayer1 ? match.player_1_score : match.player_2_score}
                </div>
              )}
            </div>

            {/* VS */}
            <div className="px-4">
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">VS</span>
              </div>
            </div>

            {/* Opponent */}
            <div className="text-center flex-1">
              <div className={`
                w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2
                ${opponentSubmission 
                  ? "bg-emerald-500/20 border-2 border-emerald-500/50" 
                  : "bg-surface-2 border-2 border-border"
                }
              `}>
                {opponent?.avatar_url ? (
                  <img src={opponent.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs font-medium text-foreground">{opponent?.username || "Opponent"}</p>
              <p className="text-[10px] text-muted-foreground">Lv. {opponent?.level || 1}</p>
              {opponentSubmission && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">Submitted</span>
                </div>
              )}
              {isCompleted && (
                <div className={`mt-2 text-lg font-display ${
                  !didIWin && match.winner_id ? "text-gold" : "text-muted-foreground"
                }`}>
                  {isPlayer1 ? match.player_2_score : match.player_1_score}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 text-center ${
              didIWin 
                ? "bg-gradient-to-b from-gold/20 to-gold/5 border border-gold/30" 
                : "bg-surface-1 border border-border"
            }`}
          >
            <Trophy className={`w-10 h-10 mx-auto mb-3 ${didIWin ? "text-gold" : "text-muted-foreground"}`} />
            <h3 className="font-display text-xl text-foreground mb-1">
              {didIWin ? "Victory!" : match.winner_id ? "Defeat" : "Tie Game"}
            </h3>
            <div className="flex items-center justify-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">
                +{didIWin ? match.winner_xp_awarded : match.loser_xp_awarded} XP
              </span>
            </div>
            {match.judge_notes && (
              <p className="mt-3 text-xs text-muted-foreground italic">
                "{match.judge_notes}"
              </p>
            )}
          </motion.div>
        )}

        {isJudging && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 text-center">
            <Scale className="w-6 h-6 mx-auto mb-2 text-amber-400" />
            <h3 className="text-sm font-medium text-foreground mb-1">Awaiting Judge</h3>
            <p className="text-[10px] text-muted-foreground">
              A judge will review both submissions and pick a winner
            </p>
          </div>
        )}

        {/* Submission Form */}
        {!mySubmission && !isCompleted && !isJudging && (
          <div className="bg-surface-1 border border-border p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Submit Your Edit</h3>
            
            {/* Platform Selection */}
            <div className="flex gap-2 mb-3">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`
                    flex-1 py-2 px-3 text-xs font-medium transition-all
                    ${platform === p.id
                      ? `bg-surface-2 border border-emerald-500/50 ${p.color}`
                      : "bg-surface-2 border border-border text-muted-foreground hover:border-border/80"
                    }
                  `}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Paste your edit URL..."
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                className="flex-1 bg-surface-2 border-border"
              />
              <Button
                onClick={handleSubmit}
                disabled={!submissionUrl || !platform || loading}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground mt-2">
              Submit before time runs out. If opponent doesn't submit, match is voided and you get compensation XP.
            </p>
          </div>
        )}

        {/* Already Submitted */}
        {mySubmission && !isCompleted && !isJudging && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
            <h3 className="text-sm font-medium text-foreground mb-1">Submission Received</h3>
            <p className="text-[10px] text-muted-foreground">
              {opponentSubmission 
                ? "Both submitted! Waiting for judge..." 
                : "Waiting for opponent to submit..."}
            </p>
          </div>
        )}

        {/* Match Info */}
        <div className="bg-surface-1/50 border border-border p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Match Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="text-muted-foreground">Started:</div>
            <div className="text-foreground">
              {match.starts_at 
                ? formatDistanceToNow(new Date(match.starts_at), { addSuffix: true })
                : "—"}
            </div>
            <div className="text-muted-foreground">Ends:</div>
            <div className="text-foreground">
              {match.ends_at 
                ? formatDistanceToNow(new Date(match.ends_at), { addSuffix: true })
                : "—"}
            </div>
            <div className="text-muted-foreground">Status:</div>
            <div className="text-foreground capitalize">{match.status.replace("_", " ")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
