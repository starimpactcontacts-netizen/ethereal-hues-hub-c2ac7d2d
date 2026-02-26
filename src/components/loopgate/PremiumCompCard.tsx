import { motion } from "framer-motion";
import { 
  Crown, Users, Clock, Trophy, ChevronRight, Sparkles
} from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import { HostedCompetition } from "@/hooks/useHostedCompetitions";

interface PremiumCompCardProps {
  comp: HostedCompetition;
  onClick: () => void;
}

export default function PremiumCompCard({ comp, onClick }: PremiumCompCardProps) {
  const deadlinePassed = isPast(new Date(comp.submission_deadline));
  const isLive = comp.status === 'live' && !deadlinePassed;
  const isJudging = comp.status === 'judging' || (comp.status === 'live' && deadlinePassed);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="shrink-0 w-[240px] bg-surface-1 border border-purple-500/30 hover:border-purple-500/60 transition-all text-left overflow-hidden group relative"
    >
      {/* Top accent */}
      <div className="h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

      {/* Premium indicator — seamless */}
      <div className="absolute top-2.5 left-2 flex items-center gap-1 z-10">
        <Crown className="w-3 h-3 text-purple-400" />
        <span className="text-[11px] font-bold text-purple-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">Premium</span>
      </div>

      {/* Poster or gradient header — same h-20 as FeaturedHostedCompCard */}
      <div className="h-20 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent relative">
        {(comp.poster_urls && comp.poster_urls.length > 0) ? (
          <img src={comp.poster_urls[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        ) : comp.poster_url ? (
          <img src={comp.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {isLive && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">LIVE</span>
            </>
          )}
          {isJudging && (
            <span className="text-[11px] font-bold text-amber-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">JUDGING</span>
          )}
        </div>
      </div>

      <div className="p-3 -mt-6 relative">
        {/* Host */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/40 flex items-center justify-center overflow-hidden">
            {comp.host_avatar_url ? (
              <img src={comp.host_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Crown className="w-2.5 h-2.5 text-purple-400" />
            )}
          </div>
          <span className="text-[11px] text-purple-300 truncate">{comp.host_name}</span>
        </div>

        {/* Title */}
        <h3 className="font-display text-xs text-foreground line-clamp-1 mb-2">{comp.name}</h3>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-0.5">
            <Users className="w-2.5 h-2.5 text-purple-400" />
            <span>{comp.participant_count || comp.submission_count || 0}</span>
          </div>
          {comp.prize_description && (
            <div className="flex items-center gap-0.5 text-gold">
              <Trophy className="w-2.5 h-2.5" />
              <span className="truncate max-w-[60px]">{comp.prize_description}</span>
            </div>
          )}
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
          <Clock className="w-2.5 h-2.5" />
          {deadlinePassed ? (
            <span className="text-amber-400">Submissions closed</span>
          ) : (
            <span>{formatDistanceToNow(new Date(comp.submission_deadline), { addSuffix: true })}</span>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1 text-[11px] text-purple-400 font-semibold mt-2">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Easy Entry Guide</span>
        </div>

        {/* Arrow */}
        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.button>
  );
}
