import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Scale, Clock, User, Loader2, 
  CheckCircle2, Zap, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePracticeJudging, PracticeMatch } from "@/hooks/usePracticeMatch";
import { formatDistanceToNow } from "date-fns";

interface PracticeJudgeQueueProps {
  onBack: () => void;
}

export default function PracticeJudgeQueue({ onBack }: PracticeJudgeQueueProps) {
  const { 
    loading, 
    pendingMatches, 
    myJudgingMatches, 
    claimMatch, 
    submitJudgment 
  } = usePracticeJudging();
  
  const [selectedMatch, setSelectedMatch] = useState<PracticeMatch | null>(null);
  const [player1Score, setPlayer1Score] = useState(50);
  const [player2Score, setPlayer2Score] = useState(50);
  const [notes, setNotes] = useState("");

  const handleClaim = async (matchId: string) => {
    const success = await claimMatch(matchId);
    if (success) {
      const match = pendingMatches.find(m => m.id === matchId);
      if (match) setSelectedMatch(match);
    }
  };

  const handleSubmitJudgment = async () => {
    if (!selectedMatch) return;
    const success = await submitJudgment(
      selectedMatch.id, 
      player1Score, 
      player2Score, 
      notes || undefined
    );
    if (success) {
      setSelectedMatch(null);
      setPlayer1Score(50);
      setPlayer2Score(50);
      setNotes("");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="relative px-4 pt-5 pb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Scale className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="font-display text-xl text-foreground tracking-wide">JUDGE QUEUE</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Practice 1v1s awaiting judgment
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5">
              <span className="text-sm font-display text-amber-400">{pendingMatches.length}</span>
              <span className="text-[10px] text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-1 border border-border px-3 py-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-muted-foreground">+30 XP per judgment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <AnimatePresence mode="wait">
          {selectedMatch ? (
            /* Judging Interface */
            <motion.div
              key="judging"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-surface-1 border border-amber-500/30 p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Judge This Match</h3>

                {/* Player 1 Submission */}
                <div className="bg-surface-2 border border-border p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-1 flex items-center justify-center">
                        {selectedMatch.player_1?.avatar_url ? (
                          <img src={selectedMatch.player_1.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {selectedMatch.player_1?.username || "Player 1"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Lv. {selectedMatch.player_1?.level || 1}
                        </p>
                      </div>
                    </div>
                    <a
                      href={selectedMatch.player_1_submission_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                    >
                      View Edit <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12">Score:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={player1Score}
                      onChange={(e) => setPlayer1Score(parseInt(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="text-sm font-display text-foreground w-8">{player1Score}</span>
                  </div>
                </div>

                {/* Player 2 Submission */}
                <div className="bg-surface-2 border border-border p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-1 flex items-center justify-center">
                        {selectedMatch.player_2?.avatar_url ? (
                          <img src={selectedMatch.player_2.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {selectedMatch.player_2?.username || "Player 2"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Lv. {selectedMatch.player_2?.level || 1}
                        </p>
                      </div>
                    </div>
                    <a
                      href={selectedMatch.player_2_submission_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                    >
                      View Edit <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12">Score:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={player2Score}
                      onChange={(e) => setPlayer2Score(parseInt(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="text-sm font-display text-foreground w-8">{player2Score}</span>
                  </div>
                </div>

                {/* Notes */}
                <Textarea
                  placeholder="Optional: Add a note for the players..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-surface-2 border-border mb-4 text-sm"
                  rows={2}
                />

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMatch(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitJudgment}
                    disabled={loading}
                    className="flex-1 bg-amber-600 hover:bg-amber-500"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Submit Judgment
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Queue List */
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {pendingMatches.length === 0 ? (
                <div className="bg-surface-1 border border-border p-8 text-center">
                  <Scale className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="text-sm font-medium text-foreground mb-1">No Matches Pending</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Check back soon — matches appear here when both players submit.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingMatches.map((match) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-surface-1 border border-border p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-surface-2 border-2 border-background flex items-center justify-center">
                              {match.player_1?.avatar_url ? (
                                <img src={match.player_1.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-surface-2 border-2 border-background flex items-center justify-center">
                              {match.player_2?.avatar_url ? (
                                <img src={match.player_2.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {match.player_1?.username || "?"} vs {match.player_2?.username || "?"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {match.match_type === "quick_spar" ? "Quick Spar" : "Extended"} • {match.duration_minutes}min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px]">
                            {match.updated_at 
                              ? formatDistanceToNow(new Date(match.updated_at), { addSuffix: true })
                              : "Just now"}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleClaim(match.id)}
                        disabled={loading}
                        className="w-full bg-amber-600 hover:bg-amber-500"
                        size="sm"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Scale className="w-4 h-4 mr-2" />
                        )}
                        Claim & Judge
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* My Judging History */}
              {myJudgingMatches.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Your Recent Judgments
                  </h3>
                  <div className="space-y-2">
                    {myJudgingMatches.slice(0, 5).map((match) => (
                      <div
                        key={match.id}
                        className="bg-surface-1/50 border border-border p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-foreground">
                            {match.player_1?.username} vs {match.player_2?.username}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {match.player_1_score} - {match.player_2_score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
