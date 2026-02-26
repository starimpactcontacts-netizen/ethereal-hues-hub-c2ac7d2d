import { motion } from "framer-motion";
import { Swords, Clock, Eye, Trophy, Flame, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Battle } from "@/hooks/useBattles";

interface BattleCardProps {
  battle: Battle;
  onClick: () => void;
}

const statusConfig: Record<string, { label: string; color: string; dot?: boolean }> = {
  pending: { label: "OPEN", color: "text-amber-400" },
  accepted: { label: "STARTING", color: "text-sky-400" },
  active: { label: "LIVE", color: "text-red-400", dot: true },
  judging: { label: "JUDGING", color: "text-purple-400" },
  completed: { label: "DECIDED", color: "text-gold" },
  forfeited: { label: "FORFEIT", color: "text-muted-foreground" },
  cancelled: { label: "CANCELLED", color: "text-muted-foreground" },
};

function formatTimeLeft(endDate: string | null): string {
  if (!endDate) return "TBD";
  
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return "Ended";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function BattleCard({ battle, onClick }: BattleCardProps) {
  const status = statusConfig[battle.status] || statusConfig.pending;
  const isOpen = battle.status === 'pending' && !battle.opponent_id;
  const isLive = battle.status === 'active';
  const isCompleted = battle.status === 'completed';
  const totalVotes = battle.challenger_votes + battle.opponent_votes;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-[240px] shrink-0 bg-surface-1 border border-red-500/30 hover:border-red-500/60 transition-all cursor-pointer group overflow-hidden"
    >
      {/* Header - UFC Style VS Display */}
      <div className="relative h-20 bg-gradient-to-br from-red-500/20 via-surface-2 to-surface-1 overflow-hidden">
        {/* Background pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 40%, hsl(var(--red-500)) 40%, hsl(var(--red-500)) 60%, transparent 60%),
              linear-gradient(-45deg, transparent 40%, hsl(var(--red-500)) 40%, hsl(var(--red-500)) 60%, transparent 60%)
            `,
            backgroundSize: '10px 10px'
          }}
        />
        
        {/* VS Display */}
        <div className="absolute inset-0 flex items-center justify-center px-3">
          {/* Challenger */}
          <div className="flex-1 flex flex-col items-center">
            <Avatar className="w-10 h-10 border-2 border-red-500/50 shadow-lg shadow-red-500/20">
              <AvatarImage src={battle.challenger_avatar_url || ''} />
              <AvatarFallback className="bg-red-500/20 text-red-400 text-xs font-bold">
                {battle.challenger_username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-foreground font-medium mt-1 truncate max-w-[60px]">
              {battle.challenger_username}
            </span>
          </div>
          
          {/* VS Badge */}
          <div className="relative mx-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40">
              <Swords className="w-4 h-4 text-white" />
            </div>
            {isLive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          
          {/* Opponent */}
          <div className="flex-1 flex flex-col items-center">
            {battle.opponent_id ? (
              <>
                <Avatar className="w-10 h-10 border-2 border-red-500/50 shadow-lg shadow-red-500/20">
                  <AvatarImage src={battle.opponent_avatar_url || ''} />
                  <AvatarFallback className="bg-red-500/20 text-red-400 text-xs font-bold">
                    {battle.opponent_username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-foreground font-medium mt-1 truncate max-w-[60px]">
                  {battle.opponent_username}
                </span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-red-500/30 flex items-center justify-center bg-surface-2">
                  <span className="text-lg text-red-400/50">?</span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">
                  Open
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Status — seamless */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {status.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
          <span className={`text-[11px] font-bold ${status.color} drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]`}>
            {status.label}
          </span>
        </div>
        
        {/* View count */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <Eye className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[11px] text-foreground/70 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{formatViews(battle.view_count)}</span>
        </div>
        
        {/* IDX reward */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <Trophy className="w-3 h-3 text-gold" />
          <span className="text-[11px] font-bold text-gold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">+20 IDX</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3">
        {/* Prize info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-gold" />
            <span className="text-[11px] font-bold text-gold">+{battle.winner_index_awarded} IDX</span>
          </div>
          <span className="text-[11px] text-muted-foreground uppercase">{battle.league_tier}</span>
        </div>
        
        {/* Duration */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
            <Clock className="w-3 h-3" />
            <span>{battle.duration_hours}h battle</span>
          </div>
        
        {/* Timer (if active) */}
        {isLive && battle.ends_at && (
          <div className="flex items-center gap-1 text-[11px] text-red-400 mb-2">
            <Flame className="w-3 h-3" />
            <span>{formatTimeLeft(battle.ends_at)} left</span>
          </div>
        )}
        
        {/* Vote bar (if judging or completed) */}
        {(battle.status === 'judging' || isCompleted) && totalVotes > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">{battle.challenger_votes} votes</span>
              <span className="text-muted-foreground">{battle.opponent_votes} votes</span>
            </div>
            <div className="h-1.5 bg-surface-2 overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all"
                style={{ width: `${(battle.challenger_votes / totalVotes) * 100}%` }}
              />
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all"
                style={{ width: `${(battle.opponent_votes / totalVotes) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {/* CTA */}
        <button className="w-full py-2 bg-gradient-to-r from-red-500 via-red-400 to-red-500 text-white font-display text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 group-hover:shadow-lg group-hover:shadow-red-500/20 transition-shadow">
          <Swords className="w-3.5 h-3.5" />
          {isOpen ? "Accept" : isLive ? "Watch" : isCompleted ? "Results" : "View"}
        </button>
      </div>
    </motion.div>
  );
}
