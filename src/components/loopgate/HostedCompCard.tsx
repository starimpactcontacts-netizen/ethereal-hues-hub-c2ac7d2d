import { motion } from "framer-motion";
import { 
  Globe, Calendar, Users, ChevronRight, 
  Clock, Crown, Sparkles 
} from "lucide-react";

interface HostedCompCardProps {
  onEnter: () => void;
}

export default function HostedCompCard({ onEnter }: HostedCompCardProps) {
  return (
    <motion.button
      onClick={onEnter}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full bg-gradient-to-br from-surface-1 to-surface-2 border border-cyan-500/30 hover:border-cyan-500/50 transition-all text-left overflow-hidden group"
    >
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-500" />
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 via-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Globe className="w-5 h-5 text-background" />
            </div>
            <div>
              <h3 className="font-display text-sm text-foreground tracking-wide">HOSTED COMPS</h3>
              <p className="text-[10px] text-cyan-400 uppercase tracking-wider">
                External Tournaments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-bold text-cyan-400">New</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
          Discord servers & creators can run their competitions using Loopgate infrastructure. 
          Submissions, judging, visibility, rankings — all in one place.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-surface-1 border border-border p-2 text-center">
            <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[11px] text-muted-foreground">Any Host</span>
          </div>
          <div className="bg-surface-1 border border-border p-2 text-center">
            <Crown className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[11px] text-muted-foreground">Host Judges</span>
          </div>
          <div className="bg-surface-1 border border-border p-2 text-center">
            <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[11px] text-muted-foreground">Flexible</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] text-foreground font-medium">
              Browse or Host a Competition
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
}
