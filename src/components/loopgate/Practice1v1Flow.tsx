import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Clock, Zap, Timer, Users, 
  Loader2, X, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePracticeMatch, MatchType } from "@/hooks/usePracticeMatch";

interface Practice1v1FlowProps {
  onBack: () => void;
  onMatchFound: (matchId: string) => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: "30 min", type: "quick_spar" as MatchType, description: "Quick spar" },
  { value: 60, label: "1 hour", type: "quick_spar" as MatchType, description: "Standard spar" },
  { value: 90, label: "90 min", type: "quick_spar" as MatchType, description: "Extended spar" },
  { value: 180, label: "3 hours", type: "extended" as MatchType, description: "Deep work" },
  { value: 720, label: "12 hours", type: "extended" as MatchType, description: "Half day" },
  { value: 1440, label: "24 hours", type: "extended" as MatchType, description: "Full day" },
];

export default function Practice1v1Flow({ onBack, onMatchFound }: Practice1v1FlowProps) {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const { loading, inQueue, queueEntry, activeMatch, joinQueue, leaveQueue } = usePracticeMatch();

  const handleJoinQueue = async () => {
    if (!selectedDuration) return;
    
    const option = DURATION_OPTIONS.find(o => o.value === selectedDuration);
    if (!option) return;

    const matchId = await joinQueue(option.type, selectedDuration);
    if (matchId) {
      onMatchFound(matchId);
    }
  };

  // If we have an active match, redirect
  if (activeMatch) {
    onMatchFound(activeMatch.id);
    return null;
  }

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

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="font-display text-xl text-foreground tracking-wide">1v1 PRACTICE</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Skill-based matchmaking
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <AnimatePresence mode="wait">
          {inQueue ? (
            /* In Queue State */
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-surface-1 border border-emerald-500/30 p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                </div>
                
                <h3 className="font-display text-lg text-foreground mb-1">
                  Finding Opponent...
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Matching you with a similar skill level
                </p>

                {queueEntry && (
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-1.5">
                      <Timer className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-foreground font-medium">
                        {DURATION_OPTIONS.find(o => o.value === queueEntry.duration_minutes)?.label || queueEntry.duration_minutes + " min"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[10px] text-foreground font-medium capitalize">
                        {queueEntry.skill_tier} Tier
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={leaveQueue}
                  disabled={loading}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Leave Queue
                </Button>

                <p className="text-[10px] text-muted-foreground mt-4">
                  Queue expires in 15 minutes if no match found
                </p>
              </div>
            </motion.div>
          ) : (
            /* Duration Selection State */
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Info Card */}
              <div className="bg-surface-1 border border-border p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">How it works</h4>
                    <ul className="text-[11px] text-muted-foreground space-y-1">
                      <li>• Choose your match duration</li>
                      <li>• Get matched with similar skill tier</li>
                      <li>• Both players submit within the time limit</li>
                      <li>• Judge picks a winner, XP awarded!</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Duration Grid */}
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                  Select Duration
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedDuration(option.value)}
                      className={`
                        relative p-4 border transition-all text-left
                        ${selectedDuration === option.value
                          ? "bg-emerald-500/10 border-emerald-500/50"
                          : "bg-surface-1 border-border hover:border-emerald-500/30"
                        }
                      `}
                    >
                      {selectedDuration === option.value && (
                        <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-emerald-400" />
                      )}
                      <div className="font-display text-lg text-foreground">
                        {option.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {option.description}
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 ${
                          option.type === "quick_spar" 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {option.type === "quick_spar" ? "QUICK SPAR" : "EXTENDED"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Join Button */}
              <Button
                onClick={handleJoinQueue}
                disabled={!selectedDuration || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Users className="w-4 h-4 mr-2" />
                )}
                Find Opponent
              </Button>

              {/* XP Info */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">
                    Win: <span className="text-emerald-400 font-medium">+50 XP</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    Participate: <span className="text-foreground font-medium">+20 XP</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
