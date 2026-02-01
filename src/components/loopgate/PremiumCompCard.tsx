import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Crown, Users, Clock, Trophy, ChevronRight, Star, Sparkles
} from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import { HostedCompetition } from "@/hooks/useHostedCompetitions";

interface PremiumStep {
  title: string;
  description: string;
}

interface PremiumCompCardProps {
  comp: HostedCompetition;
  onClick: () => void;
}

export default function PremiumCompCard({ comp, onClick }: PremiumCompCardProps) {
  const deadlinePassed = isPast(new Date(comp.submission_deadline));
  const isLive = comp.status === 'live' && !deadlinePassed;
  const isJudging = comp.status === 'judging' || (comp.status === 'live' && deadlinePassed);
  
  // Parse premium steps
  const premiumSteps: PremiumStep[] = comp.premium_steps || [];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="shrink-0 w-[280px] bg-gradient-to-br from-purple-900/40 via-surface-1 to-surface-1 border-2 border-purple-500/40 hover:border-purple-500/70 transition-all text-left overflow-hidden group relative"
    >
      {/* Premium Crown Badge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
      
      {/* Premium indicator */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 rounded-full shadow-lg shadow-purple-500/30 z-10">
        <Crown className="w-3 h-3 text-white" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-white">Premium</span>
      </div>
      
      {/* Poster or gradient header */}
      <div className="h-28 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent relative">
        {(comp.poster_urls && comp.poster_urls.length > 0) ? (
          <img src={comp.poster_urls[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : comp.poster_url ? (
          <img src={comp.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/70 to-transparent" />
        
        {/* Status badge */}
        <div className="absolute top-3 right-3 z-10">
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 text-background text-[9px] font-bold uppercase tracking-wider rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
              Live
            </span>
          )}
          {isJudging && (
            <span className="px-2 py-0.5 bg-amber-500/90 text-background text-[9px] font-bold uppercase tracking-wider rounded-full animate-pulse">
              Judging
            </span>
          )}
        </div>
      </div>

      <div className="p-4 -mt-6 relative">
        {/* Host */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-500/50 flex items-center justify-center overflow-hidden shadow-lg shadow-purple-500/20">
            {comp.host_avatar_url ? (
              <img src={comp.host_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Crown className="w-4 h-4 text-white" />
            )}
          </div>
          <span className="text-[10px] text-purple-300 font-medium">{comp.host_name}</span>
        </div>

        {/* Title */}
        <h3 className="font-display text-base text-foreground line-clamp-1 mb-2">{comp.name}</h3>

        {/* Step Preview - show first 2 steps */}
        {premiumSteps.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {premiumSteps.slice(0, 2).map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-purple-400">{i + 1}</span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{step.title}</span>
              </div>
            ))}
            {premiumSteps.length > 2 && (
              <div className="flex items-center gap-2 pl-7">
                <span className="text-[9px] text-purple-400">+{premiumSteps.length - 2} more steps</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-purple-400" />
            <span>{comp.participant_count || comp.submission_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {deadlinePassed ? (
              <span className="text-amber-400">Closed</span>
            ) : (
              <span>{formatDistanceToNow(new Date(comp.submission_deadline), { addSuffix: true })}</span>
            )}
          </div>
          {comp.prize_description && (
            <div className="flex items-center gap-1 text-gold">
              <Trophy className="w-3 h-3" />
              <span className="truncate max-w-[60px]">{comp.prize_description}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Easy Entry Guide
          </span>
          <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
}
