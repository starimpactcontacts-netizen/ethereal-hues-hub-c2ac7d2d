import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Loader2, Check, Swords, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type MatchState = "idle" | "searching" | "matched" | "ready";

interface PracticeMatchmakingProps {
  format: string;
  onCancel: () => void;
  onStart: () => void;
}

export default function PracticeMatchmaking({ format, onCancel, onStart }: PracticeMatchmakingProps) {
  const [matchState, setMatchState] = useState<MatchState>("idle");
  const [opponent, setOpponent] = useState<{ username: string; level: number } | null>(null);

  useEffect(() => {
    // Simulate matchmaking flow
    const timer1 = setTimeout(() => setMatchState("searching"), 500);
    const timer2 = setTimeout(() => {
      setOpponent({ username: "ShadowCut", level: 12 });
      setMatchState("matched");
    }, 3000);
    const timer3 = setTimeout(() => setMatchState("ready"), 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4 bg-surface-1 border border-border p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-lg text-foreground">{format}</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Practice Mode
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Matchmaking Visual */}
        <div className="flex items-center justify-center gap-6 py-8">
          {/* You */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-2">
              <User className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-xs font-medium text-foreground">You</p>
            <p className="text-[10px] text-muted-foreground">Ready</p>
          </div>

          {/* VS Indicator */}
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence mode="wait">
              {matchState === "searching" && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                </motion.div>
              )}
              {(matchState === "matched" || matchState === "ready") && (
                <motion.div
                  key="matched"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Swords className="w-6 h-6 text-gold" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">VS</span>
          </div>

          {/* Opponent */}
          <div className="text-center">
            <AnimatePresence mode="wait">
              {matchState === "searching" && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mx-auto mb-2"
                >
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                </motion.div>
              )}
              {(matchState === "matched" || matchState === "ready") && opponent && (
                <motion.div
                  key="matched"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mx-auto mb-2"
                >
                  <User className="w-7 h-7 text-amber-400" />
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-xs font-medium text-foreground">
              {opponent ? opponent.username : "..."}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {opponent ? `Lv. ${opponent.level}` : "Finding..."}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <AnimatePresence mode="wait">
            {matchState === "searching" && (
              <motion.p
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Finding opponent...
              </motion.p>
            )}
            {matchState === "matched" && (
              <motion.p
                key="matched"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-emerald-400"
              >
                <Check className="w-4 h-4 inline mr-1" />
                Matched with similar skill
              </motion.p>
            )}
            {matchState === "ready" && (
              <motion.p
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-gold font-medium"
              >
                Ready to begin!
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={onStart}
            disabled={matchState !== "ready"}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
          >
            {matchState === "ready" ? "Start Practice" : "Waiting..."}
          </Button>
        </div>

        {/* XP Info */}
        <p className="text-center text-[10px] text-muted-foreground mt-4">
          XP Only · No Index Impact
        </p>
      </motion.div>
    </div>
  );
}
