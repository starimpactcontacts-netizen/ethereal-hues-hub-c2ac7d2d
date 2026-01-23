import { motion } from "framer-motion";
import { Sparkles, ChevronRight, Flame, Shield } from "lucide-react";

interface PracticeModeCardProps {
  onEnter: () => void;
}

export default function PracticeModeCard({ onEnter }: PracticeModeCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onEnter}
      className="w-full text-left bg-gradient-to-br from-emerald-950/40 via-surface-1 to-surface-1 border border-emerald-500/30 hover:border-emerald-500/60 transition-all p-5 group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left content */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Sparkles className="w-6 h-6 text-background" />
          </div>
          
          {/* Text */}
          <div>
            <h3 className="font-display text-lg text-foreground mb-1">Enter Practice</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Train, spar, and earn XP. No Index risk.
            </p>
            
            {/* Tags */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5">
                <Flame className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] text-emerald-400 font-medium uppercase tracking-wider">XP Only</span>
              </div>
              <div className="flex items-center gap-1 bg-surface-2 border border-border px-2 py-0.5">
                <Shield className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">No Index Impact</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors shrink-0">
          <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Bottom highlight */}
      <div className="mt-4 pt-3 border-t border-emerald-500/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            1v1 · Crew Scrims · Judge Drills · Daily Quests
          </span>
          <span className="text-[10px] text-emerald-400">
            Always Open →
          </span>
        </div>
      </div>
    </motion.button>
  );
}
